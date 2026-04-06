import React, { useState, useRef, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

// ============================================================
// 定数・データ
// ============================================================
const GOALS = [
  { id: 'chest', name: '大胸筋筋肥大', emoji: '💪', desc: 'ベンチプレス・フライ系を中心に大胸筋を集中的に鍛えるプログラム' },
  { id: 'back',  name: '背中筋肥大',   emoji: '🏋️', desc: '懸垂・ロウイングで厚みのある背中を作るプログラム' },
  { id: 'fat',   name: '脂肪減少',     emoji: '🔥', desc: 'カロリー管理と有酸素運動で体脂肪を効率よく削るプログラム' },
];

const LEVELS = [
  { id: 'beginner',     name: '初心者',   desc: 'トレーニング歴 1年未満' },
  { id: 'intermediate', name: '中級者',   desc: 'トレーニング歴 1〜3年' },
  { id: 'advanced',     name: '上級者',   desc: 'トレーニング歴 3年以上' },
];

const MEAL_QUESTIONS = [
  { id: 'purpose',   q: '今日の目的は？',       opts: ['筋肉をつけたい', '脂肪を落としたい', '維持したい'] },
  { id: 'prep_time', q: '食事の準備時間は？',   opts: ['10分以内', '30分程度', 'しっかり作れる'] },
  { id: 'training',  q: '今日のトレーニングは？', opts: ['あり', 'なし', '軽め'] },
];

const TRAINING_QUESTIONS = [
  { id: 'muscle',    q: '今日鍛えたい部位は？',     opts: ['胸', '背中', '脚', '肩・腕', '全身'] },
  { id: 'equipment', q: '使える場所・器具は？',       opts: ['ジム（マシン・フリーウェイト）', '自宅（ダンベル等）', '自重のみ'] },
  { id: 'time',      q: '使える時間は？',             opts: ['30分以内', '45〜60分', '60分以上'] },
];

const RECOVERY_QUESTIONS = [
  { id: 'intensity', q: '昨日のトレーニング強度は？', opts: ['ハード', '普通', '軽め', '休み'] },
  { id: 'condition', q: '今日の体のコンディションは？', opts: ['筋肉痛あり', '疲労感あり', '良好'] },
];

const SAMPLE_WEIGHT_DATA = [
  { date: '4/1',  weight: 72.5, fat: 18.2 },
  { date: '4/3',  weight: 72.1, fat: 18.0 },
  { date: '4/5',  weight: 71.8, fat: 17.8 },
  { date: '4/8',  weight: 71.5, fat: 17.5 },
  { date: '4/10', weight: 71.2, fat: 17.3 },
  { date: '4/12', weight: 70.9, fat: 17.1 },
  { date: '4/14', weight: 70.6, fat: 16.9 },
];

// ============================================================
// カラー & スタイル定数
// ============================================================
const C = {
  primary:    '#6366f1',
  primaryDim: '#4f46e5',
  bg:         'linear-gradient(135deg, #f8f7ff 0%, #eef2ff 50%, #f0f9ff 100%)',
  card:       '#ffffff',
  cardDark:   '#1e293b',
  text:       '#1e293b',
  muted:      '#64748b',
  border:     '#e2e8f0',
  success:    '#22c55e',
  danger:     '#ef4444',
  amber:      '#f59e0b',
};

const S = {
  app: {
    minHeight: '100vh',
    background: C.bg,
    fontFamily: '"Hiragino Sans", "Yu Gothic", "ヒラギノ角ゴシック", sans-serif',
    maxWidth: 430,
    margin: '0 auto',
    position: 'relative',
  },
  screen: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    paddingBottom: 80,
  },
  card: {
    background: C.card,
    borderRadius: 16,
    padding: '18px 20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    marginBottom: 12,
  },
  cardDark: {
    background: C.cardDark,
    borderRadius: 16,
    padding: '18px 20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    marginBottom: 12,
  },
  btn: (disabled) => ({
    width: '100%',
    padding: '15px 20px',
    background: C.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    opacity: disabled ? 0.4 : 1,
    boxShadow: disabled ? 'none' : '0 4px 16px rgba(99,102,241,0.3)',
    transition: 'all 0.15s',
  }),
  input: {
    width: '100%',
    padding: '13px 16px',
    border: `1.5px solid ${C.border}`,
    borderRadius: 12,
    fontSize: 15,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#fafafa',
    color: C.text,
  },
  label: {
    fontSize: 12,
    color: C.muted,
    fontWeight: 700,
    marginBottom: 6,
    display: 'block',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  nav: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 430,
    background: 'rgba(255,255,255,0.96)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderTop: `1px solid ${C.border}`,
    display: 'flex',
    justifyContent: 'space-around',
    padding: '8px 0 14px',
    zIndex: 200,
  },
};

