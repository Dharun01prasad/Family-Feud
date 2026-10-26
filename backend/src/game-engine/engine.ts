export type Phase='NOT_STARTED'|'ROUND_READY'|'FACE_OFF_BUZZER'|'FACE_OFF_FIRST_ANSWER'|'FACE_OFF_SECOND_ANSWER'|'PLAY_OR_PASS'|'MAIN_GAMEPLAY'|'STEAL_ATTEMPT'|'ROUND_COMPLETED'|'ANSWER_REVIEW'|'MATCH_COMPLETED';
export type Side='A'|'B';
export interface State { roundNumber:number; phase:Phase; buzzerWinner:Side|null; firstFaceoffTeam:Side|null; firstFaceoffRank:number|null; faceoffWinner:Side|null; controllingTeam:Side|null; stealingTeam:Side|null; strikes:number; revealedRanks:number[]; roundPoints:number; paused:boolean }
export interface Context { points:Record<number,number>; teamAScore:number; teamBScore:number }
export type Action={type:string; side?:Side; rank?:number};
export const initialState:State={roundNumber:1,phase:'NOT_STARTED',buzzerWinner:null,firstFaceoffTeam:null,firstFaceoffRank:null,faceoffWinner:null,controllingTeam:null,stealingTeam:null,strikes:0,revealedRanks:[],roundPoints:0,paused:false};
const other=(s:Side):Side=>s==='A'?'B':'A';
export function transition(s:State,a:Action,c:Context):{state:State;award?:{side:Side;points:number}}{
  if(s.paused&&a.type!=='TOGGLE_PAUSE') throw Error('Game is paused');
  const n:State=structuredClone(s);
  if(a.type==='TOGGLE_PAUSE'){n.paused=!n.paused;return{state:n}}
  if(a.type==='START_ROUND'&&(s.phase==='NOT_STARTED'||s.phase==='ROUND_READY')){n.phase='FACE_OFF_BUZZER';return{state:n}}
  if(a.type==='BUZZ'&&s.phase==='FACE_OFF_BUZZER'&&a.side){n.buzzerWinner=a.side;n.firstFaceoffTeam=a.side;n.phase='FACE_OFF_FIRST_ANSWER';return{state:n}}
  if(a.type==='RESET_BUZZER'&&['FACE_OFF_BUZZER','FACE_OFF_FIRST_ANSWER','FACE_OFF_SECOND_ANSWER'].includes(s.phase)){n.buzzerWinner=null;n.firstFaceoffTeam=null;n.firstFaceoffRank=null;n.phase='FACE_OFF_BUZZER';return{state:n}}
  if(a.type==='REVEAL'&&a.rank){
    if(s.revealedRanks.includes(a.rank))throw Error('Answer already revealed');
    if(!c.points[a.rank])throw Error('Invalid answer rank');
    if(!['FACE_OFF_FIRST_ANSWER','FACE_OFF_SECOND_ANSWER','MAIN_GAMEPLAY','STEAL_ATTEMPT','ROUND_COMPLETED','ANSWER_REVIEW'].includes(s.phase))throw Error('Answer cannot be revealed now');
    n.revealedRanks.push(a.rank); n.roundPoints+=c.points[a.rank];
    if(s.phase==='FACE_OFF_FIRST_ANSWER'){
      n.firstFaceoffRank=a.rank;
      if(a.rank===1){n.faceoffWinner=s.firstFaceoffTeam;n.phase='PLAY_OR_PASS'} else n.phase='FACE_OFF_SECOND_ANSWER';
    } else if(s.phase==='FACE_OFF_SECOND_ANSWER'){
      const second=other(s.firstFaceoffTeam!); n.faceoffWinner=a.rank<(s.firstFaceoffRank??99)?second:s.firstFaceoffTeam; n.phase='PLAY_OR_PASS';
    } else if(s.phase==='MAIN_GAMEPLAY'&&n.revealedRanks.length===7){n.phase='ROUND_COMPLETED';return{state:n,award:{side:s.controllingTeam!,points:n.roundPoints}}}
    return{state:n};
  }
  if(a.type==='WRONG'){
    if(s.phase==='FACE_OFF_FIRST_ANSWER'){n.firstFaceoffRank=99;n.phase='FACE_OFF_SECOND_ANSWER';return{state:n}}
    if(s.phase==='FACE_OFF_SECOND_ANSWER'){n.faceoffWinner=s.firstFaceoffRank===99?other(s.firstFaceoffTeam!):s.firstFaceoffTeam;n.phase='PLAY_OR_PASS';return{state:n}}
    if(s.phase==='MAIN_GAMEPLAY'){n.strikes++;if(n.strikes>=3){n.phase='STEAL_ATTEMPT';n.stealingTeam=other(s.controllingTeam!)}return{state:n}}
    throw Error('A strike is not valid now');
  }
  if((a.type==='PLAY'||a.type==='PASS')&&s.phase==='PLAY_OR_PASS'){
    n.controllingTeam=a.type==='PLAY'?s.faceoffWinner:other(s.faceoffWinner!);n.phase='MAIN_GAMEPLAY';return{state:n};
  }
  if(a.type==='ASSIGN_CONTROL'&&a.side){n.controllingTeam=a.side;n.phase='MAIN_GAMEPLAY';return{state:n}}
  if(a.type==='START_STEAL'&&s.phase==='MAIN_GAMEPLAY'){n.stealingTeam=other(s.controllingTeam!);n.phase='STEAL_ATTEMPT';return{state:n}}
  if(a.type==='STEAL_SUCCESS'&&s.phase==='STEAL_ATTEMPT'){n.phase='ROUND_COMPLETED';return{state:n,award:{side:s.stealingTeam!,points:s.roundPoints}}}
  if(a.type==='STEAL_FAIL'&&s.phase==='STEAL_ATTEMPT'){n.phase='ROUND_COMPLETED';return{state:n,award:{side:s.controllingTeam!,points:s.roundPoints}}}
  if(a.type==='AWARD'&&s.phase==='MAIN_GAMEPLAY'&&s.controllingTeam){n.phase='ROUND_COMPLETED';return{state:n,award:{side:s.controllingTeam,points:s.roundPoints}}}
  if(a.type==='REVIEW'&&s.phase==='ROUND_COMPLETED'){n.phase='ANSWER_REVIEW';return{state:n}}
  throw Error(`Invalid ${a.type} during ${s.phase}`);
}
