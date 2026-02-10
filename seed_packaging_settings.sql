-- Seed Packaging Boxes if not exists

INSERT INTO public.site_settings (key, value)
VALUES (
  'packaging_boxes',
  '[
    {"id": "box-s", "name": "Small Box", "length_cm": 15, "width_cm": 15, "height_cm": 10, "weight_g": 100, "cost": 10},
    {"id": "box-m", "name": "Medium Box", "length_cm": 30, "width_cm": 20, "height_cm": 15, "weight_g": 200, "cost": 20},
    {"id": "box-l", "name": "Large Box", "length_cm": 45, "width_cm": 30, "height_cm": 25, "weight_g": 400, "cost": 35},
    {"id": "box-xl", "name": "Extra Large Box", "length_cm": 60, "width_cm": 45, "height_cm": 35, "weight_g": 800, "cost": 50}
  ]'
)
ON CONFLICT (key) DO NOTHING;

-- Also Ensure Shipping Rates Exist
INSERT INTO public.site_settings (key, value)
VALUES (
  'shipping_rates',
  '[
    {"slab": "0-500 g", "local": 30, "z1": 40, "z2": 50, "z3": 60, "z4": 80, "z5": 100},
    {"slab": "501-1000 g", "local": 40, "z1": 60, "z2": 80, "z3": 100, "z4": 120, "z5": 150},
    {"slab": "1001-2000 g", "local": 50, "z1": 80, "z2": 100, "z3": 120, "z4": 150, "z5": 200},
    {"slab": "Each Extra 1 kg", "local": 20, "z1": 30, "z2": 40, "z3": 50, "z4": 70, "z5": 90}
  ]'
)
ON CONFLICT (key) DO NOTHING;
