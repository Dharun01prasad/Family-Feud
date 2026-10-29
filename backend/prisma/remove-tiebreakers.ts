import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const matches = await db.match.findMany({ orderBy: { number: 'asc' }, include: {
    gameState: true, assignments: { orderBy: { order: 'asc' } },
  } });
  const assignments = matches.flatMap(match => match.assignments);
  if (matches.length !== 15 || assignments.length !== 45 || new Set(assignments.map(assignment => assignment.questionId)).size !== 45 ||
      matches.some(match => match.status !== 'UPCOMING' || match.gameState?.phase !== 'NOT_STARTED' || match.assignments.length !== 3) ||
      await db.gameEvent.count() !== 0) {
    throw Error('Expected an unplayed 16-team bracket with three questions per match. Database was not changed.');
  }
  const questionIds = assignments.map(assignment => assignment.questionId);
  await db.$transaction(async tx => {
    await tx.matchQuestion.deleteMany();
    await tx.round.deleteMany();
    for (const id of questionIds.slice(36)) await tx.question.delete({ where: { id } });
    let index = 0;
    for (const match of matches) {
      for (let order = 1; order <= 2; order++) await tx.matchQuestion.create({ data: {
        matchId: match.id, questionId: questionIds[index++], order,
      } });
      await tx.round.create({ data: { matchId: match.id, number: 1, questionId: questionIds[index - 2] } });
    }
  }, { timeout: 30000 });
  console.log('Removed all third-round assignments. 15 matches now have two rounds; all 36 PDF questions remain available.');
}

main().finally(() => db.$disconnect());
