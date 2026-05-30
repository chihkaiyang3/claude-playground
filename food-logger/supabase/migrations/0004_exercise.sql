-- v1.3: Exercise logging
create table if not exists public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  performed_at timestamptz not null default now(),
  activity text not null,
  duration_min int not null default 0,
  kcal int not null,
  notes text
);
create index if not exists exercise_logs_user_performed on public.exercise_logs(user_id, performed_at desc);
alter table public.exercise_logs enable row level security;
create policy "own exercise" on public.exercise_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
