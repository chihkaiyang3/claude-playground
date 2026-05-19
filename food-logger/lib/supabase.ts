import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function browserClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

export function serverClient() {
  const store = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get: (n) => store.get(n)?.value,
      set: (n, v, o: CookieOptions) => { try { store.set({ name: n, value: v, ...o }); } catch {} },
      remove: (n, o: CookieOptions) => { try { store.set({ name: n, value: '', ...o }); } catch {} }
    }
  });
}
