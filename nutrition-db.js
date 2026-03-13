// ============================================================
// 食材栄養データベース & PFC計算エンジン
// ============================================================

const FOOD_DB = {
  // 肉類（100gあたり）
  '鶏胸肉皮なし': { p: 23, f: 1.5, c: 0, cal: 110, unit: 'g', per: 100 },
  '鶏胸肉皮あり': { p: 21, f: 6, c: 0, cal: 145, unit: 'g', per: 100 },
  '鶏胸肉': { p: 23, f: 1.5, c: 0, cal: 110, unit: 'g', per: 100 },
  '鶏もも肉皮なし': { p: 19, f: 5, c: 0, cal: 130, unit: 'g', per: 100 },
  '鶏もも肉皮あり': { p: 17, f: 14, c: 0, cal: 200, unit: 'g', per: 100 },
  '鶏もも肉': { p: 19, f: 5, c: 0, cal: 130, unit: 'g', per: 100 },
  '鶏ささみ': { p: 24, f: 1, c: 0, cal: 105, unit: 'g', per: 100 },
  'ささみ': { p: 24, f: 1, c: 0, cal: 105, unit: 'g', per: 100 },
  '鶏ひき肉': { p: 18, f: 12, c: 0, cal: 185, unit: 'g', per: 100 },
  '豚ロース': { p: 19, f: 20, c: 0, cal: 260, unit: 'g', per: 100 },
  '豚もも': { p: 21, f: 10, c: 0, cal: 180, unit: 'g', per: 100 },
  '豚バラ': { p: 14, f: 35, c: 0, cal: 385, unit: 'g', per: 100 },
  '豚ひき肉': { p: 18, f: 16, c: 0, cal: 220, unit: 'g', per: 100 },
  '牛赤身': { p: 21, f: 10, c: 0, cal: 180, unit: 'g', per: 100 },
  '牛バラ': { p: 14, f: 32, c: 0, cal: 370, unit: 'g', per: 100 },
  '牛ひき肉': { p: 19, f: 15, c: 0, cal: 225, unit: 'g', per: 100 },
  'ベーコン': { p: 2, f: 7, c: 0, cal: 73, unit: '枚', per: 1 },
  'ウインナー': { p: 3, f: 6, c: 1, cal: 80, unit: '本', per: 1 },
  'ハム': { p: 3, f: 1, c: 0.5, cal: 20, unit: '枚', per: 1 },

  // 魚介類（100gあたり）
  '鮭': { p: 20, f: 4, c: 0, cal: 130, unit: 'g', per: 100 },
  'サーモン': { p: 20, f: 4, c: 0, cal: 130, unit: 'g', per: 100 },
  'マグロ赤身': { p: 26, f: 1, c: 0, cal: 125, unit: 'g', per: 100 },
  'マグロ': { p: 26, f: 1, c: 0, cal: 125, unit: 'g', per: 100 },
  'タラ': { p: 18, f: 0.2, c: 0, cal: 77, unit: 'g', per: 100 },
  'サバ': { p: 21, f: 12, c: 0, cal: 200, unit: 'g', per: 100 },
  'アジ': { p: 20, f: 3, c: 0, cal: 125, unit: 'g', per: 100 },
  'ブリ': { p: 21, f: 17, c: 0, cal: 250, unit: 'g', per: 100 },
  'エビ': { p: 22, f: 0.6, c: 0, cal: 97, unit: 'g', per: 100 },
  'イカ': { p: 18, f: 1, c: 0, cal: 88, unit: 'g', per: 100 },
  'タコ': { p: 16, f: 0.7, c: 0, cal: 76, unit: 'g', per: 100 },
  'ツナ缶水煮': { p: 12, f: 0.5, c: 0, cal: 52, unit: '缶', per: 1 },
  'ツナ缶油漬': { p: 12, f: 10, c: 0, cal: 150, unit: '缶', per: 1 },
  'ツナ缶': { p: 12, f: 0.5, c: 0, cal: 52, unit: '缶', per: 1 },
  'サバ缶水煮': { p: 21, f: 11, c: 0, cal: 190, unit: '缶', per: 1 },
  'サバ缶': { p: 21, f: 11, c: 0, cal: 190, unit: '缶', per: 1 },
  'ちくわ': { p: 4, f: 0.6, c: 4, cal: 36, unit: '本', per: 1 },
  'かまぼこ': { p: 1, f: 0, c: 1, cal: 10, unit: '切', per: 1 },

  // 卵・大豆
  '卵': { p: 7, f: 6, c: 0.5, cal: 85, unit: '個', per: 1 },
  'たまご': { p: 7, f: 6, c: 0.5, cal: 85, unit: '個', per: 1 },
  'ゆで卵': { p: 7, f: 6, c: 0.5, cal: 85, unit: '個', per: 1 },
  '卵白': { p: 4, f: 0, c: 0, cal: 17, unit: '個分', per: 1 },
  '木綿豆腐': { p: 10, f: 6, c: 2, cal: 110, unit: 'g', per: 150 },
  '絹豆腐': { p: 7, f: 5, c: 3, cal: 85, unit: 'g', per: 150 },
  '豆腐': { p: 10, f: 6, c: 2, cal: 110, unit: 'g', per: 150 },
  '納豆': { p: 7, f: 5, c: 5, cal: 90, unit: 'パック', per: 1 },
  '豆乳': { p: 7, f: 4, c: 6, cal: 90, unit: 'ml', per: 200 },
  '厚揚げ': { p: 11, f: 11, c: 1, cal: 150, unit: 'g', per: 100 },
  '油揚げ': { p: 6, f: 10, c: 0, cal: 116, unit: '枚', per: 1 },
  '枝豆': { p: 12, f: 6, c: 9, cal: 135, unit: 'g', per: 100 },

  // 乳製品
  '牛乳': { p: 7, f: 8, c: 10, cal: 135, unit: 'ml', per: 200 },
  '低脂肪牛乳': { p: 7, f: 2, c: 11, cal: 95, unit: 'ml', per: 200 },
  'ヨーグルト': { p: 4, f: 3, c: 5, cal: 60, unit: 'g', per: 100 },
  'ギリシャヨーグルト': { p: 10, f: 0, c: 4, cal: 60, unit: 'g', per: 100 },
  'チーズ': { p: 4, f: 5, c: 0.2, cal: 60, unit: '枚', per: 1 },
  'スライスチーズ': { p: 4, f: 5, c: 0.2, cal: 60, unit: '枚', per: 1 },
  'クリームチーズ': { p: 2, f: 7, c: 0.5, cal: 70, unit: 'g', per: 20 },
  'プロテイン': { p: 24, f: 1, c: 3, cal: 120, unit: '杯', per: 1 },

  // 穀物・炭水化物
  '白米': { p: 4, f: 0.5, c: 56, cal: 250, unit: 'g', per: 150 },
  'ご飯': { p: 4, f: 0.5, c: 56, cal: 250, unit: 'g', per: 150 },
  'ごはん': { p: 4, f: 0.5, c: 56, cal: 250, unit: 'g', per: 150 },
  '白米軽く': { p: 3, f: 0.3, c: 37, cal: 170, unit: 'g', per: 100 },
  '玄米': { p: 4, f: 1.5, c: 52, cal: 245, unit: 'g', per: 150 },
  'もち麦ご飯': { p: 4, f: 1, c: 50, cal: 230, unit: 'g', per: 150 },
  'うどん': { p: 5, f: 1, c: 43, cal: 210, unit: '玉', per: 1 },
  'そば': { p: 8, f: 1, c: 44, cal: 225, unit: '玉', per: 1 },
  'パスタ': { p: 13, f: 2, c: 70, cal: 375, unit: '人前', per: 1 },
  '食パン6枚切': { p: 6, f: 3, c: 28, cal: 160, unit: '枚', per: 1 },
  '食パン8枚切': { p: 4, f: 2, c: 21, cal: 120, unit: '枚', per: 1 },
  '食パン': { p: 6, f: 3, c: 28, cal: 160, unit: '枚', per: 1 },
  'パン': { p: 6, f: 3, c: 28, cal: 160, unit: '枚', per: 1 },
  'おにぎり': { p: 3, f: 0.3, c: 40, cal: 180, unit: '個', per: 1 },
  '餅': { p: 2, f: 0.3, c: 25, cal: 115, unit: '個', per: 1 },
  'オートミール': { p: 4, f: 2, c: 20, cal: 115, unit: 'g', per: 30 },

  // 野菜・きのこ・海藻（100gあたり）
  'ブロッコリー': { p: 4, f: 0.5, c: 5, cal: 33, unit: 'g', per: 100 },
  'ほうれん草': { p: 2, f: 0.4, c: 3, cal: 20, unit: 'g', per: 100 },
  'キャベツ': { p: 1, f: 0.2, c: 5, cal: 23, unit: 'g', per: 100 },
  'トマト': { p: 1, f: 0.1, c: 5, cal: 20, unit: 'g', per: 100 },
  'にんじん': { p: 1, f: 0.1, c: 9, cal: 37, unit: 'g', per: 100 },
  'たまねぎ': { p: 1, f: 0.1, c: 9, cal: 37, unit: 'g', per: 100 },
  'きのこ': { p: 3, f: 0.3, c: 5, cal: 20, unit: 'g', per: 100 },
  'しめじ': { p: 3, f: 0.3, c: 5, cal: 20, unit: 'g', per: 100 },
  'えのき': { p: 3, f: 0.3, c: 5, cal: 20, unit: 'g', per: 100 },
  'まいたけ': { p: 3, f: 0.3, c: 5, cal: 20, unit: 'g', per: 100 },
  'もやし': { p: 2, f: 0.1, c: 3, cal: 15, unit: 'g', per: 100 },
  'レタス': { p: 1, f: 0.1, c: 3, cal: 12, unit: 'g', per: 100 },
  'わかめ': { p: 1, f: 0, c: 2, cal: 8, unit: 'g', per: 50 },
  'アボカド': { p: 2, f: 13, c: 4, cal: 130, unit: '個', per: 0.5 },
  'アボカド半分': { p: 2, f: 13, c: 4, cal: 130, unit: '個', per: 1 },

  // 調味料・油
  'サラダ油': { p: 0, f: 12, c: 0, cal: 110, unit: '大さじ', per: 1 },
  'オリーブオイル': { p: 0, f: 12, c: 0, cal: 110, unit: '大さじ', per: 1 },
  '油': { p: 0, f: 12, c: 0, cal: 110, unit: '大さじ', per: 1 },
  'マヨネーズ': { p: 0, f: 9, c: 0.5, cal: 85, unit: '大さじ', per: 1 },
  'バター': { p: 0, f: 8, c: 0, cal: 75, unit: 'g', per: 10 },
  'ドレッシング': { p: 0, f: 4, c: 2, cal: 40, unit: '大さじ', per: 1 },
  '味噌': { p: 2, f: 1, c: 4, cal: 35, unit: '大さじ', per: 1 },
  '醤油': { p: 1, f: 0, c: 2, cal: 13, unit: '大さじ', per: 1 },
  '砂糖': { p: 0, f: 0, c: 9, cal: 35, unit: '大さじ', per: 1 },
  'みりん': { p: 0, f: 0, c: 8, cal: 40, unit: '大さじ', per: 1 },
  '酒': { p: 0, f: 0, c: 1, cal: 15, unit: '大さじ', per: 1 },
  '料理酒': { p: 0, f: 0, c: 1, cal: 15, unit: '大さじ', per: 1 },
  'ごまドレッシング': { p: 0, f: 5, c: 3, cal: 55, unit: '大さじ', per: 1 },
  'ポン酢': { p: 0, f: 0, c: 2, cal: 10, unit: '大さじ', per: 1 },
  'めんつゆ': { p: 1, f: 0, c: 4, cal: 20, unit: '大さじ', per: 1 },
  'ケチャップ': { p: 0, f: 0, c: 5, cal: 20, unit: '大さじ', per: 1 },

  // 汁物（1杯あたり）
  '味噌汁豆腐わかめ': { p: 5, f: 2, c: 4, cal: 50, unit: '杯', per: 1 },
  '味噌汁野菜': { p: 2, f: 1, c: 5, cal: 35, unit: '杯', per: 1 },
  '味噌汁': { p: 5, f: 2, c: 4, cal: 50, unit: '杯', per: 1 },
  'コンソメスープ': { p: 1, f: 1, c: 5, cal: 30, unit: '杯', per: 1 },
  '豚汁': { p: 8, f: 5, c: 8, cal: 100, unit: '杯', per: 1 },
  'わかめスープ': { p: 1, f: 1, c: 2, cal: 15, unit: '杯', per: 1 },
  'スープ': { p: 2, f: 1, c: 5, cal: 35, unit: '杯', per: 1 },

  // コンビニ商品
  'サラダチキン': { p: 25, f: 1, c: 0, cal: 115, unit: '個', per: 1 },
  'サンドイッチツナ': { p: 10, f: 12, c: 28, cal: 260, unit: '個', per: 1 },
  'サンドイッチたまご': { p: 9, f: 10, c: 26, cal: 230, unit: '個', per: 1 },
  'サンドイッチハムレタス': { p: 10, f: 8, c: 24, cal: 210, unit: '個', per: 1 },
  'サンドイッチチキン': { p: 14, f: 10, c: 26, cal: 250, unit: '個', per: 1 },
  'サンドイッチ': { p: 10, f: 12, c: 28, cal: 260, unit: '個', per: 1 },
  '冷やし中華': { p: 15, f: 8, c: 60, cal: 380, unit: '食', per: 1 },
  '幕の内弁当': { p: 20, f: 18, c: 90, cal: 600, unit: '個', per: 1 },
  '弁当': { p: 20, f: 18, c: 90, cal: 600, unit: '個', per: 1 },
  'おにぎり鮭': { p: 5, f: 1, c: 40, cal: 190, unit: '個', per: 1 },
  'おにぎりツナマヨ': { p: 5, f: 4, c: 38, cal: 215, unit: '個', per: 1 },
  'おにぎり昆布': { p: 3, f: 0.5, c: 40, cal: 175, unit: '個', per: 1 },
  'おにぎり明太子': { p: 4, f: 1, c: 39, cal: 180, unit: '個', per: 1 },
  'おにぎり梅': { p: 3, f: 0.3, c: 39, cal: 170, unit: '個', per: 1 },
  '玄米おにぎり': { p: 3, f: 0.5, c: 38, cal: 175, unit: '個', per: 1 },
  '焼き鳥缶詰': { p: 14, f: 6, c: 5, cal: 130, unit: '缶', per: 1 },
  '焼き鳥缶': { p: 14, f: 6, c: 5, cal: 130, unit: '缶', per: 1 },
  'プロテインドリンク': { p: 15, f: 0, c: 5, cal: 85, unit: '本', per: 1 },
  'プロテインバー': { p: 15, f: 6, c: 18, cal: 190, unit: '本', per: 1 },
  '野菜ジュース': { p: 1, f: 0, c: 15, cal: 65, unit: '本', per: 1 },
  '野菜スムージー': { p: 1, f: 0, c: 20, cal: 85, unit: '本', per: 1 },
  'カットサラダ': { p: 1, f: 0.2, c: 4, cal: 20, unit: '袋', per: 1 },
  'カップスープ': { p: 2, f: 2, c: 10, cal: 65, unit: '個', per: 1 },
  'チキン&エッグサンド': { p: 14, f: 10, c: 26, cal: 250, unit: '個', per: 1 },

  // 外食・料理
  '牛丼並盛': { p: 22, f: 18, c: 68, cal: 550, unit: '杯', per: 1 },
  '牛丼': { p: 22, f: 18, c: 68, cal: 550, unit: '杯', per: 1 },
  'ざるそば': { p: 10, f: 2, c: 50, cal: 270, unit: '食', per: 1 },
  '親子丼': { p: 30, f: 15, c: 90, cal: 620, unit: '杯', per: 1 },
  '海鮮丼': { p: 30, f: 5, c: 80, cal: 500, unit: '杯', per: 1 },
  'カレーライス': { p: 15, f: 15, c: 100, cal: 600, unit: '食', per: 1 },
  '焼き鳥定食': { p: 30, f: 12, c: 70, cal: 520, unit: '食', per: 1 },
  '鶏照り焼き定食': { p: 32, f: 14, c: 75, cal: 560, unit: '食', per: 1 },
  'サラダ': { p: 2, f: 3, c: 6, cal: 50, unit: '皿', per: 1 },
};

