import { serverClient } from '@/lib/supabase-server';
import { dailyTarget } from '@/lib/nutrition';
import TrendChart from '@/components/TrendChart';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const sb = serverClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Food Logger</h1>
        <p className="text-neutral-400">Sign in to start tracking.</p>
        <Link href="/auth" className="inline-block bg-emerald-600 rounded-xl px-4 py-3 font-semibold">Sign in</Link>
      </div>
    );
  }

  const { data: profile } = await sb.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
  const target = profile ? dailyTarget(profile.sex, profile.current_weight_kg, profile.height_cm, profile.age, profile.activity_level) : undefined;

  const startOf = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const today = startOf(new Date());
  const weekAgo = new Date(today.getTime() - 6 * 86400_000);

  const { data: weekEntries } = await sb.from('food_entries').select('taken_at, kcal, protein_g, carbs_g, fat_g, items, image_path').eq('user_id', user.id).gte('taken_at', weekAgo.toISOString()).order('taken_at', { ascending: false });

  const todayEntries = (weekEntries || []).filter(e => new Date(e.taken_at) >= today);
  const sum = todayEntries.reduce((a, e) => ({ kcal: a.kcal + (e.kcal || 0), p: a.p + Number(e.protein_g || 0), c: a.c + Number(e.carbs_g || 0), f: a.f + Number(e.fat_g || 0) }), { kcal: 0, p: 0, c: 0, f: 0 });

  const byDay = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400_000);
    byDay.set(d.toISOString().slice(5, 10), 0);
  }
  (weekEntries || []).forEach(e => {
    const key = new Date(e.taken_at).toISOString().slice(5, 10);
    if (byDay.has(key)) byDay.set(key, byDay.get(key)! + (e.kcal || 0));
  });
  const trend = Array.from(byDay, ([day, kcal]) => ({ day, kcal }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Today</h1>
        <p className="text-neutral-400 text-sm">{target ? `Target: ${target} kcal` : <Link href="/profile" className="underline">Set up your profile</Link>}</p>
      </div>

      <div className="bg-neutral-900 rounded-2xl p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-4xl font-bold text-emerald-400">{sum.kcal}</span>
          <span className="text-neutral-400">/ {target ?? '—'} kcal</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-sm text-center">
          <div className="bg-neutral-800 rounded p-2">Protein<br /><b>{Math.round(sum.p)}g</b></div>
          <div className="bg-neutral-800 rounded p-2">Carbs<br /><b>{Math.round(sum.c)}g</b></div>
          <div className="bg-neutral-800 rounded p-2">Fat<br /><b>{Math.round(sum.f)}g</b></div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">7-day trend</h2>
        <TrendChart data={trend} target={target} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Recent meals</h2>
        <ul className="space-y-2">
          {(weekEntries || []).slice(0, 10).map((e: any) => (
            <li key={e.taken_at} className="bg-neutral-900 rounded-xl p-3 flex justify-between text-sm">
              <span>{new Date(e.taken_at).toLocaleString()}</span>
              <span className="text-emerald-400 font-semibold">{e.kcal} kcal</span>
            </li>
          ))}
          {!weekEntries?.length && <li className="text-neutral-500 text-sm">No meals yet. Tap Log to add one.</li>}
        </ul>
      </div>
    </div>
  );
}
