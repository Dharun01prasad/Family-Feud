import {describe,it,expect} from 'vitest';import {initialState,transition,type State} from '../src/game-engine/engine.js';import {bracketPairs,nextSlot} from '../src/game-engine/bracket.js';
const ctx={points:{1:35,2:25,3:15,4:10,5:7,6:5,7:3},teamAScore:0,teamBScore:0};
const go=(s:State,a:any)=>transition(s,a,ctx).state;
describe('tournament engine',()=>{
 it('generates seeded eight-team bracket',()=>expect(bracketPairs(Array.from({length:8},(_,i)=>({id:String(i+1),seed:i+1}))).map(x=>x.map(y=>y.seed))).toEqual([[1,8],[4,5],[2,7],[3,6]]));
 it('maps semifinal and final advancement',()=>{expect(nextSlot(1)).toEqual([5,'A']);expect(nextSlot(6)).toEqual([7,'B'])});
 it('locks first buzzer',()=>{let s=go(initialState,{type:'START_ROUND'});s=go(s,{type:'BUZZ',side:'A'});expect(()=>go(s,{type:'BUZZ',side:'B'})).toThrow()});
 it('rank one wins faceoff immediately',()=>{let s=go(go(go(initialState,{type:'START_ROUND'}),{type:'BUZZ',side:'A'}),{type:'REVEAL',rank:1});expect(s.phase).toBe('PLAY_OR_PASS');expect(s.faceoffWinner).toBe('A')});
 it('higher second answer wins and can pass',()=>{let s=go(go(go(initialState,{type:'START_ROUND'}),{type:'BUZZ',side:'A'}),{type:'REVEAL',rank:3});s=go(s,{type:'REVEAL',rank:2});s=go(s,{type:'PASS'});expect(s.controllingTeam).toBe('A');expect(s.roundPoints).toBe(40)});
 it('prevents duplicate answer points',()=>{let s:State={...initialState,phase:'MAIN_GAMEPLAY',controllingTeam:'A'};s=go(s,{type:'REVEAL',rank:1});expect(()=>go(s,{type:'REVEAL',rank:1})).toThrow()});
 it('enters steal after three strikes',()=>{let s:State={...initialState,phase:'MAIN_GAMEPLAY',controllingTeam:'A'};s=go(go(go(s,{type:'WRONG'}),{type:'WRONG'}),{type:'WRONG'});expect(s.phase).toBe('STEAL_ATTEMPT');expect(s.stealingTeam).toBe('B')});
 it('passes required 92 point steal scenario',()=>{let s=go(initialState,{type:'START_ROUND'});s=go(s,{type:'BUZZ',side:'A'});s=go(s,{type:'REVEAL',rank:3});s=go(s,{type:'REVEAL',rank:2});s=go(s,{type:'PASS'});s=go(s,{type:'REVEAL',rank:1});s=go(s,{type:'REVEAL',rank:4});s=go(go(go(s,{type:'WRONG'}),{type:'WRONG'}),{type:'WRONG'});s=go(s,{type:'REVEAL',rank:5});const result=transition(s,{type:'STEAL_SUCCESS'},ctx);expect(result.award).toEqual({side:'B',points:92});expect(result.state.phase).toBe('ROUND_COMPLETED')});
});
