export interface SeedTeam { id: string; seed: number }

export function bracketPairs(teams: SeedTeam[]) {
  if (teams.length !== 16) throw Error('Exactly 16 teams required');
  const t = [...teams].sort((a, b) => a.seed - b.seed);
  return Array.from({ length: 8 }, (_, i) => [t[i], t[15 - i]]);
}

export const nextSlot = (matchNumber: number): [number, 'A' | 'B'] | null => ({
  1: [9, 'A'], 8: [9, 'B'], 2: [10, 'A'], 7: [10, 'B'],
  3: [11, 'A'], 6: [11, 'B'], 4: [12, 'A'], 5: [12, 'B'],
  9: [13, 'A'], 12: [13, 'B'], 10: [14, 'A'], 11: [14, 'B'],
  13: [15, 'A'], 14: [15, 'B'],
} as Record<number, [number, 'A' | 'B']>)[matchNumber] ?? null;
