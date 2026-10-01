// JSON-LD structured data generators for SEOHead's structuredData prop.
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
  type?: string;
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
