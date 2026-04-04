import { supabase } from './supabase.js';

// PROMPTS は prompts.js からグローバル変数として読み込み済み

// ============================================================
// 認証・ログイン処理
// ============================================================
const googleLoginBtn = document.getElementById('google-login-btn');
const logoutBtn      = document.getElementById('logout-btn');
const loginBox       = document.getElementById('login-box');
const userBox        = document.getElementById('user-box');
const userNameEl     = document.getElementById('user-name');
const usageCountEl   = document.getElementById('usage-count');
const mainContent    = document.getElementById('main-content');

const DAILY_LIMIT = 100;

let currentStreak = 0;
const UNLOCK_PERSONAL_ANALYSIS = 7;
const UNLOCK_BODY_DIAGNOSIS = 30;
let unlockedFeatures = new Set();

// ============================================================
// ユーザースコープ付きlocalStorage
// ============================================================
let currentUserId = null;

function userKey(key) {
  return currentUserId ? `${currentUserId}_${key}` : key;
}

// ============================================================
// ユーザーコンテキストシステム
// ============================================================
let cachedUserContext = null;
let _goalPeriodType = null; // 目標期間選択: 'short' | 'standard' | 'long'

async function buildUserContext() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return '';
  const userId = session.user.id;

  // 体組成データ（最新）
  const { data: bodyRecords } = await supabase
    .from('body_records')
    .select('weight, body_fat, recorded_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  // 目標
  const goal = await loadGoal(userId);

  // 今週のアクティビティ
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  const mondayStr = monday.toISOString().split('T')[0];
  const { data: recentChats } = await supabase
    .from('chat_history')
    .select('goal, method, sub, created_at')
    .eq('user_id', userId)
    .gte('created_at', `${mondayStr}T00:00:00`)
    .order('created_at', { ascending: false });

  // デイリーチェックイン
  const todayStr = now.toISOString().split('T')[0];
  const checkin = JSON.parse(localStorage.getItem(userKey(`checkin_${todayStr}`)) || 'null');

  // コンテキスト組み立て
  let ctx = '【ユーザープロフィール】\n';

  if (bodyRecords && bodyRecords.length > 0) {
    const latestWeight = bodyRecords.find(r => r.weight != null);
    const latestBF = bodyRecords.find(r => r.body_fat != null);
    const latestWeightVal = latestWeight ? latestWeight.weight : null;
    const latestBFVal = latestBF ? latestBF.body_fat : null;
    ctx += `現在の体重: ${latestWeightVal ? latestWeightVal + 'kg' : '未記録'}`;
    ctx += ` / 体脂肪率: ${latestBFVal ? latestBFVal + '%' : '未記録'}`;
    const latest = bodyRecords[0];
    ctx += ` (${latest.recorded_at || '日付不明'})\n`;
    if (bodyRecords.length > 1) {
      const prev = bodyRecords[1];
      if (latest.weight && prev.weight) {
        const diff = (latest.weight - prev.weight).toFixed(1);
        ctx += `前回比: 体重${diff > 0 ? '+' : ''}${diff}kg`;
        if (latest.body_fat && prev.body_fat) {
          const bfDiff = (latest.body_fat - prev.body_fat).toFixed(1);
          ctx += ` / 体脂肪率${bfDiff > 0 ? '+' : ''}${bfDiff}%`;
        }
        ctx += '\n';
      }
    }
  } else {
    ctx += '体組成データ: 未記録\n';
  }

  if (goal) {
    if (goal.goal_weight) ctx += `目標体重: ${goal.goal_weight}kg`;
    if (goal.goal_body_fat) ctx += ` / 目標体脂肪率: ${goal.goal_body_fat}%`;
    if (goal.target_date) {
      const target = new Date(goal.target_date);
      const daysLeft = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
      const _pt = localStorage.getItem(userKey('goal_period_type'));
      const _ptLabel = { short: '短期（4週間）', standard: '中期（12週間）', long: '長期（24週間）' };
      if (_pt && _ptLabel[_pt]) {
        ctx += ` / 期間: ${_ptLabel[_pt]}（残り${daysLeft}日）`;
      } else {
        ctx += ` / 期限: ${goal.target_date}（残り${daysLeft}日）`;
      }
    }
    ctx += '\n';
    // 目標との差分
    if (bodyRecords && bodyRecords.length > 0) {
      const latest = bodyRecords[0];
      if (goal.goal_weight && latest.weight) {
        const gap = (latest.weight - goal.goal_weight).toFixed(1);
        ctx += `目標までの差: 体重${gap > 0 ? '+' : ''}${gap}kg`;
      }
      if (goal.goal_body_fat && latest.body_fat) {
        const bfGap = parseFloat((latest.body_fat - goal.goal_body_fat).toFixed(1));
        if (bfGap > 0) {
          ctx += ` / 体脂肪率: 現在${latest.body_fat}% 目標${goal.goal_body_fat}%（あと${bfGap}%減少が必要）`;
        } else if (bfGap < 0) {
          ctx += ` / 体脂肪率: 現在${latest.body_fat}% 目標${goal.goal_body_fat}%（目標達成済み）`;
        } else {
          ctx += ` / 体脂肪率: 現在${latest.body_fat}% 目標${goal.goal_body_fat}%（目標達成済み）`;
        }
      }
      ctx += '\n';
    }
  }

  ctx += `継続日数: ${currentStreak}日\n`;

  if (recentChats && recentChats.length > 0) {
    const methodCount = { nutrition: 0, training: 0, recovery: 0 };
    recentChats.forEach(c => { if (methodCount[c.method] !== undefined) methodCount[c.method]++; });
    ctx += `今週の取り組み: 栄養${methodCount.nutrition}回 / トレーニング${methodCount.training}回 / 回復${methodCount.recovery}回\n`;
  }

  if (checkin) {
    ctx += `\n【今日のコンディション】\n`;
    if (checkin.focus) ctx += `今の目的: ${checkin.focus}\n`;
    if (checkin.priority) ctx += `今日の重点: ${checkin.priority}\n`;
    if (checkin.condition) ctx += `体調: ${checkin.condition}\n`;
    if (checkin.sleep) ctx += `睡眠: ${checkin.sleep}\n`;
    if (checkin.note) ctx += `メモ: ${checkin.note}\n`;
  }

  ctx += '\n上記のユーザー情報を全て考慮し、この人の現在の状況・目的・体調・過去のフィードバックに最適化した具体的な提案をしてください。体重・体脂肪率・目標・期限がある場合は、そこから逆算した提案をすること。\n';

  cachedUserContext = ctx;
  return ctx;
}

// ============================================================
// デイリーチェックイン
// ============================================================
function getTodayCheckin() {
  const todayStr = new Date().toISOString().split('T')[0];
  return JSON.parse(localStorage.getItem(userKey(`checkin_${todayStr}`)) || 'null');
}

function saveTodayCheckin(data) {
  const todayStr = new Date().toISOString().split('T')[0];
  localStorage.setItem(userKey(`checkin_${todayStr}`), JSON.stringify(data));
}

// ============================================================
// 同意確認
// ============================================================
const consentModal    = document.getElementById('consent-modal');
const consentCheckbox = document.getElementById('consent-checkbox');
const consentAgreeBtn = document.getElementById('consent-agree-btn');
const notAllowedScreen = document.getElementById('not-allowed-screen');

consentCheckbox.addEventListener('change', () => {
  if (consentCheckbox.checked) {
    consentAgreeBtn.disabled = false;
    consentAgreeBtn.style.background = '#c8f135';
    consentAgreeBtn.style.color = '#000';
    consentAgreeBtn.style.cursor = 'pointer';
  } else {
    consentAgreeBtn.disabled = true;
    consentAgreeBtn.style.background = '#333';
    consentAgreeBtn.style.color = '#666';
    consentAgreeBtn.style.cursor = 'not-allowed';
  }
});

consentAgreeBtn.addEventListener('click', async () => {
  if (!consentCheckbox.checked) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  consentAgreeBtn.disabled = true;
  consentAgreeBtn.textContent = '記録中...';

  const { error } = await supabase.from('user_consents').insert({
    user_id: session.user.id,
    terms_version: '2026-02-25',
    privacy_version: '2026-02-25'
  });

  if (error) {
    console.error('同意記録エラー:', error);
    alert('同意の記録に失敗しました。もう一度お試しください。');
    consentAgreeBtn.disabled = false;
    consentAgreeBtn.textContent = '同意してはじめる';
    return;
  }

  consentModal.style.display = 'none';
  // 同意後、名前を入力させる
  const profileAfterConsent = await checkProfile(session.user.id);
  if (!profileAfterConsent || !profileAfterConsent.name) {
    showNameInputModal(session.user.id);
  } else {
    showAfterCheckin();
  }
});

async function checkConsent(userId) {
  const { data } = await supabase
    .from('user_consents')
    .select('id, consented_at')
    .eq('user_id', userId)
    .order('consented_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

// ============================================================
// プロフィール（名前）管理
// ============================================================
async function checkProfile(userId) {
  const { data } = await supabase
    .from('user_profiles')
    .select('name')
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

async function saveProfile(userId, name) {
  const { error } = await supabase
    .from('user_profiles')
    .upsert({ user_id: userId, name }, { onConflict: 'user_id' });
  return !error;
}

// ============================================================
// ★ 変更箇所：expires_at チェックを追加
// ============================================================
async function checkAllowed(email) {
  const { data } = await supabase
    .from('allowed_users')
    .select('id, created_at')
    .eq('email', email)
    .maybeSingle();
  if (!data) return false;
  const purchase = new Date(data.created_at);
  const expire = new Date(purchase);
  expire.setMonth(expire.getMonth() + 3);
  return new Date() <= expire;
}

async function checkIsAdmin(userId) {
  const { data } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

async function getUsageCount(userId) {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('usage_limits')
    .select('count')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();
  return data ? data.count : 0;
}

async function incrementUsage(userId) {
  const today = new Date().toISOString().split('T')[0];
  const count = await getUsageCount(userId);
  await supabase
    .from('usage_limits')
    .upsert(
      { user_id: userId, date: today, count: count + 1 },
      { onConflict: 'user_id,date' }
    );
  return count + 1;
}

async function incrementOnSuccess() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await incrementUsage(session.user.id);
    const count = await getUsageCount(session.user.id);
    usageCountEl.textContent = `本日の残り回数：${DAILY_LIMIT - count} / ${DAILY_LIMIT}`;
  } catch (e) {
    console.error('カウント加算エラー:', e);
  }
}

async function updateUI(session) {
  if (session) {
    currentUserId = session.user.id;
    const count = await getUsageCount(session.user.id);
    loginBox.style.display = 'none';
    userBox.style.display = 'block';
    window.__currentUserEmail__ = session.user.email;
    usageCountEl.textContent = `本日の残り回数：${DAILY_LIMIT - count} / ${DAILY_LIMIT}`;

    const isAdmin = await checkIsAdmin(session.user.id);
    const isAllowed = isAdmin || await checkAllowed(session.user.email);

    if (!isAllowed) {
      mainContent.style.display = 'none';
      consentModal.style.display = 'none';
      notAllowedScreen.style.display = 'block';
      return;
    }

    notAllowedScreen.style.display = 'none';
    // ログイン後はナビを表示
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) bottomNav.style.display = 'flex';

    const consent = await checkConsent(session.user.id);
    if (consent) {
      consentModal.style.display = 'none';
      // 名前が未登録なら名前入力モーダルを表示
      try {
        const profile = await checkProfile(session.user.id);
        if (!profile || !profile.name) {
          showNameInputModal(session.user.id);
        } else {
          userNameEl.textContent = `${profile.name}（${session.user.email}）`;
          showAfterCheckin();
        }
      } catch (e) {
        // プロフィール取得失敗時はそのままメインを表示
        console.warn('checkProfile失敗:', e);
        userNameEl.textContent = session.user.email;
        showAfterCheckin();
      }
    } else {
      mainContent.style.display = 'none';
      consentModal.style.display = 'block';
    }
  } else {
    currentUserId = null;
    loginBox.style.display = 'block';
    userBox.style.display = 'none';
    mainContent.style.display = 'none';
    consentModal.style.display = 'none';
    notAllowedScreen.style.display = 'none';
    const checkinGate = document.getElementById('checkin-gate');
    if (checkinGate) checkinGate.style.display = 'none';
    // ログイン前はナビとツールパネルを非表示
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) bottomNav.style.display = 'none';
    const toolsPanel = document.getElementById('tools-panel');
    if (toolsPanel) toolsPanel.classList.remove('open');
  }
}

supabase.auth.getSession().then(async ({ data: { session } }) => {
  await updateUI(session);
});

supabase.auth.onAuthStateChange(async (_event, session) => {
  await updateUI(session);
});

googleLoginBtn.addEventListener('click', async () => {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: 'https://fitprojectai.vercel.app' }
  });
});

logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

// ============================================================
// 選択式質問ボタン
// ============================================================
const QUESTIONS = {
  nutrition: [
    {
      label: '① 1日何食ですか？',
      options: ['2食', '3食', '4食', '5食']
    },
    {
      label: '② 今は何食目ですか？',
      dynamicOptions: (answers) => {
        const n = parseInt(answers[0]);  // '3食' → 3
        const opts = [];
        for (let i = 1; i <= n; i++) opts.push(`${i}食目`);
        return opts;
      }
    },
    {
      label: '③ 今の時間帯は？',
      options: ['朝', '昼', '夕方', '夜', '間食']
    },
    {
      label: '④ 今日の食事の場所は？',
      options: [
        '家で食べる', '外食にしたい', 'コンビニ',
        'スーパー・惣菜', 'お弁当を作る', 'デリバリー'
      ]
    },
    {
      label: '⑤ 食べ方・気分は？',
      options: [
        '特になし', '揚げ物を食べたい', 'お酒を飲みたい',
        '食べる時間があまりない', '節約したい'
      ]
    },
    {
      label: '⑤-2 何を飲みますか？（お酒を飲みたい場合のみ）',
      options: [
        'ビール（350ml）', 'ハイボール・チューハイ（350ml）',
        '日本酒（180ml・1合）', 'ワイン（200ml）',
        '焼酎（100ml）', 'ウイスキー（60ml）'
      ],
      conditionalOn: 'お酒を飲みたい'
    },
    {
      label: '⑥ プロテインは飲んでいますか？',
      options: [
        '飲んでいない',
        '飲んでいる（1日1回）',
        '飲んでいる（1日2回）',
        '飲んでいる（1日3回以上）'
      ]
    },
    {
      label: '⑦ 今の空腹感は？',
      options: [
        'かなり空腹', '少し空腹', 'そこまで空腹じゃない', 'なんとなく食べたい'
      ]
    },
    // ── 修正③追加: [8] mealVolume ──
    // 今後このフラグでPFCや候補選定に「間食・補食モード」を反映予定
    {
      label: '⑧ 今回の食事のボリュームは？',
      options: ['通常の食事', '軽めの食事', '間食・補食']
    },
    // ── 修正③追加: [9] trainingTiming ──
    // 今後このフラグでPFCや候補選定に「トレ前・トレ後モード」を反映予定
    {
      label: '⑨ トレーニングとの関係は？',
      options: ['特になし', 'トレーニング前', 'トレーニング後']
    }
  ],
  training_base: [
    { label: '① 今の体調・やる気は？', options: ['元気（ガッツリやりたい）', '普通（ほどほどに）', '少し疲れている', 'どん底'] },
    { label: '② 今日使える時間は？', options: ['5〜10分', '20〜30分', '45分', '1時間', '1時間半', '2時間以上'] },
    { label: '③ トレーニングする場所は？', options: ['家（道具なし）', 'ジム', '公園・屋外', 'オフィスなど'] },
    { label: '④ トレーニング歴は？', options: ['半年未満', '半年〜1年', '1年以上'] }
  ],
  training_with_split: [
    { label: '① 今の体調・やる気は？', options: ['元気（ガッツリやりたい）', '普通（ほどほどに）', '少し疲れている', 'どん底'] },
    { label: '② 今日使える時間は？', options: ['5〜10分', '20〜30分', '45分', '1時間', '1時間半', '2時間以上'] },
    { label: '③ トレーニングする場所は？', options: ['家（道具なし）', 'ジム', '公園・屋外', 'オフィスなど'] },
    { label: '④ トレーニング歴は？', options: ['半年未満', '半年〜1年', '1年以上'] },
    { label: '⑤ 分割法は？', options: ['お任せ（おすすめしてほしい）', '全身トレ', '上下分割', '3分割', 'PPL', '5分割'] }
  ],
  training_split: {
    'お任せ（おすすめしてほしい）': [
      { label: '週に動ける日数は？', options: ['週1〜2日', '週3〜4日', '週5日以上'] },
      { label: '一番気になる部位は？', options: ['胸・腕', '背中', '脚・お尻', '肩', '全体的に'] },
      { label: '筋トレは好き？', options: ['好き・楽しい', '普通', '苦手・続かない'] }
    ],
    '全身トレ': [
      { label: '今日のコンディションは？', options: ['絶好調', '普通', '少し疲れ気味'] }
    ],
    '上下分割': [
      { label: '今日はどちら？', options: ['上半身', '下半身'] }
    ],
    '3分割': [
      { label: '今日のパートは？', options: ['胸・肩・腕', '背中', '脚'] }
    ],
    'PPL': [
      { label: '今日はどれ？', options: ['プッシュ（押す・胸肩腕）', 'プル（引く・背中腕）', 'レッグ（脚）'] }
    ],
    '5分割': [
      { label: '今日のパートは？', options: ['胸', '背中', '肩', '腕', '脚'] }
    ]
  },
  recovery: [
    { label: '① 今から取れる時間は？', options: ['1分（その場ですぐ）', '10〜15分', '30分以上'] },
    { label: '② 今いる場所は？', options: ['家', 'オフィス・デスク', '移動中・外出先'] }
  ],
  recovery_needs_part: [
      '運動後の回復を早めたい', 'むくみ・炎症が気になる',
      '筋肉痛がひどい', '関節が少し不安', 'トレ後の回復を早めたい', 'オーバートレーニング気味',
      '疲労が蓄積している', 'パフォーマンスが落ちてきた',
      '体がだるい',
      '猫背を改善したい', '肩の位置を整えたい', '脚のむくみをとりたい', '腰回りをすっきりさせたい', '見た目に影響する体のこりをとりたい'
    ],
  recovery_part: { label: '③ ケアしたい部位は？', options: ['首・肩', '背中・腰', '脚・ふくらはぎ', '腕・肘', '全身・疲労全般'] }
};

let questionAnswers = [];
let currentQuestionIndex = 0;
let _nutritionContext = null; // 直近の栄養提案条件スナップショット


function addOtherInput(btnGroup, div, onSubmit) {
  const otherBtn = document.createElement('button');
  otherBtn.className = 'option-btn';
  otherBtn.style.borderStyle = 'dashed';
  otherBtn.textContent = 'その他（自由入力）';
  otherBtn.addEventListener('click', () => {
    btnGroup.style.display = 'none';
    const inputWrap = document.createElement('div');
    inputWrap.style.cssText = 'display:flex; gap:8px; margin-top:8px;';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '自由に入力してください';
    input.style.cssText = 'flex:1; padding:10px; border-radius:8px; border:1px solid #444; background:#1a1a1a; color:#fff; font-size:14px;';
    const submitBtn = document.createElement('button');
    submitBtn.textContent = '決定';
    submitBtn.style.cssText = 'padding:10px 16px; border-radius:8px; border:none; background:#c8f135; color:#000; font-weight:700; cursor:pointer; font-size:14px;';
    submitBtn.addEventListener('click', () => {
      const val = input.value.trim();
      if (!val) return;
      div.style.display = 'none';
      onSubmit(val);
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitBtn.click(); });
    inputWrap.appendChild(input);
    inputWrap.appendChild(submitBtn);
    div.appendChild(inputWrap);
    input.focus();
  });
  btnGroup.appendChild(otherBtn);
}

