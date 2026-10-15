import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SEOHead } from '@/components/seo/SEOHead';
import { DPO_EMAIL } from '@/lib/dpo';

// Last substantive revision of these terms. Update when the text changes.
export const TERMS_EFFECTIVE_DATE = '15 October 2026';

const A = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Link to={to} className="text-primary underline-offset-2 hover:underline">{children}</Link>
);

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: 'About these terms',
    body: (
      <p>
        These terms govern your use of Dev Mapper (devmapper.africa), operated by the Di Badili Leadership
        Sustainability Initiative through the Di Badili Institute and the Become Change Institute. By creating an
        account or using the platform you agree to them, to our <A to="/privacy">Privacy Policy</A> and to our{' '}
        <A to="/guidelines">Community Guidelines</A>.
      </p>
    ),
  },
  {
    title: 'Accounts',
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>You must be at least 18, or using Dev Mapper on behalf of an organisation that has authorised you.</li>
        <li>Give accurate information, keep your password secret, and tell us at once if your account is misused.</li>
        <li>You are responsible for activity under your account. Roles such as NGO member, government official or verifier must reflect your real position.</li>
      </ul>
    ),
  },
  {
    title: 'Your content',
    body: (
      <>
        <p>
          You keep ownership of the reports, photos, documents and posts you submit. You give us a worldwide,
          non-exclusive, royalty-free licence to host, display, verify, translate and share that content as part
          of the platform, including publicly where you choose to publish it. Published reports and verification
          records may remain, with your identity removed, after you leave, because others rely on them.
        </p>
        <p>You confirm you have the right to submit the content, including consent from identifiable people in photos.</p>
      </>
    ),
  },
  {
    title: 'Acceptable use',
    body: (
      <>
        <p>You must not:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>submit false, fabricated or misleading project data, locations or evidence, or verify projects you have no knowledge of;</li>
          <li>harass, threaten, dox or discriminate against anyone, or post unlawful, hateful or sexually explicit content;</li>
          <li>post other people’s personal data without a lawful reason, or share private messages without consent;</li>
          <li>upload malware, probe or attack the platform, bypass access controls or rate limits, or scrape it at a scale that harms the service;</li>
          <li>use automated accounts, or create accounts to evade a suspension;</li>
          <li>use the platform for fraud, money laundering, or fundraising for anything other than the stated campaign.</li>
        </ul>
        <p>
          Report breaches with the Report button or by email. We may remove content and suspend or close accounts
          that break these terms, and will tell you why unless the law or safety prevents it.
        </p>
      </>
    ),
  },
  {
    title: 'Donations and payments',
    body: (
      <p>
        Donations and subscriptions are processed by Paystack or Flutterwave under their own terms. Campaign
        organisers are responsible for using funds as described. Donations are generally non-refundable unless a
        payment was made in error or the law requires a refund; contact us within 30 days.
      </p>
    ),
  },
  {
    title: 'Data, AI output and certificates',
    body: (
      <p>
        Dev Mapper combines user reports with open data and AI-assisted analysis. We work to keep it accurate but
        do not guarantee that any data, AI output, score or certificate is complete or error-free. Check important
        decisions against the original sources, which we link wherever possible.
      </p>
    ),
  },
  {
    title: 'Security',
    body: (
      <p>
        If you find a security vulnerability, report it privately as described in our{' '}
        <a href="/.well-known/security.txt" className="text-primary underline-offset-2 hover:underline">security.txt</a>.
        Good-faith research that avoids privacy violations, data destruction and service disruption, and gives us
        reasonable time to fix the issue, will not be pursued under these terms.
      </p>
    ),
  },
  {
    title: 'Liability',
    body: (
      <p>
        The platform is provided “as is”. To the extent the law allows, we are not liable for indirect or
        consequential loss, or for content posted by users. Nothing in these terms limits liability that cannot be
        limited by law, or your rights as a consumer.
      </p>
    ),
  },
  {
    title: 'Ending your use',
    body: (
      <p>
        You can stop using Dev Mapper at any time and ask for your account to be deleted by emailing{' '}
        <a href={`mailto:${DPO_EMAIL}`} className="text-primary underline-offset-2 hover:underline">{DPO_EMAIL}</a>.
      </p>
    ),
  },
  {
    title: 'Governing law and changes',
    body: (
      <p>
        These terms are governed by the laws of the Federal Republic of Nigeria, without depriving you of
        protections under the law of the country where you live. We will post changes here and update the
        effective date; material changes will be announced on the platform before they take effect.
      </p>
    ),
  },
];

const Terms = () => (
  <div className="container mx-auto max-w-4xl p-6">
    <SEOHead
      title="Terms of Use — Dev Mapper"
      description="The terms for using Dev Mapper, including acceptable use, your content, donations and security research."
      canonicalUrl="/terms"
    />
    <div className="mb-8">
      <h1 className="mb-2 text-3xl font-bold">Terms of Use</h1>
      <p className="text-muted-foreground">The rules for using Dev Mapper, including what is and isn’t allowed.</p>
      <p className="mt-2 text-xs text-muted-foreground">Effective date: {TERMS_EFFECTIVE_DATE}</p>
    </div>
    <div className="space-y-4">
      {sections.map((s, i) => (
        <Card key={s.title}>
          <CardHeader>
            <CardTitle className="text-lg">{i + 1}. {s.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">{s.body}</CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default Terms;
