import { supabase } from '/supabase.js';
console.log('admin.js読み込み完了');

function escapeHtml(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function getExpireInfo(createdAt) {
  if (!createdAt) return { label: '不明', cls: 'expire-warn', daysLeft: null };
  const purchase = new Date(createdAt);
  const expire = new Date(purchase);
  expire.setMonth(expire.getMonth() + 3);
  const now = new Date();
  const daysLeft = Math.ceil((expire - now) / (1000 * 60 * 60 * 24));
  const expireStr = expire.toISOString().split('T')[0];
  if (daysLeft < 0) return { label: `期限切れ (${expireStr})`, cls: 'expire-expired', daysLeft };
  if (daysLeft <= 14) return { label: `残${daysLeft}日 (${expireStr})`, cls: 'expire-warn', daysLeft };
  return { label: `残${daysLeft}日 (${expireStr})`, cls: 'expire-ok', daysLeft };
}

const authCheck        = document.getElementById('auth-check');
const adminContent     = document.getElementById('admin-content');
const serviceStatus    = document.getElementById('service-status');
const toggleServiceBtn = document.getElementById('toggle-service-btn');
const userList         = document.getElementById('user-list');

async function checkAdmin() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    authCheck.innerHTML = '<p style="color:var(--red); text-align:center;">ログインしてください</p>';
    return;
  }
  const { data } = await supabase.from('admins').select('user_id').eq('user_id', session.user.id).single();
  if (!data) {
    authCheck.innerHTML = '<p style="color:var(--red); text-align:center;">アクセス権限がありません</p>';
    return;
  }
  authCheck.style.display = 'none';
  adminContent.style.display = 'block';
  loadServiceStatus();
  loadAllowedUsers();
  loadUsers().catch(e => console.error('loadUsersエラー:', e));
  loadReferralStats();
  loadSummary();
}

// ============================================================
// サービス停止
// ============================================================
async function loadServiceStatus() {
  const { data } = await supabase.from('service_settings').select('value').eq('key', 'service_active').single();
  updateServiceUI(data?.value === 'true');
}

function updateServiceUI(isActive) {
  if (isActive) {
    serviceStatus.textContent = '● 稼働中';
    serviceStatus.style.color = 'var(--accent)';
    toggleServiceBtn.querySelector('.btn-text').textContent = 'サービスを停止する';
    toggleServiceBtn.style.borderColor = 'var(--red)';
    toggleServiceBtn.style.color = 'var(--red)';
  } else {
    serviceStatus.textContent = '● 停止中';
    serviceStatus.style.color = 'var(--red)';
    toggleServiceBtn.querySelector('.btn-text').textContent = 'サービスを再開する';
    toggleServiceBtn.style.borderColor = 'var(--accent)';
    toggleServiceBtn.style.color = 'var(--accent)';
  }
}

toggleServiceBtn.addEventListener('click', async () => {
  const { data } = await supabase.from('service_settings').select('value').eq('key', 'service_active').single();
  const newValue = data?.value === 'true' ? 'false' : 'true';
  await supabase.from('service_settings').update({ value: newValue }).eq('key', 'service_active');
  updateServiceUI(newValue === 'true');
});

// ============================================================
// 全体サマリー
// ============================================================
async function loadSummary() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const mondayStr = monday.toISOString().split('T')[0];
  const mondayStart = mondayStr + 'T00:00:00';

  const [
    { data: allUsers },
    { data: allowedUsers },
    { data: weeklyUsage },
    { data: weeklyChats }
  ] = await Promise.all([
    supabase.from('all_users').select('id, email'),
    supabase.from('allowed_users').select('email, created_at'),
    supabase.from('usage_limits').select('user_id, count, date').gte('date', mondayStr),
    supabase.from('chat_history').select('method').gte('created_at', mondayStart)
  ]);

  const totalUsers = (allUsers || []).length;
  const activeUserIds = new Set((weeklyUsage || []).filter(r => r.count > 0).map(r => r.user_id));
  const activeCount = activeUserIds.size;
  const allowedCount = (allowedUsers || []).length;

  let expiredCount = 0;
  (allowedUsers || []).forEach(u => {
    const { daysLeft } = getExpireInfo(u.created_at);
    if (daysLeft !== null && daysLeft < 0) expiredCount++;
  });

  const methodCount = { nutrition: 0, training: 0, recovery: 0 };
  (weeklyChats || []).forEach(h => {
    if (methodCount[h.method] !== undefined) methodCount[h.method]++;
  });

  document.getElementById('s-total').textContent = totalUsers;
  document.getElementById('s-active').textContent = activeCount;
  document.getElementById('s-allowed').textContent = allowedCount;
  document.getElementById('s-expired').textContent = expiredCount;
  document.getElementById('s-nutrition').textContent = methodCount.nutrition;
  document.getElementById('s-training').textContent = methodCount.training;
  document.getElementById('s-recovery').textContent = methodCount.recovery;

  // 期限切れ一覧
  loadExpiredUsers(allowedUsers || []);
}

