-- PANSOD Store Seed Data

-- Default PIN
INSERT OR IGNORE INTO settings (key, value) VALUES ('pin', '1234');

-- Categories
INSERT OR IGNORE INTO categories (id, en_name, th_name, sort_order) VALUES
  (1, 'Onigiri', 'ข้าวปั้น', 1),
  (2, 'Sides', 'เครื่องเคียง', 2),
  (3, 'Drinks', 'เครื่องดื่ม', 3);

-- Default menu items
INSERT OR IGNORE INTO menu_items (id, cat, en_name, th_name, price, sort_order) VALUES
  ('salmon-teri',    'Onigiri', 'Salmon Teriyaki',     'แซลมอนเทอริยากิ',   49, 1),
  ('braised-pork',   'Onigiri', 'Braised Pork',        'หมูฮ้อง',            49, 2),
  ('saba-teri',      'Onigiri', 'Saba Teriyaki',       'ซาบะเทอริยากิ',      49, 3),
  ('spicy-tobiko',   'Onigiri', 'Spicy Tobiko',        'ไข่กุ้งมาโยเผ็ด',    49, 4),
  ('spicy-tuna',     'Onigiri', 'Spicy Tuna Mayo',     'ทูน่ามาโยเผ็ด',      49, 5),
  ('tuna-mayo',      'Onigiri', 'Tuna Mayo',           'ทูน่ามาโย',          39, 6),
  ('crab-stick',     'Onigiri', 'Crab Stick Mayo',     'ปูอัดมาโย',          39, 7),
  ('basil-chicken',  'Onigiri', 'Basil Chicken',       'กะเพราไก่',         39, 8),
  ('sweet-seaweed',  'Onigiri', 'Sweet Seaweed',       'ยำสาหร่าย',          39, 9),
  ('shoyu',          'Onigiri', 'Shoyu',               'โชยุ',                5, 10),
  ('water',          'Drinks',  'Water',               'น้ำเปล่า',           15, 11),
  ('greentea',       'Drinks',  'Green Tea',           'ชาเขียว',            35, 12),
  ('peach-tea',      'Drinks',  'Peach Tea',           'ชาพีช',              30, 13);
