-- Run this if you already applied schema.sql while it still had `stripe_id`.
-- Safe to run more than once.
alter table public.payments rename column stripe_id to provider_payment_id;
