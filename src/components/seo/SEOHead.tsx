import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  structuredData?: object;
}

export const SEOHead = ({
  title = 'Dev Mapper - Africa SDG Tracker',
  description = 'Comprehensive platform for tracking and managing Sustainable Development Goals and ESG metrics across Africa. Monitor SDG progress, ESG compliance, and sustainability initiatives.',
  keywords = ['SDG', 'ESG', 'Africa', 'sustainability', 'development goals', 'climate action', 'environmental', 'social', 'governance'],
  canonicalUrl,
  ogImage = '/lovable-uploads/06a46dda-ed52-44ed-8f8e-2edb1752ffa6.png',
  ogType = 'website',
  structuredData,
}: SEOHeadProps) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Standard meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords.join(', '));

    // Resolve canonical to absolute URL (accept relative paths like "/about")
    const SITE_ORIGIN = 'https://devmapper.africa';
    const resolvedCanonical = canonicalUrl
      ? (canonicalUrl.startsWith('http') ? canonicalUrl : `${SITE_ORIGIN}${canonicalUrl.startsWith('/') ? '' : '/'}${canonicalUrl}`)
      : `${SITE_ORIGIN}${typeof window !== 'undefined' ? window.location.pathname : '/'}`;

    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:type', ogType, true);
    updateMetaTag('og:image', ogImage, true);
    updateMetaTag('og:url', resolvedCanonical, true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', ogImage);

    // Canonical URL — always self-referencing for the current route
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = resolvedCanonical;

    // Structured Data (JSON-LD)
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }
  }, [title, description, keywords, canonicalUrl, ogImage, ogType, structuredData]);

  return null;
};
