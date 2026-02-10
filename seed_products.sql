DO $$
DECLARE
    new_p_id bigint;
    v_id_1 uuid;
    v_id_2 uuid;
BEGIN

-- 0. CLEANUP (To prevent Duplicate SKU/FK errors)
-- We delete existing data to ensure a fresh seed.
DELETE FROM order_items;
DELETE FROM order_status_history;
DELETE FROM invoices;
DELETE FROM shipments;
DELETE FROM orders;

DELETE FROM inventory_transactions;
DELETE FROM inventory_ledger;
DELETE FROM warehouse_batch_stock;
DELETE FROM warehouse_stock;
DELETE FROM product_batches;
DELETE FROM product_reviews;
DELETE FROM product_variants;
DELETE FROM products;
DELETE FROM brands;
DELETE FROM categories;
DELETE FROM concerns;

RAISE NOTICE 'Cleanup completed. Starting seed...';

-- ==========================================
-- 0. Reference Data (Brands, Categories, Concerns)
-- ==========================================
-- Brands
INSERT INTO brands (name, description, origin_country) VALUES 
('VedPure', 'Authentic Ayurvedic formulations for holistic wellness.', 'India'),
('GlowVeda', 'Premium herbal skincare and beauty products.', 'India'),
('NatureTouch', 'Natural and organic personal care essentials.', 'India'),
('HealthVeda', 'Science-backed herbal supplements and health drinks.', 'India'),
('KeshKing', 'Specialized ayurvedic hair care solutions.', 'India'),
('MountainGold', 'Pure and potent Shilajit and resin products.', 'India');

