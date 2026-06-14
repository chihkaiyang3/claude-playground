import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase-admin';
import { sendPush } from '@/lib/push';

export const runtime = 'nodejs';

// Meal reminders fire at these local hours in Australia/Sydney (DST handled via Intl).
const MEAL_HOURS: Record<number, { title: string; body: string }> = {
  8:  { title: 'Breakfast 🌅', body: "Don't forget to log your breakfast." },
  13: { title: 'Lunch 🥗', body: 'Time to log your lunch.' },
  19: { title: 'Dinner 🍽️', body: 'Log your dinner before you forget.' },
};

function sydneyHour(): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Australia/Sydney', hour: 'numeric', hour12: false,
  }).formatToParts(new Date());
  const h = parts.find(p => p.type === 'hour')?.value ?? '0';
  return parseInt(h, 10) % 24;
}

export async function GET(req: NextRequest) {
  // Authenticate the cron caller.
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const hour = sydneyHour();
  const meal = MEAL_HOURS[hour];
  if (!meal) return NextResponse.json({ skipped: true, hour });

  const sb = adminClient();
  const { data: subs, error } = await sb.from('push_subscriptions').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const payload = { title: meal.title, body: meal.body, tag: `meal-${hour}`, url: '/log' };
  let sent = 0, removed = 0;

  await Promise.all((subs || []).map(async (s: any) => {
    try {
      await sendPush({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
      sent++;
    } catch (err: any) {
      // 404/410 = subscription expired; clean it up.
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await sb.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
        removed++;
      }
    }
  }));

  return NextResponse.json({ hour, sent, removed });
}
