import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const TournamentBracket = () => {
  const [teams, setTeams] = useState([[], [], [], []]);
  const [loading, setLoading] = useState(true);
  const [idmatch, setMatchId] = useState([]);
  document.title = "Solo Yasuo cuối tuần"
  const fetchTeams = async () => {
    try {
      const response = await fetch(
        'https://docs.google.com/spreadsheets/d/1DRTe57XORx-N7LFGWA86wbRzc4mS96ACbzKHBWi1x-E/gviz/tq?sheet=Sheet1&range=A1:L20'
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
      const response = await fetch('https://bigtournament-hq9n.onrender.com/api/auth/findallmatchid', {
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

  const renderMatchup = (team1, team2, hasMargin = true, additionalMargin = '') => (
    <Link
      to={getMatchLink(team1, team2)}
      className={`relative flex flex-col gap-y-[3px] overflow-hidden ${hasMargin ? 'my-4' : 'mb-0'} ${additionalMargin}`}
    >
      {[team1, team2].map((team, index) => (
        <div
          key={index}
          className={`2xl:pl-[6px] pl-[4px] flex items-center justify-between bg-white`}
        >
          <div className="flex items-center">
            <img src={team?.icon} alt={team?.name || 'Team Logo'} className="w-8 h-8 mr-2" />
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
    const styles = roundStyles[title] || { border: "border-gray-300", titleBg: "bg-[#D9D9D94D]" };

    return (
      <div className={`flex flex-col  ${styles.border} overflow-hidden ${title === "1W-1L" ? "lg:mt-32" : ""}`}>
        <h2 className={`text-lg font-bold p-2 ${styles.titleBg} border ${styles.border} `}>{title}</h2>
        <div className="py-2">
          {matchups.map((matchup, index) => (
            <div key={index} className={className}>
              {renderMatchup(matchup[0] || {}, matchup[1] || {})}
            </div>
          ))}
        </div>
      </div>
    );
  };


  return (
    <div className="container mx-auto p-4 relative">
      <h1 className="text-3xl font-bold mb-10 mt-20 text-center">Solo Yasuo</h1>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <span className="loading loading-dots loading-lg text-primary"></span>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row justify-between space-y-8 lg:space-y-0 lg:space-x-16 relative">
          <div className="w-full lg:w-1/4 relative">
            {renderSection("Vòng 1/16", [
              [teams[0][0], teams[0][1]],
              [teams[0][2], teams[0][3]],
              [teams[0][4], teams[0][5]],
              [teams[0][6], teams[0][7]],
              [teams[0][8], teams[0][9]],
              [teams[0][10], teams[0][11]],
              [teams[0][12], teams[0][13]],
              [teams[0][14], teams[0][15]]
            ])}
<div className="hidden lg:block absolute top-[7.8rem] left-full h-[2px] 2xl:w-[8%] xl:w-[12%] lg:w-[14%] bg-secondary"></div>
<div className="hidden lg:block absolute top-[16rem] left-full h-[2px] 2xl:w-[8%] xl:w-[12%] lg:w-[14%] bg-secondary"></div>
<div className="hidden lg:block absolute top-[24.2rem] left-full h-[2px] 2xl:w-[8%] xl:w-[12%] lg:w-[14%] bg-secondary"></div>
<div className="hidden lg:block absolute top-[32.4rem] left-full h-[2px] 2xl:w-[8%] xl:w-[12%] lg:w-[14%] bg-secondary"></div>

<div className="hidden lg:block absolute top-[40.5rem] left-full h-[2px] 2xl:w-[8%] xl:w-[12%] lg:w-[14%] bg-secondary"></div>
<div className="hidden lg:block absolute top-[48.7rem] left-full h-[2px] 2xl:w-[8%] xl:w-[12%] lg:w-[14%] bg-secondary"></div>
<div className="hidden lg:block absolute top-[57rem] left-full h-[2px] 2xl:w-[8%] xl:w-[12%] lg:w-[14%] bg-secondary"></div>
<div className="hidden lg:block absolute top-[65.2rem] left-full h-[2px] 2xl:w-[8%] xl:w-[12%] lg:w-[14%] bg-secondary"></div>

<div className="hidden lg:block absolute top-[calc(7.8rem)] 2xl:left-[108%] xl:left-[112%] lg:left-[114%] h-[132.4px] w-[2.3px] bg-secondary"></div>
<div className="hidden lg:block absolute top-[calc(24.2rem)] 2xl:left-[108%] xl:left-[112%] lg:left-[114%] h-[132.4px] w-[2.3px] bg-secondary"></div>
<div className="hidden lg:block absolute top-[calc(40.5rem)] 2xl:left-[108%] xl:left-[112%] lg:left-[114%] h-[132.4px] w-[2.3px] bg-secondary"></div>
<div className="hidden lg:block absolute top-[calc(57rem)] 2xl:left-[108%] xl:left-[112%] lg:left-[114%] h-[132.4px] w-[2px] bg-secondary"></div>

<div className="hidden lg:block absolute top-[11.9rem] 2xl:left-[108%] xl:left-[112%] lg:left-[114%] h-[2px] 2xl:w-[11%] xl:w-[12%] lg:w-[18%] bg-secondary"></div>
<div className="hidden lg:block absolute top-[28.3rem] 2xl:left-[108%] xl:left-[112%] lg:left-[114%] h-[2px] 2xl:w-[11%] xl:w-[12%] lg:w-[18%] bg-secondary"></div>
<div className="hidden lg:block absolute top-[44.6rem] 2xl:left-[108%] xl:left-[112%] lg:left-[114%] h-[2px] 2xl:w-[11%] xl:w-[12%] lg:w-[18%] bg-secondary"></div>
<div className="hidden lg:block absolute top-[61.1rem] 2xl:left-[108%] xl:left-[112%] lg:left-[114%] h-[2px] 2xl:w-[11%] xl:w-[12%] lg:w-[18%] bg-secondary"></div>


          </div>
          <div className="w-full lg:w-1/4 relative">
            <div>
              {renderSection("Tứ kết", [
                [teams[1][0], teams[1][1]],
                [teams[1][2], teams[1][3]],
                [teams[1][4], teams[1][5]],
                [teams[1][6], teams[1][7]],
              ], 'lg:!mb-[148px] lg:last:!mb-[0px] lg:first:!mt-[80px]')}
              <div className="hidden lg:block absolute top-[11.8rem] left-full h-[2px] 2xl:w-[8%] xl:w-[10%] lg:w-[13%] bg-secondary"></div>
            <div className="hidden lg:block absolute top-[calc(11.8rem)] 2xl:left-[108%] xl:left-[110%] lg:left-[112%] h-[268px] w-[2.3px] bg-secondary"></div>
            <div className="hidden lg:block absolute top-[28.4rem] left-full h-[2px] 2xl:w-[8%] xl:w-[10%] lg:w-[13%] bg-secondary"></div>
            <div className="hidden lg:block absolute top-[20.1rem] 2xl:left-[108%] xl:left-[110%] lg:left-[112%] h-[2px] 2xl:w-[11%] xl:w-[14%] lg:w-[20%] bg-secondary"></div>

            <div className="hidden lg:block absolute top-[44.7rem] left-full h-[2px] 2xl:w-[8%] xl:w-[10%] lg:w-[13%] bg-secondary"></div>
            <div className="hidden lg:block absolute top-[calc(44.7rem)] 2xl:left-[108%] xl:left-[110%] lg:left-[112%] h-[265px] w-[2.3px] bg-secondary"></div>
            <div className="hidden lg:block absolute top-[61.1rem] left-full h-[2px] 2xl:w-[8%] xl:w-[10%] lg:w-[13%] bg-secondary"></div>
            <div className="hidden lg:block absolute top-[52.9rem] 2xl:left-[108%] xl:left-[110%] lg:left-[112%] h-[2px] 2xl:w-[11%] xl:w-[14%] lg:w-[20%] bg-secondary"></div> 
            </div>

          </div>
          <div className="w-full lg:w-1/4 relative">
            {renderSection("Bán kết", [
              [teams[2][0], teams[2][1]],
              [teams[2][2], teams[2][3]],
            ],'lg:!mt-[212px] last:!mb-[0px] lg:!mb-[410px]')}
            <div className="hidden lg:block absolute top-[20.1rem] left-full h-[2px] 2xl:w-[8%] xl:w-[10%] lg:w-[13%] bg-secondary"></div>
            <div className="hidden lg:block absolute top-[calc(20.1rem)] 2xl:left-[108%] xl:left-[110%] lg:left-[112%] h-[527px] w-[2.3px] bg-secondary"></div>
            <div className="hidden lg:block absolute top-[52.9rem] left-full h-[2px] 2xl:w-[8%] xl:w-[10%] lg:w-[13%] bg-secondary"></div>
            <div className="hidden lg:block absolute top-[36.5rem] 2xl:left-[108%] xl:left-[110%] lg:left-[112%] h-[2px] 2xl:w-[11%] xl:w-[14%] lg:w-[20%] bg-secondary"></div>
          </div>
          <div className="w-full lg:w-1/4 relative">
            {renderSection("Chung kết", [
              [teams[3][0], teams[3][1]],

            ],'lg:!my-[475px]')}
            
          </div>

        </div>
      )}
    </div>
  );
};

export default TournamentBracket;
