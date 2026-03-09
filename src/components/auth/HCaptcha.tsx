import { useRef, useCallback } from 'react';
import HCaptchaComponent from '@hcaptcha/react-hcaptcha';

interface HCaptchaProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || '';

export const HCaptcha = ({ onVerify, onError, onExpire }: HCaptchaProps) => {
  const captchaRef = useRef<HCaptchaComponent>(null);

  const handleVerify = useCallback((token: string) => {
    onVerify(token);
  }, [onVerify]);

  const handleError = useCallback(() => {
    onError?.();
  }, [onError]);

  const handleExpire = useCallback(() => {
    onExpire?.();
  }, [onExpire]);

  if (!HCAPTCHA_SITE_KEY) {
    console.warn('HCaptcha site key not configured. Set VITE_HCAPTCHA_SITE_KEY in .env');
    return null;
  }

  return (
    <HCaptchaComponent
      ref={captchaRef}
      sitekey={HCAPTCHA_SITE_KEY}
      onVerify={handleVerify}
      onError={handleError}
      onExpire={handleExpire}
    />
  );
};