// 食材名エイリアス → 正規名への解決
const FOOD_ALIASES = {
  '鶏むね肉': '鶏胸肉',
  'むね肉': '鶏胸肉',
  '胸肉': '鶏胸肉',
  'もも肉': '鶏もも肉',
  'サケ': '鮭',
  'さけ': '鮭',
  'しゃけ': '鮭',
  'まぐろ': 'マグロ赤身',
  'たら': 'タラ',
  'さば': 'サバ',
  'あじ': 'アジ',
  'ぶり': 'ブリ',
  'えび': 'エビ',
  'いか': 'イカ',
  'たこ': 'タコ',
  'とうふ': '豆腐',
  'なっとう': '納豆',
  'はくまい': '白米',
  'げんまい': '玄米',
  'ぎゅうにゅう': '牛乳',
  '鳥胸肉': '鶏胸肉',
  '鳥もも肉': '鶏もも肉',
  '鳥ささみ': '鶏ささみ',
  '豚肉': '豚もも',
  '鶏肉': '鶏胸肉',
  '牛肉': '牛赤身',
  'ライス': '白米',
  '米': '白米',
  'ごはん150g': '白米',
  'ご飯150g': '白米',
  'みそ汁': '味噌汁',
  'みそしる': '味噌汁',
  'たまご': '卵',
  'タマゴ': '卵',
  '目玉焼き': '卵',
  'スクランブルエッグ': '卵',
  'トースト': '食パン',
  'ぱん': 'パン',
  'ツナサンド': 'サンドイッチツナ',
  'たまごサンド': 'サンドイッチたまご',
  '卵サンド': 'サンドイッチたまご',
  'ハムサンド': 'サンドイッチハムレタス',
  'チキンサンド': 'サンドイッチチキン',
  '鮭おにぎり': 'おにぎり鮭',
  'しゃけおにぎり': 'おにぎり鮭',
  'ツナマヨおにぎり': 'おにぎりツナマヨ',
  '昆布おにぎり': 'おにぎり昆布',
  '明太子おにぎり': 'おにぎり明太子',
  '梅おにぎり': 'おにぎり梅',
  '焼鳥缶': '焼き鳥缶詰',
  '焼鳥缶詰': '焼き鳥缶詰',
  'やきとり缶': '焼き鳥缶詰',
  'プロテインバー1本': 'プロテインバー',
  '野菜ジュース1本': '野菜ジュース',
  // 漢字・ひらがな表記揺れ
  '鯖': 'サバ',
  '鰤': 'ブリ',
  '鮪': 'マグロ赤身',
  '鱈': 'タラ',
  '鰺': 'アジ',
  '海老': 'エビ',
  '烏賊': 'イカ',
  '蛸': 'タコ',
  '玉ねぎ': 'たまねぎ',
  '玉葱': 'たまねぎ',
  'タマネギ': 'たまねぎ',
  '人参': 'にんじん',
  'ニンジン': 'にんじん',
  'キノコ': 'きのこ',
  'ホウレン草': 'ほうれん草',
  'ほうれんそう': 'ほうれん草',
};

