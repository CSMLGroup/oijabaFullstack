-- =============================================
-- OIJABA Seed Data – matches data.js sample accounts
-- Run AFTER schema.sql
-- =============================================

-- ─── ADMINS ─────────────────────────────────
-- Demo admin login (OTP is 1234 in development): 01900000000
INSERT INTO admins (id, phone, name, email, status) VALUES
  ('c0000003-0000-0000-0000-000000000001', '01900000000', 'Platform Admin', 'admin@oijaba.local', 'active')
ON CONFLICT (phone) DO NOTHING;

-- ─── SERVICE AREAS ──────────────────────────
INSERT INTO service_areas (name, name_bn, district, division, status, driver_count, ride_count) VALUES
  ('Faridpur Sadar',   'ফরিদপুর সদর',   'Faridpur',   'Dhaka',     'active', 84, 284),
  ('Madaripur',        'মাদারীপুর',     'Madaripur',  'Dhaka',     'active', 61, 161),
  ('Sirajganj',        'সিরাজগঞ্জ',     'Sirajganj',  'Rajshahi',  'active', 48, 124),
  ('Goalanda Ghat',    'গোয়ালন্দ ঘাট', 'Rajbari',    'Dhaka',     'active', 34,  98),
  ('Boalmari',         'বোয়ালমারী',    'Faridpur',   'Dhaka',     'active', 29,  74),
  ('Netrokona Sadar',  'নেত্রকোণা সদর','Netrokona',  'Mymensingh','active', 22,  58),
  ('Keshabpur',        'কেশবপুর',       'Jessore',    'Khulna',    'active', 19,  49),
  ('Madhupur',         'মধুপুর',        'Tangail',    'Dhaka',     'active', 14,  35),
  ('Jamalpur Sadar',   'জামালপুর সদর', 'Jamalpur',   'Mymensingh','active', 11,  28),
  ('Shariatpur',       'শরীয়তপুর',    'Shariatpur', 'Dhaka',     'pending',  0,   0)
ON CONFLICT DO NOTHING;

-- ─── RIDERS ─────────────────────────────────
INSERT INTO riders (id, phone, name, name_bn, area, avatar, membership, status, created_at) VALUES
  ('a0000001-0000-0000-0000-000000000001','01711234567','Fatema Begum','ফাতেমা বেগম','Kalibari Bazar, Faridpur','👩','Regular','active','2024-09-12'),
  ('a0000001-0000-0000-0000-000000000002','01812345678','Rafiqul Islam','রফিকুল ইসলাম','Goalanda Ghat, Rajbari','👨','Regular','active','2024-11-03'),
  ('a0000001-0000-0000-0000-000000000003','01911456789','Nasrin Akter','নাসরিন আক্তার','Boalmari Upazila, Faridpur','👩','New','active','2025-01-18'),
  ('a0000001-0000-0000-0000-000000000004','01615567890','Abdul Karim','আব্দুল করিম','Sirajganj Sadar','👴','Frequent','active','2024-08-22'),
  ('a0000001-0000-0000-0000-000000000005','01512678901','Sharmin Sultana','শারমিন সুলতান','Netrokona Sadar','👩','New','active','2025-02-01'),
  ('a0000001-0000-0000-0000-000000000006','01311789012','Mohammad Hossain','মোহাম্মদ হোসেন','Jamalpur Sadar','👨','Frequent','suspended','2024-07-15'),
  ('a0000001-0000-0000-0000-000000000007','01700890123','Ruksana Parvin','রুকসানা পারভীন','Madhupur, Tangail','👩','New','active','2025-03-01'),
  ('a0000001-0000-0000-0000-000000000008','01911901234','Alam Pramanik','আলম প্রামাণিক','Keshabpur, Jessore','👨','Frequent','active','2024-10-30'),
  ('a0000001-0000-0000-0000-000000000009','01799345001','Samina Aktar','সামিনা আক্তার','Faridpur Sadar','👩','Regular','active','2025-02-15'),
  ('a0000001-0000-0000-0000-000000000010','01815456002','Habibar Rahman','হাবিবার রহমান','Madaripur Sadar','👨','New','active','2025-03-01'),
  ('a0000001-0000-0000-0000-000000000011','01778567003','Khoda Bakhsh','খোদা বকশ','Sirajganj Sadar','👴','Frequent','active','2024-10-22'),
  ('a0000001-0000-0000-0000-000000000012','01816678004','Joyita Das','জয়িতা দাস','Goalanda Ghat','👩','New','active','2025-01-10'),
  ('a0000001-0000-0000-0000-000000000013','01798789005','Limon Ahmed','লিমন আহমেদ','Boalmari, Faridpur','👨','Regular','active','2024-09-18'),
  ('a0000001-0000-0000-0000-000000000014','01817890006','Mehnaz Akter','মেহনাজ আক্তার','Netrokona Sadar','👩','New','active','2025-02-28'),
  ('a0000001-0000-0000-0000-000000000015','01714901007','Shawkat Ali','শওকত আলী','Keshabpur, Jessore','👨','Frequent','active','2024-11-05'),
  ('a0000001-0000-0000-0000-000000000016','01819012008','Ratna Roy','রত্না রয়','Madhupur, Tangail','👩','Regular','active','2024-12-20'),
  ('a0000001-0000-0000-0000-000000000017','01788123009','Jamal Uddin','জামাল উদ্দিন','Faridpur Sadar','👨','New','active','2025-03-05'),
  ('a0000001-0000-0000-0000-000000000018','01816234010','Neela Saha','নীলা সাহা','Jamalpur Sadar','👩','Regular','active','2025-01-15')
