-- Add dosha column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS dosha text;

-- Add a comment to explain valid values (optional documentation)
COMMENT ON COLUMN products.dosha IS 'Ayurvedic profile: Vata, Pitta, Kapha, Vata-Pitta, Pitta-Kapha, Kapha-Vata, Tridoshic';
