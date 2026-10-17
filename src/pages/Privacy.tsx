import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SEOHead } from '@/components/seo/SEOHead';
import { DPO_CLAUSE, DPO_EMAIL } from '@/lib/dpo';

// Last substantive revision of this policy. Update when the text changes.
export const PRIVACY_EFFECTIVE_DATE = '17 October 2026';

const Mail = () => (
  <a href={`mailto:${DPO_EMAIL}`} className="font-medium text-primary underline-offset-2 hover:underline">
    {DPO_EMAIL}
  </a>
);

const table = '[&_table]:w-full [&_td]:border [&_td]:p-2 [&_td]:align-top [&_th]:border [&_th]:bg-muted [&_th]:p-2 [&_th]:text-left';

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: 'Who we are',
    body: (
      <p>
        Dev Mapper (devmapper.africa) is operated by the Di Badili Leadership Sustainability Initiative, operating
        as DiBadili Institute, also known as Become Change Institute. We decide how and why personal data on
        Dev Mapper is processed, so we are its <b>controller</b>. Data protection contact: <Mail />.
      </p>
    ),
  },
  {
    title: 'Data we collect',
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li><b>Account data:</b> name, email address, password (stored only as a hash by our authentication provider), role, and optional profile details such as phone number, bio, organisation and photo.</li>
        <li><b>Content you submit:</b> project reports (including location coordinates, photos and documents), change-maker nominations, forum posts and replies, direct messages, comments, verification evidence, workspace collections and uploaded files.</li>
        <li><b>Donations and payments:</b> amount, currency, an optional message and the payment reference. Card and bank details are entered on Paystack’s or Flutterwave’s own checkout; we never see or store them.</li>
        <li><b>Contact and support:</b> the name, email address and message you send through the contact form, and your browser type.</li>
        <li><b>Usage data:</b> pages viewed, referring page, browser type and, if you are signed in, your account ID, recorded in our own database to understand how the platform is used and to diagnose errors. We do not use advertising trackers or third-party analytics.</li>
        <li><b>Approximate country:</b> derived from your IP address when you open a fundraising page, to suggest a currency. The IP address is not stored.</li>
      </ul>
    ),
  },
  {
    title: 'How we use it and our lawful bases',
    body: (
      <div className="overflow-x-auto"><table>
        <thead><tr><th>Purpose</th><th>Lawful basis</th></tr></thead>
        <tbody>
          <tr><td>Provide the platform: accounts, maps, reports, workspaces, verification, messaging</td><td>Contract with you</td></tr>
          <tr><td>Publish the reports, profiles and posts you choose to make public</td><td>Contract; your consent when you submit</td></tr>
          <tr><td>Process donations and subscriptions</td><td>Contract; legal obligations (financial records)</td></tr>
          <tr><td>Security: bot protection at sign-up, abuse prevention, audit logs</td><td>Legitimate interests; legal obligation to secure personal data</td></tr>
          <tr><td>Service emails: account, notifications and the email digest (you can turn the digest off in Settings)</td><td>Contract; legitimate interests</td></tr>
          <tr><td>Usage analytics and error monitoring</td><td>Legitimate interests</td></tr>
          <tr><td>Answer requests and complaints; meet legal duties</td><td>Legal obligation; legitimate interests</td></tr>
        </tbody>
      </table></div>
    ),
  },
  {
    title: 'AI features',
    body: (
      <p>
        Some features — the Ndovu assistant, document and bill extraction, and report checks — send the text or
        document you provide to an AI model (Google Gemini, through Lovable’s AI gateway) to produce an answer.
        Search queries are also converted by an OpenAI model into a numeric form used to find related records.
        We do not use your content to train AI models, and AI output is labelled and may be inaccurate.
      </p>
    ),
  },
  {
    title: 'Who we share it with',
    body: (
      <>
        <p>
          Content you publish (reports, forum posts, change-maker pages) is visible to everyone. Every account has a
          public profile showing your name, photo, organisation and country (the last two only if you fill them in),
          so other users can see who posted or published something.
          Private content is visible only to you, the people you share it with, and platform administrators where
          needed for verification, support, security or legal compliance. We do not sell personal data.
        </p>
        <p>We use these service providers (sub-processors):</p>
        <div className="overflow-x-auto"><table>
          <thead><tr><th>Provider</th><th>Purpose</th><th>Data</th></tr></thead>
          <tbody>
            <tr><td>Supabase</td><td>Database, sign-in, file storage, server functions</td><td>All account and platform data</td></tr>
            <tr><td>Lovable (with Cloudflare)</td><td>Website hosting and delivery; AI gateway</td><td>Requests to the site; text sent to AI features</td></tr>
            <tr><td>Google (Gemini), OpenAI</td><td>AI models behind AI features and search</td><td>Text and documents you submit to those features; search queries</td></tr>
            <tr><td>Paystack, Flutterwave</td><td>Payment processing</td><td>Name, email, amount, payment details you enter on their checkout</td></tr>
            <tr><td>Resend</td><td>Sending email</td><td>Email address, email content</td></tr>
            <tr><td>Cloudflare (Turnstile)</td><td>Bot protection at sign-up, sign-in and password reset</td><td>Browser and device signals, IP address</td></tr>
            <tr><td>OpenStreetMap</td><td>Map tiles and place search</td><td>IP address, map area and search text</td></tr>
            <tr><td>Flagpedia (flagcdn.com)</td><td>Country flag images</td><td>IP address</td></tr>
            <tr><td>GeoJS</td><td>Approximate country for currency suggestions on fundraising pages</td><td>IP address (not stored)</td></tr>
          </tbody>
        </table></div>
        <p>
          Satellite and open-data sources (Google Earth Engine, World Bank, IATI, Climate TRACE, Open-Meteo and
          others) receive only map areas and search terms, never your personal data.
        </p>
      </>
    ),
  },
  {
    title: 'International transfers',
    body: (
      <p>
        Our providers may process data outside your country, including in the European Union and the United
        States. Where the law requires safeguards for a transfer — for example under the Nigeria Data Protection
        Act, POPIA or the GDPR — we rely on adequacy decisions, the provider’s standard contractual clauses or
        another lawful transfer mechanism.
      </p>
    ),
  },
  {
    title: 'Retention',
    body: (
      <p>
        We keep account data while your account is open. Published reports and verification records may be kept
        after you leave, with your identity removed, because other users rely on them as a public record.
        Payment records are kept for as long as financial law requires (usually six years). Usage analytics are kept
        only while they help us improve and secure the platform. When you ask us to delete your account, we delete or anonymise your personal
        data within 30 days unless we must keep it by law.
      </p>
    ),
  },
  {
    title: 'Your rights',
    body: (
      <>
        <p>
          Depending on where you live, data protection law gives you rights to access, correct, delete, restrict
          or object to processing of your personal data, to data portability, and to withdraw consent. These
          include the Nigeria Data Protection Act 2023, Kenya’s Data Protection Act 2019, South Africa’s
          Protection of Personal Information Act, Ghana’s Data Protection Act 2012, Uganda’s Data Protection and
          Privacy Act 2019, Rwanda’s Law No. 058/2021, the EU and UK GDPR, and similar laws elsewhere.
        </p>
        <p>
          You can edit your profile, and delete your account immediately, in Settings. Deleting erases your
          personal details and private data and disables your login; published reports, verifications and payment
          records stay as anonymous records. To exercise any other right, contact our Data Protection Officer
          (below).
        </p>
      </>
    ),
  },
  {
    title: 'Cookies and browser storage',
    body: (
      <>
        <div className="overflow-x-auto"><table>
          <thead><tr><th>Name</th><th>Purpose</th><th>Type</th><th>Duration</th></tr></thead>
          <tbody>
            <tr><td><code>sb-…-auth-token</code></td><td>Keeps you signed in</td><td>Strictly necessary (browser storage)</td><td>Until you sign out</td></tr>
            <tr><td><code>sidebar:state</code></td><td>Remembers whether the sidebar is open</td><td>Functional cookie</td><td>7 days</td></tr>
            <tr><td><code>i18nextLng</code></td><td>Remembers your language</td><td>Functional (browser storage)</td><td>Until cleared</td></tr>
            <tr><td><code>onboarding_shown</code>, <code>devmapper_profile_prompt_dismissed</code></td><td>Stops the welcome tour and profile prompt reappearing</td><td>Functional (browser storage)</td><td>Until cleared</td></tr>
          </tbody>
        </table></div>
        <p>We do not use advertising or cross-site tracking cookies.</p>
      </>
    ),
  },
  {
    title: 'Security',
    body: (
      <p>
        We protect data with encryption in transit (HTTPS with HSTS), row-level access controls in our database,
        role-based permissions, bot protection and audit logs. To report a vulnerability, see our{' '}
        <a href="/.well-known/security.txt" className="text-primary underline-offset-2 hover:underline">security.txt</a>{' '}
        or email <Mail />.
      </p>
    ),
  },
  {
    title: 'Children',
    body: (
      <p>
        Dev Mapper is for adults and organisations. It is not directed at children under 18 and we do not
        knowingly collect their personal data. If you believe a child has given us personal data, contact us and
        we will delete it.
      </p>
    ),
  },
  {
    title: DPO_CLAUSE.heading,
    body: (
      <>
        <p>{DPO_CLAUSE.intro}</p>
        <p>{DPO_CLAUSE.lead}</p>
        <ul className="list-disc space-y-1 pl-5">
          {DPO_CLAUSE.details.map(([label, value]) => (
            <li key={label}>
              {label}: {value === DPO_EMAIL ? <Mail /> : value}
            </li>
          ))}
        </ul>
        <p>{DPO_CLAUSE.closing}</p>
      </>
    ),
  },
  {
    title: 'Complaints',
    body: (
      <p>
        Please contact our DPO first. You may also complain to your data protection authority, for example the
        Nigeria Data Protection Commission, Kenya’s Office of the Data Protection Commissioner, South Africa’s
        Information Regulator, Ghana’s Data Protection Commission, Uganda’s Personal Data Protection Office,
        Rwanda’s National Cyber Security Authority, or your EU or UK supervisory authority.
      </p>
    ),
  },
  {
    title: 'Changes',
    body: (
      <p>
        We update this policy when our processing changes and change the effective date above. See also our{' '}
        <Link to="/terms" className="text-primary underline-offset-2 hover:underline">Terms of Use</Link> and{' '}
        <Link to="/guidelines" className="text-primary underline-offset-2 hover:underline">Community Guidelines</Link>.
      </p>
    ),
  },
];

const Privacy = () => (
  <div className="container mx-auto max-w-4xl p-6">
    <SEOHead
      title="Privacy Policy — Dev Mapper"
      description="What personal data Dev Mapper collects, why, who it is shared with, how long it is kept, your rights, and how to contact our Data Protection Officer."
      canonicalUrl="/privacy"
    />
    <div className="mb-8">
      <h1 className="mb-2 text-3xl font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground">
        What personal data Dev Mapper collects, why, who it is shared with, how long it is kept and the rights
        you have over it.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">Effective date: {PRIVACY_EFFECTIVE_DATE}</p>
    </div>
    <div className="space-y-4">
      {sections.map((s, i) => (
        <Card key={s.title} id={s.title === DPO_CLAUSE.heading ? 'dpo' : undefined}>
          <CardHeader>
            <CardTitle className="text-lg">{i + 1}. {s.title}</CardTitle>
          </CardHeader>
          <CardContent className={`space-y-3 break-words text-sm leading-relaxed ${table}`}>{s.body}</CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default Privacy;
