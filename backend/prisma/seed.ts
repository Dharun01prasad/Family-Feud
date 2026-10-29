import {PrismaClient} from '@prisma/client';
const p=new PrismaClient();
const prompts=[
['Something students do right before an exam',['Review notes','Pray','Drink coffee','Ask friends','Panic','Find a pen','Check the time']],
['Something people forget when leaving home',['Phone','Keys','Wallet','Charger','Watch','Umbrella','Water bottle']],
['A reason someone might be late to class',['Overslept','Traffic','Missed bus','Long queue','Forgot schedule','Bad weather','Talking to friends']],
['Something found in a college backpack',['Laptop','Notebook','Pens','Water bottle','Charger','Snacks','ID card']],
['A place students go between classes',['Cafeteria','Library','Hostel','Campus lawn','Computer lab','Sports ground','Parking lot']],
['Something that makes a lecture memorable',['Great teacher','Funny story','Live demo','Surprise quiz','Guest speaker','Debate','Free food']],
['A popular college club activity',['Dance','Coding','Music','Debate','Photography','Sports','Drama']],
['Something people do during a power cut',['Use phone light','Light candles','Sleep','Go outside','Chat','Check the fuse','Play games']],
['Something you see at a festival',['Lights','Crowd','Food stalls','Music','Decorations','Stage','Security']],
['A reason to celebrate',['Birthday','Winning','Graduation','Wedding','Promotion','Festival','New job']],
['Something you take on a road trip',['Snacks','Water','Music','Map','Sunglasses','Pillow','First-aid kit']],
['A job that requires a uniform',['Police officer','Doctor','Pilot','Chef','Soldier','Nurse','Security guard']],
['Something people check every morning',['Phone','Time','Messages','Weather','Mirror','Calendar','News']],
['A food people eat while watching a movie',['Popcorn','Chips','Pizza','Chocolate','Ice cream','Nachos','Cookies']],
['Something that is hard to do quietly',['Sneeze','Laugh','Move furniture','Open chips','Sing','Run','Clap']],
['Something found at a beach',['Sand','Water','Shells','Umbrellas','Towels','Boats','Seagulls']],
['A reason someone calls customer service',['Refund','Broken product','Billing issue','Delivery delay','Password reset','Complaint','Cancellation']],
['Something people lose often',['Keys','Phone','Socks','Wallet','Pens','Remote','Glasses']],
['Something that needs charging',['Phone','Laptop','Watch','Earbuds','Power bank','Camera','Speaker']],
['A room people clean before guests arrive',['Living room','Bathroom','Kitchen','Bedroom','Dining room','Guest room','Balcony']],
['Something you might borrow from a friend',['Money','Pen','Notes','Clothes','Charger','Book','Vehicle']],
['A sign that it may rain',['Dark clouds','Thunder','Cool wind','Lightning','Forecast','Smell of rain','Birds sheltering']],
['Something people do at a wedding',['Eat','Dance','Take photos','Give gifts','Dress up','Meet relatives','Cry']],
['An item on a teacher’s desk',['Laptop','Books','Pens','Attendance sheet','Water bottle','Phone','Stapler']],
['Something that wakes you up',['Alarm','Phone call','Sunlight','Noise','Someone shouting','Pet','Hunger']],
['A reason to visit the library',['Study','Borrow books','Quiet space','Research','Internet','Meet friends','Air conditioning']],
['Something people do when nervous',['Sweat','Bite nails','Fidget','Talk fast','Pace','Laugh','Avoid eye contact']],
['A common group-project problem',['No participation','Scheduling','Poor communication','Late work','Different ideas','Technical issues','Unequal workload']]
];
const points=[35,25,15,10,7,5,3];
async function main(){await p.gameEvent.deleteMany();await p.gameState.deleteMany();await p.round.deleteMany();await p.matchQuestion.deleteMany();await p.match.deleteMany();await p.answer.deleteMany();await p.question.deleteMany();await p.team.deleteMany();await p.tournament.deleteMany();
 const tournament=await p.tournament.create({data:{name:'Campus Feud Championship',status:'ACTIVE'}});
 const names=Array.from({length:14},(_,i)=>`Team ${i+1}`);
 const teams=[];for(let i=0;i<14;i++)teams.push(await p.team.create({data:{name:names[i],seed:i+1,tournamentId:tournament.id}}));
 const questions=[];for(let i=0;i<39;i++){const [text,answers]=prompts[i%prompts.length];questions.push(await p.question.create({data:{text:i<prompts.length?text as string:`Bonus survey ${i+1}: ${text}`,category:'Sample — College Life',isSample:true,answers:{create:(answers as string[]).map((_,rank)=>({rank:rank+1,text:'Mukunth',points:points[rank]}))}}}))}
 const matches=[];
 for(let n=1;n<=13;n++){const pair=n<=7?[teams[n-1],teams[14-n]]:null;matches.push(await p.match.create({data:{number:n,bracketPosition:n<=7?'OPENING':n<=10?'SECOND_ROUND':n<=12?'SEMIFINAL':'FINAL',tournamentId:tournament.id,teamAId:pair?.[0].id,teamBId:pair?.[1].id}}))}
 let qi=0;for(const m of matches){for(let order=1;order<=3;order++)await p.matchQuestion.create({data:{matchId:m.id,questionId:questions[qi++].id,order}});const q=questions[qi-3];await p.round.create({data:{matchId:m.id,number:1,questionId:q.id}});await p.gameState.create({data:{matchId:m.id}})}
 console.log(`Seeded ${teams.length} teams, ${matches.length} matches and ${questions.length} sample questions.`)}
main().finally(()=>p.$disconnect());
