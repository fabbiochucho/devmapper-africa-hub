import { useEffect, useRef } from 'react';

// Cloudflare Turnstile. The site key is public; the secret lives in Supabase Auth
// (Attack Protection). Empty key = CAPTCHA off. Localhost uses Cloudflare's always-pass test key.
const SITE_KEY: string = '0x4AAAAAAFZJofiUbFasBoIR';
const TEST_KEY = '1x00000000000000000000AA';
const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export const CAPTCHA_ENABLED = SITE_KEY !== '';

type TurnstileApi = { render: (el: HTMLElement, opts: Record<string, unknown>) => string; remove: (id: string) => void };
let loading: Promise<TurnstileApi> | null = null;
function load(): Promise<TurnstileApi> {
  const w = window as unknown as { turnstile?: TurnstileApi };
  if (w.turnstile) return Promise.resolve(w.turnstile);
  return (loading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SRC;
    s.async = true;
    s.onload = () => (w.turnstile ? resolve(w.turnstile) : reject(new Error('Turnstile failed to load')));
    s.onerror = () => { loading = null; reject(new Error('Turnstile failed to load')); };
    document.head.appendChild(s);
  }));
}

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export const Turnstile = ({ onVerify, onError, onExpire }: TurnstileProps) => {
  const ref = useRef<HTMLDivElement>(null);
  // Latest callbacks without re-rendering the widget when they change.
  const cb = useRef({ onVerify, onError, onExpire });
  cb.current = { onVerify, onError, onExpire };

  useEffect(() => {
    if (!CAPTCHA_ENABLED) return;
    let id: string | null = null;
    let api: TurnstileApi | null = null;
    let cancelled = false;
    const local = ['localhost', '127.0.0.1'].includes(location.hostname);
    load().then((t) => {
      if (cancelled || !ref.current) return;
      api = t;
      id = t.render(ref.current, {
        sitekey: local ? TEST_KEY : SITE_KEY,
        callback: (token: string) => cb.current.onVerify(token),
        'expired-callback': () => cb.current.onExpire?.(),
        'error-callback': () => cb.current.onError?.(),
      });
    }).catch(() => cb.current.onError?.());
    return () => { cancelled = true; if (api && id) api.remove(id); };
  }, []);

  if (!CAPTCHA_ENABLED) return null;
  return <div ref={ref} className="min-h-[65px]" />;
};