async function showQuestionStep(questions) {
  if (currentQuestionIndex >= questions.length) {
    const summary = questionAnswers
      .map((ans, i) => ans !== null ? `${questions[i].label} → ${ans}` : null)
      .filter(Boolean)
      .join('\n');
    addMessage('user', summary);

    // 体重・体脂肪率・目標体重を取得（nutrition判定・体重未入力注意文の両方で使用）
    let weightRecorded = false;
    let weight = 60;
    let currentBF = null;
    let goalWeight = null;
    if (cachedUserContext) {
      const weightMatch = cachedUserContext.match(/現在の体重: ([\d.]+)kg/);
      const bfMatch = cachedUserContext.match(/体脂肪率: ([\d.]+)%/);
      const goalWeightMatch = cachedUserContext.match(/目標体重: ([\d.]+)kg/);
      if (weightMatch) { weight = parseFloat(weightMatch[1]); weightRecorded = true; }
      if (bfMatch) currentBF = parseFloat(bfMatch[1]);
      if (goalWeightMatch) goalWeight = parseFloat(goalWeightMatch[1]);
    }

    // nutrition debugログ・API呼び出しでも参照するためスコープ外で宣言
    let totalMeals = null;
    let mealIndex = null;
    let timeOfDay = null;
    let location = null;
    let mood = null;
    let proteinSupp = null;
    let hunger = null;
    // 修正③追加: [8] mealVolume / [9] trainingTiming
    let mealVolume = null;
    let trainingTiming = null;

    // 期間補正係数（goal × period の2次元マップ）
    // goal1（減量）: short=攻める / long=緩め  goal2（筋肥大）: short=攻める / long=緩め
    const PERIOD_FACTOR_MAP = {
      '1': { short: 0.95, standard: 1.00, long: 1.02 }, // 脂肪減少: 短期ほどカロリー絞る
      '2': { short: 1.03, standard: 1.00, long: 0.98 }, // 筋肥大: 短期ほどカロリー増
      '3': { short: 1.00, standard: 1.00, long: 1.00 }, // 体力向上: 期間補正なし
      '4': { short: 1.00, standard: 1.00, long: 1.00 }, // 不調改善: 期間補正なし
      '5': { short: 0.97, standard: 1.00, long: 1.02 }, // 体型改善: 短期ほどカロリー絞る
    };
    const _storedPeriod   = localStorage.getItem(userKey('goal_period_type'));
    const goalPeriodType  = _storedPeriod || 'standard';
    const goalPeriodWeeks = { short: 4, standard: 12, long: 24 }[goalPeriodType] || 12;
    const _goalFactors    = PERIOD_FACTOR_MAP[selectedGoal] || { short: 1.00, standard: 1.00, long: 1.00 };
    const periodFactor    = _goalFactors[goalPeriodType] ?? 1.00;

    // MEAL_DBから3品選んで会話履歴の先頭プロンプトに追加
    let hasContradiction = false;
    if (selectedMethod === 'nutrition' && window.NutritionDB) {
      // 食事回数・何食目を取得
      totalMeals = questionAnswers[0] ? parseInt(questionAnswers[0]) : null;  // '3食' → 3
      const mealIndexRaw = questionAnswers[1];  // '2食目' or undefined
      mealIndex = mealIndexRaw ? parseInt(mealIndexRaw) : null;  // 2 or null

      // moodがDBのtimeSlotと合わない場合に強制変換
      const _rawTime = questionAnswers[2];
      const _mood2 = questionAnswers[4];
      timeOfDay = _mood2 === 'お酒を飲みたい' ? '夜'
        : _rawTime === '間食' ? '昼'   // 時間帯'間食'は通常食メニューでは昼扱い（間食・補食モード時はmealVolumeで制御）
        : _rawTime;
      mood = questionAnswers[4];
      location = questionAnswers[3];

      // ── location変換ロジック（優先度順に適用） ──
      // 1. 間食時間帯×時短×お弁当 → コンビニ（最優先・順序重要）
      if (_rawTime === '間食' && mood === '食べる時間があまりない' && location === 'お弁当を作る') {
        location = 'コンビニ';
      }
      // 2. お弁当×お酒 → 家（お弁当でお酒は現実的でない）
      else if (location === 'お弁当を作る' && mood === 'お酒を飲みたい') {
        location = '家で食べる';
      }
      // 3. お弁当×揚げ物 → 家（お弁当用の揚げ物メニューがないため）
      else if (location === 'お弁当を作る' && mood === '揚げ物を食べたい') {
        location = '家で食べる';
      }
      // 4. お弁当×時短 → 家（朝以外は家の時短メニューで対応）
      else if (location === 'お弁当を作る' && mood === '食べる時間があまりない') {
        location = '家で食べる';
      }
      // お酒設問はconditional（インデックス5）: nullの場合はスキップされた
      const sakeChoice = questionAnswers[5] !== null ? questionAnswers[5] : null;
      proteinSupp = questionAnswers[6];
      hunger = questionAnswers[7];
      // 修正③: [8][9] を取得（今後PFC・候補選定へのロジック反映予定）
      mealVolume = questionAnswers[8] ?? null;      // '通常の食事' | '軽めの食事' | '間食・補食'
      trainingTiming = questionAnswers[9] ?? null;  // '特になし' | 'トレーニング前' | 'トレーニング後'

      // 提案条件スナップショット（ユーザーの生入力を保存）
      _nutritionContext = {
        totalMeals,
        mealIndex,
        timeOfDay:     questionAnswers[2] ?? null,  // 時間帯（生入力）
        location:      questionAnswers[3] ?? null,  // 食事場所（生入力）
        mood:          questionAnswers[4] ?? null,  // 気分・食べ方
        sake:          questionAnswers[5] ?? null,  // お酒の種類
        proteinSupp,
        hunger,
        mealVolume,
        trainingTiming,
      };

      // お酒のカロリーと種類別調整
      const SAKE_INFO = {
        'ビール（350ml）':           { cal: 140, pBonus: 6, note: 'ビール350ml（純アルコール14g・糖質12g）。プリン体を考慮し高タンパク低脂質の食事を。' },
        'ハイボール・チューハイ（350ml）': { cal: 80,  pBonus: 4, note: 'ハイボール350ml（純アルコール14g）。低カロリーで食事のバランスが取りやすい。' },
        '日本酒（180ml・1合）':       { cal: 190, fPenalty: 6, note: '日本酒1合（純アルコール22g・糖質14g）。糖質が多いため食事の脂質を抑えること。' },
        'ワイン（200ml）':            { cal: 150, fPenalty: 6, note: 'ワイン200ml（純アルコール20g）。アルコールが脂肪酸化を阻害するため食事の脂質を控えること。' },
        '焼酎（100ml）':              { cal: 100, pBonus: 6, note: '焼酎100ml（純アルコール20g・糖質0g）。糖質ゼロなので高タンパクな食事を。' },
        'ウイスキー（60ml）':          { cal: 130, pBonus: 6, note: 'ウイスキー60ml（純アルコール20g・糖質0g）。蒸留酒なので高タンパクな食事を。' },
      };
      const sakeInfo = sakeChoice ? SAKE_INFO[sakeChoice] : null;
      const sakeCal = sakeInfo ? sakeInfo.cal : 0;

      // プロテイン補給量を計算
      let proteinFromSupp = 0;
      if (proteinSupp === '飲んでいる（1日1回）') proteinFromSupp = 24;
      if (proteinSupp === '飲んでいる（1日2回）') proteinFromSupp = 48;
      if (proteinSupp === '飲んでいる（1日3回以上）') proteinFromSupp = 72;

      // 体重・体脂肪率・目標体重は外側スコープで取得済み

      // 目的②かつ目標体重が高い場合のみ目標体重で計算
      const calcWeight = (selectedGoal === '2' && goalWeight && goalWeight > weight)
        ? goalWeight
        : weight;

      // PFC目標を計算
      const target = window.NutritionDB.calculateMealTarget({
        weight: calcWeight,
        goalNum: selectedGoal,
        currentBF,
        targetBF: null,
        goalWeight,
        totalMeals,
        mealIndex,
        timeOfDay,
        hunger,
        mealVolume,      // 修正④: '間食・補食'の場合にPFCを補食サイズへ縮小
        trainingTiming,  // 修正⑤: トレ前→C増F減 / トレ後→P増F減
        periodFactor     // 期間補正: short=0.95 / standard=1.00 / long=1.05
      });

      // ── タンパク質最低ライン（全食数共通・体重ベース）──
      // 科学的最低ライン: 1.8g/kg/day をその日の食数で按分
      // 間食・補食モードは補食サイズに縮小済みのためフロアをスキップ
      const proteinMinDaily = weight * 1.8;
      const proteinMinMeal = Math.round(proteinMinDaily / (totalMeals || 3));
      if (mealVolume !== '間食・補食' && target.p < proteinMinMeal) target.p = proteinMinMeal;

      // プロテイン分を1食あたりに按分して差し引く（最低ライン補正後に計算）
      const proteinPerMeal = Math.round(proteinFromSupp / (totalMeals || 3));
      const adjustedP = Math.max(10, target.p - proteinPerMeal);

      // お酒カロリーを食事ターゲットから差し引く
      if (sakeCal > 0) {
        target.cal = Math.max(100, target.cal - sakeCal);
        target.c = Math.max(5, Math.round(target.c * (target.cal / (target.cal + sakeCal))));
      }

      // ── 脂質最低ライン（全食数共通・体重ベース）──
      // 科学的最低ライン: 0.6g/kg/day をその日の食数で按分
      // 間食・補食モードは補食サイズに縮小済みのためフロアをスキップ
      const fatMinDaily = weight * 0.6;
      const fatMinMeal = Math.round(fatMinDaily / (totalMeals || 3));
      if (mealVolume !== '間食・補食' && target.f < fatMinMeal) target.f = fatMinMeal;

      // ── 2食時の追加補正（消化能力・血糖安定・現実的食事量） ──
      if (totalMeals === 2) {
        // 炭水化物上限: 体重×1.5gを上限に血糖スパイクを抑制
        const maxC = Math.round(weight * 1.5);
        if (target.c > maxC) target.c = maxC;
      }

      // ── 被り防止: LocalStorageから表示済みIDを取得 ──
      const _comboKey = userKey(`shown_meals_${selectedGoal}_${encodeURIComponent(location)}_${encodeURIComponent(mood)}`);
      let _shownIds = JSON.parse(localStorage.getItem(_comboKey) || '[]');

      // 除外して3品選択。結果が0件なら全件リセットして再取得
      // プロテイン補給時はF・Cバランスを重視したメニューを選ぶ
      // proteinFromSuppが多いほどP比率の重みを下げ、FCバランス重視にシフト
      const _proteinWeight = proteinFromSupp > 0 ? Math.max(0.3, 1 - (proteinFromSupp / 150)) : 1.0;

      // ── sub別PFCウェイトマップ ──
      const SUB_WEIGHT_MAP = {
        // 目的①減量
        '朝ごはんを食べていない':          { pBonus: 8, cPenalty: 5 },
        '夜食べすぎてしまう':              { calPenalty: 10, pBonus: 8 },
        '食欲がコントロールできない':       { pBonus: 10 },
        '脂肪がなかなか落ちない・停滞している': { fPenalty: 4, pBonus: 8 },
        // 目的②増量
        '脂肪をつけずに大きくなりたい':     { pBonus: 10, fPenalty: 8 },
        '消化が追いつかない':              { calPenalty: 8, fPenalty: 8 },
        '体重が増えない':                  { calBonus: 12, cBonus: 8 },
        '食事量を増やすのが苦手':           { calBonus: 8 },
        '脂肪を減らしながら筋肉を維持したい': { pBonus: 12, fPenalty: 8, calPenalty: 6 },
        // 目的③体力
        'すぐ疲れる':                     { cBonus: 10 },
        '午後にエネルギーが切れる':         { cBonus: 10 },
        '集中力が続かない':                { pBonus: 8, cBonus: 5 },
        '朝が起きられない・だるい':         { pBonus: 8, cBonus: 5 },
        '運動しているのに体力がつかない':    { cBonus: 10, pBonus: 6 },
        // 目的④不調
        '胃腸が弱い・消化が悪い':          { fPenalty: 10, calPenalty: 6 },
        'むくみやすい':                    { calPenalty: 6 },
        '便秘しやすい':                    { cBonus: 6 },
        '肌荒れが気になる':                { pBonus: 8 },
        '食後に眠くなる・だるい':           { cPenalty: 10, pBonus: 8 },
        '冷えや血行の悪さが気になる':       { pBonus: 6 },
        '甘いものが止まらない':             { pBonus: 10, cPenalty: 8 },
        '貧血気味・鉄不足が心配':           { pBonus: 8 },
        '睡眠の質を上げたい':              { pBonus: 6, calPenalty: 6 },
        // 目的⑤体型
        '特定の部位ではなく、全体を引き締めたい': { pBonus: 8, fPenalty: 4 },
        '体重より見た目を変えたい':         { pBonus: 10, fPenalty: 4 },
        '筋肉をつけながら脂肪を落としたい': { pBonus: 12, fPenalty: 4 },
        // 特になし
        '特になし': null,
      };
      const _subWeight = SUB_WEIGHT_MAP[selectedSub] || null;

      // お酒の種類に応じてsubWeightをマージ
      if (sakeInfo) {
        const sakeWeight = {};
        if (sakeInfo.cPenalty) sakeWeight.cPenalty = sakeInfo.cPenalty;
        if (sakeInfo.fPenalty) sakeWeight.fPenalty = sakeInfo.fPenalty;
        Object.assign(_subWeight || {}, sakeWeight);
        if (!_subWeight) Object.assign({}, sakeWeight);
      }

      let meals = selectMeals(target.cal, adjustedP, target.f, target.c, selectedGoal, location, mood, _shownIds, timeOfDay, _proteinWeight, _subWeight, hunger, mealVolume, selectedSub);
      if (meals.length === 0) {
        // 全候補を出し切った → リセット
        _shownIds = [];
        localStorage.removeItem(_comboKey);
        meals = selectMeals(target.cal, adjustedP, target.f, target.c, selectedGoal, location, mood, [], timeOfDay, _proteinWeight, _subWeight, hunger, mealVolume, selectedSub);
        console.log('MEAL_DB: 全候補を出し切ったためリセット', { selectedGoal, location, mood });
      }

      // 今回表示したIDを保存
      if (meals.length > 0) {
        const _newShownIds = [...new Set([..._shownIds, ...meals.map(m => m.id)])];
        localStorage.setItem(_comboKey, JSON.stringify(_newShownIds));
      }

      if (meals.length === 0) {
        console.log('MEAL_DB: 該当なし', { selectedGoal, location, mood });
        loadingIndicator.classList.add('hidden');
        addMessage('assistant', '該当するメニューが見つかりませんでした。時間帯・場所・気分の組み合わせを変えてお試しください。');
        resetBtn.classList.remove('hidden');
        return;
      }

      // goalGapTextを生成
      let goalGapText = '';
      if (goalWeight && weight) {
        const gapVal = parseFloat((goalWeight - weight).toFixed(1));
        if (gapVal > 0) {
          goalGapText = `現在${weight}kg → 目標${goalWeight}kg（あと+${gapVal}kg増量が必要）`;
        } else if (gapVal < 0) {
          goalGapText = `現在${weight}kg → 目標${goalWeight}kg（あと${Math.abs(gapVal)}kg減量が必要）`;
        } else {
          goalGapText = `現在${weight}kg → 目標${goalWeight}kg（目標体重に到達済み）`;
        }
      }

      // 矛盾チェック: 目的と目標体重の方向性が逆の場合
      if (weight && goalWeight) {
        const gapDir = goalWeight - weight;
        if (selectedGoal === '1' && gapDir > 0) hasContradiction = true; // 脂肪減少なのに増量目標
        if (selectedGoal === '2' && gapDir < 0) hasContradiction = true; // 筋肥大なのに減量目標
      }

      // 目的×サブ×目標差分から科学的アドバイスを生成
      let scienceAdvice = '';
      const gap = goalWeight && weight ? parseFloat((goalWeight - weight).toFixed(1)) : 0;

        if (selectedGoal === '1') {
          const weeklyLoss = weight ? (weight * 0.007).toFixed(1) : '0.5';
          const dailyDeficit = 300;
          if (selectedSub === '朝ごはんを食べていない') {
            scienceAdvice = `朝食を摂ることで代謝が活性化し、1日の総カロリー摂取量を自然に抑制できる（Jakubowicz et al. 2013）。タンパク質多めの朝食は特に食欲ホルモン（グレリン）を抑制し昼の過食を防ぐ（Leidy et al. 2013）。${gap !== 0 ? '目標まで' + Math.abs(gap) + 'kg、' : ''}週${weeklyLoss}kgペース推奨。`;
          } else if (selectedSub === '夜食べすぎてしまう') {
            scienceAdvice = `夜間の過食は概日リズムを乱し脂肪蓄積を促進（Garaulet et al. 2013）。夜は炭水化物を抑えタンパク質を多めにすることで翌朝の空腹感が軽減される。${gap !== 0 ? '目標まで' + Math.abs(gap) + 'kg、' : ''}週${weeklyLoss}kgペース推奨。`;
          } else if (selectedSub === '脂肪がなかなか落ちない・停滞している') {
            scienceAdvice = `停滞期は代謝適応が原因。カロリー収支-${dailyDeficit}kcalを維持しつつタンパク質を体重×1.6〜2.2gに増やすと筋肉を守りながら脂肪を落とせる（Morton et al. 2018）。${gap !== 0 ? '目標まで' + Math.abs(gap) + 'kg、' : ''}`;
          } else if (selectedSub === '食欲がコントロールできない') {
            scienceAdvice = `食欲抑制には食物繊維とタンパク質を優先。満腹感を高めることで自然とカロリー収支-${dailyDeficit}kcalを実現（Slavin 2005）。${gap !== 0 ? '目標まで' + Math.abs(gap) + 'kg、' : ''}週${weeklyLoss}kgペースが筋肉量を保つ最適速度（ACSM推奨）。`;
          } else {
            scienceAdvice = `脂肪減少の最適ペースは週${weeklyLoss}kg（体重の0.7%）。カロリー収支-${dailyDeficit}kcalを維持（ACSM推奨）。${gap !== 0 ? '目標まで' + Math.abs(gap) + 'kg、' : ''}`;
          }
        } else if (selectedGoal === '2') {
          if (selectedSub === '脂肪をつけずに大きくなりたい') {
            scienceAdvice = `リーンバルクにはカロリー+200〜300kcal/日、週0.2〜0.3kg増量ペースが推奨（Barakat et al. 2020）。${gap !== 0 ? '目標まで+' + gap + 'kg、' : ''}急がず脂肪増加を抑えながら進めること。`;
          } else if (selectedSub === '消化が追いつかない') {
            scienceAdvice = `消化不良時は食事回数を4〜5回に分けて1食あたりのボリュームを下げることで吸収率が上がる（Burke et al. 2011）。${gap !== 0 ? '目標まで+' + gap + 'kg、' : ''}`;
          } else if (selectedSub === '体重が増えない') {
            scienceAdvice = `体重が増えない場合はカロリーが足りていない可能性が高い。+500kcal/日から始め、2週間で0.3kg以上増えなければ+200kcalずつ追加（NSCA推奨）。${gap !== 0 ? '目標まで+' + gap + 'kg、' : ''}`;
          } else if (selectedSub === '食事量を増やすのが苦手') {
            scienceAdvice = `食事量が増やせない場合は液体カロリー（牛乳・豆乳・スムージー）の活用が有効。固形食より消化が早く胃への負担が少ない（Burke et al. 2011）。${gap !== 0 ? '目標まで+' + gap + 'kg、' : ''}`;
          } else if (selectedSub === '脂肪を減らしながら筋肉を維持したい') {
            scienceAdvice = `同時に脂肪を落として筋肉をつける「リコンポジション」はタンパク質を体重×2.2g以上確保することで実現可能（Barakat et al. 2020）。カロリーは維持カロリー付近が最適。`;
          } else {
            scienceAdvice = `筋肥大の最適ペースは週0.25〜0.5kg増量（Helms et al. 2014）。カロリー+300〜500kcal/日を維持。${gap !== 0 ? '目標まで+' + gap + 'kg、' : ''}`;
          }
        } else if (selectedGoal === '3') {
          if (selectedSub === 'すぐ疲れる') {
            scienceAdvice = `すぐ疲れる主因は糖質不足または血糖値の乱高下。GI値の低い炭水化物を中心に1食あたり体重×1g以上確保すると持続的なエネルギーが得られる（Burke et al. 2011）。`;
          } else if (selectedSub === '午後にエネルギーが切れる') {
            scienceAdvice = `午後のエネルギー切れは昼食後の血糖値急降下が原因。食物繊維・タンパク質を昼食に組み合わせることで血糖値の安定化が科学的に示されている（Jenkins et al. 2002）。`;
          } else if (selectedSub === '集中力が続かない') {
            scienceAdvice = `脳のエネルギー源はブドウ糖のみ。血糖値を安定させる低GI炭水化物＋タンパク質の組み合わせが集中力持続に有効（Benton & Parker 1998）。`;
          } else if (selectedSub === '朝が起きられない・だるい') {
            scienceAdvice = `朝のだるさはコルチゾール不足や血糖値の低下が原因のことが多い。朝食にタンパク質と炭水化物を組み合わせることで交感神経が活性化し覚醒度が上がる（Jakubowicz et al. 2013）。`;
          } else if (selectedSub === '運動しているのに体力がつかない') {
            scienceAdvice = `運動しても体力がつかない場合は回復のための栄養が不足している可能性が高い。運動後のタンパク質＋炭水化物補給で筋グリコーゲンの回復速度が2倍になる（Ivy et al. 2002）。`;
          } else {
            scienceAdvice = `体力向上には炭水化物60%以上の食事構成が科学的に推奨されている（Burke et al. 2011）。このメニューでエネルギー基盤を整えること。`;
          }
        } else if (selectedGoal === '4') {
          if (selectedSub === '胃腸が弱い・消化が悪い') {
            scienceAdvice = `消化機能が低下している場合、食物繊維は水溶性（オートミール・海藻など）を優先し、不溶性（生野菜・ブランなど）は控えめに。発酵食品（納豆・味噌）は腸内環境改善に有効（Quigley 2013）。`;
          } else if (selectedSub === 'むくみやすい') {
            scienceAdvice = `むくみの主因はナトリウム過多とカリウム不足。カリウムを多く含む食材（豆類・海藻・魚）を積極的に摂ることで細胞内外の水分バランスが整う（He & MacGregor 2010）。`;
          } else if (selectedSub === '便秘しやすい') {
            scienceAdvice = `便秘改善には食物繊維25g/日以上＋水分2L/日が基準（WHO推奨）。不溶性食物繊維（全粒穀物・ブロッコリー）と水溶性食物繊維（海藻・豆類）をバランスよく摂ること。`;
          } else if (selectedSub === '肌荒れが気になる') {
            scienceAdvice = `肌の再生にはタンパク質（コラーゲン合成）、ビタミンC（抗酸化）、亜鉛（細胞修復）が必要。魚・豆腐・野菜の組み合わせが肌改善に科学的根拠がある（Cosgrove et al. 2007）。`;
          } else if (selectedSub === '食後に眠くなる・だるい') {
            scienceAdvice = `食後の眠気は血糖値スパイクと急降下が原因。炭水化物を抑えてタンパク質・食物繊維を先に食べることで血糖値上昇を約30%抑制できる（Imai et al. 2014）。`;
          } else if (selectedSub === '冷えや血行の悪さが気になる') {
            scienceAdvice = `冷えの改善には鉄分（赤身肉・魚）、ビタミンE（ナッツ・アボカド）、生姜の摂取が有効。体を温める食材と血行促進効果のある食材を組み合わせることが推奨される（Briguglio et al. 2020）。`;
          } else if (selectedSub === '甘いものが止まらない') {
            scienceAdvice = `甘いものへの欲求は血糖値の乱高下やセロトニン不足が原因のことが多い。タンパク質多めの食事で血糖値を安定させ、自然な甘みのある食材で欲求を満たすことが科学的に推奨される（Lustig 2013）。`;
          } else if (selectedSub === '貧血気味・鉄不足が心配') {
            scienceAdvice = `鉄欠乏性貧血の改善にはヘム鉄（赤身肉・レバー・魚）と非ヘム鉄（豆腐・ほうれん草）の両方を摂取し、ビタミンCと組み合わせることで吸収率が2〜3倍に向上する（Hallberg et al. 1989）。`;
          } else if (selectedSub === '睡眠の質を上げたい') {
            scienceAdvice = `睡眠の質向上にはトリプトファン（乳製品・バナナ・ナッツ）の摂取が有効。セロトニン→メラトニンの合成を促進し自然な眠気を誘発する（Peuhkuri et al. 2012）。夜の過食と高脂質食は睡眠の質を低下させる。`;
          } else {
            scienceAdvice = `不調改善には抗炎症作用のある食材（青魚・緑黄色野菜・発酵食品）を中心に、消化に負担をかけない食事構成が推奨される（Calder 2017）。`;
          }
        } else if (selectedGoal === '5') {
          const weeklyLoss = weight ? (weight * 0.005).toFixed(1) : '0.4';
          if (selectedSub === '特定の部位ではなく、全体を引き締めたい') {
            scienceAdvice = `全身の引き締めにはタンパク質を体重×1.6g確保しながらカロリーをわずかに抑えることで脂肪を落としながら筋肉を維持できる（Morton et al. 2018）。${gap !== 0 ? '目標まで' + Math.abs(gap) + 'kg、' : ''}`;
          } else if (selectedSub === '体重より見た目を変えたい') {
            scienceAdvice = `体重が変わらなくても筋肉量を増やして脂肪を減らす「リコンポジション」は可能。タンパク質を体重×2g以上確保し、筋トレと組み合わせることで見た目が大きく変わる（Barakat et al. 2020）。`;
          } else if (selectedSub === '筋肉をつけながら脂肪を落としたい') {
            scienceAdvice = `筋肉をつけながら脂肪を落とすにはタンパク質を体重×2.2g以上確保することが重要。初心者・再開者・肥満体型ほど効果が出やすい（Barakat et al. 2020）。`;
          } else {
            scienceAdvice = `体型改善の最適ペースは週${weeklyLoss}kg体脂肪減少（体重の0.5%）。タンパク質を体重×1.6〜2.2g確保することで筋肉を守りながら引き締まった体型に近づける（Morton et al. 2018）。${gap !== 0 ? '目標まで' + Math.abs(gap) + 'kg、' : ''}`;
          }
      }

      // 食材量をスケーリングする関数
      function scaleMeal(m, targetCal) {
        // スケール上限: 2.0倍まで（2食など高カロリー必要時に対応）
        const ratio = Math.min(2.0, Math.max(0.5, targetCal / m.cal));
        const scaledIngredients = m.ingredients.map(ing => {
          return ing
            .replace(/([\d.]+)\s*(g|ml)/g, (_, num, unit) => {
              const scaled = Math.round(parseFloat(num) * ratio / 5) * 5;
              return `${Math.max(5, scaled)}${unit}`;
            })
            .replace(/([\d.]+)\s*(個|本|杯|枚|パック|缶|皿|食|玉|切れ)/g, (_, num, unit) => {
              const original = parseFloat(num);
              // 個数系は元の数×2まで（2本→最大4本、1食→最大2食）
              const scaled = Math.min(Math.ceil(original * 2), Math.max(1, Math.round(original * ratio)));
              return `${scaled}${unit}`;
            });
        });
        return {
          ...m,
          ingredients: scaledIngredients,
          cal: Math.round(m.cal * ratio),
          p: Math.round(m.p * ratio),
          f: Math.round(m.f * ratio),
          c: Math.round(m.c * ratio),
        };
      }

      // mealInfoを生成してプロンプトに追加
      if (meals.length > 0) {
        const mealInfo = meals.map((m, i) => {
          const label = i === 0 ? '第一候補' : i === 1 ? '第二候補' : 'これならOK';
          const scaled = scaleMeal(m, target.cal);
          const pfcCal = scaled.p * 4 + scaled.f * 9 + scaled.c * 4;
          const pPct = pfcCal > 0 ? Math.round((scaled.p * 4 / pfcCal) * 100) : 0;
          const fPct = pfcCal > 0 ? Math.round((scaled.f * 9 / pfcCal) * 100) : 0;
          const cPct = 100 - pPct - fPct;
          return `▼ ${label}: ${scaled.name}
食材: ${scaled.ingredients.join('、')}
栄養: 約${scaled.cal}kcal｜P${scaled.p}g(${pPct}%) F${scaled.f}g(${fPct}%) C${scaled.c}g(${cPct}%)`;
        }).join('\n\n');

        const sakeText = sakeInfo
          ? `\nお酒:「${sakeChoice}」（${sakeInfo.cal}kcal）→ 食事カロリーから差し引き済み。${sakeInfo.note}\n【重要】AIは必ずお酒の推奨量「${sakeChoice}」を提案の中で明示すること。それ以上飲むと健康リスクがある旨も添えること。`
          : '';
        const contradictionNote = hasContradiction
          ? `\n【目的と目標の矛盾について】目標体重と選択した目的の方向性が異なります。AIはこの矛盾を指摘・確認・質問することは絶対禁止。選択した目的を最優先として即座に提案を出すこと。`
          : '';
        conversationHistory[0].content += `\n\n【今回提案する料理（確定済み）】\n${mealInfo}\n\n【ユーザーの現状と目標】\n${goalGapText || '体重記録なし'}${contradictionNote}\n今日選んだ悩み・状況:「${selectedSub}」\nプロテイン補給:「${proteinSupp}」（1食あたり食事で補うべきタンパク質を${proteinPerMeal}g減らせる）${sakeText}\n\n【科学的アドバイス（必ず踏まえること）】\n${scienceAdvice}\n\n【絶対厳守】\n・目的と目標体重に矛盾があっても提案を停止しない・質問しない・確認しない。選択した目的を最優先として必ず提案を出すこと\n・提案する料理名・食材・量・PFCは上記の確定済みデータから一切変更禁止\n・AIが独自に食材・飲み物・お酒を追加することは禁止\n・料理名の言い換えも禁止\n・お酒の提案はユーザーが「お酒を飲みたい」を選んだ場合のみ、科学的根拠の説明の中で種類を1種類だけ言及してよい\n・各候補の出力形式は必ず以下を守ること：\n\n▼ 第一候補: [料理名]\n食材: [食材1]、[食材2]...（上記の食材リストをそのままコピー）\n栄養: [上記の栄養データをそのままコピー。例: 約300kcal｜P28g(35%) F8g(24%) C14g(41%)]\n[科学的根拠を1〜2行]\n\n上記フォーマット以外での出力は禁止。特に「栄養:」行は上記の確定済みデータを一字一句変えずにコピーすること。`;
      }
    }

    conversationHistory.push({ role: 'user', content: summary });
    questionAnswers = [];
    currentQuestionIndex = 0;
    loadingIndicator.classList.remove('hidden');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('セッションなし');

      const { data: history } = await supabase
        .from('chat_history')
        .select('messages')
        .eq('user_id', session.user.id)
        .eq('goal', selectedGoal)
        .eq('method', selectedMethod)
        .eq('sub', selectedSub)
        .order('created_at', { ascending: false })
        .limit(3);

      if (history && history.length > 0) {
        const pastInfo = '【このユーザーの過去の回答と提案履歴】\n' +
          history.map((h, i) => {
            const userMsg = h.messages.find(m => m.role === 'user');
            const aiMsg   = h.messages.find(m => m.role === 'assistant');
            return `${i+1}回目:\n回答:${userMsg?.content.slice(0, 100)}\n提案:${aiMsg?.content.slice(0, 200)}`;
          }).join('\n\n');
        conversationHistory[0].content += `\n\n${pastInfo}\n\n上記を踏まえて今回は違うアプローチで提案してください。`;
      }

      // 体重未入力＋体脂肪率あり → 注意文を表示
      if (!weightRecorded && currentBF !== null) {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'chat-message assistant';
        noteDiv.innerHTML = '<p style="color:#f5a623;font-size:13px;margin:0;padding:8px 12px;background:rgba(245,166,35,0.1);border-radius:8px;border-left:3px solid #f5a623;">※現在の体重が記録されていないため、60kgを想定して提案しています。体重を入力すると、より正確な提案になります。</p>';
        chatHistory.appendChild(noteDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
      }

      // 矛盾あり → 注意文を表示（提案は通常どおり継続）
      if (hasContradiction) {
        const contradictionDiv = document.createElement('div');
        contradictionDiv.className = 'chat-message assistant';
        contradictionDiv.innerHTML = '<p style="color:#f5a623;font-size:13px;margin:0;padding:8px 12px;background:rgba(245,166,35,0.1);border-radius:8px;border-left:3px solid #f5a623;">※現在の目標設定に矛盾がありますが、今回は「目的」を優先して提案しています。</p>';
        chatHistory.appendChild(contradictionDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
      }

      // ストリーミング対応
      loadingIndicator.classList.add('hidden');
      const streamDiv = addStreamingMessage();
      console.log('nutrition debug', {
        questionAnswers,
        totalMeals,
        mealIndex,
        timeOfDay,
        location,
        mood,
        proteinSupp,
        hunger,
        selectedGoal,
        selectedMethod,
        selectedSub
      });
      try {
        const text = await callAPIStream(conversationHistory, (partial) => {
          updateStreamingMessage(streamDiv, partial);
        });
        finalizeStreamingMessage(streamDiv, text);
        conversationHistory.push({ role: 'assistant', content: text });
      } catch (streamErr) {
        // ストリーミング失敗時はフォールバック
        console.warn('ストリーミング失敗、通常モードにフォールバック:', streamErr);
        streamDiv.remove();
        loadingIndicator.classList.remove('hidden');
        const text = await callAPI(conversationHistory);
        conversationHistory.push({ role: 'assistant', content: text });
        loadingIndicator.classList.add('hidden');
        addMessage('assistant', text);
      }
      chatInputArea.classList.remove('hidden');

      const messagesToSave = conversationHistory.slice(1);
      const { error: saveError } = await supabase.from('chat_history').insert({
        user_id: session.user.id,
        goal: selectedGoal,
        method: selectedMethod,
        sub: selectedSub,
        messages: messagesToSave
      });
      console.log('chat_history保存結果:', saveError);
      loadDashboard();

    } catch (err) {
      loadingIndicator.classList.add('hidden');
      addMessage('assistant', `【エラー】${err?.message || err}`);
      console.error('showQuestionStepエラー詳細:', err);
      if (err?.stack) console.error(err.stack);
    }
    return;
  }

  const q = questions[currentQuestionIndex];

  // conditionalOn: 特定の回答のときだけ表示する設問
  if (q.conditionalOn) {
    const prevAnswer = questionAnswers.at(-1);
    if (prevAnswer !== q.conditionalOn) {
      // スキップ: nullをpushして次へ
      questionAnswers.push(null);
      currentQuestionIndex++;
      showQuestionStep(questions);
      return;
    }
  }

  const div = document.createElement('div');
  div.className = 'chat-message assistant';

  const label = document.createElement('p');
  label.textContent = q.label;
  label.style.marginBottom = '10px';
  div.appendChild(label);

  const btnGroup = document.createElement('div');
  btnGroup.className = 'option-buttons';

  // dynamicOptions: 前の回答に応じて選択肢を動的生成
  const options = q.dynamicOptions ? q.dynamicOptions(questionAnswers) : q.options;

  options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = `${i + 1}. ${opt}`;
    btn.addEventListener('click', () => {
      questionAnswers.push(opt);
      currentQuestionIndex++;
      div.style.display = 'none';
      showQuestionStep(questions);
    });
    btnGroup.appendChild(btn);
  });

  if (selectedMethod !== 'nutrition') {
    addOtherInput(btnGroup, div, (val) => {
      questionAnswers.push(val);
      currentQuestionIndex++;
      showQuestionStep(questions);
    });
  }

  div.appendChild(btnGroup);
  chatHistory.appendChild(div);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function showNutritionQuestions() {
  questionAnswers = [];
  currentQuestionIndex = 0;
  showQuestionStep(QUESTIONS.nutrition);
}

