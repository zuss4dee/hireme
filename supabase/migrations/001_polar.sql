-- Run this if you already applied schema.sql while it still had `stripe_id`.
-- Idempotent: does nothing if the column is already renamed.
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'payments' and column_name = 'stripe_id'
  ) then
    alter table public.payments rename column stripe_id to provider_payment_id;
  end if;
end $$;
