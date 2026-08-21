-- Moderation: a hidden profile keeps its data and its payment history but
-- drops off the board entirely. Safe to run more than once.
alter table public.candidate_profiles
  add column if not exists hidden boolean not null default false;

create index if not exists candidate_profiles_hidden_idx
  on public.candidate_profiles (hidden) where hidden;

-- Ranks now skip both unpaid and hidden rows, and stale ranks are cleared
-- when a row leaves the board.
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

select public.recompute_ranks();
