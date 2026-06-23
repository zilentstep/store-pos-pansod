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
  ('salmon',   'Onigiri', 'Salmon Onigiri',         'ข้าวปั้นแซลมอน',     45, 1),
  ('tuna',     'Onigiri', 'Tuna Mayo Onigiri',       'ข้าวปั้นทูน่า',        40, 2),
  ('umeboshi', 'Onigiri', 'Umeboshi Onigiri',        'ข้าวปั้นบ๊วย',         35, 3),
  ('teriyaki', 'Onigiri', 'Teriyaki Chicken Onigiri', 'ข้าวปั้นไก่เทริยากิ',  50, 4),
  ('codroe',   'Onigiri', 'Spicy Cod Roe Onigiri',   'ข้าวปั้นมันกุ้ง',       48, 5),
  ('veggie',   'Onigiri', 'Veggie Miso Onigiri',     'ข้าวปั้นผักมิโสะ',      38, 6),
  ('misosoup', 'Sides',   'Miso Soup',               'ซุปมิโสะ',             25, 7),
  ('edamame',  'Sides',   'Edamame',                 'ถั่วแระญี่ปุ่น',         30, 8),
  ('salad',    'Sides',   'Seaweed Salad',           'ยำสาหร่าย',            35, 9),
  ('greentea', 'Drinks',  'Green Tea',               'ชาเขียว',              20, 10),
  ('ramune',   'Drinks',  'Ramune',                  'รามุเนะ',              25, 11),
  ('water',    'Drinks',  'Water',                   'น้ำเปล่า',             15, 12);
