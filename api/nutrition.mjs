// ============================================================
// 外部食品成分データベースAPI（API Ninjas Nutrition）
// フォールバック: ローカルDB（nutrition-db.js相当）
// ============================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://fitprojectai.vercel.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ============================================================
// 日本語→英語 食材名マッピング
// ============================================================
const FOOD_NAME_EN = {
  // 肉類
  '鶏胸肉': 'chicken breast skinless',
  '鶏胸肉皮なし': 'chicken breast skinless',
  '鶏胸肉皮あり': 'chicken breast with skin',
  '鶏もも肉': 'chicken thigh',
  '鶏もも肉皮なし': 'chicken thigh skinless',
  '鶏もも肉皮あり': 'chicken thigh with skin',
  '鶏ささみ': 'chicken tenderloin',
  '鶏ひき肉': 'ground chicken',
  '豚ロース': 'pork loin',
  '豚もも': 'pork leg lean',
  '豚バラ': 'pork belly',
  '豚ひき肉': 'ground pork',
  '牛赤身': 'lean beef',
  '牛バラ': 'beef brisket',
  '牛ひき肉': 'ground beef',
  'ベーコン': 'bacon',
  'ウインナー': 'sausage',
  'ハム': 'ham slice',
  // 魚介類
  '鮭': 'salmon',
  'サーモン': 'salmon',
  'サケ': 'salmon',
  'マグロ': 'tuna',
  'マグロ赤身': 'tuna lean',
  '鮪': 'tuna',
  'タラ': 'cod',
  '鱈': 'cod',
  'サバ': 'mackerel',
  '鯖': 'mackerel',
  'アジ': 'horse mackerel',
  'ブリ': 'yellowtail',
  '鰤': 'yellowtail',
  'エビ': 'shrimp',
  '海老': 'shrimp',
  'イカ': 'squid',
  'タコ': 'octopus',
  // 卵・大豆
  '卵': 'egg',
  'ゆで卵': 'boiled egg',
  'たまご': 'egg',
  '木綿豆腐': 'firm tofu',
  '絹豆腐': 'silken tofu',
  '豆腐': 'firm tofu',
  '納豆': 'natto',
  '豆乳': 'soy milk',
  '厚揚げ': 'fried tofu',
  '枝豆': 'edamame',
  // 乳製品
  '牛乳': 'whole milk',
  'ヨーグルト': 'plain yogurt',
  'ギリシャヨーグルト': 'greek yogurt',
  'チーズ': 'cheese slice',
  'プロテイン': 'whey protein powder',
  // 穀物
  '白米': 'cooked white rice',
  'ご飯': 'cooked white rice',
  'ごはん': 'cooked white rice',
  '玄米': 'cooked brown rice',
  'うどん': 'udon noodles cooked',
  'そば': 'soba noodles cooked',
  'パスタ': 'cooked spaghetti',
  '食パン': 'white bread slice',
  'パン': 'white bread slice',
  'おにぎり': 'rice ball',
  'オートミール': 'oatmeal dry',
  // 野菜
  'ブロッコリー': 'broccoli',
  'ほうれん草': 'spinach',
  'キャベツ': 'cabbage',
  'トマト': 'tomato',
  'にんじん': 'carrot',
  '玉ねぎ': 'onion',
  'たまねぎ': 'onion',
  'きのこ': 'mushroom',
  'しめじ': 'mushroom',
  'もやし': 'bean sprouts',
  'レタス': 'lettuce',
  'アボカド': 'avocado',
  // 調味料・油
  'サラダ油': 'vegetable oil',
  'オリーブオイル': 'olive oil',
  '油': 'vegetable oil',
  'マヨネーズ': 'mayonnaise',
  'バター': 'butter',
  'ドレッシング': 'salad dressing',
  'ごまドレッシング': 'sesame dressing',
  '味噌': 'miso paste',
  '醤油': 'soy sauce',
  '砂糖': 'sugar',
  'みりん': 'mirin',
  // 汁物
  '味噌汁': 'miso soup',
  '豚汁': 'pork miso soup',
  // コンビニ・外食
  'サラダチキン': 'chicken breast cooked',
  'サラダ': 'green salad',
  'カットサラダ': 'green salad',
  '牛丼': 'beef rice bowl',
  '親子丼': 'chicken egg rice bowl',
  '海鮮丼': 'sashimi rice bowl',
  'カレーライス': 'curry rice',
  '焼き鳥缶詰': 'canned yakitori chicken',
  '焼き鳥缶': 'canned yakitori chicken',
  'プロテインドリンク': 'protein shake',
  'プロテインバー': 'protein bar',
  '野菜ジュース': 'vegetable juice',
};