ON CONFLICT (phone) DO NOTHING;

-- ─── DRIVERS ────────────────────────────────
INSERT INTO drivers (id, phone, name, name_bn, area, vehicle_type, vehicle_model, vehicle_plate, nid_verified, avatar, status, is_online, rating_sum, rating_count, total_rides, total_earned, today_earned, today_rides, badges, created_at) VALUES
  ('b0000002-0000-0000-0000-000000000001','01812111222','Karim Mia','করিম মিয়া','Faridpur Sadar','cng','Bajaj RE 2019','Fari-ধ-1234',TRUE,'🧑','active',TRUE,4134,847,847,68420,840,10,'{"Top Driver","100% Safe"}','2024-06-10'),
  ('b0000002-0000-0000-0000-000000000002','01711222333','Reza Ahmed','রেজা আহমেদ','Madaripur Sadar','motorbike','Yamaha FZS 2021','Mad-ক-5678',TRUE,'👦','active',TRUE,2347,489,512,28960,560,12,'{"Fast Delivery"}','2024-08-14'),
  ('b0000002-0000-0000-0000-000000000003','01611333444','Sohel Rana','সোহেল রানা','Goalanda Ghat, Rajbari','boat','Engine Boat 2020','Raj-নৌ-091',TRUE,'🧑','active',TRUE,970,198,203,30450,720,6,'{"River Expert","Top Driver"}','2024-09-01'),
  ('b0000002-0000-0000-0000-000000000004','01912444555','Jalal Uddin','জালাল উদ্দিন','Sirajganj Sadar','van','Easy Bike Van 2022','Sir-গ-3322',TRUE,'👨','active',FALSE,745,162,178,18640,480,8,'{}','2024-11-20'),
  ('b0000002-0000-0000-0000-000000000005','01513555666','Aminul Islam','আমিনুল ইসলাম','Boalmari, Faridpur','battery','Electric Rickshaw 2023','Fari-ব-0201',TRUE,'🧑','active',TRUE,414,88,94,8460,320,9,'{"Eco Driver"}','2025-01-05'),
  ('b0000002-0000-0000-0000-000000000006','01411666777','Harun-or-Rashid','হারুন-অর-রশীদ','Keshabpur, Jessore','tractor','Power Tiller 2018','Jes-ট-0044',TRUE,'👴','active',TRUE,278,58,61,24400,400,2,'{"Farm Specialist"}','2024-07-22'),
  ('b0000002-0000-0000-0000-000000000007','01315777888','Milon Hossain','মিলন হোসেন','Netrokona Sadar','cng','Bajaj RE 2020','Net-ধ-7777',FALSE,'👦','pending',FALSE,108,24,28,2240,0,0,'{}','2025-02-14'),
  ('b0000002-0000-0000-0000-000000000008','01714888999','Salam Sheikh','সালাম শেখ','Faridpur Sadar','motorbike','Honda CB 2022','Fari-ক-4488',TRUE,'🧑','pending',FALSE,0,0,0,0,0,0,'{}','2025-03-01'),
  ('b0000002-0000-0000-0000-000000000009','01616999000','Badrul Alam','বদরুল আলম','Madaripur','cng','Bajaj RE 2017','Mad-ধ-2233',TRUE,'👨','suspended',FALSE,954,298,312,25600,0,0,'{}','2024-10-01'),
  ('b0000002-0000-0000-0000-000000000010','01799111444','Mohammad Suhag','মোহাম্মদ সুহাগ','Faridpur Sadar','cng','Bajaj RE 2021','Fari-ধ-5555',TRUE,'👨','active',TRUE,3456,712,756,54320,650,11,'{"Top Driver"}','2024-05-10'),
  ('b0000002-0000-0000-0000-000000000011','01817222555','Nasir Uddin','নাসির উদ্দিন','Madaripur Sadar','motorbike','Hero MotoCorp 2023','Mad-ক-6789',TRUE,'🧑','active',TRUE,2189,456,489,25640,480,9,'{"Fast Driver"}','2024-09-22'),
  ('b0000002-0000-0000-0000-000000000012','01788333666','Ibrahim Khan','ইব্রাহিম খান','Sirajganj Sadar','van','Suzuki Van 2020','Sir-গ-4455',TRUE,'👨','active',FALSE,567,124,138,15890,380,7,'{}','2024-12-15'),
  ('b0000002-0000-0000-0000-000000000013','01714444777','Sadequl Islam','সাদেকুল ইসলাম','Boalmari, Faridpur','battery','E-Rickshaw 2022','Fari-ব-9001',TRUE,'🧑','active',TRUE,289,68,76,6890,220,5,'{"Eco Driver"}','2025-01-12'),
  ('b0000002-0000-0000-0000-000000000014','01819555888','Kamal Hossain','কামাল হোসেন','Goalanda Ghat','boat','Wooden Boat 2019','Raj-নৌ-0502',TRUE,'👴','active',TRUE,612,156,172,28900,520,4,'{"River Expert"}','2024-08-30'),
  ('b0000002-0000-0000-0000-000000000015','01798666999','Nurul Islam','নুরুল ইসলাম','Keshabpur, Jessore','tractor','Mini Tractor 2021','Jes-ট-1122',TRUE,'👨','active',TRUE,345,78,89,26750,450,3,'{"Farm Specialist"}','2024-10-18'),
  ('b0000002-0000-0000-0000-000000000016','01816777000','Arafat Hossain','আরাফাত হোসেন','Netrokona Sadar','cng','Bajaj Auto 2022','Net-ধ-2233',TRUE,'🧑','active',TRUE,1876,389,421,31200,590,8,'{}','2024-07-05'),
  ('b0000002-0000-0000-0000-000000000017','01715888111','Rajib Das','রাজিব দাস','Madhupur, Tangail','motorbike','Bajaj Pulsar 2021','Tan-ক-3344',TRUE,'👦','active',TRUE,1245,267,298,19850,410,7,'{"Fast Delivery"}','2024-11-12'),
  ('b0000002-0000-0000-0000-000000000018','01812999222','Farhan Ahmed','ফরহান আহমেদ','Jamalpur Sadar','van','Standard Van 2020','Jam-গ-5566',FALSE,'👨','pending',FALSE,234,52,58,4520,0,0,'{}','2025-02-28')