function showTrainingQuestions() {
  questionAnswers = [];
  currentQuestionIndex = 0;
  trainingPhase = 'base';
  baseAnswers = [];
  const useSplit = (selectedGoal === '2' || selectedGoal === '5');
  const questions = useSplit ? QUESTIONS.training_with_split : QUESTIONS.training_base;
  showQuestionStepTraining(questions);
}

let trainingPhase = 'base';
let baseAnswers = [];

function showTrainingStep() {
  const useSplit = (selectedGoal === '2' || selectedGoal === '5');
  const questions = useSplit ? QUESTIONS.training_with_split : QUESTIONS.training_base;
  showQuestionStepTraining(questions);
}

async function showQuestionStepTraining(questions) {
  if (currentQuestionIndex >= questions.length) {
    baseAnswers = [...questionAnswers];
    const splitChoice = questionAnswers[4];
    const extraQuestions = QUESTIONS.training_split[splitChoice] || [];

    if (extraQuestions.length > 0) {
      questionAnswers = [];
      currentQuestionIndex = 0;
      trainingPhase = 'split';
      showExtraTrainingQuestions(extraQuestions, splitChoice, questions);
    } else {
      await callAIWithAnswers(questions, questionAnswers);
    }
    return;
  }

  const q = questions[currentQuestionIndex];
  const div = document.createElement('div');
  div.className = 'chat-message assistant';
  const label = document.createElement('p');
  label.textContent = q.label;
  label.style.marginBottom = '10px';
  div.appendChild(label);
  const btnGroup = document.createElement('div');
  btnGroup.className = 'option-buttons';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = `${i + 1}. ${opt}`;
    btn.addEventListener('click', () => {
      questionAnswers.push(opt);
      currentQuestionIndex++;
      div.style.display = 'none';

      if (currentQuestionIndex === questions.length) {
        const splitChoice = questionAnswers[4];
        const extraQuestions = QUESTIONS.training_split[splitChoice] || [];
        if (extraQuestions.length > 0) {
          baseAnswers = [...questionAnswers];
          questionAnswers = [];
          currentQuestionIndex = 0;
          showExtraTrainingQuestions(extraQuestions, splitChoice, questions);
        } else {
          callAIWithAnswers(questions, baseAnswers.length > 0 ? baseAnswers : questionAnswers);
        }
      } else {
        showQuestionStepTraining(questions);
      }
    });
    btnGroup.appendChild(btn);
  });

  addOtherInput(btnGroup, div, (val) => {
    questionAnswers.push(val);
    currentQuestionIndex++;
    if (currentQuestionIndex === questions.length) {
      const splitChoice = questionAnswers[4];
      const extraQuestions = QUESTIONS.training_split[splitChoice] || [];
      if (extraQuestions.length > 0) {
        baseAnswers = [...questionAnswers];
        questionAnswers = [];
        currentQuestionIndex = 0;
        showExtraTrainingQuestions(extraQuestions, splitChoice, questions);
      } else {
        callAIWithAnswers(questions, baseAnswers.length > 0 ? baseAnswers : questionAnswers);
      }
    } else {
      showQuestionStepTraining(questions);
    }
  });

  div.appendChild(btnGroup);
  chatHistory.appendChild(div);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function showExtraTrainingQuestions(extraQuestions, splitChoice, baseQuestions) {
  if (currentQuestionIndex >= extraQuestions.length) {
    const allAnswers = [...baseAnswers, ...questionAnswers];
    const allQuestions = [...baseQuestions, ...extraQuestions];
    callAIWithAnswers(allQuestions, allAnswers);
    return;
  }

  const q = extraQuestions[currentQuestionIndex];
  const div = document.createElement('div');
  div.className = 'chat-message assistant';
  const label = document.createElement('p');
  label.textContent = q.label;
  label.style.marginBottom = '10px';
  div.appendChild(label);
  const btnGroup = document.createElement('div');
  btnGroup.className = 'option-buttons';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = `${i + 1}. ${opt}`;
    btn.addEventListener('click', () => {
      questionAnswers.push(opt);
      currentQuestionIndex++;
      div.style.display = 'none';
      showExtraTrainingQuestions(extraQuestions, splitChoice, baseQuestions);
    });
    btnGroup.appendChild(btn);
  });
  addOtherInput(btnGroup, div, (val) => {
    questionAnswers.push(val);
    currentQuestionIndex++;
    div.style.display = 'none';
    showExtraTrainingQuestions(extraQuestions, splitChoice, baseQuestions);
  });
  div.appendChild(btnGroup);
  chatHistory.appendChild(div);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

async function callAIWithAnswers(questions, answers) {
  trainingPhase = 'base';
  baseAnswers = [];
  const summary = answers.map((ans, i) => `${questions[i]?.label || ''} → ${ans}`).join('\n');
  addMessage('user', summary);
  conversationHistory.push({ role: 'user', content: summary });
  questionAnswers = [];
  currentQuestionIndex = 0;
  loadingIndicator.classList.remove('hidden');

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('セッションなし');

    const { data: history } = await supabase
      .from('chat_history')
      .select('messages')
      .eq('user_id', session.user.id)
      .eq('goal', selectedGoal)
      .eq('method', selectedMethod)
      .eq('sub', selectedSub)
      .order('created_at', { ascending: false })
      .limit(3);

    if (history && history.length > 0) {
      const pastInfo = '【このユーザーの過去の回答と提案履歴】\n' +
        history.map((h, i) => {
          const userMsg = h.messages.find(m => m.role === 'user');
          const aiMsg   = h.messages.find(m => m.role === 'assistant');
          return `${i+1}回目:\n回答:${userMsg?.content.slice(0, 100)}\n提案:${aiMsg?.content.slice(0, 200)}`;
        }).join('\n\n');
      conversationHistory[0].content += `\n\n${pastInfo}\n\n上記を踏まえて今回は違うアプローチで提案してください。`;
    }

    // ストリーミング対応
    loadingIndicator.classList.add('hidden');
    const streamDiv = addStreamingMessage();
    try {
      const text = await callAPIStream(conversationHistory, (partial) => {
        updateStreamingMessage(streamDiv, partial);
      });
      finalizeStreamingMessage(streamDiv, text);
      conversationHistory.push({ role: 'assistant', content: text });
    } catch (streamErr) {
      console.warn('ストリーミング失敗、フォールバック:', streamErr);
      streamDiv.remove();
      loadingIndicator.classList.remove('hidden');
      const text = await callAPI(conversationHistory);
      conversationHistory.push({ role: 'assistant', content: text });
      loadingIndicator.classList.add('hidden');
      addMessage('assistant', text);
    }
    chatInputArea.classList.remove('hidden');

    const messagesToSave = conversationHistory.slice(1);
    const { error: saveError } = await supabase.from('chat_history').insert({
      user_id: session.user.id,
      goal: selectedGoal,
      method: selectedMethod,
      sub: selectedSub,
      messages: messagesToSave
    });
    console.log('chat_history保存結果:', saveError);
    loadDashboard();

  } catch (err) {
    loadingIndicator.classList.add('hidden');
    addMessage('assistant', '【エラー】通信に失敗しました。');
    console.error('callAIWithAnswersエラー:', err);
  }
}

function showRecoveryQuestions() {
  questionAnswers = [];
  currentQuestionIndex = 0;
  showRecoveryStep();
}

function showRecoveryStep() {
  showQuestionStepRecovery(QUESTIONS.recovery);
}

function showQuestionStepRecovery(questions) {
  if (currentQuestionIndex >= questions.length) {
    const needsPart = QUESTIONS.recovery_needs_part.includes(selectedSub);
    if (needsPart) {
      const partQ = QUESTIONS.recovery_part;
      const div = document.createElement('div');
      div.className = 'chat-message assistant';
      const label = document.createElement('p');
      label.textContent = partQ.label;
      label.style.marginBottom = '10px';
      div.appendChild(label);
      const btnGroup = document.createElement('div');
      btnGroup.className = 'option-buttons';
      partQ.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = `${i + 1}. ${opt}`;
        btn.addEventListener('click', () => {
          questionAnswers.push(opt);
          div.style.display = 'none';
          const allQuestions = [...questions, partQ];
          showQuestionStep.__callAI(allQuestions, questionAnswers);
        });
        btnGroup.appendChild(btn);
      });
      addOtherInput(btnGroup, div, (val) => {
        questionAnswers.push(val);
        const allQuestions = [...questions, partQ];
        showQuestionStep.__callAI(allQuestions, questionAnswers);
      });
      div.appendChild(btnGroup);
      chatHistory.appendChild(div);
      chatHistory.scrollTop = chatHistory.scrollHeight;
    } else {
      showQuestionStep.__callAI(questions, questionAnswers);
    }
    return;
  }

  const q = questions[currentQuestionIndex];
  const div = document.createElement('div');
  div.className = 'chat-message assistant';
  const label = document.createElement('p');
  label.textContent = q.label;
  label.style.marginBottom = '10px';
  div.appendChild(label);
  const btnGroup = document.createElement('div');
  btnGroup.className = 'option-buttons';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = `${i + 1}. ${opt}`;
    btn.addEventListener('click', () => {
      questionAnswers.push(opt);
      currentQuestionIndex++;
      div.style.display = 'none';
      showQuestionStepRecovery(questions);
    });
    btnGroup.appendChild(btn);
  });
  addOtherInput(btnGroup, div, (val) => {
    questionAnswers.push(val);
    currentQuestionIndex++;
    showQuestionStepRecovery(questions);
  });
  div.appendChild(btnGroup);
  chatHistory.appendChild(div);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

showQuestionStep.__callAI = async function(questions, answers) {
  const summary = answers.map((ans, i) => `${questions[i]?.label || ''} → ${ans}`).join('\n');
  addMessage('user', summary);
  conversationHistory.push({ role: 'user', content: summary });
  questionAnswers = [];
  currentQuestionIndex = 0;
  loadingIndicator.classList.remove('hidden');

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('セッションなし');

    const { data: history } = await supabase
      .from('chat_history')
      .select('messages')
      .eq('user_id', session.user.id)
      .eq('goal', selectedGoal)
      .eq('method', selectedMethod)
      .eq('sub', selectedSub)
      .order('created_at', { ascending: false })
      .limit(3);

    if (history && history.length > 0) {
      const pastInfo = '【このユーザーの過去の回答と提案履歴】\n' +
        history.map((h, i) => {
          const userMsg = h.messages.find(m => m.role === 'user');
          const aiMsg   = h.messages.find(m => m.role === 'assistant');
          return `${i+1}回目:\n回答:${userMsg?.content.slice(0, 100)}\n提案:${aiMsg?.content.slice(0, 200)}`;
        }).join('\n\n');
      conversationHistory[0].content += `\n\n${pastInfo}\n\n上記を踏まえて今回は違うアプローチで提案してください。`;
    }

    const text = await callAPI(conversationHistory);
    conversationHistory.push({ role: 'assistant', content: text });
    loadingIndicator.classList.add('hidden');
    addMessage('assistant', text);
    chatInputArea.classList.remove('hidden');

    const messagesToSave = conversationHistory.slice(1);
    await supabase.from('chat_history').insert({
      user_id: session.user.id,
      goal: selectedGoal,
      method: selectedMethod,
      sub: selectedSub,
      messages: messagesToSave
    });
    loadDashboard();

  } catch (err) {
    loadingIndicator.classList.add('hidden');
    addMessage('assistant', '【エラー】通信に失敗しました。');
    console.error('recoveryAIエラー:', err);
  }
};

// ============================================================
// 要素取得
// ============================================================
const goalSection      = document.getElementById('goal-section');
const methodSection    = document.getElementById('method-section');
const subSection       = document.getElementById('sub-section');
const subButtons       = document.getElementById('sub-buttons');
const aiResponse       = document.getElementById('ai-response');
const chatHistory      = document.getElementById('chat-history');
const loadingIndicator = document.getElementById('loading-indicator');
const chatInputArea    = document.getElementById('chat-input-area');
const chatInput        = document.getElementById('chat-input');
const chatSendBtn      = document.getElementById('chat-send-btn');
const resetBtn         = document.getElementById('reset-btn');

