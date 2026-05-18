import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

type PushState = 'loading' | 'unsupported' | 'denied' | 'prompt' | 'subscribed';

export function usePushNotifications() {
  const [state, setState] = useState<PushState>('loading');

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }

    const perm = Notification.permission;
    if (perm === 'denied') { setState('denied'); return; }
    if (perm === 'granted') {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setState(sub ? 'subscribed' : 'prompt');
        });
      });
    } else {
      setState('prompt');
    }
  }, []);

  const subscribe = useCallback(async () => {
    try {
      const { key } = await api.get<{ key: string }>('/push/vapid-key');
      if (!key) { setState('unsupported'); return false; }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setState('denied'); return false; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });

      const json = sub.toJSON();
      await api.post('/push/subscribe', {
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      });

      setState('subscribed');
      return true;
    } catch {
      return false;
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api.delete('/push/unsubscribe');
        await sub.unsubscribe();
      }
      setState('prompt');
    } catch {}
  }, []);

  return { state, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
