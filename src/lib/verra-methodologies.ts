/**
 * Static Verra/Gold Standard methodology registry - data only, no
 * computation. Scaffold for Phase 2 mapping between DevMapper project types
 * and real carbon-standard methodologies.
 */

export interface VerraMethodology {
  projectType: string;
  methodologyCode: string;
  description: string;
  sourceUrl: string;
}

export const VERRA_METHODOLOGIES: VerraMethodology[] = [
  {
    projectType: 'reforestation',
    methodologyCode: 'VM0047',
    description: 'Afforestation, Reforestation, and Revegetation',
    sourceUrl: 'https://verra.org/methodologies/vm0047',
  },
  {
    projectType: 'cookstoves',
    methodologyCode: 'VMR0006',
    description: 'Energy Efficiency and Fuel Switch Measures in Thermal Applications',
    sourceUrl: 'https://verra.org/methodologies/',
  },
  {
    projectType: 'mangrove',
    methodologyCode: 'VM0033',
    description: 'Methodology for Tidal Wetland and Seagrass Restoration',
    sourceUrl: 'https://verra.org/methodologies/vm0033',
  },
  {
    projectType: 'renewable_energy',
    methodologyCode: 'VM0018',
    description: 'Energy Efficiency and Renewable Energy Measures',
    sourceUrl: 'https://verra.org/methodologies/',
  },
  {
    projectType: 'soil_carbon',
    methodologyCode: 'VM0042',
    description: 'Methodology for Improved Agricultural Land Management',
    sourceUrl: 'https://verra.org/methodologies/vm0042',
  },
];

export function findMethodologyForProjectType(projectType: string): VerraMethodology | undefined {
  return VERRA_METHODOLOGIES.find((m) => m.projectType === projectType);
}