ON CONFLICT (phone) DO NOTHING;

-- Update suspended reason for driver and rider
UPDATE drivers SET suspend_reason = '3 safety complaints – investigation pending' WHERE phone = '01616999000';
UPDATE riders SET suspend_reason = 'Payment dispute – under review' WHERE phone = '01311789012';

-- ─── SAMPLE COMPLETED RIDES ─────────────────
INSERT INTO rides (ride_ref, rider_id, driver_id, vehicle_type, pickup_name, destination_name, status, fare_final, payment_method, payment_status, rider_rating, driver_rating, created_at, completed_at) VALUES
  ('OIJ-8474',(SELECT id FROM riders WHERE phone='01911901234'),(SELECT id FROM drivers WHERE phone='01411666777'),'tractor','Keshabpur Farm','Jessore Market','completed',200,'cash','paid',5,5,'2025-03-14 06:00:00','2025-03-14 07:30:00'),
  ('OIJ-8472',(SELECT id FROM riders WHERE phone='01615567890'),(SELECT id FROM drivers WHERE phone='01812111222'),'cng','Sirajganj Market','Enayetpur Hospital','completed',90,'bkash','paid',5,5,'2025-03-14 09:15:00','2025-03-14 10:00:00'),
  ('OIJ-8471',(SELECT id FROM riders WHERE phone='01911456789'),(SELECT id FROM drivers WHERE phone='01711222333'),'motorbike','Boalmari Bazaar','School Road','completed',45,'cash','paid',5,5,'2025-03-14 07:45:00','2025-03-14 08:20:00'),
  ('OIJ-8470',(SELECT id FROM riders WHERE phone='01812345678'),(SELECT id FROM drivers WHERE phone='01611333444'),'boat','Goalanda Ghat','Rajbari Sadar','completed',120,'cash','paid',5,4,'2025-03-13 08:00:00','2025-03-13 09:10:00'),
  ('OIJ-8469',(SELECT id FROM riders WHERE phone='01911456789'),(SELECT id FROM drivers WHERE phone='01513555666'),'battery','UP Office','Health Centre','completed',30,'cash','paid',4,5,'2025-03-13 11:00:00','2025-03-13 11:30:00')
ON CONFLICT DO NOTHING;

