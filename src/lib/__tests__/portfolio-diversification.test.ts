import { describe, it, expect } from 'vitest';
import { analyzePortfolioDiversification } from '@/lib/portfolio-diversification';

describe('analyzePortfolioDiversification', () => {
  it('flags an empty portfolio as low risk with a build-out suggestion', () => {
    const result = analyzePortfolioDiversification([]);
    expect(result.herfindahlIndex).toBe(0);
    expect(result.concentrationRisk).toBe('low');
    expect(result.dominantType).toBeNull();
    expect(result.suggestion).toMatch(/no holdings yet/i);
  });

  it('flags a single-project-type portfolio as high concentration risk', () => {
    const result = analyzePortfolioDiversification([
      { projectType: 'reforestation', quantity: 100, status: 'held' },
      { projectType: 'reforestation', quantity: 50, status: 'held' },
    ]);
    expect(result.herfindahlIndex).toBe(1);
    expect(result.concentrationRisk).toBe('high');
    expect(result.dominantType?.type).toBe('reforestation');
    expect(result.dominantType?.share).toBe(1);
    expect(result.suggestion).toMatch(/100% of this portfolio is concentrated in Reforestation/);
  });

  it('flags two equally-weighted types as high concentration risk (HHI = 0.5)', () => {
    const result = analyzePortfolioDiversification([
      { projectType: 'reforestation', quantity: 100, status: 'held' },
      { projectType: 'mangrove', quantity: 100, status: 'held' },
    ]);
    expect(result.herfindahlIndex).toBeCloseTo(0.5);
    expect(result.concentrationRisk).toBe('high');
  });

  it('flags four equally-weighted types as moderate concentration risk (HHI = 0.25)', () => {
    const result = analyzePortfolioDiversification([
      { projectType: 'reforestation', quantity: 25, status: 'held' },
      { projectType: 'mangrove', quantity: 25, status: 'held' },
      { projectType: 'cookstoves', quantity: 25, status: 'held' },
      { projectType: 'soil_carbon', quantity: 25, status: 'held' },
    ]);
    expect(result.herfindahlIndex).toBeCloseTo(0.25);
    expect(result.concentrationRisk).toBe('moderate');
  });

  it('flags seven equally-weighted types (the full universe) as low concentration risk', () => {
    const result = analyzePortfolioDiversification([
      { projectType: 'reforestation', quantity: 10, status: 'held' },
      { projectType: 'cookstoves', quantity: 10, status: 'held' },
      { projectType: 'renewable_energy', quantity: 10, status: 'held' },
      { projectType: 'waste_management', quantity: 10, status: 'held' },
      { projectType: 'mangrove', quantity: 10, status: 'held' },
      { projectType: 'soil_carbon', quantity: 10, status: 'held' },
      { projectType: 'other', quantity: 10, status: 'held' },
    ]);
    expect(result.concentrationRisk).toBe('low');
    expect(result.unrepresentedTypes).toEqual([]);
    expect(result.suggestion).toMatch(/well-diversified/i);
  });

  it('excludes sold holdings from the exposure calculation', () => {
    const result = analyzePortfolioDiversification([
      { projectType: 'reforestation', quantity: 1000, status: 'sold' },
      { projectType: 'mangrove', quantity: 10, status: 'held' },
    ]);
    expect(result.breakdown).toHaveLength(1);
    expect(result.breakdown[0].type).toBe('mangrove');
    expect(result.breakdown[0].share).toBe(1);
  });

  it('treats retired and transferred holdings as still contributing to exposure', () => {
    const result = analyzePortfolioDiversification([
      { projectType: 'reforestation', quantity: 50, status: 'retired' },
      { projectType: 'mangrove', quantity: 50, status: 'transferred' },
    ]);
    expect(result.breakdown.reduce((s, b) => s + b.tonnes, 0)).toBe(100);
  });

  it('defaults a null project type to "other"', () => {
    const result = analyzePortfolioDiversification([
      { projectType: null, quantity: 10, status: 'held' },
    ]);
    expect(result.breakdown[0].type).toBe('other');
    expect(result.breakdown[0].label).toBe('Other');
  });

  it('lists unrepresented project types for a partially diversified portfolio', () => {
    const result = analyzePortfolioDiversification([
      { projectType: 'reforestation', quantity: 10, status: 'held' },
    ]);
    expect(result.unrepresentedTypes).toEqual([
      'cookstoves', 'renewable_energy', 'waste_management', 'mangrove', 'soil_carbon', 'other',
    ]);
  });
});