/**
 * 食材名からDBエントリを検索
 * @param {string} name - 食材名
 * @returns {object|null} - { p, f, c, cal, unit, per } or null
 */
function lookupFood(name) {
  const normalized = name.trim();
  // 直接一致
  if (FOOD_DB[normalized]) return { ...FOOD_DB[normalized], name: normalized };
  // エイリアス
  const aliased = FOOD_ALIASES[normalized];
  if (aliased && FOOD_DB[aliased]) return { ...FOOD_DB[aliased], name: aliased };
  // 部分一致（最も長くマッチするキーを優先）
  let bestMatch = null;
  let bestLen = 0;
  for (const key of Object.keys(FOOD_DB)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      if (key.length > bestLen) {
        bestMatch = key;
        bestLen = key.length;
      }
    }
  }
  if (bestMatch) return { ...FOOD_DB[bestMatch], name: bestMatch };
  return null;
}

/**
 * 量の文字列をパースして数値に変換
 * @param {string} amountStr - "150g", "2個", "1パック", "半丁" etc.
 * @param {object} foodEntry - FOOD_DBのエントリ
 * @returns {number} - 基準量に対する倍率
 */
function parseAmount(amountStr, foodEntry) {
  const str = amountStr.trim();

  // 「半丁」「半分」「1/2」
  if (/半丁|半分|1\/2/.test(str)) return 1;

  // 「1丁」
  if (/1丁/.test(str)) return 2;

  // グラム指定の場合
  const gMatch = str.match(/([\d.]+)\s*g/i);
  if (gMatch) {
    const grams = parseFloat(gMatch[1]);
    if (foodEntry.unit === 'g') {
      return grams / foodEntry.per;
    }
    // 個数系の食材にグラム指定された場合は、概算
    return grams / 100;
  }

  // ml指定の場合
  const mlMatch = str.match(/([\d.]+)\s*ml/i);
  if (mlMatch) {
    const ml = parseFloat(mlMatch[1]);
    if (foodEntry.unit === 'ml') {
      return ml / foodEntry.per;
    }
    return ml / 200;
  }

  // 数値のみ（個数系）
  const numMatch = str.match(/([\d.]+)/);
  if (numMatch) {
    const num = parseFloat(numMatch[1]);
    if (foodEntry.unit === 'g' || foodEntry.unit === 'ml') {
      // "150" → 150g扱い
      return num / foodEntry.per;
    }
    // 個数系
    return num / foodEntry.per;
  }

  // パース不能 → 1単位
  return 1;
}

