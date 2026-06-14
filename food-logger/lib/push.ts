import 'server-only';
import webpush from 'web-push';

// Configure VAPID once per server instance.
let configured = false;
function ensureConfigured() {
  if (configured) return;
  webpush.setVapidDetails(
    'mailto:chihkaiyang3@gmail.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  configured = true;
}

export type PushSub = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function sendPush(sub: PushSub, payload: object) {
  ensureConfigured();
  return webpush.sendNotification(
    { endpoint: sub.endpoint, keys: sub.keys } as any,
    JSON.stringify(payload)
  );
}

export { webpush };