/**
 * 日本語食材名を英語に変換
 */
function translateToEnglish(jaName) {
  const normalized = jaName.trim();
  if (FOOD_NAME_EN[normalized]) return FOOD_NAME_EN[normalized];
  // 部分一致（最長マッチ優先）
  let bestMatch = null;
  let bestLen = 0;
  for (const [ja, en] of Object.entries(FOOD_NAME_EN)) {
    if ((normalized.includes(ja) || ja.includes(normalized)) && ja.length > bestLen) {
      bestMatch = en;
      bestLen = ja.length;
    }
  }
  if (bestMatch) return bestMatch;
  return normalized;
}

/**
 * 量の文字列を英語に変換
 * "150g" → "150g", "2個" → "2", "1杯" → "1 serving", "1大さじ" → "1 tablespoon"
 */
function translateAmount(amount, foodNameEn) {
  let str = amount.trim();
  // グラム・ml はそのまま
  if (/\d+\s*g$/i.test(str) || /\d+\s*ml$/i.test(str)) return str;
  // 大さじ → tablespoon
  str = str.replace(/大さじ/, ' tablespoon');
  // 小さじ → teaspoon
  str = str.replace(/小さじ/, ' teaspoon');
  // 杯/皿/食/缶/袋/本/パック → serving
  str = str.replace(/(杯|皿|食|缶|袋|本|パック)$/, '');
  // 個/枚 → just number
  str = str.replace(/(個|枚)$/, '');
  // 人前 → serving
  str = str.replace(/人前$/, ' serving');
  // 玉 → just number
  str = str.replace(/玉$/, '');
  return str.trim();
}