/**
 * [ITEMS: food1 amount, food2 amount] タグをパースして食材リストを返す
 * @param {string} text - AI出力テキスト
 * @returns {Array<{tag: string, items: Array<{name: string, amount: string}>}>}
 */
function parseNutritionItems(text) {
  const results = [];
  const tagPattern = /\[ITEMS:\s*([^\]]+)\]/g;
  let match;
  while ((match = tagPattern.exec(text)) !== null) {
    const itemsStr = match[1];
    const items = itemsStr.split(',').map(item => {
      const trimmed = item.trim();
      // "鶏胸肉 150g" or "卵 2個" or "味噌汁 1杯"
      const parts = trimmed.match(/^(.+?)\s+([\d./半]+\s*[a-zA-Zぁ-ん丁分枚個本杯パック人前玉切皿食缶大さじ]*)\s*$/);
      if (parts) {
        return { name: parts[1].trim(), amount: parts[2].trim() };
      }
      // 量なし → 1単位
      return { name: trimmed, amount: '1' };
    });
    results.push({ tag: match[0], items });
  }
  return results;
}

/**
 * 食材リストからPFCを計算
 * @param {Array<{name: string, amount: string}>} items
 * @returns {{ p: number, f: number, c: number, cal: number, details: Array, unknowns: Array }}
 */
