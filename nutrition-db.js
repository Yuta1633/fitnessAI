// ============================================================
// 食材栄養データベース & PFC計算エンジン
// データ出典: 文部科学省「日本食品標準成分表2020年版（八訂）」
// すべて100gあたりの値（特記なき限り）
// ============================================================

// ================================================================
// 食材データベース（100gあたり）
// ================================================================
const FOOD_DB_RAW = {
  // ────────────────────────────────────────────
  // 主食・穀類（炊飯後の値）
  // ────────────────────────────────────────────
  '白米':       { cal: 168, p: 2.5, f: 0.3, c: 37.1, category: 'grain' },
  '玄米':       { cal: 165, p: 2.8, f: 1.0, c: 35.6, category: 'grain' },
  'もち麦ご飯': { cal: 140, p: 2.7, f: 0.7, c: 32.0, category: 'grain' },
  '雑穀米':     { cal: 160, p: 2.8, f: 0.8, c: 35.0, category: 'grain' },
  '赤飯':       { cal: 189, p: 4.5, f: 0.6, c: 41.5, category: 'grain' },
  // 乾麺→ゆで後
  'うどん':     { cal: 95,  p: 2.6, f: 0.4, c: 21.6, category: 'grain' },
  'そば':       { cal: 130, p: 4.8, f: 1.0, c: 26.0, category: 'grain' },
  'そうめん':   { cal: 114, p: 3.5, f: 0.4, c: 25.8, category: 'grain' },
  'パスタ':     { cal: 149, p: 5.2, f: 0.9, c: 28.4, category: 'grain' },
  '中華麺':     { cal: 149, p: 4.9, f: 0.6, c: 29.2, category: 'grain' },
  // パン
  '食パン':     { cal: 248, p: 8.9, f: 4.1, c: 46.4, category: 'grain' },
  'フランスパン': { cal: 289, p: 9.4, f: 1.3, c: 57.5, category: 'grain' },
  'ロールパン': { cal: 309, p: 10.1, f: 9.0, c: 48.6, category: 'grain' },
  'ナン':       { cal: 257, p: 7.9, f: 3.4, c: 47.6, category: 'grain' },
  // その他穀物
  'オートミール': { cal: 380, p: 13.7, f: 5.7, c: 69.1, category: 'grain' },
  'もち':       { cal: 223, p: 4.0, f: 0.6, c: 50.8, category: 'grain' },
  'コーンフレーク': { cal: 381, p: 7.8, f: 1.7, c: 83.6, category: 'grain' },
  'グラノーラ': { cal: 440, p: 8.3, f: 13.0, c: 72.0, category: 'grain' },

  // ────────────────────────────────────────────
  // 鶏肉（生）
  // ────────────────────────────────────────────
  '鶏胸肉皮なし': { cal: 105, p: 23.3, f: 1.9, c: 0, category: 'meat' },
  '鶏胸肉皮あり': { cal: 133, p: 21.3, f: 5.9, c: 0, category: 'meat' },
  '鶏胸肉':     { cal: 105, p: 23.3, f: 1.9, c: 0, category: 'meat' },
  '鶏もも肉皮なし': { cal: 113, p: 19.0, f: 5.0, c: 0, category: 'meat' },
  '鶏もも肉皮あり': { cal: 190, p: 16.6, f: 14.2, c: 0, category: 'meat' },
  '鶏もも肉':   { cal: 113, p: 19.0, f: 5.0, c: 0, category: 'meat' },
  '鶏ささみ':   { cal: 98,  p: 23.9, f: 0.8, c: 0, category: 'meat' },
  '鶏ひき肉':   { cal: 166, p: 17.5, f: 12.0, c: 0, category: 'meat' },
  '鶏手羽元':   { cal: 175, p: 18.2, f: 12.8, c: 0, category: 'meat' },
  '鶏手羽先':   { cal: 207, p: 17.4, f: 16.2, c: 0, category: 'meat' },
  '鶏レバー':   { cal: 100, p: 18.9, f: 3.1, c: 0.6, category: 'meat' },
  '鶏皮':       { cal: 497, p: 9.4, f: 48.1, c: 0, category: 'meat' },

  // ────────────────────────────────────────────
  // 豚肉（生）
  // ────────────────────────────────────────────
  '豚ロース':   { cal: 248, p: 19.3, f: 19.2, c: 0.2, category: 'meat' },
  '豚ロース赤身': { cal: 141, p: 22.7, f: 5.6, c: 0.3, category: 'meat' },
  '豚もも肉':   { cal: 171, p: 20.5, f: 10.2, c: 0.2, category: 'meat' },
  '豚ヒレ肉':   { cal: 118, p: 22.2, f: 3.7, c: 0.3, category: 'meat' },
  '豚バラ':     { cal: 366, p: 14.4, f: 35.4, c: 0.1, category: 'meat' },
  '豚ひき肉':   { cal: 209, p: 17.7, f: 15.1, c: 0, category: 'meat' },
  '豚肩ロース': { cal: 237, p: 17.1, f: 19.2, c: 0.1, category: 'meat' },
  '豚レバー':   { cal: 114, p: 20.4, f: 3.4, c: 2.5, category: 'meat' },

  // ────────────────────────────────────────────
  // 牛肉（生）
  // ────────────────────────────────────────────
  '牛もも肉':   { cal: 182, p: 21.2, f: 10.7, c: 0.3, category: 'meat' },
  '牛赤身':     { cal: 182, p: 21.2, f: 10.7, c: 0.3, category: 'meat' },
  '牛肩ロース': { cal: 295, p: 16.5, f: 26.4, c: 0.2, category: 'meat' },
  '牛サーロイン': { cal: 313, p: 16.5, f: 27.9, c: 0.3, category: 'meat' },
  '牛バラ':     { cal: 371, p: 14.4, f: 32.9, c: 0.2, category: 'meat' },
  '牛ひき肉':   { cal: 224, p: 19.0, f: 15.1, c: 0.3, category: 'meat' },
  '牛タン':     { cal: 318, p: 13.3, f: 31.8, c: 0.1, category: 'meat' },
  '牛ヒレ':     { cal: 185, p: 20.5, f: 11.2, c: 0.3, category: 'meat' },
  '牛レバー':   { cal: 119, p: 19.6, f: 3.7, c: 3.7, category: 'meat' },

  // ────────────────────────────────────────────
  // その他の肉
  // ────────────────────────────────────────────
  'ラム肉':     { cal: 198, p: 19.8, f: 12.0, c: 0.1, category: 'meat' },
  '馬肉':       { cal: 110, p: 20.1, f: 2.5, c: 0.3, category: 'meat' },
  '鹿肉':       { cal: 119, p: 23.9, f: 4.0, c: 0, category: 'meat' },
  '合鴨肉':     { cal: 333, p: 14.2, f: 29.0, c: 0, category: 'meat' },

  // ────────────────────────────────────────────
  // 加工肉
  // ────────────────────────────────────────────
  'ベーコン':   { cal: 400, p: 12.9, f: 39.1, c: 0.3, category: 'processed_meat' },
  'ウインナー': { cal: 319, p: 13.2, f: 28.5, c: 3.0, category: 'processed_meat' },
  'ソーセージ': { cal: 319, p: 13.2, f: 28.5, c: 3.0, category: 'processed_meat' },
  'ロースハム': { cal: 211, p: 18.6, f: 14.5, c: 1.3, category: 'processed_meat' },
  'ハム':       { cal: 211, p: 18.6, f: 14.5, c: 1.3, category: 'processed_meat' },
  'ボンレスハム': { cal: 118, p: 18.7, f: 4.0, c: 1.8, category: 'processed_meat' },
  '生ハム':     { cal: 247, p: 24.0, f: 16.6, c: 0.5, category: 'processed_meat' },
  'サラミ':     { cal: 497, p: 25.4, f: 43.0, c: 2.1, category: 'processed_meat' },
  'コンビーフ': { cal: 203, p: 19.8, f: 13.0, c: 1.7, category: 'processed_meat' },
  '焼豚':       { cal: 172, p: 19.4, f: 8.2, c: 5.1, category: 'processed_meat' },

  // ────────────────────────────────────────────
  // 魚介類（生）
  // ────────────────────────────────────────────
  '鮭':         { cal: 133, p: 22.3, f: 4.1, c: 0.1, category: 'fish' },
  'サーモン':   { cal: 133, p: 22.3, f: 4.1, c: 0.1, category: 'fish' },
  'マグロ赤身': { cal: 106, p: 24.3, f: 1.0, c: 0, category: 'fish' },
  'マグロ中トロ': { cal: 344, p: 20.1, f: 27.5, c: 0.1, category: 'fish' },
  'タラ':       { cal: 72,  p: 17.6, f: 0.2, c: 0.1, category: 'fish' },
  'サバ':       { cal: 211, p: 20.6, f: 16.8, c: 0.3, category: 'fish' },
  'アジ':       { cal: 112, p: 19.7, f: 4.5, c: 0.1, category: 'fish' },
  'ブリ':       { cal: 222, p: 21.4, f: 17.6, c: 0.3, category: 'fish' },
  'さんま':     { cal: 287, p: 18.1, f: 25.6, c: 0.1, category: 'fish' },
  'カツオ':     { cal: 108, p: 25.8, f: 0.5, c: 0.1, category: 'fish' },
  'サワラ':     { cal: 161, p: 20.1, f: 9.7, c: 0.1, category: 'fish' },
  'ししゃも':   { cal: 150, p: 15.6, f: 8.1, c: 0.2, category: 'fish' },
  'ほっけ':     { cal: 142, p: 17.3, f: 8.5, c: 0.1, category: 'fish' },
  'タイ':       { cal: 142, p: 20.6, f: 5.8, c: 0.1, category: 'fish' },
  'ヒラメ':     { cal: 103, p: 20.0, f: 2.0, c: 0, category: 'fish' },
  'いわし':     { cal: 169, p: 19.2, f: 9.2, c: 0.2, category: 'fish' },
  'うなぎ蒲焼': { cal: 285, p: 23.0, f: 21.0, c: 3.1, category: 'fish' },
  'カレイ':     { cal: 89,  p: 19.6, f: 1.3, c: 0, category: 'fish' },
  'メカジキ':   { cal: 141, p: 19.2, f: 7.6, c: 0.1, category: 'fish' },
  'サケ塩焼き': { cal: 171, p: 29.1, f: 5.4, c: 0.1, category: 'fish' },
  'サバ塩焼き': { cal: 256, p: 26.2, f: 19.4, c: 0.3, category: 'fish' },
  'アジ開き':   { cal: 168, p: 24.6, f: 8.0, c: 0.1, category: 'fish' },
  'しらす干し': { cal: 113, p: 23.1, f: 1.6, c: 0.2, category: 'fish' },
  '桜えび':     { cal: 312, p: 64.9, f: 4.0, c: 0.1, category: 'fish' },
  'しじみ':     { cal: 54,  p: 7.5, f: 1.4, c: 4.5, category: 'fish' },
  'めざし':     { cal: 218, p: 18.2, f: 13.8, c: 0.3, category: 'fish' },

  // 甲殻・軟体
  'エビ':       { cal: 90,  p: 21.6, f: 0.6, c: 0, category: 'fish' },
  'イカ':       { cal: 76,  p: 17.9, f: 0.8, c: 0.1, category: 'fish' },
  'タコ':       { cal: 70,  p: 16.4, f: 0.7, c: 0.1, category: 'fish' },
  'ホタテ':     { cal: 72,  p: 13.5, f: 0.9, c: 1.5, category: 'fish' },
  'あさり':     { cal: 27,  p: 6.0, f: 0.3, c: 0.4, category: 'fish' },
  'カキ':       { cal: 58,  p: 6.9, f: 2.2, c: 4.9, category: 'fish' },
  'カニ':       { cal: 59,  p: 13.9, f: 0.3, c: 0.1, category: 'fish' },

  // 水産加工品
  'ちくわ':     { cal: 119, p: 12.2, f: 2.0, c: 13.5, category: 'fish_processed' },
  'かまぼこ':   { cal: 93,  p: 12.0, f: 0.9, c: 9.7, category: 'fish_processed' },
  'はんぺん':   { cal: 94,  p: 9.9, f: 1.0, c: 11.4, category: 'fish_processed' },
  'さつま揚げ': { cal: 139, p: 12.5, f: 3.7, c: 13.9, category: 'fish_processed' },
  '魚肉ソーセージ': { cal: 158, p: 11.5, f: 7.2, c: 12.6, category: 'fish_processed' },

  // 缶詰
  'ツナ缶水煮': { cal: 71,  p: 16.0, f: 0.7, c: 0.2, category: 'fish_processed' },
  'ツナ缶油漬': { cal: 267, p: 17.7, f: 21.7, c: 0.1, category: 'fish_processed' },
  'サバ缶水煮': { cal: 174, p: 20.9, f: 10.7, c: 0.2, category: 'fish_processed' },
  'サバ缶味噌煮': { cal: 210, p: 16.3, f: 13.9, c: 6.6, category: 'fish_processed' },
  'サンマ缶蒲焼': { cal: 225, p: 17.4, f: 13.0, c: 9.7, category: 'fish_processed' },
  'いわし缶水煮': { cal: 188, p: 20.4, f: 12.3, c: 0.2, category: 'fish_processed' },

  // ────────────────────────────────────────────
  // 卵類
  // ────────────────────────────────────────────
  '鶏卵':       { cal: 142, p: 12.2, f: 10.2, c: 0.4, category: 'egg' },
  '卵白':       { cal: 44,  p: 10.5, f: 0, c: 0.5, category: 'egg' },
  '卵黄':       { cal: 336, p: 16.5, f: 34.3, c: 0.1, category: 'egg' },
  'うずら卵':   { cal: 179, p: 12.6, f: 13.1, c: 0.3, category: 'egg' },

  // ────────────────────────────────────────────
  // 乳製品
  // ────────────────────────────────────────────
  '牛乳':       { cal: 61,  p: 3.3, f: 3.8, c: 4.8, category: 'dairy' },
  '低脂肪牛乳': { cal: 42,  p: 3.8, f: 1.0, c: 5.5, category: 'dairy' },
  'ヨーグルト無糖': { cal: 56, p: 3.6, f: 3.0, c: 4.9, category: 'dairy' },
  'ヨーグルト加糖': { cal: 65, p: 3.0, f: 0.2, c: 12.0, category: 'dairy' },
  'ギリシャヨーグルト': { cal: 65, p: 7.0, f: 0, c: 8.5, category: 'dairy' },
  'プロセスチーズ': { cal: 313, p: 22.7, f: 26.0, c: 1.3, category: 'dairy' },
  'クリームチーズ': { cal: 313, p: 8.2, f: 33.0, c: 2.3, category: 'dairy' },
  'モッツァレラチーズ': { cal: 269, p: 18.4, f: 19.9, c: 4.2, category: 'dairy' },
  'パルメザンチーズ': { cal: 445, p: 44.0, f: 30.8, c: 1.9, category: 'dairy' },
  'カッテージチーズ': { cal: 99, p: 13.3, f: 4.5, c: 1.9, category: 'dairy' },
  '生クリーム': { cal: 404, p: 2.0, f: 43.0, c: 3.1, category: 'dairy' },

  // ────────────────────────────────────────────
  // 大豆製品
  // ────────────────────────────────────────────
  '木綿豆腐':   { cal: 73,  p: 7.0, f: 4.9, c: 1.5, category: 'soy' },
  '絹ごし豆腐': { cal: 56,  p: 5.3, f: 3.5, c: 2.0, category: 'soy' },
  '焼き豆腐':   { cal: 82,  p: 7.8, f: 5.7, c: 1.0, category: 'soy' },
  '厚揚げ':     { cal: 143, p: 10.7, f: 11.3, c: 0.9, category: 'soy' },
  '油揚げ':     { cal: 377, p: 23.4, f: 34.4, c: 0.4, category: 'soy' },
  'がんもどき': { cal: 228, p: 15.3, f: 17.8, c: 1.6, category: 'soy' },
  '納豆':       { cal: 190, p: 16.5, f: 10.0, c: 12.1, category: 'soy' },
  'ひきわり納豆': { cal: 185, p: 16.6, f: 10.0, c: 10.5, category: 'soy' },
  '豆乳':       { cal: 44,  p: 3.6, f: 2.0, c: 3.1, category: 'soy' },
  '調製豆乳':   { cal: 63,  p: 3.2, f: 3.6, c: 4.8, category: 'soy' },
  '枝豆':       { cal: 118, p: 11.5, f: 6.1, c: 8.9, category: 'soy' },
  '高野豆腐':   { cal: 496, p: 50.5, f: 34.1, c: 3.9, category: 'soy' },
  'おから':     { cal: 88,  p: 6.1, f: 3.6, c: 13.8, category: 'soy' },
  'きな粉':     { cal: 451, p: 36.7, f: 25.7, c: 28.5, category: 'soy' },
  '豆腐':       { cal: 73,  p: 7.0, f: 4.9, c: 1.5, category: 'soy' },

  // ────────────────────────────────────────────
  // 野菜類（生）
  // ────────────────────────────────────────────
  'ブロッコリー': { cal: 37, p: 5.4, f: 0.6, c: 6.6, category: 'vegetable' },
  'ほうれん草': { cal: 18, p: 2.2, f: 0.4, c: 3.1, category: 'vegetable' },
  'キャベツ':   { cal: 21, p: 1.3, f: 0.2, c: 5.2, category: 'vegetable' },
  'トマト':     { cal: 20, p: 0.7, f: 0.1, c: 4.7, category: 'vegetable' },
  'ミニトマト': { cal: 30, p: 1.1, f: 0.1, c: 7.2, category: 'vegetable' },
  'にんじん':   { cal: 35, p: 0.7, f: 0.2, c: 9.3, category: 'vegetable' },
  'たまねぎ':   { cal: 33, p: 1.0, f: 0.1, c: 8.4, category: 'vegetable' },
  'もやし':     { cal: 15, p: 1.7, f: 0.1, c: 2.6, category: 'vegetable' },
  'レタス':     { cal: 11, p: 0.6, f: 0.1, c: 2.8, category: 'vegetable' },
  '大根':       { cal: 15, p: 0.5, f: 0.1, c: 4.1, category: 'vegetable' },
  'かぼちゃ':   { cal: 78, p: 1.6, f: 0.3, c: 20.6, category: 'vegetable' },
  'じゃがいも': { cal: 59, p: 1.8, f: 0.1, c: 17.3, category: 'vegetable' },
  'さつまいも': { cal: 126, p: 1.2, f: 0.2, c: 31.9, category: 'vegetable' },
  'ピーマン':   { cal: 20, p: 0.9, f: 0.2, c: 5.1, category: 'vegetable' },
  'パプリカ':   { cal: 28, p: 1.0, f: 0.2, c: 7.2, category: 'vegetable' },
  'なす':       { cal: 18, p: 1.1, f: 0.1, c: 5.1, category: 'vegetable' },
  'きゅうり':   { cal: 13, p: 1.0, f: 0.1, c: 3.0, category: 'vegetable' },
  '白菜':       { cal: 13, p: 0.8, f: 0.1, c: 3.2, category: 'vegetable' },
  '小松菜':     { cal: 13, p: 1.5, f: 0.2, c: 2.4, category: 'vegetable' },
  '水菜':       { cal: 23, p: 2.2, f: 0.1, c: 4.8, category: 'vegetable' },
  'ごぼう':     { cal: 58, p: 1.8, f: 0.1, c: 15.4, category: 'vegetable' },
  'れんこん':   { cal: 66, p: 1.9, f: 0.1, c: 16.1, category: 'vegetable' },
  'アスパラガス': { cal: 21, p: 2.6, f: 0.2, c: 3.9, category: 'vegetable' },
  'こんにゃく': { cal: 5,  p: 0.1, f: 0, c: 2.3, category: 'vegetable' },
  'オクラ':     { cal: 26, p: 2.1, f: 0.2, c: 6.6, category: 'vegetable' },
  'セロリ':     { cal: 12, p: 0.4, f: 0.1, c: 3.6, category: 'vegetable' },
  'ズッキーニ': { cal: 16, p: 1.3, f: 0.1, c: 2.8, category: 'vegetable' },
  'ニラ':       { cal: 18, p: 1.7, f: 0.3, c: 4.0, category: 'vegetable' },
  'もやし大豆': { cal: 29, p: 3.7, f: 1.5, c: 2.3, category: 'vegetable' },
  'チンゲン菜': { cal: 9,  p: 0.6, f: 0.1, c: 2.0, category: 'vegetable' },
  '春菊':       { cal: 20, p: 2.3, f: 0.3, c: 3.9, category: 'vegetable' },
  'にら':       { cal: 18, p: 1.7, f: 0.3, c: 4.0, category: 'vegetable' },
  'カリフラワー': { cal: 27, p: 3.0, f: 0.1, c: 5.2, category: 'vegetable' },
  'ゴーヤ':     { cal: 15, p: 1.0, f: 0.1, c: 3.9, category: 'vegetable' },
  '里芋':       { cal: 53, p: 1.5, f: 0.1, c: 13.1, category: 'vegetable' },
  '長芋':       { cal: 64, p: 2.2, f: 0.3, c: 13.9, category: 'vegetable' },
  'とうもろこし': { cal: 89, p: 3.6, f: 1.7, c: 16.8, category: 'vegetable' },

  // 薬味・香味
  'ねぎ':       { cal: 30,  p: 1.4, f: 0.1, c: 7.3, category: 'vegetable' },
  '長ねぎ':     { cal: 30,  p: 1.4, f: 0.1, c: 7.3, category: 'vegetable' },
  'しょうが':   { cal: 28,  p: 0.9, f: 0.3, c: 6.6, category: 'vegetable' },
  'にんにく':   { cal: 129, p: 6.0, f: 1.3, c: 27.5, category: 'vegetable' },
  '大葉':       { cal: 32,  p: 3.9, f: 0.1, c: 7.5, category: 'vegetable' },
  'みょうが':   { cal: 11,  p: 0.9, f: 0.1, c: 2.6, category: 'vegetable' },

  // ────────────────────────────────────────────
  // きのこ類
  // ────────────────────────────────────────────
  'しめじ':     { cal: 17, p: 2.7, f: 0.6, c: 4.8, category: 'mushroom' },
  'えのき':     { cal: 34, p: 2.7, f: 0.2, c: 7.6, category: 'mushroom' },
  'まいたけ':   { cal: 22, p: 2.0, f: 0.5, c: 4.4, category: 'mushroom' },
  'エリンギ':   { cal: 31, p: 2.8, f: 0.4, c: 6.0, category: 'mushroom' },
  'しいたけ':   { cal: 25, p: 3.0, f: 0.4, c: 5.7, category: 'mushroom' },
  'なめこ':     { cal: 15, p: 1.7, f: 0.2, c: 5.4, category: 'mushroom' },
  'きくらげ':   { cal: 13, p: 0.6, f: 0.2, c: 5.2, category: 'mushroom' },
  'マッシュルーム': { cal: 15, p: 2.9, f: 0.3, c: 2.1, category: 'mushroom' },

  // ────────────────────────────────────────────
  // 海藻類
  // ────────────────────────────────────────────
  'わかめ生':   { cal: 17, p: 1.9, f: 0.2, c: 3.0, category: 'seaweed' },
  'わかめ乾燥': { cal: 117, p: 13.6, f: 1.6, c: 8.6, category: 'seaweed' },
  '焼きのり':   { cal: 173, p: 41.4, f: 3.7, c: 3.1, category: 'seaweed' },
  '味付けのり': { cal: 179, p: 40.0, f: 3.5, c: 3.8, category: 'seaweed' },
  '昆布':       { cal: 145, p: 5.8, f: 1.2, c: 56.5, category: 'seaweed' },
  'もずく':     { cal: 4,  p: 0.2, f: 0.1, c: 1.4, category: 'seaweed' },
  'ひじき乾燥': { cal: 149, p: 9.2, f: 3.2, c: 58.4, category: 'seaweed' },

  // ────────────────────────────────────────────
  // 果物類
  // ────────────────────────────────────────────
  'バナナ':     { cal: 86,  p: 1.1, f: 0.2, c: 22.5, category: 'fruit' },
  'りんご':     { cal: 56,  p: 0.2, f: 0.3, c: 16.2, category: 'fruit' },
  'みかん':     { cal: 49,  p: 0.7, f: 0.1, c: 12.0, category: 'fruit' },
  'キウイ':     { cal: 51,  p: 1.0, f: 0.2, c: 13.4, category: 'fruit' },
  'いちご':     { cal: 31,  p: 0.9, f: 0.1, c: 8.5, category: 'fruit' },
  'ぶどう':     { cal: 58,  p: 0.4, f: 0.1, c: 15.7, category: 'fruit' },
  'グレープフルーツ': { cal: 36, p: 0.7, f: 0.1, c: 9.6, category: 'fruit' },
  'オレンジ':   { cal: 46,  p: 1.0, f: 0.1, c: 11.8, category: 'fruit' },
  'もも':       { cal: 38,  p: 0.6, f: 0.1, c: 10.2, category: 'fruit' },
  'なし':       { cal: 38,  p: 0.3, f: 0.1, c: 11.3, category: 'fruit' },
  'すいか':     { cal: 30,  p: 0.6, f: 0.1, c: 7.6, category: 'fruit' },
  'メロン':     { cal: 40,  p: 1.0, f: 0.1, c: 10.3, category: 'fruit' },
  'マンゴー':   { cal: 64,  p: 0.6, f: 0.1, c: 16.9, category: 'fruit' },
  'パイナップル': { cal: 53, p: 0.6, f: 0.1, c: 13.7, category: 'fruit' },
  'ブルーベリー': { cal: 48, p: 0.5, f: 0.1, c: 12.9, category: 'fruit' },
  'アボカド':   { cal: 176, p: 2.1, f: 17.5, c: 7.9, category: 'fruit' },
  '干しぶどう': { cal: 301, p: 2.7, f: 0.2, c: 80.7, category: 'fruit' },
  'ドライマンゴー': { cal: 321, p: 1.5, f: 0.4, c: 84.9, category: 'fruit' },
  'プルーン':   { cal: 235, p: 2.5, f: 0.2, c: 62.4, category: 'fruit' },

  // ────────────────────────────────────────────
  // ナッツ・種実類
  // ────────────────────────────────────────────
  'アーモンド': { cal: 587, p: 20.3, f: 51.8, c: 19.7, category: 'nuts' },
  'くるみ':     { cal: 674, p: 14.6, f: 68.8, c: 11.7, category: 'nuts' },
  'カシューナッツ': { cal: 576, p: 19.8, f: 47.6, c: 26.7, category: 'nuts' },
  'ピーナッツ': { cal: 585, p: 25.0, f: 49.4, c: 18.2, category: 'nuts' },
  'マカダミアナッツ': { cal: 720, p: 8.3, f: 76.7, c: 12.2, category: 'nuts' },
  'ピスタチオ': { cal: 601, p: 17.4, f: 56.1, c: 20.9, category: 'nuts' },
  'ごま':       { cal: 578, p: 20.3, f: 51.9, c: 18.4, category: 'nuts' },
  'チアシード': { cal: 454, p: 20.0, f: 33.0, c: 42.0, category: 'nuts' },

  // ────────────────────────────────────────────
  // 調味料・油脂（100gあたり）
  // ────────────────────────────────────────────
  'サラダ油':   { cal: 886, p: 0, f: 100, c: 0, category: 'oil' },
  'オリーブオイル': { cal: 894, p: 0, f: 100, c: 0, category: 'oil' },
  'ごま油':     { cal: 886, p: 0, f: 100, c: 0, category: 'oil' },
  'バター':     { cal: 700, p: 0.5, f: 81.0, c: 0.2, category: 'oil' },
  'マーガリン': { cal: 715, p: 0.4, f: 81.6, c: 0.5, category: 'oil' },
  'マヨネーズ': { cal: 668, p: 1.3, f: 74.7, c: 3.6, category: 'oil' },
  '味噌':       { cal: 182, p: 12.5, f: 6.0, c: 21.9, category: 'seasoning' },
  '醤油':       { cal: 62,  p: 7.7, f: 0, c: 10.1, category: 'seasoning' },
  '砂糖':       { cal: 384, p: 0, f: 0, c: 99.3, category: 'seasoning' },
  'みりん':     { cal: 225, p: 0.3, f: 0, c: 43.2, category: 'seasoning' },
  '料理酒':     { cal: 89,  p: 0.2, f: 0, c: 4.5, category: 'seasoning' },
  'ポン酢':     { cal: 46,  p: 1.9, f: 0, c: 9.2, category: 'seasoning' },
  'めんつゆ':   { cal: 88,  p: 2.9, f: 0, c: 17.5, category: 'seasoning' },
  'ケチャップ': { cal: 104, p: 1.7, f: 0.2, c: 25.9, category: 'seasoning' },
  'ソース':     { cal: 111, p: 0.9, f: 0.1, c: 26.3, category: 'seasoning' },
  '焼肉のたれ': { cal: 152, p: 2.0, f: 0.4, c: 33.0, category: 'seasoning' },
  '片栗粉':     { cal: 330, p: 0.1, f: 0.1, c: 81.6, category: 'seasoning' },
  '小麦粉':     { cal: 349, p: 8.0, f: 1.5, c: 75.8, category: 'seasoning' },
  'パン粉':     { cal: 370, p: 14.6, f: 6.0, c: 59.4, category: 'seasoning' },
  'はちみつ':   { cal: 303, p: 0.3, f: 0, c: 81.9, category: 'seasoning' },
  'カレールウ': { cal: 456, p: 6.5, f: 34.1, c: 38.3, category: 'seasoning' },
  'ドレッシング': { cal: 253, p: 0.8, f: 24.0, c: 10.0, category: 'seasoning' },
  'ごまドレッシング': { cal: 380, p: 2.0, f: 36.0, c: 18.0, category: 'seasoning' },

  // ────────────────────────────────────────────
  // プロテイン・サプリ
  // ────────────────────────────────────────────
  'プロテイン': { cal: 400, p: 80.0, f: 5.0, c: 8.3, category: 'supplement' },

  // ────────────────────────────────────────────
  // 飲料
  // ────────────────────────────────────────────
  'コーラ':     { cal: 46, p: 0, f: 0, c: 11.4, category: 'drink' },
  'オレンジジュース': { cal: 42, p: 0.4, f: 0.1, c: 10.0, category: 'drink' },
  'スポーツドリンク': { cal: 25, p: 0, f: 0, c: 6.2, category: 'drink' },
  'ビール':     { cal: 40, p: 0.3, f: 0, c: 3.1, category: 'drink' },
  '日本酒':     { cal: 109, p: 0.4, f: 0, c: 4.9, category: 'drink' },
  '焼酎':       { cal: 144, p: 0, f: 0, c: 0, category: 'drink' },
  'ワイン赤':   { cal: 68, p: 0.2, f: 0, c: 1.5, category: 'drink' },
  'ワイン白':   { cal: 75, p: 0.1, f: 0, c: 2.0, category: 'drink' },
};

