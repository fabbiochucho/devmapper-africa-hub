import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe, X } from 'lucide-react';

// i18next-browser-languagedetector already silently switches the active
// language on load based on the browser's locale - this banner doesn't
// decide whether to translate, it just surfaces that decision to a
// first-time visitor instead of leaving it invisible, and offers an easy
// way back to English. Shown once per browser (localStorage-gated).
const SUPPORTED_NAMES: Record<string, string> = {
  fr: 'Français',
  pt: 'Português',
  sw: 'Kiswahili',
  ar: 'العربية',
};

const SEEN_KEY = 'devmapper_lang_prompt_seen';

export default function LanguagePromptBanner() {
  const { i18n } = useTranslation();
  const [visible, setVisible] = useState(false);
  const detected = i18n.language?.split('-')[0];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (localStorage.getItem(SEEN_KEY)) return;
    } catch {
      return;
    }
    if (detected && SUPPORTED_NAMES[detected]) {
      setVisible(true);
    }
  }, [detected]);

  const markSeen = () => {
    try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* private browsing, etc. */ }
    setVisible(false);
  };

  const keepEnglish = () => {
    i18n.changeLanguage('en');
    markSeen();
  };

  if (!visible || !detected) return null;

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
      <div className="max-w-screen-xl mx-auto flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-2">
          <Globe className="h-4 w-4 shrink-0" />
          DevMapper is available in {SUPPORTED_NAMES[detected]} — we've switched based on your browser.
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={keepEnglish}>Keep English</Button>
          <Button size="sm" onClick={markSeen}>Sounds good</Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={markSeen} aria-label="Dismiss">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