function calculateItemsPFC(items) {
  let totalP = 0, totalF = 0, totalC = 0, totalCal = 0;
  const details = [];
  const unknowns = [];

  for (const item of items) {
    const food = lookupFood(item.name);
    if (!food) {
      unknowns.push(item.name);
      continue;
    }
    const multiplier = parseAmount(item.amount, food);
    const p = Math.round(food.p * multiplier * 10) / 10;
    const f = Math.round(food.f * multiplier * 10) / 10;
    const c = Math.round(food.c * multiplier * 10) / 10;
    const cal = Math.round(food.cal * multiplier);
    totalP += p;
    totalF += f;
    totalC += c;
    totalCal += cal;
    details.push({ name: item.name, amount: item.amount, p, f, c, cal });
  }

  return {
    p: Math.round(totalP),
    f: Math.round(totalF),
    c: Math.round(totalC),
    cal: Math.round(totalCal),
    details,
    unknowns
  };
}

// ============================================================
// 1食目安PFC計算（ユーザーデータ×目的×時間帯×空腹度）
// ============================================================

// 目的別の係数
const GOAL_COEFFICIENTS = {
  // 減量: goal 1, goal 5(体脂肪率>目標)
  reduction: { calPerKg: 26, pPerKg: 1.8, fRatio: 0.22 },
  // 筋肥大: goal 2, goal 5(体脂肪率≤目標)
  muscle: { calPerKg: 37, pPerKg: 1.8, fRatio: 0.27 },
  // 健康維持: goal 3, goal 4
  health: { calPerKg: 32, pPerKg: 1.4, fRatio: 0.27 }
};