// ================================================================
// 食材の標準使用量（gまたは個数→gの変換テーブル）
// ================================================================
const SERVING_SIZES = {
  // 穀類
  '白米':       { standard: 150, unitName: '杯' },
  '玄米':       { standard: 150, unitName: '杯' },
  'もち麦ご飯': { standard: 150, unitName: '杯' },
  '雑穀米':     { standard: 150, unitName: '杯' },
  '赤飯':       { standard: 150, unitName: '杯' },
  'うどん':     { standard: 200, unitName: '玉' },
  'そば':       { standard: 170, unitName: '玉' },
  'そうめん':   { standard: 200, unitName: '人前' },
  'パスタ':     { standard: 240, unitName: '人前' },
  '中華麺':     { standard: 200, unitName: '玉' },
  '食パン':     { standard: 60, unitName: '枚' },
  'フランスパン': { standard: 30, unitName: '切' },
  'ロールパン': { standard: 30, unitName: '個' },
  'ナン':       { standard: 80, unitName: '枚' },
  'オートミール': { standard: 30, unitName: '杯' },
  'もち':       { standard: 50, unitName: '個' },
  'グラノーラ': { standard: 60, unitName: '杯' },

  // 肉類
  'ベーコン':   { standard: 17, unitName: '枚' },
  'ウインナー': { standard: 20, unitName: '本' },
  'ソーセージ': { standard: 20, unitName: '本' },
  'ロースハム': { standard: 15, unitName: '枚' },
  'ハム':       { standard: 15, unitName: '枚' },
  'ボンレスハム': { standard: 15, unitName: '枚' },
  '生ハム':     { standard: 10, unitName: '枚' },

  // 卵
  '鶏卵':       { standard: 50, unitName: '個' },
  '卵白':       { standard: 30, unitName: '個分' },
  '卵黄':       { standard: 18, unitName: '個分' },
  'うずら卵':   { standard: 10, unitName: '個' },

  // 豆腐系
  '木綿豆腐':   { standard: 150, unitName: '半丁' },
  '絹ごし豆腐': { standard: 150, unitName: '半丁' },
  '豆腐':       { standard: 150, unitName: '半丁' },
  '焼き豆腐':   { standard: 150, unitName: '半丁' },
  '厚揚げ':     { standard: 100, unitName: '枚' },
  '油揚げ':     { standard: 30, unitName: '枚' },
  'がんもどき': { standard: 60, unitName: '個' },
  '納豆':       { standard: 45, unitName: 'パック' },
  'ひきわり納豆': { standard: 45, unitName: 'パック' },
  '高野豆腐':   { standard: 16, unitName: '個' },

  // 乳製品
  '牛乳':       { standard: 200, unitName: 'ml' },
  '低脂肪牛乳': { standard: 200, unitName: 'ml' },
  'プロセスチーズ': { standard: 18, unitName: '枚' },
  'クリームチーズ': { standard: 20, unitName: '個' },

  // 魚介
  'ちくわ':     { standard: 30, unitName: '本' },
  'かまぼこ':   { standard: 10, unitName: '切' },
  'はんぺん':   { standard: 60, unitName: '枚' },

  // 缶詰
  'ツナ缶水煮': { standard: 70, unitName: '缶' },
  'ツナ缶油漬': { standard: 70, unitName: '缶' },
  'サバ缶水煮': { standard: 190, unitName: '缶' },
  'サバ缶味噌煮': { standard: 190, unitName: '缶' },
  'サンマ缶蒲焼': { standard: 100, unitName: '缶' },
  'いわし缶水煮': { standard: 100, unitName: '缶' },

  // 果物
  'バナナ':     { standard: 100, unitName: '本' },
  'りんご':     { standard: 150, unitName: '半分' },
  'みかん':     { standard: 80, unitName: '個' },
  'キウイ':     { standard: 85, unitName: '個' },
  'アボカド':   { standard: 70, unitName: '半分' },

  // 薬味
  'ねぎ':       { standard: 15, unitName: '本分' },
  '長ねぎ':     { standard: 15, unitName: '本分' },
  'しょうが':   { standard: 10, unitName: 'かけ' },
  '生姜':       { standard: 10, unitName: 'かけ' },
  'にんにく':   { standard: 6, unitName: 'かけ' },
  '大葉':       { standard: 0.5, unitName: '枚' },

  // ナッツ
  'アーモンド': { standard: 1.5, unitName: '粒' },
  'くるみ':     { standard: 4, unitName: '粒' },

  // プロテイン
  'プロテイン': { standard: 30, unitName: '杯' },

  // 海藻
  'わかめ生':   { standard: 30, unitName: '人前' },
  'わかめ乾燥': { standard: 2, unitName: 'つまみ' },
  '焼きのり':   { standard: 3, unitName: '枚' },
  '味付けのり': { standard: 3, unitName: '枚' },
  'もずく':     { standard: 80, unitName: 'パック' },

  // 調味料
  'サラダ油':   { standard: 12, unitName: '大さじ' },
  'オリーブオイル': { standard: 12, unitName: '大さじ' },
  'ごま油':     { standard: 12, unitName: '大さじ' },
  'バター':     { standard: 10, unitName: '個' },
  'マヨネーズ': { standard: 12, unitName: '大さじ' },
  '味噌':       { standard: 18, unitName: '大さじ' },
  '醤油':       { standard: 18, unitName: '大さじ' },
  '砂糖':       { standard: 9, unitName: '大さじ' },
  'みりん':     { standard: 18, unitName: '大さじ' },
  '料理酒':     { standard: 15, unitName: '大さじ' },
  'ポン酢':     { standard: 18, unitName: '大さじ' },
  'めんつゆ':   { standard: 18, unitName: '大さじ' },
  'ケチャップ': { standard: 15, unitName: '大さじ' },
  'ソース':     { standard: 18, unitName: '大さじ' },
  '焼肉のたれ': { standard: 17, unitName: '大さじ' },
  '片栗粉':     { standard: 9, unitName: '大さじ' },
  '小麦粉':     { standard: 9, unitName: '大さじ' },
  'パン粉':     { standard: 3, unitName: '大さじ' },
  'はちみつ':   { standard: 21, unitName: '大さじ' },
  'ドレッシング': { standard: 15, unitName: '大さじ' },
  'ごまドレッシング': { standard: 15, unitName: '大さじ' },
  'ごま':       { standard: 9, unitName: '大さじ' },
};

