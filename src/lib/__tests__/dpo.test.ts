import { describe, expect, it } from 'vitest';
import { DPO_CLAUSE } from '../dpo';

// The clause is legal text supplied by the DPO and must stay verbatim.
const VERBATIM = `Data Protection Officer (DPO) Appointment & Contact
In compliance with the Nigeria Data Protection Act (NDPA), the Di Badili Leadership Sustainability Initiative (operating globally through its arms, the Di Badili Institute and the Become Change Institute) has appointed a designated Data Protection Officer to oversee our data privacy strategy, monitor compliance across all our platforms (including becomechange.institute, anda.becomechange.institute, craftframework.becomechange.institute, devmapper.africa, and abiolaoshunniyi.loveable.app), and serve as the primary point of contact for data subjects and regulatory authorities.
If you have any questions about this Privacy Policy, wish to exercise your data privacy rights (such as data access, correction, restriction, or deletion), or have a complaint regarding how we handle your personal information, please contact our DPO directly:
• Name of DPO: Abiola Oshunniyi
• Designation: Data Protection Officer (DPO)
• Mailing Address: P.O. 2550, Festac Town, Lagos, Nigeria.
• Official Contact Email: dpo@becomechange.institute
• Contact Phone Number: +2348188466444
Our DPO will review and respond to all valid requests, inquiries, or grievances within the statutory timelines provided under Nigerian data protection laws.`;

describe('DPO clause', () => {
  it('matches the approved wording exactly', () => {
    const rendered = [
      DPO_CLAUSE.heading,
      DPO_CLAUSE.intro,
      DPO_CLAUSE.lead,
      ...DPO_CLAUSE.details.map(([k, v]) => `• ${k}: ${v}`),
      DPO_CLAUSE.closing,
    ].join('\n');
    expect(rendered).toBe(VERBATIM);
  });
});
