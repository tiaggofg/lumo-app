export const LUMO_CHART_PALETTE = [
  '#4F46E5', // Royal Indigo
  '#0284C7', // Sapphire Sky
  '#E11D48', // Coral Rose
  '#D97706', // Warm Amber
  '#7C3AED', // Vivid Violet
  '#0891B2', // Deep Cyan
  '#DB2777', // Magenta Pink
  '#EA580C', // Burnt Orange
  '#2563EB', // Cobalt Blue
  '#9333EA', // Amethyst Purple
] as const;

const LEGACY_GREEN_HEXES = new Set([
  '#10B981',
  '#22C55E',
  '#059669',
  '#16A34A',
  '#34D399',
  '#4ADE80',
]);

export function resolveChartColors(colors: readonly (string | null | undefined)[]): string[] {
  const used = new Set<string>();
  const result: string[] = [];
  let paletteIndex = 0;

  const pickNextUnusedPaletteColor = (): string => {
    for (let offset = 0; offset < LUMO_CHART_PALETTE.length; offset++) {
      const candidate =
        LUMO_CHART_PALETTE[(paletteIndex + offset) % LUMO_CHART_PALETTE.length];
      if (!used.has(candidate)) {
        paletteIndex = (paletteIndex + offset + 1) % LUMO_CHART_PALETTE.length;
        used.add(candidate);
        return candidate;
      }
    }
    const fallback = LUMO_CHART_PALETTE[paletteIndex % LUMO_CHART_PALETTE.length];
    paletteIndex = (paletteIndex + 1) % LUMO_CHART_PALETTE.length;
    return fallback;
  };

  for (const raw of colors) {
    const normalized = raw?.trim().toUpperCase() ?? '';
    const isValidHex = /^#[0-9A-F]{6}$/.test(normalized);
    if (!isValidHex || LEGACY_GREEN_HEXES.has(normalized) || used.has(normalized)) {
      result.push(pickNextUnusedPaletteColor());
    } else {
      used.add(normalized);
      result.push(normalized);
    }
  }

  return result;
}

export const resolveCategoryColors = resolveChartColors;