-- ─── SAMPLE LIVE RIDES ───────────────────────
INSERT INTO rides (ride_ref, rider_id, driver_id, vehicle_type, pickup_name, destination_name, status, fare_estimate, payment_method, created_at) VALUES
  ('OIJ-8478',(SELECT id FROM riders WHERE phone='01711234567'),(SELECT id FROM drivers WHERE phone='01812111222'),'cng','Kalibari Bazar','Faridpur Hospital','started',80,'cash',NOW()),
  ('OIJ-8477',(SELECT id FROM riders WHERE phone='01615567890'),(SELECT id FROM drivers WHERE phone='01711222333'),'motorbike','Sirajganj Market','Enayetpur','accepted',90,'cash',NOW()),
  ('OIJ-8476',(SELECT id FROM riders WHERE phone='01812345678'),(SELECT id FROM drivers WHERE phone='01611333444'),'boat','Goalanda Ghat','Rajbari','pickup',120,'cash',NOW()),
  ('OIJ-8475',(SELECT id FROM riders WHERE phone='01700890123'),(SELECT id FROM drivers WHERE phone='01513555666'),'battery','Madhupur School','UP Office','started',40,'bkash',NOW())
ON CONFLICT DO NOTHING;

-- ─── SAMPLE PARCELS ──────────────────────────
INSERT INTO parcels (parcel_ref, sender_name, sender_phone, receiver_name, receiver_phone, pickup_location, delivery_location, item_type, driver_id, status, delivery_fee, payment_method, created_at) VALUES
  ('OIJ-P-20851','Fatema Begum','01711234567','Dr. Anwar','01712000001','Kalibari Bazar','Faridpur Hospital','medicine',(SELECT id FROM drivers WHERE phone='01812111222'),'transit',80,'cash',NOW()),
  ('OIJ-P-20850','Abdul Karim','01615567890','Land Office Clerk','01712000002','Sirajganj Market','Sirajganj Land Office','documents',(SELECT id FROM drivers WHERE phone='01711222333'),'delivered',60,'cash',NOW()-interval '2 hours'),
  ('OIJ-P-20849','Village Shop','01812000111','Ruksana Parvin','01700890123','Boalmari Market','Madhupur','groceries',(SELECT id FROM drivers WHERE phone='01513555666'),'delivered',45,'cash',NOW()-interval '1 day'),
  ('OIJ-P-20848','Alam Pramanik','01911901234','City Buyer','01712000003','Keshabpur Farm','Jessore Town Market','farm',(SELECT id FROM drivers WHERE phone='01411666777'),'delivered',150,'cash',NOW()-interval '1 day'),
  ('OIJ-P-20847','Anonymous Sender','01700000000','Sharmin Sultana','01512678901','Dhaka Road','Netrokona','package',(SELECT id FROM drivers WHERE phone='01912444555'),'transit',55,'cash',NOW())
ON CONFLICT DO NOTHING;

