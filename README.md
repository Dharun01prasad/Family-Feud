# Feud Night Live

The app opens on the tournament bracket. Select a match to operate its audience game board from the same computer. The projector screen includes the live controls; a separate host page is not needed.

## Run on Windows

1. Install Node.js 20 or newer.
2. Run `npm install` in this folder.
3. Copy `.env.example` to `backend/.env` or use the existing local defaults.
4. Run `npm run db:push` and, for a fresh demo database only, `npm run db:seed`. Seeding deletes existing event data.
5. Run `npm run dev` and open `http://localhost:5173`.

For other devices on the same Wi-Fi, use the host computer's local network address.

## Set up the 14 teams

On the bracket, click **Team names**, enter all 14 names in seed order, and save. The opening matches pair seeds 1–14, 2–13, through 7–8. Editing names preserves scores and progress.

The seven opening winners advance. The winner with the most points in their own opening match gets a bye past the second round. If points are tied, the lower seed number gets the bye. The other six winners play three second-round matches. Their winners join the bye team in two semifinals, followed by the final.

The fresh demo database has 39 placeholder questions: two regular questions per match and one reserved tiebreaker question per match. Question text is hidden from the projected board. The answer text is currently “Mukunth” on every tile; replace the placeholder records before the event.

## Using the game board

1. Open the bracket and click a match whose two teams are assigned. Click **Start round**.
2. Watch the physical buzzer and take the spoken answer. Check your answer sheet, then click the ranked tile or press `1`–`7` to unveil it. Press `X` for a wrong face-off answer. You can take a second face-off answer before assigning control.
3. Before assigning control, press `X` as many times as needed for wrong face-off answers. Reveal the correct face-off answer(s), then press `A` or `L` for the winning team. The strike count resets. To play, reveal the next answer. To pass, press `P` immediately after `A` or `L`: the winning team keeps the points of its highest-ranked face-off answer, while the other team plays for the remaining bank.
4. The first and second wrong answers show `X` and `XX`. After two strikes, the other team gets one steal attempt. Reveal any hidden answer to award the full bank to the stealing team automatically. Press `X` for a failed steal; it awards the bank to the original team.
5. Press `N` after round one to start round two. After round two, `N` completes the match if one team leads. If scores are equal, it starts a single-question tiebreaker. Another tiebreaker is available if the score remains tied.

The projected board has only the Start button, answer tiles, and `?`. The `?` key or button opens the full shortcut guide. `W` awards the round bank early, `R` reveals remaining answers after a round, `Z` undoes the last action, `Space` pauses or resumes, and `Esc` returns to the bracket (or closes help).

The default local host token is `college-feud-host`. Sample questions are labelled in the database and should be reviewed before the event.
