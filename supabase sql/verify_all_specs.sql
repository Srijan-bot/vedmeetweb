-- VERIFICATION SCRIPT
-- Lists specifications for ALL products and their variants to verify the update.

SELECT 
    p.name as "Product Name",
    COALESCE(p.weight, '-') as "P.Weight",
    COALESCE(p.volume, '-') as "P.Volume",
    COALESCE(p.dimensions, '-') as "P.Dimensions",
    COALESCE(p.pieces::text, '-') as "P.Pieces",
    v.name as "Variant",
    COALESCE(v.weight, '-') as "V.Weight",
    COALESCE(v.volume, '-') as "V.Volume",
    COALESCE(v.dimensions, '-') as "V.Dimensions",
    COALESCE(v.pieces::text, '-') as "V.Pieces"
FROM products p
LEFT JOIN product_variants v ON p.id = v.product_id
ORDER BY p.name, v.name;
