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
  'サンドイッチ': { p: 10, f: 12, c: 28, cal: 260, unit: '個', per: 1 },
  '冷やし中華': { p: 15, f: 8, c: 60, cal: 380, unit: '食', per: 1 },
  '幕の内弁当': { p: 20, f: 18, c: 90, cal: 600, unit: '個', per: 1 },
  '弁当': { p: 20, f: 18, c: 90, cal: 600, unit: '個', per: 1 },

  // 外食・料理
  '牛丼並盛': { p: 22, f: 18, c: 68, cal: 550, unit: '杯', per: 1 },
  '牛丼': { p: 22, f: 18, c: 68, cal: 550, unit: '杯', per: 1 },
  'ざるそば': { p: 10, f: 2, c: 50, cal: 270, unit: '食', per: 1 },
  '親子丼': { p: 30, f: 15, c: 90, cal: 620, unit: '杯', per: 1 },
  'カレーライス': { p: 15, f: 15, c: 100, cal: 600, unit: '食', per: 1 },
  'サラダ': { p: 2, f: 3, c: 6, cal: 50, unit: '皿', per: 1 },
  'バナナ': { p: 1, f: 0.2, c: 22, cal: 90, unit: '本', per: 1 },
  'きゅうり': { p: 1, f: 0.1, c: 3, cal: 14, unit: 'g', per: 100 },
  '大根': { p: 0.5, f: 0.1, c: 4, cal: 18, unit: 'g', per: 100 },
  '大根おろし': { p: 0.5, f: 0.1, c: 4, cal: 18, unit: 'g', per: 100 },
  'さつまいも': { p: 1, f: 0.2, c: 30, cal: 130, unit: 'g', per: 100 },
  'かぼちゃ': { p: 2, f: 0.3, c: 17, cal: 80, unit: 'g', per: 100 },
  'じゃがいも': { p: 2, f: 0.1, c: 17, cal: 76, unit: 'g', per: 100 },
  'ごぼう': { p: 2, f: 0.1, c: 15, cal: 65, unit: 'g', per: 100 },
  'れんこん': { p: 2, f: 0.1, c: 16, cal: 66, unit: 'g', per: 100 },
  '白菜': { p: 0.8, f: 0.1, c: 3, cal: 14, unit: 'g', per: 100 },
  'パプリカ': { p: 1, f: 0.2, c: 7, cal: 30, unit: 'g', per: 100 },
  'ピーマン': { p: 1, f: 0.2, c: 5, cal: 22, unit: 'g', per: 100 },
  'にんにく': { p: 1, f: 0.1, c: 8, cal: 35, unit: 'g', per: 10 },
  'ねぎ': { p: 0.5, f: 0.1, c: 3, cal: 15, unit: 'g', per: 100 },
  'セロリ': { p: 0.4, f: 0.1, c: 3, cal: 15, unit: 'g', per: 100 },
  'きな粉': { p: 4, f: 3, c: 6, cal: 60, unit: 'g', per: 10 },
  'ひじき': { p: 1, f: 0.2, c: 3, cal: 15, unit: 'g', per: 10 },
  '大豆': { p: 7, f: 4, c: 6, cal: 90, unit: 'g', per: 50 },
  'キムチ': { p: 1, f: 0.5, c: 4, cal: 23, unit: 'g', per: 100 },
  'もずく酢': { p: 1, f: 0, c: 4, cal: 20, unit: '個', per: 1 },
  '梅干し': { p: 0.3, f: 0, c: 1, cal: 5, unit: '個', per: 1 },
  'はちみつ': { p: 0, f: 0, c: 8, cal: 30, unit: 'g', per: 10 },
  'ミックスナッツ': { p: 4, f: 16, c: 5, cal: 180, unit: 'g', per: 30 },
  'アーモンド': { p: 6, f: 17, c: 6, cal: 200, unit: 'g', per: 30 },
  'クルミ': { p: 3, f: 14, c: 3, cal: 150, unit: 'g', per: 20 },
  'カシューナッツ': { p: 4, f: 12, c: 10, cal: 165, unit: 'g', per: 30 },
  '野菜ジュース': { p: 1, f: 0, c: 9, cal: 40, unit: 'ml', per: 200 },
  'スポーツドリンク': { p: 0, f: 0, c: 12, cal: 50, unit: 'ml', per: 500 },
  '甘酒': { p: 2, f: 0, c: 18, cal: 80, unit: 'ml', per: 150 },
  '出汁': { p: 0, f: 0, c: 1, cal: 5, unit: '杯', per: 1 },
  'だし': { p: 0, f: 0, c: 1, cal: 5, unit: '杯', per: 1 },
  'ポン酢': { p: 0, f: 0, c: 3, cal: 14, unit: '大さじ', per: 1 },
  'レモン': { p: 0, f: 0, c: 2, cal: 8, unit: '個', per: 0.5 },
  '冷奴': { p: 10, f: 6, c: 2, cal: 110, unit: 'g', per: 150 },
  '冷奴パック': { p: 10, f: 6, c: 2, cal: 110, unit: 'g', per: 150 },
  '蒸し鶏': { p: 23, f: 2, c: 0, cal: 115, unit: 'g', per: 100 },
  '焼き鳥': { p: 7, f: 3, c: 2, cal: 60, unit: '本', per: 1 },
  '焼き鳥塩': { p: 7, f: 2, c: 1, cal: 55, unit: '本', per: 1 },
  '唐揚げ': { p: 7, f: 6, c: 5, cal: 100, unit: '個', per: 1 },
  'コロッケ': { p: 4, f: 8, c: 18, cal: 165, unit: '個', per: 1 },
  '豚カツ': { p: 18, f: 14, c: 12, cal: 250, unit: 'g', per: 100 },
  '豚ヒレカツ': { p: 22, f: 8, c: 12, cal: 210, unit: 'g', per: 100 },
  'チキンカツ': { p: 20, f: 12, c: 12, cal: 235, unit: 'g', per: 100 },
  '白身魚フライ': { p: 16, f: 8, c: 10, cal: 180, unit: '枚', per: 1 },
  'えび天': { p: 8, f: 5, c: 8, cal: 110, unit: '本', per: 1 },
  '海老天': { p: 8, f: 5, c: 8, cal: 110, unit: '本', per: 1 },
  'カキフライ': { p: 5, f: 4, c: 7, cal: 85, unit: '個', per: 1 },
  'アジフライ': { p: 12, f: 8, c: 8, cal: 150, unit: '枚', per: 1 },
  '刺し身': { p: 20, f: 3, c: 0, cal: 110, unit: 'g', per: 100 },
  '刺し身盛り合わせ': { p: 25, f: 4, c: 0, cal: 140, unit: '人前', per: 1 },
  'おかゆ': { p: 2, f: 0.3, c: 16, cal: 75, unit: '杯', per: 1 },
  '茶碗蒸し': { p: 6, f: 3, c: 5, cal: 70, unit: '個', per: 1 },
  '雑炊': { p: 5, f: 1, c: 20, cal: 110, unit: '杯', per: 1 },
  '小鉢': { p: 3, f: 1, c: 5, cal: 40, unit: '品', per: 1 },
  '漬物': { p: 1, f: 0, c: 3, cal: 15, unit: 'g', per: 50 },
  '野菜スティック': { p: 1, f: 0.1, c: 4, cal: 20, unit: 'g', per: 100 },
  '野菜炒め': { p: 3, f: 4, c: 6, cal: 70, unit: 'g', per: 100 },
  '蒸し野菜': { p: 2, f: 0.2, c: 8, cal: 40, unit: 'g', per: 100 },
  '豚こま': { p: 18, f: 12, c: 0, cal: 185, unit: 'g', per: 100 },
  'カレールー': { p: 2, f: 8, c: 15, cal: 140, unit: '食分', per: 1 },
  'あさり': { p: 6, f: 0.5, c: 2, cal: 35, unit: 'g', per: 100 },
  'ほたて': { p: 14, f: 0.5, c: 3, cal: 75, unit: 'g', per: 100 },
  'しじみ': { p: 6, f: 1, c: 3, cal: 45, unit: 'g', per: 100 },
  'かき': { p: 7, f: 2, c: 5, cal: 60, unit: 'g', per: 100 },
  'ひじきサラダ': { p: 3, f: 3, c: 5, cal: 55, unit: '袋', per: 1 },
  '海藻サラダ': { p: 2, f: 1, c: 3, cal: 30, unit: '袋', per: 1 },
  'プロテインバー': { p: 20, f: 8, c: 20, cal: 230, unit: '本', per: 1 },
  'ギリシャヨーグルト低脂肪': { p: 10, f: 0, c: 4, cal: 60, unit: 'g', per: 100 },
  'カッテージチーズ': { p: 12, f: 4, c: 3, cal: 100, unit: 'g', per: 100 },
  'スモークサーモン': { p: 18, f: 4, c: 0, cal: 110, unit: 'g', per: 100 },
  'しらす': { p: 15, f: 2, c: 0, cal: 75, unit: 'g', per: 100 },
  'じゃこ': { p: 15, f: 2, c: 0, cal: 75, unit: 'g', per: 100 },
  '豆腐バー': { p: 10, f: 5, c: 2, cal: 95, unit: '個', per: 1 },
  'さつまいも天': { p: 1, f: 3, c: 20, cal: 110, unit: '本', per: 1 },
  'かぼちゃ天': { p: 1, f: 3, c: 12, cal: 80, unit: '個', per: 1 },
  'いんげん': { p: 2, f: 0.1, c: 6, cal: 30, unit: 'g', per: 100 },
  'きんぴら': { p: 2, f: 3, c: 10, cal: 75, unit: 'g', per: 50 },
  'バジル': { p: 0, f: 0, c: 0, cal: 2, unit: 'g', per: 5 },
  'チャーハン': { p: 10, f: 10, c: 60, cal: 380, unit: '人前', per: 1 },
  'こんにゃく': { p: 0.1, f: 0, c: 3, cal: 7, unit: 'g', per: 100 },
  'こんにゃくおでん': { p: 0.2, f: 0, c: 3, cal: 10, unit: '個', per: 1 },
  '大根おでん': { p: 0.5, f: 0, c: 4, cal: 20, unit: '個', per: 1 },
  '卵おでん': { p: 7, f: 6, c: 0.5, cal: 85, unit: '個', per: 1 },
  '干し芋': { p: 1, f: 0.5, c: 33, cal: 135, unit: 'g', per: 50 },
  'わらびもち': { p: 0, f: 0, c: 18, cal: 70, unit: 'g', per: 80 },
  'ようかん': { p: 1, f: 0, c: 25, cal: 105, unit: '本', per: 45 },
  'ごまだれ': { p: 0, f: 2, c: 3, cal: 28, unit: '大さじ', per: 1 },
  'ごまだれ少量': { p: 0, f: 1, c: 2, cal: 15, unit: '回', per: 1 },
  '根菜煮物': { p: 3, f: 2, c: 15, cal: 90, unit: 'g', per: 100 },
  '山芋': { p: 2, f: 0.2, c: 13, cal: 65, unit: 'g', per: 100 },
  '山かけ': { p: 2, f: 0.2, c: 13, cal: 65, unit: '杯', per: 1 },
  '天かす': { p: 1, f: 5, c: 5, cal: 70, unit: 'g', per: 10 },
  '中華麺': { p: 8, f: 2, c: 52, cal: 270, unit: '玉', per: 1 },
  '肉まん': { p: 8, f: 7, c: 30, cal: 210, unit: '個', per: 1 },
  'あんぱん': { p: 6, f: 5, c: 45, cal: 250, unit: '個', per: 1 },
  'ソース': { p: 0, f: 0, c: 3, cal: 12, unit: '大さじ', per: 1 },
  '豆板醤': { p: 0, f: 1, c: 1, cal: 12, unit: '小さじ', per: 1 },
  '稲荷寿司': { p: 4, f: 4, c: 28, cal: 170, unit: '個', per: 1 },
  'つゆ': { p: 1, f: 0, c: 3, cal: 15, unit: '大さじ', per: 1 },
  'パクチー': { p: 0.5, f: 0.1, c: 1, cal: 5, unit: 'g', per: 10 },
  'カツオのたたき': { p: 22, f: 2, c: 0, cal: 110, unit: 'g', per: 100 },
  '豚角煮': { p: 14, f: 20, c: 5, cal: 265, unit: 'g', per: 100 },
  'いかフライ': { p: 12, f: 8, c: 10, cal: 165, unit: '枚', per: 1 },
  'えびカツ': { p: 10, f: 8, c: 12, cal: 165, unit: '個', per: 1 },
  '煮玉子': { p: 7, f: 6, c: 2, cal: 90, unit: '個', per: 1 },
  '小松菜': { p: 2, f: 0.2, c: 2, cal: 14, unit: 'g', per: 100 },
  'クラッカー': { p: 2, f: 4, c: 15, cal: 100, unit: 'g', per: 25 },
  'ホタテ': { p: 14, f: 0.5, c: 3, cal: 75, unit: 'g', per: 100 },
  '牛タン': { p: 16, f: 20, c: 0, cal: 250, unit: 'g', per: 100 },
  'ブルーベリー': { p: 0.5, f: 0.2, c: 10, cal: 45, unit: 'g', per: 100 },
  'カロリーメイト': { p: 4, f: 5, c: 22, cal: 160, unit: '本', per: 2 },
  '鶏もも照り焼き': { p: 18, f: 10, c: 5, cal: 185, unit: 'g', per: 100 },
  '餃子': { p: 5, f: 5, c: 8, cal: 95, unit: '個', per: 1 },
  'そうめん': { p: 8, f: 1, c: 62, cal: 290, unit: '束', per: 1 },
  '三つ葉': { p: 0.5, f: 0.1, c: 1, cal: 5, unit: 'g', per: 10 },
  'ミックスグリーン': { p: 1, f: 0.1, c: 2, cal: 12, unit: 'g', per: 100 },
  'しょうが': { p: 0.2, f: 0.1, c: 2, cal: 10, unit: 'g', per: 10 },
  'かつお節': { p: 3, f: 0.1, c: 0, cal: 15, unit: 'g', per: 5 },
  '春雨': { p: 0, f: 0, c: 20, cal: 80, unit: 'g', per: 30 },
  'わさび': { p: 0, f: 0, c: 1, cal: 5, unit: 'g', per: 5 },
  '海苔': { p: 1, f: 0.1, c: 1, cal: 5, unit: '枚', per: 1 },
  'しらたき': { p: 0.1, f: 0, c: 1, cal: 6, unit: 'g', per: 100 },
  'もやし（茹で）': { p: 2, f: 0.1, c: 3, cal: 15, unit: 'g', per: 100 },
  'ほうれん草（茹で）': { p: 2, f: 0.4, c: 3, cal: 20, unit: 'g', per: 100 },
  'ブロッコリー（茹で）': { p: 4, f: 0.5, c: 5, cal: 33, unit: 'g', per: 100 },
  'チンゲン菜': { p: 1, f: 0.1, c: 2, cal: 12, unit: 'g', per: 100 },
  '水菜': { p: 2, f: 0.1, c: 3, cal: 23, unit: 'g', per: 100 },
  'なす': { p: 1, f: 0.1, c: 5, cal: 22, unit: 'g', per: 100 },
  'ズッキーニ': { p: 1, f: 0.1, c: 3, cal: 17, unit: 'g', per: 100 },
  'とうもろこし': { p: 3, f: 1, c: 17, cal: 90, unit: 'g', per: 100 },
  'アスパラ': { p: 2, f: 0.1, c: 4, cal: 22, unit: 'g', per: 100 },
  'ピーナッツ': { p: 8, f: 15, c: 6, cal: 190, unit: 'g', per: 30 },
  'ひまわりの種': { p: 5, f: 14, c: 5, cal: 165, unit: 'g', per: 30 },
  'チアシード': { p: 3, f: 5, c: 6, cal: 75, unit: 'g', per: 15 },
  '鮭フレーク': { p: 10, f: 2, c: 0, cal: 60, unit: 'g', per: 30 },
  '明太子': { p: 9, f: 2, c: 0, cal: 55, unit: 'g', per: 30 },
  'いくら': { p: 8, f: 5, c: 0, cal: 75, unit: 'g', per: 30 },
  'チャーシュー': { p: 12, f: 10, c: 5, cal: 160, unit: 'g', per: 60 },
  'メンマ': { p: 1, f: 0.2, c: 2, cal: 15, unit: 'g', per: 30 },
  'なると': { p: 2, f: 0.3, c: 3, cal: 22, unit: '枚', per: 2 },
  '煮干し': { p: 5, f: 1, c: 0, cal: 30, unit: 'g', per: 10 },
  'きりたんぽ': { p: 3, f: 0.3, c: 30, cal: 135, unit: '本', per: 1 },
  '牛こま': { p: 18, f: 12, c: 0, cal: 185, unit: 'g', per: 100 },
  '海鮮丼': { p: 25, f: 5, c: 60, cal: 380, unit: '杯', per: 1 },
  '牛ステーキ': { p: 22, f: 15, c: 0, cal: 230, unit: 'g', per: 100 },
  '肝吸い': { p: 3, f: 1, c: 2, cal: 30, unit: '杯', per: 1 },
  'ナンプラー': { p: 1, f: 0, c: 1, cal: 5, unit: '大さじ', per: 1 },
  'フォー': { p: 8, f: 2, c: 40, cal: 210, unit: '食', per: 1 },
  'ローストチキン': { p: 22, f: 8, c: 0, cal: 165, unit: 'g', per: 100 },
  '海老フライ': { p: 8, f: 5, c: 8, cal: 110, unit: '本', per: 1 },
  '鶏天': { p: 10, f: 6, c: 8, cal: 130, unit: '個', per: 1 },
  '青梗菜': { p: 1, f: 0.1, c: 2, cal: 12, unit: 'g', per: 100 },
  '野菜ソテー': { p: 2, f: 3, c: 8, cal: 65, unit: 'g', per: 100 },
  'パセリ': { p: 0.5, f: 0.1, c: 1, cal: 5, unit: 'g', per: 10 },
  '塩こうじ': { p: 1, f: 0, c: 5, cal: 25, unit: '大さじ', per: 1 },
  '果汁ゼリー': { p: 0, f: 0, c: 15, cal: 60, unit: '個', per: 1 },
  'スポーツゼリー': { p: 0, f: 0, c: 20, cal: 80, unit: '個', per: 1 },
  'ゼリー飲料': { p: 0, f: 0, c: 15, cal: 60, unit: '個', per: 1 },
  '緑茶': { p: 0, f: 0, c: 0, cal: 0, unit: 'ml', per: 200 },
  '焼肉': { p: 18, f: 15, c: 0, cal: 210, unit: 'g', per: 100 },
  '天ぷら盛り合わせ': { p: 10, f: 12, c: 20, cal: 230, unit: '人前', per: 1 },
  '馬刺し': { p: 20, f: 3, c: 0, cal: 110, unit: 'g', per: 100 },
  'カステラ': { p: 3, f: 3, c: 30, cal: 160, unit: '切', per: 1 },
  'ドライフルーツ': { p: 1, f: 0.2, c: 25, cal: 105, unit: 'g', per: 30 },
  '太巻き': { p: 8, f: 3, c: 45, cal: 240, unit: '本', per: 1 },
  '巻き寿司': { p: 6, f: 2, c: 35, cal: 185, unit: '本', per: 1 },
  'チラシ寿司': { p: 15, f: 5, c: 65, cal: 380, unit: '杯', per: 1 },
  '酢飯': { p: 4, f: 0.5, c: 60, cal: 265, unit: '杯', per: 1 },
  'コチュジャン': { p: 0.5, f: 0.5, c: 3, cal: 20, unit: '大さじ', per: 1 },
  'ゴマだれ': { p: 0, f: 2, c: 3, cal: 28, unit: '大さじ', per: 1 },
  'レバー串': { p: 8, f: 3, c: 1, cal: 65, unit: '本', per: 1 },
  'リンゴ': { p: 0.2, f: 0.1, c: 15, cal: 60, unit: '個', per: 0.5 },
  '絹さや': { p: 2, f: 0.1, c: 5, cal: 30, unit: 'g', per: 100 },
  '根菜汁': { p: 3, f: 2, c: 10, cal: 70, unit: '杯', per: 1 },
  '鰹節': { p: 3, f: 0.1, c: 0, cal: 15, unit: 'g', per: 5 },
  'ちまき': { p: 4, f: 3, c: 35, cal: 185, unit: '個', per: 1 },
  '鶏もも塩焼き': { p: 20, f: 8, c: 0, cal: 155, unit: 'g', per: 100 },
  '担々麺': { p: 18, f: 20, c: 50, cal: 460, unit: '食', per: 1 },
  '牛カルビ': { p: 14, f: 30, c: 0, cal: 335, unit: 'g', per: 100 },
  '牛カルビ焼肉': { p: 14, f: 30, c: 0, cal: 335, unit: 'g', per: 100 },
  'うなぎの蒲焼き': { p: 23, f: 21, c: 3, cal: 295, unit: 'g', per: 100 },
  'うなぎ白焼き': { p: 23, f: 19, c: 0, cal: 270, unit: 'g', per: 100 },
  '半ラーメン': { p: 10, f: 8, c: 35, cal: 255, unit: '食', per: 1 },
  '塩ラーメン': { p: 15, f: 8, c: 55, cal: 360, unit: '食', per: 1 },
  '中華粥': { p: 5, f: 2, c: 25, cal: 140, unit: '杯', per: 1 },
  'とろろ': { p: 2, f: 0.2, c: 13, cal: 65, unit: 'g', per: 100 },
  'いわし梅煮': { p: 14, f: 8, c: 3, cal: 145, unit: 'g', per: 100 },
  'いわし煮付け': { p: 14, f: 8, c: 3, cal: 145, unit: 'g', per: 100 },
  'ハンバーグ': { p: 14, f: 16, c: 8, cal: 235, unit: 'g', per: 100 },
  'オムライス': { p: 15, f: 15, c: 55, cal: 430, unit: '食', per: 1 },
  'ピラフ': { p: 10, f: 8, c: 55, cal: 335, unit: '食', per: 1 },
  'ミートボール': { p: 8, f: 8, c: 6, cal: 130, unit: '個', per: 3 },
  '炒飯': { p: 10, f: 10, c: 60, cal: 380, unit: '人前', per: 1 },
  '五目豆': { p: 5, f: 3, c: 15, cal: 110, unit: 'g', per: 100 },
  'もち米': { p: 4, f: 0.5, c: 56, cal: 250, unit: 'g', per: 150 },
  'ケチャップ': { p: 0.5, f: 0, c: 5, cal: 20, unit: '大さじ', per: 1 },
  'ポテト': { p: 2, f: 8, c: 25, cal: 185, unit: 'g', per: 100 },
  'グリルチキン': { p: 22, f: 5, c: 0, cal: 135, unit: 'g', per: 100 },
  'フムス': { p: 5, f: 6, c: 10, cal: 115, unit: 'g', per: 50 },
  '牛ロース': { p: 19, f: 22, c: 0, cal: 280, unit: 'g', per: 100 },
  '雑穀米': { p: 4, f: 1, c: 52, cal: 240, unit: 'g', per: 150 },
  'モッツァレラ': { p: 6, f: 5, c: 1, cal: 75, unit: 'g', per: 30 },
  'コーン': { p: 2, f: 1, c: 15, cal: 80, unit: 'g', per: 100 },
  'さんま': { p: 18, f: 19, c: 0, cal: 250, unit: 'g', per: 100 },
  'はんぺん': { p: 5, f: 0.5, c: 10, cal: 70, unit: '枚', per: 1 },
  '袋ラーメン': { p: 12, f: 15, c: 60, cal: 440, unit: '食', per: 1 },
  'メンチカツ': { p: 8, f: 12, c: 12, cal: 190, unit: '個', per: 1 },
  '豚スペアリブ': { p: 15, f: 20, c: 0, cal: 250, unit: 'g', per: 100 },
  '牛ハラミ': { p: 16, f: 20, c: 0, cal: 250, unit: 'g', per: 100 },
  'もつ煮込み': { p: 10, f: 8, c: 5, cal: 135, unit: 'g', per: 100 },
  'スモークチキン': { p: 20, f: 4, c: 0, cal: 115, unit: 'g', per: 100 },
  '鶏手羽先': { p: 13, f: 14, c: 0, cal: 190, unit: '本', per: 1 },
  '鶏手羽元': { p: 13, f: 12, c: 0, cal: 175, unit: '本', per: 1 },
  'ニラ': { p: 2, f: 0.3, c: 4, cal: 22, unit: 'g', per: 100 },
  '昆布': { p: 1, f: 0.2, c: 10, cal: 45, unit: 'g', per: 10 },
  'グラノーラ': { p: 5, f: 6, c: 35, cal: 215, unit: 'g', per: 50 },
  'プルーン': { p: 1, f: 0.2, c: 18, cal: 75, unit: '個', per: 2 },
  'きなこ': { p: 4, f: 3, c: 6, cal: 60, unit: 'g', per: 10 },
  '里芋': { p: 2, f: 0.1, c: 14, cal: 65, unit: 'g', per: 100 },
  '鯛': { p: 20, f: 4, c: 0, cal: 120, unit: 'g', per: 100 },
  '生春巻き': { p: 6, f: 3, c: 20, cal: 135, unit: '本', per: 1 },
  '豚生姜焼き': { p: 18, f: 12, c: 5, cal: 200, unit: 'g', per: 100 },
  '野菜カレー': { p: 8, f: 10, c: 55, cal: 345, unit: '食', per: 1 },
  'ビスケット': { p: 2, f: 4, c: 18, cal: 115, unit: 'g', per: 25 },
  'ラム': { p: 18, f: 15, c: 0, cal: 215, unit: 'g', per: 100 },
  'タイ': { p: 20, f: 4, c: 0, cal: 120, unit: 'g', per: 100 },
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
  '鶏むね': '鶏胸肉',
  'むね': '鶏胸肉',
  '豚バラ肉': '豚バラ',
  'かつ': '豚カツ',
  'ひれかつ': '豚ヒレカツ',
  'えびフライ': '白身魚フライ',
  'きゅうり': 'きゅうり',
  'バナナ': 'バナナ',
  'ポン酢': 'ポン酢',
  '出し': '出汁',
  '冷やっこ': '冷奴',
  'やきとり': '焼き鳥',
  'やきとり塩': '焼き鳥塩',
  'から揚げ': '唐揚げ',
  'からあげ': '唐揚げ',
  'さつまいも（蒸す）': 'さつまいも',
  'かぼちゃ（蒸す）': 'かぼちゃ',
};