-- Categories (Using generic images or placeholders)
INSERT INTO categories (name, image) VALUES 
('Wellness', 'https://images.unsplash.com/photo-1544367563-12123d8965cd?auto=format&fit=crop&q=80&w=200'),
('Supplements', 'https://images.unsplash.com/photo-1577401239170-897942555fb3?auto=format&fit=crop&q=80&w=200'),
('Digestive Health', 'https://images.unsplash.com/photo-1598514983318-2f64f8f4796c?auto=format&fit=crop&q=80&w=200'),
('Skincare', 'https://images.unsplash.com/photo-1596462502278-27bfdd403348?auto=format&fit=crop&q=80&w=200'),
('Beauty', 'https://images.unsplash.com/photo-1616686693529-166ee5c4cb84?auto=format&fit=crop&q=80&w=200'),
('Haircare', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=200'),
('Immunity', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=200'),
('Family Health', 'https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?auto=format&fit=crop&q=80&w=200'),
('Men Health', 'https://images.unsplash.com/photo-1592534571960-0d3597d3eb6f?auto=format&fit=crop&q=80&w=200'),
('Pain Relief', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200'),
('Diabetes Care', 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?auto=format&fit=crop&q=80&w=200'),
('Juices', 'https://images.unsplash.com/photo-1623945761367-175a133dfa42?auto=format&fit=crop&q=80&w=200'),
('Bath & Body', 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&q=80&w=200'),
('Tea', 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&q=80&w=200'),
('Brain Health', 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=200'),
('Weight Loss', 'https://images.unsplash.com/photo-1576435728678-0e86b245d8b5?auto=format&fit=crop&q=80&w=200');

-- Concerns
INSERT INTO concerns (name) VALUES 
('Stress'), ('Fatigue'), ('Insomnia'), 
('Constipation'), ('Indigestion'), ('Detox'), 
('Acne'), ('Oily Skin'), ('Blemishes'), ('Dry Skin'), ('Sunburn'), 
('Hair Fall'), ('Cold & Cough'), ('Respiratory Health'), 
('Weak Immunity'), ('General Weakness'), ('Dandruff'), ('Grey Hair'), 
('Joint Pain'), ('Inflammation'), ('Back Pain'), ('Arthritis'),
('Low Energy'), ('Stamina'), ('Vitality'), 
('Dull Skin'), ('Pigmentation'), ('Dark Spots'), ('Dryness'), ('Body Odor'), 
('Aging'), ('Open Pores'), ('Weight Gain'), ('Slow Metabolism'), 
('Low Immunity'), ('Memory Loss'), ('Focus'), ('Immunity'), ('Diabetes'), 
('Blood Sugar'), ('Hair Loss'), ('Dry Hair');

RAISE NOTICE 'Reference Data (Brands, Categories, Concerns) seeded.';

-- ==========================================
-- 1. Ashwagandha Powder (Wellness)
-- ==========================================
INSERT INTO products (
    name, description, short_description, price, category, brand, stock_status, product_type, hsn_code, gst_rate, stock_quantity, image,
    features, ingredients, benefits, usage, concern, meta_keywords, specifications, seo_title, meta_description
)
VALUES (
    'Ashwagandha Root Powder', 
    'Our organic Ashwagandha powder is sourced from the finest roots in India. Known as Indian Ginseng, it is a powerful adaptogen that helps the body manage stress. It boosts energy levels, improves concentration, and supports overall vitality. This 100% pure powder is free from additives and preservatives.',
    'Premium organic adaptogen for stress relief and vitality.',
    299.00, 
    ARRAY['Wellness', 'Supplements'], 
    'VedPure', 
    'In Stock', 
    'Medicine', 
    '1211', 
    5, 
    100, 
    'https://images.unsplash.com/photo-1623945761367-175a133dfa42?auto=format&fit=crop&q=80&w=600',
    'Certified Organic, Non-GMO, Vegan, Gluten-Free',
    '100% Pure Withania Somnifera (Ashwagandha) Root Extract',
    'Reduces stress and anxiety, Boosts energy and stamina, Improves sleep quality, Enhances cognitive function',
    'Mix 1 teaspoon (3-5g) in warm milk or water. Drink once or twice daily.',
    ARRAY['Stress', 'Fatigue', 'Insomnia'],
    'ashwagandha, stress relief, organic powder, vedpure, adaptogen, immunity',
    'Form: Powder | Shelf Life: 24 Months | Origin: India',
    'Organic Ashwagandha Powder - Stress Relief | VedPure',
    'Buy Premium Organic Ashwagandha Powder. Natural stress relief and energy booster. Certified pure and potent.'
) RETURNING id INTO new_p_id;

-- Variants
INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '100g Pack', 'ASHWA-100', 299.00, 399.00, 50, 5, '1211') RETURNING id INTO v_id_1;
INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '250g Pack', 'ASHWA-250', 699.00, 899.00, 50, 5, '1211') RETURNING id INTO v_id_2;

-- Batches (Expiry)
INSERT INTO product_batches (variant_id, batch_number, mfg_date, expiry_date, current_quantity, initial_quantity) VALUES
(v_id_1, 'ASH-B01', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '23 months', 50, 50),
(v_id_2, 'ASH-B02', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '23 months', 50, 50);


-- ==========================================
-- 2. Triphala Churna (Digestive)
-- ==========================================
INSERT INTO products (
    name, description, short_description, price, category, brand, stock_status, product_type, hsn_code, gst_rate, stock_quantity, image,
    features, ingredients, benefits, usage, concern, meta_keywords, specifications, seo_title, meta_description
)
VALUES (
    'Triphala Churna',
    'A traditional Ayurvedic formulation consisting of three fruits: Amalaki, Bibhitaki, and Haritaki. This gentle cleanser detoxifies the body, improves digestion, and supports regular bowel movements.',
    'Traditional three-fruit blend for digestion and detox.',
    150.00,
    ARRAY['Digestive Health', 'Wellness'],
    'VedPure',
    'In Stock',
    'Medicine',
    '3004',
    12,
    120,
    'https://images.unsplash.com/photo-1615485925763-867862f85c18?auto=format&fit=crop&q=80&w=600',
    'Gentle Laxative, Vitamin C Rich, Antioxidant',
    'Amla (Emblica officinalis), Bibhitaki (Terminalia bellirica), Haritaki (Terminalia chebula)',
    'Relieves constipation, Improves eye health, Detoxifies colon, Boosts immunity',
    'Take 1 teaspoon with warm water at bedtime.',
    ARRAY['Constipation', 'Indigestion', 'Detox'],
    'triphala, digestion, constipation relief, ayurvedic churna, detox',
    'Form: Powder | Potency: High | Taste: Astringent',
    'Triphala Churna for Digestion & Detox | VedPure',
    'Shop Authentic Triphala Churna. Natural solution for constipation and digestive health.'
) RETURNING id INTO new_p_id;

INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '100g Jar', 'TRIP-100', 150.00, 199.00, 60, 12, '3004') RETURNING id INTO v_id_1;
INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '200g Jar', 'TRIP-200', 280.00, 399.00, 60, 12, '3004') RETURNING id INTO v_id_2;

INSERT INTO product_batches (variant_id, batch_number, mfg_date, expiry_date, current_quantity, initial_quantity) VALUES
(v_id_1, 'TRI-B01', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '22 months', 60, 60),
(v_id_2, 'TRI-B02', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '22 months', 60, 60);


-- ==========================================
-- 3. Neem Face Wash (Skincare)
-- ==========================================
INSERT INTO products (
    name, description, short_description, price, category, brand, stock_status, product_type, hsn_code, gst_rate, stock_quantity, image,
    features, ingredients, benefits, usage, concern, meta_keywords, specifications, seo_title, meta_description
)
VALUES (
    'Purifying Neem Face Wash',
    'A soap-free, herbal formulation that cleans impurities and helps clear pimples. A natural blend of Neem and Turmeric brings together their antibacterial and antifungal properties to prevent the recurrence of acne over time.',
    'Anti-acne face wash with purifying Neem and Turmeric.',
    199.00,
    ARRAY['Skincare', 'Beauty'],
    'GlowVeda',
    'In Stock',
    'Cosmetic',
    '3304',
    18,
    200,
    'https://images.unsplash.com/photo-1629198774783-a9792040ce28?auto=format&fit=crop&q=80&w=600',
    'Soap-Free, Paraben-Free, Dermatologically Tested',
    'Neem Extract, Turmeric, Aqua, Glycerin',
    'Controls acne and pimples, Purifies skin, Removes excess oil',
    'Moisten face, apply a small quantity and gently work up a lather using a circular motion. Wash off and pat dry.',
    ARRAY['Acne', 'Oily Skin', 'Blemishes'],
    'neem face wash, acne control, pimple clear, herbal face wash',
    'Skin Type: Oily/Acne-Prone | Texture: Gel | Fragrance: Herbal',
    'Neem Face Wash for Acne & Pimples | GlowVeda',
    'Best Herbal Neem Face Wash. Cleanses skin and prevents acne. Enriched with Turmeric.'
) RETURNING id INTO new_p_id;

INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '100ml Tube', 'NEEMFW-100', 199.00, 249.00, 100, 18, '3304') RETURNING id INTO v_id_1;
INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '200ml Pump', 'NEEMFW-200', 349.00, 499.00, 100, 18, '3304') RETURNING id INTO v_id_2;

INSERT INTO product_batches (variant_id, batch_number, mfg_date, expiry_date, current_quantity, initial_quantity) VALUES
(v_id_1, 'NF-B01', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE + INTERVAL '33 months', 100, 100),
(v_id_2, 'NF-B02', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE + INTERVAL '33 months', 100, 100);


-- ==========================================
-- 4. Aloe Vera Gel (Skincare)
-- ==========================================
INSERT INTO products (
    name, description, short_description, price, category, brand, stock_status, product_type, hsn_code, gst_rate, stock_quantity, image,
    features, ingredients, benefits, usage, concern, meta_keywords, specifications, seo_title, meta_description
)
VALUES (
    'Soothing Aloe Vera Gel',
    'Extracted from fresh organic aloe vera leaves. This non-sticky gel hydrates, calms, and repairs skin. It acts as a great moisturizer and provides relief from sunburn, shaving burns, and insect bites.',
    'Multipurpose 99% pure soothing gel.',
    249.00,
    ARRAY['Skincare', 'Haircare'],
    'NatureTouch',
    'In Stock',
    'Cosmetic',
    '3304',
    18,
    150,
    'https://images.unsplash.com/photo-1616750311758-29a3a9254848?auto=format&fit=crop&q=80&w=600',
    '99% Pure Aloe, No Added Color, Fragrance Free',
    'Aloe Barbadensis Leaf Juice, Vitamin E, Preservatives',
    'Hydrates skin, Soothes sunburn, Reduces acne scars, Conditions hair',
    'Apply liberally to face, body, or hair. Massage gently until absorbed.',
    ARRAY['Dry Skin', 'Sunburn', 'Hair Fall'],
    'aloe vera gel, organic aloe, moisturizer, skin soothing',
    'Color: Clear | Consistency: Gel | Skin Type: All',
    'Pure Aloe Vera Gel for Skin & Hair | NatureTouch',
    'Shop 99% Pure Aloe Vera Gel. Soothes, hydrates and repairs skin naturally.'
) RETURNING id INTO new_p_id;

INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '100g Tub', 'ALOE-100', 249.00, 299.00, 75, 18, '3304') RETURNING id INTO v_id_1;
INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '300g Value Pack', 'ALOE-300', 599.00, 799.00, 75, 18, '3304') RETURNING id INTO v_id_2;

