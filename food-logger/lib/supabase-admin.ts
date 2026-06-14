import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Service-role client for backend jobs (cron). Bypasses RLS.
// NEVER import this into client components — server-only enforced above.
export function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
