alter table variants
add column if not exists discount_percentage numeric(5,2) not null default 0 check (discount_percentage >= 0 and discount_percentage <= 100);
