# Food Logger

Mobile-responsive web app: photograph meals → Claude estimates calories + macros → log + track + get personalised weight-loss advice.

## Setup

1. `cp .env.local.example .env.local` and fill in keys.
2. In Supabase: run `supabase/migrations/0001_init.sql`, create private storage bucket `food-photos`, add a storage policy restricting access to `auth.uid()::text` prefix.
3. `npm install`
4. `npm run dev` → http://localhost:3000

## Stack
- Next.js 14 (App Router) + TypeScript + Tailwind
- Supabase (auth, Postgres, storage)
- Anthropic SDK — `claude-opus-4-7` for vision and advice, server-side only

## Pages
- `/` Dashboard — today's totals, 7-day chart, recent meals
- `/log` Camera capture + analyse + save
- `/advice` Claude coaching from profile + 14-day log
- `/profile` Age/sex/height/weights/activity → daily kcal target (Mifflin-St Jeor − 500)
- `/auth` Magic-link sign-in

## Sharing with family (allowlist)

Sign-up is restricted to emails listed in `public.allowed_emails`. Anyone else
sees "This app is private. Ask Kai to add your email." and no magic link is sent.

**Add an email** (Supabase SQL editor or MCP):
```sql
insert into public.allowed_emails (email, note) values ('person@example.com', 'who they are');
```

**Revoke access**:
```sql
delete from public.allowed_emails where email = 'person@example.com';
-- to also wipe their existing account + all their data:
delete from auth.users where email = 'person@example.com';
```

A Postgres trigger on `auth.users` enforces the allowlist server-side, so
revocation is hard even if the client check is bypassed.

Supabase free-tier email sender is capped at ~2 magic-link emails per hour.
If multiple family members try at once, stagger by ~30 min or hook up a real
SMTP provider in Supabase Auth settings.
