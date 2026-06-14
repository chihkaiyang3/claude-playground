'use client';
import { useState } from 'react';
import { browserClient } from '@/lib/supabase-browser';
import { defaultMealForNow, type Meal } from '@/lib/meals';
import MealSelect from '@/components/MealSelect';

const CONFIDENCE_COLOR: Record<string, string> = {
  high: 'bg-emerald-100 text-emerald-700',
  med: 'bg-yellow-100 text-yellow-700',
  low: 'bg-red-100 text-red-700',
};

export default function ManualEntryForm() {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [form, setForm] = useState({ kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, notes: '' });
  const [meal, setMeal] = useState<Meal>(defaultMealForNow());
  const [confidence, setConfidence] = useState<string | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function estimate() {
    if (!description.trim()) { setError('Describe what you ate first.'); return; }
    setError(null); setEstimating(true);
    try {
      const res = await fetch('/api/estimate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description }) });
      if (!res.ok) throw new Error((await res.json()).error || 'estimation failed');
      const json = await res.json();
      setForm(f => ({
        ...f,
        kcal: json.totals?.kcal ?? f.kcal,
        protein_g: json.totals?.protein_g ?? f.protein_g,
        carbs_g: json.totals?.carbs_g ?? f.carbs_g,
        fat_g: json.totals?.fat_g ?? f.fat_g,
      }));
      setConfidence(json.confidence ?? null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setEstimating(false);
    }
  }

  async function save() {
    setError(null);
    if (!description.trim()) { setError('Please describe what you ate.'); return; }
    if (form.kcal <= 0) { setError('Estimate or enter calories first.'); return; }
    const sb = browserClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setError('Please sign in first'); return; }
    const { error } = await sb.from('food_entries').insert({
      user_id: user.id,
      taken_at: new Date().toISOString(),
      items: [{ name: description.trim(), portion: '', kcal: form.kcal, protein_g: form.protein_g, carbs_g: form.carbs_g, fat_g: form.fat_g }],
      kcal: form.kcal,
      protein_g: form.protein_g,
      carbs_g: form.carbs_g,
      fat_g: form.fat_g,
      confidence: confidence || 'high',
      meal,
      notes: form.notes || null
    });
    if (error) setError(error.message);
    else {
      setSaved(true);
      setDescription(''); setForm({ kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, notes: '' }); setConfidence(null);
      setTimeout(() => { setSaved(false); setOpen(false); }, 1200);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full text-neutral-500 text-sm underline">
        Or enter manually
      </button>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-3">
      <div className="flex justify-between">
        <h3 className="font-semibold">Manual entry</h3>
        <button onClick={() => setOpen(false)} className="text-neutral-500 text-sm">Cancel</button>
      </div>

      <MealSelect value={meal} onChange={setMeal} />

      <div className="space-y-2">
        <textarea
          value={description}
          onChange={e => { setDescription(e.target.value); setConfidence(null); }}
          placeholder="What did you eat? e.g. soy latte, scrambled eggs on toast"
          rows={2}
          className="w-full bg-neutral-100 rounded p-2 text-sm resize-none"
        />
        <button
          onClick={estimate}
          disabled={estimating || !description.trim()}
          className="w-full bg-emerald-600 text-white disabled:opacity-50 rounded-xl py-2 text-sm font-semibold"
        >
          {estimating ? 'Estimating…' : '✨ Estimate with AI'}
        </button>
      </div>

      {confidence && (
        <p className="text-xs">
          AI estimate — confidence: <span className={`inline-block rounded px-2 py-0.5 font-semibold ${CONFIDENCE_COLOR[confidence] ?? 'bg-neutral-100 text-neutral-600'}`}>{confidence}</span>
          <span className="text-neutral-400 ml-1">edit the numbers if needed</span>
        </p>
      )}

      <div className="grid grid-cols-4 gap-2 text-sm">
        <label className="flex flex-col"><span className="text-neutral-500 text-xs">kcal</span><input type="number" value={form.kcal || ''} onChange={e => setForm({ ...form, kcal: +e.target.value })} className="bg-neutral-100 rounded p-1" /></label>
        <label className="flex flex-col"><span className="text-neutral-500 text-xs">P (g)</span><input type="number" step="0.1" value={form.protein_g || ''} onChange={e => setForm({ ...form, protein_g: +e.target.value })} className="bg-neutral-100 rounded p-1" /></label>
        <label className="flex flex-col"><span className="text-neutral-500 text-xs">C (g)</span><input type="number" step="0.1" value={form.carbs_g || ''} onChange={e => setForm({ ...form, carbs_g: +e.target.value })} className="bg-neutral-100 rounded p-1" /></label>
        <label className="flex flex-col"><span className="text-neutral-500 text-xs">F (g)</span><input type="number" step="0.1" value={form.fat_g || ''} onChange={e => setForm({ ...form, fat_g: +e.target.value })} className="bg-neutral-100 rounded p-1" /></label>
      </div>

      <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notes (optional)" className="w-full bg-neutral-100 rounded p-2 text-sm" />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button onClick={save} className="w-full bg-emerald-600 text-white rounded-xl py-3 font-semibold">{saved ? 'Saved ✓' : 'Save'}</button>
    </div>
  );
}