// ================================================================
// 調理法データベース（カロリー・脂質の変化率）
// ================================================================
const COOKING_METHODS = {
  '生':   { calMult: 1.00, fAdd: 0,  desc: 'そのまま' },
  '蒸す': { calMult: 1.00, fAdd: 0,  desc: '蒸し' },
  '茹でる': { calMult: 0.95, fAdd: 0, desc: '茹で' },
  '煮る': { calMult: 1.05, fAdd: 0,  desc: '煮' },
  '焼く': { calMult: 1.05, fAdd: 2,  desc: '焼き' },
  'グリル': { calMult: 0.95, fAdd: 0, desc: 'グリル' },
  '炒める': { calMult: 1.15, fAdd: 5, desc: '炒め' },
  'ソテー': { calMult: 1.15, fAdd: 5, desc: 'ソテー' },
  '揚げる': { calMult: 1.50, fAdd: 10, desc: '揚げ' },
  '素揚げ': { calMult: 1.30, fAdd: 7, desc: '素揚げ' },
  '天ぷら': { calMult: 1.60, fAdd: 12, desc: '天ぷら' },
  'フライ': { calMult: 1.60, fAdd: 12, desc: 'フライ' },
  '電子レンジ': { calMult: 1.00, fAdd: 0, desc: 'レンジ' },
  '刺身': { calMult: 1.00, fAdd: 0, desc: '刺身' },
};

