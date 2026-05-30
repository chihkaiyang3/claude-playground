'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { browserClient } from '@/lib/supabase-browser';
import { EXERCISES, estimateKcal, type Activity } from '@/lib/exercise';

type ExerciseLog = { id: string; activity: string; duration_min: number; kcal: number };

export default function ExerciseCard({
  weightKg, logs
}: { weightKg: number | null; logs: ExerciseLog[] }) {
  const router = useRouter();
  const [activity, setActivity] = useState<Activity>('running');
  const [minutes, setMinutes] = useState<number>(30);
  const met = EXERCISES.find(e => e.id === activity)!.met;
  const [kcal, setKcal] = useState<number>(estimateKcal(met, weightKg, 30));
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function pickActivity(a: Activity) {
    setActivity(a);
    const m = EXERCISES.find(e => e.id === a)!.met;
    if (a !== 'other') setKcal(estimateKcal(m, weightKg, minutes));
  }
  function changeMinutes(v: number) {
    setMinutes(v);
    if (activity !== 'other') setKcal(estimateKcal(met, weightKg, v));
  }

  async function log() {
    if (kcal <= 0) { setError('Enter calories burned'); return; }
    setBusy(true); setError(null);
    const sb = browserClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setBusy(false); setError('Sign in first'); return; }
    const { error } = await sb.from('exercise_logs').insert({
      user_id: user.id,
      activity,
      duration_min: minutes,
      kcal,
      notes: notes || null
    });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setSaved(true); setNotes('');
    setTimeout(() => setSaved(false), 1200);
    router.refresh();
  }

  const burned = logs.reduce((a, l) => a + (l.kcal || 0), 0);
  const label = (a: string) => EXERCISES.find(e => e.id === a)?.label || a;
  const emoji = (a: string) => EXERCISES.find(e => e.id === a)?.emoji || '✨';

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-3">
      <div className="flex justify-between items-baseline">
        <h2 className="font-semibold">Exercise</h2>
        {burned > 0 && <span className="text-sm text-orange-600 font-semibold">🔥 {burned} kcal burned</span>}
      </div>

      {logs.length > 0 && (
        <ul className="space-y-1 text-sm">
          {logs.map(l => (
            <li key={l.id} className="flex justify-between text-neutral-700">
              <span>{emoji(l.activity)} {label(l.activity)}{l.duration_min ? ` · ${l.duration_min} min` : ''}</span>
              <span>{l.kcal} kcal</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        {EXERCISES.map(e => (
          <button
            key={e.id}
            onClick={() => pickActivity(e.id)}
            className={`rounded-full px-3 py-2 text-sm ${activity === e.id ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-700'}`}
          >
            {e.emoji} {e.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="flex flex-col">
          <span className="text-neutral-500 text-xs">Minutes</span>
          <input type="number" inputMode="numeric" value={minutes || ''} onChange={e => changeMinutes(+e.target.value)} className="bg-neutral-100 rounded p-2" />
        </label>
        <label className="flex flex-col">
          <span className="text-neutral-500 text-xs">Calories burned</span>
          <input type="number" inputMode="numeric" value={kcal || ''} onChange={e => setKcal(+e.target.value)} className="bg-neutral-100 rounded p-2" />
        </label>
      </div>

      <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" className="w-full bg-neutral-100 rounded p-2 text-sm" />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button onClick={log} disabled={busy} className="w-full bg-emerald-600 text-white disabled:opacity-50 rounded-xl py-3 font-semibold">{saved ? 'Logged ✓' : 'Log workout'}</button>
    </div>
  );
}