// 時間帯別の配分率
const TIME_DISTRIBUTION = {
  '朝': { cal: 0.30, p: 0.30, f: 0.25, c: 0.35 },
  '昼': { cal: 0.35, p: 0.30, f: 0.35, c: 0.35 },
  '夕方': { cal: 0.25, p: 0.25, f: 0.25, c: 0.25 },
  '夜': { cal: 0.20, p: 0.30, f: 0.15, c: 0.15 },
  '間食': { cal: 0.10, p: 0.15, f: 0.10, c: 0.05 }
};

// 空腹度別のカロリー補正
const HUNGER_ADJUSTMENT = {
  'かなり空腹': 1.10,
  '少し空腹': 1.0,
  'そこまで空腹じゃない': 0.90,
  'なんとなく食べたい': 1.0
};

/**
 * 目的番号からcoefficient typeを判定
 * @param {string} goalNum - "1"〜"5"
 * @param {number|null} currentBF - 現在の体脂肪率
 * @param {number|null} targetBF - 目標体脂肪率
 * @returns {object} - GOAL_COEFFICIENTSのエントリ
 */
function getGoalCoefficients(goalNum, currentBF, targetBF) {
  switch (goalNum) {
    case '1': return GOAL_COEFFICIENTS.reduction;
    case '2': return GOAL_COEFFICIENTS.muscle;
    case '3': return GOAL_COEFFICIENTS.health;
    case '4': return GOAL_COEFFICIENTS.health;
    case '5':
      if (currentBF && targetBF && currentBF > targetBF) {
        return GOAL_COEFFICIENTS.reduction;
      }
      return GOAL_COEFFICIENTS.muscle;
    default: return GOAL_COEFFICIENTS.health;
  }
}