let selectedGoal   = null;
let selectedMethod = null;
let selectedSub    = null;
let conversationHistory = [];

const subOptions = {
  "1": {
    "nutrition": ['特になし','朝ごはんを食べていない','夜食べすぎてしまう','食欲がコントロールできない','脂肪がなかなか落ちない・停滞している'],
    "training":  ['家でやりたい','ジムに通っている','短時間で終わらせたい','きつすぎるのは無理','汗かきたい','続かない・モチベが上がらない','怪我・痛みがある'],
    "recovery":  ['睡眠の質を上げたい','運動後の回復を早めたい','ストレスで食欲が乱れる','疲れて運動できない日が続いている','むくみ・炎症が気になる','睡眠時間が足りない']
  },
  "2": {
    "nutrition": ['特になし','脂肪をつけずに大きくなりたい','消化が追いつかない','体重が増えない','食事量を増やすのが苦手','脂肪を減らしながら筋肉を維持したい'],
    "training":  ['ジムで本気でやる','家トレ中心','毎日少しずつやりたい','週3回しっかりやりたい','種目がわからない','怪我・痛みがある'],
    "recovery":  ['筋肉痛がひどい','関節が少し不安','睡眠時間が短い','トレ後の回復を早めたい','オーバートレーニング気味','ストレスが多い']
  },
  "3": {
    "nutrition": ['特になし','すぐ疲れる','午後にエネルギーが切れる','集中力が続かない','朝が起きられない・だるい','運動しているのに体力がつかない'],
    "training":  ['走れるようになりたい','階段で息切れしたくない','スポーツうまくなりたい','筋力をつけたい','短時間で体力をつけたい'],
    "recovery":  ['呼吸が浅い気がする','寝てもスッキリしない','パフォーマンスが落ちてきた','疲労が蓄積している','集中力が続かない','日中に眠くなる']
  },
  "4": {
    "nutrition": ['特になし','胃腸が弱い・消化が悪い','むくみやすい','便秘しやすい','肌荒れが気になる','食後に眠くなる・だるい','冷えや血行の悪さが気になる','甘いものが止まらない','貧血気味・鉄不足が心配','睡眠の質を上げたい'],
    "training":  ['腰が不安','肩こりがある','体が硬い','膝が不安','足がつりやすい'],
    "recovery":  ['眠りが浅い','ストレスが強い','リラックスできない','体がだるい','頭痛がある','気力が湧かない']
  },
  "5": {
    "nutrition": ['特になし','特定の部位ではなく、全体を引き締めたい','体重より見た目を変えたい','筋肉をつけながら脂肪を落としたい'],
    "training":  ['お腹引き締めたい','お尻を上げたい','姿勢を良くしたい','二の腕を細くしたい','太ももを引き締めたい','背中を鍛えたい'],
    "recovery":  ['猫背を改善したい','肩の位置を整えたい','脚のむくみをとりたい','腰回りをすっきりさせたい','見た目に影響する体のこりをとりたい']
  }
};

function showSection(section) {
  section.style.display = 'block';
  section.classList.remove('hidden');
  section.classList.add('visible');
}

function hideSection(section) {
  section.style.display = 'none';
  section.classList.remove('visible');
  section.classList.add('hidden');
}

function updateStepIndicator(activeStep) {
  document.querySelectorAll('.step').forEach(step => {
    const stepNum = parseInt(step.dataset.step);
    step.classList.remove('active', 'done');
    if (stepNum === activeStep) step.classList.add('active');
    if (stepNum < activeStep)   step.classList.add('done');
  });
}

function highlightButton(section, selectedBtn) {
  section.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
  selectedBtn.classList.add('selected');
}

function parseOptions(text) {
  const lines = text.split('\n');
  const pattern = /^(\d+)[.\)）]\s*(.+)$/;

  // 末尾の空行をスキップ
  let i = lines.length - 1;
  while (i >= 0 && lines[i].trim() === '') i--;

  // 末尾から連続する番号行を収集
  const optionIndices = [];
  while (i >= 0 && pattern.test(lines[i].trim())) {
    optionIndices.unshift(i);
    i--;
  }

  // 全行が短い（選択肢らしい）場合のみオプション扱い
  const MAX_OPTION_LENGTH = 40;
  const allShort = optionIndices.every(idx => lines[idx].trim().length <= MAX_OPTION_LENGTH);

  if (!allShort || optionIndices.length === 0) {
    return { cleanText: text.trim(), options: [] };
  }

  const options = [];
  for (const idx of optionIndices) {
    const match = lines[idx].trim().match(pattern);
    if (match) {
      options.push({ number: match[1], label: match[2].trim() });
    }
  }

  const cleanText = lines.filter((_, idx) => !optionIndices.includes(idx)).join('\n').trim();
  return { cleanText, options };
}

function addMessage(role, text) {
  const div = document.createElement('div');
  div.className = `chat-message ${role}`;

  if (role === 'assistant') {
    // トレーニングプランの場合は構造化レンダリング
    if (isTrainingPlan(text)) {
      div.innerHTML = renderTrainingContent(text);
    } else if (text.includes('class="step-block"') || text.includes('class="stop-block"')) {
      div.innerHTML = text;
    } else if (isRecoveryContent(text)) {
      div.innerHTML = renderRecoveryContent(text);
    } else if (isNutritionResponse(text) && window.NutritionDB) {
      // 栄養提案: [ITEMS:]→PFCバッジ変換
      const { cleanText: textWithoutOpts, options } = parseOptions(text);
      const processed = renderNutritionWithPFC(textWithoutOpts);
      div.innerHTML = processed;

      let finalOpts = options;
      if (finalOpts.length === 0) {
        finalOpts = [
          { number: '1', label: '第一候補のレシピを見る' },
          { number: '2', label: '第二候補のレシピを見る' },
          { number: '3', label: 'これならOKのレシピを見る' }
        ];
      }
      if (finalOpts.length > 0) {
        const btnGroup = document.createElement('div');
        btnGroup.className = 'option-buttons';
        finalOpts.forEach(opt => {
          const btn = document.createElement('button');
          btn.className = 'option-btn';
          btn.textContent = `${opt.number}. ${opt.label}`;
          btn.addEventListener('click', () => {
            chatInput.value = `${opt.number}. ${opt.label}`;
            sendUserMessage();
          });
          btnGroup.appendChild(btn);
        });
        div.appendChild(btnGroup);
      }
    } else {
      const { cleanText, options } = parseOptions(text);
      div.innerHTML = escapeHtml(cleanText).replace(/\n/g, '<br>');

      let finalOpts = options;
      if (finalOpts.length > 0) {
        const btnGroup = document.createElement('div');
        btnGroup.className = 'option-buttons';
        finalOpts.forEach(opt => {
          const btn = document.createElement('button');
          btn.className = 'option-btn';
          btn.textContent = `${opt.number}. ${opt.label}`;
          btn.addEventListener('click', () => {
            chatInput.value = `${opt.number}. ${opt.label}`;
            sendUserMessage();
          });
          btnGroup.appendChild(btn);
        });
        div.appendChild(btnGroup);
      }
    }
  } else {
    div.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
  }

  chatHistory.appendChild(div);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function createSubButtons(goal, method) {
  subButtons.innerHTML = '';
  const options = subOptions[goal][method];
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerHTML = `<span class="btn-text">${escapeHtml(opt)}</span><span class="btn-arrow">→</span>`;
    btn.addEventListener('click', () => {
      selectedSub = opt;
      highlightButton(subSection, btn);
      generateResponse();
    });
    subButtons.appendChild(btn);
  });

  if (selectedMethod !== 'nutrition') {
    const otherBtn = document.createElement('button');
    otherBtn.className = 'choice-btn';
    otherBtn.style.borderStyle = 'dashed';
    otherBtn.innerHTML = `<span class="btn-text">${escapeHtml('その他（自由入力）')}</span><span class="btn-arrow">→</span>`;
    otherBtn.addEventListener('click', () => {
      otherBtn.style.display = 'none';
      const inputWrap = document.createElement('div');
      inputWrap.style.cssText = 'display:flex; gap:8px; padding:8px 0;';
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = '自由に入力してください';
      input.style.cssText = 'flex:1; padding:10px; border-radius:8px; border:1px solid #444; background:#1a1a1a; color:#fff; font-size:14px;';
      const submitBtn = document.createElement('button');
      submitBtn.textContent = '決定';
      submitBtn.style.cssText = 'padding:10px 16px; border-radius:8px; border:none; background:#c8f135; color:#000; font-weight:700; cursor:pointer; font-size:14px;';
      submitBtn.addEventListener('click', () => {
        const val = input.value.trim();
        if (!val) return;
        selectedSub = val;
        highlightButton(subSection, otherBtn);
        generateResponse();
      });
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitBtn.click(); });
      inputWrap.appendChild(input);
      inputWrap.appendChild(submitBtn);
      subButtons.appendChild(inputWrap);
      input.focus();
    });
    subButtons.appendChild(otherBtn);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================
// トレーニングプラン構造化レンダリング
// ============================================================
function isTrainingPlan(text) {
  // マーカー形式
  if (text.includes('COURSE_FIRE::') && text.includes('COURSE_END')) return true;
  // 旧形式フォールバック
  var courseCount = [/🔥/, /💪/, /⚡/].filter(function(r){ return r.test(text); }).length;
  return courseCount >= 2;
}

function renderTrainingContent(text) {
  // 旧形式フォールバック
  if (!text.includes('COURSE_FIRE::')) {
    return renderTrainingLegacy(text);
  }

  var css = '<style>' +
    '.tr-wrap{max-width:640px;padding:.5rem 0;font-family:var(--font-sans)}' +
    '.tr-course{border-radius:16px;background:var(--color-background-primary);border:.5px solid var(--color-border-tertiary);margin-bottom:16px;overflow:hidden}' +
    '.tr-head{padding:13px 18px;display:flex;align-items:center;gap:10px}' +
    '.tr-head.fire{background:linear-gradient(135deg,#993C1D,#D85A30)}' +
    '.tr-head.std{background:linear-gradient(135deg,#1a4a7a,#2a7acc)}' +
    '.tr-head.ok{background:linear-gradient(135deg,#3B6D11,#639922)}' +
    '.tr-badge{font-size:11px;font-weight:500;padding:3px 10px;border-radius:20px}' +
    '.tr-badge.fire,.tr-badge.ok{background:rgba(255,255,255,.2);color:#fff}' +
    '.tr-badge.std{background:rgba(255,255,255,.2);color:#fff}' +
    '.tr-title-f,.tr-title-o{font-size:15px;font-weight:500;color:#fff}' +
    '.tr-title-s{font-size:15px;font-weight:500;color:#fff}' +
    '.tr-time-f,.tr-time-o{margin-left:auto;font-size:12px;color:rgba(255,255,255,.75)}' +
    '.tr-time-s{margin-left:auto;font-size:12px;color:rgba(255,255,255,.75)}' +
    '.tr-sec{display:flex;align-items:center;gap:8px;padding:10px 18px 4px}' +
    '.tr-sec-lbl{font-size:11px;font-weight:500;color:var(--color-text-secondary);letter-spacing:.06em;text-transform:uppercase}' +
    '.tr-sec-line{flex:1;height:.5px;background:var(--color-border-tertiary)}' +
    '.tr-ex{padding:10px 18px 12px;border-bottom:.5px solid var(--color-border-tertiary)}' +
    '.tr-ex-top{display:flex;align-items:center;gap:10px;margin-bottom:8px}' +
    '.tr-idx{width:22px;height:22px;border-radius:50%;background:var(--color-background-secondary);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:500;color:var(--color-text-secondary);flex-shrink:0}' +
    '.tr-ex-name{font-size:14px;font-weight:500;color:var(--color-text-primary)}' +
    '.tr-chips{display:flex;gap:6px;margin-left:auto;flex-wrap:wrap;justify-content:flex-end}' +
    '.tr-chip{font-size:11px;padding:2px 8px;border-radius:20px;background:var(--color-background-secondary);color:var(--color-text-secondary);white-space:nowrap}' +
    '.tr-ex-body{padding-left:32px;display:grid;grid-template-columns:48px 1fr;gap:3px 8px}' +
    '.tr-lbl{font-size:11px;color:var(--color-text-tertiary);padding-top:2px}' +
    '.tr-val{font-size:12px;color:var(--color-text-secondary);line-height:1.5}' +
    '.tr-rpe{padding-left:32px;margin-top:4px;font-size:11px;color:var(--color-text-tertiary)}' +
    '.tr-simple{padding:9px 18px;display:flex;align-items:center;gap:10px;border-bottom:.5px solid var(--color-border-tertiary)}' +
    '.tr-simple:last-child{border-bottom:none}' +
    '.tr-simple-name{font-size:13px;color:var(--color-text-primary)}' +
    '.tr-simple-meta{margin-left:auto;font-size:12px;color:var(--color-text-secondary);white-space:nowrap}' +
    '.tr-aerobic{margin:8px 18px 14px;border-radius:10px;background:var(--color-background-secondary);padding:10px 14px;display:flex;justify-content:space-between;align-items:center}' +
    '.tr-aerobic-name{font-size:13px;font-weight:500;color:var(--color-text-primary)}' +
    '.tr-aerobic-detail{font-size:12px;color:var(--color-text-secondary);margin-top:2px}' +
    '.tr-alt{margin:0 18px 14px;padding:10px 14px;background:var(--color-background-secondary);border-radius:10px;font-size:12px;color:var(--color-text-secondary)}' +
    '.tr-alt-title{font-size:11px;font-weight:500;color:var(--color-text-tertiary);margin-bottom:6px;letter-spacing:.05em}' +
    '</style>';

  var lines = text.split('\n');
  var html = css + '<div class="tr-wrap">';

  var inCourse = false;
  var courseType = '';
  var inEx = false;
  var isDetail = false;
  var exNum = 0;
  var cur = {};
  var alts = [];
  var hasAerobic = false;

  function flushEx() {
    if (!cur.name) return;
    if (isDetail) {
      html += '<div class="tr-ex"><div class="tr-ex-top">' +
        '<div class="tr-idx">' + exNum + '</div>' +
        '<span class="tr-ex-name">' + escapeHtml(cur.name) + '</span>' +
        '<div class="tr-chips">' +
        (cur.sets ? '<span class="tr-chip">' + escapeHtml(cur.sets) + '</span>' : '') +
        (cur.rest ? '<span class="tr-chip">休憩 ' + escapeHtml(cur.rest) + '</span>' : '') +
        '</div></div>' +
        '<div class="tr-ex-body">' +
        (cur.pose ? '<span class="tr-lbl">姿勢</span><span class="tr-val">' + escapeHtml(cur.pose) + '</span>' : '') +
        (cur.move ? '<span class="tr-lbl">動作</span><span class="tr-val">' + escapeHtml(cur.move) + '</span>' : '') +
        (cur.feel ? '<span class="tr-lbl">効く</span><span class="tr-val">' + escapeHtml(cur.feel) + '</span>' : '') +
        (cur.note ? '<span class="tr-lbl">注意</span><span class="tr-val">' + escapeHtml(cur.note) + '</span>' : '') +
        '</div>' +
        (cur.rpe ? '<div class="tr-rpe">' + escapeHtml(cur.rpe) + '</div>' : '') +
        '</div>';
    } else {
      var meta = [cur.sets, cur.rest ? '休憩 ' + cur.rest : ''].filter(Boolean).join('｜');
      html += '<div class="tr-simple">' +
        '<div class="tr-idx">' + exNum + '</div>' +
        '<span class="tr-simple-name">' + escapeHtml(cur.name) + '</span>' +
        (meta ? '<span class="tr-simple-meta">' + escapeHtml(meta) + '</span>' : '') +
        '</div>';
    }
    cur = {};
    inEx = false;
  }

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;

    // コース開始
    var cm = line.match(/^COURSE_(FIRE|STD|OK)::(.+?)::(\d+分)$/);
    if (cm) {
      inCourse = true;
      courseType = cm[1].toLowerCase();
      isDetail = courseType === 'fire';
      exNum = 0;
      hasAerobic = false;
      var badge = courseType === 'fire' ? '追い込む' : courseType === 'ok' ? 'これだけでもOK' : 'スタンダード';
      var title = courseType === 'fire' ? 'しっかり追い込むコース' : courseType === 'ok' ? 'これだけでもOKコース' : 'スタンダードコース';
      var tsuf = courseType === 'fire' ? 'f' : courseType === 'ok' ? 'o' : 's';
      html += '<div class="tr-course"><div class="tr-head ' + courseType + '">' +
        '<span class="tr-badge ' + courseType + '">' + badge + '</span>' +
        '<span class="tr-title-' + tsuf + '">' + title + '</span>' +
        '<span class="tr-time-' + tsuf + '">' + cm[3] + '</span>' +
        '</div>';
      html += '<div class="tr-sec"><span class="tr-sec-lbl">筋トレ</span><div class="tr-sec-line"></div></div>';
      continue;
    }

    // コース終了
    if (line === 'COURSE_END') {
      flushEx();
      if (!hasAerobic) {
        // 有酸素なし
      }
      html += '</div>';
      inCourse = false;
      continue;
    }

    // 種目開始: EX::名前::回数::休憩
    var em = line.match(/^EX::(.+?)::(.+?)::(.+)$/);
    if (em) {
      flushEx();
      exNum++;
      cur = { name: em[1], sets: em[2], rest: em[3].replace(/^休憩\s*/, ''), pose:'', move:'', feel:'', note:'', rpe:'' };
      inEx = true;
      continue;
    }

    // 種目終了
    if (line === 'EX_END') {
      flushEx();
      continue;
    }

    // 有酸素
    var am = line.match(/^AEROBIC::(.+?)::(.+?)::(\d+分)$/);
    if (am) {
      flushEx();
      hasAerobic = true;
      html += '<div class="tr-sec"><span class="tr-sec-lbl">有酸素</span><div class="tr-sec-line"></div></div>' +
        '<div class="tr-aerobic"><div>' +
        '<div class="tr-aerobic-name">' + escapeHtml(am[1]) + '</div>' +
        '<div class="tr-aerobic-detail">' + escapeHtml(am[2]) + '</div>' +
        '</div><div style="font-size:12px;color:var(--color-text-secondary)">' + escapeHtml(am[3]) + '</div></div>';
      continue;
    }

    // 代替案
    var altm = line.match(/^ALT::(.+?)::(.+)$/);
    if (altm) {
      alts.push({ alt: altm[1], orig: altm[2] });
      continue;
    }

    // 種目フィールド
    if (inEx && isDetail) {
      var fm = line.match(/^(姿勢|動作|効く|注意|RPE)::(.+)$/);
      if (fm) {
        var key = fm[1], val = fm[2];
        if (key === '姿勢') cur.pose = val;
        else if (key === '動作') cur.move = val;
        else if (key === '効く') cur.feel = val;
        else if (key === '注意') cur.note = val;
        else if (key === 'RPE') cur.rpe = val;
      }
    }
  }

  // 代替案
  if (alts.length) {
    html += '<div class="tr-alt"><div class="tr-alt-title">代替案（器具がない場合）</div>';
    alts.forEach(function(a) {
      html += '<div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:4px">' +
        escapeHtml(a.orig) + ' → <span style="color:var(--color-text-primary)">' + escapeHtml(a.alt) + '</span></div>';
    });
    html += '</div>';
  }

  html += '</div>';
  return html;
}

function renderTrainingLegacy(text) {
  return escapeHtml(text).replace(/\n/g, '<br>');
}


function isRecoveryContent(text) {
  return text.includes('STEP_END') && text.includes('STOP_START');
}

function stripMd(s) {
  return s.replace(/\*\*/g, '').replace(/^\s*[-・]\s*/, '').trim();
}

