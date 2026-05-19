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
