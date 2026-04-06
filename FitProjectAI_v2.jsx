import { useState } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const PLANS = [
  { id: "chest", name: "大胸筋筋肥大特化プラン", desc: "上半身・大胸筋を中心に効果的に増やしたい方向け", emoji: "💪", color: "#6366f1" },
  { id: "back",  name: "背中筋肥大プラン",       desc: "美しい背中のラインと全体的な厚みを増やしたい方向け", emoji: "🏋️", color: "#3b82f6" },
  { id: "fat",   name: "脂肪減少プラン",         desc: "体脂肪を減らし引き締まった体を作りたい方向け", emoji: "🔥", color: "#10b981" },
];

const LEVELS = [
  { id: "beginner",     name: "初心者",   desc: "トレーニング歴〜6ヶ月",   emoji: "🌱" },
  { id: "intermediate", name: "中級者",   desc: "トレーニング歴 6ヶ月〜2年", emoji: "💪" },
  { id: "advanced",     name: "上級者",   desc: "トレーニング歴 2年以上",   emoji: "🔥" },
  { id: "competitor",   name: "競技者",   desc: "大会出場経験あり",         emoji: "🏆" },
];

const PROPOSAL_BY_LEVEL = {
  beginner:     { kcal: 2200, p: 140, f: 60,  c: 260, note: "まずは基本的な食事習慣の確立を優先します。" },
  intermediate: { kcal: 2800, p: 180, f: 70,  c: 350, note: "筋肉合成を最大化する栄養バランスにしています。" },
  advanced:     { kcal: 3200, p: 220, f: 80,  c: 400, note: "高強度トレーニングに対応した栄養設計です。" },
  competitor:   { kcal: 3600, p: 260, f: 90,  c: 450, note: "競技パフォーマンスに特化したプロトコルです。" },
};

const TRAINING_PLACES = [
  { id: "gym",        name: "ジム",     emoji: "🏛️", desc: "マシン・フリーウェイト" },
  { id: "home",       name: "自宅",     emoji: "🏠", desc: "自重＋ダンベル等" },
  { id: "bodyweight", name: "自重のみ", emoji: "🧍", desc: "器具なし" },
];

// ─── COMMON COMPONENTS ───────────────────────────────────────────────────────

const PhoneShell = ({ children }) => (
  <div style={{
    width: "100%", maxWidth: 390, margin: "0 auto",
    background: "#fff", borderRadius: 40,
    boxShadow: "0 32px 80px rgba(99,102,241,0.15)",
    overflow: "hidden", minHeight: 760,
    display: "flex", flexDirection: "column",
    fontFamily: "'Hiragino Sans','Yu Gothic',sans-serif",
  }}>
    <div style={{ background:"#fff", padding:"14px 24px 0", display:"flex", justifyContent:"space-between" }}>
      <span style={{ fontSize:15, fontWeight:700 }}>9:41</span>
      <span style={{ fontSize:12 }}>●●● 🔋</span>
    </div>
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {children}
    </div>
  </div>
);

const BottomNav = ({ active, onChange }) => (
  <div style={{ borderTop:"1px solid #f0f0f0", padding:"10px 0 18px", display:"flex", justifyContent:"space-around", background:"#fff", flexShrink:0 }}>
    {[
      { id:"main",     icon:"📋", label:"プラン" },
      { id:"info",     icon:"👤", label:"自分の情報" },
      { id:"settings", icon:"⚙️", label:"設定" },
    ].map(t => (
      <button key={t.id} onClick={() => onChange(t.id)}
        style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, background:"none", border:"none", cursor:"pointer" }}>
        <span style={{ fontSize:22 }}>{t.icon}</span>
        <span style={{ fontSize:11, color: active===t.id ? "#6366f1" : "#9ca3af", fontWeight: active===t.id ? 700 : 400 }}>
          {t.label}
        </span>
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
    background: disabled ? "#e5e7eb" : `linear-gradient(135deg, ${color}, ${color}cc)`,
    color: disabled ? "#9ca3af" : "#fff",
    border:"none", fontSize:16, fontWeight:700,
    cursor: disabled ? "not-allowed" : "pointer", transition:"all 0.2s",
  }}>{children}</button>
);

