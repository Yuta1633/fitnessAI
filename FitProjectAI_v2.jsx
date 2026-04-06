import { useState, useRef, useEffect } from "react";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const GOALS = [
  { id:"chest", name:"大胸筋筋肥大",  desc:"上半身・大胸筋を中心に増やしたい方向け", emoji:"💪", color:"#6366f1" },
  { id:"back",  name:"背中筋肥大",    desc:"背中のライン・厚みを増やしたい方向け",   emoji:"🏋️", color:"#3b82f6" },
  { id:"fat",   name:"脂肪減少",      desc:"体脂肪を減らし引き締まった体を作りたい方", emoji:"🔥", color:"#10b981" },
];

const LEVELS = [
  { id:"beginner",     name:"初心者",  desc:"トレーニング歴〜6ヶ月",    emoji:"🌱" },
  { id:"intermediate", name:"中級者",  desc:"トレーニング歴 6ヶ月〜2年", emoji:"💪" },
  { id:"advanced",     name:"上級者",  desc:"トレーニング歴 2年以上",    emoji:"🔥" },
  { id:"competitor",   name:"競技者",  desc:"大会出場経験あり",          emoji:"🏆" },
];

const KCAL = { beginner:2200, intermediate:2800, advanced:3200, competitor:3600 };
const MACRO = {
  beginner:     { p:140, f:60,  c:260 },
  intermediate: { p:180, f:70,  c:350 },
  advanced:     { p:220, f:80,  c:400 },
  competitor:   { p:260, f:90,  c:450 },
};

const SAMPLE_WEIGHTS = [
  { date:"3/1",  w:72.4 }, { date:"3/5",  w:72.0 },
  { date:"3/10", w:71.6 }, { date:"3/15", w:71.1 },
  { date:"3/20", w:70.8 }, { date:"3/25", w:70.5 },
  { date:"4/1",  w:70.2 },
];

// ─── COMMON UI ────────────────────────────────────────────────────────────────

const PhoneShell = ({ children }) => (
  <div style={{ width:"100%", maxWidth:390, margin:"0 auto", background:"#fff", borderRadius:40,
    boxShadow:"0 32px 80px rgba(99,102,241,0.15)", overflow:"hidden", minHeight:760,
    display:"flex", flexDirection:"column", fontFamily:"'Hiragino Sans','Yu Gothic',sans-serif" }}>
    <div style={{ background:"#fff", padding:"14px 24px 0", display:"flex", justifyContent:"space-between" }}>
      <span style={{ fontSize:15, fontWeight:700 }}>9:41</span>
      <span style={{ fontSize:12 }}>●●● 🔋</span>
    </div>
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>{children}</div>
  </div>
);

const BottomNav = ({ active, onChange }) => (
  <div style={{ borderTop:"1px solid #f0f0f0", padding:"8px 0 16px", display:"flex", justifyContent:"space-around", background:"#fff", flexShrink:0 }}>
    {[
      { id:"main",     icon:"📋", label:"ホーム" },
      { id:"progress", icon:"📈", label:"進捗" },
      { id:"chat",     icon:"💬", label:"相談" },
      { id:"info",     icon:"👤", label:"情報" },
      { id:"settings", icon:"⚙️", label:"設定" },
    ].map(t => (
      <button key={t.id} onClick={() => onChange(t.id)}
        style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:1, background:"none", border:"none", cursor:"pointer", padding:"4px 6px" }}>
        <span style={{ fontSize:20 }}>{t.icon}</span>
        <span style={{ fontSize:10, color: active===t.id?"#6366f1":"#9ca3af", fontWeight: active===t.id?700:400 }}>{t.label}</span>
      </button>
    ))}
  </div>
);

const Card = ({ children, style={} }) => (
  <div style={{ background:"#fafafa", borderRadius:16, padding:"16px", ...style }}>{children}</div>
);

const PrimaryBtn = ({ children, onClick, disabled, color="#6366f1" }) => (
  <button onClick={onClick} disabled={disabled} style={{
    width:"100%", padding:"15px", borderRadius:16,
    background: disabled?"#e5e7eb":`linear-gradient(135deg,${color},${color}cc)`,
    color: disabled?"#9ca3af":"#fff", border:"none", fontSize:16, fontWeight:700,
    cursor: disabled?"not-allowed":"pointer", transition:"all 0.2s",
  }}>{children}</button>
);