/**
 * 1食の目安PFCを計算
 * 目標体重・期限がある場合はそこから逆算した赤字/黒字を適用
 *
 * @param {object} params
 * @param {number} params.weight - 現在の体重(kg)
 * @param {string} params.goalNum - 目的番号 "1"〜"5"
 * @param {number|null} params.currentBF - 現在の体脂肪率
 * @param {number|null} params.targetBF - 目標体脂肪率
 * @param {number|null} params.goalWeight - 目標体重(kg)
 * @param {number|null} params.daysLeft - 目標期限までの残日数
 * @param {string} params.timeOfDay - 時間帯（朝/昼/夕方/夜/間食）
 * @param {string} params.hunger - 空腹度
 * @returns {{ cal: number, p: number, f: number, c: number, dailyCal: number, deficit: number }}
 */
function calculateMealTarget(params) {
  const { weight, goalNum, currentBF, targetBF, goalWeight, daysLeft, timeOfDay, hunger } = params;
  const coeff = getGoalCoefficients(goalNum, currentBF, targetBF);
  const timeDist = TIME_DISTRIBUTION[timeOfDay] || TIME_DISTRIBUTION['昼'];
  const hungerMult = HUNGER_ADJUSTMENT[hunger] || 1.0;

  // STEP1: ベースTDEE（目的別の体重×係数）
  let dailyCal = weight * coeff.calPerKg;
  let deficit = 0;

  // STEP1b: 目標体重と期限がある場合、カロリー赤字/黒字を計算
  if (goalWeight && daysLeft && daysLeft > 0) {
    const weightDiff = weight - goalWeight; // 正=減量、負=増量
    // 1kg体重変化 ≈ 7700kcal
    const totalCalDiff = weightDiff * 7700;
    let dailyDiff = totalCalDiff / daysLeft;
    // 安全制限: 1日の赤字は最大750kcal（週0.7kg減）、黒字は最大500kcal
    if (dailyDiff > 750) dailyDiff = 750;
    if (dailyDiff < -500) dailyDiff = -500;
    // 最低摂取カロリー: 体重×20kcal（安全下限）
    const minCal = weight * 20;
    dailyCal = Math.max(dailyCal - dailyDiff, minCal);
    deficit = Math.round(dailyDiff);
  }

  const dailyP = weight * coeff.pPerKg;
  const dailyF = dailyCal * coeff.fRatio / 9;
  const dailyC = (dailyCal - dailyP * 4 - dailyF * 9) / 4;

  // STEP2: 時間帯配分
  let mealCal = dailyCal * timeDist.cal;
  let mealP = dailyP * timeDist.p;
  let mealF = dailyF * timeDist.f;
  let mealC = dailyC * timeDist.c;

  // STEP3: 空腹度調整（Pは減らさない）
  mealCal = mealCal * hungerMult;
  if (hungerMult !== 1.0) {
    mealF = mealF * hungerMult;
    mealC = mealC * hungerMult;
  }

  return {
    cal: Math.round(mealCal),
    p: Math.round(mealP),
    f: Math.round(mealF),
    c: Math.round(mealC),
    dailyCal: Math.round(dailyCal),
    deficit
  };
}