INSERT INTO product_batches (variant_id, batch_number, mfg_date, expiry_date, current_quantity, initial_quantity) VALUES
(v_id_1, 'AG-B01', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '23 months', 75, 75),
(v_id_2, 'AG-B02', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '23 months', 75, 75);


-- ==========================================
-- 5. Tulsi Drops (Immunity)
-- ==========================================
INSERT INTO products (
    name, description, short_description, price, category, brand, stock_status, product_type, hsn_code, gst_rate, stock_quantity, image,
    features, ingredients, benefits, usage, concern, meta_keywords, specifications, seo_title, meta_description
)
VALUES (
    'Panch Tulsi Drops',
    'A concentrated liquid extract of 5 rare types of Tulsi (Basil). Just a few drops in water act as a natural immunity booster and help fight common cold, cough, and respiratory infections.',
    'Concentrated extract of 5 types of Tulsi.',
    199.00,
    ARRAY['Immunity', 'Wellness'],
    'VedPure',
    'Low Stock',
    'Medicine',
    '3004',
    12,
    40,
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=600',
    'High Potency, Natural Antibiotic, Anti-Viral',
    'Extracts of Rama, Shyam, Vana, Kapoor, and Arjak Tulsi',
    'Boosts immunity, Relieves cough and cold, Purifies blood',
    'Add 2-3 drops in a glass of water or tea. Consume twice daily.',
    ARRAY['Immunity', 'Cold & Cough', 'Respiratory Health'],
    'tulsi drops, immunity booster, holy basil, herbal drops',
    'Form: Liquid | Concentration: 5x | Alcohol Free',
    'Panch Tulsi Drops for Immunity | VedPure',
    'Boost your immunity naturally with Panch Tulsi Drops. Fight cold and flu.'
) RETURNING id INTO new_p_id;

INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '20ml Bottle', 'TULSI-20', 199.00, 220.00, 20, 12, '3004') RETURNING id INTO v_id_1;
INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '50ml Bottle', 'TULSI-50', 449.00, 550.00, 20, 12, '3004') RETURNING id INTO v_id_2;

INSERT INTO product_batches (variant_id, batch_number, mfg_date, expiry_date, current_quantity, initial_quantity) VALUES
(v_id_1, 'TD-B01', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '34 months', 20, 20),
(v_id_2, 'TD-B02', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '34 months', 20, 20);

RAISE NOTICE 'Seeded 5 products...';

-- ==========================================
-- 6. Chyawanprash (Immunity)
-- ==========================================
INSERT INTO products (
    name, description, short_description, price, category, brand, stock_status, product_type, hsn_code, gst_rate, stock_quantity, image,
    features, ingredients, benefits, usage, concern, meta_keywords, specifications, seo_title, meta_description
)
VALUES (
    'Organix Chyawanprash',
    'An ancient Ayurvedic formulation prepared with Amla and over 40 potent herbs. It rejuvenate the body, strengthens the immune system, and promotes longevity.',
    'Classic Amla superfood for all-season immunity.',
    350.00,
    ARRAY['Immunity', 'Family Health'],
    'VedPure',
    'In Stock',
    'Medicine',
    '2106',
    12,
    80,
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600',
    'Rich in Vitamin C, 40+ Herbs, No Artificial Sweeteners',
    'Amla, Ghee, Honey, Ashwagandha, Pippali, Cardamom',
    'Builds resistance to illness, Improves digestion, Revitalizes body tissues',
    'Adults: 1-2 teaspoons daily. Children: 1 teaspoon daily. Best with warm milk.',
    ARRAY['Weak Immunity', 'General Weakness'],
    'chyawanprash, immunity jam, ayurvedic tonic, amla',
    'Base: Amla & Ghee | Taste: Sweet & Tangy | Color: Dark Brown',
    'Best Chyawanprash for Family Immunity | VedPure',
    'Traditional Ayurvedic Chyawanprash for health and vitality. 40+ Herbs.'
) RETURNING id INTO new_p_id;

INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '500g Jar', 'CHY-500', 350.00, 395.00, 40, 12, '2106') RETURNING id INTO v_id_1;
INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '1kg Jar', 'CHY-1000', 650.00, 750.00, 40, 12, '2106') RETURNING id INTO v_id_2;

INSERT INTO product_batches (variant_id, batch_number, mfg_date, expiry_date, current_quantity, initial_quantity) VALUES
(v_id_1, 'CHY-B01', CURRENT_DATE - INTERVAL '4 months', CURRENT_DATE + INTERVAL '20 months', 40, 40),
(v_id_2, 'CHY-B02', CURRENT_DATE - INTERVAL '4 months', CURRENT_DATE + INTERVAL '20 months', 40, 40);


