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
      const check = await fetch('/api/auth/check-allowed', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      }).then(r => r.json());
      if (!check.allowed) {
        setError('This app is private. Ask Kai to add your email.');
        return;
      }
      const sb = browserClient();
      const { error } = await sb.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
      if (error) setError(error.message); else setSent(true);
    } catch (e: any) {
      setError(e?.message || 'Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <img src="/auth-hero.jpg" alt="" className="w-full h-40 object-cover rounded-2xl" />
      <h1 className="text-2xl font-bold">Sign in</h1>
      <p className="text-neutral-500 text-sm">We'll email you a magic link.</p>
      <input type="email" placeholder="you@example.com" className="w-full bg-white border border-neutral-200 rounded p-3" value={email} onChange={e => setEmail(e.target.value)} />
      <button onClick={send} disabled={loading} className="w-full bg-emerald-600 text-white disabled:opacity-50 rounded-xl py-3 font-semibold">{loading ? 'Sending…' : 'Send link'}</button>
      {sent && <p className="text-emerald-600">Check your email.</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
