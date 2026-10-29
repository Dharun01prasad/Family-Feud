export interface BankQuestion {
  number: number;
  text: string;
  answers: [string, number][];
}

// Transcribed from E-CELL QUESTION BANK — FAMILY FEUD.pdf in its printed order.
// The source skips number 34 and repeats question 35 as question 37.
export const questionBank: BankQuestion[] = [
  { number: 1, text: 'Name something you say on a call with your parents:', answers: [['Haan haan / Yes / Okay', 30], ["I'm eating / I ate", 24], ['Network is bad', 18], ["I'll call later (busy)", 16], ["Everything's fine", 12]] },
  { number: 2, text: 'Name something a relative asks you at a family function:', answers: [['What are you doing these days?', 30], ["When's the wedding?", 28], ['How much do you earn?', 18], ['What marks did you get? (Studies)', 14], ["You've put on weight", 10]] },
  { number: 3, text: 'Name something people yell during a cricket match:', answers: [['Catch it!', 34], ['Out!', 26], ['Change the bowler / batter', 18], ['Who picked this team?', 14], ["Don't change the channel!", 8]] },
  { number: 4, text: 'Name something college students always run out of:', answers: [['Money', 34], ['Sleep', 24], ['Clean clothes', 16], ['Attendance', 14], ['Phone battery', 12]] },
  { number: 5, text: 'Name something people lose all the time while in college:', answers: [['Water bottle', 34], ['Earphones', 28], ['Phone charger', 18], ['Umbrella', 12], ['Wallet', 8]] },
  { number: 6, text: "Name something you'd pack for a beach trip:", answers: [['Sunglasses', 28], ['Sunscreen', 24], ['Towel', 20], ['Speaker / Football', 16], ['Snacks', 12]] },
  { number: 7, text: 'Name something people do when their crush texts:', answers: [['Smile', 28], ['Overthink the reply', 28], ['Screenshot it for friends', 22], ['Reply instantly', 12], ['Wait to act nonchalant', 10]] },
  { number: 8, text: 'Name something friends do when someone gets into a relationship:', answers: [['Demand a treat', 34], ["Stalk the partner's profile", 26], ['Tease them', 22], ['Ask for photos', 12], ['Give unwanted advice', 6]] },
  { number: 9, text: 'Name something people do when a friend gets a new phone:', answers: [['Ask the price / model', 34], ['Check the camera', 26], ['Demand a treat', 20], ['Drop it', 12], ["Say 'mine is better'", 8]] },
  { number: 10, text: 'Name something a man has that he loves to show off to other men:', answers: [['Bike or car', 34], ['Biceps / Body', 28], ['Girlfriend', 16], ['Beard / Hair', 14], ['Salary or promotion', 8]] },
  { number: 11, text: 'Name something people do after getting drunk:', answers: [['Sing / Dance', 32], ['Puke', 26], ['Call their ex', 20], ['Cry or get emotional', 14], ['Fall asleep', 8]] },
  { number: 12, text: 'Name something people hate about a long flight:', answers: [['No leg room', 32], ['No entertainment', 26], ['Bad food', 20], ['Snoring / Annoying neighbour', 14], ['Crying baby', 8]] },
  { number: 13, text: 'Name something people do in the shower other than showering:', answers: [['Sing', 38], ['Think about life', 24], ['Take a piss', 18], ['Dance', 12], ['Talk to themselves / Enact scenarios', 8]] },
  { number: 14, text: 'Name something people do when the phone connection is bad:', answers: [["Say 'Hello? Can you hear me?'", 38], ['Walk to a different place', 24], ['Hold the phone up high', 20], ['Hang up and redial', 12], ['Switch to WhatsApp call', 6]] },
  { number: 15, text: "Having big lips is an advantage when you're doing what?", answers: [['Kissing', 38], ['Wearing lipstick', 24], ['Taking pout selfies', 18], ['Whistling or playing the flute', 12], ['Blowing balloons (or similar objects)', 8]] },
  { number: 16, text: 'Name something that causes people to change seats at the movies:', answers: [['Loud talker', 32], ['Tall person in front', 26], ['Couple getting too cozy', 18], ['A girl avoiding a random guy next to her', 14], ['Friends wanting to sit together', 10]] },
  { number: 17, text: 'Which sports are Indians most passionate about?', answers: [['Cricket', 44], ['Kabaddi', 18], ['Hockey', 16], ['Football / Soccer', 12], ['Chess', 10]] },
  { number: 18, text: 'Other than feet, name something that runs:', answers: [['Water / Toilet', 40], ['Engine / Car', 28], ['Nose', 14], ['Computer / Program', 12], ['Clock', 6]] },
  { number: 19, text: "A woman should probably not do what while she's nine months pregnant?", answers: [['Sports / Bungee jump', 45], ['Drink / Bar hop', 23], ['Smoke', 14], ['Sex', 10], ['Fly / Travel', 8]] },
  { number: 20, text: 'Name a public place where it is okay to shout:', answers: [['Sports event', 30], ['Concert / Event', 24], ['Amusement park', 20], ['Park', 18], ['Temple festival', 8]] },
  { number: 21, text: "Name someone who might use the phrase 'Put your hands in the air':", answers: [['Cop / Police', 44], ['DJ / Singer', 28], ['Robber / Dacoit', 14], ['Zumba or gym instructor', 8], ['Wedding choreographer', 6]] },
  { number: 22, text: 'Name a profession that involves getting wet:', answers: [['Swimmer / Diver', 34], ['Fisherman', 24], ['Lifeguard', 18], ['Firefighter', 14], ['Plumber', 10]] },
  { number: 23, text: 'What is a common fear that many people have?', answers: [['Heights', 30], ['Cockroaches / Lizards', 24], ['Public speaking', 20], ['Darkness / Ghosts', 16], ['Failure / Exams', 10]] },
  { number: 24, text: 'What would you spend your lottery winnings on?', answers: [['Buy a house / flat', 30], ['Travel / foreign trip', 24], ['Pay off loans / family debts', 20], ['Buy a car or bike', 16], ['Invest / save / education', 10]] },
  { number: 25, text: 'Name something people do before a big presentation:', answers: [['Practice in front of a mirror', 30], ['Go to the washroom', 26], ['Drink water', 18], ['Pray', 16], ['Panic', 10]] },
  { number: 26, text: 'Name an ingredient found in almost every Indian street food.', answers: [['Butter / Cheese', 41], ['Sev / Bhujia', 24], ['Green Chutney', 17], ['Chaat Masala', 11], ['Chopped Onions', 7]] },
  { number: 27, text: 'Name a sound that makes everyone instantly uncomfortable.', answers: [['Nails on a chalkboard', 43], ['Teeth scraping on a fork', 26], ['Loud chewing with mouth open', 15], ['Dentist drill', 10], ['Microphone feedback screech', 6]] },
  { number: 28, text: 'Name an occupation that starts with J:', answers: [['Janitor', 34], ['Judge', 28], ['Jeweller', 20], ['Journalist', 12], ['Joker', 6]] },
  { number: 29, text: 'Name the things our friends would do when getting ready for a first date:', answers: [['Trying out different outfits', 36], ['Borrowing money / vehicle', 26], ['Bombarding perfume', 18], ['Asking for advice / company', 12], ['Taking a bath / trimming', 8]] },
  { number: 30, text: 'Name the worst people to be stuck with in a lift:', answers: [['Ex', 44], ['Enemy / someone you hate', 24], ['Killer / criminal', 16], ['Boss / professor', 10], ['Someone who smells bad', 6]] },
  { number: 31, text: "Name the worst place to be at midnight during New Year's Eve:", answers: [['Jail', 34], ['Bathroom', 26], ['Lift', 18], ['Hospital', 14], ['Office / Work', 8]] },
  { number: 32, text: 'Name things that are hard to do with your eyes open:', answers: [['Sneeze', 38], ['Sleep', 26], ['Kiss', 16], ['Wash hair / face', 12], ['Swim underwater', 8]] },
  { number: 33, text: 'Name the most common items found in a Full English breakfast:', answers: [['Eggs', 30], ['Tea', 26], ['Bacon/Sausage', 20], ['Baked beans', 14], ['Toast', 10]] },
  { number: 35, text: 'Name things people keep in their car:', answers: [['Water bottle', 34], ['Phone charger', 22], ['Tissue box', 16], ['Idol / God photo on the dashboard', 16], ['Air freshener', 12]] },
  { number: 36, text: 'Name sports that do not use a ball, bat or racket:', answers: [['Swimming', 28], ['Running / Athletics', 26], ['Kabaddi', 18], ['Wrestling / Boxing', 16], ['Gymnastics', 12]] },
  { number: 37, text: 'Name things people keep in their car:', answers: [['Water bottle', 34], ['Phone charger', 22], ['Tissue box', 16], ['Idol / God photo on the dashboard', 16], ['Air freshener', 12]] },
];

export function validateQuestionBank() {
  if (questionBank.length !== 36) throw Error('Expected 36 PDF question entries');
  for (const question of questionBank) {
    if (question.answers.length < 5 || question.answers.length > 7) throw Error(`Question ${question.number} has an unsupported answer count`);
    if (question.answers.some(([text, points]) => !text || !Number.isInteger(points) || points < 0)) throw Error(`Question ${question.number} has an invalid answer`);
    if (question.answers.reduce((total, [, points]) => total + points, 0) !== 100) throw Error(`Question ${question.number} does not total 100 points`);
  }
}
