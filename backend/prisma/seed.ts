import { PrismaClient } from '@prisma/client';
import { questionBank, validateQuestionBank } from './question-bank.js';

const db = new PrismaClient();

async function main() {
  validateQuestionBank();
  await db.gameEvent.deleteMany();
  await db.gameState.deleteMany();
  await db.round.deleteMany();
  await db.matchQuestion.deleteMany();
  await db.match.deleteMany();
  await db.answer.deleteMany();
  await db.question.deleteMany();
  await db.team.deleteMany();
  await db.tournament.deleteMany();

  const tournament = await db.tournament.create({ data: { name: 'Campus Feud Championship', status: 'ACTIVE' } });
  const teams = [];
  for (let i = 0; i < 16; i++) teams.push(await db.team.create({ data: { name: `Team ${i + 1}`, seed: i + 1, tournamentId: tournament.id } }));
  const questions = [];
  for (let i = 0; i < questionBank.length; i++) {
    const entry = questionBank[i % questionBank.length];
    questions.push(await db.question.create({ data: {
      text: entry.text, category: `E-Cell PDF Q${entry.number}`, isSample: false,
      answers: { create: entry.answers.map(([text, points], rank) => ({ rank: rank + 1, text, points })) },
    } }));
  }
  const matches = [];
  for (let number = 1; number <= 15; number++) {
    const pair = number <= 8 ? [teams[number - 1], teams[16 - number]] : null;
    matches.push(await db.match.create({ data: {
      number, bracketPosition: number <= 8 ? 'OPENING' : number <= 12 ? 'QUARTERFINAL' : number <= 14 ? 'SEMIFINAL' : 'FINAL',
      tournamentId: tournament.id, teamAId: pair?.[0].id, teamBId: pair?.[1].id,
    } }));
  }
  let index = 0;
  for (const match of matches) {
    for (let order = 1; order <= 2; order++) await db.matchQuestion.create({ data: { matchId: match.id, questionId: questions[index++].id, order } });
    await db.round.create({ data: { matchId: match.id, number: 1, questionId: questions[index - 2].id } });
    await db.gameState.create({ data: { matchId: match.id } });
  }
  console.log(`Seeded 16 teams, 15 matches and 30 assigned questions from ${questionBank.length} PDF entries.`);
}

main().finally(() => db.$disconnect());
