import{Navigate,Route,Routes}from'react-router-dom';import Bracket from'./pages/Bracket';import GameScreen from'./pages/GameScreen';
export default function App(){return <Routes><Route path="/bracket" element={<Bracket/>}/><Route path="/game/:matchId" element={<GameScreen/>}/><Route path="*" element={<Navigate to="/bracket" replace/>}/></Routes>}
