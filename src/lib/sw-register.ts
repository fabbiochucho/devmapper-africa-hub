// Service Worker registration & push subscription utilities

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  if (import.meta.env.DEV) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));

      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter((name) => name.startsWith('devmapper-'))
            .map((name) => caches.delete(name))
        );
      }

    } catch (error) {
      console.error('SW cleanup failed:', error);
    }

    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch (error) {
    console.error('SW registration failed:', error);
    return null;
  }
}

export async function subscribeToPush(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  if (!('PushManager' in window)) {
    return null;
  }

  try {
    // Check existing subscription
    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    // For web push, we'd need a VAPID key. For now, return null until configured.
    console.warn('Push subscription requires VAPID key configuration');
    return null;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
}

export function isPWAInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}