// ================================================================
// エイリアス（表記揺れ → 正規名）
// ================================================================
const FOOD_ALIASES = {
  // 穀類
  'ご飯': '白米', 'ごはん': '白米', 'ライス': '白米', '米': '白米',
  'はくまい': '白米', 'げんまい': '玄米', '雑穀ご飯': '雑穀米',
  '雑穀ごはん': '雑穀米', '十六穀米': '雑穀米', 'もち麦': 'もち麦ご飯',
  'スパゲッティ': 'パスタ', 'スパゲティ': 'パスタ',
  'パン': '食パン', 'トースト': '食パン',
  '餅': 'もち', 'おもち': 'もち',
  // 鶏肉
  '鶏むね肉': '鶏胸肉', 'むね肉': '鶏胸肉', '胸肉': '鶏胸肉',
  'もも肉': '鶏もも肉', '鳥胸肉': '鶏胸肉', '鳥もも肉': '鶏もも肉',
  '鳥ささみ': '鶏ささみ', 'ささみ': '鶏ささみ', '鶏肉': '鶏胸肉',
  // 豚肉
  '豚肉': '豚もも肉', '豚もも': '豚もも肉', '豚ヒレ': '豚ヒレ肉',
  '豚ひれ肉': '豚ヒレ肉', '豚ひれ': '豚ヒレ肉',
  // 牛肉
  '牛肉': '牛もも肉', '牛もも': '牛もも肉', '牛モモ肉': '牛もも肉', '牛モモ': '牛もも肉',
  // 魚
  'サケ': '鮭', 'さけ': '鮭', 'しゃけ': '鮭', '鯖': 'サバ', 'さば': 'サバ',
  'まぐろ': 'マグロ赤身', 'マグロ': 'マグロ赤身', '鮪': 'マグロ赤身',
  'たら': 'タラ', '鱈': 'タラ', 'あじ': 'アジ', '鰺': 'アジ',
  'ぶり': 'ブリ', '鰤': 'ブリ', 'えび': 'エビ', '海老': 'エビ',
  'いか': 'イカ', '烏賊': 'イカ', 'たこ': 'タコ', '蛸': 'タコ',
  'かつお': 'カツオ', '鰹': 'カツオ', 'サンマ': 'さんま', '秋刀魚': 'さんま',
  'ほたて': 'ホタテ', '帆立': 'ホタテ', 'アサリ': 'あさり', '浅利': 'あさり',
  'さわら': 'サワラ', 'たい': 'タイ', 'ひらめ': 'ヒラメ',
  'かれい': 'カレイ', 'かき': 'カキ', '牡蠣': 'カキ',
  'しらす': 'しらす干し', 'いわし': 'いわし',
  'ツナ缶': 'ツナ缶水煮', 'サバ缶': 'サバ缶水煮',
  // 卵
  '卵': '鶏卵', 'たまご': '鶏卵', 'タマゴ': '鶏卵', 'ゆで卵': '鶏卵',
  '目玉焼き': '鶏卵', 'スクランブルエッグ': '鶏卵',
  // 乳製品
  'ヨーグルト': 'ヨーグルト無糖', 'チーズ': 'プロセスチーズ', 'スライスチーズ': 'プロセスチーズ',
  'ぎゅうにゅう': '牛乳',
  // 豆腐
  'とうふ': '豆腐', '絹豆腐': '絹ごし豆腐', 'なっとう': '納豆',
  // 海藻
  'わかめ': 'わかめ生', 'のり': '焼きのり',
  // 野菜
  '玉ねぎ': 'たまねぎ', '玉葱': 'たまねぎ', 'タマネギ': 'たまねぎ',
  '人参': 'にんじん', 'ニンジン': 'にんじん',
  'キノコ': 'しめじ', 'きのこ': 'しめじ',
  'ホウレン草': 'ほうれん草', 'ほうれんそう': 'ほうれん草',
  'ネギ': 'ねぎ', '葱': 'ねぎ', 'ニンニク': 'にんにく', '大蒜': 'にんにく',
  'ショウガ': 'しょうが', '生姜': 'しょうが',
  'ゴマ': 'ごま', '胡麻': 'ごま', 'ダイコン': '大根', 'ナス': 'なす', '茄子': 'なす',
  // 調味料
  '油': 'サラダ油', '鶏ガラスープの素': 'コンソメ', '鶏がらスープの素': 'コンソメ',
  'しお': '塩', 'コショウ': 'こしょう', '胡椒': 'こしょう', '酒': '料理酒',
  // ナッツ
  'アーモンドナッツ': 'アーモンド', 'クルミ': 'くるみ', '胡桃': 'くるみ',
  'ピーナツ': 'ピーナッツ', '落花生': 'ピーナッツ',
};

