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
