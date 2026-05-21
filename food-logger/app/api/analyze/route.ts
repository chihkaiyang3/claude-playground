import { NextRequest, NextResponse } from 'next/server';
import { anthropic, MODEL } from '@/lib/anthropic';

export const runtime = 'nodejs';

const SYSTEM = `You are a precise nutrition estimator. Given a photo of a meal, identify each food item, estimate portion sizes, and return STRICT JSON ONLY (no prose, no markdown fences) with this shape:
{"items":[{"name":string,"portion":string,"kcal":number,"protein_g":number,"carbs_g":number,"fat_g":number}],"totals":{"kcal":number,"protein_g":number,"carbs_g":number,"fat_g":number},"confidence":"low"|"med"|"high"}
Round numbers to integers. If unsure, choose conservative middle estimates and set confidence accordingly.`;

export async function POST(req: NextRequest) {
  const { imageBase64, mediaType } = await req.json();
  if (!imageBase64) return NextResponse.json({ error: 'missing imageBase64' }, { status: 400 });

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }] as any,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 } },
        { type: 'text', text: 'Estimate calories and macros for this meal. Return JSON only.' }
      ]
    }]
  });

  const text = msg.content.filter(b => b.type === 'text').map((b: any) => b.text).join('');
  try {
    const json = JSON.parse(text.replace(/^```json\s*|\s*```$/g, '').trim());
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ error: 'parse failed', raw: text }, { status: 502 });
  }
}