// 塩・こしょう（カロリー0なので別管理）
const ZERO_CAL_ITEMS = { '塩': true, 'こしょう': true, '少々': true };

// ================================================================
// FOOD_DB を FOOD_DB_RAW + SERVING_SIZES から自動生成
// 方針:
//   SERVING_SIZESがある食材 → 1単位(個,本,枚等)あたりの値を算出, per=1
//   SERVING_SIZESがない食材 → 100gあたりの値, unit='g', per=100
// ================================================================
const FOOD_DB = {};
for (const [name, raw] of Object.entries(FOOD_DB_RAW)) {
  const ss = SERVING_SIZES[name];
  if (ss) {
    const ratio = ss.standard / 100;
    const isGramUnit = (ss.unitName === 'g' || ss.unitName === 'ml'
      || ss.unitName === '杯' && ss.standard >= 100   // ご飯1杯=150g → g/150
      || ss.unitName === '玉' && ss.standard >= 100
      || ss.unitName === '人前' && ss.standard >= 100);

    if (isGramUnit) {
      // グラムベース: 100gあたりの値を保持、per = serving size
      FOOD_DB[name] = {
        p: raw.p, f: raw.f, c: raw.c, cal: raw.cal,
        unit: 'g', per: 100,
        _raw100: raw, _serving: ss.standard, _unitName: ss.unitName
      };
    } else {
      // 個数ベース（枚/本/個/パック等）: 1単位あたりの値に換算
      FOOD_DB[name] = {
        p: Math.round(raw.p * ratio * 1000) / 1000,
        f: Math.round(raw.f * ratio * 1000) / 1000,
        c: Math.round(raw.c * ratio * 1000) / 1000,
        cal: Math.round(raw.cal * ratio * 10) / 10,
        unit: ss.unitName, per: 1,
        _raw100: raw, _serving: ss.standard, _unitName: ss.unitName
      };
    }
  } else {
    // SERVING_SIZESなし: 100gあたり
    FOOD_DB[name] = {
      p: raw.p, f: raw.f, c: raw.c, cal: raw.cal,
      unit: 'g', per: 100,
      _raw100: raw
    };
  }
}
// 塩・こしょう・コンソメ（特殊）
FOOD_DB['塩'] = { p: 0, f: 0, c: 0, cal: 0, unit: '小さじ', per: 1, _raw100: { cal: 0, p: 0, f: 0, c: 0 } };
FOOD_DB['こしょう'] = { p: 0, f: 0, c: 0, cal: 0, unit: '少々', per: 1, _raw100: { cal: 0, p: 0, f: 0, c: 0 } };
FOOD_DB['コンソメ'] = { p: 0.2, f: 0.1, c: 1.0, cal: 5, unit: '小さじ', per: 1, _raw100: { cal: 5, p: 0.2, f: 0.1, c: 1.0 } };

// ================================================================
// コンビニ商品・外食（1食/1個あたりの固定値）
// ================================================================
const PREPARED_FOODS = {
  'サラダチキン':     { p: 23.8, f: 1.5, c: 0.3, cal: 110, unit: '個' },
  'おにぎり':         { p: 2.8, f: 0.5, c: 39.0, cal: 170, unit: '個' },
  'おにぎり鮭':       { p: 4.8, f: 1.2, c: 39.0, cal: 186, unit: '個' },
  'おにぎりツナマヨ': { p: 4.5, f: 4.0, c: 37.0, cal: 210, unit: '個' },
  'おにぎり昆布':     { p: 3.2, f: 0.5, c: 39.5, cal: 174, unit: '個' },
  'おにぎり明太子':   { p: 4.0, f: 0.8, c: 38.5, cal: 178, unit: '個' },
  'おにぎり梅':       { p: 3.0, f: 0.4, c: 38.5, cal: 170, unit: '個' },
  '玄米おにぎり':     { p: 3.2, f: 0.8, c: 37.0, cal: 170, unit: '個' },
  'サンドイッチツナ': { p: 9.5, f: 11.0, c: 27.0, cal: 250, unit: '個' },
  'サンドイッチたまご': { p: 8.5, f: 10.0, c: 25.0, cal: 225, unit: '個' },
  'サンドイッチハムレタス': { p: 9.0, f: 7.5, c: 23.0, cal: 200, unit: '個' },
  'サンドイッチチキン': { p: 13.0, f: 9.5, c: 25.0, cal: 240, unit: '個' },
  'サンドイッチ':     { p: 9.5, f: 11.0, c: 27.0, cal: 250, unit: '個' },
  '焼き鳥缶詰':      { p: 14.0, f: 6.0, c: 5.0, cal: 130, unit: '缶' },
  'プロテインドリンク': { p: 15.0, f: 0, c: 5.0, cal: 85, unit: '本' },
  'プロテインバー':   { p: 15.0, f: 6.0, c: 18.0, cal: 190, unit: '本' },
  '野菜ジュース':     { p: 1.0, f: 0, c: 15.0, cal: 65, unit: '本' },
  'カットサラダ':     { p: 1.0, f: 0.2, c: 4.0, cal: 20, unit: '袋' },
  'カップスープ':     { p: 1.5, f: 2.0, c: 9.0, cal: 60, unit: '個' },
  // 汁物
  '味噌汁':           { p: 4.5, f: 2.0, c: 4.0, cal: 50, unit: '杯' },
  '味噌汁豆腐わかめ': { p: 4.5, f: 2.0, c: 4.0, cal: 50, unit: '杯' },
  '味噌汁野菜':       { p: 2.0, f: 1.0, c: 5.0, cal: 35, unit: '杯' },
  'コンソメスープ':   { p: 1.0, f: 0.5, c: 4.0, cal: 25, unit: '杯' },
  '豚汁':             { p: 7.5, f: 5.0, c: 8.0, cal: 105, unit: '杯' },
  'わかめスープ':     { p: 0.8, f: 0.5, c: 1.5, cal: 12, unit: '杯' },
  'スープ':           { p: 2.0, f: 1.0, c: 4.0, cal: 35, unit: '杯' },
  'インスタント味噌汁': { p: 1.5, f: 0.8, c: 3.0, cal: 25, unit: '杯' },
  '卵スープ':         { p: 3.5, f: 2.5, c: 1.5, cal: 42, unit: '杯' },
  'コーンスープ':     { p: 2.0, f: 3.5, c: 10.0, cal: 80, unit: '杯' },
  'サラダ':           { p: 1.5, f: 3.0, c: 5.0, cal: 45, unit: '皿' },
  // 外食・定食
  '牛丼':             { p: 22.0, f: 22.0, c: 82.0, cal: 660, unit: '杯' },
  '牛丼並盛':         { p: 22.0, f: 22.0, c: 82.0, cal: 660, unit: '杯' },
  'ざるそば':         { p: 10.0, f: 2.0, c: 48.0, cal: 260, unit: '食' },
  '親子丼':           { p: 28.0, f: 14.0, c: 85.0, cal: 600, unit: '杯' },
  '海鮮丼':           { p: 28.0, f: 5.0, c: 78.0, cal: 480, unit: '杯' },
  'カレーライス':     { p: 14.0, f: 16.0, c: 95.0, cal: 600, unit: '食' },
  '焼き鳥定食':       { p: 28.0, f: 12.0, c: 68.0, cal: 510, unit: '食' },
  '鶏照り焼き定食':   { p: 30.0, f: 14.0, c: 72.0, cal: 550, unit: '食' },
  '冷やし中華':       { p: 14.0, f: 8.0, c: 58.0, cal: 370, unit: '食' },
  '幕の内弁当':       { p: 20.0, f: 18.0, c: 88.0, cal: 600, unit: '個' },
  '弁当':             { p: 20.0, f: 18.0, c: 88.0, cal: 600, unit: '個' },
  'チャーハン':       { p: 12.0, f: 14.0, c: 62.0, cal: 440, unit: '食' },
  '味噌ラーメン':     { p: 18.0, f: 16.0, c: 62.0, cal: 480, unit: '食' },
  '醤油ラーメン':     { p: 17.0, f: 12.0, c: 58.0, cal: 420, unit: '食' },
  'とんかつ定食':     { p: 25.0, f: 32.0, c: 80.0, cal: 750, unit: '食' },
  '焼き魚定食':       { p: 24.0, f: 8.0, c: 68.0, cal: 450, unit: '食' },
  '唐揚げ定食':       { p: 25.0, f: 26.0, c: 78.0, cal: 680, unit: '食' },
  'ハンバーグ':       { p: 15.0, f: 14.0, c: 10.0, cal: 225, unit: '個' },
  '餃子':             { p: 3.5, f: 3.0, c: 5.5, cal: 62, unit: '個' },
  '焼き餃子':         { p: 3.5, f: 3.0, c: 5.5, cal: 62, unit: '個' },
  'シュウマイ':       { p: 3.0, f: 2.5, c: 4.0, cal: 48, unit: '個' },
  'エビフライ':       { p: 9.5, f: 7.5, c: 6.0, cal: 132, unit: '本' },
  'コロッケ':         { p: 4.5, f: 9.5, c: 17.0, cal: 175, unit: '個' },
  'オムライス':       { p: 17.0, f: 18.0, c: 68.0, cal: 520, unit: '食' },
  '焼きそば':         { p: 11.0, f: 12.0, c: 53.0, cal: 380, unit: '食' },
  'お好み焼き':       { p: 14.0, f: 12.0, c: 48.0, cal: 370, unit: '食' },
  'たこ焼き':         { p: 9.0, f: 10.0, c: 34.0, cal: 270, unit: '人前' },
  'ピザ':             { p: 11.0, f: 9.5, c: 28.0, cal: 250, unit: '切' },
  'フライドポテト':   { p: 3.0, f: 14.0, c: 34.0, cal: 280, unit: '食' },
  '肉じゃが':         { p: 11.0, f: 7.0, c: 24.0, cal: 210, unit: '食' },
  '生姜焼き':         { p: 21.0, f: 18.0, c: 5.0, cal: 275, unit: '食' },
  'ポテトサラダ':     { p: 3.0, f: 7.5, c: 14.0, cal: 140, unit: '皿' },
  'ツナサラダ':       { p: 9.5, f: 7.5, c: 5.0, cal: 125, unit: '皿' },
};

// PREPARED_FOODSをFOOD_DBに統合（per=1の固定）
for (const [name, data] of Object.entries(PREPARED_FOODS)) {
  if (!FOOD_DB[name]) {
    FOOD_DB[name] = { ...data, per: 1 };
  }
}

