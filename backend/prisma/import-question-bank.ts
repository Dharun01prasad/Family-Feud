import { PrismaClient } from '@prisma/client';
import { questionBank, validateQuestionBank } from './question-bank.js';

const db = new PrismaClient();

async function main() {
  validateQuestionBank();
  const matches = await db.match.findMany({ orderBy: { number: 'asc' }, include: { assignments: { orderBy: { order: 'asc' } } } });
  const assignments = matches.flatMap(match => match.assignments);
  if (matches.length !== 15 || assignments.length !== 30 || new Set(assignments.map(assignment => assignment.questionId)).size !== 30) {
    throw Error('Expected 15 matches with 30 distinct assigned question slots. Database was not changed.');
  }

  await db.$transaction(async tx => {
    for (let index = 0; index < assignments.length; index++) {
      const entry = questionBank[index % questionBank.length];
      const questionId = assignments[index].questionId;
      await tx.answer.deleteMany({ where: { questionId } });
      await tx.question.update({ where: { id: questionId }, data: {
        text: entry.text, category: `E-Cell PDF Q${entry.number}`, isSample: false,
        answers: { create: entry.answers.map(([text, points], rank) => ({ rank: rank + 1, text, points })) },
      } });
    }
  }, { timeout: 30000 });
  console.log(`Imported the first 30 PDF entries into the 30 assigned round slots. All matches have two questions.`);
}

main().finally(() => db.$disconnect());
