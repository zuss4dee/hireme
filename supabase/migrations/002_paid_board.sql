-- Nobody is on the board for free: a bid of 0 means "profile created, never
-- paid for". Those rows keep existing (the owner can still finish checkout)
-- but they hold no rank.
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

select public.recompute_ranks();
