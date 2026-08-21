-- place_bid, recompute_ranks and the trigger helpers are SECURITY DEFINER, and
-- Postgres grants EXECUTE to PUBLIC by default. That exposed them over
-- PostgREST to the anon key, which ships in the browser bundle — anyone could
-- POST /rest/v1/rpc/place_bid and claim any rank without paying.
--
-- Payment happens server-side, so only the service role should ever call these.
revoke execute on function public.place_bid(uuid, uuid, integer) from public, anon, authenticated;
revoke execute on function public.recompute_ranks()              from public, anon, authenticated;
revoke execute on function public.trg_recompute_ranks()          from public, anon, authenticated;
revoke execute on function public.handle_new_user()              from public, anon, authenticated;

grant execute on function public.place_bid(uuid, uuid, integer) to service_role;
grant execute on function public.recompute_ranks()              to service_role;