-- ==========================================
-- 7. Bhringraj Hair Oil (Haircare)
-- ==========================================
INSERT INTO products (
    name, description, short_description, price, category, brand, stock_status, product_type, hsn_code, gst_rate, stock_quantity, image,
    features, ingredients, benefits, usage, concern, meta_keywords, specifications, seo_title, meta_description
)
VALUES (
    'Intensive Bhringraj Hair Oil',
    'Prepared by the traditional Kshir Pak Vidhi, this oil nourishes hair roots and prevents hair fall. Bhringraj, known as the "King of Hair", promotes growth and delays greying.',
    'Ayurvedic oil for hair growth and hair fall control.',
    399.00,
    ARRAY['Haircare'],
    'KeshKing',
    'In Stock',
    'Cosmetic',
    '3305',
    18,
    100,
    'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&q=80&w=600',
    'Mineral Oil Free, 100% Ayurvedic, Clinical Proven',
    'Bhringraj, Amla, Sesame Oil, Coconut Oil, Hibiscus',
    'Reduces hair fall, Promotes new hair growth, Prevents premature greying',
    'Massage oil into scalp and leave for at least 1 hour or overnight before washing.',
    ARRAY['Hair Fall', 'Dandruff', 'Grey Hair'],
    'bhringraj oil, hair growth oil, ayurvedic hair oil, kesh king',
    'Base: Sesame Oil | Scent: Herbal | Viscosity: Medium',
    'Bhringraj Oil for Hair Growth | KeshKing',
    'Stop hair fall with Intensive Bhringraj Hair Oil. Promotes thick, healthy hair.'
) RETURNING id INTO new_p_id;

INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '100ml Bottle', 'HAIR-100', 399.00, 499.00, 50, 18, '3305') RETURNING id INTO v_id_1;
INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '200ml Bottle', 'HAIR-200', 749.00, 999.00, 50, 18, '3305') RETURNING id INTO v_id_2;

INSERT INTO product_batches (variant_id, batch_number, mfg_date, expiry_date, current_quantity, initial_quantity) VALUES
(v_id_1, 'KESH-B01', CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '30 months', 50, 50),
(v_id_2, 'KESH-B02', CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '30 months', 50, 50);

-- ==========================================
-- 8. Curcumin Capsules (Supplements)
-- ==========================================
INSERT INTO products (
    name, description, short_description, price, category, brand, stock_status, product_type, hsn_code, gst_rate, stock_quantity, image,
    features, ingredients, benefits, usage, concern, meta_keywords, specifications, seo_title, meta_description
)
VALUES (
    'Turmeric Curcumin Gold',
    'High potency Curcumin capsules enhanced with BioPerine (Black Pepper Extract) for maximum absorption. A powerful anti-inflammatory and antioxidant supplement.',
    '95% Curcuminoids with Piperine for absorption.',
    599.00,
    ARRAY['Supplements', 'Wellness'],
    'HealthVeda',
    'In Stock',
    'Medicine',
    '3004',
    12,
    200,
    'https://images.unsplash.com/photo-1624640604179-880620392341?auto=format&fit=crop&q=80&w=600',
    'High Potency, Vegan Shell, Non-GMO',
    'Turmeric Extract (Curcumin), Black Pepper Extract',
    'Reduces joint pain, Fights inflammation, Boosts immunity, Supports heart health',
    'Take 1 capsule twice a day after meals.',
    ARRAY['Joint Pain', 'Inflammation', 'Immunity'],
    'curcumin capsules, turmeric supplement, joint pain relief, anti-inflammatory',
    'Strength: 500mg | Count: 60/120 | Type: Capsule',
    'Buy Curcumin Capsules for Joints | HealthVeda',
    'Advanced Curcumin formula for joint relief and immunity. Enhanced absorption.'
) RETURNING id INTO new_p_id;

INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '60 Caps', 'CUR-60', 599.00, 799.00, 100, 12, '3004') RETURNING id INTO v_id_1;
INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '120 Caps', 'CUR-120', 999.00, 1499.00, 100, 12, '3004') RETURNING id INTO v_id_2;

INSERT INTO product_batches (variant_id, batch_number, mfg_date, expiry_date, current_quantity, initial_quantity) VALUES
(v_id_1, 'CUR-B01', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '23 months', 100, 100),
(v_id_2, 'CUR-B02', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '23 months', 100, 100);

-- ==========================================
-- 9. Shilajit (Men's Health)
-- ==========================================
INSERT INTO products (
    name, description, short_description, price, category, brand, stock_status, product_type, hsn_code, gst_rate, stock_quantity, image,
    features, ingredients, benefits, usage, concern, meta_keywords, specifications, seo_title, meta_description
)
VALUES (
    'Himalayan Shilajit Resin',
    'Sourced from 18,000 ft in the Himalayas, our Shilajit is purified and rich in Fulvic Acid. It boosts testosterone, enhances stamina, and improves physical performance.',
    'Pure resin for power, stamina and vitality.',
    1299.00,
    ARRAY['Wellness', 'Men Health'],
    'MountainGold',
    'In Stock',
    'Medicine',
    '3004',
    12,
    50,
    'https://images.unsplash.com/photo-1576673442511-7e39b6545c87?auto=format&fit=crop&q=80&w=600',
    'Lab Tested Purity, Rich in Fulvic Acid, Heavy Metal Tested',
    'Purified Shilajit Resin',
    'Boosts testosterone, Increases energy levels, Supports muscle recovery',
    'Dissolve a pea-sized amount (300-500mg) in warm milk or water daily.',
    ARRAY['Low Energy', 'Stamina', 'Vitality'],
    'shilajit resin, testosterone booster, himalayan shilajit, mens health',
    'Form: Resin | Purity: >60% Fulvic Acid | Origin: Himalayas',
    'Original Himalayan Shilajit Resin | MountainGold',
    'Premium Shilajit Resin for Strength and Stamina. Lab verified purity.'
) RETURNING id INTO new_p_id;

INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '15g Jar', 'SHILA-15', 1299.00, 1999.00, 25, 12, '3004') RETURNING id INTO v_id_1;
INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '30g Jar', 'SHILA-30', 2199.00, 3499.00, 25, 12, '3004') RETURNING id INTO v_id_2;

