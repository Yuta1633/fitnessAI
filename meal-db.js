// ============================================================
// MEAL_DB - 料理データベース
// PFC目標に近い3品をJSが自動選択する
// ============================================================

const MEAL_DB = [
  // ① 脂肪を落としたい × 家
  {
    id: 'g1h01',
    name: '鶏胸肉の蒸し定食',
    ingredients: ['鶏胸肉 150g（蒸す）', '白米 120g', 'ブロッコリー 80g（茹でる）'],
    cal: 432, p: 38, f: 5, c: 43,
    goals: ['1'],
    locations: ['家で食べる']
  },
  {
    id: 'g1h02',
    name: '豆腐とわかめの味噌汁定食',
    ingredients: ['白米 120g', '豆腐 150g', 'わかめ 10g', '卵 1個（ゆで）'],
    cal: 380, p: 22, f: 8, c: 52,
    goals: ['1'],
    locations: ['家で食べる']
  },
  {
    id: 'g1h03',
    name: 'サラダチキン丼',
    ingredients: ['サラダチキン 120g', '白米 100g', 'レタス 50g', 'トマト 50g'],
    cal: 360, p: 32, f: 4, c: 48,
    goals: ['1'],
    locations: ['家で食べる']
  },

  // ① 脂肪を落としたい × コンビニ
  {
    id: 'g1c01',
    name: 'サラダチキン＋おにぎり1個',
    ingredients: ['サラダチキン 1個', 'おにぎり 1個（鮭or昆布）'],
    cal: 295, p: 28, f: 2, c: 40,
    goals: ['1'], locations: ['コンビニ']
  },
  {
    id: 'g1c02',
    name: 'ゆで卵2個＋野菜サラダ＋おにぎり1個',
    ingredients: ['ゆで卵 2個', 'サラダ 1袋', 'おにぎり 1個'],
    cal: 380, p: 22, f: 10, c: 42,
    goals: ['1'], locations: ['コンビニ']
  },
  {
    id: 'g1c03',
    name: 'ツナサラダ＋豆腐バー',
    ingredients: ['ツナサンドイッチ 1個', 'ゆで卵 1個'],
    cal: 345, p: 24, f: 13, c: 30,
    goals: ['1'], locations: ['コンビニ']
  },

  // ① 脂肪を落としたい × 外食にしたい
  {
    id: 'g1r01',
    name: 'ざるそば＋ゆで卵',
    ingredients: ['ざるそば 1食', 'ゆで卵 1個'],
    cal: 355, p: 17, f: 8, c: 51,
    goals: ['1'], locations: ['外食にしたい']
  },
  {
    id: 'g1r02',
    name: '親子丼（小盛）＋サラダ',
    ingredients: ['親子丼 小盛', 'サラダ 1皿'],
    cal: 420, p: 28, f: 12, c: 52,
    goals: ['1'], locations: ['外食にしたい']
  },
  {
    id: 'g1r03',
    name: '定食（焼き魚＋白米＋味噌汁）',
    ingredients: ['鮭 1切れ', '白米 120g', '味噌汁 1杯'],
    cal: 430, p: 28, f: 8, c: 58,
    goals: ['1'], locations: ['外食にしたい']
  },

  // ① 脂肪を落としたい × スーパー・惣菜
  {
    id: 'g1s01',
    name: '焼き鳥（塩）＋おにぎり1個',
    ingredients: ['焼き鳥 塩 3本', 'おにぎり 1個'],
    cal: 360, p: 26, f: 8, c: 42,
    goals: ['1'], locations: ['スーパー・惣菜']
  },
  {
    id: 'g1s02',
    name: '惣菜サラダ＋サバの塩焼き＋白米',
    ingredients: ['サバ 1切れ', '白米 100g', 'サラダ 1パック'],
    cal: 410, p: 28, f: 14, c: 42,
    goals: ['1'], locations: ['スーパー・惣菜']
  },
  {
    id: 'g1s03',
    name: '冷奴＋納豆＋白米',
    ingredients: ['豆腐 150g', '納豆 1パック', '白米 120g'],
    cal: 450, p: 25, f: 11, c: 58,
    goals: ['1'], locations: ['スーパー・惣菜']
  },

  // ② 筋肉をつけたい × 家で食べる
  {
    id: 'g2h01',
    name: '鶏もも肉の照り焼き定食',
    ingredients: ['鶏もも肉 200g', '白米 150g', 'ブロッコリー 80g'],
    cal: 620, p: 42, f: 16, c: 68,
    goals: ['2'], locations: ['家で食べる']
  },
  {
    id: 'g2h02',
    name: '卵かけご飯＋納豆＋豚汁',
    ingredients: ['卵 2個', '白米 150g', '納豆 1パック', '豚汁 1杯'],
    cal: 590, p: 35, f: 18, c: 68,
    goals: ['2'], locations: ['家で食べる']
  },
  {
    id: 'g2h03',
    name: 'サバの味噌煮定食',
    ingredients: ['サバ 1切れ', '白米 150g', '味噌汁 1杯', 'ほうれん草 80g'],
    cal: 570, p: 36, f: 18, c: 62,
    goals: ['2'], locations: ['家で食べる']
  },

  // ② 筋肉をつけたい × コンビニ
  {
    id: 'g2c01',
    name: 'サラダチキン＋おにぎり2個＋ゆで卵',
    ingredients: ['サラダチキン 1個', 'おにぎり 2個', 'ゆで卵 1個'],
    cal: 560, p: 42, f: 8, c: 72,
    goals: ['2'], locations: ['コンビニ']
  },
  {
    id: 'g2c02',
    name: '幕の内弁当＋ゆで卵2個',
    ingredients: ['幕の内弁当 1個', 'ゆで卵 2個'],
    cal: 770, p: 34, f: 30, c: 90,
    goals: ['2'], locations: ['コンビニ']
  },
  {
    id: 'g2c03',
    name: 'ツナサンド＋牛乳＋バナナ',
    ingredients: ['サンドイッチツナ 1個', '牛乳 200ml', 'バナナ 1本'],
    cal: 540, p: 20, f: 16, c: 78,
    goals: ['2'], locations: ['コンビニ']
  },

  // ③ 体力を上げたい × 家で食べる
  {
    id: 'g3h01',
    name: 'もち麦ご飯＋鶏むね肉炒め＋味噌汁',
    ingredients: ['もち麦ご飯 150g', '鶏胸肉 150g', '味噌汁 1杯'],
    cal: 520, p: 38, f: 8, c: 68,
    goals: ['3'], locations: ['家で食べる']
  },
  {
    id: 'g3h02',
    name: 'うどん＋とろろ＋卵',
    ingredients: ['うどん 1玉', '卵 1個', 'わかめ 10g'],
    cal: 380, p: 18, f: 8, c: 55,
    goals: ['3'], locations: ['家で食べる']
  },
  {
    id: 'g3h03',
    name: '玄米おにぎり2個＋豚汁＋卵焼き',
    ingredients: ['玄米 150g', '豚汁 1杯', '卵 2個'],
    cal: 530, p: 26, f: 14, c: 70,
    goals: ['3'], locations: ['家で食べる']
  },

  // ④ 不調改善 × 家で食べる
  {
    id: 'g4h01',
    name: 'おかゆ＋梅干し＋ゆで卵',
    ingredients: ['白米 100g', '卵 1個', 'わかめスープ 1杯'],
    cal: 310, p: 14, f: 7, c: 46,
    goals: ['4'], locations: ['家で食べる']
  },
  {
    id: 'g4h02',
    name: '豆腐と野菜の炒め物＋白米',
    ingredients: ['豆腐 150g', 'もやし 100g', '白米 120g', '卵 1個'],
    cal: 430, p: 26, f: 12, c: 52,
    goals: ['4'], locations: ['家で食べる']
  },
  {
    id: 'g4h03',
    name: '鮭の塩焼き＋白米＋具だくさん味噌汁',
    ingredients: ['鮭 1切れ', '白米 120g', '味噌汁豆腐わかめ 1杯'],
    cal: 420, p: 30, f: 9, c: 52,
    goals: ['4'], locations: ['家で食べる']
  },

  // ⑤ 体型を整えたい × 家で食べる
  {
    id: 'g5h01',
    name: '鶏ささみ＋野菜炒め＋白米少なめ',
    ingredients: ['鶏ささみ 150g', 'ブロッコリー 100g', 'もやし 100g', '白米 100g'],
    cal: 390, p: 38, f: 5, c: 46,
    goals: ['5'], locations: ['家で食べる']
  },
  {
    id: 'g5h02',
    name: 'マグロ丼（小盛）＋わかめ味噌汁',
    ingredients: ['マグロ赤身 100g', '白米 100g', 'わかめスープ 1杯'],
    cal: 360, p: 30, f: 2, c: 50,
    goals: ['5'], locations: ['家で食べる']
  },
  {
    id: 'g5h03',
    name: '豆腐ステーキ＋玄米＋ほうれん草',
    ingredients: ['木綿豆腐 150g', '玄米 120g', 'ほうれん草 80g', '卵 1個'],
    cal: 420, p: 28, f: 14, c: 48,
    goals: ['5'], locations: ['家で食べる']
  },

  // ② 筋肉をつけたい × 外食にしたい
  { id:'g2r01', name:'牛丼大盛＋卵', ingredients:['牛丼 大盛', '卵 1個'], cal:720, p:38, f:22, c:95, goals:['2'], locations:['外食にしたい'] },
  { id:'g2r02', name:'親子丼＋みそ汁', ingredients:['親子丼 並盛', '味噌汁 1杯'], cal:680, p:35, f:18, c:88, goals:['2'], locations:['外食にしたい'] },
  { id:'g2r03', name:'焼肉定食（ライス大盛）', ingredients:['焼肉 150g', '白米 200g', '味噌汁 1杯'], cal:780, p:45, f:22, c:95, goals:['2'], locations:['外食にしたい'] },

  // ② 筋肉をつけたい × スーパー・惣菜
  { id:'g2s01', name:'唐揚げ＋白米＋卵', ingredients:['唐揚げ 5個', '白米 150g', '卵 1個'], cal:720, p:40, f:28, c:72, goals:['2'], locations:['スーパー・惣菜'] },
  { id:'g2s02', name:'サバ塩焼き＋白米大盛＋豆腐', ingredients:['サバ 1切れ', '白米 200g', '豆腐 150g'], cal:680, p:44, f:20, c:78, goals:['2'], locations:['スーパー・惣菜'] },
  { id:'g2s03', name:'牛肉コロッケ2個＋白米＋納豆', ingredients:['コロッケ 2個', '白米 150g', '納豆 1パック'], cal:650, p:28, f:22, c:82, goals:['2'], locations:['スーパー・惣菜'] },

  // ② 筋肉をつけたい × コンビニ（追加）
  { id:'g2c04', name:'焼き鳥3本＋おにぎり2個＋牛乳', ingredients:['焼き鳥 3本', 'おにぎり 2個', '牛乳 200ml'], cal:620, p:38, f:14, c:78, goals:['2'], locations:['コンビニ'] },

  // ③ 体力を上げたい × コンビニ
  { id:'g3c01', name:'おにぎり2個＋ゆで卵＋野菜ジュース', ingredients:['おにぎり 2個', 'ゆで卵 1個', '野菜ジュース 200ml'], cal:420, p:18, f:6, c:68, goals:['3'], locations:['コンビニ'] },
  { id:'g3c02', name:'サラダチキン＋おにぎり＋バナナ', ingredients:['サラダチキン 1個', 'おにぎり 1個', 'バナナ 1本'], cal:440, p:32, f:4, c:62, goals:['3'], locations:['コンビニ'] },
  { id:'g3c03', name:'ツナサンド＋豆乳', ingredients:['サンドイッチツナ 1個', '豆乳 200ml'], cal:370, p:20, f:14, c:42, goals:['3'], locations:['コンビニ'] },

  // ③ 体力を上げたい × 外食にしたい
  { id:'g3r01', name:'かけうどん＋ちくわ天', ingredients:['うどん 1玉', 'ちくわ天 1本', '出汁スープ'], cal:420, p:16, f:8, c:68, goals:['3'], locations:['外食にしたい'] },
  { id:'g3r02', name:'蕎麦定食（天ぷら抜き）', ingredients:['そば 1食', '山かけ', '出汁'], cal:380, p:18, f:4, c:65, goals:['3'], locations:['外食にしたい'] },
  { id:'g3r03', name:'スパゲッティナポリタン＋サラダ', ingredients:['パスタ 1人前', 'トマトソース', 'サラダ 1皿'], cal:520, p:18, f:10, c:88, goals:['3'], locations:['外食にしたい'] },

  // ③ 体力を上げたい × スーパー・惣菜
  { id:'g3s01', name:'おにぎり2個＋豚汁＋バナナ', ingredients:['おにぎり 2個', '豚汁 1杯', 'バナナ 1本'], cal:520, p:18, f:8, c:88, goals:['3'], locations:['スーパー・惣菜'] },
  { id:'g3s02', name:'赤飯おにぎり＋鮭の塩焼き', ingredients:['赤飯おにぎり 2個', '鮭 1切れ'], cal:490, p:26, f:8, c:72, goals:['3'], locations:['スーパー・惣菜'] },
  { id:'g3s03', name:'五目ご飯＋卵焼き＋味噌汁', ingredients:['五目ご飯 150g', '卵焼き 1個', '味噌汁 1杯'], cal:460, p:18, f:10, c:68, goals:['3'], locations:['スーパー・惣菜'] },

  // ④ 不調改善 × コンビニ
  { id:'g4c01', name: 'おかゆ＋ゆで卵', ingredients:['おかゆ 1個', 'ゆで卵 1個'], cal:240, p:12, f:6, c:32, goals:['4'], locations:['コンビニ'] },
  { id:'g4c02', name:'豆腐バー＋野菜ジュース＋バナナ', ingredients:['豆腐バー 1個', '野菜ジュース 200ml', 'バナナ 1本'], cal:280, p:14, f:4, c:46, goals:['4'], locations:['コンビニ'] },
  { id:'g4c03', name:'温かいそば（かけそば）＋ゆで卵', ingredients:['かけそば 1食', 'ゆで卵 1個'], cal:340, p:18, f:6, c:52, goals:['4'], locations:['コンビニ'] },

  // ④ 不調改善 × 外食にしたい
  { id:'g4r01', name:'湯豆腐定食', ingredients:['豆腐 200g', '白米 120g', '味噌汁 1杯', '小鉢'], cal:380, p:22, f:8, c:52, goals:['4'], locations:['外食にしたい'] },
  { id:'g4r02', name:'茶碗蒸し＋白米＋味噌汁', ingredients:['茶碗蒸し 1個', '白米 120g', '味噌汁 1杯'], cal:360, p:16, f:8, c:52, goals:['4'], locations:['外食にしたい'] },
  { id:'g4r03', name:'鮭の塩焼き定食', ingredients:['鮭 1切れ', '白米 120g', '味噌汁 1杯', '小鉢'], cal:420, p:28, f:9, c:52, goals:['4'], locations:['外食にしたい'] },

  // ④ 不調改善 × スーパー・惣菜
  { id:'g4s01', name:'雑炊＋梅干し＋豆腐', ingredients:['雑炊 1パック', '梅干し 1個', '豆腐 100g'], cal:280, p:12, f:4, c:46, goals:['4'], locations:['スーパー・惣菜'] },
  { id:'g4s02', name:'蒸し鶏＋白米＋わかめスープ', ingredients:['蒸し鶏 100g', '白米 120g', 'わかめスープ 1杯'], cal:380, p:28, f:6, c:52, goals:['4'], locations:['スーパー・惣菜'] },
  { id:'g4s03', name:'冷奴＋納豆＋白米＋味噌汁', ingredients:['豆腐 150g', '納豆 1パック', '白米 100g', '味噌汁 1杯'], cal:390, p:22, f:10, c:48, goals:['4'], locations:['スーパー・惣菜'] },

  // ⑤ 体型を整えたい × コンビニ
  { id:'g5c01', name:'サラダチキン＋サラダ＋ゆで卵', ingredients:['サラダチキン 1個', 'サラダ 1袋', 'ゆで卵 1個'], cal:280, p:36, f:8, c:8, goals:['5'], locations:['コンビニ'] },
  { id:'g5c02', name:'ツナサラダ＋おにぎり1個', ingredients:['ツナサンドイッチ 1個', 'おにぎり 1個（梅）'], cal:340, p:20, f:10, c:42, goals:['5'], locations:['コンビニ'] },
  { id:'g5c03', name:'ゆで卵2個＋サラダ＋豆乳', ingredients:['ゆで卵 2個', 'サラダ 1袋', '豆乳 200ml'], cal:300, p:24, f:14, c:14, goals:['5'], locations:['コンビニ'] },

  // ⑤ 体型を整えたい × 外食にしたい
  { id:'g5r01', name:'ざるそば＋山かけ', ingredients:['ざるそば 1食', '山芋 50g'], cal:320, p:14, f:2, c:60, goals:['5'], locations:['外食にしたい'] },
  { id:'g5r02', name:'鶏の塩焼き定食（ライス少なめ）', ingredients:['鶏もも肉 150g', '白米 100g', '味噌汁 1杯', 'サラダ'], cal:420, p:34, f:12, c:42, goals:['5'], locations:['外食にしたい'] },
  { id:'g5r03', name:'刺し身定食（ライス少なめ）', ingredients:['刺し身盛り合わせ', '白米 100g', '味噌汁 1杯'], cal:380, p:30, f:6, c:46, goals:['5'], locations:['外食にしたい'] },

  // ⑤ 体型を整えたい × スーパー・惣菜
  { id:'g5s01', name:'蒸し鶏サラダ＋白米少なめ', ingredients:['蒸し鶏 120g', 'サラダ 1パック', '白米 100g'], cal:340, p:32, f:6, c:38, goals:['5'], locations:['スーパー・惣菜'] },
  { id:'g5s02', name:'マグロ刺し＋わかめ＋白米', ingredients:['マグロ赤身 100g', 'わかめ 20g', '白米 100g'], cal:330, p:30, f:2, c:46, goals:['5'], locations:['スーパー・惣菜'] },
  { id:'g5s03', name:'豆腐＋納豆＋白米少なめ＋野菜', ingredients:['豆腐 150g', '納豆 1パック', '白米 100g', 'サラダ 1パック'], cal:370, p:24, f:10, c:44, goals:['5'], locations:['スーパー・惣菜'] }
];

// ============================================================
// PFCスコアリングで目標に近い3品を選ぶ関数
// ============================================================

function selectMeals(targetCal, targetP, targetF, targetC, goal, location) {
  // 目的と場所で絞り込み
  const filtered = MEAL_DB.filter(meal =>
    meal.goals.includes(goal) &&
    meal.locations.includes(location)
  );

  if (filtered.length === 0) return [];

  // PFC比率のスコアリング（差が少ないほどスコアが高い）
  const targetPPct = (targetP * 4) / targetCal * 100;
  const targetFPct = (targetF * 9) / targetCal * 100;
  const targetCPct = (targetC * 4) / targetCal * 100;

  const scored = filtered.map(meal => {
    const mealPPct = (meal.p * 4) / meal.cal * 100;
    const mealFPct = (meal.f * 9) / meal.cal * 100;
    const mealCPct = (meal.c * 4) / meal.cal * 100;

    const score =
      Math.abs(mealPPct - targetPPct) +
      Math.abs(mealFPct - targetFPct) +
      Math.abs(mealCPct - targetCPct);

    return { meal, score };
  });

  // スコアが低い順（目標に近い順）に3品選ぶ
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, 3).map(s => s.meal);
}
