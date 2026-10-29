import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Maximize2, UsersRound } from 'lucide-react';
import { api, socket } from '../api';
import type { Tournament } from '../types';

const roundNames = ['Opening round', 'Second round', 'Semifinals', 'Championship'];

export default function Bracket() {
  const [t, setT] = useState<Tournament>();
  const [names, setNames] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(() => api('/tournament').then((data: Tournament) => { setT(data); if (!editing) setNames(data.teams.map(team => team.name)); }).catch((e: Error) => setError(e.message)), [editing]);
  useEffect(() => { load(); socket.on('bracket:update', load); return () => { socket.off('bracket:update', load); }; }, [load]);

  const save = async () => {
    setSaving(true); setError('');
    try {
      await api('/tournament/teams', { method: 'PUT', body: JSON.stringify({ names }) }, true);
      setEditing(false);
      const updated: Tournament = await api('/tournament');
      setT(updated); setNames(updated.teams.map(team => team.name));
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (!t) return <main className="loading">{error || 'Building bracket…'}</main>;
  const rounds = [t.matches.slice(0, 7), t.matches.slice(7, 10), t.matches.slice(10, 12), t.matches.slice(12, 13)];
  const openingDone = rounds[0].length === 7 && rounds[0].every(match => match.status === 'COMPLETED');
  const bye = openingDone ? [...rounds[0]].filter(match => match.winner).sort((a, b) => {
    const points = (m: typeof a) => m.winner?.id === m.teamA?.id ? m.teamAScore : m.teamBScore;
    return points(b) - points(a) || (a.winner?.seed || 99) - (b.winner?.seed || 99) || a.number - b.number;
  })[0] : undefined;

  return <main className="wide bracket-page">
    <div className="page-title"><div><Link to="/bracket" className="brand"><span className="brand-mark">F</span><span>FEUD NIGHT <small>LIVE TOURNAMENT</small></span></Link><p className="eyebrow bracket-eyebrow">ROAD TO THE TITLE</p><h1>{t.name}</h1><p className="subtitle">14 teams · 7 opening matches · highest scoring opening winner earns the second round bye</p></div><div className="bracket-actions"><button className="button ghost" type="button" onClick={() => { setNames(t.teams.map(team => team.name)); setEditing(true); }}><UsersRound /> Team names</button><button className="button ghost" type="button" onClick={() => document.documentElement.requestFullscreen()}><Maximize2 /> Full screen</button></div></div>
    {error && <div className="alert" role="alert">{error}</div>}
    <div className="bracket panel">{rounds.map((round, ri) => <section className={`bracket-round r${ri}`} key={ri}><h3>{roundNames[ri]}</h3><div className="round-matches">{round.map(m => <Link to={`/game/${m.id}`} className={`bracket-match ${m.status.toLowerCase()}`} key={m.id}><small>MATCH {m.number}</small>{(['A', 'B'] as const).map(side => { const team = side === 'A' ? m.teamA : m.teamB; const score = side === 'A' ? m.teamAScore : m.teamBScore; return <div className={m.winner?.id === team?.id ? 'winner' : ''} key={side}><span>{team?.seed || '—'}</span><b>{team?.name || 'To be decided'}</b><strong>{m.status === 'COMPLETED' ? score : ''}</strong></div>; })}<em>{m.status}</em></Link>)}{ri === 1 && <div className="bye-card"><small>POINTS BYE</small><strong>{bye?.winner?.name || 'Awaiting opening results'}</strong><span>{bye ? `Earned ${bye.winner?.id === bye.teamA?.id ? bye.teamAScore : bye.teamBScore} points in opening match ${bye.number}` : 'Highest scoring opening winner advances directly to the semifinal'}</span></div>}</div></section>)}<section className="champion"><Trophy /><small>CHAMPION</small><strong>{t.matches[12]?.winner?.name || 'Awaiting the final'}</strong></section></div>
    {editing && <div className="modal-backdrop" onClick={() => setEditing(false)}><section className="modal team-modal" role="dialog" aria-modal="true" aria-label="Edit team names" onClick={e => e.stopPropagation()}><h2>Enter 14 team names</h2><p>Names follow the numbered seeds shown in the opening bracket. Updating names keeps scores and match progress.</p><div className="team-name-grid">{names.map((name, i) => <label key={i}><span>Seed {i + 1}</span><input value={name} maxLength={60} onChange={e => setNames(current => current.map((value, index) => index === i ? e.target.value : value))} /></label>)}</div>{error && <div className="alert" role="alert">{error}</div>}<div className="modal-actions"><button className="button ghost" type="button" onClick={() => setEditing(false)}>Cancel</button><button className="button gold" type="button" onClick={save} disabled={saving}>Save team names</button></div></section></div>}
  </main>;
}
