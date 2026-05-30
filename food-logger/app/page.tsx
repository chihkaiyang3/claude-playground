import { serverClient } from '@/lib/supabase-server';
import { dailyTarget } from '@/lib/nutrition';
import TrendChart from '@/components/TrendChart';
import WeightCard from '@/components/WeightCard';
import ExerciseCard from '@/components/ExerciseCard';
import { MEALS, type Meal } from '@/lib/meals';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function computeStreak(entries: { taken_at: string }[]): number {
  if (!entries.length) return 0;
  const days = new Set(entries.map(e => new Date(e.taken_at).toISOString().slice(0, 10)));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today.getTime() - i * 86400_000).toISOString().slice(0, 10);
    if (days.has(d)) streak++;
    else if (i === 0) continue;
    else break;
  }
  return streak;
}

export default async function Dashboard() {
  const sb = serverClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return (
      <div className="space-y-4">
        <img src="/hero.jpg" alt="" className="w-full h-40 object-cover rounded-2xl" />
        <h1 className="text-2xl font-bold">Food Logger</h1>
        <p className="text-neutral-500">Sign in to start tracking.</p>
        <Link href="/auth" className="inline-block bg-emerald-600 text-white rounded-xl px-4 py-3 font-semibold">Sign in</Link>
      </div>
    );
  }

  const { data: profile } = await sb.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
  const target = profile ? dailyTarget(profile.sex, profile.current_weight_kg, profile.height_cm, profile.age, profile.activity_level) : undefined;

  const startOf = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const today = startOf(new Date());
  const weekAgo = new Date(today.getTime() - 6 * 86400_000);
  const monthAgo = new Date(today.getTime() - 29 * 86400_000);

  const [weekRes, streakRes, weightsRes, exerciseRes] = await Promise.all([
    sb.from('food_entries').select('id, taken_at, kcal, protein_g, carbs_g, fat_g, items, meal').eq('user_id', user.id).gte('taken_at', weekAgo.toISOString()).order('taken_at', { ascending: false }),
    sb.from('food_entries').select('taken_at').eq('user_id', user.id).gte('taken_at', new Date(today.getTime() - 60 * 86400_000).toISOString()),
    sb.from('weight_logs').select('logged_at, weight_kg').eq('user_id', user.id).gte('logged_at', monthAgo.toISOString()).order('logged_at', { ascending: false }),
    sb.from('exercise_logs').select('id, activity, duration_min, kcal').eq('user_id', user.id).gte('performed_at', today.toISOString()).order('performed_at', { ascending: false })
  ]);
  const weekEntries = weekRes.data || [];
  const weights = weightsRes.data || [];
  const todayExercise = exerciseRes.data || [];
  const burned = todayExercise.reduce((a: number, e: any) => a + (e.kcal || 0), 0);

  const streak = computeStreak(streakRes.data || []);

  const todayEntries = weekEntries.filter((e: any) => new Date(e.taken_at) >= today);
  const sum = todayEntries.reduce((a: any, e: any) => ({ kcal: a.kcal + (e.kcal || 0), p: a.p + Number(e.protein_g || 0), c: a.c + Number(e.carbs_g || 0), f: a.f + Number(e.fat_g || 0) }), { kcal: 0, p: 0, c: 0, f: 0 });

  const byMeal: Record<Meal, any[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
  todayEntries.forEach((e: any) => { const m = (e.meal || 'snack') as Meal; byMeal[m].push(e); });

  const byDay = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400_000);
    byDay.set(d.toISOString().slice(5, 10), 0);
  }
  weekEntries.forEach((e: any) => {
    const key = new Date(e.taken_at).toISOString().slice(5, 10);
    if (byDay.has(key)) byDay.set(key, byDay.get(key)! + (e.kcal || 0));
  });
  const trend = Array.from(byDay, ([day, kcal]) => ({ day, kcal }));

  const latestWeight = weights[0] ? Number(weights[0].weight_kg) : (profile?.current_weight_kg ?? null);

  return (
    <div className="space-y-5">
      <img src="/hero.jpg" alt="" className="w-full h-32 object-cover rounded-2xl" />
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">Today</h1>
          <p className="text-neutral-500 text-sm">{target ? `Target: ${target} kcal` : <Link href="/profile" className="underline">Set up your profile</Link>}</p>
        </div>
        {streak > 0 && (
          <div className="bg-orange-100 border border-orange-200 text-orange-800 rounded-xl px-3 py-1 text-sm font-semibold">
            🔥 {streak}-day streak
          </div>
        )}
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-4xl font-bold text-emerald-600">{sum.kcal - burned}</span>
          <span className="text-neutral-500">/ {target ?? '—'} kcal</span>
        </div>
        {burned > 0 && (
          <p className="text-xs text-neutral-500 mt-1">{sum.kcal} eaten − <span className="text-orange-600">{burned} burned</span> = net {sum.kcal - burned} kcal</p>
        )}
        <div className="grid grid-cols-3 gap-2 mt-3 text-sm text-center">
          <div className="bg-neutral-100 rounded p-2">Protein<br /><b>{Math.round(sum.p)}g</b></div>
          <div className="bg-neutral-100 rounded p-2">Carbs<br /><b>{Math.round(sum.c)}g</b></div>
          <div className="bg-neutral-100 rounded p-2">Fat<br /><b>{Math.round(sum.f)}g</b></div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Today by meal</h2>
        <div className="space-y-2">
          {MEALS.map(m => {
            const list = byMeal[m.id];
            const mealKcal = list.reduce((a, e: any) => a + (e.kcal || 0), 0);
            return (
              <div key={m.id} className="bg-white border border-neutral-200 rounded-xl p-3">
                <div className="flex justify-between text-sm">
                  <span>{m.emoji} {m.label}</span>
                  <span className="text-emerald-600 font-semibold">{mealKcal} kcal</span>
                </div>
                {list.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {list.map((e: any) => (
                      <li key={e.id}>
                        <Link href={`/entry/${e.id}`} className="flex justify-between text-xs text-neutral-700">
                          <span className="truncate pr-2">
                            {(e.items && e.items[0]?.name) || 'Meal'}{e.items && e.items.length > 1 ? ` +${e.items.length - 1}` : ''}
                          </span>
                          <span>{e.kcal} kcal</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">7-day trend</h2>
        <TrendChart data={trend} target={target} />
      </div>

      <ExerciseCard weightKg={latestWeight} logs={todayExercise as any} />

      <WeightCard current={latestWeight} goal={profile?.goal_weight_kg ?? null} logs={weights as any} />
    </div>
  );
}
