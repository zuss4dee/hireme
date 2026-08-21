-- ============================================================ no accounts
-- There are no logins. Ownership of a listing is a secret token handed out at
-- checkout, delivered as /manage?key=<token> and stored in a cookie.

-- Policies first: a policy referencing a column blocks altering its type.
drop policy if exists profiles_owner_insert on public.candidate_profiles;
drop policy if exists profiles_owner_update on public.candidate_profiles;
drop policy if exists views_owner_read      on public.profile_views;
drop policy if exists views_insert_any      on public.profile_views;
drop policy if exists interest_owner_read   on public.recruiter_interest;
drop policy if exists payments_owner_read   on public.payments;
drop policy if exists users_self_read       on public.users;
drop policy if exists users_self_write      on public.users;
drop policy if exists users_self_insert     on public.users;

alter table public.candidate_profiles add column if not exists manage_token text;
update public.candidate_profiles set manage_token = encode(gen_random_bytes(24), 'hex') where manage_token is null;
alter table public.candidate_profiles alter column manage_token set default encode(gen_random_bytes(24), 'hex');
alter table public.candidate_profiles alter column manage_token set not null;
create unique index if not exists candidate_profiles_manage_token_idx on public.candidate_profiles (manage_token);

-- Cut every dependency on auth.users.
alter table public.candidate_profiles drop constraint if exists candidate_profiles_user_id_fkey;
alter table public.candidate_profiles drop constraint if exists candidate_profiles_user_id_key;
alter table public.candidate_profiles alter column user_id drop not null;
alter table public.bids               drop constraint if exists bids_user_id_fkey;
alter table public.profile_views      drop constraint if exists profile_views_viewer_id_fkey;
alter table public.recruiter_interest drop constraint if exists recruiter_interest_recruiter_id_fkey;
alter table public.payments           drop constraint if exists payments_user_id_fkey;

alter table public.candidate_profiles alter column user_id      type text using user_id::text;
alter table public.bids               alter column user_id      type text using user_id::text;
alter table public.profile_views      alter column viewer_id    type text using viewer_id::text;
alter table public.recruiter_interest alter column recruiter_id type text using recruiter_id::text;
alter table public.payments           alter column user_id      type text using user_id::text;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.users cascade;

-- ==================================================== column-level secrets
-- RLS is row-level and cannot stop `?select=contact_email`. A column-level
-- REVOKE also does nothing against a table-level grant, so the table grant is
-- dropped and only the public columns are granted back. contact_email is what
-- recruiters pay for; manage_token is the key to a listing.
revoke select on public.candidate_profiles from anon, authenticated;

grant select (
  id, user_id, name, username, photo, title, bio, location,
  portfolio_url, linkedin_url, github_url, twitter_url,
  skills, current_bid, rank, availability, hidden, created_at
) on public.candidate_profiles to anon, authenticated;