// ============================================================
// ローカルフォールバックDB（主要食材のみ）
// ============================================================
const LOCAL_DB = {
  '鶏胸肉皮なし': { p: 23, f: 1.5, c: 0, cal: 110, unit: 'g', per: 100 },
  '鶏胸肉': { p: 23, f: 1.5, c: 0, cal: 110, unit: 'g', per: 100 },
  '鶏もも肉': { p: 19, f: 5, c: 0, cal: 130, unit: 'g', per: 100 },
  '鶏ささみ': { p: 24, f: 1, c: 0, cal: 105, unit: 'g', per: 100 },
  '豚ロース': { p: 19, f: 20, c: 0, cal: 260, unit: 'g', per: 100 },
  '豚もも': { p: 21, f: 10, c: 0, cal: 180, unit: 'g', per: 100 },
  '豚バラ': { p: 14, f: 35, c: 0, cal: 385, unit: 'g', per: 100 },
  '牛赤身': { p: 21, f: 10, c: 0, cal: 180, unit: 'g', per: 100 },
  '鮭': { p: 20, f: 4, c: 0, cal: 130, unit: 'g', per: 100 },
  'サバ': { p: 21, f: 12, c: 0, cal: 200, unit: 'g', per: 100 },
  '卵': { p: 7, f: 6, c: 0.5, cal: 85, unit: '個', per: 1 },
  '白米': { p: 4, f: 0.5, c: 56, cal: 250, unit: 'g', per: 150 },
  '味噌汁': { p: 5, f: 2, c: 4, cal: 50, unit: '杯', per: 1 },
  'おにぎり': { p: 3, f: 0.3, c: 40, cal: 180, unit: '個', per: 1 },
  'サラダチキン': { p: 25, f: 1, c: 0, cal: 115, unit: '個', per: 1 },
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(204).end();
  }
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items array is required' });
  }

  const apiKey = process.env.NUTRITION_API_KEY;
  const results = [];
  let totalCal = 0, totalP = 0, totalF = 0, totalC = 0;

  // 外部API使用可能なら並列リクエスト
  if (apiKey) {
    const promises = items.map(async (item) => {
      try {
        const enName = translateToEnglish(item.name);
        const enAmount = translateAmount(item.amount, enName);
        const query = `${enAmount} ${enName}`;

        const response = await fetch(
          `https://api.api-ninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`,
          { headers: { 'X-Api-Key': apiKey } }
        );

        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();

        if (data && data.length > 0) {
          // 複数結果がある場合は合算
          let cal = 0, p = 0, f = 0, c = 0;
          for (const d of data) {
            cal += d.calories || 0;
            p += d.protein_g || 0;
            f += d.fat_total_g || 0;
            c += d.carbohydrates_total_g || 0;
          }
          return {
            name: item.name,
            amount: item.amount,
            cal: Math.round(cal),
            p: Math.round(p * 10) / 10,
            f: Math.round(f * 10) / 10,
            c: Math.round(c * 10) / 10,
            source: 'api'
          };
        }
        throw new Error('No results');
      } catch {
        // 外部API失敗 → ローカルフォールバック
        return calcLocal(item);
      }
    });

    const settled = await Promise.all(promises);
    for (const r of settled) {
      results.push(r);
      if (r.cal != null) {
        totalCal += r.cal;
        totalP += r.p;
        totalF += r.f;
        totalC += r.c;
      }
    }
  } else {
    // APIキーなし → 全てローカル
    for (const item of items) {
      const r = calcLocal(item);
      results.push(r);
      if (r.cal != null) {
        totalCal += r.cal;
        totalP += r.p;
        totalF += r.f;
        totalC += r.c;
      }
    }
  }

  return res.status(200).json({
    items: results,
    total: {
      cal: Math.round(totalCal),
      p: Math.round(totalP),
      f: Math.round(totalF),
      c: Math.round(totalC)
    },
    source: apiKey ? 'api+local' : 'local'
  });
}

/**
 * ローカルDBでPFC計算
 */
function calcLocal(item) {
  const name = item.name.trim();
  const entry = findLocalEntry(name);
  if (!entry) {
    return { name, amount: item.amount, cal: null, p: null, f: null, c: null, unknown: true, source: 'unknown' };
  }
  const mult = parseLocalAmount(item.amount, entry);
  return {
    name,
    amount: item.amount,
    cal: Math.round(entry.cal * mult),
    p: Math.round(entry.p * mult * 10) / 10,
    f: Math.round(entry.f * mult * 10) / 10,
    c: Math.round(entry.c * mult * 10) / 10,
    source: 'local'
  };
}

function findLocalEntry(name) {
  if (LOCAL_DB[name]) return LOCAL_DB[name];
  let best = null, bestLen = 0;
  for (const key of Object.keys(LOCAL_DB)) {
    if ((name.includes(key) || key.includes(name)) && key.length > bestLen) {
      best = LOCAL_DB[key];
      bestLen = key.length;
    }
  }
  return best;
}

function parseLocalAmount(amountStr, entry) {
  const str = amountStr.trim();
  const gMatch = str.match(/([\d.]+)\s*g/i);
  if (gMatch && entry.unit === 'g') return parseFloat(gMatch[1]) / entry.per;
  const numMatch = str.match(/([\d.]+)/);
  if (numMatch) {
    const num = parseFloat(numMatch[1]);
    if (entry.unit === 'g' || entry.unit === 'ml') return num / entry.per;
    return num / entry.per;
  }
  return 1;
}