// ============================================================
// 期限切れ一覧
// ============================================================
function loadExpiredUsers(allowedUsers) {
  const expiredList = document.getElementById('expired-list');
  const expiring = allowedUsers
    .map(u => ({ ...u, expireInfo: getExpireInfo(u.created_at) }))
    .filter(u => u.expireInfo.daysLeft !== null && u.expireInfo.daysLeft < 30)
    .sort((a, b) => a.expireInfo.daysLeft - b.expireInfo.daysLeft);

  if (expiring.length === 0) {
    expiredList.innerHTML = '<p style="color:var(--muted); font-size:13px;">期限切れ・期限間近のユーザーなし</p>';
    return;
  }

  expiredList.innerHTML = expiring.map(u => {
    const { label, cls } = u.expireInfo;
    const purchase = new Date(u.created_at);
    const purchaseStr = purchase.toISOString().split('T')[0];
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 14px; background:#1e1e1e; border:1px solid var(--border); border-radius:10px; margin-bottom:8px;">
        <div>
          <p style="font-size:13px; color:var(--white); margin-bottom:3px;">${escapeHtml(u.email)}</p>
          <p style="font-size:11px; color:var(--muted);">購入日: ${purchaseStr}</p>
        </div>
        <span class="expire-badge ${cls}">${label}</span>
      </div>
    `;
  }).join('');
}

// ============================================================
// ユーザー詳細取得
// ============================================================
async function loadUserDetail(userId) {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  const mondayStr = monday.toISOString().split('T')[0];
  const mondayStart = mondayStr + 'T00:00:00';

  const [
    { data: usageData },
    { data: bodyDatesData },
    { data: chatData },
    { data: bodyData },
    { data: startData },
    { data: goalData },
    { data: consentData },
    { data: analysisData },
    { data: workoutData }
  ] = await Promise.all([
    supabase.from('usage_limits').select('date, count').eq('user_id', userId).order('date', { ascending: false }),
    supabase.from('body_records').select('recorded_at').eq('user_id', userId),
    supabase.from('chat_history').select('method, goal, sub, messages, created_at').eq('user_id', userId).gte('created_at', mondayStart).order('created_at', { ascending: false }),
    supabase.from('body_records').select('weight, body_fat, recorded_at, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
    supabase.from('body_records').select('weight, body_fat, recorded_at, created_at').eq('user_id', userId).order('created_at', { ascending: true }).limit(1),
    supabase.from('user_goals').select('goal_weight, goal_body_fat').eq('user_id', userId).maybeSingle(),
    supabase.from('user_consents').select('consented_at, terms_version, privacy_version').eq('user_id', userId).order('consented_at', { ascending: false }).limit(1),
    supabase.from('personal_analysis').select('type_name, full_result, nutrition_count, training_count, recovery_count, streak, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
    supabase.from('workout_logs').select('exercise, sets, reps, weight, date').eq('user_id', userId).order('date', { ascending: false }).limit(20)
  ]);

  const activeDates = new Set();
  (usageData || []).filter(r => r.count > 0).forEach(r => activeDates.add(r.date));
  (bodyDatesData || []).forEach(r => { if (r.recorded_at) activeDates.add(r.recorded_at); });

  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let streak = 0;
  if (activeDates.has(todayStr)) {
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (activeDates.has(d.toISOString().split('T')[0])) streak++;
      else break;
    }
  } else if (activeDates.has(yesterdayStr)) {
    for (let i = 1; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (activeDates.has(d.toISOString().split('T')[0])) streak++;
      else break;
    }
  }

  const weeklyTotal = (usageData || []).filter(r => r.date >= mondayStr).reduce((sum, r) => sum + r.count, 0);
  const methodCount = { nutrition: 0, training: 0, recovery: 0 };
  (chatData || []).forEach(h => { if (methodCount[h.method] !== undefined) methodCount[h.method]++; });

  const totalDays = activeDates.size;
  const firstUsage = [...activeDates].sort()[0] || null;
  const consent = (consentData && consentData.length > 0) ? consentData[0] : null;
  const startRecord = (startData && startData.length > 0) ? startData[0] : null;

  return {
    streak, weeklyTotal, totalDays, firstUsage, methodCount,
    bodyData: bodyData || [], startRecord, goalData: goalData || null,
    consent, analysisData: analysisData || [],
    workoutData: workoutData || []
  };
}

// ============================================================
// ユーザー詳細HTML生成
// ============================================================
function renderAdminGauge(label, unit, startVal, currentVal, goalVal, color) {
  if (startVal == null || currentVal == null || goalVal == null) return '';
  const isIncrease = goalVal > startVal;
  const totalChange = Math.abs(goalVal - startVal);
  const currentChange = isIncrease ? currentVal - startVal : startVal - currentVal;
  let pct = totalChange !== 0 ? Math.round((currentChange / totalChange) * 100) : 0;
  pct = Math.max(0, Math.min(100, pct));
  const remaining = Math.abs(currentVal - goalVal).toFixed(1);
  const reached = isIncrease ? currentVal >= goalVal : currentVal <= goalVal;
  const diffText = reached ? '目標達成！🎉' : `あと ${remaining}${unit}`;
  const rawChange = (currentVal - startVal).toFixed(1);
  const changeText = rawChange > 0 ? `+${rawChange}${unit}` : rawChange < 0 ? `${rawChange}${unit}` : '変化なし';
  return `
    <div style="margin-bottom:14px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
        <p style="font-size:12px; color:var(--white); font-weight:700;">${label}</p>
        <p style="font-size:11px; color:${color};">${diffText}</p>
      </div>
      <div style="background:#222; border-radius:100px; height:8px; overflow:hidden;">
        <div style="height:100%; width:${pct}%; background:${color}; border-radius:100px;"></div>
      </div>
      <div style="display:flex; justify-content:space-between; margin-top:5px;">
        <p style="font-size:11px; color:var(--muted);">スタート: ${startVal}${unit}</p>
        <p style="font-size:11px; color:var(--muted);">${pct}%達成</p>
        <p style="font-size:11px; color:var(--muted);">目標: ${goalVal}${unit}</p>
      </div>
      <p style="font-size:11px; color:var(--muted); margin-top:3px; text-align:center;">変化: <span style="color:${color};">${changeText}</span>　現在: <span style="color:var(--white);">${currentVal}${unit}</span></p>
    </div>
  `;
}

function buildDetailHTML({ streak, weeklyTotal, totalDays, firstUsage, methodCount, bodyData, startRecord, goalData, consent, analysisData, workoutData }) {
  const methodLabel = { nutrition: '🥗 栄養', training: '🏋️ トレーニング', recovery: '😴 回復' };

  // 同意状態
  let consentHtml = '';
  if (consent) {
    const date = new Date(consent.consented_at);
    const dateStr = `${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
    consentHtml = `
      <div style="margin-bottom:14px;">
        <p style="font-size:11px; color:var(--accent); margin-bottom:8px; letter-spacing:0.1em;">CONSENT STATUS</p>
        <div style="background:#1a2a1a; border:1px solid var(--accent); border-radius:10px; padding:12px 14px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <span style="font-size:16px;">✅</span>
            <p style="font-size:13px; color:var(--accent); font-weight:700;">同意済み</p>
          </div>
          <p style="font-size:12px; color:var(--muted);">同意日時：${dateStr}</p>
        </div>
      </div>
    `;
  } else {
    consentHtml = `
      <div style="margin-bottom:14px;">
        <p style="font-size:11px; color:var(--accent); margin-bottom:8px; letter-spacing:0.1em;">CONSENT STATUS</p>
        <div style="background:#2a1a1a; border:1px solid var(--red); border-radius:10px; padding:12px 14px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:16px;">⚠️</span>
            <p style="font-size:13px; color:var(--red); font-weight:700;">未同意</p>
          </div>
        </div>
      </div>
    `;
  }

  // 統計
  const statsHtml = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
      <div style="background:#111; border:1px solid var(--border); border-radius:10px; padding:14px; text-align:center;">
        <p style="font-size:28px; font-weight:700; color:var(--accent); line-height:1;">${streak}</p>
        <p style="font-size:11px; color:var(--muted); margin-top:4px;">🔥 連続利用日数</p>
      </div>
      <div style="background:#111; border:1px solid var(--border); border-radius:10px; padding:14px; text-align:center;">
        <p style="font-size:28px; font-weight:700; color:var(--white); line-height:1;">${weeklyTotal}</p>
        <p style="font-size:11px; color:var(--muted); margin-top:4px;">📅 今週の利用回数</p>
      </div>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px;">
      <div style="background:#111; border:1px solid var(--border); border-radius:10px; padding:14px; text-align:center;">
        <p style="font-size:28px; font-weight:700; color:#4fc3f7; line-height:1;">${totalDays}</p>
        <p style="font-size:11px; color:var(--muted); margin-top:4px;">📊 累計利用日数</p>
      </div>
      <div style="background:#111; border:1px solid var(--border); border-radius:10px; padding:14px; text-align:center;">
        <p style="font-size:16px; font-weight:700; color:var(--muted); line-height:1.3;">${firstUsage || '-'}</p>
        <p style="font-size:11px; color:var(--muted); margin-top:4px;">📅 初回利用日</p>
      </div>
    </div>
  `;

  // 今週の内訳
  const weeklyHtml = `
    <div style="margin-bottom:14px;">
      <p style="font-size:11px; color:var(--accent); margin-bottom:8px; letter-spacing:0.1em;">WEEKLY REPORT</p>
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">
        ${Object.entries(methodCount).map(([key, val]) => `
          <div style="background:#111; border:1px solid var(--border); border-radius:10px; padding:12px; text-align:center;">
            <p style="font-size:22px; font-weight:700; color:var(--accent); line-height:1;">${val}</p>
            <p style="font-size:11px; color:var(--muted); margin-top:4px;">${methodLabel[key]}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // 目標・進捗
  let goalHtml = '';
  if (goalData && (goalData.goal_weight != null || goalData.goal_body_fat != null)) {
    const parts = [];
    if (goalData.goal_weight != null) parts.push(`目標体重: <strong>${goalData.goal_weight}kg</strong>`);
    if (goalData.goal_body_fat != null) parts.push(`目標体脂肪率: <strong>${goalData.goal_body_fat}%</strong>`);
    let gaugeHtml = '';
    if (goalData.goal_weight != null) {
      const currentWeight = bodyData.find(r => r.weight != null)?.weight ?? null;
      const startWeight = [...bodyData].reverse().find(r => r.weight != null)?.weight ?? null;
      if (currentWeight != null && startWeight != null && startWeight !== currentWeight) {
        gaugeHtml += renderAdminGauge('体重', 'kg', startWeight, currentWeight, goalData.goal_weight, 'var(--accent)');
      } else if (currentWeight != null) {
        const remaining = Math.abs(currentWeight - goalData.goal_weight).toFixed(1);
        gaugeHtml += `<p style="font-size:12px; color:var(--muted); margin-bottom:10px;">体重: 現在 <strong style="color:var(--white);">${currentWeight}kg</strong> → 目標 <strong style="color:var(--accent);">${goalData.goal_weight}kg</strong>　あと ${remaining}kg</p>`;
      }
    }
    goalHtml = `
      <div style="margin-bottom:14px;">
        <p style="font-size:11px; color:var(--accent); margin-bottom:8px; letter-spacing:0.1em;">GOAL & PROGRESS</p>
        <div style="background:#111; border:1px solid var(--border); border-radius:10px; padding:14px;">
          <p style="font-size:12px; color:var(--muted); margin-bottom:12px;">${parts.join('　／　')}</p>
          ${gaugeHtml || '<p style="font-size:12px; color:var(--muted);">記録が追加されるとゲージが表示されます</p>'}
        </div>
      </div>
    `;
  }

  // 体組成記録
  let bodyHtml = '';
  if (bodyData && bodyData.length > 0) {
    const rows = bodyData.slice(0, 5).map(r => `
      <div style="display:flex; justify-content:space-between; padding:8px 12px; border-bottom:1px solid var(--border);">
        <p style="font-size:12px; color:var(--muted);">${r.recorded_at || '-'}</p>
        <p style="font-size:12px; color:var(--white);">${r.weight != null ? r.weight + 'kg' : '-'} ／ ${r.body_fat != null ? r.body_fat + '%' : '-'}</p>
      </div>
    `).join('');
    bodyHtml = `
      <div style="margin-bottom:14px;">
        <p style="font-size:11px; color:var(--accent); margin-bottom:8px; letter-spacing:0.1em;">BODY RECORD</p>
        <div style="background:#111; border:1px solid var(--border); border-radius:10px; overflow:hidden;">${rows}</div>
      </div>
    `;
  }

  // トレーニング記録
  let workoutHtml = '';
  if (workoutData && workoutData.length > 0) {
    const rows = workoutData.slice(0, 10).map(l => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; border-bottom:1px solid var(--border);">
        <div>
          <p style="font-size:13px; color:var(--white); font-weight:700;">${escapeHtml(l.exercise)}</p>
          <p style="font-size:11px; color:var(--muted);">${l.sets}セット × ${l.reps}回 × ${l.weight}kg</p>
        </div>
        <div style="text-align:right;">
          <p style="font-family:'Bebas Neue',sans-serif; font-size:18px; color:var(--accent);">${(l.sets * l.reps * l.weight).toLocaleString()}</p>
          <p style="font-size:10px; color:var(--muted);">${l.date}</p>
        </div>
      </div>
    `).join('');
    workoutHtml = `
      <div style="margin-bottom:14px;">
        <p style="font-size:11px; color:var(--accent); margin-bottom:8px; letter-spacing:0.1em;">WORKOUT LOG</p>
        <div style="background:#111; border:1px solid var(--border); border-radius:10px; overflow:hidden;">${rows}</div>
      </div>
    `;
  }

  // パーソナル分析
  let analysisHtml = '';
  if (analysisData && analysisData.length > 0) {
    analysisHtml = `<div style="margin-bottom:14px;"><p style="font-size:11px; color:var(--accent); margin-bottom:8px; letter-spacing:0.1em;">PERSONAL ANALYSIS</p><div style="display:flex; flex-direction:column; gap:8px;">`;
    analysisData.forEach(function(item) {
      const date = new Date(item.created_at);
      const dateStr = date.getFullYear() + '/' + String(date.getMonth()+1).padStart(2,'0') + '/' + String(date.getDate()).padStart(2,'0');
      const detailId = 'pa-' + Math.random().toString(36).slice(2, 8);
      analysisHtml += `
        <div style="background:#111; border:1px solid var(--border); border-radius:10px; overflow:hidden;">
          <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 14px; cursor:pointer;" onclick="var d=document.getElementById('${detailId}'); d.style.display=d.style.display==='none'?'block':'none';">
            <div>
              <span style="font-size:12px; padding:2px 8px; background:#1a2a1a; border:1px solid var(--accent); border-radius:6px; color:var(--accent); font-weight:700;">${escapeHtml(item.type_name || '未分類')}</span>
              <span style="font-size:11px; color:var(--muted); margin-left:8px;">${dateStr} 🔥${item.streak || 0}日</span>
            </div>
            <span style="font-size:12px; color:var(--muted);">▼</span>
          </div>
          <div id="${detailId}" style="display:none; padding:12px 14px; border-top:1px solid var(--border); font-size:12px; color:var(--white); line-height:1.8; white-space:pre-wrap;">${escapeHtml(item.full_result || '')}</div>
        </div>
      `;
    });
    analysisHtml += '</div></div>';
  }

  return consentHtml + statsHtml + weeklyHtml + goalHtml + bodyHtml + workoutHtml + analysisHtml;
}

// ============================================================
// アクセス許可管理
// ============================================================
const allowedList       = document.getElementById('allowed-list');
const allowedEmailInput = document.getElementById('allowed-email-input');
const addAllowedBtn     = document.getElementById('add-allowed-btn');

const ALLOWED_PER_PAGE = 10;
let allowedAllData = [];
let allowedPage = 1;

function renderAllowedPage() {
  if (!allowedAllData || allowedAllData.length === 0) {
    allowedList.innerHTML = '<p style="color:var(--muted); font-size:13px;">許可ユーザーなし</p>';
    return;
  }

  const totalPages = Math.ceil(allowedAllData.length / ALLOWED_PER_PAGE);
  const start = (allowedPage - 1) * ALLOWED_PER_PAGE;
  const pageData = allowedAllData.slice(start, start + ALLOWED_PER_PAGE);

  let html = pageData.map(u => {
    const { label, cls } = getExpireInfo(u.created_at);
    const date = new Date(u.created_at);
    const dateStr = `${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')}`;
    return `
      <div style="padding:12px 14px; background:#1e1e1e; border:1px solid var(--border); border-radius:10px; margin-bottom:6px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
          <div style="flex:1; min-width:0;">
            <p style="font-size:13px; color:var(--white); margin-bottom:4px; word-break:break-all;">${escapeHtml(u.email)}</p>
            <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
              <p style="font-size:11px; color:var(--muted);">購入日: ${dateStr}</p>
              <span class="expire-badge ${cls}">${label}</span>
              ${u.referral_code ? `<span style="font-size:10px; padding:2px 6px; border-radius:4px; background:rgba(79,195,247,0.15); color:#4fc3f7; border:1px solid rgba(79,195,247,0.3);">📣 ${escapeHtml(u.referral_code)}</span>` : ''}
            </div>
            <div style="margin-top:8px; display:flex; gap:6px; align-items:center;">
              <input type="text" placeholder="メモを追加..." value="${escapeHtml(u.memo || '')}"
                style="flex:1; padding:6px 10px; background:#111; border:1px solid var(--border); border-radius:8px; color:var(--white); font-size:12px; outline:none; font-family:'Noto Sans JP',sans-serif;"
                data-memo-id="${u.id}" onkeydown="if(event.key==='Enter') saveMemo('${u.id}', this.value)">
              <button onclick="saveMemo('${u.id}', document.querySelector('[data-memo-id=\\'${u.id}\\']').value)"
                style="padding:6px 12px; background:#1a2a1a; border:1px solid var(--accent); border-radius:8px; color:var(--accent); font-size:11px; font-weight:700; cursor:pointer; white-space:nowrap;">保存</button>
            </div>
          </div>
          <button data-allowed-id="${u.id}" style="padding:6px 12px; border-radius:6px; border:1px solid var(--red); background:transparent; color:var(--red); cursor:pointer; font-size:11px; flex-shrink:0;">解除</button>
        </div>
      </div>
    `;
  }).join('');

  if (totalPages > 1) {
    html += `
      <div style="display:flex; justify-content:center; align-items:center; gap:12px; margin-top:12px;">
        <button id="allowed-prev" ${allowedPage <= 1 ? 'disabled' : ''} style="padding:6px 14px; border-radius:6px; border:1px solid var(--border); background:transparent; color:${allowedPage <= 1 ? '#333' : 'var(--muted)'}; cursor:${allowedPage <= 1 ? 'not-allowed' : 'pointer'}; font-size:12px;">← 前へ</button>
        <span style="font-size:12px; color:var(--muted);">${allowedPage} / ${totalPages}（全${allowedAllData.length}件）</span>
        <button id="allowed-next" ${allowedPage >= totalPages ? 'disabled' : ''} style="padding:6px 14px; border-radius:6px; border:1px solid var(--border); background:transparent; color:${allowedPage >= totalPages ? '#333' : 'var(--muted)'}; cursor:${allowedPage >= totalPages ? 'not-allowed' : 'pointer'}; font-size:12px;">次へ →</button>
      </div>
    `;
  } else {
    html += `<p style="font-size:11px; color:var(--muted); text-align:center; margin-top:8px;">全${allowedAllData.length}件</p>`;
  }

  allowedList.innerHTML = html;

  allowedList.querySelectorAll('button[data-allowed-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('このユーザーのアクセス許可を解除しますか？')) return;
      btn.disabled = true;
      btn.textContent = '解除中...';
      const { error } = await supabase.from('allowed_users').delete().eq('id', btn.dataset.allowedId);
      if (error) {
        alert('解除に失敗しました');
        btn.disabled = false;
        btn.textContent = '解除';
      } else {
        loadAllowedUsers();
      }
    });
  });

  const prevBtn = document.getElementById('allowed-prev');
  const nextBtn = document.getElementById('allowed-next');
  if (prevBtn) prevBtn.addEventListener('click', () => { allowedPage--; renderAllowedPage(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { allowedPage++; renderAllowedPage(); });
}

async function loadAllowedUsers() {
  const { data, error } = await supabase
    .from('allowed_users')
    .select('id, email, memo, referral_code, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    allowedList.innerHTML = '<p style="color:var(--red); font-size:13px;">取得に失敗しました</p>';
    return;
  }
  allowedAllData = data || [];
  allowedPage = 1;
  renderAllowedPage();
}

// メモ保存
window.saveMemo = async function(id, memo) {
  const { error } = await supabase.from('allowed_users').update({ memo }).eq('id', id);
  if (error) {
    alert('メモの保存に失敗しました');
  } else {
    // 該当ユーザーのメモをローカルでも更新
    const u = allowedAllData.find(u => u.id === id);
    if (u) u.memo = memo;
    // 保存ボタンを一時的に変化させてフィードバック
    const btn = document.querySelector(`[data-memo-id="${id}"]`);
    if (btn) {
      const saveBtn = btn.nextElementSibling;
      if (saveBtn) {
        const orig = saveBtn.textContent;
        saveBtn.textContent = '✓ 保存済';
        setTimeout(() => { saveBtn.textContent = orig; }, 1500);
      }
    }
  }
};

addAllowedBtn.addEventListener('click', async () => {
  const email = allowedEmailInput.value.trim().toLowerCase();
  if (!email || !email.includes('@')) { alert('有効なメールアドレスを入力してください'); return; }
  addAllowedBtn.disabled = true;
  addAllowedBtn.textContent = '追加中...';
  const { error } = await supabase.from('allowed_users').insert({ email });
  if (error) {
    if (error.code === '23505') alert('このメールアドレスは既に追加されています');
    else alert('追加に失敗しました: ' + error.message);
  } else {
    allowedEmailInput.value = '';
    loadAllowedUsers();
  }
  addAllowedBtn.disabled = false;
  addAllowedBtn.textContent = '追加';
});

allowedEmailInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addAllowedBtn.click(); });

