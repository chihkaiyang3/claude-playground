import { NextRequest, NextResponse } from 'next/server';
import { anthropic, MODEL } from '@/lib/anthropic';

export const runtime = 'nodejs';

const SYSTEM = `You are a precise nutrition estimator. Given a text description of food or a meal, identify each food item, estimate typical portion sizes, and return STRICT JSON ONLY (no prose, no markdown fences) with this shape:
{"items":[{"name":string,"portion":string,"kcal":number,"protein_g":number,"carbs_g":number,"fat_g":number}],"totals":{"kcal":number,"protein_g":number,"carbs_g":number,"fat_g":number},"confidence":"low"|"med"|"high"}
Round numbers to integers. Use standard serving sizes where not specified. If unsure, use conservative middle estimates and set confidence to "low" or "med" accordingly.`;

export async function POST(req: NextRequest) {
  const { description } = await req.json();
  if (!description || !description.trim()) return NextResponse.json({ error: 'missing description' }, { status: 400 });

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }] as any,
    messages: [{
      role: 'user',
      content: `Estimate calories and macros for: "${description.trim()}". Return JSON only.`
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
