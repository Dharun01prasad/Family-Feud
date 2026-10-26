export interface SeedTeam{id:string;seed:number}
export const bracketPairs=(teams:SeedTeam[])=>{if(teams.length!==8)throw Error('Exactly 8 teams required');const t=[...teams].sort((a,b)=>a.seed-b.seed);return [[t[0],t[7]],[t[3],t[4]],[t[1],t[6]],[t[2],t[5]]];};
export const nextSlot=(matchNumber:number)=>({1:[5,'A'],2:[5,'B'],3:[6,'A'],4:[6,'B'],5:[7,'A'],6:[7,'B']} as Record<number,[number,string]>)[matchNumber]??null;
