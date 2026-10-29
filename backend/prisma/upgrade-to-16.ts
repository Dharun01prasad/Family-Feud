import { PrismaClient } from '@prisma/client';
import { questionBank, validateQuestionBank } from './question-bank.js';

const db = new PrismaClient();

async function main() {
  validateQuestionBank();
  const tournament = await db.tournament.findFirst({ include: {
    teams: { orderBy: { seed: 'asc' } },
    matches: { orderBy: { number: 'asc' }, include: { assignments: { orderBy: { order: 'asc' } } } },
  } });
  if (!tournament || await db.tournament.count() !== 1 || tournament.teams.length !== 14 || tournament.matches.length !== 13) {
    throw Error('Expected the existing 14-team tournament. No data was changed.');
  }
  const assignedIds = tournament.matches.flatMap(match => match.assignments.map(assignment => assignment.questionId));
  if (assignedIds.length !== 39 || new Set(assignedIds).size !== 39) throw Error('Expected 39 distinct assigned questions. No data was changed.');

  await db.$transaction(async tx => {
    await tx.gameEvent.deleteMany();
    await tx.gameState.deleteMany();
    await tx.round.deleteMany();
    await tx.matchQuestion.deleteMany();
    await tx.match.deleteMany();
    for (const id of assignedIds.slice(questionBank.length)) await tx.question.delete({ where: { id } });

    const teams = [...tournament.teams];
    for (let seed = 15; seed <= 16; seed++) teams.push(await tx.team.create({ data: { name: `Team ${seed}`, seed, tournamentId: tournament.id } }));
    const questions = [];
    for (let index = 0; index < questionBank.length; index++) {
      const entry = questionBank[index % questionBank.length];
      const data = {
        text: entry.text, category: `E-Cell PDF Q${entry.number}`, isSample: false,
        answers: { create: entry.answers.map(([text, points], rank) => ({ rank: rank + 1, text, points })) },
      };
      if (index < assignedIds.length) {
        const id = assignedIds[index];
        await tx.answer.deleteMany({ where: { questionId: id } });
        questions.push(await tx.question.update({ where: { id }, data }));
      } else questions.push(await tx.question.create({ data }));
    }

    let questionIndex = 0;
    for (let number = 1; number <= 15; number++) {
      const pair = number <= 8 ? [teams[number - 1], teams[16 - number]] : null;
      const match = await tx.match.create({ data: {
        number, bracketPosition: number <= 8 ? 'OPENING' : number <= 12 ? 'QUARTERFINAL' : number <= 14 ? 'SEMIFINAL' : 'FINAL',
        tournamentId: tournament.id, teamAId: pair?.[0].id, teamBId: pair?.[1].id,
      } });
      for (let order = 1; order <= 2; order++) await tx.matchQuestion.create({ data: { matchId: match.id, questionId: questions[questionIndex++].id, order } });
      await tx.round.create({ data: { matchId: match.id, number: 1, questionId: questions[questionIndex - 2].id } });
      await tx.gameState.create({ data: { matchId: match.id } });
    }
  }, { timeout: 60000 });
  console.log('Upgraded to 16 teams and 15 matches. Existing team names and PDF questions were kept; match progress was reset.');
}

main().finally(() => db.$disconnect());