function lookupFood(name) {
  const normalized = name.trim();
  if (FOOD_DB[normalized]) return { ...FOOD_DB[normalized], name: normalized };
  const aliased = FOOD_ALIASES[normalized];
  if (aliased && FOOD_DB[aliased]) return { ...FOOD_DB[aliased], name: aliased };
  for (const key of Object.keys(FOOD_DB)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return { ...FOOD_DB[key], name: key };
    }
  }
  return null;
}

function parseAmount(amountStr, foodEntry) {
  const str = amountStr.trim();
  if (/半丁|半分|1\/2/.test(str)) return 1;
  if (/1丁/.test(str)) return 2;
  const gMatch = str.match(/([\d.]+)\s*g/i);
  if (gMatch) {
    const grams = parseFloat(gMatch[1]);
    if (foodEntry.unit === 'g') return grams / foodEntry.per;
    return grams / 100;
  }
  const mlMatch = str.match(/([\d.]+)\s*ml/i);
  if (mlMatch) {
    const ml = parseFloat(mlMatch[1]);
    if (foodEntry.unit === 'ml') return ml / foodEntry.per;
    return ml / 200;
  }
  const numMatch = str.match(/([\d.]+)/);
  if (numMatch) {
    const num = parseFloat(numMatch[1]);
    if (foodEntry.unit === 'g' || foodEntry.unit === 'ml') return num / foodEntry.per;
    return num / foodEntry.per;
  }
  return 1;
}

