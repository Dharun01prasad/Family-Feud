import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Play, Trophy } from 'lucide-react';
import { action, api, socket } from '../api';
import type { Answer, Game, Side } from '../types';

const revealPhases = ['FACE_OFF_BUZZER', 'FACE_OFF_FIRST_ANSWER', 'FACE_OFF_SECOND_ANSWER', 'PLAY_OR_PASS', 'MAIN_GAMEPLAY', 'STEAL_ATTEMPT', 'ANSWER_REVIEW'];
const controlPhases = ['FACE_OFF_BUZZER', 'FACE_OFF_FIRST_ANSWER', 'FACE_OFF_SECOND_ANSWER', 'PLAY_OR_PASS'];
const finishedPhases = ['ROUND_COMPLETED', 'ANSWER_REVIEW'];
const labels: Record<string, string> = {
  NOT_STARTED: 'Ready to start', ROUND_READY: 'Round ready', FACE_OFF_BUZZER: 'Face-off',
  FACE_OFF_FIRST_ANSWER: 'Face-off', FACE_OFF_SECOND_ANSWER: 'Face-off',
  PLAY_OR_PASS: 'Face-off', MAIN_GAMEPLAY: 'Board in play', STEAL_ATTEMPT: 'Steal opportunity',
  ROUND_COMPLETED: 'Round complete', ANSWER_REVIEW: 'Answer review', MATCH_COMPLETED: 'Match winner',
};

function AnswerCube({ answer, revealed, enabled, onReveal }: { answer: Answer; revealed: boolean; enabled: boolean; onReveal: () => void }) {
  return <button className="cube-answer" type="button" disabled={!enabled || revealed} onClick={onReveal} aria-label={revealed ? `Answer ${answer.rank}: ${answer.text}, ${answer.points} points` : `Reveal answer ${answer.rank}`}>
    <motion.div className="cube-inner" initial={false} animate={{ rotateX: revealed ? -180 : 0 }} transition={{ duration: .82, ease: [.2, .75, .2, 1] }}>
      <div className="cube-face cube-front"><span>{answer.rank}</span></div>
      <div className="cube-face cube-back"><span>{revealed ? answer.text : ''}</span><b>{revealed ? answer.points : ''}</b></div>
      <div className="cube-edge cube-top" /><div className="cube-edge cube-bottom" />
    </motion.div>
  </button>;
}