function renderRecoveryContent(text) {
  var css = '<style>' +
    '.rc-wrap{max-width:640px;padding:.5rem 0;font-family:var(--font-sans)}' +
    '.rc-step{border-radius:16px;background:var(--color-background-primary);border:.5px solid var(--color-border-tertiary);margin-bottom:12px;overflow:hidden}' +
    '.rc-head{padding:12px 18px;display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,#0C447C,#378ADD)}' +
    '.rc-num{width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:500;color:#fff;flex-shrink:0}' +
    '.rc-sname{font-size:15px;font-weight:500;color:#fff;flex:1}' +
    '.rc-time{font-size:12px;color:rgba(255,255,255,.75);white-space:nowrap}' +
    '.rc-body{padding:12px 18px;display:grid;grid-template-columns:48px 1fr;gap:4px 10px}' +
    '.rc-lbl{font-size:11px;color:var(--color-text-tertiary);padding-top:2px}' +
    '.rc-val{font-size:13px;color:var(--color-text-secondary);line-height:1.6}' +
    '.rc-feel{margin:4px 18px 12px;padding:8px 12px;background:var(--color-background-secondary);border-radius:8px;font-size:12px;color:var(--color-text-secondary);display:flex;align-items:center;gap:8px}' +
    '.rc-dot{width:6px;height:6px;border-radius:50%;background:#378ADD;flex-shrink:0}' +
    '.rc-bath{margin:8px 18px 14px;border-radius:10px;background:var(--color-background-secondary);padding:10px 14px;display:flex;justify-content:space-between;align-items:center}' +
    '.rc-bath-name{font-size:13px;font-weight:500;color:var(--color-text-primary)}' +
    '.rc-bath-detail{font-size:12px;color:var(--color-text-secondary);margin-top:2px}' +
    '.rc-stop{border-radius:16px;background:var(--color-background-primary);border:.5px solid var(--color-border-tertiary);overflow:hidden;margin-bottom:12px}' +
    '.rc-stop-head{padding:12px 18px;background:var(--color-background-secondary);border-bottom:.5px solid var(--color-border-tertiary);font-size:13px;font-weight:500;color:var(--color-text-primary)}' +
    '.rc-stop-item{padding:10px 18px;display:flex;align-items:flex-start;gap:10px;border-bottom:.5px solid var(--color-border-tertiary)}' +
    '.rc-stop-item:last-child{border-bottom:none}' +
    '.rc-x{width:18px;height:18px;border-radius:50%;background:#FCEBEB;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;font-size:10px;color:#A32D2D;font-weight:500}' +
    '.rc-stop-text{font-size:13px;color:var(--color-text-secondary);line-height:1.5}' +
    '.rc-stop-reason{font-size:11px;color:var(--color-text-tertiary);margin-top:2px}' +
    '.rc-disclaimer{padding:10px 18px;font-size:11px;color:var(--color-text-tertiary);border-top:.5px solid var(--color-border-tertiary)}' +
    '</style>';

  var lines = text.split('\n');
  var html = css + '<div class="rc-wrap">';
  var stepNum = 0;
  var inStep = false;
  var inStop = false;
  var cur = {};
  var stopItems = [];
  var bathData = null;
  var disclaimer = '';

  function flushStep() {
    if (!cur.name) return;
    html += '<div class="rc-step"><div class="rc-head">' +
      '<div class="rc-num">' + stepNum + '</div>' +
      '<span class="rc-sname">' + escapeHtml(cur.name) + '</span>' +
      (cur.time ? '<span class="rc-time">' + escapeHtml(cur.time) + '</span>' : '') +
      '</div>';
    var hasBody = cur.pose || cur.move || cur.feel || cur.count;
    if (hasBody) {
      html += '<div class="rc-body">' +
        (cur.pose ? '<span class="rc-lbl">姿勢</span><span class="rc-val">' + escapeHtml(cur.pose) + '</span>' : '') +
        (cur.move ? '<span class="rc-lbl">動作</span><span class="rc-val">' + escapeHtml(cur.move) + '</span>' : '') +
        (cur.feel ? '<span class="rc-lbl">感覚</span><span class="rc-val">' + escapeHtml(cur.feel) + '</span>' : '') +
        (cur.count ? '<span class="rc-lbl">回数</span><span class="rc-val">' + escapeHtml(cur.count) + '</span>' : '') +
        '</div>';
    }
    if (cur.extra) {
      html += '<div class="rc-feel"><div class="rc-dot"></div>' + escapeHtml(cur.extra) + '</div>';
    }
    html += '</div>';
    cur = {};
    inStep = false;
  }

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;

    // STEP開始: STEP1::名前::時間
    var stepM = line.match(/^STEP\d+::(.+?)::(\d+分)?$/);
    if (stepM) {
      flushStep();
      inStep = true;
      inStop = false;
      stepNum++;
      cur = { name: stepM[1].trim(), time: stepM[2] || '', pose:'', move:'', feel:'', count:'', extra:'' };
      continue;
    }

    // STEP終了
    if (line === 'STEP_END') {
      flushStep();
      continue;
    }

    // BATH
    var bathM = line.match(/^BATH::(.+?)::(\d+分)$/);
    if (bathM) {
      bathData = { detail: bathM[1], time: bathM[2] };
      continue;
    }

    // やめること開始
    if (line === 'STOP_START') {
      flushStep();
      inStop = true;
      inStep = false;
      continue;
    }

    // やめること終了
    if (line === 'STOP_END') {
      inStop = false;
      continue;
    }

    // 免責文
    if (/^DISCLAIMER|^※\s*AI/.test(line)) {
      disclaimer = /^DISCLAIMER$/.test(line)
        ? '※ AIによる提案のため個人差があります。痛みや不調が続く場合は医療機関にご相談ください。'
        : line;
      continue;
    }

    // STEPの各フィールド
    if (inStep) {
      var fm = line.match(/^(姿勢|動作|感覚|回数|根拠)::(.+)$/);
      if (fm) {
        var key = fm[1], val = fm[2].trim();
        if (key === '姿勢') cur.pose = val;
        else if (key === '動作') cur.move = val;
        else if (key === '感覚') cur.feel = val;
        else if (key === '回数') cur.count = val;
        else if (key === '根拠') cur.extra = val;
      }
      continue;
    }

    // やめることの項目
    if (inStop) {
      var sm = line.match(/^❌\s*(.+?)::(.+)$/);
      if (sm) stopItems.push({ text: sm[1].trim(), reason: sm[2].trim() });
      else if (/^❌/.test(line)) stopItems.push({ text: line.replace(/^❌\s*/, '').trim(), reason: '' });
      continue;
    }
  }

  // BATH
  if (bathData) {
    html += '<div style="display:flex;align-items:center;gap:8px;padding:10px 0 4px">' +
      '<div style="flex:1;height:.5px;background:var(--color-border-tertiary)"></div>' +
      '<span style="font-size:11px;font-weight:500;color:var(--color-text-secondary);letter-spacing:.06em">別枠</span>' +
      '<div style="flex:1;height:.5px;background:var(--color-border-tertiary)"></div></div>' +
      '<div class="rc-bath"><div>' +
      '<div class="rc-bath-name">入浴</div>' +
      '<div class="rc-bath-detail">' + escapeHtml(bathData.detail) + ' — 時間があれば終了後に</div>' +
      '</div><div style="font-size:12px;color:var(--color-text-secondary)">' + escapeHtml(bathData.time) + '</div></div>';
  }

  // やめること
  if (stopItems.length) {
    html += '<div class="rc-stop"><div class="rc-stop-head">やめること</div>';
    stopItems.forEach(function(item) {
      html += '<div class="rc-stop-item"><div class="rc-x">x</div><div>' +
        '<div class="rc-stop-text">' + escapeHtml(item.text) + '</div>' +
        (item.reason ? '<div class="rc-stop-reason">' + escapeHtml(item.reason) + '</div>' : '') +
        '</div></div>';
    });
    if (disclaimer) html += '<div class="rc-disclaimer">' + escapeHtml(disclaimer) + '</div>';
    html += '</div>';
  } else if (disclaimer) {
    html += '<div style="padding:6px 0;font-size:11px;color:var(--color-text-tertiary)">' + escapeHtml(disclaimer) + '</div>';
  }

  html += '</div>';
  return html;
}

async function callAPI(messages) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({ messages })
  });
  if (!response.ok) throw new Error(`APIエラー: ${response.status}`);
  const data = await response.json();
  console.log('API response:', data);
  if (data.error) throw new Error(`API: ${data.error.message || JSON.stringify(data.error)}`);
  if (!data.content) throw new Error('APIレスポンスにcontentがありません');
  await incrementOnSuccess();
  return data.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n');
}

async function generateResponse() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data: serviceData, error: serviceError } = await supabase
    .from('service_settings')
    .select('value')
    .eq('key', 'service_active')
    .maybeSingle();

  console.log('サービス状態:', serviceData, serviceError);

  if (serviceData?.value === 'false') {
    alert('現在サービスを停止中です。しばらくお待ちください。');
    return;
  }

  const { data: blockData } = await supabase
    .from('blocked_users')
    .select('user_id')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (blockData) {
    alert('ご利用が制限されています。管理者にお問い合わせください。');
    return;
  }

  const count = await getUsageCount(session.user.id);
  if (count >= DAILY_LIMIT) {
    alert('本日の利用回数が上限（100回）に達しました。明日またご利用ください。');
    return;
  }

  const { data: history } = await supabase
    .from('chat_history')
    .select('messages')
    .eq('user_id', session.user.id)
    .eq('goal', selectedGoal)
    .eq('method', selectedMethod)
    .eq('sub', selectedSub)
    .order('created_at', { ascending: false })
    .limit(5);

  const pastSummary = history && history.length > 0
    ? '【過去に提案した内容】\n' + history.map((h, i) => {
        const aiMsg = h.messages.find(m => m.role === 'assistant');
        return aiMsg ? `${i+1}回目: ${aiMsg.content.slice(0, 200)}...` : '';
      }).filter(Boolean).join('\n')
    : '';

  showSection(aiResponse);
  loadingIndicator.classList.remove('hidden');
  chatHistory.innerHTML = '';
  conversationHistory = [];
  resetBtn.classList.add('hidden');
  chatInputArea.classList.add('hidden');

  const goalPrompt   = PROMPTS.goal[selectedGoal];
  const methodPrompt = PROMPTS.method[selectedMethod];
  const detailPrompt = PROMPTS.detail[selectedGoal]?.[selectedMethod]?.[selectedSub]
    || `ユーザーの要望:「${selectedSub}」に合わせて提案してください。科学的根拠のない提案は禁止です。`;

  if (!goalPrompt || !methodPrompt) {
    loadingIndicator.classList.add('hidden');
    addMessage('assistant', 'プロンプトの読み込みに失敗しました。');
    resetBtn.classList.remove('hidden');
    return;
  }

  const pastInfo = pastSummary
    ? `\n\n${pastSummary}\n\n上記の過去の提案と被らないよう、新しい内容を提案してください。`
    : '';
  let userCtx = cachedUserContext || '';
  try { if (!userCtx) userCtx = await buildUserContext(); } catch (e) { console.warn('コンテキスト構築失敗:', e); }
  const goalLabel = { '1': '体脂肪減少', '2': '筋肥大', '3': '体力向上', '4': '不調改善', '5': '見た目改善' };
  const goalTag = `【現在の目的番号: ${selectedGoal}「${goalLabel[selectedGoal] || ''}」】\n`;
  const finalPrompt = `${userCtx}\n${goalTag}${goalPrompt}\n\n${methodPrompt}\n\n${detailPrompt}${pastInfo}`;
  conversationHistory.push({ role: 'user', content: finalPrompt });

  loadingIndicator.classList.add('hidden');

  if (selectedMethod === 'nutrition') {
    showNutritionQuestions();
  } else if (selectedMethod === 'training') {
    showTrainingQuestions();
  } else if (selectedMethod === 'recovery') {
    showRecoveryQuestions();
  }

  resetBtn.classList.remove('hidden');
}

async function sendUserMessage() {
  const userText = chatInput.value.trim();
  if (!userText) return;
  chatInput.value = '';
  addMessage('user', userText);
  conversationHistory.push({ role: 'user', content: userText });
  loadingIndicator.classList.remove('hidden');
  chatSendBtn.disabled = true;
  try {
    // ストリーミング対応
    loadingIndicator.classList.add('hidden');
    const streamDiv = addStreamingMessage();
    let text;
    try {
      text = await callAPIStream(conversationHistory, (partial) => {
        updateStreamingMessage(streamDiv, partial);
      });
      finalizeStreamingMessage(streamDiv, text);
    } catch (streamErr) {
      console.warn('ストリーミング失敗、フォールバック:', streamErr);
      streamDiv.remove();
      loadingIndicator.classList.remove('hidden');
      text = await callAPI(conversationHistory);
      loadingIndicator.classList.add('hidden');
      addMessage('assistant', text);
    }
    conversationHistory.push({ role: 'assistant', content: text });

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { error: saveError } = await supabase.from('chat_history').insert({
        user_id: session.user.id,
        goal: selectedGoal,
        method: selectedMethod,
        sub: selectedSub,
        messages: conversationHistory
      });
      console.log('chat_history保存結果(sendUserMessage):', saveError);
      loadDashboard();
    }
  } catch (error) {
    loadingIndicator.classList.add('hidden');
    addMessage('assistant', '【エラー】通信に失敗しました。');
    console.error(error);
  }
  chatSendBtn.disabled = false;
}

goalSection.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedGoal   = btn.dataset.goal;
    selectedMethod = null;
    selectedSub    = null;
    conversationHistory = [];
    questionAnswers = [];
    currentQuestionIndex = 0;
    trainingPhase = 'base';
    baseAnswers = [];
    chatHistory.innerHTML = '';
    chatInputArea.classList.add('hidden');
    resetBtn.classList.add('hidden');
    highlightButton(goalSection, btn);
    updateStepIndicator(2);
    showSection(methodSection);
    hideSection(subSection);
    hideSection(aiResponse);
  });
});

methodSection.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedMethod = btn.dataset.method;
    selectedSub    = null;
    highlightButton(methodSection, btn);
    updateStepIndicator(3);
    createSubButtons(selectedGoal, selectedMethod);
    showSection(subSection);
    hideSection(aiResponse);
  });
});

chatSendBtn.addEventListener('click', sendUserMessage);

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendUserMessage();
});

resetBtn.addEventListener('click', () => {
  selectedGoal   = null;
  selectedMethod = null;
  selectedSub    = null;
  conversationHistory = [];
  questionAnswers = [];
  currentQuestionIndex = 0;
  trainingPhase = 'base';
  baseAnswers = [];
  hideSection(methodSection);
  hideSection(subSection);
  hideSection(aiResponse);
  goalSection.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
  updateStepIndicator(1);
  chatHistory.innerHTML = '';
  chatInputArea.classList.add('hidden');
  resetBtn.classList.add('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ============================================================
// ダッシュボード
// ============================================================
async function loadDashboard() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const userId = session.user.id;

  const { data: usageData } = await supabase
    .from('usage_limits')
    .select('date, count')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  const { data: bodyDatesData } = await supabase
    .from('body_records')
    .select('recorded_at')
    .eq('user_id', userId);

  const activeDates = new Set();
  (usageData || []).filter(r => r.count > 0).forEach(r => activeDates.add(r.date));
  (bodyDatesData || []).forEach(r => {
    if (r.recorded_at) activeDates.add(r.recorded_at);
  });

  let streak = 0;
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (activeDates.has(todayStr)) {
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (activeDates.has(dateStr)) { streak++; } else { break; }
    }
  } else if (activeDates.has(yesterdayStr)) {
    for (let i = 1; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (activeDates.has(dateStr)) { streak++; } else { break; }
    }
  }

  document.getElementById('streak-count').textContent = streak;
  currentStreak = streak;

  const totalDays = activeDates.size;

  const STREAK_BADGES = [
    { min: 30, icon: '🔥', label: '30日連続！' },
    { min: 14, icon: '⚡', label: '14日連続！' },
    { min: 7,  icon: '🏆', label: '7日連続！' },
    { min: 3,  icon: '💪', label: '3日連続！' },
    { min: 1,  icon: '🌱', label: '継続中！' },
  ];

  const TOTAL_TITLES = [
    { min: 100, icon: '👑', title: 'レジェンド',   desc: '累計100日。もはや伝説の領域。' },
    { min: 60,  icon: '💎', title: '鋼の意志',     desc: '累計60日。折れない心が証明された。' },
    { min: 30,  icon: '🔥', title: '限界突破',     desc: '累計30日。限界を超えた者だけが知る境地。' },
    { min: 14,  icon: '⚡', title: '不屈の闘志',   desc: '累計14日。本物の習慣が刻まれ始めた。' },
    { min: 7,   icon: '🏆', title: '鉄の習慣',     desc: '累計7日。1週間完遂。これが本物の始まり。' },
    { min: 3,   icon: '💪', title: '継続の芽',     desc: '累計3日。習慣の種が芽吹いた。' },
    { min: 1,   icon: '🌱', title: '入門者',       desc: '最初の一歩を踏み出した。全ての伝説はここから始まる。' },
  ];
  const NEXT_TITLES = [3, 7, 14, 30, 60, 100];

  const badgeEl = document.getElementById('streak-badge');

  if (streak >= 1 || totalDays >= 1) {
    const streakBadge = STREAK_BADGES.find(b => streak >= b.min);
    const streakBadgeHtml = streakBadge
      ? `<div style="display:inline-flex; align-items:center; gap:6px; background:#1a2a1a; border:1px solid var(--accent); border-radius:100px; padding:5px 12px;">
           <span style="font-size:16px;">${streakBadge.icon}</span>
           <span style="font-size:12px; color:var(--accent); font-weight:700;">${streakBadge.label} ${streak}日連続</span>
         </div>`
      : `<div style="display:inline-flex; align-items:center; gap:6px; background:#1e1e1e; border:1px solid var(--border); border-radius:100px; padding:5px 12px;">
           <span style="font-size:14px;">😴</span>
           <span style="font-size:12px; color:var(--muted);">現在ストリーク途切れ中</span>
         </div>`;

    const currentTitle = TOTAL_TITLES.find(b => totalDays >= b.min);
    const nextTarget = NEXT_TITLES.find(n => n > totalDays);
    const nextTitle = nextTarget ? TOTAL_TITLES.find(b => b.min === nextTarget) : null;
    const nextHtml = nextTitle
      ? `<p style="font-size:11px; color:var(--muted); margin-top:6px;">次の称号まで <strong style="color:var(--white);">${nextTarget - totalDays}日</strong> → ${nextTitle.icon} <span style="color:var(--accent);">${nextTitle.title}</span></p>`
      : `<p style="font-size:11px; color:var(--accent); margin-top:6px;">全称号を制覇！伝説の継続者。👑</p>`;

    document.getElementById('streak-badge').innerHTML = `
      <div style="margin-bottom:10px;">${streakBadgeHtml}</div>
      <div style="display:flex; align-items:center; gap:12px; padding:12px; background:#111; border:1px solid var(--border); border-radius:10px;">
        <p style="font-size:28px; line-height:1;">${currentTitle ? currentTitle.icon : '🌱'}</p>
        <div>
          <p style="font-size:13px; font-weight:700; color:var(--accent);">${currentTitle ? currentTitle.title : '入門者'}</p>
          <p style="font-size:11px; color:var(--muted); margin-top:2px;">${currentTitle ? currentTitle.desc : '最初の一歩を踏み出した。'}</p>
          <p style="font-size:11px; color:var(--muted); margin-top:4px;">累計 <strong style="color:var(--white);">${totalDays}日</strong> 利用</p>
        </div>
      </div>
      ${nextHtml}
    `;
    badgeEl.style.display = 'block';
  } else {
    badgeEl.style.display = 'none';
  }

  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  const mondayStr = monday.toISOString().split('T')[0];
  const weeklyTotal = (usageData || [])
    .filter(r => r.date >= mondayStr)
    .reduce((sum, r) => sum + r.count, 0);
  document.getElementById('weekly-count').textContent = weeklyTotal;

  const mondayStart = `${mondayStr}T00:00:00`;
  const { data: chatData } = await supabase
    .from('chat_history')
    .select('method, created_at')
    .eq('user_id', userId)
    .gte('created_at', mondayStart);
  console.log('chatData:', chatData, 'mondayStr:', mondayStr);

  const methodCount = { nutrition: 0, training: 0, recovery: 0 };
  const methodLabel = { nutrition: '🥗 栄養', training: '🏋️ トレーニング', recovery: '😴 回復' };
  (chatData || []).forEach(h => {
    if (methodCount[h.method] !== undefined) methodCount[h.method]++;
  });

  const reportEl = document.getElementById('weekly-report');
  reportEl.innerHTML = Object.entries(methodCount).map(([key, val]) => `
    <div style="padding:10px 16px; background:#1e1e1e; border:1px solid var(--border); border-radius:10px; text-align:center;">
      <p style="font-size:20px; font-weight:700; color:var(--accent);">${val}</p>
      <p style="font-size:12px; color:var(--muted);">${methodLabel[key]}</p>
    </div>
  `).join('');

  const { data: records } = await supabase
    .from('body_records')
    .select('weight, body_fat, recorded_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  const historyEl = document.getElementById('record-history');
  if (historyEl) {
    if (records && records.length > 0) {
      renderRecordHistory(historyEl, records, 5);
    } else {
      historyEl.innerHTML = '<p style="color:var(--muted); font-size:13px;">記録なし</p>';
    }
  }

  const goal = await loadGoal(userId);

  const goalCurrentEl = document.getElementById('goal-current');
  if (goalCurrentEl) {
    if (goal) {
      const parts = [];
      if (goal.goal_weight) parts.push(`目標体重: ${goal.goal_weight}kg`);
      if (goal.goal_body_fat) parts.push(`目標体脂肪率: ${goal.goal_body_fat}%`);
      if (goal.target_date) {
        const daysLeft = Math.ceil((new Date(goal.target_date) - new Date()) / (1000*60*60*24));
        const _pt = localStorage.getItem(userKey('goal_period_type'));
        const _ptLabel = { short: '短期（約1か月）', standard: '中期（約3か月）', long: '長期（約6か月）' };
        if (_pt && _ptLabel[_pt]) {
          parts.push(`期間: ${_ptLabel[_pt]}（残り${daysLeft}日）`);
        } else {
          parts.push(`期限: ${goal.target_date}（残り${daysLeft}日）`);
        }
      }
      goalCurrentEl.innerHTML = parts.length > 0
        ? `現在の目標 → ${parts.join('　／　')}`
        : '';
    } else {
      goalCurrentEl.innerHTML = '';
    }
  }

  const progressCard = document.getElementById('progress-card');
  const progressContent = document.getElementById('progress-content');

  if (goal && records && records.length > 0) {
    const allRecords = await supabase
      .from('body_records')
      .select('weight, body_fat, recorded_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    const allRecordsList = allRecords.data || [];
    const startWeightRecord = allRecordsList.find(r => r.weight != null);
    const startBodyFatRecord = allRecordsList.find(r => r.body_fat != null);

    let gaugeHTML = '';

    if (goal.goal_weight != null) {
      const currentWeightRecord = records.find(r => r.weight != null);
      const currentWeight = currentWeightRecord ? currentWeightRecord.weight : null;
      const startWeight = startWeightRecord?.weight ?? null;
      if (currentWeight != null) {
        if (startWeight != null) {
          gaugeHTML += renderProgressGauge('体重', 'kg', startWeight, currentWeight, goal.goal_weight, 'var(--accent)');
        } else {
          const remaining = Math.abs(currentWeight - goal.goal_weight).toFixed(1);
          const isIncrease = goal.goal_weight > currentWeight;
          const reached = isIncrease ? currentWeight >= goal.goal_weight : currentWeight <= goal.goal_weight;
          gaugeHTML += `<p style="font-size:13px; color:var(--muted); margin-bottom:12px;">体重: 現在 <strong style="color:var(--white);">${currentWeight}kg</strong> → 目標 <strong style="color:var(--accent);">${goal.goal_weight}kg</strong>　${reached ? '目標達成！🎉' : `あと ${remaining}kg`}</p>`;
        }
      } else {
        gaugeHTML += `<p style="font-size:13px; color:var(--muted); margin-bottom:12px;">体重: 目標 <strong style="color:var(--accent);">${goal.goal_weight}kg</strong>　（記録なし）</p>`;
      }
    }

    if (goal.goal_body_fat != null) {
      const currentBodyFatRecord = records.find(r => r.body_fat != null);
      const currentBodyFat = currentBodyFatRecord ? currentBodyFatRecord.body_fat : null;
      const startBodyFat = startBodyFatRecord?.body_fat ?? null;
      if (currentBodyFat != null) {
        if (startBodyFat != null) {
          gaugeHTML += renderProgressGauge('体脂肪率', '%', startBodyFat, currentBodyFat, goal.goal_body_fat, '#4fc3f7');
        } else {
          const remaining = Math.abs(currentBodyFat - goal.goal_body_fat).toFixed(1);
          const isIncrease = goal.goal_body_fat > currentBodyFat;
          const reached = isIncrease ? currentBodyFat >= goal.goal_body_fat : currentBodyFat <= goal.goal_body_fat;
          gaugeHTML += `<p style="font-size:13px; color:var(--muted); margin-bottom:12px;">体脂肪率: 現在 <strong style="color:var(--white);">${currentBodyFat}%</strong> → 目標 <strong style="color:#4fc3f7;">${goal.goal_body_fat}%</strong>　${reached ? '目標達成！🎉' : `あと ${remaining}%`}</p>`;
        }
      } else {
        gaugeHTML += `<p style="font-size:13px; color:var(--muted); margin-bottom:12px;">体脂肪率: 目標 <strong style="color:#4fc3f7;">${goal.goal_body_fat}%</strong>　（記録なし）</p>`;
      }
    }

    if (gaugeHTML && progressCard && progressContent) {
      progressCard.style.display = 'block';
      progressContent.innerHTML = gaugeHTML;
    } else if (progressCard) {
      progressCard.style.display = 'none';
    }
  } else if (progressCard) {
    progressCard.style.display = 'none';
  }

  const { data: unlockData } = await supabase
    .from('user_unlocks')
    .select('feature')
    .eq('user_id', userId);
  unlockedFeatures = new Set((unlockData || []).map(u => u.feature));

  if (streak >= UNLOCK_PERSONAL_ANALYSIS && !unlockedFeatures.has('personal_analysis')) {
    await supabase.from('user_unlocks').upsert(
      { user_id: userId, feature: 'personal_analysis' },
      { onConflict: 'user_id,feature' }
    );
    unlockedFeatures.add('personal_analysis');
  }
  if (streak >= UNLOCK_BODY_DIAGNOSIS && !unlockedFeatures.has('body_diagnosis')) {
    await supabase.from('user_unlocks').upsert(
      { user_id: userId, feature: 'body_diagnosis' },
      { onConflict: 'user_id,feature' }
    );
    unlockedFeatures.add('body_diagnosis');
  }

  updateUnlockUI(streak);
}

async function loadGoal(userId) {
  let { data, error } = await supabase
    .from('user_goals')
    .select('goal_weight, goal_body_fat, target_date')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    const res = await supabase
      .from('user_goals')
      .select('goal_weight, goal_body_fat')
      .eq('user_id', userId)
      .maybeSingle();
    data = res.data;
  }
  return data || null;
}

async function saveGoal(userId, goalWeight, goalBodyFat, targetDate) {
  const row = { user_id: userId, goal_weight: goalWeight, goal_body_fat: goalBodyFat };
  if (targetDate) row.target_date = targetDate;
  await supabase
    .from('user_goals')
    .upsert(row, { onConflict: 'user_id' });
}

// 期間選択ボタン
document.querySelectorAll('.goal-period-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    _goalPeriodType = btn.dataset.period;
    document.querySelectorAll('.goal-period-btn').forEach(b => {
      b.style.borderColor = 'var(--border)';
      b.style.background = 'var(--card)';
      b.querySelector('.period-label').style.color = 'var(--white)';
    });
    btn.style.borderColor = '#c8f135';
    btn.style.background = 'rgba(200,241,53,0.08)';
    btn.querySelector('.period-label').style.color = '#c8f135';
  });
});

