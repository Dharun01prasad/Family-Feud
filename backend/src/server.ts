import 'dotenv/config';
import express from 'express'; import cors from 'cors'; import {createServer} from 'node:http'; import {Server} from 'socket.io'; import {PrismaClient} from '@prisma/client';
import {initialState,transition,type State,type Side} from './game-engine/engine.js';
import {openingAdvance,nextSlot} from './game-engine/bracket.js';
const prisma=new PrismaClient(); const app=express(); app.use(cors({origin:true})); app.use(express.json({limit:'2mb'}));
const http=createServer(app); const io=new Server(http,{cors:{origin:true}}); const token=process.env.HOST_TOKEN||'college-feud-host';
const auth=(req:any,res:any,next:any)=>req.headers.authorization===`Bearer ${token}`?next():res.status(401).json({error:'Host authorization required'});
const parse=(g:any):State=>({roundNumber:g.roundNumber,phase:g.phase,buzzerWinner:g.buzzerWinner,firstFaceoffTeam:g.firstFaceoffTeam,firstFaceoffRank:g.firstFaceoffRank,faceoffWinner:g.faceoffWinner,controllingTeam:g.controllingTeam,stealingTeam:g.stealingTeam,strikes:g.strikes,revealedRanks:JSON.parse(g.revealedRanks),roundPoints:g.roundPoints,paused:g.paused});
async function full(id:string){return prisma.match.findUniqueOrThrow({where:{id},include:{teamA:true,teamB:true,winner:true,gameState:true,rounds:{include:{question:{include:{answers:{orderBy:{rank:'asc'}}}}},orderBy:{number:'asc'}},assignments:{include:{question:{include:{answers:{orderBy:{rank:'asc'}}}}},orderBy:{order:'asc'}}}})}
function view(m:any,host=false){const g=parse(m.gameState);const q=m.rounds.find((r:any)=>r.number===g.roundNumber)?.question||m.assignments.find((x:any)=>x.order===g.roundNumber)?.question;return{id:m.id,number:m.number,status:m.status,teamA:m.teamA,teamB:m.teamB,winner:m.winner,teamAScore:m.teamAScore,teamBScore:m.teamBScore,state:g,question:q&&{id:q.id,text:q.text,answers:q.answers.map((a:any)=>host||g.revealedRanks.includes(a.rank)?a:{rank:a.rank})}}}
async function broadcast(id:string){const m=await full(id);io.to(`match:${id}`).emit('game:update',view(m,false));io.to(`host:${id}`).emit('host:update',view(m,true));io.emit('bracket:update');}
app.get('/api/health',(_,res)=>res.json({ok:true}));
app.get('/api/tournament',async(_,res)=>{const t=await prisma.tournament.findFirst({include:{teams:{orderBy:{seed:'asc'}},matches:{include:{teamA:true,teamB:true,winner:true},orderBy:{number:'asc'}}}});res.json(t)});
app.put('/api/tournament/teams',auth,async(req,res)=>{try{const names=req.body?.names;if(!Array.isArray(names)||names.length!==14||names.some((n:any)=>typeof n!=='string'||!n.trim()||n.trim().length>60)||new Set(names.map((n:string)=>n.trim().toLocaleLowerCase())).size!==14)return res.status(400).json({error:'Enter 14 distinct team names (up to 60 characters each)'});const t=await prisma.tournament.findFirst({include:{teams:{orderBy:{seed:'asc'}}}});if(!t||t.teams.length!==14)return res.status(409).json({error:'A 14-team bracket is required. Run the updated demo seed first.'});await prisma.$transaction(t.teams.map((team,i)=>prisma.team.update({where:{id:team.id},data:{name:names[i].trim()}})));io.emit('bracket:update');res.json({ok:true})}catch(e:any){res.status(409).json({error:e.message})}});
app.get('/api/matches/:id',async(req,res)=>{try{res.json(view(await full(req.params.id),false))}catch{res.status(404).json({error:'Match not found'})}});
app.get('/api/host/matches/:id',auth,async(req,res)=>{try{res.json(view(await full(req.params.id),true))}catch{res.status(404).json({error:'Match not found'})}});
app.get('/api/questions',auth,async(_,res)=>res.json(await prisma.question.findMany({include:{answers:{orderBy:{rank:'asc'}},assignments:true},orderBy:{text:'asc'}})));
app.post('/api/questions',auth,async(req,res)=>{const {text,category='General',answers}=req.body;if(!text||!Array.isArray(answers)||answers.length!==7)return res.status(400).json({error:'A question needs exactly seven answers'});const ranks=answers.map((a:any)=>a.rank);if(new Set(ranks).size!==7||ranks.some((r:number)=>r<1||r>7)||answers.some((a:any)=>!a.text||!Number.isInteger(a.points)||a.points<0))return res.status(400).json({error:'Invalid answer data'});const q=await prisma.question.create({data:{text,category,answers:{create:answers}},include:{answers:true}});res.status(201).json(q)});
app.delete('/api/questions/:id',auth,async(req,res)=>{if(await prisma.matchQuestion.count({where:{questionId:req.params.id}}))return res.status(409).json({error:'Assigned questions cannot be deleted'});await prisma.question.delete({where:{id:req.params.id}});res.status(204).end()});
app.post('/api/host/matches/:id/actions',auth,async(req,res)=>{try{let result:any;await prisma.$transaction(async tx=>{
 const m:any=await tx.match.findUniqueOrThrow({where:{id:req.params.id},include:{gameState:true,rounds:{include:{question:{include:{answers:true}}}},assignments:{include:{question:{include:{answers:true}}}}}});
 if(m.status==='COMPLETED')throw Error('This match is complete');
 if(req.body.type==='START_ROUND'&&(!m.teamAId||!m.teamBId))throw Error('This match is waiting for both teams');
 const before=parse(m.gameState);
 const currentRound=m.rounds.find((r:any)=>r.number===before.roundNumber);
 if(req.body.type==='UNDO'){
   const events=await tx.gameEvent.findMany({where:{matchId:m.id},orderBy:[{createdAt:'desc'},{id:'desc'}]});
   const ev=events.find(e=>e.type!=='UNDO'&&!e.type.startsWith('UNDONE:'));
   if(!ev)throw Error('Nothing to undo');
   const old=JSON.parse(ev.previousState);
   if(old.roundNumber!==before.roundNumber)throw Error('Cannot undo after moving to another round');
   const {_teamAScore,_teamBScore,_roundStatus,_roundScore,_roundWinnerId,...state}=old;
   await tx.gameState.update({where:{matchId:m.id},data:{...state,revealedRanks:JSON.stringify(state.revealedRanks)}});
   await tx.match.update({where:{id:m.id},data:{teamAScore:_teamAScore??m.teamAScore,teamBScore:_teamBScore??m.teamBScore}});
   if(currentRound)await tx.round.update({where:{id:currentRound.id},data:{status:_roundStatus??(state.phase==='ROUND_COMPLETED'?'COMPLETED':'ACTIVE'),roundScore:_roundScore??0,winnerId:_roundWinnerId??null}});
   await tx.gameEvent.update({where:{id:ev.id},data:{type:`UNDONE:${ev.type}`}});
   await tx.gameEvent.create({data:{matchId:m.id,type:'UNDO',previousState:JSON.stringify(before),updatedState:JSON.stringify(state)}});
   return;
 }
 const q=currentRound?.question||m.assignments.find((x:any)=>x.order===before.roundNumber)?.question;
 if(!q)throw Error('No question assigned');
 const points=Object.fromEntries(q.answers.map((a:any)=>[a.rank,a.points]));
 result=transition(before,req.body,{points,teamAScore:m.teamAScore,teamBScore:m.teamBScore});
 const snapshot={...before,_teamAScore:m.teamAScore,_teamBScore:m.teamBScore,_roundStatus:currentRound?.status,_roundScore:currentRound?.roundScore,_roundWinnerId:currentRound?.winnerId};
 let scores:any={};
 if(result.award){
   scores=result.award.side==='A'?{teamAScore:{increment:result.award.points}}:{teamBScore:{increment:result.award.points}};
   const updated=await tx.round.updateMany({where:{matchId:m.id,number:before.roundNumber,status:'ACTIVE'},data:{status:'COMPLETED',winnerId:result.award.side==='A'?m.teamAId:m.teamBId,roundScore:result.award.points}});
   if(updated.count!==1)throw Error('Round points were already awarded');
 }
 await tx.gameState.update({where:{matchId:m.id},data:{...result.state,revealedRanks:JSON.stringify(result.state.revealedRanks)}});
 if(Object.keys(scores).length)await tx.match.update({where:{id:m.id},data:scores});
 await tx.gameEvent.create({data:{matchId:m.id,type:req.body.type,previousState:JSON.stringify(snapshot),updatedState:JSON.stringify(result.state)}});
 });await broadcast(req.params.id);res.json(view(await full(req.params.id),req.query.public!=='1'))}catch(e:any){res.status(409).json({error:e.message})}});
