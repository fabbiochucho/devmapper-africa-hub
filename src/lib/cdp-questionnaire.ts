/**
 * CDP Climate Change Questionnaire auto-fill mapping.
 *
 * CDP's questionnaire section codes (C1 Governance, C4 Targets, C6
 * Emissions Data, C8 Energy, etc.) have been stable across annual
 * questionnaire cycles and are documented in CDP's publicly released
 * questionnaire each year. The specific question codes below (C6.1/C6.3/
 * C6.5 for Scope 1/2/3, C4.1 for target status, C8.2 for renewable energy)
 * reflect that stable structure at reasonable confidence, but CDP does
 * revise question numbering between cycles - cross-check against the
 * current year's published questionnaire before submitting a real
 * response built from this mapping.
 */

export type CdpSection = 'governance' | 'targets' | 'emissions_data' | 'energy' | 'verification';

export interface CdpQuestion {
  code: string;
  section: CdpSection;
  sectionLabel: string;
  question: string;
}

export const CDP_QUESTIONS: CdpQuestion[] = [
  { code: 'C1.1', section: 'governance', sectionLabel: 'Governance', question: 'Is there board-level oversight of climate-related issues within your organization?' },
  { code: 'C4.1', section: 'targets', sectionLabel: 'Targets and Performance', question: 'Did you have an emissions target that was active in the reporting year?' },
  { code: 'C6.1', section: 'emissions_data', sectionLabel: 'Emissions Data', question: "What was your organization's gross global Scope 1 emissions in metric tons CO2e?" },
  { code: 'C6.3', section: 'emissions_data', sectionLabel: 'Emissions Data', question: "What was your organization's gross global Scope 2 emissions in metric tons CO2e?" },
  { code: 'C6.5', section: 'emissions_data', sectionLabel: 'Emissions Data', question: "Account for your organization's gross global Scope 3 emissions." },
  { code: 'C8.2', section: 'energy', sectionLabel: 'Energy', question: 'What percentage of your total energy consumption was from renewable sources in the reporting year?' },
  { code: 'C10.1', section: 'verification', sectionLabel: 'Verification', question: 'Did you have your Scope 1 and/or Scope 2 emissions verified/assured by a third party?' },
];

export interface CdpAutoFillInput {
  scope1Tonnes: number | null;
  scope2Tonnes: number | null;
  scope3Tonnes: number | null;
  renewableEnergyPercentage: number | null;
  hasActiveTarget: boolean;
  verificationStatus: string | null;
}

export interface CdpAutoFillResponse {
  code: string;
  response: Record<string, unknown> | null;
  autoFilled: boolean;
}

/** Maps already-collected ESG indicator data onto the corresponding CDP question codes. */
export function autoFillCdpResponses(input: CdpAutoFillInput): CdpAutoFillResponse[] {
  return [
    {
      code: 'C4.1',
      response: { answer: input.hasActiveTarget ? 'Yes' : 'No' },
      autoFilled: true,
    },
    {
      code: 'C6.1',
      response: input.scope1Tonnes != null ? { value: input.scope1Tonnes, unit: 'metric tons CO2e' } : null,
      autoFilled: input.scope1Tonnes != null,
    },
    {
      code: 'C6.3',
      response: input.scope2Tonnes != null ? { value: input.scope2Tonnes, unit: 'metric tons CO2e' } : null,
      autoFilled: input.scope2Tonnes != null,
    },
    {
      code: 'C6.5',
      response: input.scope3Tonnes != null ? { value: input.scope3Tonnes, unit: 'metric tons CO2e' } : null,
      autoFilled: input.scope3Tonnes != null,
    },
    {
      code: 'C8.2',
      response: input.renewableEnergyPercentage != null ? { percentage: input.renewableEnergyPercentage } : null,
      autoFilled: input.renewableEnergyPercentage != null,
    },
    {
      code: 'C10.1',
      response: input.verificationStatus ? { answer: input.verificationStatus === 'verified' ? 'Yes' : 'No', status: input.verificationStatus } : null,
      autoFilled: !!input.verificationStatus,
    },
  ];
}

export interface CdpReadiness {
  answered: number;
  total: number;
  percentage: number;
  missingCodes: string[];
}

export function computeCdpReadiness(responses: CdpAutoFillResponse[]): CdpReadiness {
  const answered = responses.filter((r) => r.autoFilled).length;
  const total = responses.length;
  return {
    answered,
    total,
    percentage: total > 0 ? Math.round((answered / total) * 100) : 0,
    missingCodes: responses.filter((r) => !r.autoFilled).map((r) => r.code),
  };
}