document.getElementById('goal-save-btn')?.addEventListener('click', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const goalWeight = parseFloat(document.getElementById('goal-weight-input').value) || null;
  const goalBodyFat = parseFloat(document.getElementById('goal-bodyfat-input').value) || null;
  if (!goalWeight && !goalBodyFat) { alert('目標体重か目標体脂肪率を入力してください'); return; }

  // 期間選択 → target_date を計算
  const periodWeeksMap = { short: 4, standard: 12, long: 24 };
  const weeks = periodWeeksMap[_goalPeriodType] || 12;
  const targetDateObj = new Date();
  targetDateObj.setDate(targetDateObj.getDate() + weeks * 7);
  const targetDate = targetDateObj.toISOString().split('T')[0];

  // 期間タイプを localStorage に保存
  if (_goalPeriodType) {
    localStorage.setItem(userKey('goal_period_type'), _goalPeriodType);
  }

  await saveGoal(session.user.id, goalWeight, goalBodyFat, targetDate);
  document.getElementById('goal-weight-input').value = '';
  document.getElementById('goal-bodyfat-input').value = '';
  // ボタン状態をリセット
  _goalPeriodType = null;
  document.querySelectorAll('.goal-period-btn').forEach(b => {
    b.style.borderColor = 'var(--border)';
    b.style.background = 'var(--card)';
    b.querySelector('.period-label').style.color = 'var(--white)';
  });
  cachedUserContext = null;
  loadDashboard();
});

function renderProgressGauge(label, unit, startVal, currentVal, goalVal, color) {
  if (startVal == null || currentVal == null || goalVal == null) return '';

  const isIncrease = goalVal > startVal;
  const totalChange = Math.abs(goalVal - startVal);
  const currentChange = isIncrease
    ? currentVal - startVal
    : startVal - currentVal;
  let pct = totalChange !== 0 ? Math.round((currentChange / totalChange) * 100) : 0;
  pct = Math.max(0, Math.min(100, pct));

  const remaining = Math.abs(currentVal - goalVal).toFixed(1);
  const reached = isIncrease ? currentVal >= goalVal : currentVal <= goalVal;
  const diffText = reached ? '目標達成！🎉' : `あと ${remaining}${unit}`;
  const rawChange = (currentVal - startVal).toFixed(1);
  const changeText = rawChange > 0 ? `+${rawChange}${unit}` : rawChange < 0 ? `${rawChange}${unit}` : '変化なし';

  return `
    <div style="margin-bottom:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <p style="font-size:13px; color:var(--white); font-weight:700;">${label}</p>
        <p style="font-size:12px; color:${color};">${diffText}</p>
      </div>
      <div style="background:#1e1e1e; border-radius:100px; height:10px; overflow:hidden; border:1px solid var(--border);">
        <div style="height:100%; width:${pct}%; background:${color}; border-radius:100px; transition:width 0.6s ease;"></div>
      </div>
      <div style="display:flex; justify-content:space-between; margin-top:6px;">
        <p style="font-size:11px; color:var(--muted);">スタート: ${startVal}${unit}</p>
        <p style="font-size:11px; color:var(--muted);">${pct}%達成</p>
        <p style="font-size:11px; color:var(--muted);">目標: ${goalVal}${unit}</p>
      </div>
      <p style="font-size:12px; color:var(--muted); margin-top:4px; text-align:center;">スタートからの変化: <span style="color:${color};">${changeText}</span>　現在: <span style="color:var(--white);">${currentVal}${unit}</span></p>
    </div>
  `;
}

function renderRecordHistory(el, records, pageSize) {
  let shown = pageSize;
  function render() {
    const displayRecords = records.slice(0, shown);
    const hasMore = records.length > shown;
    const hasLess = shown > pageSize;
    el.innerHTML = displayRecords.map(r => {
      const dateStr = r.recorded_at ? r.recorded_at : '-';
      return `
        <div style="display:flex; justify-content:space-between; padding:10px 14px; background:#1e1e1e; border:1px solid var(--border); border-radius:8px;">
          <p style="font-size:12px; color:var(--muted);">${dateStr}</p>
          <p style="font-size:13px; color:var(--white);">${r.weight != null ? r.weight + 'kg' : '-'} ／ ${r.body_fat != null ? r.body_fat + '%' : '-'}</p>
        </div>
      `;
    }).join('');

    if (hasMore || hasLess) {
      const btnRow = document.createElement('div');
      btnRow.style.cssText = 'display:flex; gap:8px; margin-top:8px;';
      if (hasMore) {
        const moreBtn = document.createElement('button');
        moreBtn.textContent = `過去${Math.min(pageSize, records.length - shown)}件を表示`;
        moreBtn.style.cssText = 'flex:1; padding:8px; background:transparent; color:var(--muted); border:1px solid var(--border); border-radius:8px; font-size:12px; cursor:pointer;';
        moreBtn.addEventListener('click', () => { shown += pageSize; render(); });
        btnRow.appendChild(moreBtn);
      }
      if (hasLess) {
        const lessBtn = document.createElement('button');
        lessBtn.textContent = '非表示にする';
        lessBtn.style.cssText = 'flex:1; padding:8px; background:transparent; color:var(--muted); border:1px solid var(--border); border-radius:8px; font-size:12px; cursor:pointer;';
        lessBtn.addEventListener('click', () => { shown = pageSize; render(); });
        btnRow.appendChild(lessBtn);
      }
      el.appendChild(btnRow);
    }
  }
  render();
}

document.getElementById('record-btn')?.addEventListener('click', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const weight = parseFloat(document.getElementById('weight-input').value) || null;
  const bodyFat = parseFloat(document.getElementById('bodyfat-input').value) || null;
  if (!weight && !bodyFat) { alert('体重か体脂肪率を入力してください'); return; }

  const { error: insertError } = await supabase.from('body_records').insert({
    user_id: session.user.id,
    weight,
    body_fat: bodyFat
  });

  if (insertError) {
    console.error('記録保存エラー:', insertError);
    alert('記録の保存に失敗しました。');
    return;
  }

  document.getElementById('weight-input').value = '';
  document.getElementById('bodyfat-input').value = '';
  cachedUserContext = null;
  await loadDashboard();
});

// ============================================================
// 週次振り返り
// ============================================================
document.getElementById('review-btn')?.addEventListener('click', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const reviewBtn = document.getElementById('review-btn');
  const reviewLoading = document.getElementById('review-loading');
  const reviewResult = document.getElementById('review-result');

  reviewBtn.style.display = 'none';
  reviewLoading.style.display = 'block';
  reviewResult.style.display = 'none';

  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  const mondayStart = `${monday.toISOString().split('T')[0]}T00:00:00`;

  const { data: weeklyChats } = await supabase
    .from('chat_history')
    .select('goal, method, sub, created_at')
    .eq('user_id', session.user.id)
    .gte('created_at', mondayStart)
    .order('created_at', { ascending: true });

  const fourWeeksAgo = new Date(now);
  fourWeeksAgo.setDate(now.getDate() - 28);
  const { data: pastChats } = await supabase
    .from('chat_history')
    .select('goal, method, sub, created_at')
    .eq('user_id', session.user.id)
    .gte('created_at', fourWeeksAgo.toISOString())
    .lt('created_at', mondayStart)
    .order('created_at', { ascending: true });

  const { data: usageData } = await supabase
    .from('usage_limits')
    .select('date, count')
    .eq('user_id', session.user.id)
    .gte('date', monday.toISOString().split('T')[0]);

  const weeklyTotal = (usageData || []).reduce((sum, r) => sum + r.count, 0);

  const goalLabel = { '1': '脂肪を落とす', '2': '筋肉をつける', '3': '体力を上げる', '4': '不調を改善', '5': '体型を整える' };
  const methodLabel = { nutrition: '栄養', training: 'トレーニング', recovery: '回復' };

  const weeklyChatsText = (weeklyChats || []).length > 0
    ? (weeklyChats || []).map(h => `・目標:${goalLabel[h.goal] || h.goal} ／ 手段:${methodLabel[h.method] || h.method} ／ 状況:${h.sub}`).join('\n')
    : '今週はまだ利用なし';

  const pastChatsText = (pastChats || []).length > 0
    ? (pastChats || []).map(h => `・目標:${goalLabel[h.goal] || h.goal} ／ 手段:${methodLabel[h.method] || h.method} ／ 状況:${h.sub}`).join('\n')
    : '過去データなし';

  const prompt = `あなたは運動生理学・栄養科学・睡眠科学の知見に基づいて行動するフィットネスコーチです。ユーザーの今週の行動データを科学的根拠をもとに分析して、継続と目標達成を後押しする振り返りレポートを作成してください。

【科学的根拠ルール】
・すべてのアドバイスは運動生理学・栄養科学・睡眠科学の知見に基づくこと
・根拠は「〜という研究では」「〜科学的に示されています」など1〜2行で自然に添える
・根拠のない民間療法・流行ダイエット・SNS的な情報は禁止
・断言できない内容は「〜と言われています」と表現を和らげる
・部分痩せの断言・デトックス系など科学的根拠がないものは禁止
・来週のアドバイスは「今日・明日からすぐできる具体的な行動」として提案すること

【出力ルール】
・専門用語は使わず、読みやすい日本語で書く
・褒めすぎず、批判もせず、事実と根拠に基づいたフラットなトーンで
・データが少ない場合でも、あるデータから最大限の洞察を引き出すこと
・各セクションは2〜3文以内で簡潔に

【今週の利用データ】
利用回数: ${weeklyTotal}回
選択内容:
${weeklyChatsText}

【過去4週間の利用データ】
${pastChatsText}

以下の構成で日本語で回答してください：

## 今週の傾向
（どんな目標・手段・状況を選ぶことが多かったか。その選択パターンから科学的に読み取れることを1〜2文で）

## あなたのパターン
（過去データと比較して継続できていること・変化していること。継続の科学的メリット、もしくは変化が体に与える影響を根拠とともに）

## 来週へのアドバイス
（科学的根拠に基づいた具体的な行動を1〜2個。「〜するとよい」ではなく「〜してみてください」など行動を促す表現で。根拠を自然に添えること）`;

  try {
    const { data: { session: chatSession } } = await supabase.auth.getSession();
    const chatHeaders = { 'Content-Type': 'application/json' };
    if (chatSession?.access_token) chatHeaders['Authorization'] = `Bearer ${chatSession.access_token}`;
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: chatHeaders,
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
    });
    const data = await response.json();
    const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('\n');

    reviewLoading.style.display = 'none';
    reviewResult.style.display = 'block';
    reviewResult.innerHTML = `
      <div style="background:#111; border:1px solid var(--border); border-radius:12px; padding:16px;">
        <div style="font-size:13px; color:var(--white); line-height:1.8; white-space:pre-wrap;">${escapeHtml(text).replace(/## /g, '<br><span style="color:var(--accent); font-size:11px; letter-spacing:0.1em; font-weight:700;">').replace(/\n/g, '</span>\n').replace(/<\/span>\n/g, '</span><br>')}</div>
      </div>
      <button id="review-reset-btn" style="width:100%; margin-top:12px; padding:10px; background:transparent; color:var(--muted); border:1px solid var(--border); border-radius:8px; font-size:13px; cursor:pointer;">
        もう一度振り返る
      </button>
    `;

    document.getElementById('review-reset-btn').addEventListener('click', () => {
      reviewResult.style.display = 'none';
      reviewBtn.style.display = 'block';
    });

  } catch (err) {
    reviewLoading.style.display = 'none';
    reviewBtn.style.display = 'block';
    alert('振り返りの生成に失敗しました。もう一度お試しください。');
    console.error(err);
  }
});

// ============================================================
// 機能開放システム
// ============================================================
function updateUnlockUI(streak) {
  const paLocked = document.getElementById('pa-locked');
  const paUnlocked = document.getElementById('pa-unlocked');
  const paBar = document.getElementById('pa-progress-bar');
  const paText = document.getElementById('pa-progress-text');

  if (streak >= UNLOCK_PERSONAL_ANALYSIS || unlockedFeatures.has('personal_analysis')) {
    paLocked.style.display = 'none';
    paUnlocked.style.display = 'block';
  } else {
    paLocked.style.display = 'block';
    paUnlocked.style.display = 'none';
    const pct = Math.round((streak / UNLOCK_PERSONAL_ANALYSIS) * 100);
    paBar.style.width = pct + '%';
    paText.textContent = streak + ' / ' + UNLOCK_PERSONAL_ANALYSIS + '日';
  }

  const bdLocked = document.getElementById('bd-locked');
  const bdUnlocked = document.getElementById('bd-unlocked');
  const bdBar = document.getElementById('bd-progress-bar');
  const bdText = document.getElementById('bd-progress-text');

  if (streak >= UNLOCK_BODY_DIAGNOSIS || unlockedFeatures.has('body_diagnosis')) {
    bdLocked.style.display = 'none';
    bdUnlocked.style.display = 'block';
  } else {
    bdLocked.style.display = 'block';
    bdUnlocked.style.display = 'none';
    const pct = Math.round((streak / UNLOCK_BODY_DIAGNOSIS) * 100);
    bdBar.style.width = pct + '%';
    bdText.textContent = streak + ' / ' + UNLOCK_BODY_DIAGNOSIS + '日';
  }
}

// ============================================================
// AIパーソナル分析
// ============================================================
document.getElementById('pa-run-btn').addEventListener('click', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const runBtn = document.getElementById('pa-run-btn');
  const paLoading = document.getElementById('pa-loading');
  const paResult = document.getElementById('pa-result');

  runBtn.style.display = 'none';
  paLoading.style.display = 'block';
  paResult.style.display = 'none';

  try {
    const { data: allChats } = await supabase
      .from('chat_history')
      .select('goal, method, sub, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });

    const totalSessions = (allChats || []).length;

    const goalCount = {};
    const methodCount = { nutrition: 0, training: 0, recovery: 0 };
    const subCount = {};
    const goalLabel = { '1': '脂肪を落とす', '2': '筋肉をつける', '3': '体力を上げる', '4': '不調を改善', '5': '体型を整える' };

    (allChats || []).forEach(h => {
      goalCount[h.goal] = (goalCount[h.goal] || 0) + 1;
      if (methodCount[h.method] !== undefined) methodCount[h.method]++;
      subCount[h.sub] = (subCount[h.sub] || 0) + 1;
    });

    const goalSummary = Object.entries(goalCount)
      .sort((a, b) => b[1] - a[1])
      .map(([g, c]) => (goalLabel[g] || g) + ': ' + c + '回')
      .join(', ');

    const methodSummary = '栄養: ' + methodCount.nutrition + '回, トレーニング: ' + methodCount.training + '回, 回復: ' + methodCount.recovery + '回';

    const topSubs = Object.entries(subCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([s, c]) => s + '(' + c + '回)')
      .join(', ');

    const { data: bodyRecords } = await supabase
      .from('body_records')
      .select('weight, body_fat, recorded_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });

    let bodyInfo = '';
    if (bodyRecords && bodyRecords.length > 0) {
      const first = bodyRecords[0];
      const last = bodyRecords[bodyRecords.length - 1];
      bodyInfo = '体記録: 初回(' + (first.weight || '-') + 'kg/' + (first.body_fat || '-') + '%) → 最新(' + (last.weight || '-') + 'kg/' + (last.body_fat || '-') + '%)';
    }

    const prompt = `あなたは運動生理学・栄養科学・睡眠科学の知見に基づくフィットネス分析AIです。

以下のユーザーの全利用履歴を分析して、3つのセクションで診断結果を出力してください。

【ユーザーデータ】
・総セッション数: ${totalSessions}回
・目標別: ${goalSummary}
・手段別: ${methodSummary}
・よく選ぶ状況TOP5: ${topSubs}
・連続利用日数: ${currentStreak}日
${bodyInfo ? '・' + bodyInfo : ''}

【出力形式 — 必ずこの3セクション構成で出力】

## 🏷 あなたのフィットネスタイプ

タイプ名:「○○タイプ」（キャッチーな名前をつける）

このタイプの特徴を2〜3文で説明。科学的根拠に基づいた行動傾向の分析。「あなたは〜する傾向があります」など。

## 📊 バランスチャート

栄養: ★★★☆☆（5段階評価）
トレーニング: ★★★★☆
回復: ★★☆☆☆

各項目について1文ずつ、なぜその評価なのかを科学的根拠とともに説明。
バランスが偏っている場合はその影響も添える。

## 🎯 弱点と克服プラン

あなたの最大の弱点: 「○○」

なぜこれが弱点なのかを科学的根拠とともに2〜3文で説明。
具体的な克服アクションを2つ提案（「〜してみてください」形式で）。

【ルール】
・科学的根拠を1〜2行で自然に添えること
・専門用語は使わない
・タイプ名は親しみやすくキャッチーに（例：「コツコツ積み上げ型」「追い込みストイック型」「バランス重視型」など）
・★は利用回数の比率だけでなく、全体バランスへの影響も考慮して評価すること
・批判的にならず、改善の余地として前向きに伝えること`;

    const paHeaders = { 'Content-Type': 'application/json' };
    if (session?.access_token) paHeaders['Authorization'] = `Bearer ${session.access_token}`;
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: paHeaders,
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
    });
    const data = await response.json();
    const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('\n');

    var typeName = '';
    var typeMatch = text.match(/[「」]([^「」]+)[」」]/);
    if (typeMatch) typeName = typeMatch[1];
    try {
      await supabase.from('personal_analysis').insert({
        user_id: session.user.id,
        type_name: typeName,
        full_result: text,
        nutrition_count: methodCount.nutrition,
        training_count: methodCount.training,
        recovery_count: methodCount.recovery,
        streak: currentStreak
      });
      console.log('パーソナル分析保存完了');
    } catch (saveErr) {
      console.error('パーソナル分析保存エラー:', saveErr);
    }

    paLoading.style.display = 'none';
    paResult.style.display = 'block';

    const total = methodCount.nutrition + methodCount.training + methodCount.recovery;
    const nPct = total > 0 ? Math.round((methodCount.nutrition / total) * 100) : 33;
    const tPct = total > 0 ? Math.round((methodCount.training / total) * 100) : 33;
    const rPct = total > 0 ? Math.round((methodCount.recovery / total) * 100) : 33;

    paResult.innerHTML = `
      <div style="background:#111; border:1px solid var(--border); border-radius:12px; padding:16px; margin-bottom:12px;">
        <p style="font-size:11px; color:var(--accent); letter-spacing:0.1em; font-weight:700; margin-bottom:8px;">📊 利用バランス</p>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <div>
            <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
              <span style="font-size:12px; color:var(--muted);">🥗 栄養</span>
              <span style="font-size:12px; color:var(--white);">${methodCount.nutrition}回 (${nPct}%)</span>
            </div>
            <div style="background:#1e1e1e; border-radius:100px; height:6px; overflow:hidden;">
              <div style="height:100%; width:${nPct}%; background:#4ade80; border-radius:100px; transition:width 0.6s;"></div>
            </div>
          </div>
          <div>
            <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
              <span style="font-size:12px; color:var(--muted);">🏋️ トレーニング</span>
              <span style="font-size:12px; color:var(--white);">${methodCount.training}回 (${tPct}%)</span>
            </div>
            <div style="background:#1e1e1e; border-radius:100px; height:6px; overflow:hidden;">
              <div style="height:100%; width:${tPct}%; background:#f59e0b; border-radius:100px; transition:width 0.6s;"></div>
            </div>
          </div>
          <div>
            <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
              <span style="font-size:12px; color:var(--muted);">😴 回復</span>
              <span style="font-size:12px; color:var(--white);">${methodCount.recovery}回 (${rPct}%)</span>
            </div>
            <div style="background:#1e1e1e; border-radius:100px; height:6px; overflow:hidden;">
              <div style="height:100%; width:${rPct}%; background:#818cf8; border-radius:100px; transition:width 0.6s;"></div>
            </div>
          </div>
        </div>
      </div>
      <div style="background:#111; border:1px solid var(--border); border-radius:12px; padding:16px;">
        <div style="font-size:13px; color:var(--white); line-height:1.8; white-space:pre-wrap;">${escapeHtml(text).replace(/## /g, '<br><span style="color:var(--accent); font-size:12px; letter-spacing:0.1em; font-weight:700;">').replace(/\n/g, '</span>\n')}</div>
      </div>
      <button id="pa-reset-btn" style="width:100%; margin-top:12px; padding:10px; background:transparent; color:var(--muted); border:1px solid var(--border); border-radius:8px; font-size:13px; cursor:pointer;">もう一度分析する</button>
    `;

    document.getElementById('pa-reset-btn').addEventListener('click', () => {
      paResult.style.display = 'none';
      runBtn.style.display = 'block';
    });

  } catch (err) {
    paLoading.style.display = 'none';
    runBtn.style.display = 'block';
    alert('分析に失敗しました。もう一度お試しください。');
    console.error('パーソナル分析エラー:', err);
  }
});

