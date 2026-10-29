export type Phase='NOT_STARTED'|'ROUND_READY'|'FACE_OFF_BUZZER'|'FACE_OFF_FIRST_ANSWER'|'FACE_OFF_SECOND_ANSWER'|'PLAY_OR_PASS'|'MAIN_GAMEPLAY'|'STEAL_ATTEMPT'|'ROUND_COMPLETED'|'ANSWER_REVIEW'|'MATCH_COMPLETED';
export type Side='A'|'B';
export interface State { roundNumber:number; phase:Phase; buzzerWinner:Side|null; firstFaceoffTeam:Side|null; firstFaceoffRank:number|null; faceoffWinner:Side|null; controllingTeam:Side|null; stealingTeam:Side|null; strikes:number; revealedRanks:number[]; roundPoints:number; passAvailable:boolean; paused:boolean }
export interface Context { points:Record<number,number>; teamAScore:number; teamBScore:number }
export type Action={type:string; side?:Side; rank?:number};
export const initialState:State={roundNumber:1,phase:'NOT_STARTED',buzzerWinner:null,firstFaceoffTeam:null,firstFaceoffRank:null,faceoffWinner:null,controllingTeam:null,stealingTeam:null,strikes:0,revealedRanks:[],roundPoints:0,passAvailable:false,paused:false};
const other=(s:Side):Side=>s==='A'?'B':'A';
export function transition(s:State,a:Action,c:Context):{state:State;award?:{side:Side;points:number};credit?:{side:Side;points:number}}{
  if(s.paused&&a.type!=='TOGGLE_PAUSE'&&!(a.type==='START_ROUND'&&(s.phase==='NOT_STARTED'||s.phase==='ROUND_READY'))) throw Error('Game is paused');
  const n:State=structuredClone(s);
  if(a.type==='TOGGLE_PAUSE'){n.paused=!n.paused;return{state:n}}
  if(a.type==='START_ROUND'&&(s.phase==='NOT_STARTED'||s.phase==='ROUND_READY')){n.paused=false;n.phase='FACE_OFF_FIRST_ANSWER';return{state:n}}
  if(a.type==='BUZZ'&&s.phase==='FACE_OFF_BUZZER'&&a.side){n.buzzerWinner=a.side;n.firstFaceoffTeam=a.side;n.phase='FACE_OFF_FIRST_ANSWER';return{state:n}}
  if(a.type==='RESET_BUZZER'&&['FACE_OFF_BUZZER','FACE_OFF_FIRST_ANSWER','FACE_OFF_SECOND_ANSWER'].includes(s.phase)){n.buzzerWinner=null;n.firstFaceoffTeam=null;n.firstFaceoffRank=null;n.phase='FACE_OFF_BUZZER';return{state:n}}
  if(a.type==='REVEAL'&&a.rank){
    if(s.revealedRanks.includes(a.rank))throw Error('Answer already revealed');
    if(c.points[a.rank]===undefined)throw Error('Invalid answer rank');
    if(!['FACE_OFF_BUZZER','FACE_OFF_FIRST_ANSWER','FACE_OFF_SECOND_ANSWER','PLAY_OR_PASS','MAIN_GAMEPLAY','STEAL_ATTEMPT','ANSWER_REVIEW'].includes(s.phase))throw Error('Answer cannot be revealed now');
    n.revealedRanks.push(a.rank);
    if(s.phase==='MAIN_GAMEPLAY')n.passAvailable=false;
    if(s.phase==='ANSWER_REVIEW')return{state:n};
    n.roundPoints+=c.points[a.rank];
    if(s.phase==='FACE_OFF_BUZZER'||s.phase==='FACE_OFF_FIRST_ANSWER'){
      n.firstFaceoffRank=a.rank;
      n.phase=a.rank===1?'PLAY_OR_PASS':'FACE_OFF_SECOND_ANSWER';
    } else if(s.phase==='FACE_OFF_SECOND_ANSWER'){
      n.phase='PLAY_OR_PASS';
    } else if(s.phase==='STEAL_ATTEMPT'){
      n.phase='ROUND_COMPLETED';
      return{state:n,award:{side:s.stealingTeam!,points:n.roundPoints}};
    } else if(s.phase==='MAIN_GAMEPLAY'&&n.revealedRanks.length===7){n.phase='ROUND_COMPLETED';return{state:n,award:{side:s.controllingTeam!,points:n.roundPoints}}}
    return{state:n};
  }
  if(a.type==='WRONG'){
    if(['FACE_OFF_BUZZER','FACE_OFF_FIRST_ANSWER','FACE_OFF_SECOND_ANSWER','PLAY_OR_PASS'].includes(s.phase)){n.strikes++;return{state:n}}
    if(s.phase==='MAIN_GAMEPLAY'){n.passAvailable=false;n.strikes++;if(n.strikes>=2){n.phase='STEAL_ATTEMPT';n.stealingTeam=other(s.controllingTeam!)}return{state:n}}
    if(s.phase==='STEAL_ATTEMPT'){n.phase='ROUND_COMPLETED';return{state:n,award:{side:s.controllingTeam!,points:s.roundPoints}}}
    throw Error('A strike is not valid now');
  }
  if(a.type==='PLAY'&&s.phase==='PLAY_OR_PASS'&&s.faceoffWinner){n.controllingTeam=s.faceoffWinner;n.phase='MAIN_GAMEPLAY';return{state:n}}
  if(a.type==='ASSIGN_CONTROL'&&a.side&&['FACE_OFF_BUZZER','FACE_OFF_FIRST_ANSWER','FACE_OFF_SECOND_ANSWER','PLAY_OR_PASS'].includes(s.phase)){
    if(s.revealedRanks.length===0)throw Error('Reveal an answer before assigning control');
    n.faceoffWinner=a.side;n.controllingTeam=a.side;n.strikes=0;n.passAvailable=true;n.phase='MAIN_GAMEPLAY';return{state:n};
  }
  if(a.type==='PASS'&&s.phase==='MAIN_GAMEPLAY'&&s.passAvailable&&s.faceoffWinner&&s.controllingTeam===s.faceoffWinner){
    const winningRank=Math.min(...s.revealedRanks);
    const lockedPoints=c.points[winningRank];
    if(!Number.isFinite(lockedPoints))throw Error('No winning face-off answer to lock in');
    n.roundPoints-=lockedPoints;
    n.controllingTeam=other(s.faceoffWinner);
    n.passAvailable=false;
    return{state:n,credit:{side:s.faceoffWinner,points:lockedPoints}};
  }
  if(a.type==='START_STEAL'&&s.phase==='MAIN_GAMEPLAY'){n.stealingTeam=other(s.controllingTeam!);n.phase='STEAL_ATTEMPT';return{state:n}}
  if(a.type==='AWARD'&&s.phase==='MAIN_GAMEPLAY'&&s.controllingTeam){n.phase='ROUND_COMPLETED';return{state:n,award:{side:s.controllingTeam,points:s.roundPoints}}}
  if(a.type==='REVIEW'&&s.phase==='ROUND_COMPLETED'){n.phase='ANSWER_REVIEW';return{state:n}}
  throw Error(`Invalid ${a.type} during ${s.phase}`);
}