// PREPARED_FOODSのエイリアス
const PREPARED_ALIASES = {
  '焼き鳥缶': '焼き鳥缶詰', '焼鳥缶': '焼き鳥缶詰', 'やきとり缶': '焼き鳥缶詰',
  'みそ汁': '味噌汁', 'みそしる': '味噌汁', 'インスタントみそ汁': 'インスタント味噌汁',
  '即席味噌汁': 'インスタント味噌汁', 'たまごスープ': '卵スープ', '玉子スープ': '卵スープ',
  'ツナサンド': 'サンドイッチツナ', 'たまごサンド': 'サンドイッチたまご',
  '卵サンド': 'サンドイッチたまご', 'ハムサンド': 'サンドイッチハムレタス',
  'チキンサンド': 'サンドイッチチキン',
  '鮭おにぎり': 'おにぎり鮭', 'しゃけおにぎり': 'おにぎり鮭',
  'ツナマヨおにぎり': 'おにぎりツナマヨ', '昆布おにぎり': 'おにぎり昆布',
  '明太子おにぎり': 'おにぎり明太子', '梅おにぎり': 'おにぎり梅',
  'しょうが焼き': '生姜焼き', 'からあげ': '唐揚げ定食',
  'ぎょうざ': '焼き餃子', 'ギョウザ': '焼き餃子',
  'プロテインバー1本': 'プロテインバー', '野菜ジュース1本': '野菜ジュース',
};
Object.assign(FOOD_ALIASES, PREPARED_ALIASES);

// ================================================================
// 食材名検索
// ================================================================
function lookupFood(name) {
  const n = name.trim();
  // 直接一致
  if (FOOD_DB[n]) return { ...FOOD_DB[n], name: n };
  // エイリアス
  const a = FOOD_ALIASES[n];
  if (a && FOOD_DB[a]) return { ...FOOD_DB[a], name: a };
  // 部分一致（最長優先）
  let best = null, bestLen = 0;
  for (const key of Object.keys(FOOD_DB)) {
    if ((n.includes(key) || key.includes(n)) && key.length > bestLen) {
      best = key; bestLen = key.length;
    }
  }
  if (best) return { ...FOOD_DB[best], name: best };
  // エイリアス部分一致
  for (const [alias, target] of Object.entries(FOOD_ALIASES)) {
    if ((n.includes(alias) || alias.includes(n)) && alias.length > bestLen && FOOD_DB[target]) {
      best = target; bestLen = alias.length;
    }
  }
  if (best) return { ...FOOD_DB[best], name: best };
  return null;
}

// ================================================================
// 量パーサー（"150g", "2個", "1切れ", "大さじ1" etc.）
// ================================================================

// 「切れ」「切」等の単位→グラム変換
const PIECE_GRAMS = {
  fish: 80, meat: 100, vegetable: 50, default: 80
};

function parseAmount(amountStr, foodEntry) {
  const str = amountStr.trim();

  // 「半丁」「半分」「1/2」
  if (/半丁|半分|1\/2/.test(str)) return 1;
  if (/1丁/.test(str)) return 2;

  // グラム指定
  const gMatch = str.match(/([\d.]+)\s*g/i);
  if (gMatch) {
    const g = parseFloat(gMatch[1]);
    if (foodEntry.unit === 'g') {
      // per=100のg系 → g/100
      return g / foodEntry.per;
    }
    // 個数系（本/枚/パック等）にグラム指定 → _raw100から計算
    // 例: バナナ(unit=本,per=1)に "100g" → 100gの値 = _raw100の1倍
    // foodEntry.calは1単位分(=_serving g)の値なので、g指定なら raw100基準で計算
    if (foodEntry._serving) {
      return g / foodEntry._serving;
    }
    return g / 100;
  }

  // ml指定
  const mlMatch = str.match(/([\d.]+)\s*ml/i);
  if (mlMatch) {
    const ml = parseFloat(mlMatch[1]);
    if (foodEntry.unit === 'g' && foodEntry.per === 100) {
      // 牛乳等: per=100 → ml/100
      return ml / 100;
    }
    return ml / 200;
  }

  // 大さじ・小さじ
  const spoonMatch = str.match(/(?:[大小]さじ\s*([\d.]+)|([\d.]+)\s*[大小]さじ)/);
  if (spoonMatch) {
    const num = parseFloat(spoonMatch[1] || spoonMatch[2]);
    const isSmall = str.includes('小さじ');
    if (foodEntry.unit === '大さじ') {
      return isSmall ? (num / 3) / foodEntry.per : num / foodEntry.per;
    }
    if (foodEntry.unit === '小さじ') {
      return isSmall ? num / foodEntry.per : (num * 3) / foodEntry.per;
    }
    // 調味料系だがunitが大さじ/小さじでない場合
    if (foodEntry.unit === 'g') {
      const spoonG = isSmall ? 5 * num : 15 * num;
      return spoonG / foodEntry.per;
    }
    return isSmall ? num / 3 : num;
  }

  // 「切れ」「切」(魚の切り身等) → 1切れ = 約80g
  if (/切れ|切/.test(str)) {
    const numM = str.match(/([\d.]+)/);
    const cnt = numM ? parseFloat(numM[1]) : 1;
    if (foodEntry.unit === 'g') return (cnt * 80) / foodEntry.per;
    return cnt;
  }

  // 数値 + 和単位（個/本/枚/杯/パック/缶/皿/食/人前/丁 etc.）
  const numMatch = str.match(/([\d.]+)/);
  if (numMatch) {
    const num = parseFloat(numMatch[1]);

    if (foodEntry.unit === 'g') {
      // g系の食材に「2個」「3本」「1杯」等が来た場合
      // → 標準サイズ × 個数で計算
      if (/個|本|杯|枚|パック|缶|皿|食|人前|玉|丁|粒/.test(str)) {
        const servingG = foodEntry._serving || 100;
        return (num * servingG) / foodEntry.per;
      }
      // 純粋な数字のみ → g扱い
      return num / foodEntry.per;
    }
    // 個数系 (unit=本/枚/個 etc.) → そのまま個数
    return num / foodEntry.per;
  }

  return 1;
}

// ================================================================
// [ITEMS:]タグパーサー
// ================================================================
function parseNutritionItems(text) {
  const results = [];
  const tagPattern = /\[ITEMS:\s*([^\]]+)\]/g;
  let match;
  while ((match = tagPattern.exec(text)) !== null) {
    const items = match[1].split(',').map(item => {
      const trimmed = item.trim();
      const parts = trimmed.match(/^(.+?)\s+([\d./半]+\s*[a-zA-Zぁ-ん丁分枚個本杯パック人前玉切皿食缶大さじ小さじ切れ]*)\s*$/);
      if (parts) return { name: parts[1].trim(), amount: parts[2].trim() };
      const parts2 = trimmed.match(/^(.+?)\s+([大小]さじ[\d./]+)\s*$/);
      if (parts2) return { name: parts2[1].trim(), amount: parts2[2].trim() };
      return { name: trimmed, amount: '1' };
    });
    results.push({ tag: match[0], items });
  }
  return results;
}

// ================================================================
// 不明食材推定
// ================================================================
function estimateUnknownFood(name, amount) {
  let grams = 100;
  const gMatch = amount.match(/([\d.]+)\s*g/i);
  if (gMatch) grams = parseFloat(gMatch[1]);
  const numMatch = amount.match(/([\d.]+)/);
  const num = numMatch ? parseFloat(numMatch[1]) : 1;

  if (/[大小]さじ|少々/.test(amount) || /たれ|ソース|つゆ|ドレッシング|酢/.test(name)) {
    const isSmall = /小さじ|少々/.test(amount);
    const mult = isSmall ? num * 0.3 : num;
    return { p: 0, f: Math.round(mult * 1), c: Math.round(mult * 3), cal: Math.round(mult * 20), estimated: true };
  }

  const r = grams / 100;

  if (/肉|チキン|ポーク|ビーフ|ハンバーグ|つくね|そぼろ|焼き鳥|照り焼き/.test(name))
    return { p: Math.round(20*r), f: Math.round(10*r), c: 0, cal: Math.round(180*r), estimated: true };
  if (/魚|刺身|焼き魚|煮魚/.test(name))
    return { p: Math.round(20*r), f: Math.round(5*r), c: 0, cal: Math.round(130*r), estimated: true };
  if (/丼|定食/.test(name))
    return { p: Math.round(25*num), f: Math.round(15*num), c: Math.round(80*num), cal: Math.round(580*num), estimated: true };
  if (/ご飯|ごはん|ライス|米|おにぎり/.test(name))
    return { p: Math.round(2.5*r), f: Math.round(0.3*r), c: Math.round(37.1*r), cal: Math.round(168*r), estimated: true };
  if (/麺|ラーメン|うどん|そば|パスタ|スパゲ/.test(name))
    return { p: Math.round(10*num), f: Math.round(3*num), c: Math.round(55*num), cal: Math.round(300*num), estimated: true };
  if (/卵|たまご|エッグ/.test(name))
    return { p: Math.round(6.1*num), f: Math.round(5.1*num), c: Math.round(0.2*num), cal: Math.round(71*num), estimated: true };
  if (/豆腐|とうふ|納豆|豆乳|大豆/.test(name))
    return { p: Math.round(7*r), f: Math.round(5*r), c: Math.round(2*r), cal: Math.round(73*r), estimated: true };
  if (/野菜|サラダ|ほうれん|キャベツ|レタス|ねぎ|もやし|大根|白菜|きゅうり|トマト|にんじん/.test(name))
    return { p: Math.round(1.5*r), f: Math.round(0.2*r), c: Math.round(4*r), cal: Math.round(20*r), estimated: true };
  if (/きのこ|しめじ|えのき|まいたけ|わかめ|海藻|のり|昆布/.test(name))
    return { p: Math.round(2.5*r), f: Math.round(0.4*r), c: Math.round(5*r), cal: Math.round(22*r), estimated: true };
  if (/スープ|汁|みそ汁/.test(name))
    return { p: Math.round(3*num), f: Math.round(1*num), c: Math.round(4*num), cal: Math.round(40*num), estimated: true };
  if (/ジュース|ドリンク|飲料|お茶|コーヒー/.test(name))
    return { p: Math.round(1*num), f: 0, c: Math.round(12*num), cal: Math.round(50*num), estimated: true };

  return { p: Math.round(2*r), f: Math.round(1*r), c: Math.round(5*r), cal: Math.round(35*r), estimated: true };
}

// ================================================================
// 調理法検出
// ================================================================
function detectCookingOilAdjustment(text) {
  if (/揚げ|フライ|天ぷら|天婦羅|フリッター/.test(text)) return { f: 10, cal: 90, method: '揚げ' };
  if (/炒め|ソテー|チャーハン|焼きそば|野菜炒め|回鍋肉/.test(text)) return { f: 5, cal: 45, method: '炒め' };
  if (/焼き|グリル|ムニエル|ステーキ/.test(text)) return { f: 2, cal: 18, method: '焼き' };
  return null;
}

