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
    const latest = bodyRecords[0];
    ctx += `現在の体重: ${latest.weight ? latest.weight + 'kg' : '未記録'}`;
    ctx += ` / 体脂肪率: ${latest.body_fat ? latest.body_fat + '%' : '未記録'}`;
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
      ctx += ` / 期限: ${goal.target_date}（残り${daysLeft}日）`;
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
        const gap = (latest.body_fat - goal.goal_body_fat).toFixed(1);
        ctx += ` / 体脂肪率${gap > 0 ? '+' : ''}${gap}%`;
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

async function checkAllowed(email) {
  const { data } = await supabase
    .from('allowed_users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  return !!data;
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
    { label: '① 今の時間帯は？', options: ['朝', '昼', '夕方', '夜', '間食'] },
    { label: '② 今いる場所は？', options: ['コンビニ', '外食店', '家', '移動中'] },
    { label: '③ 今の空腹感は？', options: ['かなり空腹', '少し空腹', 'そこまで空腹じゃない', 'なんとなく食べたい'] }
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
  recovery_part: { label: '④ ケアしたい部位は？', options: ['首・肩', '背中・腰', '脚・ふくらはぎ', '腕・肘', '全身・疲労全般'] }
};

let questionAnswers = [];
let currentQuestionIndex = 0;

// 栄養提案のコンテキスト（PFC計算用）
let nutritionContext = { timeOfDay: null, hunger: null, mealTarget: null };

/**
 * cachedUserContext と nutritionContext から目標PFCを計算
 */
function calcMealTargetFromContext() {
  if (!cachedUserContext || !window.NutritionDB) return null;
  const NDB = window.NutritionDB;
  const weightMatch = cachedUserContext.match(/現在の体重:\s*([\d.]+)kg/);
  if (!weightMatch) return null;

  const weight = parseFloat(weightMatch[1]);
  const goalWeightMatch = cachedUserContext.match(/目標体重:\s*([\d.]+)kg/);
  const daysLeftMatch = cachedUserContext.match(/残り(\d+)日/);

  return NDB.calculateMealTarget({
    weight,
    goalNum: selectedGoal,
    goalWeight: goalWeightMatch ? parseFloat(goalWeightMatch[1]) : null,
    daysLeft: daysLeftMatch ? parseInt(daysLeftMatch[1]) : null,
    timeOfDay: nutritionContext.timeOfDay,
    hunger: nutritionContext.hunger || '少し空腹',
    size: nutritionContext.size || '普通'
  });
}

function buildPFCTargetHeader(target) {
  if (!target) return '';
  const pRatioPct = Math.round((target.pRatio || 0.25) * 100);
  const fRatioPct = Math.round((target.fRatio || 0.25) * 100);
  const cRatioPct = 100 - pRatioPct - fRatioPct;
  const pMin = pRatioPct - 5, pMax = pRatioPct + 5;
  const fMin = fRatioPct - 5, fMax = fRatioPct + 5;
  const cMin = cRatioPct - 5, cMax = cRatioPct + 5;
  const chickenG  = Math.round(target.p * 0.87 / 0.233);
  const codG      = Math.round(target.p * 0.87 / 0.178);
  const salmonG   = Math.round(target.p * 0.87 / 0.208);
  const tunaG     = Math.round(target.p * 0.87 / 0.264);
  const riceG     = Math.round(target.c / 0.371);
  const brownRiceG = Math.round(target.c / 0.345);
  let header =
    `【PFC目標（絶対厳守）】\n` +
    `${target.cal}kcal / P${target.p}g / F${target.f}g / C${target.c}g\n` +
    `比率: P${pRatioPct}% F${fRatioPct}% C${cRatioPct}%（許容±5%: P${pMin}〜${pMax}% F${fMin}〜${fMax}% C${cMin}〜${cMax}%）\n` +
    `1日目安: ${target.dailyCal}kcal / 1日P: ${target.dailyP}g${target.deficit ? ` / 目標赤字: -${target.deficit}kcal/日` : ''}\n` +
    `\n` +
    `【食材量の逆算手順（この順で必ず実行）】\n` +
    `ステップ1 タンパク質 P${target.p}gを確保:\n` +
    `  鶏胸肉→${chickenG}g / タラ→${codG}g / サーモン→${salmonG}g / マグロ赤身→${tunaG}g\n` +
    `ステップ2 脂質 F${target.f}gを確保（絶対に超えないこと）:\n` +
    `  食材由来の脂質を合計し、目標F${target.f}gとの差分だけ油脂食材で補う\n` +
    `  差分がマイナス（食材だけで超過）の場合は油脂食材を使わない\n` +
    `ステップ3 炭水化物 C${target.c}gを確保:\n` +
    `  白米→${riceG}g / 玄米→${brownRiceG}g\n` +
    `\n` +
    `⚠️ PFC目標は自分で計算しないこと。上記グラム数に食材量を合わせるだけでよい。\n` +
    `⚠️ 3候補すべてが許容範囲内に収まること。\n` +
    `---\n` +
    `\n上記【食材PFC早見表】と【PFC比率が合う具体例】を必ず参考にして、` +
    `食材の種類と量を決めること。例と異なる食材を使う場合も必ず同じ計算手順で量を逆算すること。\n` +
    `---\n`;

  // nutrition-db.jsのソルバーで3候補を事前計算
  if (window.NutritionDB && window.NutritionDB.buildPFCTargetPrompt) {
    const solvedMeals = window.NutritionDB.buildPFCTargetPrompt(target.goalNum, target);
    if (solvedMeals) {
      header += solvedMeals;
    }
  }

  return header;
}

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
    // 栄養質問の場合、回答を保存（PFC計算用）
    if (selectedMethod === 'nutrition' && questionAnswers.length >= 3) {
      nutritionContext.timeOfDay = questionAnswers[0]; // 朝/昼/夕方/夜/間食
      nutritionContext.hunger = questionAnswers[2];    // かなり空腹/少し空腹/そこまで空腹じゃない/なんとなく食べたい
    }
    const summary = questionAnswers
      .map((ans, i) => `${questions[i].label} → ${ans}`)
      .join('\n');
    addMessage('user', summary);

    // 栄養提案の場合: 目標PFCを計算してAIに渡す
    let mealTargetHeader = '';
    if (selectedMethod === 'nutrition' && nutritionContext.timeOfDay && window.NutritionDB) {
      const target = calcMealTargetFromContext();
      if (target) {
        nutritionContext.mealTarget = target;
        const NDB = window.NutritionDB;
        mealTargetHeader = buildPFCTargetHeader(target);

        // 目的別の食材優先指示
        const foodPriority = {
          '1': '【食材優先】高タンパク低脂質食材を優先: 鶏胸肉・鶏ささみ・タラ・豆腐・卵白・白身魚。脂質の多い食材（豚バラ・牛バラ等）は避ける。\n',
          '2': '【食材優先】高タンパク高炭水化物食材を優先: 鶏胸肉・鶏もも肉・牛もも肉・卵・白米・さつまいも。炭水化物をしっかり確保すること。\n',
          '3': '【食材優先】炭水化物多め＋良質タンパク: 白米・玄米・オートミール・鮭・サバ・バナナ・果物。持久力のためグリコーゲン補充を重視。\n',
          '4': '【食材優先】消化の良い食材のみ使用: 白米（おかゆ）・うどん・豆腐・タラ・卵・バナナ。脂質の多い食材・揚げ物・刺激物は禁止。\n',
          '5': '【食材優先】高タンパク低カロリー食材を優先: 鶏胸肉・鶏ささみ・タラ・豆腐・野菜・玄米・卵。脂質を抑えつつタンパク質を確保。\n'
        };
        mealTargetHeader += foodPriority[target.goalNum] || '';

        // PFC逆算メニュー設計プロンプトを注入
        mealTargetHeader += NDB.buildPFCTargetPrompt(target.goalNum, target);

        // 筋肥大目的(goal 2)の夜食事: タンパク質を強調
        if (target.goalNum === '2' && nutritionContext.timeOfDay === '夜') {
          mealTargetHeader += `【筋肥大・夜の食事】この食事でP${target.p}g以上を確保すること。1日合計P${target.dailyP}g達成のため、高タンパク食材（鶏胸肉・鮭・卵・豆腐等）を中心に提案すること。カゼインタンパク質（乳製品）も有効。\n`;
        }
        // 不調改善の場合: 消化優先の追加指示
        if (target.goalNum === '4') {
          const fRatioPct = Math.round((target.fRatio || 0.25) * 100);
          mealTargetHeader += `【不調改善】脂質${fRatioPct}%以下で胃腸負荷を最小化。調理法は蒸す・茹でる・煮るを優先。揚げ物・炒め物は禁止。\n`;
        }
        // 「揚げ物はたまに食べたい」選択時
        if (selectedSub === '揚げ物はたまに食べたい') {
          mealTargetHeader += `【揚げ物について】揚げ物を完全禁止にしないこと。「週1〜2回なら揚げ物もOK。ただし今日は上記のメニューで脂質を抑えて、揚げ物は別の日に楽しみましょう」のように一言添えること。\n`;
        }
      }
    }
    conversationHistory.push({ role: 'user', content: mealTargetHeader + summary });
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
      addMessage('assistant', '【エラー】通信に失敗しました。');
      console.error('showQuestionStepエラー:', err);
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
      showQuestionStep(questions);
    });
    btnGroup.appendChild(btn);
  });

  addOtherInput(btnGroup, div, (val) => {
    questionAnswers.push(val);
    currentQuestionIndex++;
    showQuestionStep(questions);
  });

  div.appendChild(btnGroup);
  chatHistory.appendChild(div);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function showNutritionQuestions() {
  questionAnswers = [];
  currentQuestionIndex = 0;
  nutritionContext = { timeOfDay: null, hunger: null, mealTarget: null };
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
      await showQuestionStepFinal([...baseAnswers, ...questionAnswers], extraQuestions, splitChoice);
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
    "nutrition": ['ちゃんと管理したい','ざっくりでいい','揚げ物はたまに食べたい','外食が多い','お酒はやめたくない','間食が多い','朝食を食べていない','夜に食べすぎる'],
    "training":  ['家でやりたい','ジムに通っている','短時間で終わらせたい','きつすぎるのは無理','汗かきたい','続かない・モチベが上がらない','怪我・痛みがある'],
    "recovery":  ['睡眠の質を上げたい','運動後の回復を早めたい','ストレスで食欲が乱れる','疲れて運動できない日が続いている','むくみ・炎症が気になる','睡眠時間が足りない']
  },
  "2": {
    "nutrition": ['食べる量増やせる','あまり食べられない','太りすぎは嫌','プロテインは飲める','食事が不規則','外食が多い'],
    "training":  ['ジムで本気でやる','家トレ中心','毎日少しずつやりたい','週3回しっかりやりたい','種目がわからない','怪我・痛みがある'],
    "recovery":  ['筋肉痛がひどい','関節が少し不安','睡眠時間が短い','トレ後の回復を早めたい','オーバートレーニング気味','ストレスが多い']
  },
  "3": {
    "nutrition": ['すぐ疲れる','午後にだるくなる','エネルギー切れやすい','朝が起きられない','集中力が続かない'],
    "training":  ['走れるようになりたい','階段で息切れしたくない','スポーツうまくなりたい','筋力をつけたい','短時間で体力をつけたい'],
    "recovery":  ['呼吸が浅い気がする','寝てもスッキリしない','パフォーマンスが落ちてきた','疲労が蓄積している','集中力が続かない','日中に眠くなる']
  },
  "4": {
    "nutrition": ['胃腸が弱い','むくみやすい','甘いものやめられない','食欲がない','頭痛がよくある'],
    "training":  ['腰が不安','肩こりがある','体が硬い','膝が不安','足がつりやすい'],
    "recovery":  ['眠りが浅い','ストレスが強い','リラックスできない','体がだるい','頭痛がある','気力が湧かない']
  },
  "5": {
    "nutrition": ['お腹だけ気になる','下半身が気になる','顔のむくみ気になる','二の腕が気になる','全体的に引き締めたい'],
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
  // 長い行が1つでもあればコンテンツ（レシピ手順等）とみなす
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

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================
// トレーニングプラン構造化レンダリング
// ============================================================
function isTrainingPlan(text) {
  const courseCount = [/🔥/, /💪/, /⚡/].filter(r => r.test(text)).length;
  return courseCount >= 2;
}

function renderTrainingContent(text) {
  const lines = text.split('\n');
  let html = '';

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^[🔥💪⚡]/.test(trimmed)) {
      html += `<div class="tp-course">${escapeHtml(line)}</div>`;
    } else if (/^▼/.test(trimmed)) {
      html += `<div class="tp-section">${escapeHtml(line)}</div>`;
    } else if (/^\d+\.\s/.test(trimmed)) {
      html += `<div class="tp-exercise">${escapeHtml(line)}</div>`;
    } else {
      html += escapeHtml(line) + '<br>';
    }
  }

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
    .single();

  console.log('サービス状態:', serviceData, serviceError);

  if (serviceData?.value === 'false') {
    alert('現在サービスを停止中です。しばらくお待ちください。');
    return;
  }

  const { data: blockData } = await supabase
    .from('blocked_users')
    .select('user_id')
    .eq('user_id', session.user.id)
    .single();

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
        parts.push(`期限: ${goal.target_date}（残り${daysLeft}日）`);
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
  // target_dateカラムがない環境にも対応
  let { data, error } = await supabase
    .from('user_goals')
    .select('goal_weight, goal_body_fat, target_date')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    // target_dateカラムがなければフォールバック
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

