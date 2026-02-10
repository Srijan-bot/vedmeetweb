-- Insert 5 Sample Blogs across different categories

INSERT INTO public.blogs (title, slug, category, author, date, excerpt, image, content)
VALUES 
-- 1. Wellness
(
    'The Ayurvedic Daily Routine (Dinacharya) for Optimal Health', 
    'ayurvedic-daily-routine-dinacharya', 
    'Wellness', 
    'Dr. Ananya Sharma', 
    CURRENT_DATE, 
    'Discover how aligning your daily activities with nature''s rhythms can transform your energy and immunity. A complete guide to Dinacharya.', 
    'https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=2070&auto=format&fit=crop',
    '<h2>Wake Up Before the Sun (Brahma Muhurta)</h2><p>Ayurveda recommends waking up approximately 90 minutes before sunrise. This is a time when the atmosphere is filled with pure, sattvic energy.</p><h3>Tongue Scraping (Jihwa Prakshalana)</h3><p>Start your day by scraping your tongue to remove toxins (ama) that have accumulated overnight. This improves digestion and sense of taste.</p><h3>Oil Pulling (Gandusha)</h3><p>Swishing sesame or coconut oil in your mouth strengthens teeth, gums, and jaws while improving voice quality.</p>'
),

-- 2. Recipes
(
    'Golden Milk (Haldi Doodh): The Ultimate Immunity Booster', 
    'golden-milk-haldi-doodh-recipe', 
    'Recipes', 
    'Chef Rajesh Kumar', 
    CURRENT_DATE - 2, 
    'A traditional recipe for authentic Golden Milk. Learn the secret spice blend that maximizes absorption and healing benefits.', 
    'https://images.unsplash.com/photo-1515544778368-a400e998859e?q=80&w=2070&auto=format&fit=crop',
    '<h2>Why Golden Milk?</h2><p>Turmeric is a potent anti-inflammatory, but it needs fat and black pepper for absorption.</p><h3>Ingredients</h3><ul><li>1 cup organic cow milk or almond milk</li><li>1/2 tsp turmeric powder</li><li>Pinch of black pepper</li><li>1/2 tsp ghee</li><li>Honey to taste</li></ul><h3>Method</h3><ol><li>Heat milk in a saucepan.</li><li>Add turmeric, pepper, and ghee.</li><li>Simmer for 5 minutes.</li><li>Let it cool slightly before adding honey.</li></ol>'
),

-- 3. Herbal Remedies
(
    'Ashwagandha: The Stress-Busting Adaptogen', 
    'ashwagandha-benefits-stress-relief', 
    'Herbal Remedies', 
    'Vaidya Suresh', 
    CURRENT_DATE - 5, 
    'Feeling overwhelmed? Explore the science and tradition behind Ashwagandha, nature''s most powerful stress-reliever.', 
    'https://images.unsplash.com/photo-1611078446261-26cce1672322?q=80&w=2070&auto=format&fit=crop',
    '<h2>What is Ashwagandha?</h2><p>Known as "Indian Ginseng," Ashwagandha is an adaptogen that helps the body manage stress.</p><h3>Key Benefits</h3><ul><li>Reduces cortisol levels</li><li>Improves sleep quality</li><li>Boosts muscle strength in athletes</li></ul><p><strong>Dosage:</strong> Typically 3-6 grams of root powder daily, consult your practitioner.</p>'
),

-- 4. Yoga
(
    '5 Yoga Asanas for Better Digestion', 
    'yoga-for-digestion-agni', 
    'Yoga', 
    'Priya Singh', 
    CURRENT_DATE - 10, 
    'Struggling with bloating or indigestion? These 5 simple poses (asanas) stimulate your digestive fire (Agni).', 
    'https://images.unsplash.com/photo-1544367563-12123d8965cd?q=80&w=2070&auto=format&fit=crop',
    '<h2>1. Vajrasana (Thunderbolt Pose)</h2><p>The only asana you can do immediately after a meal. It aids digestion by increasing blood flow to the stomach.</p><h2>2. Pawanmuktasana (Wind-Relieving Pose)</h2><p>Excellent for releasing trapped gas and improving gut motility.</p><h2>3. Ardha Matsyendrasana</h2><p>A spinal twist that massages the internal organs.</p>'
),

-- 5. Lifestyle
(
    'Ayurvedic Tips for Glowing Skin', 
    'ayurveda-skincare-glowing-skin', 
    'Lifestyle', 
    'Dr. Meera Iyer', 
    CURRENT_DATE - 15, 
    'Your skin reflects your inner health. Learn how to balance your Doshas for naturally radiant skin without harsh chemicals.', 
    'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=2070&auto=format&fit=crop',
    '<h2>Understanding Your Skin Type</h2><p><strong>Vata Skin:</strong> Dry, thin, prone to wrinkles. Needs hydration.</p><p><strong>Pitta Skin:</strong> Sensitive, prone to redness and acne. Needs cooling.</p><p><strong>Kapha Skin:</strong> Oily, thick, large pores. Needs regular cleansing.</p><h3>Ubtan Recipe</h3><p>Mix chickpea flour, turmeric, and rose water for a gentle natural cleanser.</p>'
)
ON CONFLICT (slug) DO NOTHING;
