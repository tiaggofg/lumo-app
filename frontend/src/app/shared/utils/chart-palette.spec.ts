import { LUMO_CHART_PALETTE, resolveCategoryColors, resolveChartColors } from './chart-palette';

describe('chart-palette', () => {
  it('should define the 10 curated non-green categorical hex colors', () => {
    expect(LUMO_CHART_PALETTE).toEqual([
      '#4F46E5',
      '#0284C7',
      '#E11D48',
      '#D97706',
      '#7C3AED',
      '#0891B2',
      '#DB2777',
      '#EA580C',
      '#2563EB',
      '#9333EA',
    ]);
  });

  it('should replace legacy green hexes (#10B981, #22C55E) with distinct non-green palette colors', () => {
    const resolved = resolveChartColors(['#10B981', '#22c55e', '#059669', '#16A34A']);
    expect(resolved).toHaveLength(4);
    expect(new Set(resolved).size).toBe(4);
    expect(resolved).not.toContain('#10B981');
    expect(resolved).not.toContain('#22C55E');
    expect(resolved).not.toContain('#059669');
    expect(resolved).not.toContain('#16A34A');
  });

  it('should assign distinct colors when inputs are null, undefined or duplicate (#6366F1)', () => {
    const resolved = resolveChartColors([null, undefined, '#6366F1', '#6366F1', '#6366f1']);
    expect(resolved).toHaveLength(5);
    expect(new Set(resolved).size).toBe(5);
  });

  it('should preserve valid non-green distinct colors and expose resolveCategoryColors alias', () => {
    const resolved = resolveCategoryColors(['#4F46E5', '#0284C7', null]);
    expect(resolved[0]).toBe('#4F46E5');
    expect(resolved[1]).toBe('#0284C7');
    expect(resolved[2]).toBe('#E11D48');
  });
});