INSERT INTO product_batches (variant_id, batch_number, mfg_date, expiry_date, current_quantity, initial_quantity) VALUES
(v_id_1, 'SH-B01', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '34 months', 25, 25),
(v_id_2, 'SH-B02', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '34 months', 25, 25);

-- ==========================================
-- 10. Saffron Cream (Beauty)
-- ==========================================
INSERT INTO products (
    name, description, short_description, price, category, brand, stock_status, product_type, hsn_code, gst_rate, stock_quantity, image,
    features, ingredients, benefits, usage, concern, meta_keywords, specifications, seo_title, meta_description
)
VALUES (
    'Kumkumadi Saffron Cream',
    'A luxurious skin brightening cream infused with Kashmiri Saffron and Kumkumadi Tailam. It reduces dark spots, improves skin texture, and gives a natural golden glow.',
    'Brightening cream for radiant, glowing skin.',
    899.00,
    ARRAY['Beauty', 'Skincare'],
    'GlowVeda',
    'In Stock',
    'Cosmetic',
    '3304',
    18,
    60,
    'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&q=80&w=600',
    'Ayurvedic Formulation, No Bleach, Cruelty Free',
    'Saffron, Sandalwood, Manjistha, Goat Milk, Liquorice',
    'Brightens complexion, Fades dark spots, Hydrates skin, Anti-aging',
    'Apply on clean face and neck in upward circular strokes. Use daily.',
    ARRAY['Dull Skin', 'Pigmentation', 'Dark Spots'],
    'saffron cream, kumkumadi cream, face brightening, glowing skin',
    'Skin Type: All | Texture: Creamy | SPF: None',
    'Kumkumadi Saffron Face Cream | GlowVeda',
    'Get radiant skin with Saffron Face Cream. Reduces spots and pigmentation.'
) RETURNING id INTO new_p_id;

INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '50g Jar', 'SAFF-50', 899.00, 1200.00, 30, 18, '3304') RETURNING id INTO v_id_1;
INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '100g Jar', 'SAFF-100', 1599.00, 2200.00, 30, 18, '3304') RETURNING id INTO v_id_2;

INSERT INTO product_batches (variant_id, batch_number, mfg_date, expiry_date, current_quantity, initial_quantity) VALUES
(v_id_1, 'SAF-B01', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '11 months', 30, 30),
(v_id_2, 'SAF-B02', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '11 months', 30, 30);


RAISE NOTICE 'Seeded 10 products...';

-- ==========================================
-- 11. Herbal Shampoo (Haircare)
-- ==========================================
INSERT INTO products (
    name, description, short_description, price, category, brand, stock_status, product_type, hsn_code, gst_rate, stock_quantity, image,
    features, ingredients, benefits, usage, concern, meta_keywords, specifications, seo_title, meta_description
)
VALUES (
    'Herbal Shampoo',
    'A gentle, sulphate-free shampoo infused with Reetha, Shikakai, and Amla. It cleanses hair without stripping natural oils, leaving it soft, shiny, and manageable.',
    'Sulphate-free daily cleanser for soft hair.',
    249.00,
    ARRAY['Haircare'],
    'NatureTouch',
    'In Stock',
    'Cosmetic',
    '3305',
    18,
    150,
    'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&q=80&w=600',
    'Sulphate Free, Paraben Free, Color Safe',
    'Reetha, Shikakai, Amla, Aloe Vera',
    'Cleanses scalp, Conditions hair, Reduces dandruff, Adds shine',
    'Massage into wet hair to create lather. Rinse thoroughly.',
    ARRAY['Dandruff', 'Dry Hair'],
    'herbal shampoo, sulphate free shampoo, reetha shikakai, natural hair cleanser',
    'Hair Type: All | Scent: Floral | Volume: 200ml/500ml',
    'Natural Herbal Shampoo | NatureTouch',
    'Gentle sulphate-free Herbal Shampoo for daily use. Enriched with Reetha and Amla.'
) RETURNING id INTO new_p_id;

INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '200ml Bottle', 'SHAMP-200', 249.00, 299.00, 75, 18, '3305') RETURNING id INTO v_id_1;
INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '500ml Pump', 'SHAMP-500', 499.00, 699.00, 75, 18, '3305') RETURNING id INTO v_id_2;

INSERT INTO product_batches (variant_id, batch_number, mfg_date, expiry_date, current_quantity, initial_quantity) VALUES
(v_id_1, 'SHP-B01', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '22 months', 75, 75),
(v_id_2, 'SHP-B02', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '22 months', 75, 75);

-- ==========================================
-- 12. Brahmi Tablets (Brain Health)
-- ==========================================
INSERT INTO products (
    name, description, short_description, price, category, brand, stock_status, product_type, hsn_code, gst_rate, stock_quantity, image,
    features, ingredients, benefits, usage, concern, meta_keywords, specifications, seo_title, meta_description
)
VALUES (
    'Brahmi Memory Tablets',
    'Pure Brahmi extract tablets to enhance memory, concentration, and clarity. Brahmi is a renowned brain tonic that supports cognitive function and reduces mental fatigue.',
    'Brain tonic for memory and focus.',
    199.00,
    ARRAY['Supplements', 'Brain Health'],
    'VedPure',
    'In Stock',
    'Medicine',
    '3004',
    12,
    100,
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600',
    '100% Vegetarian, No Fillers, Lab Tested',
    'Bacopa Monnieri (Brahmi) Whole Plant Extract',
    'Improves memory, Enhances focus, Reduces anxiety, Calms the mind',
    'Take 1-2 tablets daily with water, preferably in the morning.',
    ARRAY['Focus', 'Memory Loss', 'Stress'],
    'brahmi tablets, memory booster, brain tonic, bacopa monnieri',
    'Strength: 250mg | Count: 60/120 | Form: Tablet',
    'Brahmi Tablets for Memory & Focus | VedPure',
    'Boost memory and concentration with Brahmi Tablets. Natural brain tonic.'
) RETURNING id INTO new_p_id;

INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '60 Tabs', 'BRAHMI-60', 199.00, 250.00, 50, 12, '3004') RETURNING id INTO v_id_1;
INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '120 Tabs', 'BRAHMI-120', 349.00, 480.00, 50, 12, '3004') RETURNING id INTO v_id_2;

INSERT INTO product_batches (variant_id, batch_number, mfg_date, expiry_date, current_quantity, initial_quantity) VALUES
(v_id_1, 'BR-B01', CURRENT_DATE - INTERVAL '5 months', CURRENT_DATE + INTERVAL '19 months', 50, 50),
(v_id_2, 'BR-B02', CURRENT_DATE - INTERVAL '5 months', CURRENT_DATE + INTERVAL '19 months', 50, 50);

-- ==========================================
-- 13. Pain Relief Oil (Wellness)
-- ==========================================
INSERT INTO products (
    name, description, short_description, price, category, brand, stock_status, product_type, hsn_code, gst_rate, stock_quantity, image,
    features, ingredients, benefits, usage, concern, meta_keywords, specifications, seo_title, meta_description
)
VALUES (
    'Mahanarayan Pain Relief Oil',
    'A classical Ayurvedic oil made with sesame oil and over 30 herbs. It provides effective relief from joint pain, arthritis, backache, and muscular stiffness.',
    'Traditional oil for joint and muscle pain.',
    180.00,
    ARRAY['Pain Relief', 'Wellness'],
    'VedPure',
    'In Stock',
    'Medicine',
    '3004',
    12,
    80,
    'https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?auto=format&fit=crop&q=80&w=600',
    'Authentic Formula, Deep Penetration, Fast Action',
    'Sesame Oil, Shatavari, Ashwagandha, Turmeric, Ginger',
    'Relieves joint pain, Reduces inflammation, Strengthens muscles and bones',
    'Warm slightly and massage gently on affected area.',
    ARRAY['Joint Pain', 'Arthritis', 'Back Pain'],
    'mahanarayan oil, pain relief oil, ayurvedic massage oil, joint pain',
    'Base: Sesame Oil | Type: Medicated Oil | Origin: India',
    'Mahanarayan Oil for Joint Pain Relief | VedPure',
    'Effective Ayurvedic relief for joint pain and arthritis with Mahanarayan Oil.'
) RETURNING id INTO new_p_id;

INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '100ml Bottle', 'PAIN-100', 180.00, 220.00, 40, 12, '3004') RETURNING id INTO v_id_1;
INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '200ml Bottle', 'PAIN-200', 320.00, 400.00, 40, 12, '3004') RETURNING id INTO v_id_2;

INSERT INTO product_batches (variant_id, batch_number, mfg_date, expiry_date, current_quantity, initial_quantity) VALUES
(v_id_1, 'MO-B01', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE + INTERVAL '33 months', 40, 40),
(v_id_2, 'MO-B02', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE + INTERVAL '33 months', 40, 40);

-- ==========================================
-- 14. Diabetic Care Juice (Wellness)
-- ==========================================
INSERT INTO products (
    name, description, short_description, price, category, brand, stock_status, product_type, hsn_code, gst_rate, stock_quantity, image,
    features, ingredients, benefits, usage, concern, meta_keywords, specifications, seo_title, meta_description
)
VALUES (
    'Diabetic Care Juice',
    'A synergistic blend of Karela (Bitter Gourd), Jamun (Indian Blackberry), and Gudmar. Helps regulate blood sugar levels naturally and improves insulin sensitivity.',
    'Karela Jamun juice for blood sugar control.',
    299.00,
    ARRAY['Diabetes Care', 'Juices'],
    'HealthVeda',
    'In Stock',
    'Medicine',
    '2202',
    12,
    60,
    'https://images.unsplash.com/photo-1616422285623-13ff0162193c?auto=format&fit=crop&q=80&w=600',
    'No Added Sugar, Organic Ingredients, GMP Certified',
    'Karela Juice, Jamun Juice, Gudmar Extract',
    'Regulates blood sugar, Purifies blood, Improves digestion',
    'Mix 30ml with a glass of water and drink empty stomach in the morning.',
    ARRAY['Diabetes', 'Blood Sugar'],
    'diabetic care juice, karela jamun juice, diabetes control, herbal juice',
    'Form: Liquid | Sugar Free | Packaging: Bottle',
    'Karela Jamun Juice for Diabetes | HealthVeda',
    'Manage blood sugar naturally with Organic Diabetic Care Juice. Sugar-free formula.'
) RETURNING id INTO new_p_id;

INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '500ml Bottle', 'DIAB-500', 299.00, 399.00, 30, 12, '2202') RETURNING id INTO v_id_1;
INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '1L Bottle', 'DIAB-1000', 499.00, 750.00, 30, 12, '2202') RETURNING id INTO v_id_2;

INSERT INTO product_batches (variant_id, batch_number, mfg_date, expiry_date, current_quantity, initial_quantity) VALUES
(v_id_1, 'DB-B01', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '11 months', 30, 30),
(v_id_2, 'DB-B02', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '11 months', 30, 30);