function parseNutritionItems(text) {
  const results = [];
  const tagPattern = /\[ITEMS:\s*([^\]]+)\]/g;
  let match;
  while ((match = tagPattern.exec(text)) !== null) {
    const itemsStr = match[1];
    const items = itemsStr.split(',').map(item => {
      const trimmed = item.trim();
      const parts = trimmed.match(/^(.+?)\s+([\d./半]+\s*[a-zA-Zぁ-ん丁分枚個本杯パック人前玉切皿食缶大さじ]*)\s*$/);
      if (parts) return { name: parts[1].trim(), amount: parts[2].trim() };
      return { name: trimmed, amount: '1' };
    });
    results.push({ tag: match[0], items });
  }
  return results;
}

function calculateItemsPFC(items) {
  let totalP = 0, totalF = 0, totalC = 0, totalCal = 0;
  const details = [];
  const unknowns = [];
  for (const item of items) {
    const food = lookupFood(item.name);
    if (!food) { unknowns.push(item.name); continue; }
    const multiplier = parseAmount(item.amount, food);
    const p = Math.round(food.p * multiplier * 10) / 10;
    const f = Math.round(food.f * multiplier * 10) / 10;
    const c = Math.round(food.c * multiplier * 10) / 10;
    const cal = Math.round(food.cal * multiplier);
    totalP += p; totalF += f; totalC += c; totalCal += cal;
    details.push({ name: item.name, amount: item.amount, p, f, c, cal });
  }
  return {
    p: Math.round(totalP), f: Math.round(totalF),
    c: Math.round(totalC), cal: Math.round(totalCal),
    details, unknowns
  };
}