-- ─── EXTRA RIDES FOR SAMPLE USERS ──────────────────────────────────────────
-- Rider 1: Fatema Begum  (01711234567)  — frequent CNG commuter in Faridpur
-- Rider 2: Abdul Karim   (01615567890)  — frequent rider in Sirajganj
-- Driver A: Karim Mia    (01812111222)  — CNG driver Faridpur
-- Driver B: Reza Ahmed   (01711222333)  — Motorbike driver Madaripur
-- Driver C: Aminul Islam (01513555666)  — Battery rickshaw Boalmari
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO rides (ride_ref, rider_id, driver_id, vehicle_type, pickup_name, destination_name, status, fare_final, payment_method, payment_status, rider_rating, driver_rating, created_at, completed_at) VALUES

  -- Fatema Begum × Karim Mia (CNG) — 5 completed
  ('OIJ-8201',(SELECT id FROM riders WHERE phone='01711234567'),(SELECT id FROM drivers WHERE phone='01812111222'),'cng',
   'Kalibari Bazar','Faridpur District Hospital','completed',75,'cash','paid',5,5,
   '2026-01-05 08:10:00','2026-01-05 08:45:00'),

  ('OIJ-8202',(SELECT id FROM riders WHERE phone='01711234567'),(SELECT id FROM drivers WHERE phone='01812111222'),'cng',
   'Faridpur District Hospital','Kalibari Bazar','completed',75,'bkash','paid',4,5,
   '2026-01-05 16:00:00','2026-01-05 16:35:00'),

  ('OIJ-8215',(SELECT id FROM riders WHERE phone='01711234567'),(SELECT id FROM drivers WHERE phone='01812111222'),'cng',
   'Kalibari Bazar','Faridpur Bus Stand','completed',60,'cash','paid',5,5,
   '2026-01-18 07:50:00','2026-01-18 08:20:00'),

  ('OIJ-8240',(SELECT id FROM riders WHERE phone='01711234567'),(SELECT id FROM drivers WHERE phone='01812111222'),'cng',
   'Goalanda Road','Faridpur Court Building','completed',90,'bkash','paid',5,4,
   '2026-02-07 09:00:00','2026-02-07 09:40:00'),

  ('OIJ-8261',(SELECT id FROM riders WHERE phone='01711234567'),(SELECT id FROM drivers WHERE phone='01812111222'),'cng',
   'Kalibari Bazar','Faridpur College Gate','completed',55,'cash','paid',4,5,
   '2026-02-22 14:15:00','2026-02-22 14:40:00'),

  -- Fatema Begum × Aminul Islam (Battery) — 2 short trips
  ('OIJ-8250',(SELECT id FROM riders WHERE phone='01711234567'),(SELECT id FROM drivers WHERE phone='01513555666'),'battery',
   'UP Office Boalmari','Local Health Centre','completed',30,'cash','paid',5,5,
   '2026-02-12 10:00:00','2026-02-12 10:25:00'),

  ('OIJ-8268',(SELECT id FROM riders WHERE phone='01711234567'),(SELECT id FROM drivers WHERE phone='01513555666'),'battery',
   'Boalmari Primary School','Bazaar Gate','completed',25,'cash','paid',4,4,
   '2026-03-01 12:30:00','2026-03-01 12:50:00'),

  -- Fatema Begum — 1 cancelled ride
  ('OIJ-8233',(SELECT id FROM riders WHERE phone='01711234567'),(SELECT id FROM drivers WHERE phone='01814888999'),'motorbike',
   'Kalibari Bazar','Faridpur Zilla School','cancelled',NULL,'cash','pending',NULL,NULL,
   '2026-01-29 07:00:00',NULL),

  -- Abdul Karim × Karim Mia (CNG) — 4 completed (travels Sirajganj ↔ Enayetpur)
  ('OIJ-8220',(SELECT id FROM riders WHERE phone='01615567890'),(SELECT id FROM drivers WHERE phone='01799111444'),'cng',
   'Sirajganj Market','Enayetpur Hospital','completed',90,'cash','paid',5,5,
   '2026-01-22 09:15:00','2026-01-22 10:00:00'),

  ('OIJ-8230',(SELECT id FROM riders WHERE phone='01615567890'),(SELECT id FROM drivers WHERE phone='01799111444'),'cng',
   'Enayetpur Hospital','Sirajganj Sadar','completed',90,'bkash','paid',5,5,
   '2026-01-28 14:00:00','2026-01-28 14:45:00'),

  ('OIJ-8245',(SELECT id FROM riders WHERE phone='01615567890'),(SELECT id FROM drivers WHERE phone='01799111444'),'cng',
   'Sirajganj Bus Stand','Belkuchi Bazar','completed',70,'cash','paid',4,5,
   '2026-02-09 08:30:00','2026-02-09 09:05:00'),

  ('OIJ-8265',(SELECT id FROM riders WHERE phone='01615567890'),(SELECT id FROM drivers WHERE phone='01799111444'),'cng',
   'Jagir Colony Sirajganj','District Court','completed',55,'cash','paid',5,4,
   '2026-02-27 10:00:00','2026-02-27 10:30:00'),

  -- Abdul Karim × Reza Ahmed (Motorbike) — 3 completed
  ('OIJ-8210',(SELECT id FROM riders WHERE phone='01615567890'),(SELECT id FROM drivers WHERE phone='01711222333'),'motorbike',
   'Sirajganj Market','Bagbati Ferry Ghat','completed',50,'cash','paid',5,5,
   '2026-01-15 07:00:00','2026-01-15 07:30:00'),

  ('OIJ-8235',(SELECT id FROM riders WHERE phone='01615567890'),(SELECT id FROM drivers WHERE phone='01711222333'),'motorbike',
   'Sirajganj Sadar','Raiganj Bazaar','completed',65,'cash','paid',4,5,
   '2026-02-02 11:00:00','2026-02-02 11:35:00'),

  ('OIJ-8260',(SELECT id FROM riders WHERE phone='01615567890'),(SELECT id FROM drivers WHERE phone='01711222333'),'motorbike',
   'Sirajganj High School','Police Station Road','completed',40,'bkash','paid',5,5,
   '2026-02-20 16:00:00','2026-02-20 16:25:00'),

  -- Abdul Karim — 1 cancelled ride
  ('OIJ-8256',(SELECT id FROM riders WHERE phone='01615567890'),(SELECT id FROM drivers WHERE phone='01817222555'),'motorbike',
   'Sirajganj Market','Habiganj Crossing','cancelled',NULL,'cash','pending',NULL,NULL,
   '2026-02-16 09:00:00',NULL)

ON CONFLICT DO NOTHING;

