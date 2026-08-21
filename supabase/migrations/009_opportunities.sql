create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  manage_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  name text not null,
  slug text not null unique,
  logo text,
  website text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  slug text not null unique,
  title text not null,
  description text not null,
  skills text[] not null default '{}',
  salary_range text,
  location text,
  remote_status text not null default 'remote' check (remote_status in ('remote','hybrid','onsite')),
  status text not null default 'pending' check (status in ('pending','open','closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.opportunity_interest (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (opportunity_id, candidate_id)
);


create index if not exists opportunities_company_idx on public.opportunities (company_id, created_at desc);
create index if not exists opportunity_interest_candidate_idx on public.opportunity_interest (candidate_id, created_at desc);

alter table public.companies enable row level security;
alter table public.opportunities enable row level security;
alter table public.opportunity_interest enable row level security;

create policy companies_public_read on public.companies for select using (true);
create policy opportunities_public_read on public.opportunities for select using (status = 'open');