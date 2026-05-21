'use client';
import { useEffect, useState } from 'react';
import { browserClient } from '@/lib/supabase-browser';
import { dailyTarget } from '@/lib/nutrition';

type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export default function ProfilePage() {
  const sb = browserClient();
  const [form, setForm] = useState({ age: 35, sex: 'male' as 'male' | 'female', height_cm: 175, current_weight_kg: 80, goal_weight_kg: 75, activity_level: 'moderate' as Activity });
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await sb.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (data) setForm({ age: data.age, sex: data.sex, height_cm: data.height_cm, current_weight_kg: data.current_weight_kg, goal_weight_kg: data.goal_weight_kg, activity_level: data.activity_level });
    })();
  }, []);

  const target = dailyTarget(form.sex, form.current_weight_kg, form.height_cm, form.age, form.activity_level);

  async function save() {
    if (!userId) return;
    await sb.from('profiles').upsert({ user_id: userId, ...form, daily_kcal_target: target, updated_at: new Date().toISOString() });
    setSaved(true); setTimeout(() => setSaved(false), 1500);
  }

  const Field = ({ label, children }: any) => (
    <label className="block"><span className="text-sm text-neutral-500">{label}</span>{children}</label>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Profile</h1>
      {!userId && <p className="text-neutral-500">Sign in first.</p>}
      <div className="space-y-3">
        <Field label="Age"><input type="number" className="w-full bg-white border border-neutral-200 rounded p-2" value={form.age} onChange={e => setForm({ ...form, age: +e.target.value })} /></Field>
        <Field label="Sex">
          <select className="w-full bg-white border border-neutral-200 rounded p-2" value={form.sex} onChange={e => setForm({ ...form, sex: e.target.value as any })}>
            <option value="male">Male</option><option value="female">Female</option>
          </select>
        </Field>
        <Field label="Height (cm)"><input type="number" className="w-full bg-white border border-neutral-200 rounded p-2" value={form.height_cm} onChange={e => setForm({ ...form, height_cm: +e.target.value })} /></Field>
        <Field label="Current weight (kg)"><input type="number" step="0.1" className="w-full bg-white border border-neutral-200 rounded p-2" value={form.current_weight_kg} onChange={e => setForm({ ...form, current_weight_kg: +e.target.value })} /></Field>
        <Field label="Goal weight (kg)"><input type="number" step="0.1" className="w-full bg-white border border-neutral-200 rounded p-2" value={form.goal_weight_kg} onChange={e => setForm({ ...form, goal_weight_kg: +e.target.value })} /></Field>
        <Field label="Activity">
          <select className="w-full bg-white border border-neutral-200 rounded p-2" value={form.activity_level} onChange={e => setForm({ ...form, activity_level: e.target.value as Activity })}>
            <option value="sedentary">Sedentary</option><option value="light">Light</option><option value="moderate">Moderate</option><option value="active">Active</option><option value="very_active">Very active</option>
          </select>
        </Field>
      </div>
      <div className="bg-white border border-neutral-200 rounded-xl p-3 text-sm">Daily target: <b className="text-emerald-600">{target} kcal</b></div>
      <button onClick={save} disabled={!userId} className="w-full bg-emerald-600 text-white disabled:opacity-50 rounded-xl py-3 font-semibold">{saved ? 'Saved ✓' : 'Save profile'}</button>
    </div>
  );
}