app.post('/api/host/matches/:id/next-round',auth,async(req,res)=>{try{await prisma.$transaction(async tx=>{const m:any=await tx.match.findUniqueOrThrow({where:{id:req.params.id},include:{gameState:true,assignments:true}});const g=parse(m.gameState);if(!['ROUND_COMPLETED','ANSWER_REVIEW'].includes(g.phase))throw Error('Finish this round first');if(g.roundNumber>=2&&m.teamAScore!==m.teamBScore)throw Error('The match has a winner; complete it instead');const nr=g.roundNumber+1;let assignment=m.assignments.find((x:any)=>x.order===nr);if(!assignment){if(nr<=2)throw Error('Missing assigned question');const used=m.assignments.map((x:any)=>x.questionId);const q=await tx.question.findFirst({where:{id:{notIn:used}}});if(!q)throw Error('No tiebreaker question available');assignment=await tx.matchQuestion.create({data:{matchId:m.id,questionId:q.id,order:nr}})}await tx.round.create({data:{matchId:m.id,number:nr,questionId:assignment.questionId,isTiebreaker:nr>2}});await tx.gameState.update({where:{matchId:m.id},data:{roundNumber:nr,phase:'ROUND_READY',buzzerWinner:null,firstFaceoffTeam:null,firstFaceoffRank:null,faceoffWinner:null,controllingTeam:null,stealingTeam:null,strikes:0,revealedRanks:'[]',roundPoints:0,paused:false}})});await broadcast(req.params.id);res.json(view(await full(req.params.id),req.query.public!=='1'))}catch(e:any){res.status(409).json({error:e.message})}});
app.post('/api/host/matches/:id/complete',auth,async(req,res)=>{try{await prisma.$transaction(async tx=>{
 const m=await tx.match.findUniqueOrThrow({where:{id:req.params.id},include:{gameState:true,teamA:true,teamB:true}});
 if(m.status==='COMPLETED')throw Error('This match is already complete');
 if(!m.gameState||!['ROUND_COMPLETED','ANSWER_REVIEW'].includes(m.gameState.phase)||m.gameState.roundNumber<2)throw Error('Complete at least two rounds');
 if(m.teamAScore===m.teamBScore)throw Error('Match is tied — start a tiebreaker');
 const side=m.teamAScore>m.teamBScore?'A':'B';const winner=side==='A'?m.teamA:m.teamB;
 if(!winner)throw Error('Both teams must be assigned');
 await tx.match.update({where:{id:m.id},data:{winnerId:winner.id,status:'COMPLETED'}});
 await tx.gameState.update({where:{matchId:m.id},data:{phase:'MATCH_COMPLETED'}});
 if(m.number<=7){
   const opening=await tx.match.findMany({where:{tournamentId:m.tournamentId,number:{lte:7}},include:{teamA:true,teamB:true},orderBy:{number:'asc'}});
   if(opening.every(match=>match.status==='COMPLETED')){
     const results=opening.map(match=>{const winningTeam=match.winnerId===match.teamAId?match.teamA:match.teamB;if(!winningTeam||!match.winnerId)throw Error('Opening winner is missing');return{number:match.number,winnerId:match.winnerId,winnerScore:match.winnerId===match.teamAId?match.teamAScore:match.teamBScore,winnerSeed:winningTeam.seed}});
     const {bye,pairs}=openingAdvance(results);
     for(let i=0;i<3;i++){const target=await tx.match.findFirstOrThrow({where:{tournamentId:m.tournamentId,number:8+i}});await tx.match.update({where:{id:target.id},data:{teamAId:pairs[i][0].winnerId,teamBId:pairs[i][1].winnerId}})}
     const semi=await tx.match.findFirstOrThrow({where:{tournamentId:m.tournamentId,number:11}});await tx.match.update({where:{id:semi.id},data:{teamAId:bye.winnerId}});
   }
 }else{const slot=nextSlot(m.number);if(slot){const [number,side]=slot;const target=await tx.match.findFirstOrThrow({where:{tournamentId:m.tournamentId,number}});await tx.match.update({where:{id:target.id},data:side==='A'?{teamAId:winner.id}:{teamBId:winner.id}})}}
 });await broadcast(req.params.id);res.json(view(await full(req.params.id),req.query.public!=='1'))}catch(e:any){res.status(409).json({error:e.message})}});
io.on('connection',s=>{s.on('join',({matchId,host}:{matchId:string,host?:boolean})=>s.join(`${host?'host':'match'}:${matchId}`));s.on('buzz',async({matchId,side}:{matchId:string,side:Side},ack)=>{try{const m=await full(matchId);const result=transition(parse(m.gameState),{type:'BUZZ',side},{points:{},teamAScore:m.teamAScore,teamBScore:m.teamBScore});await prisma.gameState.update({where:{matchId},data:{...result.state,revealedRanks:JSON.stringify(result.state.revealedRanks)}});await broadcast(matchId);ack?.({accepted:true})}catch(e:any){ack?.({accepted:false,error:e.message})}})});
const port=Number(process.env.PORT)||3001;http.listen(port,'0.0.0.0',()=>console.log(`Feud server ready on http://localhost:${port}`));