// ============================================================
// ユーザー一覧
// ============================================================
const USERS_PER_PAGE = 10;
let usersAllData = [];
let usersFiltered = [];
let usersPage = 1;

function renderUserPage() {
  userList.innerHTML = '';
  if (!usersFiltered || usersFiltered.length === 0) {
    userList.innerHTML = '<p style="color:var(--muted);">該当するユーザーなし</p>';
    return;
  }

  const totalPages = Math.ceil(usersFiltered.length / USERS_PER_PAGE);
  if (usersPage > totalPages) usersPage = totalPages;
  const start = (usersPage - 1) * USERS_PER_PAGE;
  const pageData = usersFiltered.slice(start, start + USERS_PER_PAGE);

  pageData.forEach(({ user, name, info, isBlocked, hasConsent, isAllowed, referralCode, allowedCreatedAt }) => {
    const { label: expireLabel, cls: expireCls } = getExpireInfo(allowedCreatedAt);
    const div = document.createElement('div');
    div.style.cssText = 'background:#1e1e1e; border:1px solid var(--border); border-radius:12px; margin-bottom:8px; overflow:hidden;';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:14px 18px; cursor:pointer; transition: background 0.2s;';
    header.innerHTML = `
      <div style="flex:1; min-width:0;">
        <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px; flex-wrap:wrap;">
          ${name ? `<p style="font-size:14px; color:var(--white); font-weight:700;">${escapeHtml(name)}</p>` : `<p style="font-size:12px; color:#666; font-style:italic;">名前未登録</p>`}
          <p style="font-size:12px; color:var(--muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(user.email)}</p>
          <span style="font-size:10px; padding:2px 6px; border-radius:4px; font-weight:700; ${isAllowed ? 'background:#1a2a1a; color:var(--accent); border:1px solid var(--accent);' : 'background:#2a1a1a; color:var(--red); border:1px solid var(--red);'}">${isAllowed ? '許可' : '未許可'}</span>
          <span style="font-size:10px; padding:2px 6px; border-radius:4px; font-weight:700; ${hasConsent ? 'background:#1a2a1a; color:var(--accent); border:1px solid var(--accent);' : 'background:#2a1a1a; color:var(--red); border:1px solid var(--red);'}">${hasConsent ? '同意済' : '未同意'}</span>
          ${isAllowed ? `<span class="expire-badge ${expireCls}">${expireLabel}</span>` : ''}
          ${referralCode ? `<span style="font-size:10px; padding:2px 6px; border-radius:4px; background:rgba(79,195,247,0.15); color:#4fc3f7; border:1px solid rgba(79,195,247,0.3);">📣 ${escapeHtml(referralCode)}</span>` : ''}
        </div>
        <p style="font-size:12px; color:var(--muted);">今日: ${info.today}回 ／ 累計: ${info.total}回</p>
      </div>
      <div style="display:flex; gap:8px; align-items:center; flex-shrink:0; margin-left:12px;">
        <span class="toggle-icon" style="font-size:12px; color:var(--muted);">▼ 詳細</span>
        <button data-uid="${user.id}" data-blocked="${isBlocked}" style="padding:8px 16px; border-radius:8px; border:1px solid ${isBlocked ? 'var(--accent)' : 'var(--red)'}; background:transparent; color:${isBlocked ? 'var(--accent)' : 'var(--red)'}; cursor:pointer; font-size:13px;">
          ${isBlocked ? '解除' : '停止'}
        </button>
      </div>
    `;

    const detailArea = document.createElement('div');
    detailArea.style.cssText = 'display:none; padding:0 18px 16px; border-top:1px solid var(--border);';
    detailArea.innerHTML = '<p style="color:var(--muted); font-size:12px; padding-top:12px;">読み込み中...</p>';

    let loaded = false;

    header.addEventListener('mouseenter', () => { if (detailArea.style.display === 'none') header.style.background = '#252525'; });
    header.addEventListener('mouseleave', () => { header.style.background = ''; });
    header.addEventListener('click', async (e) => {
      if (e.target.tagName === 'BUTTON') return;
      const icon = header.querySelector('.toggle-icon');
      if (detailArea.style.display === 'none') {
        detailArea.style.display = 'block';
        icon.textContent = '▲ 閉じる';
        header.style.background = '#252525';
        if (!loaded) {
          loaded = true;
          const detail = await loadUserDetail(user.id);
          detailArea.innerHTML = '<div style="padding-top:14px;">' + buildDetailHTML(detail) + '</div>';
        }
      } else {
        detailArea.style.display = 'none';
        icon.textContent = '▼ 詳細';
        header.style.background = '';
      }
    });

    header.querySelector('button').addEventListener('click', (e) => toggleBlock(e, user.id));
    div.appendChild(header);
    div.appendChild(detailArea);
    userList.appendChild(div);
  });

  const paginationDiv = document.createElement('div');
  paginationDiv.style.cssText = 'display:flex; justify-content:center; align-items:center; gap:12px; margin-top:12px;';
  if (totalPages > 1) {
    paginationDiv.innerHTML = `
      <button id="users-prev" ${usersPage <= 1 ? 'disabled' : ''} style="padding:6px 14px; border-radius:6px; border:1px solid var(--border); background:transparent; color:${usersPage <= 1 ? '#333' : 'var(--muted)'}; cursor:${usersPage <= 1 ? 'not-allowed' : 'pointer'}; font-size:12px;">← 前へ</button>
      <span style="font-size:12px; color:var(--muted);">${usersPage} / ${totalPages}（全${usersFiltered.length}件）</span>
      <button id="users-next" ${usersPage >= totalPages ? 'disabled' : ''} style="padding:6px 14px; border-radius:6px; border:1px solid var(--border); background:transparent; color:${usersPage >= totalPages ? '#333' : 'var(--muted)'}; cursor:${usersPage >= totalPages ? 'not-allowed' : 'pointer'}; font-size:12px;">次へ →</button>
    `;
  } else {
    paginationDiv.innerHTML = `<span style="font-size:11px; color:var(--muted);">全${usersFiltered.length}件</span>`;
  }
  userList.appendChild(paginationDiv);

  const prevBtn = document.getElementById('users-prev');
  const nextBtn = document.getElementById('users-next');
  if (prevBtn) prevBtn.addEventListener('click', () => { usersPage--; renderUserPage(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { usersPage++; renderUserPage(); });
}

async function loadUsers() {
  const today = new Date().toISOString().split('T')[0];

  const [
    { data: allUsers },
    { data: profileData },
    { data: usageData },
    { data: blockData },
    { data: consentData },
    { data: allowedData }
  ] = await Promise.all([
    supabase.from('all_users').select('id, email, created_at'),
    supabase.from('user_profiles').select('user_id, name'),
    supabase.from('usage_limits').select('user_id, count, date'),
    supabase.from('blocked_users').select('user_id'),
    supabase.from('user_consents').select('user_id, consented_at'),
    supabase.from('allowed_users').select('email, referral_code, created_at')
  ]);

  const profileMap = {};
  (profileData || []).forEach(p => { profileMap[p.user_id] = p.name; });
  const blockedIds = new Set((blockData || []).map(b => b.user_id));
  const consentedIds = new Set((consentData || []).map(c => c.user_id));
  const allowedMap = {};
  (allowedData || []).forEach(a => { allowedMap[a.email] = { referralCode: a.referral_code || '', createdAt: a.created_at }; });

  const userMap = {};
  (usageData || []).forEach(row => {
    if (!userMap[row.user_id]) userMap[row.user_id] = { total: 0, today: 0 };
    userMap[row.user_id].total += row.count;
    if (row.date === today) userMap[row.user_id].today = row.count;
  });

  if (!allUsers || allUsers.length === 0) {
    userList.innerHTML = '<p style="color:var(--muted);">ユーザーなし</p>';
    return;
  }

  usersAllData = allUsers.map(user => ({
    user,
    name: profileMap[user.id] || null,
    info: userMap[user.id] || { total: 0, today: 0 },
    isBlocked: blockedIds.has(user.id),
    hasConsent: consentedIds.has(user.id),
    isAllowed: user.email in allowedMap,
    referralCode: allowedMap[user.email]?.referralCode || '',
    allowedCreatedAt: allowedMap[user.email]?.createdAt || null,
  }));

  usersFiltered = [...usersAllData];
  usersPage = 1;
  renderUserPage();

  const searchInput = document.getElementById('user-search');
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    usersFiltered = usersAllData.filter(u =>
      u.user.email.toLowerCase().includes(query) ||
      (u.name && u.name.toLowerCase().includes(query))
    );
    usersPage = 1;
    renderUserPage();
  });
}

