-- Track homepage visits separately from candidate profile views.
create table if not exists public.site_visits (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create index if not exists site_visits_created_idx on public.site_visits (created_at desc);
alter table public.site_visits enable row level security;