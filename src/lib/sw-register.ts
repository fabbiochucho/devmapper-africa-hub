// Service Worker registration & push subscription utilities

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('SW registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('SW registration failed:', error);
    return null;
  }
}

export async function subscribeToPush(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  if (!('PushManager' in window)) {
    console.log('Push not supported');
    return null;
  }

  try {
    // Check existing subscription
    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    // For web push, we'd need a VAPID key. For now, return null until configured.
    console.log('Push subscription requires VAPID key configuration');
    return null;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
}

export function isPWAInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true;
}