-- ==========================================
-- 15. Amla Juice (Immunity)
-- ==========================================
INSERT INTO products (
    name, description, short_description, price, category, brand, stock_status, product_type, hsn_code, gst_rate, stock_quantity, image,
    features, ingredients, benefits, usage, concern, meta_keywords, specifications, seo_title, meta_description
)
VALUES (
    'Organic Amla Juice',
    'Cold-pressed juice from wild organic Amlas. It is the richest natural source of Vitamin C. Enhances immunity, promotes hair growth, and improves skin health.',
    'Pure Vitamin C boost for hair and skin.',
    199.00,
    ARRAY['Juices', 'Immunity'],
    'NatureTouch',
    'In Stock',
    'Consumable',
    '2202',
    12,
    100,
    'https://images.unsplash.com/photo-1596700868102-1b1574cc4502?auto=format&fit=crop&q=80&w=600',
    'Cold Pressed, No Added Water, Organic',
    '100% Organic Amla Juice, Preservative (Sodium Benzoate)',
    'Boosts immunity, Improves vision, Promotes hair growth, Glowing skin',
    'Mix 20-30ml in water and drink daily.',
    ARRAY['Low Immunity', 'Hair Loss', 'Dull Skin'],
    'amla juice, vitamin c, immunity drink, organic amla',
    'Type: Cold Pressed | Origin: Pratapgarh | Taste: Sour',
    'Organic Amla Juice - Vitamin C Rich | NatureTouch',
    '100% Natural Cold Pressed Amla Juice. Boost immunity and hair health.'
) RETURNING id INTO new_p_id;

INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '500ml', 'AMLA-500', 199.00, 250.00, 50, 12, '2202') RETURNING id INTO v_id_1;
INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '1L', 'AMLA-1000', 349.00, 480.00, 50, 12, '2202') RETURNING id INTO v_id_2;

INSERT INTO product_batches (variant_id, batch_number, mfg_date, expiry_date, current_quantity, initial_quantity) VALUES
(v_id_1, 'AJ-B01', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '11 months', 50, 50),
(v_id_2, 'AJ-B02', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '11 months', 50, 50);

RAISE NOTICE 'Seeded 15 products...';

-- ==========================================
-- 16. Rose Water (Beauty)
-- ==========================================
INSERT INTO products (
    name, description, short_description, price, category, brand, stock_status, product_type, hsn_code, gst_rate, stock_quantity, image,
    features, ingredients, benefits, usage, concern, meta_keywords, specifications, seo_title, meta_description
)
VALUES (
    'Pure Rose Water',
    'Authentic steam-distilled rose water from Kannauj. It works as a natural toner, balancing the skin pH and tightening pores. Can also be used in face packs or as a refreshing mist.',
    'Steam distilled natural skin toner.',
    149.00,
    ARRAY['Skincare', 'Beauty'],
    'GlowVeda',
    'In Stock',
    'Cosmetic',
    '3304',
    18,
    100,
    'https://images.unsplash.com/photo-1596486001717-d77983633d7b?auto=format&fit=crop&q=80&w=600',
    'Alcohol Free, Edible Grade, Steam Distilled',
    'Rosa Damascena Flower Water',
    'Tones skin, Hydrates, Balances pH, Refreshes',
    'Spray directly onto face or apply with cotton pad.',
    ARRAY['Open Pores', 'Oily Skin'],
    'rose water, gulab jal, skin toner, face mist',
    'Method: Steam Distillation | Scent: Rose | Type: Toner',
    'Pure Kannauj Rose Water Toner | GlowVeda',
    '100% Steam Distilled Rose Water. Natural toner for all skin types.'
) RETURNING id INTO new_p_id;

INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '100ml Spray', 'ROSE-100', 149.00, 199.00, 50, 18, '3304') RETURNING id INTO v_id_1;
INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '200ml Refill', 'ROSE-200', 249.00, 350.00, 50, 18, '3304') RETURNING id INTO v_id_2;

INSERT INTO product_batches (variant_id, batch_number, mfg_date, expiry_date, current_quantity, initial_quantity) VALUES
(v_id_1, 'RW-B01', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '10 months', 50, 50),
(v_id_2, 'RW-B02', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '10 months', 50, 50);

-- ==========================================
-- 17. Sandalwood Soap (Bath)
-- ==========================================
INSERT INTO products (
    name, description, short_description, price, category, brand, stock_status, product_type, hsn_code, gst_rate, stock_quantity, image,
    features, ingredients, benefits, usage, concern, meta_keywords, specifications, seo_title, meta_description
)
VALUES (
    'Mysore Sandalwood Soap',
    'Handcrafted luxury soap enriched with pure Mysore Sandalwood Oil. Its lingering fragrance calms the senses while the natural oil nourishes the skin.',
    'Luxury soap with pure Sandalwood oil.',
    99.00,
    ARRAY['Bath & Body'],
    'NatureTouch',
    'In Stock',
    'Cosmetic',
    '3401',
    18,
    200,
    'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&q=80&w=600',
    'Handmade, Vegetable Oil Base, Lasting Fragrance',
    'Sandalwood Oil, Glycerin, Vegetable Oils',
    'Cooling effect, Removes body odor, Softens skin',
    'Lather on wet skin and rinse off.',
    ARRAY['Body Odor', 'Dryness'],
    'sandalwood soap, mysore sandal, handmade soap, luxury bath',
    'Weight: 75g/125g | Scent: Sandalwood | Type: Solid Bar',
    'Mysore Sandalwood Oil Soap | NatureTouch',
    'Experience luxury with handcrafted Sandalwood Soap. Nourishing and fragrant.'
) RETURNING id INTO new_p_id;

INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '75g Bar', 'SOAP-75', 99.00, 125.00, 100, 18, '3401') RETURNING id INTO v_id_1;
INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '125g Bar', 'SOAP-125', 149.00, 199.00, 100, 18, '3401') RETURNING id INTO v_id_2;

INSERT INTO product_batches (variant_id, batch_number, mfg_date, expiry_date, current_quantity, initial_quantity) VALUES
(v_id_1, 'SS-B01', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE + INTERVAL '21 months', 100, 100),
(v_id_2, 'SS-B02', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE + INTERVAL '21 months', 100, 100);