-- ─── SAMPLE COMPLAINTS ───────────────────────
INSERT INTO complaints (complaint_ref, reporter_type, reporter_id, against_type, against_id, complaint_type, detail, priority, status, created_at) VALUES
  ('C-043','rider',(SELECT id FROM riders WHERE phone='01615567890'),'driver',(SELECT id FROM drivers WHERE phone='01616999000'),'Safety','Reckless driving on highway, refused to stop','high','open','2025-03-14'),
  ('C-042','rider',(SELECT id FROM riders WHERE phone='01711234567'),NULL,NULL,'Overcharge','Charged ৳120 for ৳60 route','medium','open','2025-03-13'),
  ('C-041','rider',(SELECT id FROM riders WHERE phone='01311789012'),'driver',(SELECT id FROM drivers WHERE phone='01812111222'),'Dispute','Argument over route deviation','low','resolved','2025-03-10'),
  ('C-040','rider',(SELECT id FROM riders WHERE phone='01911456789'),NULL,NULL,'No Show','Driver accepted ride then cancelled 20 min later','low','resolved','2025-03-09')
ON CONFLICT DO NOTHING;

-- ─── VEHICLES ──────────────────────────────
INSERT INTO vehicles (id, name, name_bn, img, emoji, enabled, fare, base_fare, per_km_rate, min_fare, fare_rule_en, fare_rule_bn, capacity, sort_order) VALUES
-- ─── DRIVER WALLETS ─────────────────────────
INSERT INTO driver_wallet (driver_id, balance, total_earned, total_withdrawn)
SELECT id, 2840.00, 12450.00, 9610.00 FROM drivers WHERE phone='01700000001'
ON CONFLICT (driver_id) DO UPDATE SET balance=EXCLUDED.balance, total_earned=EXCLUDED.total_earned, total_withdrawn=EXCLUDED.total_withdrawn, updated_at=NOW();

INSERT INTO driver_wallet (driver_id, balance, total_earned, total_withdrawn)
SELECT id, 4820.00, 68420.00, 63600.00 FROM drivers WHERE phone='01812111222'
ON CONFLICT (driver_id) DO UPDATE SET balance=EXCLUDED.balance, total_earned=EXCLUDED.total_earned, total_withdrawn=EXCLUDED.total_withdrawn, updated_at=NOW();

INSERT INTO driver_wallet (driver_id, balance, total_earned, total_withdrawn)
SELECT id, 1960.00, 28960.00, 27000.00 FROM drivers WHERE phone='01711222333'
ON CONFLICT (driver_id) DO UPDATE SET balance=EXCLUDED.balance, total_earned=EXCLUDED.total_earned, total_withdrawn=EXCLUDED.total_withdrawn, updated_at=NOW();

INSERT INTO driver_wallet (driver_id, balance, total_earned, total_withdrawn)
SELECT id, 5120.00, 54320.00, 49200.00 FROM drivers WHERE phone='01799111444'
ON CONFLICT (driver_id) DO UPDATE SET balance=EXCLUDED.balance, total_earned=EXCLUDED.total_earned, total_withdrawn=EXCLUDED.total_withdrawn, updated_at=NOW();

INSERT INTO driver_wallet (driver_id, balance, total_earned, total_withdrawn)
SELECT id, 960.00, 8460.00, 7500.00 FROM drivers WHERE phone='01513555666'
ON CONFLICT (driver_id) DO UPDATE SET balance=EXCLUDED.balance, total_earned=EXCLUDED.total_earned, total_withdrawn=EXCLUDED.total_withdrawn, updated_at=NOW();

INSERT INTO driver_wallet (driver_id, balance, total_earned, total_withdrawn)
SELECT id, 2150.00, 30450.00, 28300.00 FROM drivers WHERE phone='01611333444'
ON CONFLICT (driver_id) DO UPDATE SET balance=EXCLUDED.balance, total_earned=EXCLUDED.total_earned, total_withdrawn=EXCLUDED.total_withdrawn, updated_at=NOW();

INSERT INTO driver_wallet (driver_id, balance, total_earned, total_withdrawn)
SELECT id, 1840.00, 18640.00, 16800.00 FROM drivers WHERE phone='01912444555'
ON CONFLICT (driver_id) DO UPDATE SET balance=EXCLUDED.balance, total_earned=EXCLUDED.total_earned, total_withdrawn=EXCLUDED.total_withdrawn, updated_at=NOW();