const SelectRow = ({ emoji, name, desc, selected, onClick, color="#6366f1" }) => (
  <div onClick={onClick} style={{
    border:`2px solid ${selected?color:"#f0f0f0"}`, borderRadius:14, padding:"14px 16px",
    display:"flex", alignItems:"center", gap:12, cursor:"pointer",
    background: selected?`${color}08`:"#fff", transition:"all 0.2s",
  }}>
    <div style={{ width:44, height:44, borderRadius:12, background:`${color}15`,
      display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{emoji}</div>
    <div style={{ flex:1 }}>
      <div style={{ fontWeight:700, fontSize:14, color:"#111" }}>{name}</div>
      {desc && <div style={{ fontSize:12, color:"#9ca3af", marginTop:2 }}>{desc}</div>}
    </div>
    <div style={{ width:26, height:26, borderRadius:"50%", background:selected?color:"#f0f0f0",
      display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:14 }}>›</div>
  </div>
);

// ─── ONBOARDING ───────────────────────────────────────────────────────────────

const StepDots = ({ current, total }) => (
  <div style={{ display:"flex", gap:6, marginBottom:24 }}>
    {Array.from({length:total}).map((_,i) => (
      <div key={i} style={{ height:4, width: i<current?40:20, borderRadius:99,
        background: i<current?"#6366f1":"#e5e7eb", transition:"all 0.3s" }} />
    ))}
  </div>
);

const OnboardingGoalSelect = ({ onNext, selected, onSelect }) => (
  <div style={{ padding:"24px", flex:1, display:"flex", flexDirection:"column", overflowY:"auto" }}>
    <StepDots current={1} total={3} />
    <div style={{ fontSize:12, color:"#6366f1", fontWeight:700, marginBottom:8 }}>STEP 01 / 初期設定</div>
    <h1 style={{ fontSize:24, fontWeight:900, lineHeight:1.3, marginBottom:6, color:"#111" }}>あなたの目標を<br/>選んでください</h1>
    <p style={{ fontSize:13, color:"#9ca3af", marginBottom:24 }}>一度選ぶと変更には申請が必要になります。慎重に選んでください。</p>
    <div style={{ display:"flex", flexDirection:"column", gap:10, flex:1 }}>
      {GOALS.map(g => <SelectRow key={g.id} {...g} selected={selected?.id===g.id} onClick={() => onSelect(g)} color={g.color} />)}
      <div style={{ background:"#fff7ed", borderRadius:12, padding:"10px 14px", display:"flex", gap:8, marginTop:4 }}>
        <span>⚠️</span>
        <span style={{ fontSize:12, color:"#92400e", lineHeight:1.5 }}>目標の変更は設定から申請できます。審査に最大24時間かかります。</span>
      </div>
    </div>
    <div style={{ marginTop:20 }}><PrimaryBtn onClick={onNext} disabled={!selected}>次へ →</PrimaryBtn></div>
  </div>
);

const OnboardingLevelSelect = ({ onNext, selected, onSelect }) => (
  <div style={{ padding:"24px", flex:1, display:"flex", flexDirection:"column", overflowY:"auto" }}>
    <StepDots current={2} total={3} />
    <div style={{ fontSize:12, color:"#6366f1", fontWeight:700, marginBottom:8 }}>STEP 02 / 初期設定</div>
    <h1 style={{ fontSize:24, fontWeight:900, lineHeight:1.3, marginBottom:6, color:"#111" }}>トレーニング<br/>レベルを教えてください</h1>
    <p style={{ fontSize:13, color:"#9ca3af", marginBottom:24 }}>レベルに合わせて提案内容が変わります。設定からいつでも変更できます。</p>
    <div style={{ display:"flex", flexDirection:"column", gap:10, flex:1 }}>
      {LEVELS.map(l => <SelectRow key={l.id} {...l} selected={selected?.id===l.id} onClick={() => onSelect(l)} />)}
      <div style={{ background:"#f0fdf4", borderRadius:12, padding:"10px 14px", display:"flex", gap:8, marginTop:4 }}>
        <span>✅</span>
        <span style={{ fontSize:12, color:"#15803d", lineHeight:1.5 }}>レベルは設定からいつでも変更できます。変更すると提案が即更新されます。</span>
      </div>
    </div>
    <div style={{ marginTop:20 }}><PrimaryBtn onClick={onNext} disabled={!selected}>次へ →</PrimaryBtn></div>
  </div>
);

const OnboardingBasicInfo = ({ onDone }) => {
  const [info, setInfo] = useState({ age:"", weight:"", fat:"", targetWeight:"", targetFat:"" });
  const set = (k,v) => setInfo(p => ({...p,[k]:v}));
  const allFilled = Object.values(info).every(v => v!=="");
  const fields = [
    { key:"age",         label:"年齢",         unit:"歳", placeholder:"25" },
    { key:"weight",      label:"現在体重",     unit:"kg", placeholder:"70.0" },
    { key:"fat",         label:"現在体脂肪率", unit:"%",  placeholder:"15.0" },
    { key:"targetWeight",label:"目標体重",     unit:"kg", placeholder:"75.0" },
    { key:"targetFat",   label:"目標体脂肪率", unit:"%",  placeholder:"10.0" },
  ];
  return (
    <div style={{ padding:"24px", flex:1, display:"flex", flexDirection:"column", overflowY:"auto" }}>
      <StepDots current={3} total={3} />
      <div style={{ fontSize:12, color:"#6366f1", fontWeight:700, marginBottom:8 }}>STEP 03 / 初期設定</div>
      <h1 style={{ fontSize:24, fontWeight:900, lineHeight:1.3, marginBottom:6, color:"#111" }}>基本情報を<br/>入力してください</h1>
      <p style={{ fontSize:13, color:"#9ca3af", marginBottom:24 }}>提案の精度を高めるために使用します。後から変更できます。</p>
      <div style={{ display:"flex", flexDirection:"column", gap:12, flex:1 }}>
        {fields.map(f => (
          <div key={f.key}>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>{f.label}</label>
            <div style={{ display:"flex", alignItems:"center", border:"2px solid #f0f0f0", borderRadius:12, background:"#fafafa", overflow:"hidden" }}>
              <input type="number" placeholder={f.placeholder} value={info[f.key]}
                onChange={e => set(f.key, e.target.value)}
                style={{ flex:1, padding:"12px 14px", border:"none", background:"transparent", fontSize:16, fontWeight:600, outline:"none" }} />
              <span style={{ padding:"0 14px", fontSize:13, color:"#9ca3af", fontWeight:600 }}>{f.unit}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:24 }}>
        <PrimaryBtn onClick={() => onDone(info)} disabled={!allFilled} color="#10b981">設定を完了する ✓</PrimaryBtn>
      </div>
    </div>
  );
};

// ─── ACCORDION FLOW ───────────────────────────────────────────────────────────

const AccordionFlow = ({ questions, onComplete, accentColor="#6366f1" }) => {
  const [answers, setAnswers] = useState({});
  const [openIdx, setOpenIdx] = useState(0);

  const answer = (qIdx, val) => {
    const next = { ...answers, [qIdx]: val };
    setAnswers(next);
    if (qIdx + 1 < questions.length) setTimeout(() => setOpenIdx(qIdx + 1), 280);
    else setTimeout(() => onComplete(next), 280);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {questions.map((q, i) => {
        const done = answers[i] !== undefined;
        const open = openIdx === i;
        return (
          <div key={i} style={{
            border:`2px solid ${done ? accentColor : open ? "#e0e0e0" : "#f0f0f0"}`,
            borderRadius:16, overflow:"hidden", transition:"all 0.2s",
            background: done ? `${accentColor}06` : "#fff",
          }}>
            {/* Header */}
            <div style={{ padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:26, height:26, borderRadius:"50%",
                  background: done ? accentColor : open ? "#f0f0f0" : "#f5f5f5",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:12, fontWeight:700, color: done ? "#fff" : "#9ca3af", flexShrink:0 }}>
                  {done ? "✓" : i+1}
                </div>
                <span style={{ fontSize:14, fontWeight:700, color: done?"#374151":open?"#111":"#9ca3af" }}>{q.label}</span>
              </div>
              {done && <span style={{ fontSize:12, color: accentColor, fontWeight:600, background:`${accentColor}15`, padding:"3px 10px", borderRadius:99 }}>{q.options.find(o=>o.id===answers[i])?.label}</span>}
            </div>
            {/* Options */}
            {open && !done && (
              <div style={{ padding:"0 14px 14px", display:"flex", flexDirection:"column", gap:8 }}>
                {q.options.map(opt => (
                  <div key={opt.id} onClick={() => answer(i, opt.id)}
                    style={{ border:"2px solid #f0f0f0", borderRadius:12, padding:"12px 14px",
                      display:"flex", alignItems:"center", gap:10, cursor:"pointer",
                      background:"#fafafa", transition:"all 0.15s" }}>
                    <span style={{ fontSize:18 }}>{opt.emoji}</span>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13, color:"#111" }}>{opt.label}</div>
                      {opt.sub && <div style={{ fontSize:11, color:"#9ca3af" }}>{opt.sub}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── PROPOSAL CARDS ───────────────────────────────────────────────────────────

const DietProposal = ({ answers, level }) => {
  const m = MACRO[level?.id] || MACRO.beginner;
  const k = KCAL[level?.id] || 2200;
  const purpose = answers[0];
  const kcalAdj = purpose==="bulk" ? k+200 : purpose==="cut" ? k-300 : k;
  return (
    <Card style={{ marginTop:16, border:"2px solid #6366f115" }}>
      <div style={{ fontWeight:800, fontSize:15, marginBottom:12, color:"#111" }}>🥗 今日の食事提案</div>
      <div style={{ fontSize:28, fontWeight:900, color:"#6366f1" }}>{kcalAdj}<span style={{ fontSize:13, fontWeight:400, color:"#9ca3af" }}>kcal</span></div>
      <div style={{ display:"flex", gap:12, marginTop:10 }}>
        {[["P", m.p+"g","#6366f1"],["F",m.f+"g","#f59e0b"],["C",m.c+"g","#10b981"]].map(([l,v,c])=>(
          <div key={l} style={{ flex:1, background:c+"15", borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
            <div style={{ fontSize:11, color:c, fontWeight:700 }}>{l}</div>
            <div style={{ fontSize:15, fontWeight:800, color:"#111" }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:12, fontSize:12, color:"#6b7280", lineHeight:1.7 }}>
        {purpose==="bulk" ? "筋肥大目的のため少しカロリーを上乗せしています。" : purpose==="cut" ? "脂肪燃焼のため少しカロリーを抑えています。" : "維持カロリーでバランスよく栄養を摂りましょう。"}
      </div>
    </Card>
  );
};

const TrainingProposal = ({ answers }) => {
  const part = answers[0]; const place = answers[1]; const time = answers[2];
  const menuMap = {
    chest:  ["ベンチプレス 4×8", "インクラインDB 3×10", "ケーブルフライ 3×12"],
    back:   ["デッドリフト 4×5", "ラットプル 4×10", "シーテッドロウ 3×12"],
    legs:   ["スクワット 4×8", "レッグプレス 3×12", "レッグカール 3×15"],
    shoulder:["ショルダープレス 4×10", "サイドレイズ 4×15", "フロントレイズ 3×12"],
    full:   ["スクワット 3×10", "ベンチプレス 3×10", "デッドリフト 3×8", "ショルダープレス 3×10"],
  };
  const menu = menuMap[part] || menuMap.full;
  const placeLabel = {gym:"ジム", home:"自宅（ダンベル）", bodyweight:"自重"}[place] || "";
  return (
    <Card style={{ marginTop:16, border:"2px solid #6366f115" }}>
      <div style={{ fontWeight:800, fontSize:15, marginBottom:4, color:"#111" }}>🏋️ 今日のトレーニング</div>
      <div style={{ fontSize:12, color:"#9ca3af", marginBottom:12 }}>{placeLabel} ／ {time==="short"?"30分以内":time==="mid"?"45〜60分":"60分以上"}</div>
      {menu.map((m,i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid #f0f0f0" }}>
          <div style={{ width:22, height:22, borderRadius:"50%", background:"#ede9fe", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#6366f1" }}>{i+1}</div>
          <span style={{ fontSize:13, color:"#374151", fontWeight:500 }}>{m}</span>
        </div>
      ))}
    </Card>
  );
};

const RecoveryProposal = ({ answers }) => {
  const intensity = answers[0]; const condition = answers[1];
  const needsRest = intensity==="hard" || condition==="sore";
  return (
    <Card style={{ marginTop:16, border:"2px solid #6366f115" }}>
      <div style={{ fontWeight:800, fontSize:15, marginBottom:12, color:"#111" }}>💤 今日の回復プロトコル</div>
      {needsRest ? (
        <>
          <div style={{ background:"#fef3c7", borderRadius:10, padding:"10px 12px", marginBottom:10, fontSize:13, color:"#92400e" }}>
            ⚠️ 今日は積極的な休養が必要です
          </div>
          {["軽いストレッチ 15〜20分","フォームローラーでセルフケア","睡眠 8時間以上を確保"].map((t,i)=>(
            <div key={i} style={{ fontSize:13, color:"#374151", padding:"7px 0", borderBottom:"1px solid #f0f0f0" }}>✦ {t}</div>
          ))}
        </>
      ) : (
        <>
          <div style={{ background:"#f0fdf4", borderRadius:10, padding:"10px 12px", marginBottom:10, fontSize:13, color:"#15803d" }}>
            ✅ コンディション良好です
          </div>
          {["アクティブリカバリー（ウォーキング30分）","軽いストレッチ 10分","睡眠 7〜8時間を確保"].map((t,i)=>(
            <div key={i} style={{ fontSize:13, color:"#374151", padding:"7px 0", borderBottom:"1px solid #f0f0f0" }}>✦ {t}</div>
          ))}
        </>
      )}
    </Card>
  );
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

const DIET_QS = [
  { label:"今日の目的は？", options:[
    { id:"bulk",    emoji:"💪", label:"筋肉をつけたい" },
    { id:"cut",     emoji:"🔥", label:"脂肪を落としたい" },
    { id:"maintain",emoji:"⚖️", label:"維持したい" },
  ]},
  { label:"食事の準備時間は？", options:[
    { id:"quick",  emoji:"⚡", label:"10分以内",    sub:"簡単なもので OK" },
    { id:"mid",    emoji:"🍳", label:"30分程度",    sub:"ある程度作れる" },
    { id:"full",   emoji:"👨‍🍳", label:"しっかり作れる", sub:"時間に余裕あり" },
  ]},
  { label:"今日のトレーニングは？", options:[
    { id:"yes",   emoji:"🏋️", label:"あり" },
    { id:"light", emoji:"🚶", label:"軽め" },
    { id:"no",    emoji:"😴", label:"なし（休養日）" },
  ]},
];

const TRAINING_QS = [
  { label:"今日鍛えたい部位は？", options:[
    { id:"chest",    emoji:"💪", label:"胸" },
    { id:"back",     emoji:"🏋️", label:"背中" },
    { id:"legs",     emoji:"🦵", label:"脚" },
    { id:"shoulder", emoji:"🙆", label:"肩・腕" },
    { id:"full",     emoji:"🔥", label:"全身" },
  ]},
  { label:"使える場所・器具は？", options:[
    { id:"gym",        emoji:"🏛️", label:"ジム",    sub:"マシン・フリーウェイト" },
    { id:"home",       emoji:"🏠", label:"自宅",    sub:"ダンベル等" },
    { id:"bodyweight", emoji:"🧍", label:"自重のみ", sub:"器具なし" },
  ]},
  { label:"使える時間は？", options:[
    { id:"short", emoji:"⚡", label:"30分以内" },
    { id:"mid",   emoji:"🕐", label:"45〜60分" },
    { id:"long",  emoji:"💯", label:"60分以上" },
  ]},
];

const RECOVERY_QS = [
  { label:"昨日のトレーニング強度は？", options:[
    { id:"hard",   emoji:"🔥", label:"ハード" },
    { id:"normal", emoji:"💪", label:"普通" },
    { id:"light",  emoji:"🚶", label:"軽め" },
    { id:"rest",   emoji:"😴", label:"休み" },
  ]},
  { label:"今日の体のコンディションは？", options:[
    { id:"sore",    emoji:"😣", label:"筋肉痛あり" },
    { id:"tired",   emoji:"😮‍💨", label:"疲労感あり" },
    { id:"great",   emoji:"😊", label:"良好" },
  ]},
];

const MainScreen = ({ goal, level }) => {
  const [active, setActive] = useState(null);   // diet | training | recovery
  const [result, setResult] = useState(null);

  const handleSelect = (id) => {
    setActive(id);
    setResult(null);
  };

  const METHODS = [
    { id:"diet",     icon:"🥗", name:"食事",         desc:"今日の食事プランを提案してもらう" },
    { id:"training", icon:"🏋️", name:"トレーニング", desc:"今日のメニューを組んでもらう" },
    { id:"recovery", icon:"💤", name:"回復",         desc:"最適な休養方法を教えてもらう" },
  ];

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflowY:"auto" }}>
      {/* Header */}
      <div style={{ padding:"16px 22px 12px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <span style={{ fontSize:20 }}>☰</span>
        <span style={{ fontWeight:700, fontSize:16 }}>Fit Project AI</span>
        <span style={{ fontSize:20 }}>🔔</span>
      </div>

      <div style={{ padding:"0 20px 20px", overflowY:"auto" }}>
        {/* Goal card */}
        <div style={{ background:"linear-gradient(135deg,#1e293b,#334155)", borderRadius:20, padding:"18px", color:"#fff", marginBottom:22 }}>
          <div style={{ fontSize:11, color:"#94a3b8", marginBottom:4 }}>登録中の目標</div>
          <div style={{ fontWeight:800, fontSize:17, marginBottom:10 }}>{goal?.emoji} {goal?.name}</div>
          <div style={{ display:"flex", gap:8 }}>
            <span style={{ background:"#6366f130", color:"#a5b4fc", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99 }}>
              {level?.emoji} {level?.name}
            </span>
          </div>
        </div>

        {/* Method select */}
        <div style={{ fontSize:13, fontWeight:700, color:"#374151", marginBottom:12 }}>今日は何の提案が欲しいですか？</div>
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom: active ? 20 : 0 }}>
          {METHODS.map(m => (
            <div key={m.id} onClick={() => handleSelect(m.id)} style={{
              border:`2px solid ${active===m.id?"#6366f1":"#f0f0f0"}`, borderRadius:16,
              padding:"16px 18px", display:"flex", alignItems:"center", gap:14,
              cursor:"pointer", background: active===m.id?"#ede9fe":"#fafafa", transition:"all 0.2s",
            }}>
              <div style={{ width:48, height:48, borderRadius:14, background:"#fff", border:"1px solid #f0f0f0",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{m.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:15, color:"#111" }}>{m.name}</div>
                <div style={{ fontSize:12, color:"#9ca3af", marginTop:2 }}>{m.desc}</div>
              </div>
              <span style={{ color:"#9ca3af", fontSize:20 }}>›</span>
            </div>
          ))}
        </div>

        {/* Accordion flow */}
        {active === "diet" && (
          result
            ? <><DietProposal answers={result} level={level} /><button onClick={()=>{setActive(null);setResult(null);}} style={{ marginTop:12, width:"100%", padding:"12px", borderRadius:12, border:"none", background:"#f0f0f0", fontSize:13, fontWeight:600, cursor:"pointer", color:"#374151" }}>別の提案を見る</button></>
            : <div style={{ marginTop:4 }}><AccordionFlow questions={DIET_QS} onComplete={setResult} accentColor="#6366f1" /></div>
        )}
        {active === "training" && (
          result
            ? <><TrainingProposal answers={result} /><button onClick={()=>{setActive(null);setResult(null);}} style={{ marginTop:12, width:"100%", padding:"12px", borderRadius:12, border:"none", background:"#f0f0f0", fontSize:13, fontWeight:600, cursor:"pointer", color:"#374151" }}>別の提案を見る</button></>
            : <div style={{ marginTop:4 }}><AccordionFlow questions={TRAINING_QS} onComplete={setResult} accentColor="#6366f1" /></div>
        )}
        {active === "recovery" && (
          result
            ? <><RecoveryProposal answers={result} /><button onClick={()=>{setActive(null);setResult(null);}} style={{ marginTop:12, width:"100%", padding:"12px", borderRadius:12, border:"none", background:"#f0f0f0", fontSize:13, fontWeight:600, cursor:"pointer", color:"#374151" }}>別の提案を見る</button></>
            : <div style={{ marginTop:4 }}><AccordionFlow questions={RECOVERY_QS} onComplete={setResult} accentColor="#6366f1" /></div>
        )}
      </div>
    </div>
  );
};

// ─── PROGRESS SCREEN ──────────────────────────────────────────────────────────

const MiniLineChart = ({ data, color="#6366f1" }) => {
  const w=280, h=80, pad=10;
  const vals = data.map(d=>d.w);
  const min=Math.min(...vals)-0.5, max=Math.max(...vals)+0.5;
  const xs = data.map((_,i) => pad + (i/(data.length-1))*(w-pad*2));
  const ys = vals.map(v => pad + (1-(v-min)/(max-min))*(h-pad*2));
  const path = xs.map((x,i)=>`${i===0?"M":"L"}${x},${ys[i]}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow:"visible" }}>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={`${path} L${xs[xs.length-1]},${h} L${xs[0]},${h} Z`} fill="url(#lg)" />
      <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
      {xs.map((x,i)=>(
        <circle key={i} cx={x} cy={ys[i]} r={3.5} fill="#fff" stroke={color} strokeWidth={2}/>
      ))}
    </svg>
  );
};

const ProgressScreen = ({ userInfo }) => {
  const [weights, setWeights] = useState(SAMPLE_WEIGHTS);
  const [inputW, setInputW] = useState("");
  const [inputF, setInputF] = useState("");
  const [saved, setSaved] = useState(false);

  const current = weights[weights.length-1]?.w || parseFloat(userInfo?.weight) || 70;
  const target  = parseFloat(userInfo?.targetWeight) || 75;
  const start   = parseFloat(userInfo?.weight) || 72;
  const pct     = Math.min(100, Math.max(0, Math.round(Math.abs(current-start)/Math.abs(target-start)*100)));

  const handleSave = () => {
    if (!inputW) return;
    const today = `${new Date().getMonth()+1}/${new Date().getDate()}`;
    setWeights(prev => [...prev, { date:today, w:parseFloat(inputW) }]);
    setInputW(""); setInputF("");
    setSaved(true); setTimeout(()=>setSaved(false), 2000);
  };

  const streak = weights.length;

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"20px 22px" }}>
      <h2 style={{ fontWeight:800, fontSize:22, color:"#111", marginBottom:20 }}>進捗</h2>

      {/* Streak */}
      <div style={{ background:"linear-gradient(135deg,#1e293b,#334155)", borderRadius:20, padding:"18px", color:"#fff", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:11, color:"#94a3b8", marginBottom:4 }}>連続記録日数</div>
          <div style={{ fontSize:36, fontWeight:900 }}>{streak}<span style={{ fontSize:18, fontWeight:400 }}>日</span></div>
        </div>
        <div style={{ fontSize:48 }}>🔥</div>
      </div>

      {/* Graph */}
      <Card style={{ marginBottom:16, overflow:"hidden" }}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>体重の推移</div>
        <div style={{ fontSize:12, color:"#9ca3af", marginBottom:14 }}>直近 {weights.length} 件の記録</div>
        <MiniLineChart data={weights} />
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
          {weights.map((d,i) => i%2===0 && <span key={i} style={{ fontSize:10, color:"#9ca3af" }}>{d.date}</span>)}
        </div>
      </Card>

      {/* Goal progress */}
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>目標達成率</div>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#9ca3af", marginBottom:6 }}>
          <span>スタート {start}kg</span>
          <span>現在 {current}kg</span>
          <span>目標 {target}kg</span>
        </div>
        <div style={{ height:10, background:"#f0f0f0", borderRadius:99, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${pct}%`, background:"linear-gradient(90deg,#6366f1,#8b5cf6)", borderRadius:99, transition:"width 0.5s" }} />
        </div>
        <div style={{ textAlign:"right", fontSize:13, fontWeight:700, color:"#6366f1", marginTop:6 }}>{pct}%</div>
      </Card>

      {/* Record input */}
      <Card>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>今日の記録</div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {[["体重","kg",inputW,setInputW,"70.0"],["体脂肪率","%",inputF,setInputF,"15.0"]].map(([l,u,v,s,p])=>(
            <div key={l} style={{ display:"flex", alignItems:"center", border:"2px solid #f0f0f0", borderRadius:12, overflow:"hidden" }}>
              <span style={{ padding:"0 12px", fontSize:13, color:"#9ca3af", fontWeight:600 }}>{l}</span>
              <input type="number" placeholder={p} value={v} onChange={e=>s(e.target.value)}
                style={{ flex:1, padding:"12px 0", border:"none", background:"transparent", fontSize:16, fontWeight:600, outline:"none" }}/>
              <span style={{ padding:"0 12px", fontSize:13, color:"#9ca3af" }}>{u}</span>
            </div>
          ))}
          {saved
            ? <div style={{ textAlign:"center", color:"#15803d", fontWeight:700, padding:"12px" }}>✅ 記録しました！</div>
            : <PrimaryBtn onClick={handleSave} disabled={!inputW}>記録する</PrimaryBtn>}
        </div>
      </Card>
    </div>
  );
};

// ─── CHAT SCREEN ──────────────────────────────────────────────────────────────

const ChatScreen = ({ goal, level, userInfo }) => {
  const [msgs, setMsgs] = useState([
    { role:"coach", text:`こんにちは！Fit Project AIのコーチです。\n目標「${goal?.name || "体づくり"}」に向けて、いつでも相談してください 💪` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...msgs, { role:"user", text }];
    setMsgs(next);
    setInput("");
    setLoading(true);

    try {
      const history = next.slice(1).map(m => ({
        role: m.role==="user" ? "user" : "assistant",
        content: m.text,
      }));

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:400,
          system:`あなたはFit Project AIのパーソナルコーチです。
ユーザーの目標：${goal?.name || "体づくり"}
トレーニングレベル：${level?.name || "初心者"}
現在体重：${userInfo?.weight || "不明"}kg、体脂肪率：${userInfo?.fat || "不明"}%
目標体重：${userInfo?.targetWeight || "不明"}kg

以下のルールで返答してください：
- 必ず日本語で返答する
- 体づくりに関する質問に具体的・実践的に答える
- 励ましながらも科学的根拠のある情報を提供する
- 1回の返答は3〜5文程度にまとめる
- 「AIです」とは名乗らず「コーチ」として振る舞う
- 絵文字を適度に使ってフレンドリーに話す`,
          messages: history,
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "すみません、うまく返答できませんでした。もう一度試してください。";
      setMsgs(p => [...p, { role:"coach", text:reply }]);
    } catch {
      setMsgs(p => [...p, { role:"coach", text:"接続エラーが発生しました。もう一度試してください。" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"14px 20px", borderBottom:"1px solid #f0f0f0", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
        <div style={{ width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>💪</div>
        <div>
          <div style={{ fontWeight:700, fontSize:14, color:"#111" }}>AIコーチ</div>
          <div style={{ fontSize:11, color:"#22c55e", fontWeight:600 }}>● オンライン</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 8px" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display:"flex", justifyContent: m.role==="user"?"flex-end":"flex-start", marginBottom:12 }}>
            {m.role==="coach" && (
              <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0, marginRight:8, alignSelf:"flex-end" }}>💪</div>
            )}
            <div style={{
              maxWidth:"72%", padding:"12px 14px", borderRadius: m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",
              background: m.role==="user"?"linear-gradient(135deg,#6366f1,#8b5cf6)":"#f3f4f6",
              color: m.role==="user"?"#fff":"#111", fontSize:14, lineHeight:1.6, whiteSpace:"pre-wrap",
            }}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display:"flex", alignItems:"flex-end", gap:8, marginBottom:12 }}>
            <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>💪</div>
            <div style={{ background:"#f3f4f6", borderRadius:"18px 18px 18px 4px", padding:"14px 18px" }}>
              <div style={{ display:"flex", gap:4 }}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:"#9ca3af",
                    animation:`bounce 1s ${i*0.2}s infinite`, }}/>
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{ padding:"10px 14px 14px", borderTop:"1px solid #f0f0f0", display:"flex", gap:8, flexShrink:0 }}>
        <input
          value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e => e.key==="Enter" && !e.shiftKey && send()}
          placeholder="コーチに質問する…"
          style={{ flex:1, padding:"12px 16px", borderRadius:24, border:"2px solid #f0f0f0", fontSize:14, outline:"none", background:"#fafafa" }}
        />
        <button onClick={send} disabled={!input.trim()||loading} style={{
          width:44, height:44, borderRadius:"50%", border:"none",
          background: input.trim()&&!loading?"linear-gradient(135deg,#6366f1,#8b5cf6)":"#e5e7eb",
          color:"#fff", fontSize:18, cursor: input.trim()&&!loading?"pointer":"not-allowed",
          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
        }}>↑</button>
      </div>

      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }`}</style>
    </div>
  );
};

// ─── INFO SCREEN ──────────────────────────────────────────────────────────────

const InfoScreen = ({ userInfo, level }) => {
  const m = MACRO[level?.id] || MACRO.beginner;
  const k = KCAL[level?.id] || 2200;
  return (
    <div style={{ flex:1, overflowY:"auto", padding:"20px 22px" }}>
      <h2 style={{ fontWeight:800, fontSize:22, color:"#111", marginBottom:20 }}>自分の情報</h2>
      <Card style={{ marginBottom:14 }}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>📊 基本情報</div>
        {[["年齢",`${userInfo?.age||"—"} 歳`],["現在体重",`${userInfo?.weight||"—"} kg`],["現在体脂肪率",`${userInfo?.fat||"—"} %`],["目標体重",`${userInfo?.targetWeight||"—"} kg`],["目標体脂肪率",`${userInfo?.targetFat||"—"} %`]].map(([l,v])=>(
          <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f0f0f0" }}>
            <span style={{ fontSize:13, color:"#6b7280" }}>{l}</span>
            <span style={{ fontSize:13, fontWeight:700 }}>{v}</span>
          </div>
        ))}
      </Card>
      <Card style={{ marginBottom:14 }}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>🔥 推定必要カロリー</div>
        <p style={{ fontSize:12, color:"#9ca3af", margin:"0 0 12px" }}>レベル「{level?.name}」に基づく推定値</p>
        <div style={{ fontSize:32, fontWeight:900, color:"#6366f1", marginBottom:12 }}>{k}<span style={{ fontSize:14, fontWeight:400, color:"#9ca3af" }}>kcal/日</span></div>
        {[["たんぱく質",`${m.p}g`,"#6366f1"],["脂質",`${m.f}g`,"#f59e0b"],["炭水化物",`${m.c}g`,"#10b981"]].map(([l,v,c])=>(
          <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #f0f0f0" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:c }}/>
              <span style={{ fontSize:13, color:"#6b7280" }}>{l}</span>
            </div>
            <span style={{ fontSize:13, fontWeight:700, color:c }}>{v}</span>
          </div>
        ))}
      </Card>
      <div style={{ background:"#ede9fe", borderRadius:12, padding:"12px 14px" }}>
        <span style={{ fontSize:12, color:"#5b21b6" }}>ℹ️ カロリーはトレーニングレベルに連動します。設定からレベルを変更すると自動で更新されます。</span>
      </div>
    </div>
  );
};

// ─── SETTINGS SCREEN ──────────────────────────────────────────────────────────

const SettingsScreen = ({ goal, level, onChangeLevel }) => {
  const [showGoalReq, setShowGoalReq] = useState(false);
  const [showLevelChange, setShowLevelChange] = useState(false);
  const [pendingLevel, setPendingLevel] = useState(null);
  const [reqSent, setReqSent] = useState(false);
  const [lvChanged, setLvChanged] = useState(false);

  const applyLevel = () => {
    if (!pendingLevel) return;
    onChangeLevel(pendingLevel);
    setLvChanged(true);
    setTimeout(()=>{ setShowLevelChange(false); setLvChanged(false); setPendingLevel(null); }, 1500);
  };

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"20px 22px" }}>
      <h2 style={{ fontWeight:800, fontSize:22, color:"#111", marginBottom:20 }}>設定</h2>

      <div style={{ marginBottom:6, fontSize:12, fontWeight:700, color:"#9ca3af" }}>目標</div>
      <Card style={{ marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:12, color:"#9ca3af", marginBottom:4 }}>現在の目標</div>
            <div style={{ fontWeight:700, fontSize:15 }}>{goal?.emoji} {goal?.name}</div>
          </div>
          <button onClick={()=>setShowGoalReq(true)} style={{ background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:10, padding:"6px 12px", fontSize:12, fontWeight:700, cursor:"pointer" }}>変更申請</button>
        </div>
        {showGoalReq && (
          <div style={{ marginTop:14, padding:"12px", background:"#fff7ed", borderRadius:12 }}>
            {reqSent
              ? <div style={{ textAlign:"center", color:"#15803d", fontWeight:700 }}>✅ 申請を送信しました。24時間以内に確認します。</div>
              : <>
                  <p style={{ fontSize:12, color:"#92400e", margin:"0 0 10px", lineHeight:1.6 }}>目標の変更には申請が必要です。審査後（最大24時間）に反映されます。</p>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>setShowGoalReq(false)} style={{ flex:1, padding:"9px", borderRadius:10, border:"1px solid #fed7aa", background:"#fff", color:"#9a3412", fontSize:13, cursor:"pointer" }}>キャンセル</button>
                    <button onClick={()=>setReqSent(true)} style={{ flex:1, padding:"9px", borderRadius:10, border:"none", background:"#ea580c", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>申請する</button>
                  </div>
                </>}
          </div>
        )}
      </Card>

      <div style={{ marginBottom:6, fontSize:12, fontWeight:700, color:"#9ca3af" }}>トレーニングレベル</div>
      <Card style={{ marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:12, color:"#9ca3af", marginBottom:4 }}>現在のレベル</div>
            <div style={{ fontWeight:700, fontSize:15 }}>{level?.emoji} {level?.name}</div>
          </div>
          <button onClick={()=>setShowLevelChange(v=>!v)} style={{ background:"#ede9fe", color:"#6366f1", border:"none", borderRadius:10, padding:"6px 12px", fontSize:12, fontWeight:700, cursor:"pointer" }}>変更する</button>
        </div>
        {showLevelChange && (
          <div style={{ marginTop:14 }}>
            <p style={{ fontSize:12, color:"#9ca3af", marginBottom:10 }}>✅ レベルはいつでも変更でき、提案内容が即座に更新されます。</p>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:10 }}>
              {LEVELS.map(l=>(
                <div key={l.id} onClick={()=>setPendingLevel(l)} style={{ border:`2px solid ${pendingLevel?.id===l.id?"#6366f1":"#f0f0f0"}`, borderRadius:12, padding:"10px 14px", display:"flex", gap:10, alignItems:"center", cursor:"pointer", background:pendingLevel?.id===l.id?"#ede9fe":"#fff" }}>
                  <span>{l.emoji}</span>
                  <div><div style={{ fontWeight:700, fontSize:13 }}>{l.name}</div><div style={{ fontSize:11, color:"#9ca3af" }}>{l.desc}</div></div>
                </div>
              ))}
            </div>
            {lvChanged
              ? <div style={{ textAlign:"center", color:"#15803d", fontWeight:700, padding:"10px" }}>✅ レベルを更新しました！</div>
              : <button onClick={applyLevel} disabled={!pendingLevel} style={{ width:"100%", padding:"12px", borderRadius:12, background:pendingLevel?"#6366f1":"#e5e7eb", color:pendingLevel?"#fff":"#9ca3af", border:"none", fontWeight:700, fontSize:14, cursor:pendingLevel?"pointer":"not-allowed" }}>このレベルで更新する</button>}
          </div>
        )}
      </Card>

      <div style={{ marginBottom:6, fontSize:12, fontWeight:700, color:"#9ca3af" }}>その他</div>
      <Card>
        {["通知設定","プライバシーポリシー","利用規約","ログアウト"].map((item,i,arr)=>(
          <div key={item} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:i<arr.length-1?"1px solid #f0f0f0":"none" }}>
            <span style={{ fontSize:14, color:item==="ログアウト"?"#ef4444":"#374151", fontWeight:item==="ログアウト"?600:400 }}>{item}</span>
            {item!=="ログアウト" && <span style={{ color:"#9ca3af" }}>›</span>}
          </div>
        ))}
      </Card>
    </div>
  );
};

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [step, setStep]         = useState("goal");
  const [selectedGoal, setGoal] = useState(null);
  const [selectedLevel, setLv]  = useState(null);
  const [userInfo, setInfo]     = useState(null);
  const [tab, setTab]           = useState("main");

  if (step==="goal") return <Shell><PhoneShell><OnboardingGoalSelect selected={selectedGoal} onSelect={setGoal} onNext={()=>setStep("level")} /></PhoneShell></Shell>;
  if (step==="level") return <Shell><PhoneShell><OnboardingLevelSelect selected={selectedLevel} onSelect={setLv} onNext={()=>setStep("info")} /></PhoneShell></Shell>;
  if (step==="info")  return <Shell><PhoneShell><OnboardingBasicInfo onDone={info=>{setInfo(info);setStep("app");}} /></PhoneShell></Shell>;

  return (
    <Shell>
      <PhoneShell>
        {tab==="main"     && <MainScreen goal={selectedGoal} level={selectedLevel} />}
        {tab==="progress" && <ProgressScreen userInfo={userInfo} />}
        {tab==="chat"     && <ChatScreen goal={selectedGoal} level={selectedLevel} userInfo={userInfo} />}
        {tab==="info"     && <InfoScreen userInfo={userInfo} level={selectedLevel} />}
        {tab==="settings" && <SettingsScreen goal={selectedGoal} level={selectedLevel} onChangeLevel={setLv} />}
        <BottomNav active={tab} onChange={setTab} />
      </PhoneShell>
    </Shell>
  );
}

const Shell = ({ children }) => (
  <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#f8f7ff,#eef2ff 50%,#f0f9ff)", display:"flex", flexDirection:"column", alignItems:"center", padding:"32px 20px", fontFamily:"'Hiragino Sans','Yu Gothic',sans-serif" }}>
    <div style={{ textAlign:"center", marginBottom:24 }}>
      <div style={{ fontSize:24, fontWeight:900, color:"#111" }}>Fit Project AI</div>
      <div style={{ fontSize:12, color:"#9ca3af" }}>UIプレビュー</div>
    </div>
    {children}
  </div>
);
