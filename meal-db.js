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
  { id:'g5s03', name:'豆腐＋納豆＋白米少なめ＋野菜', ingredients:['豆腐 150g', '納豆 1パック', '白米 100g', 'サラダ 1パック'], cal:370, p:24, f:10, c:44, goals:['5'], locations:['スーパー・惣菜'] },

  // 全目的 × デリバリー
  { id:'g1d01', name:'サラダチキンプレート', ingredients:['サラダチキン 150g', '玄米 120g', 'ブロッコリー 80g'], cal:380, p:38, f:6, c:44, goals:['1'], locations:['デリバリー'] },
  { id:'g1d02', name:'ヘルシー弁当（低カロリー）', ingredients:['鶏むね肉 120g', '白米 100g', '野菜炒め 100g'], cal:360, p:32, f:6, c:42, goals:['1'], locations:['デリバリー'] },
  { id:'g1d03', name:'海鮮丼（小盛）', ingredients:['マグロ 80g', '鮭 80g', '白米 100g'], cal:380, p:32, f:4, c:50, goals:['1'], locations:['デリバリー'] },

  { id:'g2d01', name:'チキンライスボウル（大盛）', ingredients:['鶏もも肉 200g', '白米 200g', '野菜 80g'], cal:680, p:44, f:16, c:80, goals:['2'], locations:['デリバリー'] },
  { id:'g2d02', name:'ガパオライス', ingredients:['鶏ひき肉 150g', '白米 150g', '卵 1個', 'バジル'], cal:620, p:38, f:18, c:72, goals:['2'], locations:['デリバリー'] },
  { id:'g2d03', name:'カオマンガイ', ingredients:['鶏むね肉 180g', '白米 180g', 'スープ'], cal:600, p:42, f:10, c:76, goals:['2'], locations:['デリバリー'] },

  { id:'g3d01', name:'パスタ（トマトソース）＋サラダ', ingredients:['パスタ 1人前', 'トマトソース', 'サラダ 1皿'], cal:520, p:18, f:8, c:88, goals:['3'], locations:['デリバリー'] },
  { id:'g3d02', name:'チャーハン＋スープ', ingredients:['チャーハン 1人前', '卵スープ'], cal:560, p:18, f:16, c:80, goals:['3'], locations:['デリバリー'] },
  { id:'g3d03', name:'うどん（温）＋天ぷら', ingredients:['うどん 1玉', '海老天 2本', '出汁'], cal:500, p:18, f:12, c:76, goals:['3'], locations:['デリバリー'] },

  { id:'g4d01', name:'おかゆセット', ingredients:['おかゆ 1人前', '梅干し', '漬物'], cal:240, p:6, f:2, c:46, goals:['4'], locations:['デリバリー'] },
  { id:'g4d02', name:'湯豆腐セット＋白米', ingredients:['豆腐 200g', '白米 120g', '出汁スープ'], cal:350, p:20, f:8, c:48, goals:['4'], locations:['デリバリー'] },
  { id:'g4d03', name:'和風ハンバーグ定食', ingredients:['豆腐ハンバーグ 150g', '白米 120g', '味噌汁 1杯'], cal:420, p:24, f:12, c:52, goals:['4'], locations:['デリバリー'] },

  { id:'g5d01', name:'グリルチキンサラダボウル', ingredients:['鶏むね肉 150g', 'レタス 100g', 'トマト 50g', '玄米 80g'], cal:340, p:36, f:6, c:34, goals:['5'], locations:['デリバリー'] },
  { id:'g5d02', name:'タコライス（ライス少なめ）', ingredients:['牛ひき肉 120g', '白米 100g', 'レタス', 'トマト'], cal:420, p:28, f:14, c:44, goals:['5'], locations:['デリバリー'] },
  { id:'g5d03', name:'鯖の塩焼き定食（ライス少なめ）', ingredients:['サバ 1切れ', '白米 100g', '味噌汁 1杯', '小鉢'], cal:400, p:28, f:14, c:40, goals:['5'], locations:['デリバリー'] },

  // 全目的 × お弁当を作る
  { id:'g1b01', name:'鶏むね肉弁当', ingredients:['鶏胸肉 130g（焼く）', '白米 120g', 'ブロッコリー 60g', 'ミニトマト 3個'], cal:380, p:36, f:5, c:46, goals:['1'], locations:['お弁当を作る'] },
  { id:'g1b02', name:'サバ缶弁当', ingredients:['サバ缶 1缶', '白米 120g', 'ほうれん草 80g（茹でる）'], cal:390, p:30, f:14, c:38, goals:['1'], locations:['お弁当を作る'] },
  { id:'g1b03', name:'卵焼き＋鮭弁当', ingredients:['卵 2個（卵焼き）', '鮭 1切れ（焼く）', '白米 100g', 'きんぴら 50g'], cal:400, p:28, f:14, c:40, goals:['1'], locations:['お弁当を作る'] },

  { id:'g2b01', name:'ガッツリ肉弁当', ingredients:['鶏もも肉 200g（照り焼き）', '白米 180g', 'ブロッコリー 60g', '卵 1個'], cal:660, p:44, f:18, c:72, goals:['2'], locations:['お弁当を作る'] },
  { id:'g2b02', name:'牛肉炒め弁当', ingredients:['牛赤身 150g（炒め）', '白米 180g', 'もやし 80g', '卵 1個'], cal:620, p:40, f:16, c:70, goals:['2'], locations:['お弁当を作る'] },
  { id:'g2b03', name:'ツナ卵弁当', ingredients:['ツナ缶 1缶', '卵 2個（炒り卵）', '白米 180g', 'ほうれん草 60g'], cal:560, p:38, f:16, c:62, goals:['2'], locations:['お弁当を作る'] },

  { id:'g3b01', name:'エネルギー補給弁当', ingredients:['鶏胸肉 120g', '白米 160g', 'さつまいも 80g（蒸す）', 'ゆで卵 1個'], cal:540, p:34, f:8, c:78, goals:['3'], locations:['お弁当を作る'] },
  { id:'g3b02', name:'もち麦＋鮭弁当', ingredients:['もち麦ご飯 160g', '鮭 1切れ（焼く）', 'ほうれん草 60g', '卵焼き 1個'], cal:500, p:28, f:10, c:68, goals:['3'], locations:['お弁当を作る'] },
  { id:'g3b03', name:'そぼろ弁当', ingredients:['鶏ひき肉 120g（そぼろ）', '卵 2個（炒り卵）', '白米 160g', 'いんげん 40g'], cal:520, p:32, f:12, c:62, goals:['3'], locations:['お弁当を作る'] },

  { id:'g4b01', name:'消化に優しい弁当', ingredients:['鶏ささみ 120g（蒸す）', '白米 120g', 'かぼちゃ 60g（蒸す）', '梅干し 1個'], cal:360, p:28, f:4, c:52, goals:['4'], locations:['お弁当を作る'] },
  { id:'g4b02', name:'豆腐＋根菜弁当', ingredients:['豆腐 150g（焼く）', '白米 120g', 'れんこん 60g', 'にんじん 40g'], cal:360, p:18, f:8, c:54, goals:['4'], locations:['お弁当を作る'] },
  { id:'g4b03', name:'鮭おにぎり弁当', ingredients:['鮭 1切れ（焼く）', 'おにぎり 2個（鮭・梅）', 'ほうれん草 60g'], cal:420, p:26, f:8, c:58, goals:['4'], locations:['お弁当を作る'] },

  { id:'g5b01', name:'低カロリー引き締め弁当', ingredients:['鶏ささみ 150g（蒸す）', '白米 100g', 'ブロッコリー 80g', 'ミニトマト 5個'], cal:320, p:34, f:4, c:36, goals:['5'], locations:['お弁当を作る'] },
  { id:'g5b02', name:'和風ダイエット弁当', ingredients:['マグロ赤身 100g', '白米 100g', 'わかめ 20g', '卵焼き 1個'], cal:360, p:30, f:8, c:40, goals:['5'], locations:['お弁当を作る'] },
  { id:'g5b03', name:'豆腐ハンバーグ弁当', ingredients:['木綿豆腐 150g（ハンバーグ）', '白米 100g', 'ほうれん草 80g', 'トマト 50g'], cal:340, p:22, f:10, c:40, goals:['5'], locations:['お弁当を作る'] },

  // 全目的 × 揚げ物を食べたい
  { id:'g1f01', name:'唐揚げ（少なめ）＋サラダ＋白米少なめ', ingredients:['唐揚げ 3個', 'サラダ 1皿', '白米 100g'], cal:420, p:24, f:16, c:44, goals:['1'], locations:['揚げ物を食べたい'] },
  { id:'g1f02', name:'アジフライ定食（ライス少なめ）', ingredients:['アジフライ 2枚', '白米 100g', '味噌汁 1杯', 'キャベツ千切り'], cal:440, p:22, f:16, c:48, goals:['1'], locations:['揚げ物を食べたい'] },
  { id:'g1f03', name:'海老天そば', ingredients:['そば 1食', '海老天 2本', '出汁'], cal:460, p:20, f:12, c:62, goals:['1'], locations:['揚げ物を食べたい'] },

  { id:'g2f01', name:'唐揚げ定食（ライス大盛）', ingredients:['唐揚げ 5個', '白米 200g', '味噌汁 1杯', 'キャベツ'], cal:720, p:38, f:24, c:84, goals:['2'], locations:['揚げ物を食べたい'] },
  { id:'g2f02', name:'カツ丼', ingredients:['豚カツ 150g', '卵 2個', '白米 180g', '出汁'], cal:750, p:40, f:24, c:88, goals:['2'], locations:['揚げ物を食べたい'] },
  { id:'g2f03', name:'エビフライ定食（ライス大盛）', ingredients:['エビフライ 4本', '白米 200g', '味噌汁 1杯'], cal:680, p:36, f:20, c:86, goals:['2'], locations:['揚げ物を食べたい'] },

  { id:'g3f01', name:'天ぷらうどん', ingredients:['うどん 1玉', '天ぷら盛り合わせ', '出汁'], cal:560, p:18, f:14, c:84, goals:['3'], locations:['揚げ物を食べたい'] },
  { id:'g3f02', name:'チキンカツ定食', ingredients:['チキンカツ 150g', '白米 150g', '味噌汁 1杯', 'キャベツ'], cal:620, p:32, f:20, c:76, goals:['3'], locations:['揚げ物を食べたい'] },
  { id:'g3f03', name:'コロッケ2個＋白米＋味噌汁', ingredients:['コロッケ 2個', '白米 150g', '味噌汁 1杯'], cal:540, p:16, f:18, c:76, goals:['3'], locations:['揚げ物を食べたい'] },

  { id:'g4f01', name:'豆腐カツ＋白米＋味噌汁', ingredients:['豆腐カツ 150g', '白米 120g', '味噌汁 1杯'], cal:440, p:20, f:14, c:54, goals:['4'], locations:['揚げ物を食べたい'] },
  { id:'g4f02', name:'白身魚フライ定食', ingredients:['白身魚フライ 2枚', '白米 120g', '味噌汁 1杯', 'キャベツ'], cal:460, p:24, f:14, c:54, goals:['4'], locations:['揚げ物を食べたい'] },
  { id:'g4f03', name:'ちくわ磯部揚げ＋うどん', ingredients:['ちくわ磯部揚げ 3本', 'うどん 1玉', '出汁'], cal:480, p:18, f:12, c:70, goals:['4'], locations:['揚げ物を食べたい'] },

  { id:'g5f01', name:'蒸し鶏＋少量の唐揚げ＋サラダ', ingredients:['蒸し鶏 100g', '唐揚げ 2個', 'サラダ 1皿', '白米 80g'], cal:400, p:30, f:14, c:36, goals:['5'], locations:['揚げ物を食べたい'] },
  { id:'g5f02', name:'アジフライ1枚＋白米少なめ＋サラダ', ingredients:['アジフライ 1枚', '白米 80g', 'サラダ 1皿', '味噌汁 1杯'], cal:360, p:20, f:12, c:42, goals:['5'], locations:['揚げ物を食べたい'] },
  { id:'g5f03', name:'海老天2本＋そば', ingredients:['海老天 2本', 'そば 1食', '出汁'], cal:400, p:18, f:10, c:56, goals:['5'], locations:['揚げ物を食べたい'] },

  // 全目的 × お酒を飲みたい
  { id:'g1a01', name:'枝豆＋鶏ささみ刺し＋豆腐', ingredients:['枝豆 100g', '鶏ささみ 100g', '豆腐 150g'], cal:320, p:36, f:8, c:12, goals:['1'], locations:['お酒を飲みたい'] },
  { id:'g1a02', name:'刺し身盛り合わせ＋わかめサラダ', ingredients:['刺し身 150g', 'わかめサラダ 1皿'], cal:280, p:30, f:6, c:10, goals:['1'], locations:['お酒を飲みたい'] },
  { id:'g1a03', name:'焼き鳥（塩）5本＋キャベツ', ingredients:['焼き鳥 塩 5本', 'キャベツ 100g'], cal:300, p:28, f:8, c:14, goals:['1'], locations:['お酒を飲みたい'] },

  { id:'g2a01', name:'焼き鳥（塩）7本＋枝豆＋白米', ingredients:['焼き鳥 塩 7本', '枝豆 100g', '白米 150g'], cal:560, p:42, f:12, c:58, goals:['2'], locations:['お酒を飲みたい'] },
  { id:'g2a02', name:'牛タン＋白米＋スープ', ingredients:['牛タン 150g', '白米 150g', 'テールスープ'], cal:580, p:36, f:22, c:56, goals:['2'], locations:['お酒を飲みたい'] },
  { id:'g2a03', name:'馬刺し＋枝豆＋おにぎり2個', ingredients:['馬刺し 100g', '枝豆 100g', 'おにぎり 2個'], cal:520, p:38, f:8, c:64, goals:['2'], locations:['お酒を飲みたい'] },

  { id:'g3a01', name:'焼き鳥盛り合わせ＋おにぎり', ingredients:['焼き鳥 5本', 'おにぎり 1個', '枝豆 80g'], cal:440, p:28, f:12, c:50, goals:['3'], locations:['お酒を飲みたい'] },
  { id:'g3a02', name:'刺し身＋冷奴＋おにぎり', ingredients:['刺し身 120g', '豆腐 150g', 'おにぎり 1個'], cal:400, p:30, f:8, c:44, goals:['3'], locations:['お酒を飲みたい'] },
  { id:'g3a03', name:'蒸し鶏＋枝豆＋白米', ingredients:['蒸し鶏 120g', '枝豆 100g', '白米 120g'], cal:420, p:34, f:8, c:46, goals:['3'], locations:['お酒を飲みたい'] },

  { id:'g4a01', name:'湯豆腐＋焼き鳥（塩）3本', ingredients:['豆腐 200g', '焼き鳥 塩 3本', '出汁'], cal:280, p:24, f:8, c:14, goals:['4'], locations:['お酒を飲みたい'] },
  { id:'g4a02', name:'刺し身（白身中心）＋わかめスープ', ingredients:['白身魚 150g', 'わかめスープ 1杯'], cal:240, p:28, f:4, c:8, goals:['4'], locations:['お酒を飲みたい'] },
  { id:'g4a03', name:'冷奴＋納豆＋枝豆', ingredients:['豆腐 150g', '納豆 1パック', '枝豆 80g'], cal:260, p:22, f:10, c:14, goals:['4'], locations:['お酒を飲みたい'] },

  { id:'g5a01', name:'サラダチキン＋枝豆＋刺し身', ingredients:['サラダチキン 100g', '枝豆 80g', '刺し身 80g'], cal:280, p:34, f:6, c:10, goals:['5'], locations:['お酒を飲みたい'] },
  { id:'g5a02', name:'焼き鳥（塩）5本＋サラダ', ingredients:['焼き鳥 塩 5本', 'サラダ 1皿'], cal:280, p:26, f:8, c:14, goals:['5'], locations:['お酒を飲みたい'] },
  { id:'g5a03', name:'刺し身盛り＋冷奴＋わかめ', ingredients:['刺し身 150g', '豆腐 100g', 'わかめ 20g'], cal:260, p:30, f:6, c:10, goals:['5'], locations:['お酒を飲みたい'] },

  // 全目的 × 間食したい
  { id:'g1n01', name:'ゆで卵2個＋チーズ1枚', ingredients:['ゆで卵 2個', 'チーズ 1枚'], cal:230, p:18, f:14, c:2, goals:['1'], locations:['間食したい'] },
  { id:'g1n02', name:'ギリシャヨーグルト＋ナッツ少量', ingredients:['ギリシャヨーグルト 100g', 'ミックスナッツ 20g'], cal:200, p:12, f:10, c:12, goals:['1'], locations:['間食したい'] },
  { id:'g1n03', name:'サラダチキンバー＋野菜スティック', ingredients:['サラダチキン 80g', '野菜スティック 100g'], cal:150, p:20, f:2, c:8, goals:['1'], locations:['間食したい'] },

  { id:'g2n01', name:'プロテインバー＋バナナ', ingredients:['プロテインバー 1本', 'バナナ 1本'], cal:340, p:22, f:8, c:48, goals:['2'], locations:['間食したい'] },
  { id:'g2n02', name:'おにぎり2個＋ゆで卵', ingredients:['おにぎり 2個', 'ゆで卵 1個'], cal:440, p:20, f:6, c:72, goals:['2'], locations:['間食したい'] },
  { id:'g2n03', name:'チーズ2枚＋ナッツ＋バナナ', ingredients:['チーズ 2枚', 'ミックスナッツ 30g', 'バナナ 1本'], cal:360, p:16, f:18, c:36, goals:['2'], locations:['間食したい'] },

  { id:'g3n01', name:'バナナ＋おにぎり1個', ingredients:['バナナ 1本', 'おにぎり 1個'], cal:280, p:6, f:2, c:60, goals:['3'], locations:['間食したい'] },
  { id:'g3n02', name:'カステラ1切れ＋牛乳', ingredients:['カステラ 1切れ', '牛乳 200ml'], cal:300, p:10, f:8, c:46, goals:['3'], locations:['間食したい'] },
  { id:'g3n03', name:'ドライフルーツ＋ナッツ', ingredients:['ドライフルーツ 30g', 'ミックスナッツ 20g'], cal:220, p:4, f:10, c:28, goals:['3'], locations:['間食したい'] },

  { id:'g4n01', name:'ヨーグルト＋はちみつ＋バナナ', ingredients:['ヨーグルト 100g', 'はちみつ 10g', 'バナナ 半本'], cal:180, p:4, f:2, c:36, goals:['4'], locations:['間食したい'] },
  { id:'g4n02', name:'甘酒＋ナッツ少量', ingredients:['甘酒 150ml', 'ミックスナッツ 15g'], cal:180, p:4, f:6, c:26, goals:['4'], locations:['間食したい'] },
  { id:'g4n03', name:'豆乳＋バナナ', ingredients:['豆乳 200ml', 'バナナ 1本'], cal:220, p:10, f:4, c:36, goals:['4'], locations:['間食したい'] },

  { id:'g5n01', name:'ゆで卵1個＋サラダチキン', ingredients:['ゆで卵 1個', 'サラダチキン 80g'], cal:180, p:24, f:6, c:2, goals:['5'], locations:['間食したい'] },
  { id:'g5n02', name:'ギリシャヨーグルト＋ベリー', ingredients:['ギリシャヨーグルト 100g', 'ブルーベリー 50g'], cal:140, p:10, f:0, c:18, goals:['5'], locations:['間食したい'] },
  { id:'g5n03', name:'チーズ1枚＋ナッツ＋野菜スティック', ingredients:['チーズ 1枚', 'ミックスナッツ 20g', '野菜スティック 80g'], cal:180, p:8, f:12, c:8, goals:['5'], locations:['間食したい'] }
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
