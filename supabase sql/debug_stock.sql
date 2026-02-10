-- Check Stock for Variant 9c7eb08e-5d74-4c10-b5aa-08c59ae7eb8c
select 
  id, 
  name, 
  stock_quantity, 
  reserved_quantity, 
  (stock_quantity - reserved_quantity) as available_stock 
from product_variants 
where id = '9c7eb08e-5d74-4c10-b5aa-08c59ae7eb8c';
