import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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
    if (!team1.name || !team2.name) return "#";

    const match = idmatch.find(
      (m) =>
        (m.teamA.toLowerCase() === team1.name.toLowerCase() && m.teamB.toLowerCase() === team2.name.toLowerCase()) ||
        (m.teamA.toLowerCase() === team2.name.toLowerCase() && m.teamB.toLowerCase() === team1.name.toLowerCase())
    );

    if (match) {
      return `/valorant/match/${match.round}/${match.Match}`;
    } else {
      return "#";
    }
  };

  const roundStyles = {
    "0W-0L": { border: "border-gray-300", titleBg: "bg-[#D9D9D94D]" },
  "1W-0L": { border: "border-gray-300", titleBg: "bg-[#D9D9D94D]" },
  "1W-1L": { border: "border-gray-300", titleBg: "bg-[#D9D9D94D]" },
  "0W-1L": { border: "border-gray-300", titleBg: "bg-[#D9D9D94D]" },
    "Advance to play-off": { border: "border-gray-300", titleBg: "bg-[#D9D9D94D]" },
  };

  const renderMatchup = (team1, team2, hasMargin = true) => (
    <Link
      to={getMatchLink(team1, team2)}
      className={`relative flex flex-col gap-y-[3px] overflow-hidden ${hasMargin ? 'my-4' : 'mb-0'}`}
    >
      {[team1, team2].map((team, index) => (
        <div
          key={index}
          className={`2xl:pl-[6px] pl-[4px] flex items-center justify-between bg-white ${index === 0 ? '' : ''}`}
        >
          <div className="flex items-center ">
            <img src={team?.icon} alt={team?.name || 'Team Logo'} className="w-9 h-9 mr-4 ml-1" />
            <span className="text-black">{team?.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center justify-center w-14 h-14 bg-[#d9d9d9e5]">
            <span className="font-bold text-[#f4aa49ef] text-[19px]">
              {team?.score || 0}
            </span>
          </div>
        </div>
      ))}
    </Link>
  );
  
  
  

  const renderSection = (title, matchups, className = "") => {
    const styles = roundStyles[title] || { border: "border-gray-300", titleBg: "bg-gray-100" };

    return (
      <div className={`flex flex-col ${className} ${styles.border} rounded-lg border-2 overflow-hidden ${title === "1W-1L" ? "lg:mt-32" : ""}`}>
        <h2 className={`text-lg font-bold p-2 ${styles.titleBg} border-b ${styles.border} `}>{title}</h2>
        <div className="py-2 px-4 bg-[#D9D9D94D]">
          {matchups.map((matchup, index) => (
            <div key={index}>
              {renderMatchup(matchup[0] || {}, matchup[1] || {})}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAdvanceSection = () => (
    <div className="flex flex-col border-2 border-gray-300 rounded-lg overflow-hidden relative">
      <h2 className="text-lg font-bold p-2 bg-[#D9D9D94D] border-b border-gray-300 ">Advance to play-off</h2>
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
    <div className="flex flex-col border-2 border-gray-300 overflow-hidden relative rounded-lg">
      <h2 className="text-lg font-bold p-2 bg-[#D9D9D94D] border-b border-gray-300 ">Eliminate</h2>
      <div className="p-2">
        {teams[3].slice(5, 9).map((team, index) => (
          <div key={index} className="flex items-center justify-between p-2 border-b  last:border-b-0">
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
    <div className="container mx-auto p-4 relative">
      <h1 className="text-3xl font-bold mb-6">Swiss Stage Tournament Bracket</h1>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <span className="loading loading-dots loading-lg text-primary"></span>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row justify-between space-y-8 lg:space-y-0 lg:space-x-4 relative">
          <div className="w-full lg:w-1/4 relative">
            {renderSection("0W-0L", [
              [teams[0][0], teams[0][1]],
              [teams[0][2], teams[0][3]],
              [teams[0][4], teams[0][5]],
              [teams[0][6], teams[0][7]],
            ])}
            <div className="hidden lg:block absolute top-[calc(25%+1rem)] left-full h-[2.3px] w-[16px] bg-secondary"></div>
            <div className="hidden lg:block absolute bottom-[calc(25%+2.5rem)] left-[calc(100%)] h-[2.3px] w-[16px] bg-secondary"></div>

          </div>
          <div className="w-full lg:w-1/4 flex flex-col justify-between relative">
            <div>
              {renderSection("1W-0L", [
                [teams[1][0], teams[1][1]],
                [teams[1][2], teams[1][3]],
              ])}
              <div className="hidden lg:block absolute top-[5rem] left-full h-[2px] 2xl:w-[109%] xl:w-[110%] lg:w-[113%] bg-secondary"></div>
              <div className="hidden lg:block absolute top-[calc(25%+1rem)] left-full h-[2px] w-[8.25px] bg-secondary"></div>
              <div className="hidden lg:block absolute top-[calc(25%+1rem)] left-[calc(100%+0.4rem)] h-20 w-[1.2px] bg-secondary"></div>
              <div className="hidden lg:block absolute top-[calc(25%+6rem)] left-[calc(100%+0.4rem)] h-[2px] w-[8.5px] bg-secondary"></div>
            </div>
            <div className="mt-8">
              {renderSection("0W-1L", [
                [teams[1][5], teams[1][6]],
                [teams[1][7], teams[1][8]],
              ])}
              <div className="hidden lg:block absolute bottom-[calc(25%+1rem)] left-full h-[2px] w-[8px] bg-secondary"></div>
              <div className="hidden lg:block absolute bottom-[calc(25%+1rem)] left-[calc(100%+0.4rem)] h-20 w-[1.2px] bg-secondary"></div>
              <div className="hidden lg:block absolute bottom-[calc(25%+6rem)] left-[calc(100%+0.4rem)] h-[2px] w-[10px] bg-secondary"></div>
              <div className="hidden lg:block absolute bottom-[7rem] left-full h-[2.3px] 2xl:w-[109%] xl:w-[110%] lg:w-[113%] bg-secondary"></div>
            </div>
          </div>

          <div className="w-full lg:w-1/4 relative">
            {renderSection("1W-1L", [
              [teams[2][0], teams[2][1]],
              [teams[2][2], teams[2][3]],
            ])}
            <div className="hidden lg:block absolute top-[calc(45%+1rem)] left-full h-[2.5px] w-[50%] bg-secondary"></div>
            <div className="hidden lg:block absolute top-[calc(34%+1rem)] left-[calc(149.5%)] h-20 w-[2px] bg-secondary"></div>
            <div className="hidden lg:block absolute bottom-[calc(35%+5.9rem)] left-full h-[2px] w-[50%] bg-secondary"></div>
            <div className="hidden lg:block absolute bottom-[calc(35%+.5rem)] left-[149.5%] h-[87px] w-[2px] bg-secondary"></div>
            
          </div>
          <div className="w-full lg:w-1/4 flex flex-col justify-between relative">
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
