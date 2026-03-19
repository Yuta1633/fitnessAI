import { supabase } from '/supabase.js';
console.log('admin.js読み込み完了');

function escapeHtml(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
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

  const { data } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', session.user.id)
    .single();

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
}

async function loadServiceStatus() {
  const { data } = await supabase
    .from('service_settings')
    .select('value')
    .eq('key', 'service_active')
    .single();

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
  const { data } = await supabase
    .from('service_settings')
    .select('value')
    .eq('key', 'service_active')
    .single();

  const newValue = data?.value === 'true' ? 'false' : 'true';
  await supabase
    .from('service_settings')
    .update({ value: newValue })
    .eq('key', 'service_active');

  updateServiceUI(newValue === 'true');
});

async function loadUserDetail(userId) {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  const mondayStr = monday.toISOString().split('T')[0];
  const mondayStart = `${mondayStr}T00:00:00`;

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

  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let streak = 0;
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

  const weeklyTotal = (usageData || [])
    .filter(r => r.date >= mondayStr)
    .reduce((sum, r) => sum + r.count, 0);

  const { data: chatData } = await supabase
    .from('chat_history')
    .select('method, goal, sub, messages, created_at')
    .eq('user_id', userId)
    .gte('created_at', mondayStart)
    .order('created_at', { ascending: false });

  const methodCount = { nutrition: 0, training: 0, recovery: 0 };
  (chatData || []).forEach(h => {
    if (methodCount[h.method] !== undefined) methodCount[h.method]++;
  });

  const { data: bodyData } = await supabase
    .from('body_records')
    .select('weight, body_fat, recorded_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: startData } = await supabase
    .from('body_records')
    .select('weight, body_fat, recorded_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1);

  const { data: goalData } = await supabase
    .from('user_goals')
    .select('goal_weight, goal_body_fat')
    .eq('user_id', userId)
    .maybeSingle();

  const { data: consentData } = await supabase
    .from('user_consents')
    .select('consented_at, terms_version, privacy_version')
    .eq('user_id', userId)
    .order('consented_at', { ascending: false })
    .limit(1);

  const startRecord = (startData && startData.length > 0) ? startData[0] : null;
  const totalDays = activeDates.size;
  const firstUsage = (() => {
    const allDates = [...activeDates].sort();
    return allDates.length > 0 ? allDates[0] : null;
  })();

  const consent = (consentData && consentData.length > 0) ? consentData[0] : null;

  const { data: analysisData } = await supabase
    .from('personal_analysis')
    .select('type_name, full_result, nutrition_count, training_count, recovery_count, streak, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  return { streak, weeklyTotal, totalDays, firstUsage, methodCount, bodyData: bodyData || [], startRecord, goalData: goalData || null, consent, analysisData: analysisData || [] };
}

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

function buildDetailHTML({ streak, weeklyTotal, totalDays, firstUsage, methodCount, bodyData, startRecord, goalData, consent, analysisData }) {
  const methodLabel = { nutrition: '🥗 栄養', training: '🏋️ トレーニング', recovery: '😴 回復' };

  let consentHtml = '';
  if (consent) {
    const date = new Date(consent.consented_at);
    const dateStr = `${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
    consentHtml = `
      <div style="margin-bottom:14px;">
        <p style="font-size:11px; color:var(--accent); margin-bottom:8px; letter-spacing:0.1em;">CONSENT STATUS</p>
        <div style="background:#1a2a1a; border:1px solid var(--accent); border-radius:10px; padding:12px 14px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
            <span style="font-size:16px;">✅</span>
            <p style="font-size:13px; color:var(--accent); font-weight:700;">同意済み</p>
          </div>
          <p style="font-size:12px; color:var(--muted);">同意日時：${dateStr}</p>
          <p style="font-size:11px; color:var(--muted); margin-top:2px;">利用規約 v${consent.terms_version}　／　プライバシーポリシー v${consent.privacy_version}</p>
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

  let bodyHtml = '';
  if (bodyData && bodyData.length > 0) {
    const pageSize = 5;
    const recordId = 'body-' + Math.random().toString(36).slice(2, 8);
    const initialRows = bodyData.slice(0, pageSize);
    const hasMore = bodyData.length > pageSize;
    const dataEncoded = btoa(unescape(encodeURIComponent(JSON.stringify(bodyData))));
    bodyHtml = `
      <div style="margin-bottom:14px;">
        <p style="font-size:11px; color:var(--accent); margin-bottom:8px; letter-spacing:0.1em;">BODY RECORD</p>
        <div id="${recordId}-list" style="background:#111; border:1px solid var(--border); border-radius:10px; overflow:hidden;">
          ${initialRows.map(r => `
            <div style="display:flex; justify-content:space-between; padding:10px 14px; border-bottom:1px solid var(--border);">
              <p style="font-size:12px; color:var(--muted);">${r.recorded_at ? r.recorded_at : '-'}</p>
              <p style="font-size:12px; color:var(--white);">${r.weight != null ? r.weight + 'kg' : '-'} ／ ${r.body_fat != null ? r.body_fat + '%' : '-'}</p>
            </div>
          `).join('')}
        </div>
        <div id="${recordId}-btns" style="display:flex; gap:8px; margin-top:8px;">
          ${hasMore ? `<button data-record-id="${recordId}" data-encoded="${dataEncoded}" data-shown="5" data-action="more" style="flex:1; padding:7px; background:transparent; color:var(--muted); border:1px solid var(--border); border-radius:8px; font-size:12px; cursor:pointer;">過去${Math.min(pageSize, bodyData.length - pageSize)}件を表示</button>` : ''}
        </div>
      </div>
    `;
  }

  let goalHtml = '';
  if (goalData && (goalData.goal_weight != null || goalData.goal_body_fat != null)) {
    const parts = [];
    if (goalData.goal_weight != null) parts.push(`目標体重: <strong>${goalData.goal_weight}kg</strong>`);
    if (goalData.goal_body_fat != null) parts.push(`目標体脂肪率: <strong>${goalData.goal_body_fat}%</strong>`);

    let gaugeHtml = '';
    if (goalData.goal_weight != null) {
      const currentWeight = bodyData.find(r => r.weight != null)?.weight ?? null;
      const startWeight = [...bodyData].reverse().find(r => r.weight != null)?.weight ?? null;
      if (currentWeight != null) {
        if (startWeight != null && startWeight !== currentWeight) {
          gaugeHtml += renderAdminGauge('体重', 'kg', startWeight, currentWeight, goalData.goal_weight, 'var(--accent)');
        } else {
          const remaining = Math.abs(currentWeight - goalData.goal_weight).toFixed(1);
          const reached = goalData.goal_weight > currentWeight ? currentWeight >= goalData.goal_weight : currentWeight <= goalData.goal_weight;
          gaugeHtml += `<p style="font-size:12px; color:var(--muted); margin-bottom:10px;">体重: 現在 <strong style="color:var(--white);">${currentWeight}kg</strong> → 目標 <strong style="color:var(--accent);">${goalData.goal_weight}kg</strong>　${reached ? '目標達成！🎉' : `あと ${remaining}kg`}</p>`;
        }
      } else {
        gaugeHtml += `<p style="font-size:12px; color:var(--muted); margin-bottom:10px;">体重: 目標 <strong style="color:var(--accent);">${goalData.goal_weight}kg</strong>　（記録なし）</p>`;
      }
    }
    if (goalData.goal_body_fat != null) {
      const currentBodyFat = bodyData.find(r => r.body_fat != null)?.body_fat ?? null;
      const startBodyFat = [...bodyData].reverse().find(r => r.body_fat != null)?.body_fat ?? null;
      if (currentBodyFat != null) {
        if (startBodyFat != null && startBodyFat !== currentBodyFat) {
          gaugeHtml += renderAdminGauge('体脂肪率', '%', startBodyFat, currentBodyFat, goalData.goal_body_fat, '#4fc3f7');
        } else {
          const remaining = Math.abs(currentBodyFat - goalData.goal_body_fat).toFixed(1);
          const reached = goalData.goal_body_fat > currentBodyFat ? currentBodyFat >= goalData.goal_body_fat : currentBodyFat <= goalData.goal_body_fat;
          gaugeHtml += `<p style="font-size:12px; color:var(--muted);">体脂肪率: 現在 <strong style="color:var(--white);">${currentBodyFat}%</strong> → 目標 <strong style="color:#4fc3f7;">${goalData.goal_body_fat}%</strong>　${reached ? '目標達成！🎉' : `あと ${remaining}%`}</p>`;
        }
      } else {
        gaugeHtml += `<p style="font-size:12px; color:var(--muted);">体脂肪率: 目標 <strong style="color:#4fc3f7;">${goalData.goal_body_fat}%</strong>　（記録なし）</p>`;
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

  let analysisHtml = '';
  if (analysisData && analysisData.length > 0) {
    analysisHtml = `<div style="margin-bottom:14px;"><p style="font-size:11px; color:var(--accent); margin-bottom:8px; letter-spacing:0.1em;">PERSONAL ANALYSIS</p><div style="display:flex; flex-direction:column; gap:8px;">`;
    analysisData.forEach(function(item) {
      var date = new Date(item.created_at);
      var dateStr = date.getFullYear() + '/' + String(date.getMonth()+1).padStart(2,'0') + '/' + String(date.getDate()).padStart(2,'0') + ' ' + String(date.getHours()).padStart(2,'0') + ':' + String(date.getMinutes()).padStart(2,'0');
      var total = (item.nutrition_count || 0) + (item.training_count || 0) + (item.recovery_count || 0);
      var nPct = total > 0 ? Math.round((item.nutrition_count || 0) / total * 100) : 0;
      var tPct = total > 0 ? Math.round((item.training_count || 0) / total * 100) : 0;
      var rPct = total > 0 ? Math.round((item.recovery_count || 0) / total * 100) : 0;
      var detailId = 'pa-detail-' + Math.random().toString(36).slice(2, 8);
      analysisHtml += `<div style="background:#111; border:1px solid var(--border); border-radius:10px; overflow:hidden;"><div style="display:flex; justify-content:space-between; align-items:center; padding:12px 14px; cursor:pointer;" onclick="var d=document.getElementById('${detailId}'); d.style.display=d.style.display==='none'?'block':'none';"><div><div style="display:flex; align-items:center; gap:8px; margin-bottom:3px;"><span style="font-size:13px; padding:2px 8px; background:#1a2a1a; border:1px solid var(--accent); border-radius:6px; color:var(--accent); font-weight:700;">${item.type_name || '未分類'}</span><span style="font-size:11px; color:var(--muted);">🔥${item.streak || 0}日連続</span></div><div style="font-size:11px; color:var(--muted);">${dateStr}　🥗${nPct}% 🏋️${tPct}% 😴${rPct}%</div></div><span style="font-size:12px; color:var(--muted);">▼</span></div><div id="${detailId}" style="display:none; padding:0 14px 14px; border-top:1px solid var(--border);"><div style="padding-top:12px;"><div style="display:flex; gap:6px; margin-bottom:10px;"><div style="flex:1; background:#1a1a1a; border:1px solid var(--border); border-radius:6px; padding:6px; text-align:center;"><span style="font-size:11px; color:var(--muted);">🥗</span><br><strong style="font-size:12px; color:#4ade80;">${item.nutrition_count || 0}</strong></div><div style="flex:1; background:#1a1a1a; border:1px solid var(--border); border-radius:6px; padding:6px; text-align:center;"><span style="font-size:11px; color:var(--muted);">🏋️</span><br><strong style="font-size:12px; color:#f59e0b;">${item.training_count || 0}</strong></div><div style="flex:1; background:#1a1a1a; border:1px solid var(--border); border-radius:6px; padding:6px; text-align:center;"><span style="font-size:11px; color:var(--muted);">😴</span><br><strong style="font-size:12px; color:#818cf8;">${item.recovery_count || 0}</strong></div></div><div style="background:#1a1a1a; border:1px solid var(--border); border-radius:8px; padding:12px; font-size:12px; color:var(--white); line-height:1.7; white-space:pre-wrap;">${escapeHtml(item.full_result || '結果なし')}</div></div></div></div>`;
    });
    analysisHtml += '</div></div>';
  }

  return consentHtml + statsHtml + weeklyHtml + goalHtml + bodyHtml + analysisHtml;
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
    const date = new Date(u.created_at);
    const dateStr = `${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')}`;
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:#1e1e1e; border:1px solid var(--border); border-radius:8px;">
        <div>
          <p style="font-size:13px; color:var(--white);">${u.email}</p>
          <p style="font-size:11px; color:var(--muted);">追加日: ${dateStr}${u.referral_code ? '　紹介コード: <strong style="color:var(--accent);">' + escapeHtml(u.referral_code) + '</strong>' : ''}${u.memo ? '　メモ: ' + u.memo : ''}</p>
        </div>
        <button data-allowed-id="${u.id}" style="padding:6px 14px; border-radius:6px; border:1px solid var(--red); background:transparent; color:var(--red); cursor:pointer; font-size:12px;">解除</button>
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

addAllowedBtn.addEventListener('click', async () => {
  const email = allowedEmailInput.value.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    alert('有効なメールアドレスを入力してください');
    return;
  }

  addAllowedBtn.disabled = true;
  addAllowedBtn.textContent = '追加中...';

  const { error } = await supabase.from('allowed_users').insert({ email });

  if (error) {
    if (error.code === '23505') {
      alert('このメールアドレスは既に追加されています');
    } else {
      alert('追加に失敗しました: ' + error.message);
    }
  } else {
    allowedEmailInput.value = '';
    loadAllowedUsers();
  }

  addAllowedBtn.disabled = false;
  addAllowedBtn.textContent = '追加';
});

allowedEmailInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addAllowedBtn.click();
});

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

  pageData.forEach(({ user, name, info, isBlocked, hasConsent, isAllowed, referralCode }) => {
    const div = document.createElement('div');
    div.style.cssText = 'background:#1e1e1e; border:1px solid var(--border); border-radius:12px; margin-bottom:8px; overflow:hidden;';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:14px 18px; cursor:pointer; transition: background 0.2s;';
    header.innerHTML = `
      <div style="flex:1; min-width:0;">
        <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px; flex-wrap:wrap;">
          ${name ? `<p style="font-size:14px; color:var(--white); font-weight:700;">${name}</p>` : `<p style="font-size:12px; color:#666; font-style:italic;">名前未登録</p>`}
          <p style="font-size:12px; color:var(--muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${user.email}</p>
          <span style="font-size:10px; padding:2px 6px; border-radius:4px; font-weight:700; ${isAllowed ? 'background:#1a2a1a; color:var(--accent); border:1px solid var(--accent);' : 'background:#2a1a1a; color:var(--red); border:1px solid var(--red);'}">${isAllowed ? '許可' : '未許可'}</span>
          <span style="font-size:10px; padding:2px 6px; border-radius:4px; font-weight:700; ${hasConsent ? 'background:#1a2a1a; color:var(--accent); border:1px solid var(--accent);' : 'background:#2a1a1a; color:var(--red); border:1px solid var(--red);'}">${hasConsent ? '同意済' : '未同意'}</span>
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
  paginationDiv.id = 'users-pagination';
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

  const { data: allUsers } = await supabase.from('all_users').select('id, email, created_at');
  const { data: profileData } = await supabase.from('user_profiles').select('user_id, name');
  const profileMap = {};
  (profileData || []).forEach(p => { profileMap[p.user_id] = p.name; });

  const { data: usageData } = await supabase.from('usage_limits').select('user_id, count, date');
  const { data: blockData } = await supabase.from('blocked_users').select('user_id');
  const { data: consentData } = await supabase.from('user_consents').select('user_id, consented_at');
  const { data: allowedData } = await supabase.from('allowed_users').select('email, referral_code');

  const blockedIds = new Set((blockData || []).map(b => b.user_id));
  const consentedIds = new Set((consentData || []).map(c => c.user_id));
  const allowedMap = {};
  (allowedData || []).forEach(a => { allowedMap[a.email] = a.referral_code || ''; });

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
    referralCode: allowedMap[user.email] || '',
  }));

  usersFiltered = [...usersAllData];
  usersPage = 1;
  renderUserPage();

  const searchInput = document.getElementById('user-search');
  searchInput.placeholder = '名前・メールアドレスで検索...';
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

const RECORD_PAGE_SIZE = 5;

function renderAdminRecordList(recordId, records, shown) {
  const listEl = document.getElementById(recordId + '-list');
  const btnsEl = document.getElementById(recordId + '-btns');
  if (!listEl || !btnsEl) return;

  const displayRecords = records.slice(0, shown);
  const hasMore = records.length > shown;
  const hasLess = shown > RECORD_PAGE_SIZE;
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(records))));

  listEl.innerHTML = displayRecords.map(r => `
    <div style="display:flex; justify-content:space-between; padding:10px 14px; border-bottom:1px solid var(--border);">
      <p style="font-size:12px; color:var(--muted);">${r.recorded_at ? r.recorded_at : '-'}</p>
      <p style="font-size:12px; color:var(--white);">${r.weight != null ? r.weight + 'kg' : '-'} ／ ${r.body_fat != null ? r.body_fat + '%' : '-'}</p>
    </div>
  `).join('');

  btnsEl.innerHTML = '';
  if (hasMore) {
    const btn = document.createElement('button');
    btn.textContent = `過去${Math.min(RECORD_PAGE_SIZE, records.length - shown)}件を表示`;
    btn.style.cssText = 'flex:1; padding:7px; background:transparent; color:var(--muted); border:1px solid var(--border); border-radius:8px; font-size:12px; cursor:pointer;';
    btn.dataset.recordId = recordId;
    btn.dataset.encoded = encoded;
    btn.dataset.shown = shown + RECORD_PAGE_SIZE;
    btn.dataset.action = 'more';
    btnsEl.appendChild(btn);
  }
  if (hasLess) {
    const btn = document.createElement('button');
    btn.textContent = '非表示にする';
    btn.style.cssText = 'flex:1; padding:7px; background:transparent; color:var(--muted); border:1px solid var(--border); border-radius:8px; font-size:12px; cursor:pointer;';
    btn.dataset.recordId = recordId;
    btn.dataset.encoded = encoded;
    btn.dataset.shown = RECORD_PAGE_SIZE;
    btn.dataset.action = 'less';
    btnsEl.appendChild(btn);
  }
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  if (action !== 'more' && action !== 'less') return;
  const recordId = btn.dataset.recordId;
  const shown = parseInt(btn.dataset.shown);
  const records = JSON.parse(decodeURIComponent(escape(atob(btn.dataset.encoded))));
  renderAdminRecordList(recordId, records, shown);
});

// ============================================================
// タイプ診断結果一覧
// ============================================================
var ANALYSIS_PER_PAGE = 10;
var analysisAllData = [];
var analysisPage = 1;

async function loadAnalysisResults() {
  var analysisList = document.getElementById('analysis-list');
  if (!analysisList) return;

  var { data, error } = await supabase
    .from('personal_analysis')
    .select('id, user_id, type_name, full_result, nutrition_count, training_count, recovery_count, streak, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    analysisList.innerHTML = '<p style="color:var(--red); font-size:13px;">取得に失敗しました</p>';
    return;
  }

  var { data: allUsers } = await supabase.from('all_users').select('id, email');
  var emailMap = {};
  (allUsers || []).forEach(function(u) { emailMap[u.id] = u.email; });

  analysisAllData = data || [];
  analysisPage = 1;
  renderAnalysisPage(analysisList, emailMap);
}

function renderAnalysisPage(listEl, emailMap) {
  if (!analysisAllData || analysisAllData.length === 0) {
    listEl.innerHTML = '<p style="color:var(--muted); font-size:13px;">診断結果なし</p>';
    return;
  }

  var totalPages = Math.ceil(analysisAllData.length / ANALYSIS_PER_PAGE);
  var start = (analysisPage - 1) * ANALYSIS_PER_PAGE;
  var pageData = analysisAllData.slice(start, start + ANALYSIS_PER_PAGE);

  var html = '';
  pageData.forEach(function(item) {
    var date = new Date(item.created_at);
    var dateStr = date.getFullYear() + '/' + String(date.getMonth()+1).padStart(2,'0') + '/' + String(date.getDate()).padStart(2,'0') + ' ' + String(date.getHours()).padStart(2,'0') + ':' + String(date.getMinutes()).padStart(2,'0');
    var email = emailMap[item.user_id] || '不明';
    var total = (item.nutrition_count || 0) + (item.training_count || 0) + (item.recovery_count || 0);
    var nPct = total > 0 ? Math.round((item.nutrition_count || 0) / total * 100) : 0;
    var tPct = total > 0 ? Math.round((item.training_count || 0) / total * 100) : 0;
    var rPct = total > 0 ? Math.round((item.recovery_count || 0) / total * 100) : 0;
    var itemId = 'analysis-' + item.id.slice(0, 8);

    html += '<div style="background:#1e1e1e; border:1px solid var(--border); border-radius:12px; overflow:hidden;">';
    html += '<div id="' + itemId + '-header" style="display:flex; justify-content:space-between; align-items:center; padding:14px 18px; cursor:pointer;" data-target="' + itemId + '-detail">';
    html += '<div style="flex:1;"><div style="display:flex; align-items:center; gap:8px; margin-bottom:4px; flex-wrap:wrap;"><span style="font-size:13px; color:var(--white);">' + escapeHtml(email) + '</span><span style="font-size:12px; padding:2px 8px; background:#1a2a1a; border:1px solid var(--accent); border-radius:6px; color:var(--accent); font-weight:700;">' + escapeHtml(item.type_name || '未分類') + '</span></div><div style="display:flex; gap:12px; font-size:11px; color:var(--muted);"><span>' + dateStr + '</span><span>🔥 ' + (item.streak || 0) + '日連続</span><span>🥗' + nPct + '% 🏋️' + tPct + '% 😴' + rPct + '%</span></div></div>';
    html += '<span style="font-size:12px; color:var(--muted);">▼</span></div>';
    html += '<div id="' + itemId + '-detail" style="display:none; padding:0 18px 16px; border-top:1px solid var(--border);"><div style="padding-top:14px;"><div style="display:flex; gap:8px; margin-bottom:12px;"><div style="flex:1; background:#111; border:1px solid var(--border); border-radius:8px; padding:8px; text-align:center;"><span style="font-size:12px; color:var(--muted);">🥗 栄養</span><br><strong style="color:#4ade80;">' + (item.nutrition_count || 0) + '回</strong></div><div style="flex:1; background:#111; border:1px solid var(--border); border-radius:8px; padding:8px; text-align:center;"><span style="font-size:12px; color:var(--muted);">🏋️ トレ</span><br><strong style="color:#f59e0b;">' + (item.training_count || 0) + '回</strong></div><div style="flex:1; background:#111; border:1px solid var(--border); border-radius:8px; padding:8px; text-align:center;"><span style="font-size:12px; color:var(--muted);">😴 回復</span><br><strong style="color:#818cf8;">' + (item.recovery_count || 0) + '回</strong></div></div>';
    html += '<div style="background:#111; border:1px solid var(--border); border-radius:10px; padding:14px; font-size:13px; color:var(--white); line-height:1.8; white-space:pre-wrap;">' + escapeHtml(item.full_result || '結果なし') + '</div></div></div></div>';
  });

  if (totalPages > 1) {
    html += '<div style="display:flex; justify-content:center; align-items:center; gap:12px; margin-top:12px;"><button id="analysis-prev" ' + (analysisPage <= 1 ? 'disabled' : '') + ' style="padding:6px 14px; border-radius:6px; border:1px solid var(--border); background:transparent; color:' + (analysisPage <= 1 ? '#333' : 'var(--muted)') + '; cursor:' + (analysisPage <= 1 ? 'not-allowed' : 'pointer') + '; font-size:12px;">← 前へ</button><span style="font-size:12px; color:var(--muted);">' + analysisPage + ' / ' + totalPages + '（全' + analysisAllData.length + '件）</span><button id="analysis-next" ' + (analysisPage >= totalPages ? 'disabled' : '') + ' style="padding:6px 14px; border-radius:6px; border:1px solid var(--border); background:transparent; color:' + (analysisPage >= totalPages ? '#333' : 'var(--muted)') + '; cursor:' + (analysisPage >= totalPages ? 'not-allowed' : 'pointer') + '; font-size:12px;">次へ →</button></div>';
  } else {
    html += '<p style="font-size:11px; color:var(--muted); text-align:center; margin-top:8px;">全' + analysisAllData.length + '件</p>';
  }

  listEl.innerHTML = html;

  pageData.forEach(function(item) {
    var itemId = 'analysis-' + item.id.slice(0, 8);
    var header = document.getElementById(itemId + '-header');
    if (header) {
      header.addEventListener('click', function() {
        var detail = document.getElementById(itemId + '-detail');
        if (detail.style.display === 'none') { detail.style.display = 'block'; } else { detail.style.display = 'none'; }
      });
    }
  });

  var prevBtn = document.getElementById('analysis-prev');
  var nextBtn = document.getElementById('analysis-next');
  if (prevBtn) prevBtn.addEventListener('click', function() { analysisPage--; renderAnalysisPage(listEl, emailMap); });
  if (nextBtn) nextBtn.addEventListener('click', function() { analysisPage++; renderAnalysisPage(listEl, emailMap); });
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

    // コード別に集計
    const codeMap = {};
    data.forEach(u => {
      const code = u.referral_code || '不明';
      if (!codeMap[code]) codeMap[code] = [];
      codeMap[code].push(u);
    });

    let html = '';
    Object.entries(codeMap).sort((a, b) => b[1].length - a[1].length).forEach(([code, users]) => {
      const revenue = users.length * 99800;
      const commission20 = Math.floor(revenue * 0.20);
      const commission25 = Math.floor(revenue * 0.25);
      const commission30 = Math.floor(revenue * 0.30);
      const commission35 = Math.floor(revenue * 0.35);
      html += `
        <div style="background:#1e1e1e; border:1px solid var(--border); border-radius:12px; margin-bottom:10px; overflow:hidden;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; padding:16px 18px; border-bottom:1px solid var(--border);">
            <div>
              <p style="font-size:18px; font-weight:700; color:var(--accent); letter-spacing:0.15em; margin-bottom:4px;">${escapeHtml(code)}</p>
              <p style="font-size:12px; color:var(--muted);">${users.length}件の購入 ／ 売上合計 ¥${revenue.toLocaleString()}</p>
            </div>
            <div style="text-align:right; flex-shrink:0; margin-left:16px;">
              <p style="font-size:11px; color:var(--muted); margin-bottom:4px;">報酬目安</p>
              <p style="font-size:12px; color:#ccc;">20%: <strong style="color:var(--accent);">¥${commission20.toLocaleString()}</strong></p>
              <p style="font-size:12px; color:#ccc;">25%: <strong style="color:var(--accent);">¥${commission25.toLocaleString()}</strong></p>
              <p style="font-size:12px; color:#ccc;">30%: <strong style="color:var(--accent);">¥${commission30.toLocaleString()}</strong></p>
              <p style="font-size:12px; color:#ccc;">35%: <strong style="color:var(--accent);">¥${commission35.toLocaleString()}</strong></p>
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
    console.error('referral stats error:', e);
    referralList.innerHTML = '<p style="color:var(--red); font-size:13px;">取得に失敗しました</p>';
  }
}

checkAdmin();