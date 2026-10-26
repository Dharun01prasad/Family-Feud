# Feud Night Live

A local, full-stack tournament control system for an eight-team, single-elimination Family Feud-style college event. It includes an audience board, host console, synchronized mobile buzzers, bracket advancement, persistent SQLite state, question management, undo/audit recovery, and tested server-authoritative scoring.

## Run on Windows

1. Install Node.js 20 or newer.
2. From this folder, run `npm install`.
3. Copy `.env.example` to `.env` (the defaults work locally).
4. Run `npm run db:push` and then `npm run db:seed`.
5. Run `npm run dev`.
6. Open `http://localhost:5173` on the host laptop.

For phones on the same Wi-Fi, replace `localhost` with the host computer's IPv4 address. The app prints the network URL when it starts. Windows Firewall may ask you to permit Node.js on private networks.

## Event routes

- `/` — tournament dashboard
- `/bracket` — audience-friendly live bracket
- `/game/:matchId` — projector game board
- `/host/match/:matchId` — authenticated host controls
- `/buzzer/:matchId/team-a` and `/buzzer/:matchId/team-b` — mobile buzzers
- `/admin` — question library and setup status

The development host token is `college-feud-host`. Change `HOST_TOKEN` before the event, then set the same value in browser local storage under `feud-host-token`.

## Host shortcuts

`1–7` reveal answers, `X` records an incorrect answer, `Z` undoes, `B` resets buzzers, `A`/`L` simulate team buzzers, and `Space` pauses/resumes. Shortcuts do not fire while typing in a field.

## Quality checks

- `npm test` — gameplay and bracket unit tests, including the required 92-point steal scenario
- `npm run build` — type-checks and builds both applications

All included survey content is labelled sample data and should be replaced or reviewed by the organizer before the event.
