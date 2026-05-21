'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { browserClient } from '@/lib/supabase-browser';
import MealSelect from '@/components/MealSelect';
import type { Meal } from '@/lib/meals';

type Item = { name: string; portion: string; kcal: number; protein_g: number; carbs_g: number; fat_g: number };
type Entry = {
  id: string;
  taken_at: string;
  meal: Meal;
  items: Item[];
  kcal: number; protein_g: number; carbs_g: number; fat_g: number;
  confidence: string | null;
  notes: string | null;
};

function recomputeTotals(items: Item[]) {
  return items.reduce((t, it) => ({
    kcal: t.kcal + (Number(it.kcal) || 0),
    protein_g: t.protein_g + (Number(it.protein_g) || 0),
    carbs_g: t.carbs_g + (Number(it.carbs_g) || 0),
    fat_g: t.fat_g + (Number(it.fat_g) || 0)
  }), { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
}

export default function EntryEditor({ entry }: { entry: Entry }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(entry.items || []);
  const [meal, setMeal] = useState<Meal>(entry.meal || 'snack');
  const [notes, setNotes] = useState(entry.notes || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totals = recomputeTotals(items);

  function updateItem(i: number, patch: Partial<Item>) {
    const next = items.slice(); next[i] = { ...next[i], ...patch }; setItems(next);
  }
  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)); }
  function addItem() { setItems([...items, { name: '', portion: '', kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }]); }

  async function save() {
    setBusy(true); setError(null);
    const sb = browserClient();
    const { error } = await sb.from('food_entries').update({
      items, meal, notes: notes || null,
      kcal: Math.round(totals.kcal),
      protein_g: totals.protein_g, carbs_g: totals.carbs_g, fat_g: totals.fat_g
    }).eq('id', entry.id);
    setBusy(false);
    if (error) setError(error.message); else router.push('/');
  }

  async function remove() {
    if (!confirm('Delete this entry?')) return;
    setBusy(true);
    const sb = browserClient();
    const { error } = await sb.from('food_entries').delete().eq('id', entry.id);
    setBusy(false);
    if (error) setError(error.message); else router.push('/');
  }

  return (
    <div className="space-y-4">
      <div className="bg-neutral-900 rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-baseline">
          <h3 className="font-semibold">Items</h3>
          <span className="text-emerald-400 font-bold">{Math.round(totals.kcal)} kcal</span>
        </div>
        <MealSelect value={meal} onChange={setMeal} />
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="bg-neutral-800 rounded-lg p-2 space-y-1 text-sm">
              <div className="flex gap-2">
                <input value={it.name} onChange={e => updateItem(i, { name: e.target.value })} placeholder="name" className="flex-1 bg-neutral-900 rounded px-2 py-1" />
                <input value={it.portion} onChange={e => updateItem(i, { portion: e.target.value })} placeholder="portion" className="w-24 bg-neutral-900 rounded px-2 py-1" />
                <button onClick={() => removeItem(i)} className="text-red-400 px-2">✕</button>
              </div>
              <div className="grid grid-cols-4 gap-1 text-xs">
                <label className="flex flex-col"><span className="text-neutral-500">kcal</span><input type="number" value={it.kcal} onChange={e => updateItem(i, { kcal: +e.target.value })} className="bg-neutral-900 rounded px-1 py-1" /></label>
                <label className="flex flex-col"><span className="text-neutral-500">P</span><input type="number" step="0.1" value={it.protein_g} onChange={e => updateItem(i, { protein_g: +e.target.value })} className="bg-neutral-900 rounded px-1 py-1" /></label>
                <label className="flex flex-col"><span className="text-neutral-500">C</span><input type="number" step="0.1" value={it.carbs_g} onChange={e => updateItem(i, { carbs_g: +e.target.value })} className="bg-neutral-900 rounded px-1 py-1" /></label>
                <label className="flex flex-col"><span className="text-neutral-500">F</span><input type="number" step="0.1" value={it.fat_g} onChange={e => updateItem(i, { fat_g: +e.target.value })} className="bg-neutral-900 rounded px-1 py-1" /></label>
              </div>
            </div>
          ))}
          <button onClick={addItem} className="w-full bg-neutral-800 rounded-lg py-2 text-sm text-neutral-300">+ Add item</button>
        </div>
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" className="w-full bg-neutral-800 rounded p-2 text-sm" />
        <div className="grid grid-cols-3 gap-2 text-sm text-center">
          <div className="bg-neutral-800 rounded p-2">P {Math.round(totals.protein_g)}g</div>
          <div className="bg-neutral-800 rounded p-2">C {Math.round(totals.carbs_g)}g</div>
          <div className="bg-neutral-800 rounded p-2">F {Math.round(totals.fat_g)}g</div>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button onClick={save} disabled={busy} className="w-full bg-emerald-600 disabled:opacity-50 rounded-xl py-3 font-semibold">Save changes</button>
        <button onClick={remove} disabled={busy} className="w-full bg-red-900 disabled:opacity-50 rounded-xl py-3 font-semibold">Delete entry</button>
      </div>
    </div>
  );
}
