import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ allowed: false }, { status: 400 });
  }
  // Stateless anon client — no cookies needed for an RPC call.
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: () => undefined, set: () => {}, remove: () => {} } }
  );
  const { data, error } = await sb.rpc('is_email_allowed', { p_email: email.trim() });
  if (error) return NextResponse.json({ allowed: false, error: error.message }, { status: 500 });
  return NextResponse.json({ allowed: !!data });
}
