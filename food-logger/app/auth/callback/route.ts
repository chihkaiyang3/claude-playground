import { NextRequest, NextResponse } from 'next/server';
import { serverClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const nextParam = url.searchParams.get('next') || '/';
  // Prevent open redirect: only allow same-origin relative paths (single leading slash, not "//").
  const safeNext = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/';

  if (code) {
    const sb = serverClient();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(error.message)}`, url.origin));
    }
  }
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
