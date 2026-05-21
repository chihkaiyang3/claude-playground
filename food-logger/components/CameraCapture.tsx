'use client';
import { useState } from 'react';
import { browserClient } from '@/lib/supabase-browser';
import { defaultMealForNow, type Meal } from '@/lib/meals';
import MealSelect from '@/components/MealSelect';

type Item = { name: string; portion: string; kcal: number; protein_g: number; carbs_g: number; fat_g: number };
type Analysis = {
  items: Item[];
  totals: { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
  confidence: 'low' | 'med' | 'high';
};

async function resize(file: File, max = 1024): Promise<{ blob: Blob; base64: string }> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file);
  });
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
  const blob: Blob = await new Promise(r => canvas.toBlob(b => r(b!), 'image/jpeg', 0.85)!);
  const buf = await blob.arrayBuffer();
  let bin = ''; const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return { blob, base64: btoa(bin) };
}

function recomputeTotals(items: Item[]) {
  return items.reduce((t, it) => ({
    kcal: t.kcal + (Number(it.kcal) || 0),
    protein_g: t.protein_g + (Number(it.protein_g) || 0),
    carbs_g: t.carbs_g + (Number(it.carbs_g) || 0),
    fat_g: t.fat_g + (Number(it.fat_g) || 0)
  }), { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
}

export default function CameraCapture() {
  const [preview, setPreview] = useState<string | null>(null);
  const [items, setItems] = useState<Item[] | null>(null);
  const [confidence, setConfidence] = useState<'low' | 'med' | 'high'>('med');
  const [meal, setMeal] = useState<Meal>(defaultMealForNow());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const totals = items ? recomputeTotals(items) : null;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setError(null); setSavedId(null); setItems(null); setLoading(true);
    try {
      const { blob, base64 } = await resize(file);
      setPreview(URL.createObjectURL(blob));
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64: base64, mediaType: 'image/jpeg' }) });
      if (!res.ok) throw new Error((await res.json()).error || 'analyze failed');
      const json = await res.json() as Analysis;
      setItems(json.items);
      setConfidence(json.confidence);
      const sb = browserClient();
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        const path = `${user.id}/${Date.now()}.jpg`;
        await sb.storage.from('food-photos').upload(path, blob, { contentType: 'image/jpeg' });
        (window as any).__lastImagePath = path;
      }
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  function updateItem(i: number, patch: Partial<Item>) {
    if (!items) return;
    const next = items.slice();
    next[i] = { ...next[i], ...patch };
    setItems(next);
  }
  function removeItem(i: number) {
    if (!items) return;
    setItems(items.filter((_, idx) => idx !== i));
  }
  function addItem() {
    setItems([...(items || []), { name: '', portion: '', kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }]);
  }

  async function save() {
    if (!items || !totals) return;
    const sb = browserClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setError('Please sign in first'); return; }
    const { data, error } = await sb.from('food_entries').insert({
      user_id: user.id,
      taken_at: new Date().toISOString(),
      image_path: (window as any).__lastImagePath || null,
      items,
      kcal: Math.round(totals.kcal),
      protein_g: totals.protein_g,
      carbs_g: totals.carbs_g,
      fat_g: totals.fat_g,
      confidence,
      meal
    }).select('id').single();
    if (error) setError(error.message); else setSavedId(data!.id);
  }

  return (
    <div className="space-y-4">
      <label className="block w-full bg-emerald-600 active:bg-emerald-700 rounded-2xl py-4 text-center text-lg font-semibold">
        {preview ? 'Retake photo' : 'Take a photo'}
        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
      </label>
      {preview && <img src={preview} alt="meal" className="w-full rounded-2xl" />}
      {loading && <p className="text-neutral-400">Analysing…</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {items && totals && (
        <div className="bg-neutral-900 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-baseline">
            <h3 className="font-semibold">Estimate ({confidence})</h3>
            <span className="text-emerald-400 font-bold">{Math.round(totals.kcal)} kcal</span>
          </div>

          <MealSelect value={meal} onChange={setMeal} />

          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="bg-neutral-800 rounded-lg p-2 space-y-1 text-sm">
                <div className="flex gap-2">
                  <input value={it.name} onChange={e => updateItem(i, { name: e.target.value })} placeholder="name" className="flex-1 bg-neutral-900 rounded px-2 py-1" />
                  <input value={it.portion} onChange={e => updateItem(i, { portion: e.target.value })} placeholder="portion" className="w-24 bg-neutral-900 rounded px-2 py-1" />
                  <button onClick={() => removeItem(i)} className="text-red-400 px-2" aria-label="remove">✕</button>
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

          <div className="grid grid-cols-3 gap-2 text-sm text-center">
            <div className="bg-neutral-800 rounded p-2">P {Math.round(totals.protein_g)}g</div>
            <div className="bg-neutral-800 rounded p-2">C {Math.round(totals.carbs_g)}g</div>
            <div className="bg-neutral-800 rounded p-2">F {Math.round(totals.fat_g)}g</div>
          </div>

          {savedId ? <p className="text-emerald-400">Saved ✓</p> : (
            <button onClick={save} className="w-full bg-emerald-600 rounded-xl py-3 font-semibold">Save to log</button>
          )}
        </div>
      )}
    </div>
  );
}