-- ─── DRIVER SAMPLE TRANSACTIONS ─────────────
-- Only insert if no transactions exist for that driver yet
INSERT INTO driver_transactions (driver_id, type, amount, direction, reference_type, gateway, recipient_number, note, status, created_at)
SELECT d.id, t.type, t.amount, t.direction, t.ref_type, t.gateway, t.recipient, t.note, 'completed', t.created_at
FROM drivers d
JOIN (VALUES
  ('01700000001', 'ride_earnings',  80,  'credit', 'ride',  NULL,    NULL,           'Ride – Kalibari to Hospital',       '2026-01-05 08:45:00'::timestamptz),
  ('01700000001', 'ride_earnings',  90,  'credit', 'ride',  NULL,    NULL,           'Ride – Hospital to Kalibari',       '2026-01-05 16:35:00'::timestamptz),
  ('01700000001', 'bonus',         200,  'credit', NULL,    NULL,    NULL,           'Weekly top driver bonus',           '2026-01-10 10:00:00'::timestamptz),
  ('01700000001', 'ride_earnings',  75,  'credit', 'ride',  NULL,    NULL,           'Ride – Kalibari to Bus Stand',      '2026-01-18 08:20:00'::timestamptz),
  ('01700000001', 'withdrawal',    500,  'debit',  NULL,    'bkash', '01700000001',  'bKash withdrawal',                  '2026-01-20 12:00:00'::timestamptz),
  ('01700000001', 'ride_earnings',  65,  'credit', 'ride',  NULL,    NULL,           'Ride – Sirajganj to Raiganj',       '2026-02-02 11:35:00'::timestamptz),
  ('01700000001', 'ride_earnings',  90,  'credit', 'ride',  NULL,    NULL,           'Ride – Goalanda to Court Bldg',     '2026-02-07 09:40:00'::timestamptz),
  ('01700000001', 'ride_earnings',  55,  'credit', 'ride',  NULL,    NULL,           'Ride – Kalibari to College Gate',   '2026-02-22 14:40:00'::timestamptz),
  ('01700000001', 'withdrawal',    700,  'debit',  NULL,    'nagad', '01700000001',  'Nagad withdrawal',                  '2026-02-25 09:30:00'::timestamptz),
  ('01700000001', 'ride_earnings', 120,  'credit', 'ride',  NULL,    NULL,           'Ride – Goalanda Ghat to Rajbari',   '2026-03-13 09:10:00'::timestamptz),
  ('01700000001', 'ride_earnings',  75,  'credit', 'ride',  NULL,    NULL,           'Ride – Sirajganj to Enayetpur',     '2026-03-14 10:00:00'::timestamptz),
  ('01700000001', 'withdrawal',    410,  'debit',  NULL,    'bkash', '01700000001',  'bKash withdrawal',                  '2026-03-15 14:00:00'::timestamptz),
  ('01700000001', 'ride_earnings',  80,  'credit', 'ride',  NULL,    NULL,           'Ride – Kalibari to Hospital',       '2026-03-20 09:30:00'::timestamptz),
  ('01700000001', 'bonus',         150,  'credit', NULL,    NULL,    NULL,           'Eid special bonus',                 '2026-03-20 10:00:00'::timestamptz),
  ('01812111222', 'ride_earnings',  90,  'credit', 'ride',  NULL,    NULL,           'Ride – Sirajganj to Enayetpur',     '2026-03-14 10:00:00'::timestamptz),
  ('01812111222', 'ride_earnings',  75,  'credit', 'ride',  NULL,    NULL,           'Ride – Kalibari to Hospital',       '2026-01-05 08:45:00'::timestamptz),
  ('01812111222', 'bonus',         500,  'credit', NULL,    NULL,    NULL,           'Monthly top driver bonus',          '2026-02-01 10:00:00'::timestamptz),
  ('01812111222', 'withdrawal',   3000,  'debit',  NULL,    'bkash', '01812111222',  'bKash withdrawal',                  '2026-02-05 12:00:00'::timestamptz),
  ('01812111222', 'ride_earnings',  60,  'credit', 'ride',  NULL,    NULL,           'Ride – Kalibari to Bus Stand',      '2026-01-18 08:20:00'::timestamptz),
  ('01812111222', 'withdrawal',   2000,  'debit',  NULL,    'nagad', '01812111222',  'Nagad withdrawal',                  '2026-03-01 09:00:00'::timestamptz),
  ('01711222333', 'ride_earnings',  45,  'credit', 'ride',  NULL,    NULL,           'Ride – Boalmari to School Road',    '2026-03-14 08:20:00'::timestamptz),
  ('01711222333', 'ride_earnings',  50,  'credit', 'ride',  NULL,    NULL,           'Ride – Sirajganj to Ferry Ghat',    '2026-01-15 07:30:00'::timestamptz),
  ('01711222333', 'bonus',         300,  'credit', NULL,    NULL,    NULL,           'Fast delivery milestone bonus',     '2026-02-15 10:00:00'::timestamptz),
  ('01711222333', 'withdrawal',   2500,  'debit',  NULL,    'bkash', '01711222333',  'bKash withdrawal',                  '2026-02-20 11:00:00'::timestamptz)
) AS t(phone, type, amount, direction, ref_type, gateway, recipient, note, created_at) ON d.phone = t.phone
WHERE NOT EXISTS (SELECT 1 FROM driver_transactions dt WHERE dt.driver_id = d.id);

