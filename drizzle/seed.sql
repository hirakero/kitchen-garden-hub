-- Vegetable master data seed (9 vegetables)
-- Run (local):  wrangler d1 execute kitchen-garden-hub --local --file=drizzle/seed.sql
-- Run (remote): wrangler d1 execute kitchen-garden-hub --file=drizzle/seed.sql
-- Uses INSERT OR IGNORE so running multiple times is safe

-- ================================================================
-- vegetable_master
-- ================================================================
INSERT OR IGNORE INTO vegetable_master (id, name, description) VALUES
  (1, 'ミニトマト', '夏の定番。プランターでも育てやすい。'),
  (2, 'きゅうり',   '夏に大量収穫。使用頻度が高い。'),
  (3, '小松菜',     '春〜秋ほぼ通年栽培可能。種まきから収穫まで約40日。'),
  (4, 'リーフレタス', '春・秋に種まき。外葉から随時収穫。'),
  (5, '二十日大根', '20〜30日で収穫可能。通年栽培できる。'),
  (6, 'ニラ',       '多年草。ほぼ放置でも何年も収穫できる。'),
  (7, '万能ネギ',   '根元から再生。庭にあってたまに取ってくる系。'),
  (8, 'タマネギ',   '半年以上保存可能。秋植え春収穫が基本。'),
  (9, 'ジャガイモ', '数ヶ月保存可能。春・秋の二期作が可能。');

-- ================================================================
-- stage_master  (vegetable_id, name, order_index)
-- ================================================================
-- ミニトマト: 5 stages
INSERT OR IGNORE INTO stage_master (id, vegetable_id, name, order_index) VALUES
  (1,  1, '種まき',     1),
  (2,  1, '育苗',       2),
  (3,  1, '定植',       3),
  (4,  1, '生育・着果', 4),
  (5,  1, '収穫期',     5);

-- きゅうり: 3 stages
INSERT OR IGNORE INTO stage_master (id, vegetable_id, name, order_index) VALUES
  (6,  2, '定植（苗から）', 1),
  (7,  2, '生育',           2),
  (8,  2, '収穫期',         3);

-- 小松菜: 3 stages
INSERT OR IGNORE INTO stage_master (id, vegetable_id, name, order_index) VALUES
  (9,  3, '種まき', 1),
  (10, 3, '生育',   2),
  (11, 3, '収穫',   3);

-- リーフレタス: 3 stages
INSERT OR IGNORE INTO stage_master (id, vegetable_id, name, order_index) VALUES
  (12, 4, '種まき',       1),
  (13, 4, '育苗・間引き', 2),
  (14, 4, '収穫期',       3);

-- 二十日大根: 3 stages
INSERT OR IGNORE INTO stage_master (id, vegetable_id, name, order_index) VALUES
  (15, 5, '種まき', 1),
  (16, 5, '生育',   2),
  (17, 5, '収穫',   3);

-- ニラ: 3 stages
INSERT OR IGNORE INTO stage_master (id, vegetable_id, name, order_index) VALUES
  (18, 6, '種まき・活着',     1),
  (19, 6, '生育',             2),
  (20, 6, '収穫期（多年草）', 3);

-- 万能ネギ: 3 stages
INSERT OR IGNORE INTO stage_master (id, vegetable_id, name, order_index) VALUES
  (21, 7, '種まき・活着', 1),
  (22, 7, '生育',         2),
  (23, 7, '収穫期',       3);

-- タマネギ: 4 stages
INSERT OR IGNORE INTO stage_master (id, vegetable_id, name, order_index) VALUES
  (24, 8, '育苗',       1),
  (25, 8, '定植',       2),
  (26, 8, '越冬・生育', 3),
  (27, 8, '収穫・乾燥', 4);

-- ジャガイモ: 4 stages
INSERT OR IGNORE INTO stage_master (id, vegetable_id, name, order_index) VALUES
  (28, 9, '種芋植え付け', 1),
  (29, 9, '発芽・生育',   2),
  (30, 9, '土寄せ・追肥', 3),
  (31, 9, '収穫',         4);

