'use client';
import { useState } from 'react';
import { browserClient } from '@/lib/supabase';

type Analysis = {
  items: { name: string; portion: string; kcal: number; protein_g: number; carbs_g: number; fat_g: number }[];
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

export default function CameraCapture() {
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setError(null); setSavedId(null); setAnalysis(null); setLoading(true);
    try {
      const { blob, base64 } = await resize(file);
      setPreview(URL.createObjectURL(blob));
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64: base64, mediaType: 'image/jpeg' }) });
      if (!res.ok) throw new Error((await res.json()).error || 'analyze failed');
      const json = await res.json() as Analysis;
      setAnalysis(json);
      // upload image
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

  async function save() {
    if (!analysis) return;
    const sb = browserClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setError('Please sign in first'); return; }
    const { data, error } = await sb.from('food_entries').insert({
      user_id: user.id,
      taken_at: new Date().toISOString(),
      image_path: (window as any).__lastImagePath || null,
      items: analysis.items,
      kcal: Math.round(analysis.totals.kcal),
      protein_g: analysis.totals.protein_g,
      carbs_g: analysis.totals.carbs_g,
      fat_g: analysis.totals.fat_g,
      confidence: analysis.confidence
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
      {analysis && (
        <div className="bg-neutral-900 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between">
            <h3 className="font-semibold">Estimate ({analysis.confidence})</h3>
            <span className="text-emerald-400 font-bold">{analysis.totals.kcal} kcal</span>
          </div>
          <ul className="text-sm text-neutral-300 space-y-1">
            {analysis.items.map((it, i) => (
              <li key={i}>• {it.name} ({it.portion}) — {it.kcal} kcal</li>
            ))}
          </ul>
          <div className="grid grid-cols-3 gap-2 text-sm text-center">
            <div className="bg-neutral-800 rounded p-2">P {Math.round(analysis.totals.protein_g)}g</div>
            <div className="bg-neutral-800 rounded p-2">C {Math.round(analysis.totals.carbs_g)}g</div>
            <div className="bg-neutral-800 rounded p-2">F {Math.round(analysis.totals.fat_g)}g</div>
          </div>
          {savedId ? <p className="text-emerald-400">Saved ✓</p> : (
            <button onClick={save} className="w-full bg-emerald-600 rounded-xl py-3 font-semibold">Save to log</button>
          )}
        </div>
      )}
    </div>
  );
}
