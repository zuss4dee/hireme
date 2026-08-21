-- place_bid still declared p_user_id uuid after accounts were removed in 005,
-- so passing an anonymous visitor id ("v_...") failed with
-- `invalid input syntax for type uuid`. The payment recorded and the bid never
-- landed: charged, no rank.
drop function if exists public.place_bid(uuid, uuid, integer);

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

revoke execute on function public.place_bid(uuid, text, integer) from public, anon, authenticated;
grant  execute on function public.place_bid(uuid, text, integer) to service_role;

-- Idempotency must key off whether the work completed, not whether a payment
-- row exists — otherwise a failed effect is masked forever by its own receipt.
alter table public.payments add column if not exists fulfilled_at timestamptz;