-- ================================================================
-- checkpoint_master  (one per stage)
-- ================================================================
INSERT OR IGNORE INTO checkpoint_master (id, stage_id, name, order_index) VALUES
  -- ミニトマト
  (1,  1,  '発芽を確認した',                     1),
  (2,  2,  '本葉4〜5枚になった',                 1),
  (3,  3,  '定植した',                           1),
  (4,  4,  '実が赤くなり始めた',                 1),
  (5,  5,  '収穫を終了した',                     1),
  -- きゅうり
  (6,  6,  '活着を確認した',                     1),
  (7,  7,  '最初の雌花が開花した',               1),
  (8,  8,  '収穫を終了した',                     1),
  -- 小松菜
  (9,  9,  '発芽を確認した',                     1),
  (10, 10, '草丈15〜20cmになった',               1),
  (11, 11, '収穫を終了した',                     1),
  -- リーフレタス
  (12, 12, '発芽を確認した',                     1),
  (13, 13, '本葉5〜6枚になった',                 1),
  (14, 14, '収穫を終了した',                     1),
  -- 二十日大根
  (15, 15, '発芽を確認した',                     1),
  (16, 16, '根が1〜2cmに膨らんだ',               1),
  (17, 17, '収穫を終了した',                     1),
  -- ニラ
  (18, 18, '発芽・活着を確認した',               1),
  (19, 19, '草丈20cm以上になった',               1),
  (20, 20, '株を休ませる（秋）',                 1),
  -- 万能ネギ
  (21, 21, '発芽・活着を確認した',               1),
  (22, 22, '草丈20cm以上になった',               1),
  (23, 23, '株を処分した',                       1),
  -- タマネギ
  (24, 24, '苗が鉛筆ほどの太さになった',         1),
  (25, 25, '活着を確認した',                     1),
  (26, 26, '葉が倒れ始めた（収穫サイン）',       1),
  (27, 27, '乾燥・保管完了',                     1),
  -- ジャガイモ
  (28, 28, '芽が出てきた',                       1),
  (29, 29, '草丈20〜30cmになった',               1),
  (30, 30, '花が咲いた（または葉が枯れ始めた）', 1),
  (31, 31, '収穫・保管完了',                     1);