export default function GameScreen() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [wrongFlash, setWrongFlash] = useState(0);
  const [wrongCount, setWrongCount] = useState(1);
  const [wrongVisible, setWrongVisible] = useState(false);

  const load = useCallback(() => api(`/matches/${matchId}`).then(setGame).catch(e => setError(e.message)), [matchId]);
  useEffect(() => {
    load();
    socket.emit('join', { matchId });
    socket.on('game:update', setGame);
    return () => { socket.off('game:update', setGame); };
  }, [load, matchId]);
  useEffect(() => {
    if (!wrongFlash) return;
    const timer = window.setTimeout(() => setWrongVisible(false), 1150);
    return () => window.clearTimeout(timer);
  }, [wrongFlash]);

  const act = useCallback(async (body: { type: string; rank?: number; side?: Side }) => {
    if (!matchId || busy) return;
    setBusy(true);
    try {
      setError('');
      const updated = await action(matchId, body);
      setGame(updated);
      if (body.type === 'WRONG') {
        setWrongCount(updated.state.phase === 'ROUND_COMPLETED' ? 1 : Math.max(1, updated.state.strikes));
        setWrongFlash(value => value + 1);
        setWrongVisible(true);
      }
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }, [matchId, busy]);

  const advance = useCallback(async () => {
    if (!game || busy || !finishedPhases.includes(game.state.phase)) return;
    setBusy(true);
    try {
      setError('');
      const complete = game.state.roundNumber >= 3 && game.teamAScore !== game.teamBScore;
      setGame(await api(`/host/matches/${game.id}/${complete ? 'complete' : 'next-round'}?public=1`, { method: 'POST' }, true));
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }, [game, busy]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { showHelp ? setShowHelp(false) : navigate('/bracket'); return; }
      if (e.repeat || (e.target as HTMLElement).matches('input,textarea,select,[contenteditable]')) return;
      if (e.key === '?' && !showHelp) { setShowHelp(true); return; }
      if (showHelp || !game) return;
      const phase = game.state.phase;
      const key = e.key.toLowerCase();
      if (/^[1-7]$/.test(e.key)) { if (revealPhases.includes(phase)) act({ type: 'REVEAL', rank: Number(e.key) }); return; }
      if ((key === 'a' || key === 'l') && controlPhases.includes(phase)) act({ type: 'ASSIGN_CONTROL', side: key === 'a' ? 'A' : 'B' });
      else if (key === 'x' && [...controlPhases, 'MAIN_GAMEPLAY', 'STEAL_ATTEMPT'].includes(phase)) act({ type: 'WRONG' });
      else if (key === 'w' && phase === 'MAIN_GAMEPLAY') act({ type: 'AWARD' });
      else if (key === 'r' && phase === 'ROUND_COMPLETED') act({ type: 'REVIEW' });
      else if (key === 'n') advance();
      else if (key === 'z') act({ type: 'UNDO' });
      else if (key === ' ') { e.preventDefault(); if (!['NOT_STARTED', 'ROUND_READY', 'MATCH_COMPLETED'].includes(phase)) act({ type: 'TOGGLE_PAUSE' }); }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [act, advance, game, navigate, showHelp]);

  if (!game) return <div className="game-screen loading">{error || 'Warming up the board…'}</div>;
  const state = game.state;
  const canReveal = revealPhases.includes(state.phase) && !state.paused && !busy;
  const waitingForTeams = !game.teamA || !game.teamB;

  return <div className="game-screen">
    <div className="stage-lights" />
    <button className="help-trigger" type="button" onClick={() => setShowHelp(true)} aria-label="Show game instructions">?</button>
    <header className="game-header">
      <div className="team-score"><small>TEAM A</small><strong>{game.teamAScore}</strong></div>
      <div className="show-logo"><small>ROUND {state.roundNumber}{state.roundNumber > 3 ? ' · TIEBREAKER' : ''}</small><strong className="round-bank">{state.roundPoints}</strong><em>ROUND POINTS</em></div>
      <div className="team-score right"><small>TEAM B</small><strong>{game.teamBScore}</strong></div>
    </header>
    <main className="board-wrap">
      <div className="question">{game.question?.text || 'Question not assigned'}</div>
      <div className="board">
        {['NOT_STARTED', 'ROUND_READY'].includes(state.phase) && !waitingForTeams && <button type="button" id="start-round" className="start-round-overlay" onClick={() => act({ type: 'START_ROUND' })} disabled={busy}><Play /> Start round</button>}
        <div className="answers">{game.question?.answers.map(answer => <div className="answer-slot" key={answer.rank}><AnswerCube answer={answer} revealed={state.revealedRanks.includes(answer.rank)} enabled={canReveal} onReveal={() => act({ type: 'REVEAL', rank: answer.rank })} /></div>)}</div>
      </div>
      <div className="game-message"><i />{waitingForTeams ? 'Waiting for bracket winners' : state.paused && !['NOT_STARTED', 'ROUND_READY'].includes(state.phase) ? 'Game paused' : labels[state.phase]}</div>
      {error && <div className="game-alert" role="alert">{error}</div>}
    </main>
    <AnimatePresence>{wrongVisible && <motion.div key={wrongFlash} className={`wrong-flash count-${wrongCount}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .18 }} aria-hidden="true"><motion.span initial={{ scale: 3.2, rotate: -17, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} exit={{ scale: 1.15, opacity: 0 }} transition={{ type: 'spring', stiffness: 390, damping: 20 }}>{'X'.repeat(wrongCount)}</motion.span></motion.div>}</AnimatePresence>
    {showHelp && <div className="game-help-backdrop" onClick={() => setShowHelp(false)}><section className="game-help" role="dialog" aria-modal="true" aria-label="Game instructions" onClick={e => e.stopPropagation()}><h2>Run this match</h2><ol><li>Press <b>Start round</b>. Use your physical buzzer to decide who answers first.</li><li>Check the spoken answer, then click its ranked tile or press <b>1–7</b>. If needed, take a second face-off answer before assigning control.</li><li>Press <b>A</b> or <b>L</b> to put Team A or Team B in control. Reveal correct answers with <b>1–7</b>; press <b>X</b> for a wrong answer.</li><li>The first, second, and third wrong answers display <b>X</b>, <b>XX</b>, and <b>XXX</b>. After the third, the other team gets one steal attempt: reveal any hidden answer for an automatic successful steal, or press <b>X</b> to fail the steal and award the bank to the original team.</li><li>Press <b>N</b> for the next round or to finish after round three. If tied, it starts a tiebreaker.</li></ol><p><b>W</b> awards the bank early · <b>R</b> reviews hidden answers after a round · <b>Z</b> undoes · <b>Space</b> pauses · <b>Esc</b> closes help or returns to the bracket.</p></section></div>}
    {state.phase === 'MATCH_COMPLETED' && <div className="winner-overlay"><Trophy /><p>MATCH WINNER</p><h1>{game.winner?.name}</h1></div>}
  </div>;
}
