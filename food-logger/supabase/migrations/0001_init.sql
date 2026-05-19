-- Profiles
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  age int not null,
  sex text not null check (sex in ('male','female')),
  height_cm numeric not null,
  current_weight_kg numeric not null,
  goal_weight_kg numeric not null,
  activity_level text not null check (activity_level in ('sedentary','light','moderate','active','very_active')),
  daily_kcal_target int,
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Food entries
create table if not exists public.food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  taken_at timestamptz not null default now(),
  image_path text,
  items jsonb not null default '[]'::jsonb,
  kcal int not null,
  protein_g numeric not null default 0,
  carbs_g numeric not null default 0,
  fat_g numeric not null default 0,
  confidence text,
  notes text
);
create index if not exists food_entries_user_taken on public.food_entries(user_id, taken_at desc);
alter table public.food_entries enable row level security;
create policy "own entries" on public.food_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Weight logs (deferred feature, schema only)
create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_at timestamptz not null default now(),
  weight_kg numeric not null
);
alter table public.weight_logs enable row level security;
create policy "own weights" on public.weight_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage bucket for photos (run separately in dashboard, or):
-- insert into storage.buckets (id, name, public) values ('food-photos','food-photos', false) on conflict do nothing;
-- Storage RLS policy: allow users to read/write only their own folder (prefix = auth.uid()::text).
