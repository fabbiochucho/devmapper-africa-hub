import { describe, it, expect } from 'vitest';
import { validateSatelliteReading } from '@/lib/satellite-validation';

describe('validateSatelliteReading', () => {
  it('reports no_data when there is no NDVI reading', () => {
    const result = validateSatelliteReading({ sdgGoal: 15, ndviValue: null });
    expect(result.verdict).toBe('no_data');
  });

  it('reports not_applicable for SDG goals with no vegetation relevance', () => {
    const result = validateSatelliteReading({ sdgGoal: 9, ndviValue: 0.05 });
    expect(result.verdict).toBe('not_applicable');
  });

  it('reports not_applicable when sdgGoal is null even with a reading present', () => {
    const result = validateSatelliteReading({ sdgGoal: null, ndviValue: 0.4 });
    expect(result.verdict).toBe('not_applicable');
  });

  it('flags a possible mismatch for bare/built-up land on a vegetation-relevant SDG goal', () => {
    const result = validateSatelliteReading({ sdgGoal: 15, ndviValue: 0.05 });
    expect(result.verdict).toBe('possible_mismatch');
    expect(result.message).toContain('0.050');
  });

  it('reports consistent for healthy vegetation on a vegetation-relevant SDG goal', () => {
    const result = validateSatelliteReading({ sdgGoal: 13, ndviValue: 0.42 });
    expect(result.verdict).toBe('consistent');
  });

  it.each([2, 6, 13, 14, 15])('treats SDG %i as vegetation-relevant', (goal) => {
    const result = validateSatelliteReading({ sdgGoal: goal, ndviValue: 0.5 });
    expect(result.verdict).toBe('consistent');
  });

  it('treats the bare-land threshold boundary as consistent (not below threshold)', () => {
    const result = validateSatelliteReading({ sdgGoal: 15, ndviValue: 0.1 });
    expect(result.verdict).toBe('consistent');
  });
});
