// components/CreateMatch.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateMatch() {
  const [form, setForm] = useState({ team1: '', team2: '', matchType: 'BO3' });
  const [round, setRound] = useState('');
  const [matchNum, setMatchNum] = useState(''); // <-- new state for Match
  const [timeStart, setTimeStart] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  // Helper to generate matchStartTimes array as Date objects (ISO strings)
  function generateMatchStartTimesISO(start, bo) {
    if (!start) return [];
    const times = [];
    const startDate = new Date(start);
    for (let i = 0; i < parseInt(bo, 10); i++) {
      const date = new Date(startDate.getTime());
      date.setHours(date.getHours() + i);
      times.push(date.toISOString()); // ISO string for MongoDB Date
    }
    return times;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    // 1. Create the match (banpick)
    const res = await fetch(`https://bigtournament-1.onrender.com/api/auth/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const match = await res.json();
    // 2. Create the matchid
    const boNum = form.matchType === 'BO1' ? 1 : form.matchType === 'BO3' ? 3 : 5;
    const matchStartTimes = generateMatchStartTimesISO(timeStart, boNum);
    const matchidPayload = {
      matchid: [], // required by backend
      teamA: form.team1,
      teamB: form.team2,
      round: round,
      Match: matchNum, // use input value
      matchStartTimes: matchStartTimes,
      banpickid: match.id,
      game: 'Valorant',
      scoreA: 0,
      scoreB: 0,
    };
    await fetch('https://bigtournament-1.onrender.com/api/auth/addmatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(matchidPayload),
    });
    setCreating(false);
    navigate(`/match/${match.id}/spectator`);
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-gray-100 rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Team 1 Name"
          className="w-full p-2 border rounded"
          value={form.team1}
          onChange={(e) => setForm({ ...form, team1: e.target.value })}
        />
        <input
          type="text"
          placeholder="Team 2 Name"
          className="w-full p-2 border rounded"
          value={form.team2}
          onChange={(e) => setForm({ ...form, team2: e.target.value })}
        />
        <select
          className="w-full p-2 border rounded"
          value={form.matchType}
          onChange={(e) => setForm({ ...form, matchType: e.target.value })}
        >
          <option value="BO1">BO1</option>
          <option value="BO3">BO3</option>
          <option value="BO5">BO5</option>
        </select>
        <input
          type="text"
          placeholder="Round"
          className="w-full p-2 border rounded"
          value={round}
          onChange={(e) => setRound(e.target.value)}
        />
        <input
          type="text"
          placeholder="Match"
          className="w-full p-2 border rounded"
          value={matchNum}
          onChange={(e) => setMatchNum(e.target.value)}
        />
        <input
          type="datetime-local"
          className="w-full p-2 border rounded"
          value={timeStart}
          onChange={(e) => setTimeStart(e.target.value)}
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          disabled={creating}
        >
          {creating ? 'Creating...' : 'Create Match'}
        </button>
        <div className="mt-4">
          <strong>Preview matchid POST body:</strong>
          <pre>
            {JSON.stringify(
              {
                matchid: [],
                teamA: form.team1,
                teamB: form.team2,
                round: round,
                Match: matchNum,
                matchStartTimes: generateMatchStartTimesISO(
                  timeStart,
                  form.matchType === 'BO1' ? 1 : form.matchType === 'BO3' ? 3 : 5
                ),
                banpickid: 'MATCH_ID_HERE',
                game: 'Valorant',
                scoreA: 0,
                scoreB: 0,
              },
              null,
              2
            )}
          </pre>
        </div>
      </form>
    </div>
  );
}