async function toggleBlock(e, userId) {
  const btn = e.target;
  btn.disabled = true;
  const currentlyBlocked = btn.dataset.blocked === 'true';
  if (currentlyBlocked) {
    await supabase.from('blocked_users').delete().eq('user_id', userId);
    btn.textContent = '停止';
    btn.style.borderColor = 'var(--red)';
    btn.style.color = 'var(--red)';
    btn.dataset.blocked = 'false';
  } else {
    await supabase.from('blocked_users').insert({ user_id: userId });
    btn.textContent = '解除';
    btn.style.borderColor = 'var(--accent)';
    btn.style.color = 'var(--accent)';
    btn.dataset.blocked = 'true';
  }
  btn.disabled = false;
}

// ============================================================
// 紹介コード別実績
// ============================================================
async function loadReferralStats() {
  const referralList = document.getElementById('referral-list');
  if (!referralList) return;
  referralList.innerHTML = '<p style="color:var(--muted); font-size:13px;">読み込み中...</p>';

  try {
    const { data, error } = await supabase
      .from('allowed_users')
      .select('email, referral_code, created_at')
      .not('referral_code', 'is', null)
      .neq('referral_code', '')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      referralList.innerHTML = '<p style="color:var(--muted); font-size:13px;">紹介コード経由の購入者がまだいません</p>';
      return;
    }

    const codeMap = {};
    data.forEach(u => {
      const code = u.referral_code || '不明';
      if (!codeMap[code]) codeMap[code] = [];
      codeMap[code].push(u);
    });

    let html = '';
    Object.entries(codeMap).sort((a, b) => b[1].length - a[1].length).forEach(([code, users]) => {
      const revenue = users.length * 99800;
      html += `
        <div style="background:#1e1e1e; border:1px solid var(--border); border-radius:12px; margin-bottom:10px; overflow:hidden;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; padding:16px 18px; border-bottom:1px solid var(--border);">
            <div>
              <p style="font-size:18px; font-weight:700; color:var(--accent); letter-spacing:0.15em; margin-bottom:4px;">${escapeHtml(code)}</p>
              <p style="font-size:12px; color:var(--muted);">${users.length}件 ／ 売上合計 ¥${revenue.toLocaleString()}</p>
            </div>
            <div style="text-align:right; flex-shrink:0; margin-left:16px;">
              <p style="font-size:11px; color:var(--muted); margin-bottom:4px;">報酬目安</p>
              ${[20,25,30,35].map(pct => `<p style="font-size:12px; color:#ccc;">${pct}%: <strong style="color:var(--accent);">¥${Math.floor(revenue * pct / 100).toLocaleString()}</strong></p>`).join('')}
            </div>
          </div>
          <div style="padding:10px 18px;">
            ${users.map(u => {
              const date = new Date(u.created_at);
              const dateStr = `${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')}`;
              return `<p style="font-size:12px; color:var(--muted); padding:5px 0; border-bottom:1px solid #1a1a1a;">${dateStr} ／ ${escapeHtml(u.email)}</p>`;
            }).join('')}
          </div>
        </div>
      `;
    });
    referralList.innerHTML = html;
  } catch (e) {
    referralList.innerHTML = '<p style="color:var(--red); font-size:13px;">取得に失敗しました</p>';
  }
}

checkAdmin();