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

    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:type', ogType, true);
    updateMetaTag('og:image', ogImage, true);
    if (canonicalUrl) {
      updateMetaTag('og:url', canonicalUrl, true);
    }

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', ogImage);

    // Canonical URL
    if (canonicalUrl) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonicalUrl;
    }

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

// Pre-built structured data generators
export const generateOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Dev Mapper',
  description: 'Africa SDG and ESG Tracking Platform',
  url: 'https://devmapper.africa',
  logo: 'https://devmapper.africa/lovable-uploads/06a46dda-ed52-44ed-8f8e-2edb1752ffa6.png',
  sameAs: [
    'https://twitter.com/devmapper',
    'https://linkedin.com/company/devmapper',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'support@devmapper.africa',
  },
});

export const generateWebsiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Dev Mapper',
  url: 'https://devmapper.africa',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://devmapper.africa/search?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
});

export const generateChangeMakerSchema = (changeMaker: {
  name: string;
  description: string;
  location: string;
  type: string;
  website?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': changeMaker.type === 'individual' ? 'Person' : 'Organization',
  name: changeMaker.name,
  description: changeMaker.description,
  address: {
    '@type': 'PostalAddress',
    addressLocality: changeMaker.location,
  },
  url: changeMaker.website,
});

export const generateFAQSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});
