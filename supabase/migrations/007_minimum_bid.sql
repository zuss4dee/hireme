-- Keep the database guard aligned with the public $5 minimum bid.
create or replace function public.place_bid(p_candidate_id uuid, p_user_id text, p_amount integer)
returns public.candidate_profiles
language plpgsql security definer set search_path = public as $$
declare result public.candidate_profiles;
begin
  if p_amount < 500 then
    raise exception 'bid_too_low';
  end if;

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
grant execute on function public.place_bid(uuid, text, integer) to service_role;