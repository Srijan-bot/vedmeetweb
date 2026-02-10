alter table user_addresses
add column if not exists house_no text,
add column if not exists landmark text;
