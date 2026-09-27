import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import fr from './locales/fr.json';
import pt from './locales/pt.json';
import sw from './locales/sw.json';
import ar from './locales/ar.json';

// Arabic is the only supported language read right-to-left. Without this,
// Arabic text renders in an LTR document - individual words are correct
// but overall reading order, alignment, and icon-relative-to-text
// placement are all wrong. `dir` is a real HTML attribute (not just CSS)
// so browsers/assistive tech get this right for free once set.
const RTL_LANGUAGES = new Set(['ar']);

function applyDirection(lang: string) {
  const base = lang?.split('-')[0];
  const dir = RTL_LANGUAGES.has(base) ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = base || 'en';
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      pt: { translation: pt },
      sw: { translation: sw },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['navigator', 'htmlTag', 'localStorage', 'cookie'],
      caches: ['localStorage'],
    },
  });

applyDirection(i18n.language);
i18n.on('languageChanged', applyDirection);

export default i18n;