document.getElementById('goal-save-btn')?.addEventListener('click', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const goalWeight = parseFloat(document.getElementById('goal-weight-input').value) || null;
  const goalBodyFat = parseFloat(document.getElementById('goal-bodyfat-input').value) || null;
  const targetDate = document.getElementById('goal-date-input')?.value || null;
  if (!goalWeight && !goalBodyFat) { alert('目標体重か目標体脂肪率を入力してください'); return; }
  await saveGoal(session.user.id, goalWeight, goalBodyFat, targetDate);
  document.getElementById('goal-weight-input').value = '';
  document.getElementById('goal-bodyfat-input').value = '';
  if (document.getElementById('goal-date-input')) document.getElementById('goal-date-input').value = '';
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

  // ログイン後に初回のみ表示
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

// loadDashboardの先頭でスケルトン表示するようにパッチ
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

  historyCard.style.display = 'block';

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

// チャット履歴の詳細表示
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

  // 体重・体脂肪率データ
  const { data: bodyRecords } = await supabase
    .from('body_records')
    .select('weight, body_fat, recorded_at, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: true })
    .limit(90);

  // 利用頻度データ
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
  const { cleanText, options } = parseOptions(text);
  div.innerHTML = escapeHtml(cleanText).replace(/\n/g, '<br>');
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function finalizeStreamingMessage(div, text) {
  div.classList.remove('streaming-cursor');

  // トレーニングプランの場合は構造化レンダリング
  if (isTrainingPlan(text)) {
    div.innerHTML = renderTrainingContent(text);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return;
  }

  // 栄養提案の場合: [ITEMS:]タグをパースしてPFCバッジに置換
  const isNutrition = isNutritionResponse(text);
  let processedText = text;

  if (isNutrition && window.NutritionDB) {
    // まずオプションを元テキストから抽出、その後PFCレンダリング
    const { cleanText: textWithoutOptions, options } = parseOptions(text);
    processedText = renderNutritionWithPFC(textWithoutOptions);
    div.innerHTML = processedText; // すでにHTMLが含まれている

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

  // 選択肢ボタンを表示（AIが出力した場合 or 栄養提案の場合にレシピボタンを強制追加）
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

/**
 * 栄養提案テキストの「・食材 量（調理法）」行を解析し、
 * 候補ごとにPFCをDB計算して「約○kcal｜P○g F○g C○g」で表示
 */
function renderNutritionWithPFC(text, containerDiv) {
  const NDB = window.NutritionDB;
  // AIが直接出力してしまったPFC数値行を除去
  text = text.replace(/[（(]\s*(?:全体の)?目安[:：]?\s*約?\d+.*?kcal.*?[）)]/g, '');
  text = text.replace(/[（(]\s*約\d+kcal[｜|]P\d+g\s*F\d+g\s*C\d+g\s*[）)]/g, '');
  // 旧形式の[ITEMS:]タグも除去
  text = text.replace(/\[ITEMS:[^\]]*\]/g, '');
  let html = '';

  // 1食目安の計算（目標体重・期限ベース）
  const mealTarget = nutritionContext.mealTarget || calcMealTargetFromContext();

  // 冒頭に1食目安バッジを挿入
  if (mealTarget) {
    const timeLabel = nutritionContext.timeOfDay || '';
    const hungerLabel = nutritionContext.hunger || '';
    let targetLabel = `📊 あなたの1食の目安（${timeLabel}・${hungerLabel}）`;
    if (mealTarget.deficit > 0) {
      targetLabel += `<span class="pfc-deficit">※目標逆算: -${mealTarget.deficit}kcal/日</span>`;
    }
    html += NDB.createPFCBadgeHTML(mealTarget, targetLabel);
    html += '<br>';
  }

  // テキストを行ごとに処理し、「・食材 量（調理法）」をパース
  const lines = text.split('\n');
  // 食材行パターン: ・食材名 量（調理法）or ・食材名 量
  const foodLinePattern = /^・(.+?)\s+([\d./半]+\s*(?:g|ml|切れ?|個|本|杯|枚|パック|缶|皿|食|人前|玉|丁|粒|[大小]さじ[\d./]*)?)\s*(?:[（(]([^）)]+)[）)])?$/;
  const foodLinePattern2 = /^・(.+?)\s+([大小]さじ[\d./]+)\s*(?:[（(]([^）)]+)[）)])?$/;
  let currentItems = [];      // 現在の候補の食材リスト
  let currentCookingMap = {}; // index → 調理法名
  let inCandidate = false;    // 候補セクション内か

  function flushCandidate() {
    if (currentItems.length === 0) return;
    // PFC計算（contextTextなしで呼び、旧detectCookingOilAdjustmentを使わない）
    const pfc = NDB.calculateItemsPFC(currentItems);
    // 調理法による補正（各食材の調理法を個別に適用）
    let cookingFAdj = 0, cookingCalAdj = 0;
    for (let i = 0; i < currentItems.length; i++) {
      const method = currentCookingMap[i];
      if (!method) continue;
      const cm = NDB.COOKING_METHODS[method];
      if (!cm) continue;
      // この食材のカロリーを取得して補正
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

    // PFC比率を計算（P*4+F*9+C*4ベースで合計100%を保証）
    const pfcCal = totalP * 4 + totalF * 9 + totalC * 4;
    let pPct = 0, fPct = 0, cPct = 0;
    if (pfcCal > 0) {
      pPct = Math.round((totalP * 4 / pfcCal) * 100);
      fPct = Math.round((totalF * 9 / pfcCal) * 100);
      cPct = 100 - pPct - fPct; // 残りをCに割り当てて合計100%を保証
    }

    // PFC行を挿入
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
    currentItems = [];
    currentCookingMap = {};
  }

  for (const line of lines) {
    const trimmed = line.trim();

    // 候補ヘッダー検出（▼ で始まる行）
    if (/^▼\s/.test(trimmed)) {
      // 前の候補のPFCを出力
      flushCandidate();
      inCandidate = true;
      html += escapeHtml(line) + '<br>';
      continue;
    }

    // 食材行の検出
    if (inCandidate && trimmed.startsWith('・')) {
      // パターン2: 大さじ/小さじ優先
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

    // 候補セクション内で食材行以外が来たらPFCを出力
    // （説明文、空行、【セクション、番号リスト等）
    if (inCandidate && currentItems.length > 0 && !trimmed.startsWith('・')) {
      flushCandidate();
      if (/^【/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
        inCandidate = false;
      }
    }

    html += escapeHtml(line) + '<br>';
  }

  // 最後の候補のPFC出力
  flushCandidate();

  return html;
}

function isNutritionResponse(text) {
  return text.includes('第一候補') && text.includes('第二候補') && text.includes('これならOK');
}

// ============================================================
// 通知バナー
// ============================================================
(function initNotificationBanner() {
  const banner = document.getElementById('notification-banner');
  const enableBtn = document.getElementById('notification-enable-btn');
  const closeBtn = document.getElementById('notification-close-btn');
  if (!banner || !enableBtn || !closeBtn) return;

  // PWA対応 + 通知未許可 + まだ閉じていない場合に表示
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
  // 非同期で追加データを読み込み
  loadChatHistoryList().catch(console.error);
  loadProgressChart().catch(console.error);
  // ユーザーコンテキストをプリロード
  buildUserContext().catch(console.error);
};

// ============================================================
// チェックインゲート
// ============================================================
function showAfterCheckin() {
  const existing = getTodayCheckin();
  const checkinGate = document.getElementById('checkin-gate');

  if (existing) {
    // 今日チェックイン済み → そのままメイン表示
    if (checkinGate) checkinGate.style.display = 'none';
    mainContent.style.display = 'block';
    loadDashboard();
    renderCheckinSummary(existing);
  } else {
    // 未チェックイン → ゲート表示
    mainContent.style.display = 'none';
    if (checkinGate) checkinGate.style.display = 'flex';
  }
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

  // 既存の値をラジオボタンに復元
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

  // ゲートを閉じてメインを表示
  const checkinGate = document.getElementById('checkin-gate');
  if (checkinGate) checkinGate.style.display = 'none';
  mainContent.style.display = 'block';
  loadDashboard();
  renderCheckinSummary(checkinData);
});


