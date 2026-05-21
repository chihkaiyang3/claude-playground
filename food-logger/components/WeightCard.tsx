'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { browserClient } from '@/lib/supabase-browser';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

type WeightLog = { logged_at: string; weight_kg: number };

export default function WeightCard({
  current, goal, logs
}: { current: number | null; goal: number | null; logs: WeightLog[] }) {
  const router = useRouter();
  const [value, setValue] = useState<number>(current ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function log() {
    if (!value || value <= 0) { setError('Enter a weight'); return; }
    setBusy(true); setError(null);
    const sb = browserClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setBusy(false); setError('Sign in first'); return; }
    const { error } = await sb.from('weight_logs').insert({ user_id: user.id, weight_kg: value });
    setBusy(false);
    if (error) setError(error.message); else router.refresh();
  }

  const data = logs.slice().reverse().map(l => ({
    day: new Date(l.logged_at).toISOString().slice(5, 10),
    kg: Number(l.weight_kg)
  }));
  const latest = data.length ? data[data.length - 1].kg : current;

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-3">
      <div className="flex justify-between items-baseline">
        <h2 className="font-semibold">Weight</h2>
        {latest && goal ? (
          <span className="text-sm text-neutral-500">{latest.toFixed(1)} → {goal} kg</span>
        ) : null}
      </div>
      {data.length > 1 && (
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="day" stroke="#888" fontSize={11} />
              <YAxis stroke="#888" fontSize={11} domain={['dataMin - 1', 'dataMax + 1']} />
              <Tooltip contentStyle={{ background: '#171717', border: 'none' }} />
              {goal && <ReferenceLine y={goal} stroke="#10b981" strokeDasharray="3 3" />}
              <Line type="monotone" dataKey="kg" stroke="#10b981" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="number" step="0.1" inputMode="decimal"
          value={value || ''}
          onChange={e => setValue(+e.target.value)}
          placeholder="kg"
          className="flex-1 bg-neutral-100 rounded p-2"
        />
        <button onClick={log} disabled={busy} className="bg-emerald-600 text-white disabled:opacity-50 rounded-xl px-4 font-semibold">Log</button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
