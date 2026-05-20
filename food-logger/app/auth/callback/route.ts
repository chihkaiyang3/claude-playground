import { NextRequest, NextResponse } from 'next/server';
import { serverClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/';

  if (code) {
    const sb = serverClient();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(error.message)}`, url.origin));
    }
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