// ============================================================
// AIボディメイク診断
// ============================================================
let bodyPhotoBase64 = null;

document.getElementById('bd-consent-checkbox').addEventListener('change', function() {
  var uploadArea = document.getElementById('bd-upload-area');
  var consent = document.getElementById('bd-consent');
  if (this.checked) {
    uploadArea.style.display = 'block';
    consent.style.borderColor = '#4fc3f7';
  } else {
    uploadArea.style.display = 'none';
    consent.style.borderColor = '#333';
  }
});
let bodyPhotoMediaType = 'image/jpeg';

document.getElementById('bd-file-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  bodyPhotoMediaType = file.type || 'image/jpeg';

  const reader = new FileReader();
  reader.onload = (ev) => {
    const dataUrl = ev.target.result;
    bodyPhotoBase64 = dataUrl.split(',')[1];
    document.getElementById('bd-preview-img').src = dataUrl;
    document.getElementById('bd-upload-area').style.display = 'none';
    document.getElementById('bd-preview').style.display = 'block';
    document.getElementById('bd-result').style.display = 'none';
  };
  reader.readAsDataURL(file);
});

document.getElementById('bd-reset-photo').addEventListener('click', () => {
  bodyPhotoBase64 = null;
  document.getElementById('bd-file-input').value = '';
  document.getElementById('bd-preview').style.display = 'none';
  document.getElementById('bd-upload-area').style.display = 'block';
  document.getElementById('bd-result').style.display = 'none';
});

document.getElementById('bd-run-btn').addEventListener('click', async () => {
  if (!bodyPhotoBase64) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const runBtn = document.getElementById('bd-run-btn');
  const resetPhoto = document.getElementById('bd-reset-photo');
  const bdLoading = document.getElementById('bd-loading');
  const bdResult = document.getElementById('bd-result');

  runBtn.style.display = 'none';
  resetPhoto.style.display = 'none';
  bdLoading.style.display = 'block';
  bdResult.style.display = 'none';

  const { data: bodyRecords } = await supabase
    .from('body_records')
    .select('weight, body_fat, recorded_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  let bodyInfo = '';
  if (bodyRecords && bodyRecords.length > 0) {
    const r = bodyRecords[0];
    bodyInfo = '最新の記録: 体重' + (r.weight || '不明') + 'kg / 体脂肪率' + (r.body_fat || '不明') + '%';
  }

  const goal = await loadGoal(session.user.id);
  let goalInfo = '';
  if (goal) {
    if (goal.goal_weight) goalInfo += '目標体重: ' + goal.goal_weight + 'kg ';
    if (goal.goal_body_fat) goalInfo += '目標体脂肪率: ' + goal.goal_body_fat + '%';
  }

  const prompt = `あなたは運動生理学・栄養科学の知見に基づくボディメイク専門AIです。

ユーザーが全身写真をアップロードしました。写真から視覚的に判断できる範囲で体型を分析し、改善ポイントを提案してください。

${bodyInfo ? '【ユーザー情報】\n' + bodyInfo + '\n' + goalInfo : ''}

【重要ルール】
・写真から視覚的に判断できる範囲で分析すること
・体脂肪率や体重を写真から断定するのは禁止（「〜に見えます」「〜の印象です」と表現）
・ネガティブな言い方は禁止。「改善の余地がある」「さらに良くなる」など前向きな表現にする
・科学的根拠を1〜2行で自然に添えること
・医療的な診断は禁止

【出力形式】

## 📸 体型の印象

全体的な体型の印象を2〜3文で（「引き締まっている」「やや上半身にボリュームがある」など視覚的な表現で）

## 💪 強み

体型で良い点を2つ（「〜が発達している」「〜のバランスが良い」など）

## 🎯 優先改善ポイント

最も効果が出やすい改善ポイントを2つ。それぞれ：
・どこをどう改善するか
・具体的なトレーニング or 栄養アプローチ（種目名・食事内容レベルで）
・なぜ効果的かの科学的根拠を1行で

## 📋 おすすめメニュー

上記の改善ポイントに基づいた、今日からできる具体的なトレーニングメニュー（3〜4種目、セット数・回数つき）`;

  try {
    const bdHeaders = { 'Content-Type': 'application/json' };
    if (session?.access_token) bdHeaders['Authorization'] = `Bearer ${session.access_token}`;
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: bdHeaders,
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: bodyPhotoMediaType,
                data: bodyPhotoBase64
              }
            },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });
    const data = await response.json();
    const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('\n');

    bdLoading.style.display = 'none';
    bdResult.style.display = 'block';
    bdResult.innerHTML = `
      <div style="background:#111; border:1px solid var(--border); border-radius:12px; padding:16px;">
        <div style="font-size:13px; color:var(--white); line-height:1.8; white-space:pre-wrap;">${escapeHtml(text).replace(/## /g, '<br><span style="color:#4fc3f7; font-size:12px; letter-spacing:0.1em; font-weight:700;">').replace(/\n/g, '</span>\n')}</div>
      </div>
      <button id="bd-retry-btn" style="width:100%; margin-top:12px; padding:10px; background:transparent; color:var(--muted); border:1px solid var(--border); border-radius:8px; font-size:13px; cursor:pointer;">別の写真で診断する</button>
    `;

    document.getElementById('bd-retry-btn').addEventListener('click', () => {
      bodyPhotoBase64 = null;
      document.getElementById('bd-file-input').value = '';
      document.getElementById('bd-preview').style.display = 'none';
      document.getElementById('bd-upload-area').style.display = 'block';
      bdResult.style.display = 'none';
      runBtn.style.display = 'block';
      resetPhoto.style.display = 'block';
    });

  } catch (err) {
    bdLoading.style.display = 'none';
    runBtn.style.display = 'block';
    resetPhoto.style.display = 'block';
    alert('診断に失敗しました。もう一度お試しください。');
    console.error('ボディ診断エラー:', err);
  }
});

// ============================================================
// 名前入力モーダル
// ============================================================
function showNameInputModal(userId) {
  let modal = document.getElementById('name-input-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'name-input-modal';
    modal.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.85);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999; padding: 24px;
    `;
    modal.innerHTML = `
      <div style="background:#111; border:1px solid #333; border-radius:20px; padding:32px 24px; max-width:400px; width:100%;">
        <p style="font-size:11px; color:#c8f135; letter-spacing:0.15em; margin-bottom:12px;">PROFILE SETUP</p>
        <h2 style="font-size:22px; font-weight:700; color:#fff; margin-bottom:8px;">
          あなたの<span style="color:#c8f135;">名前</span>を教えてください
        </h2>
        <p style="font-size:13px; color:#888; margin-bottom:24px; line-height:1.6;">
          コーチがあなたの名前で呼びかけます。
        </p>
        <input
          id="name-input-field"
          type="text"
          placeholder="例：佐藤 悠太"
          maxlength="20"
          style="width:100%; padding:14px 16px; border-radius:12px; border:1px solid #333; background:#1a1a1a; color:#fff; font-size:16px; outline:none; box-sizing:border-box; margin-bottom:8px;"
        />
        <p id="name-input-error" style="font-size:12px; color:#ff4444; min-height:18px; margin-bottom:16px;"></p>
        <button
          id="name-input-submit"
          style="width:100%; padding:16px; border-radius:12px; border:none; background:#c8f135; color:#000; font-size:16px; font-weight:700; cursor:pointer;"
        >
          決定してはじめる →
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  modal.style.display = 'flex';

  const input = document.getElementById('name-input-field');
  const submitBtn = document.getElementById('name-input-submit');
  const errorEl = document.getElementById('name-input-error');

  input.focus();

  const handleSubmit = async () => {
    const name = input.value.trim();
    if (!name) { errorEl.textContent = '名前を入力してください'; return; }
    if (name.length > 20) { errorEl.textContent = '20文字以内で入力してください'; return; }

    submitBtn.disabled = true;
    submitBtn.textContent = '保存中...';
    errorEl.textContent = '';

    const ok = await saveProfile(userId, name);
    if (!ok) {
      errorEl.textContent = '保存に失敗しました。もう一度お試しください。';
      submitBtn.disabled = false;
      submitBtn.textContent = '決定してはじめる →';
      return;
    }

    modal.style.display = 'none';
    userNameEl.textContent = `${name}（${window.__currentUserEmail__ || ''}）`;
    showAfterCheckin();
  };

  submitBtn.onclick = handleSubmit;
  input.onkeydown = (e) => { if (e.key === 'Enter') handleSubmit(); };
}

// ============================================================
// オンボーディング
// ============================================================
(function initOnboarding() {
  const modal = document.getElementById('onboarding-modal');
  const nextBtn = document.getElementById('onboarding-next-btn');
  const skipBtn = document.getElementById('onboarding-skip-btn');
  if (!modal || !nextBtn) return;

  let currentStep = 1;
  const totalSteps = 3;

  function showStep(step) {
    modal.querySelectorAll('.onboarding-step').forEach(el => el.classList.remove('active'));
    modal.querySelectorAll('.onboarding-dot').forEach(el => el.classList.remove('active'));
    const stepEl = modal.querySelector(`[data-onboarding="${step}"]`);
    const dotEl = modal.querySelector(`[data-dot="${step}"]`);
    if (stepEl) stepEl.classList.add('active');
    if (dotEl) dotEl.classList.add('active');
    nextBtn.textContent = step === totalSteps ? 'はじめる' : '次へ';
  }

  function closeOnboarding() {
    modal.style.display = 'none';
    localStorage.setItem(userKey('fitai_onboarding_done'), '1');
  }

  nextBtn.addEventListener('click', () => {
    if (currentStep < totalSteps) {
      currentStep++;
      showStep(currentStep);
    } else {
      closeOnboarding();
    }
  });

  skipBtn.addEventListener('click', closeOnboarding);

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session && !localStorage.getItem(userKey('fitai_onboarding_done'))) {
      modal.style.display = 'flex';
    }
  });
})();

// ============================================================
// スケルトンローディング
// ============================================================
function showDashboardSkeleton() {
  const skeleton = document.getElementById('dashboard-skeleton');
  const dashboard = document.getElementById('dashboard');
  if (skeleton) skeleton.style.display = 'block';
  if (dashboard) dashboard.style.display = 'none';
}

function hideDashboardSkeleton() {
  const skeleton = document.getElementById('dashboard-skeleton');
  const dashboard = document.getElementById('dashboard');
  if (skeleton) skeleton.style.display = 'none';
  if (dashboard) dashboard.style.display = 'block';
}

const _originalLoadDashboard = loadDashboard;
loadDashboard = async function() {
  showDashboardSkeleton();
  try {
    await _originalLoadDashboard();
  } finally {
    hideDashboardSkeleton();
  }
};

// ============================================================
// チャット履歴表示
// ============================================================
async function loadChatHistoryList() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const historyCard = document.getElementById('history-card');
  const historyList = document.getElementById('chat-history-list');
  if (!historyCard || !historyList) return;

  const { data: chats } = await supabase
    .from('chat_history')
    .select('id, goal, method, sub, messages, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (!chats || chats.length === 0) {
    historyCard.style.display = 'none';
    return;
  }

  historyCard.style.display = 'none'; return; // 非表示

  const goalLabel = { '1': '脂肪を落とす', '2': '筋肉をつける', '3': '体力を上げる', '4': '不調を改善', '5': '体型を整える' };
  const methodLabel = { nutrition: '栄養', training: 'トレーニング', recovery: '回復' };

  historyList.innerHTML = chats.map(chat => {
    const date = new Date(chat.created_at);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    const aiMsg = chat.messages?.find(m => m.role === 'assistant');
    const preview = aiMsg?.content ? aiMsg.content.slice(0, 60) + '...' : '';
    return `
      <div class="history-item" onclick="showHistoryDetail('${chat.id}')">
        <span class="history-item-method">${methodLabel[chat.method] || chat.method}</span>
        <div class="history-item-date">${dateStr} - ${goalLabel[chat.goal] || ''} / ${chat.sub || ''}</div>
        <div class="history-item-preview">${escapeHtml(preview)}</div>
      </div>
    `;
  }).join('');
}

window.showHistoryDetail = async function(chatId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data: chat } = await supabase
    .from('chat_history')
    .select('messages, goal, method, sub, created_at')
    .eq('id', chatId)
    .single();

  if (!chat || !chat.messages) return;

  const goalLabel = { '1': '脂肪を落とす', '2': '筋肉をつける', '3': '体力を上げる', '4': '不調を改善', '5': '体型を整える' };
  const methodLabel = { nutrition: '栄養', training: 'トレーニング', recovery: '回復' };
  const date = new Date(chat.created_at);
  const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

  let modal = document.getElementById('history-detail-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'history-detail-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(12px);z-index:10000;overflow-y:auto;padding:20px;animation:fadeIn 0.3s ease;';
    document.body.appendChild(modal);
  }

  const msgs = chat.messages
    .filter(m => m.role !== 'system')
    .map(m => `<div class="chat-message ${m.role}" style="margin-bottom:12px;"><div style="font-size:13px;color:var(--white);line-height:1.8;white-space:pre-wrap;">${escapeHtml(typeof m.content === 'string' ? m.content : '').replace(/\n/g, '<br>')}</div></div>`)
    .join('');

  modal.innerHTML = `
    <div style="max-width:640px;margin:0 auto;">
      <button onclick="document.getElementById('history-detail-modal').style.display='none'" style="display:flex;align-items:center;gap:8px;padding:12px 20px;margin-bottom:16px;background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:10px;color:var(--muted);font-size:14px;cursor:pointer;font-family:'Noto Sans JP',sans-serif;">
        <svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2;"><polyline points="15 18 9 12 15 6"></polyline></svg>
        戻る
      </button>
      <div style="margin-bottom:16px;">
        <p style="font-size:11px;color:var(--accent-muted);letter-spacing:0.2em;margin-bottom:8px;">HISTORY</p>
        <p style="font-size:16px;color:var(--white);font-weight:700;">${goalLabel[chat.goal] || ''} / ${methodLabel[chat.method] || ''}</p>
        <p style="font-size:12px;color:var(--muted);margin-top:4px;">${dateStr} - ${chat.sub || ''}</p>
      </div>
      <div style="background:var(--card-bg);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;">
        ${msgs}
      </div>
    </div>
  `;
  modal.style.display = 'block';
};

// ============================================================
// 進捗グラフ (Chart.js)
// ============================================================
let progressChart = null;
let chartData = { weight: [], bodyFat: [], usage: [] };

async function loadProgressChart() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const chartCard = document.getElementById('chart-card');
  if (!chartCard) return;

  const { data: bodyRecords } = await supabase
    .from('body_records')
    .select('weight, body_fat, recorded_at, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: true })
    .limit(90);

  const { data: usageData } = await supabase
    .from('usage_limits')
    .select('date, count')
    .eq('user_id', session.user.id)
    .order('date', { ascending: true })
    .limit(30);

  chartData.weight = (bodyRecords || []).filter(r => r.weight != null).map(r => ({
    x: r.recorded_at || r.created_at?.split('T')[0],
    y: r.weight
  }));

  chartData.bodyFat = (bodyRecords || []).filter(r => r.body_fat != null).map(r => ({
    x: r.recorded_at || r.created_at?.split('T')[0],
    y: r.body_fat
  }));

  chartData.usage = (usageData || []).map(r => ({
    x: r.date,
    y: r.count
  }));

  const hasData = chartData.weight.length > 0 || chartData.bodyFat.length > 0 || chartData.usage.length > 0;
  chartCard.style.display = hasData ? 'block' : 'none';

  if (hasData) {
    renderChart('weight');
  }
}

function renderChart(type) {
  const canvas = document.getElementById('progress-chart');
  if (!canvas) return;

  if (progressChart) {
    progressChart.destroy();
  }

  const data = chartData[type] || [];
  if (data.length === 0) return;

  const labels = { weight: '体重 (kg)', bodyFat: '体脂肪率 (%)', usage: '利用回数' };
  const colors = { weight: '#c8f135', bodyFat: '#4fc3f7', usage: '#f59e0b' };
  const bgColors = { weight: 'rgba(200,241,53,0.1)', bodyFat: 'rgba(79,195,247,0.1)', usage: 'rgba(245,158,11,0.1)' };

  progressChart = new Chart(canvas, {
    type: type === 'usage' ? 'bar' : 'line',
    data: {
      labels: data.map(d => d.x),
      datasets: [{
        label: labels[type],
        data: data.map(d => d.y),
        borderColor: colors[type],
        backgroundColor: type === 'usage' ? colors[type] + '80' : bgColors[type],
        fill: type !== 'usage',
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: colors[type],
        borderWidth: 2,
        barThickness: type === 'usage' ? 12 : undefined,
        borderRadius: type === 'usage' ? 4 : undefined,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#55555f', font: { size: 10 }, maxTicksLimit: 8 }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#55555f', font: { size: 10 } }
        }
      }
    }
  });
}

window.switchChart = function(type) {
  document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
  const tab = document.querySelector(`[data-chart="${type}"]`);
  if (tab) tab.classList.add('active');
  renderChart(type);
};

