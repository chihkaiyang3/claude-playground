'use client';
import { useEffect, useState } from 'react';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export default function ReminderToggle() {
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setSupported(false); return;
    }
    navigator.serviceWorker.ready
      .then(reg => reg.pushManager.getSubscription())
      .then(sub => setEnabled(!!sub))
      .catch(() => {});
  }, []);

  async function enable() {
    setBusy(true); setError(null);
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Notification permission denied. Enable it in your browser settings.');
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });
      const res = await fetch('/api/push/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save subscription');
      setEnabled(true);
    } catch (e: any) {
      setError(e.message);
    } finally { setBusy(false); }
  }

  async function disable() {
    setBusy(true); setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEnabled(false);
    } catch (e: any) {
      setError(e.message);
    } finally { setBusy(false); }
  }

  if (!supported) {
    return (
      <div className="bg-white border border-neutral-200 rounded-2xl p-4">
        <h2 className="font-semibold">Meal reminders</h2>
        <p className="text-neutral-500 text-sm mt-1">
          Notifications aren&apos;t supported here. On iPhone, install the app to your Home Screen first (Share → Add to Home Screen), then open it from there.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-2">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-semibold">Meal reminders</h2>
          <p className="text-neutral-500 text-sm">Nudges at 8am, 1pm &amp; 7pm (Sydney time).</p>
        </div>
        <button
          onClick={enabled ? disable : enable}
          disabled={busy}
          className={`rounded-xl px-4 py-2 font-semibold disabled:opacity-50 ${enabled ? 'bg-neutral-100 text-neutral-700' : 'bg-emerald-600 text-white'}`}
        >
          {busy ? '…' : enabled ? 'Turn off' : 'Turn on'}
        </button>
      </div>
      {enabled && <p className="text-emerald-600 text-sm">Reminders are on for this device ✓</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
