import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // Import Link from react-router-dom for navigation

const TournamentBracket = () => {
  const [teams, setTeams] = useState([[], [], [], []]);
  const [loading, setLoading] = useState(true);
  const [idmatch, setMatchId] = useState([]);

  const fetchTeams = async () => {
    try {
      const response = await fetch(
        'https://docs.google.com/spreadsheets/d/1s2Lyk37v-hZcg7-_ag8S1Jq3uaeRR8u-oG0zviSc26E/gviz/tq?sheet=Swiss Stage&range=A1:M11'
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      const json = JSON.parse(text.substring(47, text.length - 2));

      const columns = [0, 3, 6, 9];
      const updatedTeams = columns.map((col) =>
        json.table.rows.map(row => ({
          name: row.c[col + 1]?.v || "Unknown",
          icon: `https://drive.google.com/thumbnail?id=${row.c[col]?.v}` || "🏅",
          score: row.c[col + 2]?.v || 0
        }))
      );
      setTeams(updatedTeams);
    } catch (error) {
      console.error("Failed to fetch teams:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGames = async () => {
    try {
      const response = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/findallmatchid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMatchId(data);
    } catch (error) {
      console.error("Failed to fetch games:", error);
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchGames();
  }, []);

  const getMatchLink = (team1, team2) => {
    if (!team1.name || !team2.name) return "#"; // If team names are missing, return a placeholder link
    
    // Debugging: Log to ensure correct data mapping

  
    // Find the matching game by comparing team names
    const match = idmatch.find(
      (m) => 
        (m.teamA.toLowerCase() === team1.name.toLowerCase() && m.teamB.toLowerCase() === team2.name.toLowerCase()) || 
        (m.teamA.toLowerCase() === team2.name.toLowerCase() && m.teamB.toLowerCase() === team1.name.toLowerCase())
    );
  
    if (match) {
      return `/valorant/match/${match.round}/${match.Match}`;
    } else {
      return "#"; // Fallback in case no match is found
    }
  };
  const roundStyles = {
    "0W-0L": { border: "border-blue-300", titleBg: "bg-blue-100" },
    "1W-0L": { border: "border-green-300", titleBg: "bg-green-100" },
    "1W-1L": { border: "border-yellow-300", titleBg: "bg-yellow-100" },
    "0W-1L": { border: "border-red-300", titleBg: "bg-red-100" },
    "Eliminate": { border: "border-red-400", titleBg: "bg-red-200" }, // Add styles as needed
    "Advance to play-off": { border: "border-green-400", titleBg: "bg-green-200" }, // Add styles as needed
  };
  const renderMatchup = (team1, team2) => (
    <Link to={getMatchLink(team1, team2)} className="relative flex flex-col border-2 border-gray-300 rounded-lg overflow-hidden mb-4">
      {[team1, team2].map((team, index) => (
        <div key={index} className={`flex items-center justify-between p-2 ${index === 0 ? 'border-b border-gray-300' : ''}`}>
          <div className="flex items-center">
            <img src={team?.icon} alt={team?.name || "Team Logo"} className="w-8 h-8 mr-2" />
            <span>{team?.name || "Unknown"}</span>
          </div>
          <span className={`font-bold ${team?.score === Math.max(team1?.score || 0, team2?.score || 0) ? 'text-green-600' : ''}`}>
            {team?.score || 0}
          </span>
        </div>
      ))}
    </Link>
  );

  const renderSection = (title, matchups, className = "") => {
    const styles = roundStyles[title] || { border: "border-gray-300", titleBg: "bg-gray-100" };

    return (
      <div className={`flex flex-col ${className} ${styles.border} rounded-lg border-2 overflow-hidden`}>
        <h2 className={`text-lg font-bold p-2 ${styles.titleBg} border-b ${styles.border} text-black`}>{title}</h2>
        <div className="p-2">
          {matchups.map((matchup, index) => (
            <div key={index} className="mb-4">
              {renderMatchup(matchup[0] || {}, matchup[1] || {})}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAdvanceSection = () => (
    <div className="flex flex-col border-2 border-green-300 rounded-lg overflow-hidden">
      <h2 className="text-lg font-bold p-2 bg-green-100 border-b border-green-300 text-black">Advance to play-off</h2>
      <div className="p-2">
        {teams[3].slice(0, 4).map((team, index) => (
          <div key={index} className="flex items-center justify-between p-2 border-b last:border-b-0">
            <div className="flex items-center">
              {team.icon !== "🏅" ? (
                <img src={team.icon} alt={team.name || "Team Logo"} className="w-8 h-8 mr-2" />
              ) : (
                <span className="w-8 h-8 mr-2">{team.icon}</span>
              )}
              <span>{team.name || "Unknown"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEliminateSection = () => (
    <div className="flex flex-col border-2 border-red-300 rounded-lg overflow-hidden">
      <h2 className="text-lg font-bold p-2 bg-red-100 border-b border-red-300 text-black">Eliminate</h2>
      <div className="p-2">
        {teams[3].slice(5, 9).map((team, index) => (
          <div key={index} className="flex items-center justify-between p-2 border-b border-red-200 last:border-b-0">
            <div className="flex items-center">
              <img src={team.icon} alt={team.name || "Team Logo"} className="w-8 h-8 mr-2" />
              <span>{team.name || "Unknown"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Swiss Stage Tournament Bracket</h1>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <span className="loading loading-dots loading-lg text-primary"></span>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row justify-between space-y-8 lg:space-y-0 lg:space-x-4">
          <div className="w-full lg:w-1/4">
            {renderSection("0W-0L", [
              [teams[0][0], teams[0][1]],
              [teams[0][2], teams[0][3]],
              [teams[0][4], teams[0][5]],
              [teams[0][6], teams[0][7]],
            ])}
          </div>
          <div className="w-full lg:w-1/4 flex flex-col justify-between">
            <div>
              {renderSection("1W-0L", [
                [teams[1][0], teams[1][1]],
                [teams[1][2], teams[1][3]],
              ])}
            </div>
            <div className="mt-8">
              {renderSection("0W-1L", [
                [teams[1][5], teams[1][6]],
                [teams[1][7], teams[1][8]],
              ])}
            </div>
          </div>
          <div className="w-full lg:w-1/4">
            {renderSection("1W-1L", [
              [teams[2][0], teams[2][1]],
              [teams[2][2], teams[2][3]],
            ])}
          </div>
          <div className="w-full lg:w-1/4 flex flex-col justify-between">
            {renderAdvanceSection()}
            <div className="mt-8">
              {renderEliminateSection()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentBracket;
