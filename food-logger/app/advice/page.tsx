'use client';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function AdvicePage() {
  const [advice, setAdvice] = useState<string | null>(null);
  const [target, setTarget] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getAdvice() {
    setLoading(true); setError(null); setAdvice(null);
    try {
      const res = await fetch('/api/advice', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'failed');
      setAdvice(json.advice); setTarget(json.target);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Personalised advice</h1>
      <p className="text-neutral-400 text-sm">Claude reviews your profile and last 14 days of meals to suggest sustainable changes.</p>
      <button onClick={getAdvice} disabled={loading} className="w-full bg-emerald-600 disabled:opacity-50 rounded-xl py-4 font-semibold">
        {loading ? 'Thinking…' : 'Get advice'}
      </button>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {target && <p className="text-neutral-400 text-sm">Daily target: <b>{target} kcal</b></p>}
      {advice && (
        <article className="prose prose-invert prose-sm max-w-none bg-neutral-900 rounded-2xl p-4">
          <ReactMarkdown>{advice}</ReactMarkdown>
        </article>
      )}
    </div>
  );
}
