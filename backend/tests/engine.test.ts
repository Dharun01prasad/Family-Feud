import { describe, expect, it } from 'vitest';
import { initialState, transition, type State } from '../src/game-engine/engine.js';
import { bracketPairs, nextSlot } from '../src/game-engine/bracket.js';
import { questionBank, validateQuestionBank } from '../prisma/question-bank.js';

const context = { points: { 1: 35, 2: 25, 3: 15, 4: 10, 5: 7, 6: 5, 7: 3 }, answerCount: 7, teamAScore: 0, teamBScore: 0 };
const go = (state: State, action: { type: string; rank?: number; side?: 'A' | 'B' }) => transition(state, action, context).state;

describe('tournament engine', () => {
  it('creates a complete 16-team knockout bracket without a bye', () => {
    expect(bracketPairs(Array.from({ length: 16 }, (_, i) => ({ id: String(i + 1), seed: i + 1 }))).map(pair => pair.map(team => team.seed))).toEqual([[1, 16], [2, 15], [3, 14], [4, 13], [5, 12], [6, 11], [7, 10], [8, 9]]);
    expect(Array.from({ length: 14 }, (_, i) => nextSlot(i + 1))).toEqual([
      [9, 'A'], [10, 'A'], [11, 'A'], [12, 'A'], [12, 'B'], [11, 'B'], [10, 'B'], [9, 'B'],
      [13, 'A'], [14, 'A'], [14, 'B'], [13, 'B'], [15, 'A'], [15, 'B'],
    ]);
    expect(nextSlot(15)).toBeNull();
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

  it('allows unlimited face-off strikes and resets them when control is assigned', () => {
    let state = go(initialState, { type: 'START_ROUND' });
    for (let i = 0; i < 5; i++) state = go(state, { type: 'WRONG' });
    expect(state.phase).toBe('FACE_OFF_FIRST_ANSWER');
    expect(state.strikes).toBe(5);
    expect(() => go(state, { type: 'ASSIGN_CONTROL', side: 'A' })).toThrow();
    state = go(state, { type: 'REVEAL', rank: 2 });
    state = go(state, { type: 'WRONG' });
    expect(state.strikes).toBe(6);
    state = go(state, { type: 'ASSIGN_CONTROL', side: 'A' });
    expect(state.strikes).toBe(0);
    expect(go(state, { type: 'WRONG' }).phase).toBe('MAIN_GAMEPLAY');
    expect(go(go(state, { type: 'WRONG' }), { type: 'WRONG' }).phase).toBe('STEAL_ATTEMPT');
  });

  it('accepts a reveal from a saved legacy buzzer phase', () => {
    const state = go({ ...initialState, phase: 'FACE_OFF_BUZZER' }, { type: 'REVEAL', rank: 3 });
    expect(state.phase).toBe('FACE_OFF_SECOND_ANSWER');
    expect(state.roundPoints).toBe(15);
  });

  it('prevents duplicate survey points and enters steal after two wrong answers', () => {
    let state: State = { ...initialState, phase: 'MAIN_GAMEPLAY', controllingTeam: 'A' };
    state = go(state, { type: 'REVEAL', rank: 1 });
    expect(() => go(state, { type: 'REVEAL', rank: 1 })).toThrow();
    state = go(go(state, { type: 'WRONG' }), { type: 'WRONG' });
    expect(state.phase).toBe('STEAL_ATTEMPT');
    expect(state.stealingTeam).toBe('B');
  });

  it('locks the winning face-off answer when passing and leaves the other answer in the pot', () => {
    let state = go(initialState, { type: 'START_ROUND' });
    state = go(state, { type: 'REVEAL', rank: 3 });
    state = go(state, { type: 'REVEAL', rank: 2 });
    state = go(state, { type: 'ASSIGN_CONTROL', side: 'A' });
    expect(state.passAvailable).toBe(true);
    const passed = transition(state, { type: 'PASS' }, context);
    expect(passed.credit).toEqual({ side: 'A', points: 25 });
    expect(passed.state.controllingTeam).toBe('B');
    expect(passed.state.roundPoints).toBe(15);
    expect(passed.state.passAvailable).toBe(false);
    expect(() => go(passed.state, { type: 'PASS' })).toThrow();
  });

  it('keeps locked pass points separate from the remaining pot on either steal outcome', () => {
    let state = go(initialState, { type: 'START_ROUND' });
    state = go(state, { type: 'REVEAL', rank: 1 });
    state = go(state, { type: 'ASSIGN_CONTROL', side: 'A' });
    const passed = transition(state, { type: 'PASS' }, context);
    expect(passed.credit).toEqual({ side: 'A', points: 35 });
    state = go(passed.state, { type: 'REVEAL', rank: 2 });
    expect(state.roundPoints).toBe(25);
    state = go(go(state, { type: 'WRONG' }), { type: 'WRONG' });
    expect(state.stealingTeam).toBe('A');
    expect(transition(state, { type: 'WRONG' }, context).award).toEqual({ side: 'B', points: 25 });
    expect(transition(state, { type: 'REVEAL', rank: 3 }, context).award).toEqual({ side: 'A', points: 40 });
  });

  it('only offers pass before the team starts playing the board', () => {
    let state = go(initialState, { type: 'START_ROUND' });
    state = go(state, { type: 'REVEAL', rank: 1 });
    state = go(state, { type: 'ASSIGN_CONTROL', side: 'B' });
    state = go(state, { type: 'REVEAL', rank: 2 });
    expect(state.passAvailable).toBe(false);
    expect(() => go(state, { type: 'PASS' })).toThrow();
  });

  it('automatically awards the complete 92-point bank when a steal answer is revealed', () => {
    let state = go(initialState, { type: 'START_ROUND' });
    state = go(state, { type: 'REVEAL', rank: 3 });
    state = go(state, { type: 'REVEAL', rank: 2 });
    state = go(state, { type: 'ASSIGN_CONTROL', side: 'A' });
    state = go(state, { type: 'REVEAL', rank: 1 });
    state = go(state, { type: 'REVEAL', rank: 4 });
    state = go(go(state, { type: 'WRONG' }), { type: 'WRONG' });
    const result = transition(state, { type: 'REVEAL', rank: 5 }, context);
    expect(result.award).toEqual({ side: 'B', points: 92 });
    expect(result.state.phase).toBe('ROUND_COMPLETED');
    expect(result.state.revealedRanks).toContain(5);
    expect(() => transition(result.state, { type: 'REVEAL', rank: 6 }, context)).toThrow();
  });

  it('awards the existing bank to the original team when the steal is wrong', () => {
    let state: State = { ...initialState, phase: 'MAIN_GAMEPLAY', controllingTeam: 'A', revealedRanks: [1, 2], roundPoints: 60 };
    state = go(go(state, { type: 'WRONG' }), { type: 'WRONG' });
    expect(state.strikes).toBe(2);
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

  it('shows every remaining answer after a round or tied match without awarding points', () => {
    for (const phase of ['ROUND_COMPLETED', 'MATCH_TIED', 'MATCH_COMPLETED'] as const) {
      const state: State = { ...initialState, phase, roundPoints: 35, revealedRanks: [1] };
      const result = transition(state, { type: 'REVIEW_ALL' }, context);
      expect(result.state.revealedRanks).toEqual([1, 2, 3, 4, 5, 6, 7]);
      expect(result.state.phase).toBe(phase === 'ROUND_COMPLETED' ? 'ANSWER_REVIEW' : phase);
      expect(result.state.roundPoints).toBe(35);
      expect(result.award).toBeUndefined();
    }
  });

  it('finishes a board after its actual fifth or sixth answer', () => {
    for (const answerCount of [5, 6]) {
      const points = Object.fromEntries(Array.from({ length: answerCount }, (_, i) => [i + 1, 20]));
      const ctx = { points, answerCount, teamAScore: 0, teamBScore: 0 };
      let state: State = { ...initialState, phase: 'MAIN_GAMEPLAY', controllingTeam: 'A' };
      for (let rank = 1; rank < answerCount; rank++) {
        state = transition(state, { type: 'REVEAL', rank }, ctx).state;
        expect(state.phase).toBe('MAIN_GAMEPLAY');
      }
      const finished = transition(state, { type: 'REVEAL', rank: answerCount }, ctx);
      expect(finished.state.phase).toBe('ROUND_COMPLETED');
      expect(finished.award).toEqual({ side: 'A', points: answerCount * 20 });
    }
  });

  it('transcribes every numbered PDF entry with its five ranked point values', () => {
    expect(() => validateQuestionBank()).not.toThrow();
    expect(questionBank.map(question => question.number)).toEqual([...Array.from({ length: 33 }, (_, i) => i + 1), 35, 36, 37]);
    expect(questionBank.every(question => question.answers.length === 5)).toBe(true);
  });
});