// ================================================================
// PFC計算
// ================================================================
function calculateItemsPFC(items, contextText) {
  let totalP = 0, totalF = 0, totalC = 0, totalCal = 0;
  const details = [], unknowns = [], estimated = [];

  for (const item of items) {
    const food = lookupFood(item.name);
    if (food) {
      const mult = parseAmount(item.amount, food);
      const p = Math.round(food.p * mult * 10) / 10;
      const f = Math.round(food.f * mult * 10) / 10;
      const c = Math.round(food.c * mult * 10) / 10;
      const cal = Math.round(food.cal * mult);
      totalP += p; totalF += f; totalC += c; totalCal += cal;
      details.push({ name: item.name, amount: item.amount, p, f, c, cal });
    } else {
      const est = estimateUnknownFood(item.name, item.amount);
      totalP += est.p; totalF += est.f; totalC += est.c; totalCal += est.cal;
      estimated.push(item.name);
      details.push({ name: item.name, amount: item.amount, ...est });
    }
  }

  let cookingAdj = null;
  if (contextText) {
    const hasOil = items.some(i => /油|オイル|バター|マヨ/.test(i.name));
    if (!hasOil) {
      cookingAdj = detectCookingOilAdjustment(contextText);
      if (cookingAdj) { totalF += cookingAdj.f; totalCal += cookingAdj.cal; }
    }
  }

  return {
    p: Math.round(totalP), f: Math.round(totalF),
    c: Math.round(totalC), cal: Math.round(totalCal),
    details, unknowns, estimated, cookingAdj
  };
}

// ================================================================
// 1食目安PFC
// ================================================================
// 目的別PFCバランス（科学的エビデンスベース）
// reduction: Layman(2003), Leidy(2015), ISSN(2017) — P35% F25% C40%
// muscle:    Phillips & Van Loon(2011), Burke(2011) — P25% F20% C55%
// stamina:   IOC(2011), Hawley & Burke(1997), Thomas(2016) — P20% F20% C60%
// recovery:  日本消化器病学会GL, Maughan & Shirreffs(2004) — P15% F15% C70%
// toning:    Barakat(2020), Helms(2014) — P30% F25% C45%
const GOAL_COEFFICIENTS = {
  reduction: { calPerKg: 26, pRatio: 0.35, fRatio: 0.25, cRatio: 0.40 },
  muscle:    { calPerKg: 37, pRatio: 0.25, fRatio: 0.20, cRatio: 0.55 },
  stamina:   { calPerKg: 35, pRatio: 0.20, fRatio: 0.20, cRatio: 0.60 },
  recovery:  { calPerKg: 30, pRatio: 0.15, fRatio: 0.15, cRatio: 0.70 },
  toning:    { calPerKg: 30, pRatio: 0.30, fRatio: 0.25, cRatio: 0.45 }
};

// 時間帯別カロリー配分（PFC比率は目的別比率をそのまま使用）
const TIME_DISTRIBUTION = {
  '朝': 0.30,
  '昼': 0.35,
  '夕方': 0.25,
  '夜': 0.20,
  '間食': 0.10
};

const HUNGER_ADJUSTMENT = {
  'かなり空腹': 1.10,
  '少し空腹': 1.0,
  'そこまで空腹じゃない': 0.90,
  'なんとなく食べたい': 1.0,
  '食欲がない': 0.75,    // 体調不良時: 70〜80%の中間
  '体調が悪い': 0.75
};

// サイズ倍率
const SIZE_ADJUSTMENT = {
  '小盛り': 0.7,
  '普通': 1.0,
  '大盛り': 1.3
};

function getGoalCoefficients(goalNum) {
  switch (goalNum) {
    case '1': return GOAL_COEFFICIENTS.reduction;
    case '2': return GOAL_COEFFICIENTS.muscle;
    case '3': return GOAL_COEFFICIENTS.stamina;
    case '4': return GOAL_COEFFICIENTS.recovery;
    case '5': return GOAL_COEFFICIENTS.toning;
    default: return GOAL_COEFFICIENTS.stamina;
  }
}

function calculateMealTarget(params) {
  const { weight, bodyFat, goalNum, goalWeight, daysLeft, timeOfDay, hunger, size } = params;
  const coeff = getGoalCoefficients(goalNum);
  const timeRatio = TIME_DISTRIBUTION[timeOfDay] || TIME_DISTRIBUTION['昼'];
  const hungerMult = HUNGER_ADJUSTMENT[hunger] || 1.0;
  const sizeMult = SIZE_ADJUSTMENT[size] || 1.0;

  // 除脂肪体重ベース（体脂肪率が記録されている場合）
  const leanWeight = (bodyFat && bodyFat > 0 && bodyFat < 60)
    ? weight * (1 - bodyFat / 100)
    : weight;

  // 1日の目標カロリー（除脂肪体重ベース）
  let dailyCal = leanWeight * coeff.calPerKg;
  let deficit = 0;

  // 目標と目的が合致している場合のみ目標体重を加味
  const isAligned =
    ((goalNum === '1' || goalNum === '5') && goalWeight && goalWeight < weight) ||
    (goalNum === '2' && goalWeight && goalWeight > weight);

  if (isAligned && daysLeft && daysLeft > 0) {
    let dailyDiff = (weight - goalWeight) * 7700 / daysLeft;
    dailyDiff = Math.max(-500, Math.min(500, dailyDiff));
    dailyCal = Math.max(dailyCal - dailyDiff, leanWeight * 20);
    deficit = Math.round(dailyDiff);
  }

  const totalMult = timeRatio * hungerMult * sizeMult;
  let mealCal = dailyCal * totalMult;

  const rP = Math.round((mealCal * coeff.pRatio) / 4);
  const rF = Math.round((mealCal * coeff.fRatio) / 9);
  const rC = Math.round((mealCal * coeff.cRatio) / 4);
  const rCal = rP * 4 + rF * 9 + rC * 4;

  return {
    cal: rCal, p: rP, f: rF, c: rC,
    dailyCal: Math.round(dailyCal), dailyP: Math.round((dailyCal * coeff.pRatio) / 4),
    deficit, goalNum,
    pRatio: coeff.pRatio, fRatio: coeff.fRatio, cRatio: coeff.cRatio
  };
}

function calculatePFCRange(pfc, marginPercent = 10, minAbs = { cal: 30, p: 3, f: 2, c: 5 }) {
  function range(val, key) {
    const margin = Math.max(Math.round(val * marginPercent / 100), minAbs[key]);
    return { min: Math.max(0, val - margin), max: val + margin };
  }
  return { cal: range(pfc.cal, 'cal'), p: range(pfc.p, 'p'), f: range(pfc.f, 'f'), c: range(pfc.c, 'c'), unknowns: pfc.unknowns || [] };
}

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

// ================================================================
// 目的別の主要食材PFCデータ（AIへの逆算ガイド用）
// ================================================================

// 目的別に使うべき食材カテゴリ
const GOAL_FOOD_GUIDE = {
  '1': { // 脂肪を落としたい: P35% F25% C40%
    protein: ['鶏胸肉', '鶏ささみ', 'タラ', '木綿豆腐', '鶏卵'],
    carb: ['白米', '玄米', 'オートミール'],
    fat: ['オリーブオイル', 'アーモンド', 'アボカド'],
    veggie: ['ブロッコリー', 'ほうれん草', 'キャベツ', 'レタス', 'トマト'],
    note: '高タンパク低脂質食材を優先。脂質は良質な油脂で確保。主食は控えめに'
  },
  '2': { // 筋肉をつけたい: P25% F20% C55%
    protein: ['鶏胸肉', '鶏もも肉', '牛もも肉', '鶏卵', '鮭'],
    carb: ['白米', 'さつまいも', 'オートミール', 'バナナ'],
    fat: ['オリーブオイル', '鶏卵'],
    veggie: ['ブロッコリー', 'ほうれん草'],
    note: '主食をしっかり。炭水化物55%確保のため米は多めに。タンパク質は体重×1.6〜2.2g'
  },
  '3': { // 体力を上げたい: P20% F20% C60%
    protein: ['鮭', 'サバ', '鶏卵', '鶏胸肉'],
    carb: ['白米', '玄米', 'うどん', 'パスタ', 'オートミール', 'バナナ'],
    fat: ['オリーブオイル', 'サバ', 'アーモンド'],
    veggie: ['ほうれん草', 'トマト', 'にんじん'],
    note: '炭水化物60%必須。主食を最も多く。タンパク質は控えめでOK'
  },
  '4': { // 不調改善: P15% F15% C70%
    protein: ['タラ', '鶏卵', '絹ごし豆腐'],
    carb: ['白米', 'うどん', 'バナナ', '食パン'],
    fat: [],
    veggie: ['大根', 'にんじん', 'ほうれん草'],
    note: '消化の良い食材のみ。脂質最小限。主食中心。揚げ物・炒め物禁止'
  },
  '5': { // 体型を整えたい: P30% F25% C45%
    protein: ['鶏胸肉', '鶏ささみ', 'タラ', '木綿豆腐', '鶏卵'],
    carb: ['玄米', '白米', 'オートミール'],
    fat: ['オリーブオイル', 'アボカド', 'アーモンド'],
    veggie: ['ブロッコリー', 'ほうれん草', 'キャベツ', 'トマト'],
    note: '高タンパク。主食は中程度。良質な脂質でホルモンバランス維持'
  }
};

// 主要食材の100gあたりPFC早見表を生成（AIが量を逆算するためのガイド）
function buildFoodPFCTable(goalNum) {
  const guide = GOAL_FOOD_GUIDE[goalNum];
  if (!guide) return '';
  const allFoods = [...guide.protein, ...guide.carb, ...guide.fat, ...guide.veggie];
  const unique = [...new Set(allFoods)];
  let table = '';
  for (const name of unique) {
    const food = lookupFood(name);
    if (!food) continue;
    const raw = food._raw100 || food;
    const servingInfo = SERVING_SIZES[food.name || name];
    const servingStr = servingInfo ? `（1${servingInfo.unitName}=${servingInfo.standard}g）` : '';
    table += `  ${name}${servingStr}: 100gあたり P${raw.p}g F${raw.f}g C${raw.c}g ${raw.cal}kcal\n`;
  }
  return table;
}

// 目標PFCから逆算したメニュー設計プロンプトを生成
function buildPFCTargetPrompt(goalNum, target) {
  let text = `\n以下の食材リストは確定です。変更禁止。\n` +
    `あなたがやることは①料理名をつける②科学的根拠を1〜2行書く、この2つだけです。\n` +
    `食材・グラム数は一切変えないこと。\n\n`;

  text += buildExampleMeal(goalNum, target);

  text += `\n【食材PFC早見表（100gあたり）】\n`;
  text += buildFoodPFCTable(goalNum);

  return text;
}

