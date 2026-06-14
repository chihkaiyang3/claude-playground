-- Tier 1: meal categorization
alter table public.food_entries
  add column if not exists meal text not null default 'snack'
  check (meal in ('breakfast','lunch','dinner','snack'));
