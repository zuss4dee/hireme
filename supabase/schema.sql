-- HireMe.lol — full schema
-- Run in Supabase SQL Editor (or `supabase db push`).

create extension if not exists "pgcrypto";

-- ------------------------------------------------- candidate_profiles
create table if not exists public.candidate_profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       text,                                 -- anonymous visitor id, not an account
  manage_token  text not null unique default encode(gen_random_bytes(24), 'hex'),
  name          text not null,
  username      text not null unique,
  photo         text,
  title         text not null,
  bio           text,
  location      text,
  portfolio_url text,
  linkedin_url  text,
  github_url    text,
  twitter_url   text,
  skills        text[] not null default '{}',
  current_bid   integer not null default 0,   -- cents
  rank          integer,
  availability  text not null default 'open'
                check (availability in ('open','not_looking','passive','hired')),
  hidden        boolean not null default false,
  contact_email text,
  created_at    timestamptz not null default now()
);
create index if not exists candidate_profiles_bid_idx  on public.candidate_profiles (current_bid desc, created_at asc);
create index if not exists candidate_profiles_rank_idx on public.candidate_profiles (rank asc);

-- ----------------------------------------------------------------- bids
create table if not exists public.bids (
  id           uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  user_id      text,
  amount       integer not null check (amount > 0),   -- cents
  created_at   timestamptz not null default now()
);
create index if not exists bids_candidate_idx on public.bids (candidate_id, created_at desc);

-- -------------------------------------------------------- profile_views
create table if not exists public.profile_views (
  id           uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  viewer_id    text,
  viewer_role  text,          -- 'candidate' | 'recruiter' | 'anon'
  source       text,          -- 'profile' | 'portfolio_click' | 'recruiter'
  created_at   timestamptz not null default now()
);
create index if not exists profile_views_candidate_idx on public.profile_views (candidate_id, created_at desc);

-- ---------------------------------------------------- recruiter_interest
create table if not exists public.recruiter_interest (
  id           uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  recruiter_id text,
  company      text,
  message      text,
  type         text not null check (type in ('unlock','interview','hire')),
  created_at   timestamptz not null default now()
);
create index if not exists recruiter_interest_candidate_idx on public.recruiter_interest (candidate_id, created_at desc);

-- ------------------------------------------------------------- payments
create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  user_id      text,
  candidate_id uuid references public.candidate_profiles(id) on delete set null,
  amount       integer not null,                    -- cents
  payment_type text not null check (payment_type in ('bid','unlock','interview','hire')),
  provider_payment_id text unique,   -- Stripe checkout session id
  status       text not null default 'paid',
  fulfilled_at timestamptz,               -- set only once the effect landed
  created_at   timestamptz not null default now()
);

-- --------------------------------------------------------------- ranking
-- Ranks skip unpaid rows (current_bid = 0 means "created, never paid for")
-- and moderated rows, and stale ranks are cleared when a row leaves the board.
create or replace function public.recompute_ranks() returns void
language plpgsql security definer set search_path = public as $$
begin
  update candidate_profiles
     set rank = null
   where (current_bid <= 0 or hidden) and rank is not null;

  with ranked as (
    select id, row_number() over (order by current_bid desc, created_at asc) as rn
      from candidate_profiles
     where current_bid > 0 and not hidden
  )
  update candidate_profiles c
     set rank = ranked.rn
    from ranked
   where ranked.id = c.id and c.rank is distinct from ranked.rn;
end;
$$;

-- Atomic outbid: raises the bid, logs it, re-ranks. Rejects bids that are not
-- strictly higher than the candidate's own current bid.
create or replace function public.place_bid(p_candidate_id uuid, p_user_id text, p_amount integer)
returns public.candidate_profiles
language plpgsql security definer set search_path = public as $$
declare result public.candidate_profiles;
begin
  update candidate_profiles
     set current_bid = p_amount
   where id = p_candidate_id and p_amount > current_bid
  returning * into result;

  if result.id is null then
    raise exception 'bid_too_low';
  end if;

  insert into bids (candidate_id, user_id, amount) values (p_candidate_id, p_user_id, p_amount);
  perform recompute_ranks();

  select * into result from candidate_profiles where id = p_candidate_id;
  return result;
end;
$$;

-- Keep ranks fresh if rows are inserted/deleted outside place_bid().
create or replace function public.trg_recompute_ranks() returns trigger
language plpgsql security definer set search_path = public as $$
begin perform recompute_ranks(); return null; end;
$$;
drop trigger if exists candidate_profiles_rank_trg on public.candidate_profiles;
create trigger candidate_profiles_rank_trg
after insert or delete on public.candidate_profiles
for each statement execute function public.trg_recompute_ranks();

-- ------------------------------------------------------------------- RLS
alter table public.candidate_profiles enable row level security;
alter table public.bids               enable row level security;
alter table public.profile_views      enable row level security;
alter table public.recruiter_interest enable row level security;
alter table public.payments           enable row level security;

-- The board is public; everything else goes through the service role.
drop policy if exists profiles_public_read on public.candidate_profiles;
create policy profiles_public_read on public.candidate_profiles for select using (true);

drop policy if exists bids_public_read on public.bids;
create policy bids_public_read on public.bids for select using (true);

-- No policies on profile_views, recruiter_interest or payments: RLS is on with
-- no policy, so the public key can read nothing at all. The server writes them
-- with the service role, which bypasses RLS.

-- ==================================================== column-level secrets
-- RLS is row-level and cannot stop `?select=contact_email`. A column-level
-- REVOKE also does nothing against a table-level grant, so drop the table grant
-- and give back only the public columns.
revoke select on public.candidate_profiles from anon, authenticated;

grant select (
  id, user_id, name, username, photo, title, bio, location,
  portfolio_url, linkedin_url, github_url, twitter_url,
  skills, current_bid, rank, availability, hidden, created_at
) on public.candidate_profiles to anon, authenticated;


-- ------------------------------------------------------- function grants
-- SECURITY DEFINER functions are EXECUTE-able by PUBLIC by default, which
-- exposes them over PostgREST to the anon key. Payment happens server-side,
-- so only the service role may move money-bearing state.
revoke execute on function public.place_bid(uuid, text, integer) from public, anon, authenticated;
revoke execute on function public.recompute_ranks()              from public, anon, authenticated;
revoke execute on function public.trg_recompute_ranks()          from public, anon, authenticated;

grant execute on function public.place_bid(uuid, text, integer) to service_role;
grant execute on function public.recompute_ranks()              to service_role;
