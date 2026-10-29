# Feud Night Live

The app opens on the tournament bracket. Select a match to operate its audience game board from the same computer. The projector screen includes the live controls; a separate host page is not needed.

## Run on Windows

1. Install Node.js 20 or newer.
2. Run `npm install` in this folder.
3. Copy `.env.example` to `backend/.env` or use the existing local defaults.
4. Run `npm run db:push` and `npm run db:seed`.
5. Run `npm run dev` and open `http://localhost:5173`.

For other devices on the same Wi-Fi, use the host computer's local network address.

## Using the game board

1. Open the bracket and click a match whose two teams are assigned. Click **Start round**.
2. Watch the physical buzzer and take the spoken answer. Check your answer sheet, then click the ranked tile or press `1`–`7` to unveil it. Press `X` for a wrong face-off answer. You can take a second face-off answer before assigning control.
3. Press `A` or `L` to give Team A or Team B control. During play, reveal correct answers by rank and press `X` for wrong answers. A large X appears on the audience screen.
4. The first, second, and third wrong answers show `X`, `XX`, and `XXX`. After three strikes, the other team gets one steal attempt. Reveal any hidden answer to award the full bank to the stealing team automatically. Press `X` for a failed steal; it awards the bank to the original team.
5. Press `N` after the round is awarded. After round three, `N` completes the match or begins a tiebreaker when tied.

The projected board has only the Start button, answer tiles, and `?`. The `?` key or button opens the full shortcut guide. `W` awards the round bank early, `R` reveals remaining answers after a round, `Z` undoes the last action, `Space` pauses or resumes, and `Esc` returns to the bracket (or closes help).

The default local host token is `college-feud-host`. Sample questions are labelled in the database and should be reviewed before the event.
