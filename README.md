# Feud Night Live

The app opens on the tournament bracket. Select a match to operate its audience game board from the same computer. The projector screen includes the live controls; a separate host page is not needed.

## Run on Windows

1. Install Node.js 20 or newer.
2. Run `npm install` in this folder.
3. Copy `.env.example` to `backend/.env` or use the existing local defaults.
4. Run `npm run db:push` and, for a fresh tournament only, `npm run db:seed`. Seeding deletes existing event data and reloads the E-Cell question bank.
5. Run `npm run dev` and open `http://localhost:5173`.

For other devices on the same Wi-Fi, use the host computer's local network address.

## Set up the 16 teams

On the bracket, click **Team names**, enter all 16 names in seed order, and save. The opening matches pair seeds 1–16, 2–15, through 8–9. Editing names preserves scores and progress.

All eight opening winners advance to four quarterfinals. Four winners advance to two semifinals, followed by the final. Every team plays each stage it reaches; there are no byes.

The database uses the E-Cell question bank from the supplied PDF. The first 30 entries fill the two rounds in each of the 15 matches; all 36 entries remain in the database. The PDF skips number 34 and repeats the same car question as 35 and 37. All listed questions have five answers, and the board also supports six or seven answers for later additions. Question text remains hidden from the projected board.

To reload the PDF questions into the existing 16-team bracket without changing team names or match progress, run `npm run db:import-questions`. This replaces the assigned questions and their answer points. A full `db:seed` resets team names, matches and scores as well as the questions.

## Using the game board

1. Open the bracket and click a match whose two teams are assigned. Click **Start round**.
2. Watch the physical buzzer and take the spoken answer. Check your answer sheet, then click the ranked tile or press `1`–`7` to unveil it. Press `X` for a wrong face-off answer. You can take a second face-off answer before assigning control.
3. Before assigning control, press `X` as many times as needed for wrong face-off answers. Reveal the correct face-off answer(s), then press `A` or `L` for the winning team. The strike count resets. To play, reveal the next answer. To pass, press `P` immediately after `A` or `L`: the winning team keeps the points of its highest-ranked face-off answer, while the other team plays for the remaining bank.
4. The first and second wrong answers show `X` and `XX`. After two strikes, the other team gets one steal attempt. Reveal any hidden answer to award the full bank to the stealing team automatically. Press `X` for a failed steal; it awards the bank to the original team.
5. Press `N` after round one to start round two. After round two, a leading team wins automatically. If scores are equal, decide the result offline, then press `A` or `L` to record Team A or Team B as the match winner. There is no third question.

The projected board has the Start button, answer tiles, `?`, and a **Reveal remaining answers** button after each round. The `?` key or button opens the full shortcut guide. `W` awards the round bank early, `R` reveals all remaining answers after a round, `Z` undoes the last action, `Space` pauses or resumes, and `Esc` returns to the bracket (or closes help).

The default local host token is `college-feud-host`. Sample questions are labelled in the database and should be reviewed before the event.
