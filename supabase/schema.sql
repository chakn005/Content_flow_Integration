-- Cross-Alliance E2E Console — shared dashboard state (Supabase)
-- Run in Supabase SQL Editor after creating a project.
-- SECURITY-REVIEW: edit_key gates writes; anon key is public — rely on RLS + RPC only.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.dashboard_state (
  id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.dashboard_config (
  singleton boolean primary key default true check (singleton = true),
  edit_key text not null
);

insert into public.dashboard_state (id, state)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;

-- Replace with your team secret before going live (not stored in git).
insert into public.dashboard_config (singleton, edit_key)
values (true, 'CHANGE_ME_TO_A_LONG_RANDOM_SECRET')
on conflict (singleton) do update set edit_key = excluded.edit_key;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.dashboard_state enable row level security;
alter table public.dashboard_config enable row level security;

drop policy if exists "dashboard_state_public_read" on public.dashboard_state;
create policy "dashboard_state_public_read"
  on public.dashboard_state
  for select
  to anon, authenticated
  using (true);

-- No direct writes from the browser; updates go through RPC only.
revoke insert, update, delete on public.dashboard_state from anon, authenticated;
grant select on public.dashboard_state to anon, authenticated;

revoke all on public.dashboard_config from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Publish RPC (validates edit key server-side)
-- ---------------------------------------------------------------------------
create or replace function public.publish_dashboard_state(
  p_id text,
  p_state jsonb,
  p_edit_key text
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  expected_key text;
  ts timestamptz := now();
begin
  if p_id is null or length(trim(p_id)) = 0 then
    raise exception 'invalid id' using errcode = '22023';
  end if;

  if p_state is null or jsonb_typeof(p_state) <> 'object' then
    raise exception 'invalid state' using errcode = '22023';
  end if;

  select edit_key into expected_key
  from public.dashboard_config
  where singleton = true;

  if expected_key is null or p_edit_key is distinct from expected_key then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  insert into public.dashboard_state (id, state, updated_at)
  values (p_id, p_state, ts)
  on conflict (id) do update
    set state = excluded.state,
        updated_at = excluded.updated_at;

  return ts;
end;
$$;

revoke all on function public.publish_dashboard_state(text, jsonb, text) from public;
grant execute on function public.publish_dashboard_state(text, jsonb, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Realtime (enable replication for dashboard_state in Dashboard → Database → Publications)
-- ---------------------------------------------------------------------------
-- alter publication supabase_realtime add table public.dashboard_state;