const SelectRow = ({ emoji, name, desc, selected, onClick, color="#6366f1" }) => (
  <div onClick={onClick} style={{
    border:`2px solid ${selected ? color : "#f0f0f0"}`,
    borderRadius:14, padding:"14px 16px",
    display:"flex", alignItems:"center", gap:12,
    cursor:"pointer", background: selected ? `${color}08` : "#fff",
    transition:"all 0.2s",
  }}>
    <div style={{ width:44, height:44, borderRadius:12, background:`${color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
      {emoji}
    </div>
    <div style={{ flex:1 }}>
      <div style={{ fontWeight:700, fontSize:14, color:"#111" }}>{name}</div>
      <div style={{ fontSize:12, color:"#9ca3af", marginTop:2 }}>{desc}</div>
    </div>
    <div style={{ width:26, height:26, borderRadius:"50%", background: selected ? color : "#f0f0f0", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:14 }}>
      ›
    </div>
  </div>
);

// ─── ONBOARDING ──────────────────────────────────────────────────────────────

const OnboardingPlanSelect = ({ onNext, selected, onSelect }) => (
  <div style={{ padding:"24px", flex:1, display:"flex", flexDirection:"column", overflowY:"auto" }}>
    <div style={{ display:"flex", gap:6, marginBottom:24 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ height:4, width: i===1?40:20, borderRadius:99, background: i===1?"#6366f1":"#e5e7eb" }} />
      ))}
    </div>
    <div style={{ fontSize:12, color:"#6366f1", fontWeight:700, marginBottom:8 }}>STEP 01 / 初期設定</div>
    <h1 style={{ fontSize:24, fontWeight:900, lineHeight:1.3, marginBottom:6, color:"#111" }}>目標プランを<br/>選んでください</h1>
    <p style={{ fontSize:13, color:"#9ca3af", marginBottom:24 }}>一度選ぶと変更には申請が必要になります。慎重に選んでください。</p>
    <div style={{ display:"flex", flexDirection:"column", gap:10, flex:1 }}>
      {PLANS.map(p => (
        <SelectRow key={p.id} {...p} selected={selected?.id===p.id} onClick={() => onSelect(p)} color={p.color} />
      ))}
      <div style={{ background:"#fff7ed", borderRadius:12, padding:"10px 14px", display:"flex", gap:8, alignItems:"flex-start", marginTop:4 }}>
        <span>⚠️</span>
        <span style={{ fontSize:12, color:"#92400e", lineHeight:1.5 }}>プランの変更は設定から申請できます。審査に最大24時間かかります。</span>
      </div>
    </div>
    <div style={{ marginTop:20 }}>
      <PrimaryBtn onClick={onNext} disabled={!selected}>次へ →</PrimaryBtn>
    </div>
  </div>
);

const OnboardingLevelSelect = ({ onNext, selected, onSelect }) => (
  <div style={{ padding:"24px", flex:1, display:"flex", flexDirection:"column", overflowY:"auto" }}>
    <div style={{ display:"flex", gap:6, marginBottom:24 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ height:4, width: i<=2?40:20, borderRadius:99, background: i<=2?"#6366f1":"#e5e7eb" }} />
      ))}
    </div>
    <div style={{ fontSize:12, color:"#6366f1", fontWeight:700, marginBottom:8 }}>STEP 02 / 初期設定</div>
    <h1 style={{ fontSize:24, fontWeight:900, lineHeight:1.3, marginBottom:6, color:"#111" }}>トレーニング<br/>レベルを教えてください</h1>
    <p style={{ fontSize:13, color:"#9ca3af", marginBottom:24 }}>レベルに合わせて提案内容が変わります。設定からいつでも変更できます。</p>
    <div style={{ display:"flex", flexDirection:"column", gap:10, flex:1 }}>
      {LEVELS.map(l => (
        <SelectRow key={l.id} {...l} selected={selected?.id===l.id} onClick={() => onSelect(l)} color="#6366f1" />
      ))}
      <div style={{ background:"#f0fdf4", borderRadius:12, padding:"10px 14px", display:"flex", gap:8, alignItems:"flex-start", marginTop:4 }}>
        <span>✅</span>
        <span style={{ fontSize:12, color:"#15803d", lineHeight:1.5 }}>レベルは設定からいつでも変更できます。変更するとその場で提案内容が更新されます。</span>
      </div>
    </div>
    <div style={{ marginTop:20 }}>
      <PrimaryBtn onClick={onNext} disabled={!selected}>次へ →</PrimaryBtn>
    </div>
  </div>
);

const OnboardingBasicInfo = ({ onDone }) => {
  const [info, setInfo] = useState({ weight:"", fat:"", targetWeight:"", targetFat:"", age:"" });
  const allFilled = Object.values(info).every(v => v !== "");
  const set = (k, v) => setInfo(prev => ({ ...prev, [k]: v }));
  const fields = [
    { key:"age",          label:"年齢",         unit:"歳", placeholder:"25" },
    { key:"weight",       label:"現在体重",     unit:"kg", placeholder:"70.0" },
    { key:"fat",          label:"現在体脂肪率", unit:"%",  placeholder:"15.0" },
    { key:"targetWeight", label:"目標体重",     unit:"kg", placeholder:"75.0" },
    { key:"targetFat",    label:"目標体脂肪率", unit:"%",  placeholder:"10.0" },
  ];
  return (
    <div style={{ padding:"24px", flex:1, display:"flex", flexDirection:"column", overflowY:"auto" }}>
      <div style={{ display:"flex", gap:6, marginBottom:24 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ height:4, flex:1, borderRadius:99, background:"#6366f1" }} />
        ))}
      </div>
      <div style={{ fontSize:12, color:"#6366f1", fontWeight:700, marginBottom:8 }}>STEP 03 / 初期設定</div>
      <h1 style={{ fontSize:24, fontWeight:900, lineHeight:1.3, marginBottom:6, color:"#111" }}>基本情報を<br/>入力してください</h1>
      <p style={{ fontSize:13, color:"#9ca3af", marginBottom:24 }}>提案の精度を高めるために使用します。後から変更できます。</p>
      <div style={{ display:"flex", flexDirection:"column", gap:12, flex:1 }}>
        {fields.map(f => (
          <div key={f.key} style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151" }}>{f.label}</label>
            <div style={{ display:"flex", alignItems:"center", border:"2px solid #f0f0f0", borderRadius:12, overflow:"hidden", background:"#fafafa" }}>
              <input
                type="number"
                placeholder={f.placeholder}
                value={info[f.key]}
                onChange={e => set(f.key, e.target.value)}
                style={{ flex:1, padding:"12px 14px", border:"none", background:"transparent", fontSize:16, fontWeight:600, outline:"none" }}
              />
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

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

const METHODS = [
  { id:"diet",     icon:"🥗", name:"食事",         desc:"栄養・食事プランの提案を見る" },
  { id:"training", icon:"🏋️", name:"トレーニング", desc:"部位・メニューの提案を見る" },
  { id:"recovery", icon:"💤", name:"回復",         desc:"睡眠・休養の最適化提案" },
];

const DonutChart = ({ p, f, c }) => {
  const total = p + f + c;
  const segs = [
    { pct: p/total, color:"#6366f1" },
    { pct: f/total, color:"#f59e0b" },
    { pct: c/total, color:"#10b981" },
  ];
  let cumDeg = -90;
  const polar = (cx, cy, r, deg) => ({
    x: cx + r * Math.cos(deg * Math.PI / 180),
    y: cy + r * Math.sin(deg * Math.PI / 180),
  });
  const arc = (cx, cy, r, s, e) => {
    const S = polar(cx,cy,r,s), E = polar(cx,cy,r,e);
    return `M ${S.x} ${S.y} A ${r} ${r} 0 ${e-s>180?1:0} 1 ${E.x} ${E.y}`;
  };
  return (
    <svg width={80} height={80} viewBox="0 0 80 80">
      {segs.map((seg, i) => {
        const start = cumDeg;
        const end = cumDeg + seg.pct * 360 - 1;
        cumDeg += seg.pct * 360;
        return (
          <path key={i} d={arc(40,40,28,start,end)} fill="none"
            stroke={seg.color} strokeWidth={12} strokeLinecap="round" />
        );
      })}
    </svg>
  );
};

const TrainingDetail = ({ plan, level, onBack }) => {
  const [place, setPlace] = useState(null);
  const proposal = PROPOSAL_BY_LEVEL[level?.id] || PROPOSAL_BY_LEVEL.beginner;
  return (
    <div style={{ padding:"20px 22px", flex:1, display:"flex", flexDirection:"column", overflowY:"auto" }}>
      <button onClick={onBack} style={{ background:"none", border:"none", fontSize:13, color:"#6366f1", fontWeight:600, cursor:"pointer", marginBottom:16, textAlign:"left" }}>← 戻る</button>
      <div style={{ fontSize:12, fontWeight:700, color:"#6366f1", marginBottom:6 }}>🏋️ トレーニング提案</div>
      <h2 style={{ fontSize:20, fontWeight:800, color:"#111", marginBottom:4 }}>{plan?.name}</h2>
      <p style={{ fontSize:12, color:"#9ca3af", marginBottom:20 }}>レベル：{level?.name} ／ {proposal.note}</p>

      <div style={{ fontSize:13, fontWeight:700, color:"#374151", marginBottom:10 }}>トレーニング場所を選択</div>
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
        {TRAINING_PLACES.map(pl => (
          <SelectRow key={pl.id} {...pl} selected={place?.id===pl.id} onClick={() => setPlace(pl)} color="#6366f1" />
        ))}
      </div>

      {place && (
        <Card>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:10 }}>📋 {place.name}向け週間メニュー</div>
          {(level?.id === "beginner"
            ? ["月：胸・三頭筋（基本3種目）", "水：背中・二頭筋（基本3種目）", "金：脚・肩（基本3種目）"]
            : level?.id === "intermediate"
            ? ["月：胸（5種目）", "火：背中（5種目）", "木：肩（4種目）", "土：脚（5種目）"]
            : ["月：胸・三頭筋", "火：背中・二頭筋", "水：肩", "木：脚", "土：腕・腹筋"]
          ).map(d => (
            <div key={d} style={{ fontSize:13, color:"#374151", padding:"6px 0", borderBottom:"1px solid #f0f0f0" }}>✦ {d}</div>
          ))}
        </Card>
      )}
    </div>
  );
};

const DietDetail = ({ plan, level, onBack }) => {
  const proposal = PROPOSAL_BY_LEVEL[level?.id] || PROPOSAL_BY_LEVEL.beginner;
  const macros = [
    { label:"たんぱく質", g: proposal.p, color:"#6366f1" },
    { label:"脂質",       g: proposal.f, color:"#f59e0b" },
    { label:"炭水化物",   g: proposal.c, color:"#10b981" },
  ];
  return (
    <div style={{ padding:"20px 22px", flex:1, display:"flex", flexDirection:"column", overflowY:"auto" }}>
      <button onClick={onBack} style={{ background:"none", border:"none", fontSize:13, color:"#6366f1", fontWeight:600, cursor:"pointer", marginBottom:16, textAlign:"left" }}>← 戻る</button>
      <div style={{ fontSize:12, fontWeight:700, color:"#6366f1", marginBottom:6 }}>🥗 食事提案</div>
      <h2 style={{ fontSize:20, fontWeight:800, color:"#111", marginBottom:4 }}>{plan?.name}</h2>
      <p style={{ fontSize:12, color:"#9ca3af", marginBottom:20 }}>レベル：{level?.name} ／ {proposal.note}</p>

      <Card style={{ marginBottom:16 }}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>推奨栄養バランス</div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <DonutChart p={proposal.p} f={proposal.f} c={proposal.c} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:22, fontWeight:900, color:"#111" }}>
              {proposal.kcal}<span style={{ fontSize:13, fontWeight:400, color:"#9ca3af" }}>kcal/日</span>
            </div>
            {macros.map(m => (
              <div key={m.label} style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginTop:4 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:m.color }} />
                  <span style={{ color:"#6b7280" }}>{m.label}</span>
                </div>
                <span style={{ fontWeight:700 }}>{m.g}g</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:10 }}>食事タイミング</div>
        {[
          "起床後30分以内：プロテイン＋炭水化物",
          "トレ前1時間：軽い炭水化物",
          "トレ後30分以内：タンパク質優先",
          "就寝前：カゼインプロテイン",
        ].map(t => (
          <div key={t} style={{ fontSize:12, color:"#374151", padding:"6px 0", borderBottom:"1px solid #f0f0f0" }}>✦ {t}</div>
        ))}
      </Card>
    </div>
  );
};

const RecoveryDetail = ({ level, onBack }) => (
  <div style={{ padding:"20px 22px", flex:1, display:"flex", flexDirection:"column", overflowY:"auto" }}>
    <button onClick={onBack} style={{ background:"none", border:"none", fontSize:13, color:"#6366f1", fontWeight:600, cursor:"pointer", marginBottom:16, textAlign:"left" }}>← 戻る</button>
    <div style={{ fontSize:12, fontWeight:700, color:"#6366f1", marginBottom:6 }}>💤 回復提案</div>
    <h2 style={{ fontSize:20, fontWeight:800, color:"#111", marginBottom:16 }}>最適な回復プロトコル</h2>
    <Card style={{ marginBottom:14 }}>
      <div style={{ fontWeight:700, fontSize:14, marginBottom:10 }}>😴 睡眠</div>
      <div style={{ fontSize:13, color:"#374151", lineHeight:1.8 }}>
        推奨睡眠時間：<strong>{level?.id === "competitor" ? "8〜9時間" : level?.id === "advanced" ? "7〜8時間" : "7時間以上"}</strong><br/>
        就寝時刻の目安：23時前<br/>
        起床後15分以内に光を浴びる
      </div>
    </Card>
    <Card style={{ marginBottom:14 }}>
      <div style={{ fontWeight:700, fontSize:14, marginBottom:10 }}>🧘 アクティブリカバリー</div>
      {["軽いストレッチ（10〜15分）", "ウォーキング（30分程度）", "フォームローラーでのセルフケア"].map(t => (
        <div key={t} style={{ fontSize:12, color:"#374151", padding:"6px 0", borderBottom:"1px solid #f0f0f0" }}>✦ {t}</div>
      ))}
    </Card>
    <Card>
      <div style={{ fontWeight:700, fontSize:14, marginBottom:10 }}>💊 サプリメント（任意）</div>
      {["マグネシウム（就寝前）", "ビタミンD（朝食後）", "BCAA（トレ前後）"].map(t => (
        <div key={t} style={{ fontSize:12, color:"#374151", padding:"6px 0", borderBottom:"1px solid #f0f0f0" }}>✦ {t}</div>
      ))}
    </Card>
  </div>
);

const MainScreen = ({ plan, level }) => {
  const [activeMethod, setActiveMethod] = useState(null);
  const planColor = plan?.color || "#6366f1";

  if (activeMethod === "training") return <TrainingDetail plan={plan} level={level} onBack={() => setActiveMethod(null)} />;
  if (activeMethod === "diet")     return <DietDetail plan={plan} level={level} onBack={() => setActiveMethod(null)} />;
  if (activeMethod === "recovery") return <RecoveryDetail level={level} onBack={() => setActiveMethod(null)} />;

  return (
    <div style={{ padding:"20px 22px", flex:1, display:"flex", flexDirection:"column", overflowY:"auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <span style={{ fontSize:20 }}>☰</span>
        <span style={{ fontWeight:700, fontSize:16 }}>Fit Project AI</span>
        <span style={{ fontSize:20 }}>🔔</span>
      </div>

      <div style={{ background:`linear-gradient(135deg, #1e293b, #334155)`, borderRadius:20, padding:"18px", color:"#fff", marginBottom:22 }}>
        <div style={{ fontSize:11, color:"#94a3b8", marginBottom:4 }}>登録中プラン</div>
        <div style={{ fontWeight:800, fontSize:17, marginBottom:10 }}>{plan?.name}</div>
        <div style={{ display:"flex", gap:8 }}>
          <span style={{ background:`${planColor}30`, color:planColor, fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99 }}>
            {plan?.emoji} {plan?.name.slice(0,4)}
          </span>
          <span style={{ background:"#22c55e20", color:"#22c55e", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99 }}>
            ● {level?.name}
          </span>
        </div>
      </div>

      <div style={{ fontSize:13, fontWeight:700, color:"#374151", marginBottom:12 }}>何の提案が欲しいですか？</div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {METHODS.map(m => (
          <div key={m.id} onClick={() => setActiveMethod(m.id)} style={{
            border:"2px solid #f0f0f0", borderRadius:16,
            padding:"16px 18px", display:"flex", alignItems:"center", gap:14,
            cursor:"pointer", background:"#fafafa", transition:"all 0.2s",
          }}>
            <div style={{ width:48, height:48, borderRadius:14, background:"#fff", border:"1px solid #f0f0f0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
              {m.icon}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:15, color:"#111" }}>{m.name}</div>
              <div style={{ fontSize:12, color:"#9ca3af", marginTop:2 }}>{m.desc}</div>
            </div>
            <span style={{ color:"#9ca3af", fontSize:20 }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── MY INFO SCREEN ───────────────────────────────────────────────────────────

const InfoScreen = ({ userInfo, level }) => {
  const proposal = PROPOSAL_BY_LEVEL[level?.id] || PROPOSAL_BY_LEVEL.beginner;
  return (
    <div style={{ padding:"20px 22px", flex:1, display:"flex", flexDirection:"column", overflowY:"auto" }}>
      <h2 style={{ fontWeight:800, fontSize:22, color:"#111", marginBottom:20 }}>自分の情報</h2>

      <Card style={{ marginBottom:14 }}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>📊 基本情報</div>
        {[
          ["年齢",         `${userInfo?.age || "—"} 歳`],
          ["現在体重",     `${userInfo?.weight || "—"} kg`],
          ["現在体脂肪率", `${userInfo?.fat || "—"} %`],
          ["目標体重",     `${userInfo?.targetWeight || "—"} kg`],
          ["目標体脂肪率", `${userInfo?.targetFat || "—"} %`],
        ].map(([l, v]) => (
          <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f0f0f0" }}>
            <span style={{ fontSize:13, color:"#6b7280" }}>{l}</span>
            <span style={{ fontSize:13, fontWeight:700 }}>{v}</span>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom:14 }}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>🔥 必要カロリー（推定）</div>
        <div style={{ fontSize:32, fontWeight:900, color:"#6366f1", marginBottom:4 }}>
          {proposal.kcal}<span style={{ fontSize:15, fontWeight:400, color:"#9ca3af" }}>kcal/日</span>
        </div>
        <p style={{ fontSize:12, color:"#9ca3af", margin:"0 0 12px" }}>レベル「{level?.name}」に基づく推定値</p>
        {[
          ["たんぱく質", `${proposal.p}g`, "#6366f1"],
          ["脂質",       `${proposal.f}g`, "#f59e0b"],
          ["炭水化物",   `${proposal.c}g`, "#10b981"],
        ].map(([l, v, c]) => (
          <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #f0f0f0" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:c }} />
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

// ─── SETTINGS SCREEN ─────────────────────────────────────────────────────────

const SettingsScreen = ({ plan, level, onChangeLevel }) => {
  const [showPlanRequest, setShowPlanRequest] = useState(false);
  const [showLevelChange, setShowLevelChange] = useState(false);
  const [pendingLevel, setPendingLevel]       = useState(null);
  const [requestSent, setRequestSent]         = useState(false);
  const [levelChanged, setLevelChanged]       = useState(false);

  const handleLevelApply = () => {
    if (pendingLevel) {
      onChangeLevel(pendingLevel);
      setLevelChanged(true);
      setTimeout(() => { setShowLevelChange(false); setLevelChanged(false); setPendingLevel(null); }, 1500);
    }
  };

  return (
    <div style={{ padding:"20px 22px", flex:1, display:"flex", flexDirection:"column", overflowY:"auto" }}>
      <h2 style={{ fontWeight:800, fontSize:22, color:"#111", marginBottom:20 }}>設定</h2>

      <div style={{ marginBottom:6, fontSize:12, fontWeight:700, color:"#9ca3af", letterSpacing:"0.05em" }}>プラン</div>
      <Card style={{ marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:12, color:"#9ca3af", marginBottom:4 }}>現在のプラン</div>
            <div style={{ fontWeight:700, fontSize:15, color:"#111" }}>{plan?.emoji} {plan?.name}</div>
          </div>
          <button onClick={() => setShowPlanRequest(true)} style={{
            background:"#fee2e2", color:"#dc2626", border:"none",
            borderRadius:10, padding:"6px 12px", fontSize:12, fontWeight:700, cursor:"pointer",
          }}>変更申請</button>
        </div>
        {showPlanRequest && (
          <div style={{ marginTop:14, padding:"12px", background:"#fff7ed", borderRadius:12 }}>
            {requestSent ? (
              <div style={{ textAlign:"center", color:"#15803d", fontWeight:700 }}>✅ 申請を送信しました。24時間以内に確認します。</div>
            ) : (
              <>
                <p style={{ fontSize:12, color:"#92400e", margin:"0 0 10px", lineHeight:1.6 }}>
                  プランの変更には申請が必要です。審査後（最大24時間）に反映されます。
                </p>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => setShowPlanRequest(false)} style={{ flex:1, padding:"9px", borderRadius:10, border:"1px solid #fed7aa", background:"#fff", color:"#9a3412", fontSize:13, cursor:"pointer" }}>キャンセル</button>
                  <button onClick={() => setRequestSent(true)} style={{ flex:1, padding:"9px", borderRadius:10, border:"none", background:"#ea580c", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>申請する</button>
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      <div style={{ marginBottom:6, fontSize:12, fontWeight:700, color:"#9ca3af", letterSpacing:"0.05em" }}>トレーニングレベル</div>
      <Card style={{ marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:12, color:"#9ca3af", marginBottom:4 }}>現在のレベル</div>
            <div style={{ fontWeight:700, fontSize:15, color:"#111" }}>{level?.emoji} {level?.name}</div>
          </div>
          <button onClick={() => setShowLevelChange(v => !v)} style={{
            background:"#ede9fe", color:"#6366f1", border:"none",
            borderRadius:10, padding:"6px 12px", fontSize:12, fontWeight:700, cursor:"pointer",
          }}>変更する</button>
        </div>
        {showLevelChange && (
          <div style={{ marginTop:14 }}>
            <p style={{ fontSize:12, color:"#9ca3af", marginBottom:10 }}>✅ レベルはいつでも変更できます。変更すると提案内容が即座に更新されます。</p>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:10 }}>
              {LEVELS.map(l => (
                <div key={l.id} onClick={() => setPendingLevel(l)} style={{
                  border:`2px solid ${pendingLevel?.id===l.id ? "#6366f1" : "#f0f0f0"}`,
                  borderRadius:12, padding:"10px 14px", display:"flex", gap:10, alignItems:"center", cursor:"pointer",
                  background: pendingLevel?.id===l.id ? "#ede9fe" : "#fff",
                }}>
                  <span>{l.emoji}</span>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13 }}>{l.name}</div>
                    <div style={{ fontSize:11, color:"#9ca3af" }}>{l.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            {levelChanged ? (
              <div style={{ textAlign:"center", color:"#15803d", fontWeight:700, padding:"10px" }}>✅ レベルを更新しました！</div>
            ) : (
              <button onClick={handleLevelApply} disabled={!pendingLevel} style={{
                width:"100%", padding:"12px", borderRadius:12,
                background: pendingLevel ? "#6366f1" : "#e5e7eb",
                color: pendingLevel ? "#fff" : "#9ca3af",
                border:"none", fontWeight:700, fontSize:14,
                cursor: pendingLevel ? "pointer" : "not-allowed",
              }}>このレベルで更新する</button>
            )}
          </div>
        )}
      </Card>

      <div style={{ marginBottom:6, fontSize:12, fontWeight:700, color:"#9ca3af", letterSpacing:"0.05em" }}>その他</div>
      <Card>
        {["通知設定", "プライバシーポリシー", "利用規約", "ログアウト"].map((item, i, arr) => (
          <div key={item} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom: i<arr.length-1 ? "1px solid #f0f0f0" : "none" }}>
            <span style={{ fontSize:14, color: item==="ログアウト" ? "#ef4444" : "#374151", fontWeight: item==="ログアウト" ? 600 : 400 }}>{item}</span>
            {item !== "ログアウト" && <span style={{ color:"#9ca3af" }}>›</span>}
          </div>
        ))}
      </Card>
    </div>
  );
};

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [step, setStep]                   = useState("plan");
  const [selectedPlan, setSelectedPlan]   = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [userInfo, setUserInfo]           = useState(null);
  const [tab, setTab]                     = useState("main");

  if (step === "plan")
    return (
      <Shell>
        <PhoneShell>
          <OnboardingPlanSelect selected={selectedPlan} onSelect={setSelectedPlan} onNext={() => setStep("level")} />
        </PhoneShell>
      </Shell>
    );

  if (step === "level")
    return (
      <Shell>
        <PhoneShell>
          <OnboardingLevelSelect selected={selectedLevel} onSelect={setSelectedLevel} onNext={() => setStep("info")} />
        </PhoneShell>
      </Shell>
    );

  if (step === "info")
    return (
      <Shell>
        <PhoneShell>
          <OnboardingBasicInfo onDone={info => { setUserInfo(info); setStep("app"); }} />
        </PhoneShell>
      </Shell>
    );

  return (
    <Shell>
      <PhoneShell>
        {tab === "main"     && <MainScreen plan={selectedPlan} level={selectedLevel} />}
        {tab === "info"     && <InfoScreen userInfo={userInfo} level={selectedLevel} />}
        {tab === "settings" && <SettingsScreen plan={selectedPlan} level={selectedLevel} onChangeLevel={lv => setSelectedLevel(lv)} />}
        <BottomNav active={tab} onChange={setTab} />
      </PhoneShell>
    </Shell>
  );
}

const Shell = ({ children }) => (
  <div style={{
    minHeight:"100vh",
    background:"linear-gradient(135deg,#f8f7ff,#eef2ff 50%,#f0f9ff)",
    display:"flex", flexDirection:"column", alignItems:"center",
    padding:"32px 20px",
    fontFamily:"'Hiragino Sans','Yu Gothic',sans-serif",
  }}>
    <div style={{ textAlign:"center", marginBottom:24 }}>
      <div style={{ fontSize:24, fontWeight:900, color:"#111" }}>Fit Project AI</div>
      <div style={{ fontSize:12, color:"#9ca3af" }}>UIプレビュー</div>
    </div>
    {children}
  </div>
);
