-- HireMe.lol — full schema
-- Run in Supabase SQL Editor (or `supabase db push`).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- users
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  role        text not null default 'candidate' check (role in ('candidate','recruiter')),
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------- candidate_profiles
create table if not exists public.candidate_profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references public.users(id) on delete cascade,
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
  contact_email text,
  created_at    timestamptz not null default now()
);
create index if not exists candidate_profiles_bid_idx  on public.candidate_profiles (current_bid desc, created_at asc);
create index if not exists candidate_profiles_rank_idx on public.candidate_profiles (rank asc);

-- ----------------------------------------------------------------- bids
create table if not exists public.bids (
  id           uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  user_id      uuid references public.users(id) on delete set null,
  amount       integer not null check (amount > 0),   -- cents
  created_at   timestamptz not null default now()
);
create index if not exists bids_candidate_idx on public.bids (candidate_id, created_at desc);

-- -------------------------------------------------------- profile_views
create table if not exists public.profile_views (
  id           uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  viewer_id    uuid references public.users(id) on delete set null,
  viewer_role  text,          -- 'candidate' | 'recruiter' | 'anon'
  source       text,          -- 'profile' | 'portfolio_click' | 'recruiter'
  created_at   timestamptz not null default now()
);
create index if not exists profile_views_candidate_idx on public.profile_views (candidate_id, created_at desc);

-- ---------------------------------------------------- recruiter_interest
create table if not exists public.recruiter_interest (
  id           uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  recruiter_id uuid references public.users(id) on delete set null,
  company      text,
  message      text,
  type         text not null check (type in ('unlock','interview','hire')),
  created_at   timestamptz not null default now()
);
create index if not exists recruiter_interest_candidate_idx on public.recruiter_interest (candidate_id, created_at desc);

-- ------------------------------------------------------------- payments
create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.users(id) on delete set null,
  candidate_id uuid references public.candidate_profiles(id) on delete set null,
  amount       integer not null,                    -- cents
  payment_type text not null check (payment_type in ('bid','unlock','interview','hire')),
  provider_payment_id text unique,   -- Polar checkout id
  status       text not null default 'paid',
  created_at   timestamptz not null default now()
);

-- --------------------------------------------------------------- ranking
-- A bid of 0 means "profile created, never paid for": it stays out of the
-- ranking until money lands.
create or replace function public.recompute_ranks() returns void
language sql security definer set search_path = public as $$
  update candidate_profiles c
     set rank = r.rn
    from (
      select id,
             case when current_bid > 0
                  then row_number() over (order by current_bid desc, created_at asc)
             end as rn
        from candidate_profiles
    ) r
   where r.id = c.id and (c.rank is distinct from r.rn);
$$;

-- Atomic outbid: raises the bid, logs it, re-ranks. Rejects bids that are not
-- strictly higher than the candidate's own current bid.
create or replace function public.place_bid(p_candidate_id uuid, p_user_id uuid, p_amount integer)
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
alter table public.users              enable row level security;
alter table public.candidate_profiles enable row level security;
alter table public.bids               enable row level security;
alter table public.profile_views      enable row level security;
alter table public.recruiter_interest enable row level security;
alter table public.payments           enable row level security;

-- users: you see and edit only yourself.
drop policy if exists users_self_read on public.users;
create policy users_self_read on public.users for select using (auth.uid() = id);
drop policy if exists users_self_write on public.users;
create policy users_self_write on public.users for update using (auth.uid() = id);
drop policy if exists users_self_insert on public.users;
create policy users_self_insert on public.users for insert with check (auth.uid() = id);

-- candidate_profiles: the leaderboard is public; only the owner writes.
drop policy if exists profiles_public_read on public.candidate_profiles;
create policy profiles_public_read on public.candidate_profiles for select using (true);
drop policy if exists profiles_owner_insert on public.candidate_profiles;
create policy profiles_owner_insert on public.candidate_profiles for insert with check (auth.uid() = user_id);
drop policy if exists profiles_owner_update on public.candidate_profiles;
create policy profiles_owner_update on public.candidate_profiles for update using (auth.uid() = user_id);

-- bids are public (that is the whole game); writes go through place_bid/service role.
drop policy if exists bids_public_read on public.bids;
create policy bids_public_read on public.bids for select using (true);

-- views: anyone can log one, only the candidate can read their own.
drop policy if exists views_insert_any on public.profile_views;
create policy views_insert_any on public.profile_views for insert with check (true);
drop policy if exists views_owner_read on public.profile_views;
create policy views_owner_read on public.profile_views for select
  using (exists (select 1 from candidate_profiles p
                  where p.id = candidate_id and p.user_id = auth.uid()));

-- recruiter interest: candidate sees who wants them, recruiter sees their own.
drop policy if exists interest_owner_read on public.recruiter_interest;
create policy interest_owner_read on public.recruiter_interest for select
  using (recruiter_id = auth.uid()
      or exists (select 1 from candidate_profiles p
                  where p.id = candidate_id and p.user_id = auth.uid()));

-- payments: only your own.
drop policy if exists payments_owner_read on public.payments;
create policy payments_owner_read on public.payments for select using (user_id = auth.uid());

-- ------------------------------------------------------ new-user trigger
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, role)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data->>'role', 'candidate'))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users for each row execute function public.handle_new_user();
