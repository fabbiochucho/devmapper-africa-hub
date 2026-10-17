import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SEOHead } from '@/components/seo/SEOHead';

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: 'Our target',
    body: (
      <p>
        We aim for Dev Mapper to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA, so that
        people using a keyboard, a screen reader, zoom or high-contrast settings can use it.
      </p>
    ),
  },
  {
    title: 'What we have checked',
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>Automated checks (Lighthouse and axe) on the home, sign-in, contact, pricing and map pages, with the issues they found fixed.</li>
        <li>Keyboard-only use of the main navigation, sign-in and the contact form: every control can be reached and shows a visible focus outline.</li>
        <li>A "Skip to main content" link, text labels on icon-only buttons, and text colours that meet the 4.5:1 contrast ratio.</li>
      </ul>
    ),
  },
  {
    title: 'Known limitations',
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>The interactive map needs a mouse or touch to pan and to open project markers. Every project on the map is also listed on the search and project pages, which work with a keyboard.</li>
        <li>Charts in the analytics dashboards show their figures visually; the underlying numbers are not yet all available as tables.</li>
        <li>We have not yet completed a full screen-reader test of every dashboard.</li>
      </ul>
    ),
  },
  {
    title: 'Tell us about a problem',
    body: (
      <p>
        If something on Dev Mapper is hard to use with your setup, tell us through the{' '}
        <Link to="/contact?subject=Accessibility%20problem" className="text-primary underline underline-offset-2">contact form</Link>{' '}
        and say which page and what assistive technology you use. We aim to reply within 5 working days.
      </p>
    ),
  },
];

const Accessibility = () => (
  <div className="container mx-auto max-w-4xl p-6">
    <SEOHead
      title="Accessibility — Dev Mapper"
      description="Dev Mapper's accessibility target (WCAG 2.2 AA), what has been checked, known limitations and how to report a problem."
      canonicalUrl="/accessibility"
    />
    <div className="mb-8">
      <h1 className="mb-2 text-3xl font-bold">Accessibility statement</h1>
      <p className="text-xs text-muted-foreground">Last reviewed: 17 October 2026</p>
    </div>
    <div className="space-y-4">
      {sections.map((s) => (
        <Card key={s.title}>
          <CardHeader>
            <CardTitle className="text-lg">{s.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">{s.body}</CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default Accessibility;