-- ─── VEHICLES ──────────────────────────────
INSERT INTO vehicles (id, name, name_bn, img, emoji, enabled, fare, base_fare, per_km_rate, min_fare, fare_rule_en, fare_rule_bn, capacity, sort_order) VALUES
  ('auto',    'Auto Rickshaw',       'অটো-রিকশা',           '/assets/vehicles/easybike.jpg',  NULL, TRUE, 40, 35, 12, 40,  'Base ৳35 + ৳12/km (min ৳40)',       'বেস ৳৩৫ + ৳১২/কিমি (ন্যূনতম ৳৪০)', 3, 1),
  ('bike',    'Motorbike',           'মোটরবাইক',            '/assets/vehicles/motorbike.jpg', NULL, TRUE, 20, 20, 10, 25,  'Base ৳20 + ৳10/km (min ৳25)',       'বেস ৳২০ + ৳১০/কিমি (ন্যূনতম ৳২৫)', 1, 2),
  ('rickshaw','Battery Rickshaw',    'ব্যাটারি রিকশা',       '/assets/vehicles/rickshaw.jpg',  NULL, TRUE, 25, 22, 8,  25,  'Base ৳22 + ৳8/km (min ৳25)',        'বেস ৳২২ + ৳৮/কিমি (ন্যূনতম ৳২৫)',  2, 3),
  ('van',     'Van Rickshaw',        'ভ্যান রিকশা',         '/assets/vehicles/van.jpg',       NULL, TRUE, 15, 18, 7,  20,  'Base ৳18 + ৳7/km (min ৳20)',        'বেস ৳১৮ + ৳৭/কিমি (ন্যূনতম ৳২০)',  5, 4),
  ('boat',    'Boat / Nouka',        'নৌকা',                NULL,                              '⛵', TRUE, 30, 30, 14, 35,  'Base ৳30 + ৳14/km (min ৳35)',       'বেস ৳৩০ + ৳১৪/কিমি (ন্যূনতম ৳৩৫)', 8, 5),
  ('tractor', 'Tractor Transport',   'ট্রাক্টর পরিবহন',      NULL,                              '🚜', TRUE, 80, 70, 20, 80,  'Base ৳70 + ৳20/km (min ৳80)',       'বেস ৳৭০ + ৳২০/কিমি (ন্যূনতম ৳৮০)', 1, 6),
  ('shared',  'Shared Auto Rickshaw','শেয়ার্ড অটো-রিকশা',   '/assets/vehicles/easybike.jpg',  NULL, TRUE, 15, 12, 6,  15,  'Per seat: base ৳12 + ৳6/km',        'প্রতি সিট: বেস ৳১২ + ৳৬/কিমি',      3, 7),
  ('car',     'Private Car',         'প্রাইভেট কার',         NULL,                              '🚗', TRUE, 120,95, 25, 120, 'Base ৳95 + ৳25/km (min ৳120)',      'বেস ৳৯৫ + ৳২৫/কিমি (ন্যূনতম ৳১২০)',4, 8)
ON CONFLICT (id) DO NOTHING;

-- ─── ADDITIONAL SEED DATA FOR ALL TABLES ─────────────

-- OTPs
INSERT INTO otps (id, phone, otp, user_type, expires_at, used, created_at) VALUES
  ('otp-0001-0000-0000-0000-000000000001', '01900000000', '1234', 'admin', NOW() + interval '10 minutes', FALSE, NOW())
ON CONFLICT DO NOTHING;

-- PAYMENTS
INSERT INTO payments (id, reference_id, reference_type, gateway, amount, currency, status, initiated_at) VALUES
  ('pay-0001-0000-0000-0000-000000000001', (SELECT id FROM rides LIMIT 1), 'ride', 'cash', 100, 'BDT', 'pending', NOW())
ON CONFLICT DO NOTHING;

-- DRIVER VEHICLES
INSERT INTO driver_vehicles (id, driver_id, vehicle_type, vehicle_model, vehicle_plate, is_primary, created_at) VALUES
  ('dv-0001-0000-0000-0000-000000000001', (SELECT id FROM drivers LIMIT 1), 'cng', 'Bajaj RE', 'Fari-ধ-1234', TRUE, NOW())
ON CONFLICT DO NOTHING;

-- DRIVER PAYMENT RECIPIENTS
INSERT INTO driver_payment_recipients (id, driver_id, gateway, number, label, verified, created_at) VALUES
  ('dpr-0001-0000-0000-0000-000000000001', (SELECT id FROM drivers LIMIT 1), 'bkash', '01700000001', 'Primary bKash', TRUE, NOW())
ON CONFLICT DO NOTHING;