// ============================================================
// 1食目安PFC計算（ユーザーデータ×目的×時間帯×空腹度）
// ============================================================

// ── 目的別の基礎係数 ──
// calPerKg: 1日の目標カロリー / kg（体重ベース）
// pPerKg:   1日のタンパク質目標 / kg
// fRatio:   脂質が1日カロリーに占める割合
const GOAL_COEFFICIENTS = {
  reduction: { calPerKg: 28, pPerKg: 2.0, fRatio: 0.20 },  // 減量（P高め・F低め）
  muscle:    { calPerKg: 38, pPerKg: 2.2, fRatio: 0.25 },  // 増量（P高め・C確保）
  health:    { calPerKg: 33, pPerKg: 1.7, fRatio: 0.25 }   // 維持・体力・不調
};

// ── 目的別・時間帯別の1食あたり配分率 ──
// 科学的根拠：
//   朝食重視   → Jakubowicz et al. 2013（朝高カロリーで体重管理が有利）
//   均等分散   → Areta et al. 2013（筋タンパク合成は均等分散が最適）
//   夕食適量   → Garaulet et al. 2013（夜の過食は脂肪蓄積を促進）
//   夕方は軽く  → 間食・軽食レベルを想定
//   間食は最小  → 100〜200kcal程度を想定
const TIME_DISTRIBUTION = {
  // ① 減量：朝食重視・夜は適度
  '1': {
    '朝':   { cal: 0.28, p: 0.28, f: 0.25, c: 0.30 },
    '昼':   { cal: 0.35, p: 0.32, f: 0.35, c: 0.38 },
    '夕方': { cal: 0.12, p: 0.12, f: 0.12, c: 0.12 },
    '夜':   { cal: 0.32, p: 0.35, f: 0.30, c: 0.25 },
    '間食': { cal: 0.08, p: 0.08, f: 0.08, c: 0.08 }
  },
  // ② 増量：均等分散・夜も十分に
  '2': {
    '朝':   { cal: 0.25, p: 0.25, f: 0.25, c: 0.25 },
    '昼':   { cal: 0.30, p: 0.30, f: 0.30, c: 0.30 },
    '夕方': { cal: 0.15, p: 0.15, f: 0.15, c: 0.15 },
    '夜':   { cal: 0.28, p: 0.28, f: 0.28, c: 0.28 },
    '間食': { cal: 0.10, p: 0.10, f: 0.10, c: 0.10 }
  },
  // ③ 体力向上：炭水化物重視（Burke et al. 2011）
  '3': {
    '朝':   { cal: 0.28, p: 0.25, f: 0.25, c: 0.32 },
    '昼':   { cal: 0.35, p: 0.30, f: 0.32, c: 0.40 },
    '夕方': { cal: 0.12, p: 0.12, f: 0.12, c: 0.12 },
    '夜':   { cal: 0.30, p: 0.30, f: 0.28, c: 0.28 },
    '間食': { cal: 0.10, p: 0.10, f: 0.10, c: 0.10 }
  },
  // ④ 不調改善：消化負担を分散・夜も消化に配慮
  '4': {
    '朝':   { cal: 0.25, p: 0.25, f: 0.25, c: 0.25 },
    '昼':   { cal: 0.35, p: 0.30, f: 0.35, c: 0.38 },
    '夕方': { cal: 0.12, p: 0.12, f: 0.12, c: 0.12 },
    '夜':   { cal: 0.28, p: 0.30, f: 0.25, c: 0.25 },
    '間食': { cal: 0.08, p: 0.08, f: 0.08, c: 0.08 }
  },
  // ⑤ 体型を整えたい：減量寄りだが筋維持
  '5': {
    '朝':   { cal: 0.28, p: 0.28, f: 0.25, c: 0.30 },
    '昼':   { cal: 0.35, p: 0.32, f: 0.35, c: 0.38 },
    '夕方': { cal: 0.12, p: 0.12, f: 0.12, c: 0.12 },
    '夜':   { cal: 0.32, p: 0.35, f: 0.30, c: 0.25 },
    '間食': { cal: 0.08, p: 0.08, f: 0.08, c: 0.08 }
  }
};

