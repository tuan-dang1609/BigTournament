// components/CreateMatch.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateMatch() {
  const [form, setForm] = useState({ team1: '', team2: '', matchType: 'BO3' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${import.meta.env.VITE_DCN_URL}/api/auth/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const match = await res.json();
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
          onChange={(e) => setForm({...form, team1: e.target.value})}
        />
        <input
          type="text"
          placeholder="Team 2 Name"
          className="w-full p-2 border rounded"
          value={form.team2}
          onChange={(e) => setForm({...form, team2: e.target.value})}
        />
        <select
          className="w-full p-2 border rounded"
          value={form.matchType}
          onChange={(e) => setForm({...form, matchType: e.target.value})}
        >
          <option value="BO1">BO1</option>
          <option value="BO3">BO3</option>
          <option value="BO5">BO5</option>
        </select>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Create Match
        </button>
      </form>
    </div>
  );
}