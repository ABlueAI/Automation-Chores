-- Chore Tracker — Supabase schema
-- Reconstructed from the app's row mappers (ChoreContext / GroceryContext).
-- Use this to rebuild the backend if the original Supabase project is gone:
--   1. Create a new project at supabase.com
--   2. SQL Editor → paste this file → Run
--   3. Update VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env and the
--      GitHub repo secrets (Settings → Secrets and variables → Actions)

create table if not exists public.team_members (
  id text primary key,
  name text not null,
  email text,
  color text,
  tokens integer not null default 0
);

create table if not exists public.chores (
  id text primary key,
  title text not null,
  description text,
  due_date text not null,
  start_time text,
  estimated_minutes integer,
  assigned_to text references public.team_members(id) on delete set null,
  status text not null default 'pending',
  priority text,
  category text,
  notes text,
  tokens_earned integer,
  recurring jsonb,
  created_at text not null,
  completed_at text
);

create table if not exists public.grocery_items (
  id text primary key,
  name text not null,
  name_es text,
  quantity text,
  category text,
  checked boolean not null default false,
  aisle text,
  added_at text not null
);

-- One shared household, no auth: the anon key gets full access.
alter table public.team_members enable row level security;
alter table public.chores enable row level security;
alter table public.grocery_items enable row level security;

create policy "household full access" on public.team_members for all using (true) with check (true);
create policy "household full access" on public.chores for all using (true) with check (true);
create policy "household full access" on public.grocery_items for all using (true) with check (true);

-- Realtime: both phones get live updates (required for the app's sync channels)
alter publication supabase_realtime add table public.chores;
alter publication supabase_realtime add table public.team_members;
alter publication supabase_realtime add table public.grocery_items;
