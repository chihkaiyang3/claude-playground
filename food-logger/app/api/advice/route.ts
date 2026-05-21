import { NextResponse } from 'next/server';
import { anthropic, MODEL } from '@/lib/anthropic';
import { serverClient } from '@/lib/supabase-server';
import { dailyTarget } from '@/lib/nutrition';

export const runtime = 'nodejs';

const SYSTEM = `You are an evidence-based nutrition and weight-loss coach. Given a user's profile and recent food logs:
- Acknowledge what they're doing well.
- Identify 2-3 specific patterns (e.g. low protein, late-night calorie spikes, frequent high-fat snacks).
- Give 3-5 concrete, actionable suggestions tied to their actual logged foods.
- Reference their daily calorie target and protein goal (1.6-2.0 g/kg bodyweight).
- Keep it under 300 words, friendly, non-judgmental, markdown formatted with short bullets.
Do NOT give medical advice or diagnose conditions.`;

export async function POST() {
  const sb = serverClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await sb.from('profiles').select('*').eq('user_id', user.id).single();
  const since = new Date(Date.now() - 14 * 86400_000).toISOString();
  const { data: entries } = await sb.from('food_entries').select('taken_at, items, kcal, protein_g, carbs_g, fat_g').eq('user_id', user.id).gte('taken_at', since).order('taken_at', { ascending: false });

  if (!profile) return NextResponse.json({ error: 'complete your profile first' }, { status: 400 });

  const target = dailyTarget(profile.sex, profile.current_weight_kg, profile.height_cm, profile.age, profile.activity_level);
  const summary = {
    profile: { age: profile.age, sex: profile.sex, height_cm: profile.height_cm, weight_kg: profile.current_weight_kg, goal_kg: profile.goal_weight_kg, activity: profile.activity_level, daily_kcal_target: target },
    entries: entries || []
  };

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 800,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }] as any,
    messages: [{ role: 'user', content: `Here is my data:\n\`\`\`json\n${JSON.stringify(summary, null, 2)}\n\`\`\`\nGive me personalised advice to lose weight sustainably.` }]
  });

  const text = msg.content.filter(b => b.type === 'text').map((b: any) => b.text).join('');
  return NextResponse.json({ advice: text, target });
}