-- ================================================================
-- task_master  columns: id, stage_id, name, task_type, days_from_stage_start, interval_days
-- one_time: interval_days=NULL, days_from_stage_start=days after stage start (0=same day)
-- recurring: days_from_stage_start=NULL, interval_days=repeat every N days
-- ================================================================
INSERT OR IGNORE INTO task_master (id, stage_id, name, task_type, days_from_stage_start, interval_days) VALUES
  -- ミニトマト 種まき (stage 1)
  (1,  1,  '水やり',           'recurring', NULL, 1),
  -- ミニトマト 育苗 (stage 2)
  (2,  2,  '水やり',           'recurring', NULL, 2),
  (3,  2,  '液肥',             'recurring', NULL, 7),
  -- ミニトマト 定植 (stage 3)
  (4,  3,  '支柱立て',         'one_time',  0,    NULL),
  (5,  3,  '水やり',           'recurring', NULL, 2),
  -- ミニトマト 生育・着果 (stage 4)
  (6,  4,  '水やり',           'recurring', NULL, 2),
  (7,  4,  '芽かき',           'recurring', NULL, 7),
  (8,  4,  '追肥',             'recurring', NULL, 14),
  -- ミニトマト 収穫期 (stage 5)
  (9,  5,  '水やり',           'recurring', NULL, 2),
  (10, 5,  '収穫',             'recurring', NULL, 3),
  (11, 5,  '追肥',             'recurring', NULL, 14),
  -- きゅうり 定植（苗から） (stage 6)
  (12, 6,  '支柱立て',         'one_time',  0,    NULL),
  (13, 6,  '水やり',           'recurring', NULL, 1),
  -- きゅうり 生育 (stage 7)
  (14, 7,  '水やり',           'recurring', NULL, 1),
  (15, 7,  '追肥',             'recurring', NULL, 7),
  (16, 7,  '誘引',             'recurring', NULL, 3),
  -- きゅうり 収穫期 (stage 8)
  (17, 8,  '水やり',           'recurring', NULL, 1),
  (18, 8,  '収穫',             'recurring', NULL, 2),
  (19, 8,  '追肥',             'recurring', NULL, 7),
  -- 小松菜 種まき (stage 9)
  (20, 9,  '水やり',           'recurring', NULL, 1),
  -- 小松菜 生育 (stage 10)
  (21, 10, '水やり',           'recurring', NULL, 2),
  (22, 10, '間引き',           'one_time',  7,    NULL),
  -- 小松菜 収穫 (stage 11)
  (23, 11, '収穫',             'recurring', NULL, 3),
  -- リーフレタス 種まき (stage 12)
  (24, 12, '水やり',           'recurring', NULL, 1),
  -- リーフレタス 育苗・間引き (stage 13)
  (25, 13, '水やり',           'recurring', NULL, 2),
  (26, 13, '間引き',           'one_time',  7,    NULL),
  -- リーフレタス 収穫期 (stage 14)
  (27, 14, '水やり',           'recurring', NULL, 2),
  (28, 14, '外葉収穫',         'recurring', NULL, 4),
  -- 二十日大根 種まき (stage 15)
  (29, 15, '水やり',           'recurring', NULL, 1),
  -- 二十日大根 生育 (stage 16)
  (30, 16, '水やり',           'recurring', NULL, 1),
  (31, 16, '間引き',           'one_time',  5,    NULL),
  -- 二十日大根 収穫 (stage 17)
  (32, 17, '収穫',             'one_time',  0,    NULL),
  -- ニラ 種まき・活着 (stage 18)
  (33, 18, '水やり',           'recurring', NULL, 2),
  -- ニラ 生育 (stage 19)
  (34, 19, '水やり',           'recurring', NULL, 3),
  (35, 19, '追肥',             'recurring', NULL, 30),
  -- ニラ 収穫期（多年草） (stage 20)
  (36, 20, '水やり',           'recurring', NULL, 3),
  (37, 20, '追肥',             'recurring', NULL, 30),
  (38, 20, '収穫',             'recurring', NULL, 30),
  -- 万能ネギ 種まき・活着 (stage 21)
  (39, 21, '水やり',           'recurring', NULL, 2),
  -- 万能ネギ 生育 (stage 22)
  (40, 22, '水やり',           'recurring', NULL, 3),
  (41, 22, '追肥',             'recurring', NULL, 21),
  -- 万能ネギ 収穫期 (stage 23)
  (42, 23, '水やり',           'recurring', NULL, 3),
  (43, 23, '追肥',             'recurring', NULL, 21),
  (44, 23, '収穫（根元3cm残し）', 'recurring', NULL, 7),
  -- タマネギ 育苗 (stage 24)
  (45, 24, '水やり',           'recurring', NULL, 2),
  -- タマネギ 定植 (stage 25)
  (46, 25, '定植',             'one_time',  0,    NULL),
  (47, 25, '水やり',           'recurring', NULL, 3),
  -- タマネギ 越冬・生育 (stage 26)
  (48, 26, '追肥',             'recurring', NULL, 30),
  (49, 26, '観察',             'recurring', NULL, 14),
  -- タマネギ 収穫・乾燥 (stage 27)
  (50, 27, '収穫',             'one_time',  0,    NULL),
  (51, 27, '乾燥',             'one_time',  3,    NULL),
  -- ジャガイモ 種芋植え付け (stage 28)
  (52, 28, '植え付け',         'one_time',  0,    NULL),
  -- ジャガイモ 発芽・生育 (stage 29)
  (53, 29, '水やり',           'recurring', NULL, 5),
  (54, 29, '芽かき',           'one_time',  14,   NULL),
  -- ジャガイモ 土寄せ・追肥 (stage 30)
  (55, 30, '土寄せ',           'one_time',  0,    NULL),
  (56, 30, '追肥',             'one_time',  0,    NULL),
  (57, 30, '水やり',           'recurring', NULL, 5),
  -- ジャガイモ 収穫 (stage 31)
  (58, 31, '収穫',             'one_time',  0,    NULL),
  (59, 31, '乾燥',             'one_time',  1,    NULL);