// ── 食事回数×何食目 別の1食あたり配分率 ──
// totalMeals + mealIndex が指定された場合に TIME_DISTRIBUTION の代わりに使用
const MEAL_DISTRIBUTION = {
  2: {
    1: { cal: 0.55, p: 0.50, f: 0.55, c: 0.58 },
    2: { cal: 0.45, p: 0.50, f: 0.45, c: 0.42 },
    '間食': { cal: 0.08, p: 0.08, f: 0.08, c: 0.08 }
  },
  3: {
    1: { cal: 0.28, p: 0.28, f: 0.26, c: 0.30 },
    2: { cal: 0.38, p: 0.35, f: 0.38, c: 0.40 },
    3: { cal: 0.34, p: 0.37, f: 0.36, c: 0.30 },
    '間食': { cal: 0.05, p: 0.05, f: 0.05, c: 0.05 }
  },
  4: {
    1: { cal: 0.25, p: 0.25, f: 0.25, c: 0.28 },
    2: { cal: 0.30, p: 0.28, f: 0.30, c: 0.32 },
    3: { cal: 0.25, p: 0.27, f: 0.25, c: 0.22 },
    4: { cal: 0.20, p: 0.20, f: 0.20, c: 0.18 },
    '間食': { cal: 0.08, p: 0.08, f: 0.08, c: 0.08 }
  },
  5: {
    1: { cal: 0.22, p: 0.22, f: 0.22, c: 0.24 },
    2: { cal: 0.23, p: 0.22, f: 0.23, c: 0.24 },
    3: { cal: 0.22, p: 0.22, f: 0.22, c: 0.22 },
    4: { cal: 0.18, p: 0.18, f: 0.18, c: 0.17 },
    5: { cal: 0.15, p: 0.16, f: 0.15, c: 0.13 },
    '間食': { cal: 0.06, p: 0.06, f: 0.06, c: 0.06 }
  }
};

