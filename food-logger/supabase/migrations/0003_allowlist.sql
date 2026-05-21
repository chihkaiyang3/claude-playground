create extension if not exists citext;

create table if not exists public.allowed_emails (
  email citext primary key,
  note text,
  added_at timestamptz not null default now()
);

alter table public.allowed_emails enable row level security;
-- no policies => deny all to anon/authenticated; only security-definer fns and service_role read.

insert into public.allowed_emails (email, note) values
  ('kenneth_yang@hotmail.com', 'kai'),
  ('jhuang41@gmail.com', 'family'),
  ('yanghou16@yahoo.com.tw', 'family')
on conflict (email) do nothing;

create or replace function public.is_email_allowed(p_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.allowed_emails where email = p_email::citext);
$$;
grant execute on function public.is_email_allowed(text) to anon, authenticated;

create or replace function public.enforce_email_allowlist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null or not exists (select 1 from public.allowed_emails where email = new.email::citext) then
    raise exception 'email % is not on the allowlist', new.email using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_allowlist_before_user_insert on auth.users;
create trigger enforce_allowlist_before_user_insert
  before insert on auth.users
  for each row execute function public.enforce_email_allowlist();
