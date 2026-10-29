import { describe, expect, it } from 'vitest';
import { initialState, transition, type State } from '../src/game-engine/engine.js';
import { bracketPairs, nextSlot } from '../src/game-engine/bracket.js';

const context = { points: { 1: 35, 2: 25, 3: 15, 4: 10, 5: 7, 6: 5, 7: 3 }, teamAScore: 0, teamBScore: 0 };
const go = (state: State, action: { type: string; rank?: number; side?: 'A' | 'B' }) => transition(state, action, context).state;

describe('tournament engine', () => {
  it('creates the seeded eight-team bracket and advancement slots', () => {
    expect(bracketPairs(Array.from({ length: 8 }, (_, i) => ({ id: String(i + 1), seed: i + 1 }))).map(pair => pair.map(team => team.seed))).toEqual([[1, 8], [4, 5], [2, 7], [3, 6]]);
    expect(nextSlot(1)).toEqual([5, 'A']);
    expect(nextSlot(6)).toEqual([7, 'B']);
  });

  it('starts a manual face-off and clears a previously saved pause', () => {
    const state = go({ ...initialState, paused: true }, { type: 'START_ROUND' });
    expect(state.phase).toBe('FACE_OFF_FIRST_ANSWER');
    expect(state.paused).toBe(false);
  });

  it('reveals the spoken answer before assigning team control', () => {
    let state = go(initialState, { type: 'START_ROUND' });
    expect(() => go(state, { type: 'ASSIGN_CONTROL', side: 'A' })).toThrow();
    state = go(state, { type: 'REVEAL', rank: 1 });
    expect(state.roundPoints).toBe(35);
    expect(state.phase).toBe('PLAY_OR_PASS');
    state = go(state, { type: 'ASSIGN_CONTROL', side: 'B' });
    expect(state.phase).toBe('MAIN_GAMEPLAY');
    expect(state.controllingTeam).toBe('B');
  });

  it('allows two face-off answers before the host chooses the team', () => {
    let state = go(initialState, { type: 'START_ROUND' });
    state = go(state, { type: 'REVEAL', rank: 3 });
    expect(state.phase).toBe('FACE_OFF_SECOND_ANSWER');
    state = go(state, { type: 'REVEAL', rank: 2 });
    state = go(state, { type: 'ASSIGN_CONTROL', side: 'A' });
    expect(state.roundPoints).toBe(40);
    expect(state.controllingTeam).toBe('A');
  });

  it('accepts a reveal from a saved legacy buzzer phase', () => {
    const state = go({ ...initialState, phase: 'FACE_OFF_BUZZER' }, { type: 'REVEAL', rank: 3 });
    expect(state.phase).toBe('FACE_OFF_SECOND_ANSWER');
    expect(state.roundPoints).toBe(15);
  });

  it('prevents duplicate survey points and enters steal after three wrong answers', () => {
    let state: State = { ...initialState, phase: 'MAIN_GAMEPLAY', controllingTeam: 'A' };
    state = go(state, { type: 'REVEAL', rank: 1 });
    expect(() => go(state, { type: 'REVEAL', rank: 1 })).toThrow();
    state = go(go(go(state, { type: 'WRONG' }), { type: 'WRONG' }), { type: 'WRONG' });
    expect(state.phase).toBe('STEAL_ATTEMPT');
    expect(state.stealingTeam).toBe('B');
  });

  it('automatically awards the complete 92-point bank when a steal answer is revealed', () => {
    let state = go(initialState, { type: 'START_ROUND' });
    state = go(state, { type: 'REVEAL', rank: 3 });
    state = go(state, { type: 'REVEAL', rank: 2 });
    state = go(state, { type: 'ASSIGN_CONTROL', side: 'A' });
    state = go(state, { type: 'REVEAL', rank: 1 });
    state = go(state, { type: 'REVEAL', rank: 4 });
    state = go(go(go(state, { type: 'WRONG' }), { type: 'WRONG' }), { type: 'WRONG' });
    const result = transition(state, { type: 'REVEAL', rank: 5 }, context);
    expect(result.award).toEqual({ side: 'B', points: 92 });
    expect(result.state.phase).toBe('ROUND_COMPLETED');
    expect(result.state.revealedRanks).toContain(5);
    expect(() => transition(result.state, { type: 'REVEAL', rank: 6 }, context)).toThrow();
  });

  it('awards the existing bank to the original team when the steal is wrong', () => {
    let state: State = { ...initialState, phase: 'MAIN_GAMEPLAY', controllingTeam: 'A', revealedRanks: [1, 2], roundPoints: 60 };
    state = go(go(go(state, { type: 'WRONG' }), { type: 'WRONG' }), { type: 'WRONG' });
    expect(state.strikes).toBe(3);
    expect(state.phase).toBe('STEAL_ATTEMPT');
    const result = transition(state, { type: 'WRONG' }, context);
    expect(result.award).toEqual({ side: 'A', points: 60 });
    expect(result.state.roundPoints).toBe(60);
    expect(result.state.phase).toBe('ROUND_COMPLETED');
    expect(() => transition(result.state, { type: 'WRONG' }, context)).toThrow();
  });

  it('keeps the score fixed when reviewing the remaining answers', () => {
    const finished: State = { ...initialState, phase: 'ROUND_COMPLETED', roundPoints: 35, revealedRanks: [1] };
    expect(() => go(finished, { type: 'REVEAL', rank: 2 })).toThrow();
    const reviewed = go(go(finished, { type: 'REVIEW' }), { type: 'REVEAL', rank: 2 });
    expect(reviewed.roundPoints).toBe(35);
    expect(reviewed.revealedRanks).toEqual([1, 2]);
  });
});