// 目的別の逆算例を自動生成
function buildExampleMeal(goalNum, target) {
  // 各目的ごとに代表的な食材組み合わせで逆算例を作る
  const patterns = {
    '1': [ // P35% F25% C40% — 脂肪を落としたい
      [['鶏胸肉', '蒸す'], ['白米'], ['ブロッコリー', '茹でる'], ['オリーブオイル'], ['味噌汁']],
      [['タラ', 'グリル'], ['玄米'], ['ほうれん草', '茹でる'], ['アーモンド'], ['味噌汁']],
      [['鶏ささみ', '茹でる'], ['白米'], ['キャベツ'], ['鶏卵', '茹でる'], ['味噌汁']]
    ],
    '2': [ // P25% F20% C55% — 筋肉をつけたい
      [['鶏もも肉', 'ソテー'], ['白米'], ['ブロッコリー', '茹でる'], ['オリーブオイル']],
      [['鮭', '焼く'], ['白米'], ['味噌汁'], ['さつまいも', '蒸す']],
      [['牛もも肉', '焼く'], ['白米'], ['鶏卵', '焼く'], ['ほうれん草', '茹でる']]
    ],
    '3': [ // P20% F20% C60% — 体力を上げたい
      [['鮭', '焼く'], ['白米'], ['オリーブオイル'], ['バナナ'], ['味噌汁']],
      [['サバ', '煮る'], ['玄米'], ['オリーブオイル'], ['ほうれん草', '茹でる']],
      [['鶏もも肉', '焼く'], ['白米'], ['さつまいも', '蒸す'], ['味噌汁']]
    ],
    '4': [ // P15% F15% C70% — 不調改善
      [['タラ', '蒸す'], ['白米'], ['味噌汁']],
      [['絹ごし豆腐', '煮る'], ['うどん'], ['ほうれん草', '茹でる']],
      [['鶏卵', '茹でる'], ['白米'], ['味噌汁'], ['バナナ']]
    ],
    '5': [ // P30% F25% C45% — 体型を整えたい
      [['鶏胸肉', 'グリル'], ['玄米'], ['オリーブオイル'], ['ブロッコリー', '茹でる']],
      [['鶏ささみ', '茹でる'], ['玄米'], ['アボカド'], ['レタス']],
      [['タラ', '焼く'], ['白米'], ['木綿豆腐'], ['小松菜', '茹でる'], ['オリーブオイル']]
    ]
  };

  const goalPatterns = patterns[goalNum] || patterns['1'];
  let text = '';

  for (let i = 0; i < goalPatterns.length; i++) {
    const pattern = goalPatterns[i];
    // 食材のPFCを取得
    const foods = [];
    for (const p of pattern) {
      const name = p[0];
      const cook = p[1] || null;
      const food = lookupFood(name);
      if (food) foods.push({ name, cook, food });
    }

    // 目標PFCに近づくよう量を逆算
    const meal = solveMealAmounts(foods, target);
    if (!meal) continue;

    // 検証
    const items = meal.map(m => ({ name: m.name, amount: m.amount + 'g' }));
    const pfc = calculateItemsPFC(items);
    const cal = pfc.cal;
    if (cal === 0) continue;
    const pfcCal = pfc.p * 4 + pfc.f * 9 + pfc.c * 4;
    const actualPPct = pfcCal > 0 ? Math.round((pfc.p * 4 / pfcCal) * 100) : 0;
    const actualFPct = pfcCal > 0 ? Math.round((pfc.f * 9 / pfcCal) * 100) : 0;
    const actualCPct = 100 - actualPPct - actualFPct;

    const labels = ['第一', '第二', '第三'];
    text += `\n▼ ${labels[i] || '第' + (i+1)}候補の食材（変更禁止）\n`;
    for (const m of meal) {
      const cookStr = m.cook ? `（${m.cook}）` : '';
      text += `・${m.name} ${m.amount}g${cookStr}\n`;
    }
    text += `→ ${cal}kcal P${pfc.p}g F${pfc.f}g C${pfc.c}g（P${actualPPct}% F${actualFPct}% C${actualCPct}%）\n`;
  }

  return text;
}

// 食材の量を逆算するソルバー
function solveMealAmounts(foods, target) {
  // 食材を役割分類
  let proteinFood = null, carbFood = null, fatFood = null;
  const sides = []; // 野菜・汁物
  for (const f of foods) {
    const raw = f.food._raw100 || f.food;
    // 油脂系を最優先で判定
    if (!fatFood && (raw.f > 30 || /油|オイル|アボカド|アーモンド|くるみ|バター/.test(f.name))) { fatFood = f; continue; }
    // タンパク質食材（P含有量が多くFが少ない肉・魚・大豆等）
    if (!proteinFood && raw.p > 10 && raw.c < 15) { proteinFood = f; continue; }
    // 炭水化物食材（C含有量が多い主食）
    if (!carbFood && raw.c > 20) { carbFood = f; continue; }
    sides.push(f);
  }

  if (!proteinFood && !carbFood) return null;

  // 副菜のPFC合計を先に計算（固定量）
  let sideP = 0, sideF = 0, sideC = 0, sideCal = 0;
  const result = [];
  for (const s of sides) {
    const raw = s.food._raw100 || s.food;
    // 副菜は標準量で固定
    let amount;
    const ss = SERVING_SIZES[s.name];
    if (ss) {
      amount = ss.standard;
    } else if (/汁|スープ/.test(s.name)) {
      amount = 100; // 汁物1杯分相当
    } else {
      amount = 80; // 野菜デフォルト80g
    }
    const ratio = amount / 100;
    sideP += raw.p * ratio; sideF += raw.f * ratio;
    sideC += raw.c * ratio; sideCal += raw.cal * ratio;
    result.push({ name: s.name, amount, cook: s.cook });
  }

  // 残りのPFC目標
  let remainP = target.p - sideP;
  let remainF = target.f - sideF;
  let remainC = target.c - sideC;

  // --- 初回: P → F → C の順に量を決定 ---
  let proteinAmount = 0, fatAmount = 0, carbAmount = 0;

  // タンパク質食材の量を決定（目標Pの主要供給源）
  if (proteinFood) {
    const raw = proteinFood.food._raw100 || proteinFood.food;
    const pShare = carbFood ? 0.85 : 0.95;
    proteinAmount = Math.round((remainP * pShare) / (raw.p / 100));
    proteinAmount = Math.max(80, Math.min(300, proteinAmount));
    proteinAmount = Math.round(proteinAmount / 10) * 10;
    const ratio = proteinAmount / 100;
    remainP -= raw.p * ratio;
    remainF -= raw.f * ratio;
    remainC -= raw.c * ratio;
  }

  // 脂質食材の量を決定
  if (fatFood && remainF > 2) {
    const raw = fatFood.food._raw100 || fatFood.food;
    fatAmount = Math.round(remainF / (raw.f / 100));
    fatAmount = Math.max(4, Math.min(30, fatAmount));
    const ratio = fatAmount / 100;
    remainF -= raw.f * ratio;
    remainC -= raw.c * ratio;
    remainP -= raw.p * ratio;
  }

  // 炭水化物食材の量を決定（残りCから逆算）
  if (carbFood) {
    const raw = carbFood.food._raw100 || carbFood.food;
    carbAmount = Math.round(Math.max(0, remainC) / (raw.c / 100));
    carbAmount = Math.max(50, Math.min(350, carbAmount));
    carbAmount = Math.round(carbAmount / 10) * 10;
  }

  // --- 補正パス: 実PFC比率を検証して量を微調整 ---
  const mainFoods = [];
  if (proteinFood) mainFoods.push({ role: 'protein', food: proteinFood, amount: proteinAmount });
  if (fatFood && fatAmount > 0) mainFoods.push({ role: 'fat', food: fatFood, amount: fatAmount });
  if (carbFood) mainFoods.push({ role: 'carb', food: carbFood, amount: carbAmount });

  for (let iter = 0; iter < 8; iter++) {
    // 現在の合計を計算
    let tP = sideP, tF = sideF, tC = sideC;
    for (const mf of mainFoods) {
      const raw = mf.food.food._raw100 || mf.food.food;
      const r = mf.amount / 100;
      tP += raw.p * r; tF += raw.f * r; tC += raw.c * r;
    }
    const tCal = tP * 4 + tF * 9 + tC * 4;
    if (tCal === 0) break;
    const curPPct = (tP * 4 / tCal) * 100;
    const curFPct = (tF * 9 / tCal) * 100;
    const curCPct = (tC * 4 / tCal) * 100;
    const coeff = getGoalCoefficients(target.goalNum || '1');
    const tgtPPct = coeff.pRatio * 100;
    const tgtFPct = coeff.fRatio * 100;
    const tgtCPct = coeff.cRatio * 100;

    const pEntry = mainFoods.find(m => m.role === 'protein');
    const cEntry = mainFoods.find(m => m.role === 'carb');
    const fEntry = mainFoods.find(m => m.role === 'fat');

    // P比率が高すぎ → タンパク質↓ or 炭水化物↑
    if (curPPct > tgtPPct + 3) {
      if (pEntry && pEntry.amount > 90) pEntry.amount -= 10;
      if (cEntry) cEntry.amount += 10;
    }
    // P比率が低すぎ → タンパク質↑ or 炭水化物↓
    else if (curPPct < tgtPPct - 3) {
      if (pEntry && pEntry.amount < 290) pEntry.amount += 10;
      if (cEntry && cEntry.amount > 60) cEntry.amount -= 10;
    }
    // F比率が低すぎ → 脂質↑
    if (curFPct < tgtFPct - 3) {
      if (fEntry && fEntry.amount < 30) fEntry.amount += 2;
      // 脂質食材がない場合、炭水化物を減らす（相対的にF%を上げる）
      else if (cEntry && cEntry.amount > 60) cEntry.amount -= 10;
    }
    // F比率が高すぎ → 脂質↓
    else if (curFPct > tgtFPct + 3) {
      if (fEntry && fEntry.amount > 4) fEntry.amount -= 2;
    }
    // C比率が高すぎ → 炭水化物↓
    if (curCPct > tgtCPct + 3) {
      if (cEntry && cEntry.amount > 60) cEntry.amount -= 10;
    }
    // C比率が低すぎ → 炭水化物↑
    else if (curCPct < tgtCPct - 3) {
      if (cEntry) cEntry.amount += 10;
    }
  }

  // 結果をresultに追加
  for (const mf of mainFoods) {
    result.push({ name: mf.food.name, amount: mf.amount, cook: mf.food.cook });
  }

  return result;
}

// グローバルに公開
window.NutritionDB = {
  FOOD_DB, FOOD_DB_RAW, SERVING_SIZES, COOKING_METHODS, FOOD_ALIASES,
  lookupFood, parseAmount, parseNutritionItems,
  calculateItemsPFC, estimateUnknownFood, detectCookingOilAdjustment,
  calculateMealTarget, getGoalCoefficients, calculatePFCRange, createPFCBadgeHTML,
  buildPFCTargetPrompt, GOAL_FOOD_GUIDE,
  TIME_DISTRIBUTION, HUNGER_ADJUSTMENT, SIZE_ADJUSTMENT, GOAL_COEFFICIENTS
};