-- ==========================================
-- 18. Kumkumadi Tailam (Beauty)
-- ==========================================
INSERT INTO products (
    name, description, short_description, price, category, brand, stock_status, product_type, hsn_code, gst_rate, stock_quantity, image,
    features, ingredients, benefits, usage, concern, meta_keywords, specifications, seo_title, meta_description
)
VALUES (
    'Kumkumadi Tailam',
    'A miraculous beauty fluid made with Saffron and 26 precious herbs. This facial oil is clinically proven to reduce signs of aging, brighten skin tone, and improve texture.',
    'Miraculous beauty oil for glowing skin.',
    799.00,
    ARRAY['Skincare', 'Beauty'],
    'GlowVeda',
    'In Stock',
    'Cosmetic',
    '3304',
    18,
    50,
    'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=80&w=600',
    '100% Natural, Classical Formula, Premium',
    'Saffron, Manjistha, Sandalwood, Lotus Pollen, Milk',
    'Illuminates skin, Removes tan, Anti-aging, Hydrates deeply',
    'Apply 2-3 drops on damp face at night. Massage gently.',
    ARRAY['Aging', 'Pigmentation', 'Dullness'],
    'kumkumadi tailam, face oil, saffron oil, ayurvedic beauty',
    'Base: Sesame Oil | Color: Orange-Red | Recommended: Night Use',
    'Authentic Kumkumadi Tailam Face Oil | GlowVeda',
    'Get magical glow with Kumkumadi Tailam. Traditional Ayurvedic face oil.'
) RETURNING id INTO new_p_id;

INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '10ml Dropper', 'KUM-10', 799.00, 999.00, 25, 18, '3304') RETURNING id INTO v_id_1;
INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '30ml Dropper', 'KUM-30', 1999.00, 2500.00, 25, 18, '3304') RETURNING id INTO v_id_2;

INSERT INTO product_batches (variant_id, batch_number, mfg_date, expiry_date, current_quantity, initial_quantity) VALUES
(v_id_1, 'KT-B01', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '23 months', 25, 25),
(v_id_2, 'KT-B02', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '23 months', 25, 25);

-- ==========================================
-- 19. Multani Mitti (Skincare)
-- ==========================================
INSERT INTO products (
    name, description, short_description, price, category, brand, stock_status, product_type, hsn_code, gst_rate, stock_quantity, image,
    features, ingredients, benefits, usage, concern, meta_keywords, specifications, seo_title, meta_description
)
VALUES (
    'Multani Mitti Face Pack',
    'Premium quality Fuller''s Earth powder. A natural clay that deep cleanses skin, unclogs pores, and removes excess sebum. Leaves skin feeling fresh and tight.',
    'Natural clay for deep cleansing and oil control.',
    49.00,
    ARRAY['Skincare'],
    'NatureTouch',
    'In Stock',
    'Cosmetic',
    '3304',
    12,
    120,
    'https://images.unsplash.com/photo-1614859321874-04379d437936?auto=format&fit=crop&q=80&w=600',
    'Fine Powder, Chemical Free, Cooling',
    '100% Fuller''s Earth Clay',
    'Absorbs oil, Minimizes pores, Reduces acne, Cools skin',
    'Mix with rose water to make a paste. Apply on face, dry, and wash off.',
    ARRAY['Oily Skin', 'Open Pores', 'Acne'],
    'multani mitti, fullers earth, face pack, oil control',
    'Texture: Fine Powder | Origin: Rajasthan | Color: Beige',
    'Pure Multani Mitti Powder | NatureTouch',
    'Natural Fuller''s Earth for oily skin and acne. Deep cleansing clay.'
) RETURNING id INTO new_p_id;

INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '100g Box', 'MULTI-100', 49.00, 60.00, 60, 12, '3304') RETURNING id INTO v_id_1;
INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '500g Bag', 'MULTI-500', 199.00, 250.00, 60, 12, '3304') RETURNING id INTO v_id_2;

INSERT INTO product_batches (variant_id, batch_number, mfg_date, expiry_date, current_quantity, initial_quantity) VALUES
(v_id_1, 'MM-B01', CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '42 months', 60, 60),
(v_id_2, 'MM-B02', CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '42 months', 60, 60);

-- ==========================================
-- 20. Slimming Tea (Consumable)
-- ==========================================
INSERT INTO products (
    name, description, short_description, price, category, brand, stock_status, product_type, hsn_code, gst_rate, stock_quantity, image,
    features, ingredients, benefits, usage, concern, meta_keywords, specifications, seo_title, meta_description
)
VALUES (
    'Slimming Green Tea',
    'A curated blend of premium whole leaf Green Tea with Garcinia Cambogia, Lemongrass, and Ginger. Boosts metabolism and aids in weight management.',
    'Metabolism boosting tea blend for weight loss.',
    349.00,
    ARRAY['Tea', 'Weight Loss'],
    'HealthVeda',
    'In Stock',
    'Consumable',
    '0902',
    5,
    80,
    'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&q=80&w=600',
    'Whole Leaf Tea, 100% Natural, High Antioxidants',
    'Green Tea, Garcinia, Lemongrass, Ginger, Cinnamon',
    'Boosts metabolism, Burns fat, Improves digestion, Detoxifies',
    'Steep 1 tea bag in hot water for 3-5 minutes. Drink without milk.',
    ARRAY['Weight Gain', 'Slow Metabolism'],
    'slimming tea, green tea for weight loss, garcinia cambogia, detox tea',
    'Type: Green Tea Blend | Caffeine: Low | Flavor: Lemony',
    'Herbal Slimming Green Tea | HealthVeda',
    'Effective Weight Loss Green Tea blend with Garcinia and Lemongrass.'
) RETURNING id INTO new_p_id;

INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '25 Tea Bags', 'SLIM-25', 349.00, 499.00, 40, 5, '0902') RETURNING id INTO v_id_1;
INSERT INTO product_variants (product_id, name, sku, price, mrp, stock_quantity, gst_rate, hsn_code) VALUES 
(new_p_id, '50 Tea Bags', 'SLIM-50', 599.00, 899.00, 40, 5, '0902') RETURNING id INTO v_id_2;

INSERT INTO product_batches (variant_id, batch_number, mfg_date, expiry_date, current_quantity, initial_quantity) VALUES
(v_id_1, 'ST-B01', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '16 months', 40, 40),
(v_id_2, 'ST-B02', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '16 months', 40, 40);

RAISE NOTICE 'Seeding completed successfully with 20 products.';
END $$;