/**
 * PFCの範囲を計算（±margin%、最低でも絶対値minAbsの幅を保証）
 */
function calculatePFCRange(pfc, marginPercent = 10, minAbs = { cal: 30, p: 3, f: 2, c: 5 }) {
  function range(val, key) {
    const margin = Math.max(Math.round(val * marginPercent / 100), minAbs[key]);
    return { min: Math.max(0, val - margin), max: val + margin };
  }
  return {
    cal: range(pfc.cal, 'cal'),
    p: range(pfc.p, 'p'),
    f: range(pfc.f, 'f'),
    c: range(pfc.c, 'c'),
    unknowns: pfc.unknowns || []
  };
}

/**
 * PFCバッジのHTMLを生成（範囲表示）
 */
function createPFCBadgeHTML(pfc, label) {
  const r = calculatePFCRange(pfc);
  return `<div class="pfc-badge">
  <div class="pfc-badge-label">${label}</div>
  <div class="pfc-badge-values">
    <span class="pfc-cal">約${r.cal.min}~${r.cal.max}kcal</span>
    <span class="pfc-p">P${r.p.min}~${r.p.max}g</span>
    <span class="pfc-f">F${r.f.min}~${r.f.max}g</span>
    <span class="pfc-c">C${r.c.min}~${r.c.max}g</span>
  </div>
</div>`;
}

// グローバルに公開
window.NutritionDB = {
  FOOD_DB,
  lookupFood,
  parseAmount,
  parseNutritionItems,
  calculateItemsPFC,
  calculateMealTarget,
  getGoalCoefficients,
  calculatePFCRange,
  createPFCBadgeHTML,
  TIME_DISTRIBUTION,
  HUNGER_ADJUSTMENT,
  GOAL_COEFFICIENTS
};
