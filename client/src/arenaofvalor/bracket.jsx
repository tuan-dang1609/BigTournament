import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const TournamentBracket = () => {
  const [teams, setTeams] = useState({
    '0-0': [],
    '1-0': [],
    '0-1': []
  });
  const [loading, setLoading] = useState(true);
  const [idmatch, setMatchId] = useState([]);

  // Hàm để xáo trộn cặp đấu
  const shuffleTeams = (teamList) => {
    for (let i = teamList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teamList[i], teamList[j]] = [teamList[j], teamList[i]];
    }
    return teamList;
  };

  // Thêm dữ liệu mẫu
  const fetchTeams = () => {
    const staticTeams = [
      { name: "Team A", icon: "🏅", score: 0, win: 0, lose: 0 },
      { name: "Team B", icon: "🏅", score: 0, win: 0, lose: 0 },
      { name: "Team C", icon: "🏅", score: 0, win: 0, lose: 0 },
      { name: "Team D", icon: "🏅", score: 0, win: 0, lose: 0 },
      { name: "Team E", icon: "🏅", score: 0, win: 0, lose: 0 },
      { name: "Team F", icon: "🏅", score: 0, win: 0, lose: 0 },
      { name: "Team G", icon: "🏅", score: 0, win: 0, lose: 0 },
      { name: "Team H", icon: "🏅", score: 0, win: 0, lose: 0 }
    ];

    setTeams({
      '0-0': staticTeams, // Khởi đầu các đội ở nhánh 0-0
      '1-0': [],
      '0-1': []
    });
    setLoading(false);
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

  // Hàm để xử lý kết quả trận đấu
  const updateBracket = (team1, team2, winner) => {
    setTeams((prev) => {
      const updatedTeams = { ...prev };
      // Tìm đội thắng và thua
      const loser = winner === team1 ? team2 : team1;

      // Đội thắng lên nhánh 1-0
      updatedTeams['1-0'].push(winner);
      // Đội thua xuống nhánh 0-1
      updatedTeams['0-1'].push(loser);

      // Xóa đội đã đấu khỏi nhánh 0-0
      updatedTeams['0-0'] = updatedTeams['0-0'].filter(team => team !== team1 && team !== team2);

      // Xáo trộn các đội ở nhánh 1-0 và 0-1
      updatedTeams['1-0'] = shuffleTeams(updatedTeams['1-0']);
      updatedTeams['0-1'] = shuffleTeams(updatedTeams['0-1']);

      return updatedTeams;
    });
  };

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
    "0-0": { border: "border-gray-300", titleBg: "bg-[#D9D9D94D]" },
    "1-0": { border: "border-gray-300", titleBg: "bg-[#D9D9D94D]" },
    "0-1": { border: "border-gray-300", titleBg: "bg-[#D9D9D94D]" }
  };

  const renderMatchup = (team1, team2) => (
    <Link
      to={getMatchLink(team1, team2)}
      className={`relative flex flex-col gap-y-[3px] overflow-hidden my-4`}
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

  const renderSection = (title, teamsInSection) => {
    const styles = roundStyles[title] || { border: "border-gray-300", titleBg: "bg-gray-100" };

    return (
      <div className={`flex flex-col ${styles.border} rounded-lg border-2 overflow-hidden`}>
        <h2 className={`text-lg font-bold p-2 ${styles.titleBg} border-b ${styles.border}`}>{title}</h2>
        <div className="py-2 px-4 bg-[#D9D9D94D]">
          {teamsInSection.map((team, index) => (
            <div key={index}>
              {index % 2 === 0 && teamsInSection[index + 1] && renderMatchup(team, teamsInSection[index + 1])}
            </div>
          ))}
        </div>
      </div>
    );
  };

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
            {renderSection("0-0", teams['0-0'])}
          </div>
          <div className="w-full lg:w-1/4 flex flex-col justify-between relative">
            {renderSection("1-0", teams['1-0'])}
          </div>
          <div className="w-full lg:w-1/4 relative">
            {renderSection("0-1", teams['0-1'])}
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentBracket;