// ============================================================
// ストリーミングレスポンス対応
// ============================================================
async function callAPIStream(messages, onChunk) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch('/api/chat?stream=true', {
    method: 'POST',
    headers,
    body: JSON.stringify({ messages })
  });

  if (!response.ok) throw new Error(`APIエラー: ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6);
        if (jsonStr === '[DONE]') continue;
        try {
          const data = JSON.parse(jsonStr);
          if (data.error) throw new Error(data.error);
          if (data.text) {
            fullText += data.text;
            onChunk(fullText);
          }
        } catch (e) {
          if (e.message && !e.message.includes('JSON')) throw e;
        }
      }
    }
  }

  await incrementOnSuccess();
  return fullText;
}

function addStreamingMessage() {
  const div = document.createElement('div');
  div.className = 'chat-message assistant streaming-cursor';
  div.innerHTML = '';
  chatHistory.appendChild(div);
  chatHistory.scrollTop = chatHistory.scrollHeight;
  return div;
}

function updateStreamingMessage(div, text) {
  // ストリーミング中はHTMLをそのまま表示（HTML形式の場合）
  if (text.includes('class="wrap"') || text.includes('class="step-block"')) {
    div.innerHTML = text;
  } else {
    const { cleanText, options } = parseOptions(text);
    div.innerHTML = escapeHtml(cleanText).replace(/\n/g, '<br>');
  }
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function finalizeStreamingMessage(div, text) {
  div.classList.remove('streaming-cursor');

  if (isTrainingPlan(text)) {
    div.innerHTML = renderTrainingContent(text);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return;
  }

  if (text.includes('class="step-block"') || text.includes('class="stop-block"')) {
    div.innerHTML = text;
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return;
  }

  if (isRecoveryContent(text)) {
    div.innerHTML = renderRecoveryContent(text);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return;
  }

  const isNutrition = isNutritionResponse(text);
  let processedText = text;

  if (isNutrition && window.NutritionDB) {
    const { cleanText: textWithoutOptions, options } = parseOptions(text);
    processedText = renderNutritionWithPFC(textWithoutOptions);
    div.innerHTML = processedText;
    attachDecideButtons(div);

    let finalOptions = options;
    if (finalOptions.length === 0) {
      finalOptions = [
        { number: '1', label: '第一候補のレシピを見る' },
        { number: '2', label: '第二候補のレシピを見る' },
        { number: '3', label: 'これならOKのレシピを見る' }
      ];
    }
    if (finalOptions.length > 0) {
      const btnGroup = document.createElement('div');
      btnGroup.className = 'option-buttons';
      finalOptions.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = `${opt.number}. ${opt.label}`;
        btn.addEventListener('click', () => {
          chatInput.value = `${opt.number}. ${opt.label}`;
          sendUserMessage();
        });
        btnGroup.appendChild(btn);
      });
      div.appendChild(btnGroup);
    }
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return;
  }

  const { cleanText, options } = parseOptions(text);
  div.innerHTML = escapeHtml(cleanText).replace(/\n/g, '<br>');

  let finalOptions = options;
  if (finalOptions.length === 0 && isNutrition) {
    finalOptions = [
      { number: '1', label: '第一候補のレシピを見る' },
      { number: '2', label: '第二候補のレシピを見る' },
      { number: '3', label: 'これならOKのレシピを見る' }
    ];
  }

  if (finalOptions.length > 0) {
    const btnGroup = document.createElement('div');
    btnGroup.className = 'option-buttons';
    finalOptions.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = `${opt.number}. ${opt.label}`;
      btn.addEventListener('click', () => {
        chatInput.value = `${opt.number}. ${opt.label}`;
        sendUserMessage();
      });
      btnGroup.appendChild(btn);
    });
    div.appendChild(btnGroup);
  }
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function renderNutritionWithPFC(text, containerDiv) {
  const NDB = window.NutritionDB;
  text = text.replace(/[（(]\s*(?:全体の)?目安[:：]?\s*約?\d+.*?kcal.*?[）)]/g, '');
  text = text.replace(/[（(]\s*約\d+kcal[｜|]P\d+g\s*F\d+g\s*C\d+g\s*[）)]/g, '');
  text = text.replace(/\[ITEMS:[^\]]*\]/g, '');
  let html = '';

  const lines = text.split('\n');
  const foodLinePattern = /^・(.+?)\s+([\d./半]+\s*(?:g|ml|切れ?|個|本|杯|枚|パック|缶|皿|食|人前|玉|丁|粒|[大小]さじ[\d./]*)?)\s*(?:[（(]([^）)]+)[）)])?$/;
  const foodLinePattern2 = /^・(.+?)\s+([大小]さじ[\d./]+)\s*(?:[（(]([^）)]+)[）)])?$/;
  let currentItems = [];
  let currentCookingMap = {};
  let inCandidate = false;

  function flushCandidate() {
    if (currentItems.length === 0) {
      if (inCandidate) html += `</div>`;
      inCandidate = false;
      return;
    }
    const pfc = NDB.calculateItemsPFC(currentItems);
    let cookingFAdj = 0, cookingCalAdj = 0;
    for (let i = 0; i < currentItems.length; i++) {
      const method = currentCookingMap[i];
      if (!method) continue;
      const cm = NDB.COOKING_METHODS[method];
      if (!cm) continue;
      const detail = pfc.details && pfc.details[i];
      if (detail) {
        cookingCalAdj += detail.cal * (cm.calMult - 1.0);
        cookingFAdj += cm.fAdd;
      }
    }
    const totalCal = Math.round(pfc.cal + cookingCalAdj);
    const totalF = Math.round(pfc.f + cookingFAdj);
    const totalP = pfc.p;
    const totalC = pfc.c;

    const pfcCal = totalP * 4 + totalF * 9 + totalC * 4;
    let pPct = 0, fPct = 0, cPct = 0;
    if (pfcCal > 0) {
      pPct = Math.round((totalP * 4 / pfcCal) * 100);
      fPct = Math.round((totalF * 9 / pfcCal) * 100);
      cPct = 100 - pPct - fPct;
    }

    html += `<div class="pfc-line">`;
    html += `<span class="pfc-cal">約${totalCal}kcal</span>`;
    html += `<span class="pfc-sep">｜</span>`;
    html += `<span class="pfc-p">P${totalP}g</span> `;
    html += `<span class="pfc-f">F${totalF}g</span> `;
    html += `<span class="pfc-c">C${totalC}g</span>`;
    html += `<span class="pfc-ratio">（P${pPct}% F${fPct}% C${cPct}%）</span>`;
    html += `</div>`;
    if (pfc.estimated && pfc.estimated.length > 0) {
      html += `<div class="pfc-estimated">※推定含む: ${escapeHtml(pfc.estimated.join(', '))}</div>`;
    }
    html += `</div>`;
    currentItems = [];
    currentCookingMap = {};
  }

  for (const line of lines) {
    const trimmed = line.trim();

    // 「第一候補」「第二候補」「これならOK」単体行はスキップ（カード内のrankTextと重複するため）
    if (/^(第一候補|第二候補|これならOK)[\s:：]?$/.test(trimmed)) {
      continue;
    }

    if (/^▼\s/.test(trimmed)) {
      if (inCandidate) flushCandidate();
      inCandidate = true;
      const cardCount = (html.match(/nutrition-card/g) || []).length;
      let cardClass = 'nutrition-card third';
      let rankClass = 'nutrition-rank third';
      let rankText = 'これならOK';
      if (cardCount === 0) { cardClass = 'nutrition-card'; rankClass = 'nutrition-rank'; rankText = '第一候補'; }
      else if (cardCount === 1) { cardClass = 'nutrition-card second'; rankClass = 'nutrition-rank second'; rankText = '第二候補'; }
      const nameText = trimmed.replace(/^▼\s*(第一候補:|第二候補:|これならOK:)?\s*/, '').trim();
      html += `<div class="${cardClass}"><div class="${rankClass}">${rankText}</div><div class="nutrition-name">${escapeHtml(nameText)}</div>`;
      continue;
    }

    if (inCandidate && trimmed.startsWith('食材:')) {
      html += `<div class="nutrition-ingredient" style="font-size:11px;color:#666;margin-bottom:4px;">${escapeHtml(trimmed)}</div>`;
      continue;
    }

    if (inCandidate && trimmed.startsWith('栄養:')) {
      const m = trimmed.match(/約(\d+)kcal[｜|]P(\d+)g\((\d+)%\)\s*F(\d+)g\((\d+)%\)\s*C(\d+)g\((\d+)%\)/);
      if (m) {
        html += `<div class="pfc-line">`;
        html += `<span class="pfc-cal">${m[1]}kcal</span>`;
        html += `<span class="pfc-p">P${m[2]}g ${m[3]}%</span>`;
        html += `<span class="pfc-f">F${m[4]}g ${m[5]}%</span>`;
        html += `<span class="pfc-c">C${m[6]}g ${m[7]}%</span>`;
        html += `</div>`;
      } else {
        html += `<div style="font-size:11px;color:#666;margin-bottom:4px;">${escapeHtml(trimmed)}</div>`;
      }
      continue;
    }

    if (inCandidate && trimmed.startsWith('・')) {
      let match = trimmed.match(foodLinePattern2);
      if (!match) {
        match = trimmed.match(foodLinePattern);
      }
      if (match) {
        const foodName = match[1].trim();
        const amount = match[2].trim();
        const cookingMethod = match[3] ? match[3].trim() : null;
        const idx = currentItems.length;
        currentItems.push({ name: foodName, amount: amount });
        if (cookingMethod && NDB.COOKING_METHODS[cookingMethod]) {
          currentCookingMap[idx] = cookingMethod;
        }
        html += escapeHtml(line) + '<br>';
        continue;
      }
    }

    if (inCandidate && currentItems.length > 0 && !trimmed.startsWith('・')) {
      flushCandidate();
      if (/^【/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
        inCandidate = false;
      }
    }

    if (trimmed.startsWith('【避けるもの】')) {
      if (inCandidate) { flushCandidate(); inCandidate = false; }
      const content = trimmed.replace('【避けるもの】', '').trim();
      html += `<div class="nutrition-avoid"><div class="nutrition-avoid-label">避けるもの</div><div class="nutrition-avoid-content">${escapeHtml(content)}</div></div>`;
      continue;
    }

    if (trimmed.startsWith('【理由】')) {
      const content = trimmed.replace('【理由】', '').trim();
      html += `<div class="nutrition-footer">${escapeHtml(content)}</div>`;
      continue;
    }

    if (inCandidate && trimmed && !trimmed.startsWith('・') && !trimmed.startsWith('▼') && !trimmed.startsWith('【')) {
      html += `<div class="nutrition-reason">${escapeHtml(trimmed)}</div>`;
      continue;
    }

    html += escapeHtml(line) + '<br>';
  }

  flushCandidate();

  return html;
}

function isNutritionResponse(text) {
  return (
    (text.includes('第一候補') || text.includes('**第一候補**')) &&
    (text.includes('第二候補') || text.includes('**第二候補**')) &&
    (text.includes('これならOK') || text.includes('**これならOK**'))
  );
}

// ============================================================
// 提案決定ボタン
// ============================================================
function attachDecideButtons(containerDiv) {
  const cards = containerDiv.querySelectorAll('.nutrition-card');
  if (cards.length === 0) return;

  // 全ボタン無効化 + オプション非表示（いずれかのアクション後に呼ぶ）
  function lockAll() {
    containerDiv.querySelectorAll('.decide-btn, .arrange-btn').forEach(b => { b.disabled = true; });
    const origSection = containerDiv.querySelector('.original-section');
    if (origSection) origSection.style.display = 'none';
    const optionBtns = containerDiv.querySelector('.option-buttons');
    if (optionBtns) optionBtns.style.display = 'none';
  }

  // アレンジ・オリジナル用の入力フォームを生成
  function buildNoteForm(placeholder, onSubmit, submitLabel = '記録する') {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'padding:10px 0 4px;';
    const label = document.createElement('p');
    label.style.cssText = 'font-size:11px; color:var(--muted); margin-bottom:6px;';
    label.textContent = 'どこをどう変えたか・実際に何をしたか（任意）';
    const ta = document.createElement('textarea');
    ta.placeholder = placeholder;
    ta.style.cssText = 'width:100%; box-sizing:border-box; padding:8px 10px; background:#1e1e1e; border:1px solid var(--border); border-radius:6px; color:var(--white); font-size:12px; outline:none; resize:vertical; min-height:56px; font-family:"Noto Sans JP",sans-serif;';
    const submitBtn = document.createElement('button');
    submitBtn.textContent = submitLabel;
    submitBtn.style.cssText = 'margin-top:8px; padding:8px 18px; background:var(--accent); color:#000; border:none; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer;';
    submitBtn.addEventListener('click', async () => {
      submitBtn.disabled = true; submitBtn.textContent = '保存中...';
      await onSubmit(ta.value.trim());
    });
    wrap.appendChild(label);
    wrap.appendChild(ta);
    wrap.appendChild(submitBtn);
    return wrap;
  }

  cards.forEach((card) => {
    const rankEl       = card.querySelector('.nutrition-rank');
    const nameEl       = card.querySelector('.nutrition-name');
    const ingredientEl = card.querySelector('.nutrition-ingredient');
    const pfcEl        = card.querySelector('.pfc-line');

    const rankText      = rankEl ? rankEl.textContent.trim() : '';
    const mealName      = nameEl ? nameEl.textContent.trim() : '';
    const nutritionText = pfcEl
      ? Array.from(pfcEl.querySelectorAll('span'))
          .map(s => s.textContent.trim()).filter(Boolean).join(' ')
      : '';
    const ingredients   = ingredientEl ? ingredientEl.textContent.trim() : '';

    // ── 決定ボタン ──
    const btn = document.createElement('button');
    btn.className = 'decide-btn';
    btn.textContent = 'この提案で決定する';
    btn.addEventListener('click', async () => {
      lockAll();
      cards.forEach(c => c.classList.add(c === card ? 'nutrition-card--selected' : 'nutrition-card--dim'));
      btn.textContent = '✓ この提案を選びました';
      btn.classList.add('decide-btn--confirmed');
      await saveSelectedPlan({ rank: rankText, name: mealName, ingredients, nutrition: nutritionText, action_type: 'selected' });
    });
    card.appendChild(btn);

    // ── アレンジボタン ──
    const arrangeBtn = document.createElement('button');
    arrangeBtn.className = 'arrange-btn';
    arrangeBtn.textContent = 'この提案をアレンジして実行した';
    arrangeBtn.addEventListener('click', () => {
      lockAll();
      cards.forEach(c => c.classList.add(c === card ? 'nutrition-card--selected' : 'nutrition-card--dim'));
      btn.style.display = 'none';
      arrangeBtn.style.display = 'none';
      const form = buildNoteForm('例：ご飯を玄米に変えた、量を半分にした…', async (note) => {
        await saveSelectedPlan({ rank: rankText, name: mealName, ingredients, nutrition: nutritionText, action_type: 'arranged', custom_note: note });
        form.innerHTML = '<p style="font-size:12px; color:var(--accent); padding:4px 0;">✓ アレンジ内容を記録しました</p>';
      });
      card.appendChild(form);
    });
    card.appendChild(arrangeBtn);
  });

  // ── 今回は別の内容で実行したセクション ──
  const origSection = document.createElement('div');
  origSection.className = 'original-section';
  origSection.style.cssText = 'margin-top:10px;';
  const origBtn = document.createElement('button');
  origBtn.className = 'decide-btn';
  origBtn.style.cssText = 'border-color:rgba(255,255,255,0.12); color:rgba(255,255,255,0.35); font-size:12px; margin-top:0;';
  origBtn.textContent = '今回は別の内容で実行した';
  origBtn.addEventListener('click', () => {
    lockAll();
    origSection.style.display = 'block'; // lockAll が非表示にするので再表示
    cards.forEach(c => c.classList.add('nutrition-card--dim'));
    origSection.innerHTML = '';
    const form = buildNoteForm('例：コンビニのおにぎり2個とサラダを食べた', async (note) => {
      await saveSelectedPlan({ rank: 'original', name: '', ingredients: '', nutrition: '', action_type: 'original', custom_note: note });
      origSection.innerHTML = '<p style="font-size:12px; color:var(--accent); margin-top:8px;">✓ 実行内容を記録しました</p>';
    }, '送信して完了');
    origSection.appendChild(form);
  });
  origSection.appendChild(origBtn);
  containerDiv.appendChild(origSection);
}

async function saveSelectedPlan(mealContent) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const actionType = mealContent.action_type || 'selected';

    const { error } = await supabase.from('selected_plans').insert({
      user_id: session.user.id,
      selected_plan: mealContent.rank,
      meal_name: mealContent.name,
      meal_content: mealContent,
      action_type: actionType,
      base_meal_name: actionType === 'arranged' ? mealContent.name : null,
      custom_note: mealContent.custom_note || null,
      goal: selectedGoal,
      method: selectedMethod,
      sub: selectedSub,
      context_snapshot: _nutritionContext || null,
      confirmed_at: new Date().toISOString(),
    });

    if (error) console.error('提案の保存に失敗:', error.message);
  } catch (err) {
    console.error('提案の保存中にエラー:', err);
  }
}

// ============================================================
// 通知バナー
// ============================================================
(function initNotificationBanner() {
  const banner = document.getElementById('notification-banner');
  const enableBtn = document.getElementById('notification-enable-btn');
  const closeBtn = document.getElementById('notification-close-btn');
  if (!banner || !enableBtn || !closeBtn) return;

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session && 'Notification' in window && Notification.permission === 'default' && !localStorage.getItem(userKey('fitai_notif_dismissed'))) {
      setTimeout(() => banner.classList.add('show'), 3000);
    }
  });

  enableBtn.addEventListener('click', async () => {
    const permission = await Notification.requestPermission();
    banner.classList.remove('show');
    if (permission === 'granted') {
      localStorage.setItem(userKey('fitai_notif_enabled'), '1');
      new Notification('フィットネスAIコーチ', {
        body: '通知が有効になりました。コーチからのリマインドを受け取れます。',
        icon: '/manifest.json'
      });
    }
  });

  closeBtn.addEventListener('click', () => {
    banner.classList.remove('show');
    localStorage.setItem(userKey('fitai_notif_dismissed'), '1');
  });
})();

// ============================================================
// loadDashboardにチャット履歴・グラフ読み込みを追加
// ============================================================
const _originalLoadDashboard2 = loadDashboard;
loadDashboard = async function() {
  await _originalLoadDashboard2();
  loadChatHistoryList().catch(console.error);
  loadProgressChart().catch(console.error);
  buildUserContext().catch(console.error);
  loadUserThreads().catch(console.error);
};

// ============================================================
// スレッド（ユーザー側）
// ============================================================
async function loadUserThreads() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data: threads } = await supabase
    .from('threads')
    .select('id, title, user_id, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  const card = document.getElementById('coach-threads-card');
  const list = document.getElementById('coach-threads-list');
  if (!card || !list) return;

  if (!threads || threads.length === 0) {
    card.style.display = 'block';
    list.innerHTML = '<p style="color:var(--muted); font-size:13px; text-align:center; padding:12px 0;">まだコーチからの連絡はありません</p>';
    return;
  }

  let latestMsgMap = {};
  const { data: allMsgs } = await supabase
    .from('messages')
    .select('thread_id, sender_id, message, created_at')
    .in('thread_id', threads.map(t => t.id))
    .order('created_at', { ascending: false });
  (allMsgs || []).forEach(msg => {
    if (!latestMsgMap[msg.thread_id]) latestMsgMap[msg.thread_id] = msg;
  });

  card.style.display = 'block';
  list.innerHTML = '';
  threads.forEach(thread => {
    list.appendChild(buildUserThreadItem(thread, latestMsgMap[thread.id]));
  });
}

function buildUserThreadItem(thread, latestMsg) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'border:1px solid var(--border); border-radius:10px; overflow:hidden; margin-bottom:8px;';

  const dispDate = latestMsg
    ? new Date(latestMsg.created_at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date(thread.created_at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const preview = latestMsg ? latestMsg.message.replace(/\n/g, ' ').slice(0, 28) + (latestMsg.message.length > 28 ? '…' : '') : '';

  const hdr = document.createElement('div');
  hdr.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:12px 14px; cursor:pointer;';
  hdr.innerHTML = `
    <div style="flex:1; min-width:0;">
      <p style="font-size:13px; color:var(--white); font-weight:600;">${escapeHtml(thread.title)}</p>
      ${preview ? `<p style="font-size:11px; color:var(--muted); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(preview)}</p>` : ''}
      <p style="font-size:10px; color:var(--muted); margin-top:2px;">${dispDate}</p>
    </div>
    <span style="font-size:11px; color:var(--muted); flex-shrink:0; margin-left:8px;">▼</span>`;

  const body = document.createElement('div');
  body.style.cssText = 'display:none; border-top:1px solid var(--border);';

  let loaded = false;
  hdr.addEventListener('click', async () => {
    const icon = hdr.querySelector('span');
    if (body.style.display === 'none') {
      body.style.display = 'block'; icon.textContent = '▲';
      if (!loaded) {
        loaded = true;
        body.innerHTML = '<p style="font-size:12px; color:var(--muted); padding:10px 14px;">読み込み中...</p>';
        await renderUserThreadMessages(thread.id, thread.user_id, body);
      }
    } else {
      body.style.display = 'none'; icon.textContent = '▼';
    }
  });

  wrap.appendChild(hdr);
  wrap.appendChild(body);
  return wrap;
}

async function renderUserThreadMessages(threadId, userId, container) {
  const { data: { session } } = await supabase.auth.getSession();
  const viewerId = session?.user?.id || '';

  const { data: msgs } = await supabase
    .from('messages')
    .select('id, sender_id, message, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  container.innerHTML = '';

  (msgs || []).forEach(msg => {
    const isSelf = msg.sender_id === viewerId;
    const date = new Date(msg.created_at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const d = document.createElement('div');
    d.style.cssText = `padding:10px 14px; border-bottom:1px solid var(--border); ${isSelf ? '' : 'background:rgba(200,241,53,0.04);'}`;
    d.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <span style="font-size:11px; font-weight:700; color:${isSelf ? '#4fc3f7' : 'var(--accent)'};">${isSelf ? 'あなた' : 'コーチ'}</span>
        <span style="font-size:10px; color:var(--muted);">${date}</span>
      </div>
      <p style="font-size:13px; color:var(--white); line-height:1.7; white-space:pre-wrap;">${escapeHtml(msg.message)}</p>`;
    container.appendChild(d);
  });

  const replyWrap = document.createElement('div');
  replyWrap.style.cssText = 'padding:12px 14px;';
  const ta = document.createElement('textarea');
  ta.placeholder = '返信を入力...';
  ta.style.cssText = 'width:100%; box-sizing:border-box; padding:10px 12px; background:var(--card-bg,#1e1e1e); border:1px solid var(--border); border-radius:8px; color:var(--white); font-size:13px; outline:none; resize:vertical; min-height:64px; font-family:"Noto Sans JP",sans-serif;';
  const sendBtn = document.createElement('button');
  sendBtn.textContent = '返信する';
  sendBtn.style.cssText = 'margin-top:8px; padding:9px 20px; background:var(--accent); color:#000; border:none; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer;';

  sendBtn.addEventListener('click', async () => {
    const message = ta.value.trim();
    if (!message) return;
    sendBtn.disabled = true; sendBtn.textContent = '送信中...';
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { sendBtn.disabled = false; sendBtn.textContent = '返信する'; return; }
    const { error } = await supabase.from('messages').insert({
      thread_id: threadId, sender_id: session.user.id, message
    });
    if (error) {
      alert('送信に失敗しました');
      sendBtn.disabled = false; sendBtn.textContent = '返信する';
    } else {
      ta.value = '';
      await renderUserThreadMessages(threadId, userId, container);
    }
  });

  replyWrap.appendChild(ta);
  replyWrap.appendChild(sendBtn);
  container.appendChild(replyWrap);
}


// ============================================================
// チェックインゲート
// ============================================================
function showAfterCheckin() {
  const checkinGate = document.getElementById('checkin-gate');
  if (checkinGate) checkinGate.style.display = 'none';
  mainContent.style.display = 'block';
  loadDashboard();
}

function renderCheckinSummary(checkin) {
  const card = document.getElementById('checkin-summary-card');
  const content = document.getElementById('checkin-summary-content');
  if (!card || !content || !checkin) return;

  const tags = [];
  if (checkin.focus) tags.push({ label: '目的', value: checkin.focus });
  if (checkin.priority) tags.push({ label: '重点', value: checkin.priority });
  if (checkin.condition) tags.push({ label: '体調', value: checkin.condition });
  if (checkin.sleep) tags.push({ label: '睡眠', value: checkin.sleep });
  if (checkin.note) tags.push({ label: 'メモ', value: checkin.note });

  content.innerHTML = tags.map(t =>
    `<span style="display:inline-flex; align-items:center; gap:4px; padding:5px 10px; background:rgba(255,255,255,0.04); border:1px solid var(--border); border-radius:6px; font-size:12px;">
      <span style="color:var(--muted);">${escapeHtml(t.label)}:</span>
      <span style="color:var(--white); font-weight:600;">${escapeHtml(t.value)}</span>
    </span>`
  ).join('');

  card.style.display = '';
}

function openCheckinForEdit() {
  const checkinGate = document.getElementById('checkin-gate');
  if (!checkinGate) return;

  const existing = getTodayCheckin();
  if (existing) {
    if (existing.focus) {
      const el = document.querySelector(`input[name="focus"][value="${existing.focus}"]`);
      if (el) el.checked = true;
    }
    if (existing.priority) {
      const el = document.querySelector(`input[name="priority"][value="${existing.priority}"]`);
      if (el) el.checked = true;
    }
    if (existing.condition) {
      const el = document.querySelector(`input[name="condition"][value="${existing.condition}"]`);
      if (el) el.checked = true;
    }
    if (existing.sleep) {
      const el = document.querySelector(`input[name="sleep"][value="${existing.sleep}"]`);
      if (el) el.checked = true;
    }
    const noteEl = document.getElementById('checkin-note');
    if (noteEl && existing.note) noteEl.value = existing.note;
  }

  mainContent.style.display = 'none';
  checkinGate.style.display = 'flex';
}

document.getElementById('checkin-edit-btn')?.addEventListener('click', openCheckinForEdit);

document.getElementById('checkin-save-btn')?.addEventListener('click', () => {
  const focus = document.querySelector('input[name="focus"]:checked')?.value || '';
  const priority = document.querySelector('input[name="priority"]:checked')?.value || '';
  const condition = document.querySelector('input[name="condition"]:checked')?.value || '';
  const sleep = document.querySelector('input[name="sleep"]:checked')?.value || '';
  const note = document.getElementById('checkin-note')?.value.trim() || '';

  if (!focus) { alert('目的を選択してください'); return; }
  if (!condition) { alert('体調を選択してください'); return; }

  const checkinData = { focus, priority, condition, sleep, note };
  saveTodayCheckin(checkinData);
  cachedUserContext = null;

  const checkinGate = document.getElementById('checkin-gate');
  if (checkinGate) checkinGate.style.display = 'none';
  mainContent.style.display = 'block';
  loadDashboard();
  renderCheckinSummary(checkinData);
});