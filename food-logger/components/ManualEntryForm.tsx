'use client';
import { useState } from 'react';
import { browserClient } from '@/lib/supabase-browser';
import { defaultMealForNow, type Meal } from '@/lib/meals';
import MealSelect from '@/components/MealSelect';

export default function ManualEntryForm() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, notes: '' });
  const [meal, setMeal] = useState<Meal>(defaultMealForNow());
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    if (!form.name || form.kcal <= 0) { setError('Name and kcal required.'); return; }
    const sb = browserClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setError('Please sign in first'); return; }
    const { error } = await sb.from('food_entries').insert({
      user_id: user.id,
      taken_at: new Date().toISOString(),
      items: [{ name: form.name, portion: '', kcal: form.kcal, protein_g: form.protein_g, carbs_g: form.carbs_g, fat_g: form.fat_g }],
      kcal: form.kcal,
      protein_g: form.protein_g,
      carbs_g: form.carbs_g,
      fat_g: form.fat_g,
      confidence: 'high',
      meal,
      notes: form.notes || null
    });
    if (error) setError(error.message);
    else {
      setSaved(true);
      setForm({ name: '', kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, notes: '' });
      setTimeout(() => { setSaved(false); setOpen(false); }, 1200);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full text-neutral-400 text-sm underline">
        Or enter manually
      </button>
    );
  }

  return (
    <div className="bg-neutral-900 rounded-2xl p-4 space-y-3">
      <div className="flex justify-between">
        <h3 className="font-semibold">Manual entry</h3>
        <button onClick={() => setOpen(false)} className="text-neutral-400 text-sm">Cancel</button>
      </div>
      <MealSelect value={meal} onChange={setMeal} />
      <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="What did you eat?" className="w-full bg-neutral-800 rounded p-2" />
      <div className="grid grid-cols-4 gap-2 text-sm">
        <label className="flex flex-col"><span className="text-neutral-500 text-xs">kcal</span><input type="number" value={form.kcal} onChange={e => setForm({ ...form, kcal: +e.target.value })} className="bg-neutral-800 rounded p-1" /></label>
        <label className="flex flex-col"><span className="text-neutral-500 text-xs">P (g)</span><input type="number" step="0.1" value={form.protein_g} onChange={e => setForm({ ...form, protein_g: +e.target.value })} className="bg-neutral-800 rounded p-1" /></label>
        <label className="flex flex-col"><span className="text-neutral-500 text-xs">C (g)</span><input type="number" step="0.1" value={form.carbs_g} onChange={e => setForm({ ...form, carbs_g: +e.target.value })} className="bg-neutral-800 rounded p-1" /></label>
        <label className="flex flex-col"><span className="text-neutral-500 text-xs">F (g)</span><input type="number" step="0.1" value={form.fat_g} onChange={e => setForm({ ...form, fat_g: +e.target.value })} className="bg-neutral-800 rounded p-1" /></label>
      </div>
      <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notes (optional)" className="w-full bg-neutral-800 rounded p-2 text-sm" />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button onClick={save} className="w-full bg-emerald-600 rounded-xl py-3 font-semibold">{saved ? 'Saved ✓' : 'Save'}</button>
    </div>
  );
}