// 空腹感は食事ターゲットへの直接補正ではなく、
// selectMealsのスコアリングで反映する（過食・空腹感を食材選択で調整）
const HUNGER_ADJUSTMENT = {
  'かなり空腹':           1.0,
  '少し空腹':             1.0,
  'そこまで空腹じゃない': 1.0,
  'なんとなく食べたい':   1.0
};

// ── 間食を含む場合に通常食の配分を再正規化する ──
// 間食分を通常食から按分で差し引き、合計が1.0になるようにする
// snackDist: 間食の配分率オブジェクト { cal, p, f, c }
// mealDist:  選択された通常食の配分率オブジェクト { cal, p, f, c }
// totalNormalDists: その食数の通常食すべての配分率の配列
function normalizeForSnack(mealDist, snackDist, totalNormalDists) {
  if (!snackDist) return mealDist;
  // 通常食合計を計算
  const sum = { cal: 0, p: 0, f: 0, c: 0 };
  for (const d of totalNormalDists) {
    sum.cal += d.cal; sum.p += d.p; sum.f += d.f; sum.c += d.c;
  }
  // 通常食 + 間食で合計1.0になるよう、通常食側を縮小
  return {
    cal: mealDist.cal * (1 - snackDist.cal) / sum.cal,
    p:   mealDist.p   * (1 - snackDist.p)   / sum.p,
    f:   mealDist.f   * (1 - snackDist.f)   / sum.f,
    c:   mealDist.c   * (1 - snackDist.c)   / sum.c
  };
}