// ============================================================
// 共通 UI パーツ
// ============================================================
function SectionHeader({ title, sub }) {
  return (
    <div style={{ padding: '24px 20px 12px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0, letterSpacing: '-0.02em' }}>
        {title}
      </h1>
      {sub && <p style={{ fontSize: 13, color: C.muted, margin: '6px 0 0', lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );
}

function NavButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        padding: '4px 10px',
        color: active ? C.primary : '#94a3b8',
        fontFamily: 'inherit',
        transition: 'color 0.15s',
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{label}</span>
    </button>
  );
}

function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: C.muted, fontSize: 14, fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '4px 0', marginBottom: 8,
      }}
    >
      ← 戻る
    </button>
  );
}

// ============================================================
// 初期設定 ①：目標選択
// ============================================================
function GoalSelection({ onSelect }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 52, marginBottom: 18 }}>🎯</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: '0 0 10px', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
          あなたの目標を<br />選んでください
        </h1>
        <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>目標に最適な提案を行います</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {GOALS.map(g => (
          <button
            key={g.id}
            onClick={() => onSelect(g)}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '18px 20px',
              background: C.card,
              border: `1.5px solid ${C.border}`,
              borderRadius: 16,
              cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 34, flexShrink: 0 }}>{g.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>{g.name}</div>
              <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>{g.desc}</div>
            </div>
            <span style={{ color: '#cbd5e1', fontSize: 20, flexShrink: 0 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 初期設定 ②：レベル選択
// ============================================================
function LevelSelection({ goal, onSelect, onBack }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 20px' }}>
      <BackButton onClick={onBack} />
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 48, marginBottom: 14 }}>{goal.emoji}</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: '0 0 8px' }}>
          トレーニングレベルは？
        </h1>
        <div style={{
          display: 'inline-block', fontSize: 12, fontWeight: 700, padding: '4px 12px',
          background: `rgba(99,102,241,0.1)`, color: C.primary, borderRadius: 20,
        }}>
          目標：{goal.name}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {LEVELS.map(l => (
          <button
            key={l.id}
            onClick={() => onSelect(l)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 20px',
              background: C.card,
              border: `1.5px solid ${C.border}`,
              borderRadius: 16,
              cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{l.name}</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{l.desc}</div>
            </div>
            <span style={{ color: '#cbd5e1', fontSize: 20 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 初期設定 ③：基本情報入力
// ============================================================
function BasicInfoInput({ onSubmit, onBack }) {
  const [f, setF] = useState({ height: '', age: '', weight: '', fat: '' });
  const ok = f.height && f.weight;
  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '48px 20px 100px' }}>
      <BackButton onClick={onBack} />
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: '0 0 8px' }}>基本情報を入力</h1>
        <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>より精度の高い提案のために</p>
      </div>
      <div style={{ ...S.card }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>身長 (cm) *</label>
            <input type="number" placeholder="170" value={f.height} onChange={set('height')} style={S.input} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>年齢</label>
            <input type="number" placeholder="25" value={f.age} onChange={set('age')} style={S.input} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>体重 (kg) *</label>
            <input type="number" placeholder="70" value={f.weight} onChange={set('weight')} style={S.input} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>体脂肪率 (%)</label>
            <input type="number" placeholder="18" value={f.fat} onChange={set('fat')} style={S.input} />
          </div>
        </div>
      </div>
      <button
        onClick={() => onSubmit({
          height: parseFloat(f.height) || 170,
          age:    parseInt(f.age)    || 25,
          weight: parseFloat(f.weight) || 70,
          fat:    parseFloat(f.fat)    || 18,
        })}
        disabled={!ok}
        style={S.btn(!ok)}
      >
        始める
      </button>
    </div>
  );
}

// ============================================================
// アコーディオン質問ブロック
// ============================================================
function AccordionBlock({ q, opts, answered, isOpen, onAnswer }) {
  if (!isOpen && !answered) return null;
  return (
    <div style={{
      background: C.card,
      borderRadius: 14,
      marginBottom: 10,
      overflow: 'hidden',
      border: answered ? `1.5px solid ${C.primary}` : `1px solid ${C.border}`,
      boxShadow: isOpen ? '0 4px 16px rgba(99,102,241,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    }}>
      <div style={{
        padding: '13px 16px',
        borderBottom: isOpen ? `1px solid ${C.border}` : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{q}</span>
        {answered && (
          <span style={{
            fontSize: 12, fontWeight: 700, padding: '3px 10px',
            background: 'rgba(99,102,241,0.1)', color: C.primary, borderRadius: 20,
            whiteSpace: 'nowrap', marginLeft: 8,
          }}>
            {answered}
          </span>
        )}
      </div>
      {isOpen && (
        <div style={{ padding: '10px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {opts.map(opt => (
            <button
              key={opt}
              onClick={() => onAnswer(opt)}
              style={{
                padding: '12px 16px',
                background: '#f8faff',
                border: `1.5px solid ${C.border}`,
                borderRadius: 10,
                fontSize: 14, fontWeight: 500, color: C.text,
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'all 0.15s',
              }}
            >
              {opt}
              <span style={{ color: '#cbd5e1', fontSize: 14 }}>→</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 提案カード
// ============================================================
function buildMealSuggestion(answers, userInfo) {
  const w = userInfo.weight || 70;
  const isBulk = answers.purpose === '筋肉をつけたい';
  const isCut  = answers.purpose === '脂肪を落としたい';
  const cal = Math.round(w * (isBulk ? 33 : isCut ? 26 : 30));
  const p   = Math.round(w * (isBulk ? 2.2 : isCut ? 2.0 : 1.8));
  const fat = Math.round(w * (isBulk ? 0.9 : isCut ? 0.6 : 0.8));
  const c   = Math.round(w * (isBulk ? 4.0 : isCut ? 2.5 : 3.5));
  const prep = answers.prep_time === '10分以内'
    ? '• 鶏むね肉の電子レンジ蒸し\n• ギリシャヨーグルト + バナナ\n• プロテインシェイク'
    : answers.prep_time === '30分程度'
    ? '• 鶏胸肉の照り焼き丼\n• 味噌汁 + 目玉焼き\n• サラダチキン + 雑穀ごはん'
    : '• サーモンとアボカドの丼\n• 鶏もも肉のグリル + 野菜ソテー\n• 自家製プロテインパンケーキ';
  return {
    title: '今日の食事プラン', icon: '🥗',
    body: `【${answers.purpose}】に合わせた食事プランです。\nトレーニング「${answers.training}」の日に最適な栄養バランスを設定しました。\n\n今日のおすすめ：\n${prep}`,
    macros: [
      { label: 'カロリー', value: cal, unit: 'kcal', color: C.amber },
      { label: 'タンパク質', value: p,   unit: 'g',    color: C.primary },
      { label: '脂質',       value: fat, unit: 'g',    color: C.danger },
      { label: '炭水化物',   value: c,   unit: 'g',    color: C.success },
    ],
  };
}

function buildTrainingSuggestion(answers) {
  const exMap = {
    '胸':   ['ベンチプレス 4×8-10 rep', 'インクラインDB 3×10 rep', 'ケーブルクロスオーバー 3×12 rep', 'ディップス 3×限界'],
    '背中': ['デッドリフト 4×5 rep', '懸垂 4×8 rep', 'シーテッドロウ 3×10 rep', 'ラットプルダウン 3×12 rep'],
    '脚':   ['バックスクワット 4×8 rep', 'レッグプレス 3×12 rep', 'レッグカール 3×12 rep', 'カーフレイズ 4×15 rep'],
    '肩・腕': ['ショルダープレス 4×10 rep', 'サイドレイズ 3×15 rep', 'バーベルカール 3×12 rep', 'ライイングエクステ 3×12 rep'],
    '全身': ['スクワット 4×8 rep', 'デッドリフト 3×6 rep', 'ベンチプレス 3×8 rep', '懸垂 3×限界 rep'],
  };
  const muscle = answers.muscle || '全身';
  const equip  = answers.equipment || 'ジム（マシン・フリーウェイト）';
  const time   = answers.time || '45〜60分';
  const note = equip === '自重のみ'
    ? '※ 自重バリエーションで代替可能です'
    : equip === '自宅（ダンベル等）'
    ? '※ ダンベルでアレンジした種目に変換してください'
    : '※ フリーウェイト優先で行ってください';
  return {
    title: 'トレーニングメニュー', icon: '💪',
    body: `【${muscle}】×【${equip}】×【${time}】\n${note}`,
    exercises: exMap[muscle] || exMap['全身'],
  };
}

function buildRecoverySuggestion(answers) {
  const intensity = answers.intensity || '普通';
  const condition = answers.condition || '良好';
  const protocols = intensity === 'ハード'
    ? ['フォームローラーで全身 10分', 'アイスバス or 冷水シャワー', '就寝前プロテイン 20g', '8時間以上の睡眠確保', '翌日は軽い有酸素のみ']
    : intensity === '普通'
    ? ['ストレッチ 15〜20分', 'プロテイン + 炭水化物摂取', '7〜8時間睡眠', '翌日は通常トレーニングOK']
    : ['軽いストレッチ 10分で十分', '通常の食事で回復', '明日のトレーニングに万全な状態で備える'];
  const condNote = condition === '筋肉痛あり'
    ? '筋肉痛は成長のサイン。アクティブリカバリーで促進しましょう。'
    : condition === '疲労感あり'
    ? '疲労が蓄積中。今日は回復最優先で過ごしてください。'
    : 'コンディション良好！次のトレーニングに向けてメンテナンスを。';
  return {
    title: '回復プロトコル', icon: '🌙',
    body: condNote,
    protocols,
  };
}

function SuggestionCard({ method, answers, userInfo, selectedGoal, selectedLevel }) {
  const data =
    method === 'meal'     ? buildMealSuggestion(answers, userInfo) :
    method === 'training' ? buildTrainingSuggestion(answers) :
    buildRecoverySuggestion(answers);

  return (
    <div style={{
      background: C.cardDark, borderRadius: 18,
      padding: '20px', marginTop: 8,
      boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
      animation: 'fadeUp 0.35s ease both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>
          {data.icon}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{data.title}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
            {selectedGoal?.name} · {selectedLevel?.name}
          </div>
        </div>
      </div>

      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, margin: '0 0 16px', whiteSpace: 'pre-line' }}>
        {data.body}
      </p>

      {/* 栄養マクログリッド */}
      {data.macros && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 8 }}>
          {data.macros.map(({ label, value, unit, color }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.07)', borderRadius: 10,
              padding: '10px 6px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>{unit}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* トレーニング種目リスト */}
      {data.exercises && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.exercises.map((ex, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '9px 12px',
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.primary, width: 16, flexShrink: 0 }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{ex}</span>
            </div>
          ))}
        </div>
      )}

      {/* 回復プロトコルリスト */}
      {data.protocols && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.protocols.map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '9px 12px',
            }}>
              <span style={{ fontSize: 14, color: C.success, flexShrink: 0, marginTop: 1 }}>✓</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>{p}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// プランタブ（メイン画面）
// ============================================================
const METHODS = [
  { id: 'meal',     label: '食事',           icon: '🥗', desc: '今日の食事プランを作成',         color: C.success, bg: 'rgba(34,197,94,0.08)' },
  { id: 'training', label: 'トレーニング',   icon: '💪', desc: 'トレーニングメニューを提案',     color: C.primary, bg: 'rgba(99,102,241,0.08)' },
  { id: 'recovery', label: '回復',           icon: '🌙', desc: '回復プロトコルを確認',           color: C.amber,   bg: 'rgba(245,158,11,0.08)' },
];

const QUESTIONS_MAP = { meal: MEAL_QUESTIONS, training: TRAINING_QUESTIONS, recovery: RECOVERY_QUESTIONS };

function PlanTab({ userInfo, selectedGoal, selectedLevel }) {
  const [method, setMethod]         = useState(null);
  const [answers, setAnswers]       = useState({});
  const [step, setStep]             = useState(0);
  const [showResult, setShowResult] = useState(false);

  const reset = () => { setMethod(null); setAnswers({}); setStep(0); setShowResult(false); };

  const handleAnswer = (qId, ans) => {
    const next = { ...answers, [qId]: ans };
    setAnswers(next);
    const qs = QUESTIONS_MAP[method];
    if (step + 1 >= qs.length) setShowResult(true);
    else setStep(step + 1);
  };

  const qs = method ? QUESTIONS_MAP[method] : [];
  const m  = METHODS.find(x => x.id === method);

  return (
    <div style={S.screen}>
      <div style={{
        padding: '24px 20px 16px',
        background: `linear-gradient(135deg, rgba(99,102,241,0.08) 0%, transparent 100%)`,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, background: C.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19,
          }}>
            {selectedGoal?.emoji}
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{selectedGoal?.name}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{selectedLevel?.name}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 24px' }}>
        {/* メソッド選択 */}
        {!method && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: '0.1em', marginBottom: 14, textTransform: 'uppercase' }}>
              Today — 何をしますか？
            </div>
            {METHODS.map(mx => (
              <button
                key={mx.id}
                onClick={() => setMethod(mx.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  width: '100%', padding: '18px 20px',
                  background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 16, cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'inherit', marginBottom: 10,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{
                  width: 46, height: 46, borderRadius: 12, background: mx.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0,
                }}>
                  {mx.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{mx.label}</div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{mx.desc}</div>
                </div>
                <span style={{ color: '#cbd5e1', fontSize: 20 }}>›</span>
              </button>
            ))}
          </>
        )}

        {/* アコーディオン質問 */}
        {method && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <button
                onClick={reset}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 14, fontFamily: 'inherit', padding: 0 }}
              >
                ←
              </button>
              <div style={{
                width: 28, height: 28, borderRadius: 8, background: m?.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              }}>
                {m?.icon}
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{m?.label}</span>
            </div>

            {qs.map((q, i) => (
              <AccordionBlock
                key={q.id}
                q={q.q}
                opts={q.opts}
                answered={answers[q.id]}
                isOpen={i === step && !showResult}
                onAnswer={(ans) => handleAnswer(q.id, ans)}
              />
            ))}

            {showResult && (
              <>
                <SuggestionCard
                  method={method}
                  answers={answers}
                  userInfo={userInfo}
                  selectedGoal={selectedGoal}
                  selectedLevel={selectedLevel}
                />
                <button
                  onClick={reset}
                  style={{
                    width: '100%', padding: '13px',
                    background: 'transparent', border: `1.5px solid ${C.primary}`,
                    borderRadius: 12, color: C.primary, fontSize: 14,
                    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    marginTop: 12,
                  }}
                >
                  別のメニューを見る
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 進捗タブ
// ============================================================
function ProgressTab({ userInfo }) {
  const [data, setData]       = useState(SAMPLE_WEIGHT_DATA);
  const [wInput, setWInput]   = useState('');
  const [fatInput, setFatInput] = useState('');
  const [streak, setStreak]   = useState(7);

  const latest      = data[data.length - 1];
  const first       = data[0];
  const targetW     = Math.max(50, (userInfo.weight || 70) - 5);
  const targetFat   = Math.max(5,  (userInfo.fat    || 18) - 5);
  const pctW        = Math.min(100, Math.max(0, ((first.weight - latest.weight) / (first.weight - targetW)) * 100));

  const record = () => {
    if (!wInput) return;
    const d = new Date();
    setData(prev => [...prev, {
      date: `${d.getMonth()+1}/${d.getDate()}`,
      weight: parseFloat(wInput),
      fat:    parseFloat(fatInput) || latest.fat,
    }]);
    setWInput(''); setFatInput('');
    setStreak(s => s + 1);
  };

  return (
    <div style={S.screen}>
      <SectionHeader title="進捗" sub="記録を続けて目標へ" />
      <div style={{ padding: '0 16px 24px' }}>

        {/* ストリーク + 現在値 */}
        <div style={{ ...S.cardDark, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>
            <div style={{ fontSize: 38 }}>🔥</div>
          </div>
          <div>
            <div style={{ fontSize: 30, fontWeight: 800, color: C.amber, lineHeight: 1 }}>{streak}日</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>連続記録継続中</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{latest.weight}kg</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>現在の体重</div>
          </div>
        </div>

        {/* 体重グラフ */}
        <div style={S.cardDark}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16 }}>体重推移 (kg)</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                axisLine={false} tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, color: '#fff', fontSize: 13,
                }}
                formatter={(v) => [`${v}kg`, '体重']}
              />
              <Line
                type="monotone" dataKey="weight"
                stroke={C.primary} strokeWidth={2.5}
                dot={{ fill: C.primary, strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: C.primary }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 目標達成率 */}
        <div style={S.card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14 }}>目標達成率</div>
          <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: C.muted }}>体重</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
              {latest.weight}kg → 目標 {targetW}kg
            </span>
          </div>
          <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pctW}%`,
              background: `linear-gradient(90deg, ${C.primary}, #818cf8)`,
              borderRadius: 4, transition: 'width 0.6s ease',
            }} />
          </div>
          <div style={{ fontSize: 12, color: C.primary, textAlign: 'right', marginTop: 5, fontWeight: 700 }}>
            {Math.round(pctW)}%
          </div>
        </div>

        {/* 記録入力 */}
        <div style={S.card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14 }}>今日の記録</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={S.label}>体重 (kg)</label>
              <input
                type="number" placeholder={String(latest.weight)}
                value={wInput} onChange={e => setWInput(e.target.value)}
                style={S.input}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={S.label}>体脂肪率 (%)</label>
              <input
                type="number" placeholder={String(latest.fat)}
                value={fatInput} onChange={e => setFatInput(e.target.value)}
                style={S.input}
              />
            </div>
          </div>
          <button onClick={record} disabled={!wInput} style={S.btn(!wInput)}>
            記録する
          </button>
        </div>

      </div>
    </div>
  );
}

// ============================================================
// チャットタブ
// ============================================================
function ChatTab({ userInfo, selectedGoal, selectedLevel }) {
  const [msgs, setMsgs] = useState([
    { role: 'assistant', text: 'こんにちは！Fit Project AIのコーチです。\n体づくりについて何でも聞いてください 💪' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const systemPrompt = `あなたはFit Project AIのパーソナルコーチです。
ユーザーの目標：${selectedGoal?.name || '未設定'}
ユーザーのレベル：${selectedLevel?.name || '未設定'}
ユーザーの体重：${userInfo?.weight || '未入力'}kg、体脂肪率：${userInfo?.fat || '未入力'}%

以下のルールで返答してください：
- 必ず日本語で返答する
- 体づくりに関する質問に具体的・実践的に答える
- 励ましながらも科学的根拠のある情報を提供する
- 1回の返答は3〜5文程度にまとめる
- 「AIです」とは名乗らず「コーチ」として振る舞う`;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', text };
    const updated = [...msgs, userMsg];
    setMsgs(updated);
    setInput('');
    setLoading(true);

    try {
      // 会話履歴（初回のイントロ除く）をAPIメッセージに変換
      const history = updated
        .filter((_, i) => i > 0)
        .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));

      const apiMessages = [
        { role: 'user',      content: systemPrompt },
        { role: 'assistant', content: 'はい、了解しました。コーチとして全力でサポートします！' },
        ...history,
      ];

      // /api/chat はSupabase認証が必要なため、認証なしでは401が返る。
      // 本番環境では Authorization: Bearer {supabaseJWT} を付与してください。
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) throw new Error(`status ${res.status}`);
      const json = await res.json();
      setMsgs(prev => [...prev, { role: 'assistant', text: json.content || '...' }]);
    } catch (err) {
      console.error('Chat API error:', err);
      setMsgs(prev => [...prev, {
        role: 'assistant',
        text: '申し訳ありません、接続に問題が発生しました。\nもう一度お試しください。',
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: C.bg }}>
      {/* ヘッダー */}
      <div style={{
        padding: '14px 20px 12px',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 12,
        flexShrink: 0,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 50, background: C.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>
          💪
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Fit Project コーチ</div>
          <div style={{ fontSize: 12, color: C.success, fontWeight: 600 }}>● オンライン</div>
        </div>
      </div>

      {/* メッセージ一覧 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            alignItems: 'flex-end',
            gap: 8, marginBottom: 12,
          }}>
            {m.role === 'assistant' && (
              <div style={{
                width: 32, height: 32, borderRadius: 50, background: C.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, flexShrink: 0,
              }}>
                💪
              </div>
            )}
            <div style={{
              maxWidth: '76%',
              padding: '11px 14px',
              borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: m.role === 'user' ? C.primary : '#ffffff',
              color: m.role === 'user' ? '#fff' : C.text,
              fontSize: 14, lineHeight: 1.65,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              whiteSpace: 'pre-line',
            }}>
              {m.text}
            </div>
          </div>
        ))}

        {/* タイピングアニメーション */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 50, background: C.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>
              💪
            </div>
            <div style={{
              padding: '14px 18px',
              borderRadius: '16px 16px 16px 4px',
              background: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              display: 'flex', gap: 5, alignItems: 'center',
            }}>
              {[0, 1, 2].map(j => (
                <div key={j} style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: C.primary,
                  animation: `typing 1.2s ${j * 0.2}s ease-in-out infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 入力エリア */}
      <div style={{
        padding: '10px 14px 24px',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(16px)',
        borderTop: `1px solid ${C.border}`,
        display: 'flex', gap: 10, alignItems: 'center',
        flexShrink: 0,
      }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="コーチに質問する..."
          style={{ ...S.input, flex: 1, borderRadius: 24, padding: '12px 16px', margin: 0 }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          style={{
            width: 44, height: 44, borderRadius: 50,
            background: input.trim() && !loading ? C.primary : '#e2e8f0',
            border: 'none',
            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, flexShrink: 0,
            color: input.trim() && !loading ? '#fff' : C.muted,
            transition: 'all 0.15s',
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

// ============================================================
// 情報タブ
// ============================================================
function ProfileTab({ userInfo, selectedGoal, selectedLevel }) {
  const bmi = userInfo.height && userInfo.weight
    ? (userInfo.weight / Math.pow(userInfo.height / 100, 2)).toFixed(1)
    : '--';

  const rows = [
    { icon: '🎯', label: '目標',       value: selectedGoal?.name  || '--' },
    { icon: '📊', label: 'レベル',     value: selectedLevel?.name || '--' },
    { icon: '📏', label: '身長',       value: userInfo.height ? `${userInfo.height}cm` : '--' },
    { icon: '⚖️', label: '体重',       value: userInfo.weight ? `${userInfo.weight}kg` : '--' },
    { icon: '💉', label: '体脂肪率',   value: userInfo.fat    ? `${userInfo.fat}%`    : '--' },
    { icon: '📈', label: 'BMI',        value: bmi },
    { icon: '🎂', label: '年齢',       value: userInfo.age    ? `${userInfo.age}歳`   : '--' },
  ];

  return (
    <div style={S.screen}>
      <SectionHeader title="自分の情報" />
      <div style={{ padding: '0 16px' }}>
        <div style={{ ...S.cardDark, textAlign: 'center', padding: '28px 20px' }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>{selectedGoal?.emoji || '💪'}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            {selectedGoal?.name || '--'}
          </div>
          <div style={{
            display: 'inline-block', fontSize: 12, fontWeight: 700,
            padding: '4px 14px', background: `rgba(99,102,241,0.25)`,
            color: '#a5b4fc', borderRadius: 20,
          }}>
            {selectedLevel?.name || '--'}
          </div>
        </div>

        <div style={S.card}>
          {rows.map((r, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '13px 0',
              borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>{r.icon}</span>
                <span style={{ fontSize: 14, color: C.muted }}>{r.label}</span>
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 設定タブ
// ============================================================
function SettingsTab({ selectedGoal, selectedLevel, onReset }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div style={S.screen}>
      <SectionHeader title="設定" />
      <div style={{ padding: '0 16px' }}>
        <div style={S.card}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
            現在の設定
          </div>
          {[
            { label: '目標',   value: selectedGoal?.name  || '--' },
            { label: 'レベル', value: selectedLevel?.name || '--' },
          ].map((r, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '13px 0',
              borderBottom: i === 0 ? `1px solid ${C.border}` : 'none',
            }}>
              <span style={{ fontSize: 14, color: C.muted }}>{r.label}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{r.value}</span>
            </div>
          ))}
        </div>

        <div style={{
          ...S.card,
          border: '1px solid rgba(239,68,68,0.18)',
          background: 'rgba(239,68,68,0.02)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.danger, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            危険な操作
          </div>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, margin: '0 0 14px' }}>
            初期設定からやり直します。入力した情報がすべてリセットされます。
          </p>
          {!confirm ? (
            <button
              onClick={() => setConfirm(true)}
              style={{
                width: '100%', padding: '12px',
                border: '1.5px solid rgba(239,68,68,0.4)',
                borderRadius: 10, background: 'transparent',
                color: C.danger, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              初期設定からやり直す
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.danger, margin: '0 0 4px' }}>
                本当にリセットしますか？
              </p>
              <button
                onClick={onReset}
                style={{ padding: '12px', background: C.danger, border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                リセットする
              </button>
              <button
                onClick={() => setConfirm(false)}
                style={{ padding: '11px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 10, color: C.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                キャンセル
              </button>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', padding: '16px 0', color: C.muted, fontSize: 12 }}>
          Fit Project AI  v2.0
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ルートコンポーネント
// ============================================================
const TABS = [
  { id: 'plan',     icon: '📋', label: 'プラン' },
  { id: 'progress', icon: '📈', label: '進捗'   },
  { id: 'chat',     icon: '💬', label: '相談'   },
  { id: 'profile',  icon: '👤', label: '情報'   },
  { id: 'settings', icon: '⚙️', label: '設定'   },
];

const GLOBAL_CSS = `
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  ::-webkit-scrollbar { width: 0; height: 0; }
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes typing {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
    30%           { transform: translateY(-5px); opacity: 1; }
  }
`;

export default function FitProjectAI() {
  const [step, setStep]               = useState('goal');   // goal | level | info | app
  const [selectedGoal, setSelectedGoal]   = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [userInfo, setUserInfo]           = useState({});
  const [activeTab, setActiveTab]         = useState('plan');

  const reset = () => {
    setStep('goal');
    setSelectedGoal(null);
    setSelectedLevel(null);
    setUserInfo({});
    setActiveTab('plan');
  };

  return (
    <div style={S.app}>
      <style>{GLOBAL_CSS}</style>

      {/* ── 初期設定フロー ── */}
      {step === 'goal' && (
        <GoalSelection onSelect={g => { setSelectedGoal(g); setStep('level'); }} />
      )}
      {step === 'level' && (
        <LevelSelection
          goal={selectedGoal}
          onSelect={l => { setSelectedLevel(l); setStep('info'); }}
          onBack={() => setStep('goal')}
        />
      )}
      {step === 'info' && (
        <BasicInfoInput
          onSubmit={info => { setUserInfo(info); setStep('app'); }}
          onBack={() => setStep('level')}
        />
      )}

      {/* ── メインアプリ ── */}
      {step === 'app' && (
        <>
          {activeTab === 'plan'     && <PlanTab     userInfo={userInfo} selectedGoal={selectedGoal} selectedLevel={selectedLevel} />}
          {activeTab === 'progress' && <ProgressTab userInfo={userInfo} />}
          {activeTab === 'chat'     && <ChatTab     userInfo={userInfo} selectedGoal={selectedGoal} selectedLevel={selectedLevel} />}
          {activeTab === 'profile'  && <ProfileTab  userInfo={userInfo} selectedGoal={selectedGoal} selectedLevel={selectedLevel} />}
          {activeTab === 'settings' && <SettingsTab selectedGoal={selectedGoal} selectedLevel={selectedLevel} onReset={reset} />}

          <nav style={S.nav}>
            {TABS.map(t => (
              <NavButton
                key={t.id}
                icon={t.icon}
                label={t.label}
                active={activeTab === t.id}
                onClick={() => setActiveTab(t.id)}
              />
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
