'use client';
import { useState } from 'react';
import { browserClient } from '@/lib/supabase-browser';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!email) { setError('Enter your email first.'); return; }
    setError(null); setSent(false); setLoading(true);
    try {
      const sb = browserClient();
      const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
      if (error) setError(error.message); else setSent(true);
    } catch (e: any) {
      setError(e?.message || 'Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <p className="text-neutral-400 text-sm">We'll email you a magic link.</p>
      <input type="email" placeholder="you@example.com" className="w-full bg-neutral-900 rounded p-3" value={email} onChange={e => setEmail(e.target.value)} />
      <button onClick={send} disabled={loading} className="w-full bg-emerald-600 disabled:opacity-50 rounded-xl py-3 font-semibold">{loading ? 'Sending…' : 'Send link'}</button>
      {sent && <p className="text-emerald-400">Check your email.</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
}