function getGoalCoefficients(goalNum, currentBF, targetBF) {
  switch (goalNum) {
    case '1': return GOAL_COEFFICIENTS.reduction;
    case '2': return GOAL_COEFFICIENTS.muscle;
    case '3': return GOAL_COEFFICIENTS.health;
    case '4': return GOAL_COEFFICIENTS.health;
    case '5':
      if (currentBF && targetBF && currentBF > targetBF) return GOAL_COEFFICIENTS.reduction;
      return GOAL_COEFFICIENTS.muscle;
    default: return GOAL_COEFFICIENTS.health;
  }
}

function calculateMealTarget(params) {
  const { weight, goalNum, currentBF, targetBF, goalWeight, timeOfDay, totalMeals, mealIndex, hunger, mealVolume } = params;
  const coeff = getGoalCoefficients(goalNum, currentBF, targetBF);

  // 食事回数+何食目 → MEAL_DISTRIBUTION、なければ従来の TIME_DISTRIBUTION
  let timeDist;
  if (totalMeals && mealIndex !== null && mealIndex !== undefined) {
    const mealGroup = MEAL_DISTRIBUTION[totalMeals] || MEAL_DISTRIBUTION[3];
    // mealIndex は必ず数値（parseInt済み）
    timeDist = mealGroup[mealIndex] || mealGroup[1];
  } else {
    const goalDist = TIME_DISTRIBUTION[goalNum] || TIME_DISTRIBUTION['1'];
    timeDist = goalDist[timeOfDay] || goalDist['昼'];
  }

  // 目標体重との差によるカロリー調整（1kgあたり±30kcal、最大±300kcal/日）
  let gapAdjust = 0;
  if (goalWeight && goalWeight !== weight) {
    const gap = goalWeight - weight;  // 負=減量、正=増量
    gapAdjust = Math.max(-300, Math.min(300, gap * 30));
  }

  const dailyCal = weight * coeff.calPerKg + gapAdjust;
  const dailyP   = weight * coeff.pPerKg;

  // 体脂肪率による脂質割合の微調整
  let fRatio = coeff.fRatio;
  if (currentBF !== null && currentBF !== undefined) {
    if (currentBF >= 25) fRatio = Math.max(0.17, coeff.fRatio - 0.03);
    else if (currentBF <= 15) fRatio = Math.min(0.30, coeff.fRatio + 0.02);
  }

  let dailyF   = dailyCal * fRatio / 9;

  // ── 脂質の安全下限（ホルモン合成・細胞膜維持に必要な最低量） ──
  // 体重×0.6g または 総カロリーの20%のうち大きい方を最低ラインとする
  const minFat = Math.max(weight * 0.6, dailyCal * 0.20 / 9);
  if (dailyF < minFat) {
    dailyF = minFat;
  }

  // 脂質補正後の残りカロリーから炭水化物を算出（cal・Pは維持）
  const dailyC   = Math.max(0, (dailyCal - dailyP * 4 - dailyF * 9) / 4);

  let mealCal = dailyCal * timeDist.cal;
  let mealP   = dailyP   * timeDist.p;
  let mealF   = dailyF   * timeDist.f;
  let mealC   = dailyC   * timeDist.c;

  // 修正④: 間食・補食モードは1食分を補食サイズ（約45%）に縮小
  // 軽めの食事・通常の食事は変更なし（次フェーズで対応予定）
  if (mealVolume === '間食・補食') {
    const snackScale = 0.45;
    mealCal = mealCal * snackScale;
    mealP   = mealP   * snackScale;
    mealF   = mealF   * snackScale;
    mealC   = mealC   * snackScale;
  }

  return {
    cal: Math.round(mealCal),
    p:   Math.round(mealP),
    f:   Math.round(mealF),
    c:   Math.round(mealC),
    dailyCal: Math.round(dailyCal)
  };
}

function calculatePFCRange(pfc, marginPercent = 10, minAbs = { cal: 30, p: 3, f: 2, c: 5 }) {
  function range(val, key) {
    const margin = Math.max(Math.round(val * marginPercent / 100), minAbs[key]);
    return { min: Math.max(0, val - margin), max: val + margin };
  }
  return {
    cal: range(pfc.cal, 'cal'), p: range(pfc.p, 'p'),
    f: range(pfc.f, 'f'), c: range(pfc.c, 'c'),
    unknowns: pfc.unknowns || []
  };
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
  MEAL_DISTRIBUTION,
  HUNGER_ADJUSTMENT,
  GOAL_COEFFICIENTS,
  COOKING_METHODS: {}
};