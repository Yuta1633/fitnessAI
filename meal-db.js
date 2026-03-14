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
  }
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
