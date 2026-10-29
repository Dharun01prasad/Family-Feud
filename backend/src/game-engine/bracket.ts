export interface SeedTeam { id: string; seed: number }
export interface OpeningResult { number: number; winnerId: string; winnerScore: number; winnerSeed: number }

export function bracketPairs(teams: SeedTeam[]) {
  if (teams.length !== 14) throw Error('Exactly 14 teams required');
  const t = [...teams].sort((a, b) => a.seed - b.seed);
  return Array.from({ length: 7 }, (_, i) => [t[i], t[13 - i]]);
}

export function openingAdvance(results: OpeningResult[]) {
  if (results.length !== 7 || new Set(results.map(r => r.number)).size !== 7 || results.some(r => r.number < 1 || r.number > 7)) throw Error('All seven opening matches must finish first');
  const bye = [...results].sort((a, b) => b.winnerScore - a.winnerScore || a.winnerSeed - b.winnerSeed || a.number - b.number)[0];
  const remaining = results.filter(r => r.number !== bye.number).sort((a, b) => a.number - b.number);
  return { bye, pairs: [[remaining[0], remaining[5]], [remaining[1], remaining[4]], [remaining[2], remaining[3]]] };
}

export const nextSlot = (matchNumber: number): [number, 'A' | 'B'] | null => ({ 8: [11, 'B'], 9: [12, 'A'], 10: [12, 'B'], 11: [13, 'A'], 12: [13, 'B'] } as Record<number, [number, 'A' | 'B']>)[matchNumber] ?? null;
