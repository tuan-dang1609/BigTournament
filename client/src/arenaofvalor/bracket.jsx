import React, { useEffect, useState } from "react";

const TournamentBracket = () => {
  const [teams, setTeams] = useState([[], [], [], []]);
  const [loading, setLoading] = useState(true);
  const [swissStageProcessed, setSwissStageProcessed] = useState(false);

  // Hàm gọi API để lấy danh sách cặp đấu sau khi Swiss stage được xử lý
  const fetchTeams = async () => {
    try {
      const response = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/findswissstage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const round00 = [];
      const round10 = [];
      const round01 = [];
      const round11 = [];

      data.forEach(match => {
        switch (match.round) {
          case "0-0":
            round00.push(match);
            break;
          case "1-0":
            round10.push(match);
            break;
          case "0-1":
            round01.push(match);
            break;
          case "1-1":
            round11.push(match);
            break;
          default:
            break;
        }
      });

      const formattedTeams = [round00, round10, round01, round11];
      setTeams(formattedTeams);
      setLoading(false);

      if (round10.length > 0 || round01.length > 0) {
        setSwissStageProcessed(true);
      }
    } catch (error) {
      console.error("Failed to fetch teams from API:", error);
    }
  };

  // Gọi API để xử lý Swiss Stage và cập nhật giao diện
  const processSwissStage = async () => {
    try {
      const response = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/process-swiss-stage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Swiss stage processed successfully", data);
      fetchTeams(); 
    } catch (error) {
      console.error("Failed to process Swiss stage:", error);
    }
  };

  // Chỉ xử lý Swiss stage nếu chưa được xử lý
  useEffect(() => {
    fetchTeams();

    if (!swissStageProcessed) {
      processSwissStage();
    }
  }, [swissStageProcessed]);

  const roundStyles = {
    "0W-0L": { border: "border-gray-300", titleBg: "bg-[#D9D9D94D]" },
    "1W-0L": { border: "border-gray-300", titleBg: "bg-[#D9D9D94D]" },
    "1W-1L": { border: "border-gray-300", titleBg: "bg-[#D9D9D94D]" },
    "0W-1L": { border: "border-gray-300", titleBg: "bg-[#D9D9D94D]" },
  };

  const renderMatchup = (match, hasMargin = true) => (
    <div
      className={`relative flex flex-col gap-y-[3px] overflow-hidden ${hasMargin ? 'my-4' : 'mb-0'}`}
    >
      <div className="2xl:pl-[6px] pl-[4px] flex items-center justify-between bg-white">
        <div className="flex items-center">
          <img src={'default-icon.png'} alt={match.teamA || 'Team A'} className="w-9 h-9 mr-4 ml-1" />
          <span className="text-black">{match.teamA || 'Unknown'}</span>
        </div>
        <div className="flex items-center justify-center w-14 h-14 bg-[#d9d9d9e5]">
          <span className="font-bold text-[#f4aa49ef] text-[19px]">
            {match.scoreA !== undefined ? match.scoreA : 0}
          </span>
        </div>
      </div>

      <div className="2xl:pl-[6px] pl-[4px] flex items-center justify-between bg-white">
        <div className="flex items-center">
          <img src={'default-icon.png'} alt={match.teamB || 'Team B'} className="w-9 h-9 mr-4 ml-1" />
          <span className="text-black">{match.teamB || 'Unknown'}</span>
        </div>
        <div className="flex items-center justify-center w-14 h-14 bg-[#d9d9d9e5]">
          <span className="font-bold text-[#f4aa49ef] text-[19px]">
            {match.scoreB !== undefined ? match.scoreB : 0}
          </span>
        </div>
      </div>
    </div>
  );

  const renderSection = (title, matchups, className = "") => {
    const styles = roundStyles[title] || { border: "border-gray-300", titleBg: "bg-gray-100" };

    return (
      <div className={`flex flex-col ${className} ${styles.border} rounded-lg border-2 overflow-hidden`}>
        <h2 className={`text-lg font-bold p-2 ${styles.titleBg} border-b ${styles.border} `}>{title}</h2>
        <div className="py-2 px-4 bg-[#D9D9D94D]">
          {matchups.map((match, index) => (
            <div key={index}>
              {renderMatchup(match)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Định nghĩa lại renderAdvanceSection
  const renderAdvanceSection = () => (
    <div className="flex flex-col border-2 border-gray-300 rounded-lg overflow-hidden relative">
      <h2 className="text-lg font-bold p-2 bg-[#D9D9D94D] border-b border-gray-300 ">Advance to play-off</h2>
      <div className="p-2">
        {teams[1].filter(match => match.scoreA > match.scoreB || match.scoreB > match.scoreA).map((match, index) => (
          <div key={index} className="flex items-center justify-between p-2 border-b last:border-b-0">
            <div className="flex items-center">
              <img src={'default-icon.png'} alt={match.teamA || 'Team Logo'} className="w-8 h-8 mr-2" />
              <span>{match.scoreA > match.scoreB ? match.teamA : match.teamB}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Định nghĩa renderEliminateSection để hiển thị các đội bị loại
  const renderEliminateSection = () => (
    <div className="flex flex-col border-2 border-gray-300 overflow-hidden relative rounded-lg">
      <h2 className="text-lg font-bold p-2 bg-[#D9D9D94D] border-b border-gray-300 ">Eliminated Teams</h2>
      <div className="p-2">
        {teams[2].filter(match => match.scoreA < match.scoreB || match.scoreB < match.scoreA).map((match, index) => (
          <div key={index} className="flex items-center justify-between p-2 border-b last:border-b-0">
            <div className="flex items-center">
              <img src={'default-icon.png'} alt={match.teamA || "Team Logo"} className="w-8 h-8 mr-2" />
              <span>{match.scoreA < match.scoreB ? match.teamA : match.teamB}</span>
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
            {renderSection("0W-0L", teams[0])}
            <div className="hidden lg:block absolute top-[calc(25%+1rem)] left-full h-[2.3px] w-[16px] bg-secondary"></div>
            <div className="hidden lg:block absolute bottom-[calc(25%+2.5rem)] left-[calc(100%)] h-[2.3px] w-[16px] bg-secondary"></div>
          </div>
          <div className="w-full lg:w-1/4 flex flex-col justify-between relative">
            <div>
              {renderSection("1W-0L", teams[1])}
              <div className="hidden lg:block absolute top-[5rem] left-full h-[2px] 2xl:w-[109%] xl:w-[110%] lg:w-[113%] bg-secondary"></div>
              <div className="hidden lg:block absolute top-[calc(25%+1rem)] left-full h-[2px] w-[8.25px] bg-secondary"></div>
              <div className="hidden lg:block absolute top-[calc(25%+1rem)] left-[calc(100%+0.4rem)] h-20 w-[1.2px] bg-secondary"></div>
              <div className="hidden lg:block absolute top-[calc(25%+6rem)] left-[calc(100%+0.4rem)] h-[2px] w-[8.5px] bg-secondary"></div>
            </div>
            <div className="mt-8">
              {renderSection("0W-1L", teams[2])}
              <div className="hidden lg:block absolute bottom-[calc(25%+1rem)] left-full h-[2px] w-[8px] bg-secondary"></div>
              <div className="hidden lg:block absolute bottom-[calc(25%+1rem)] left-[calc(100%+0.4rem)] h-20 w-[1.2px] bg-secondary"></div>
              <div className="hidden lg:block absolute bottom-[calc(25%+6rem)] left-[calc(100%+0.4rem)] h-[2px] w-[10px] bg-secondary"></div>
              <div className="hidden lg:block absolute bottom-[7rem] left-full h-[2.3px] 2xl:w-[109%] xl:w-[110%] lg:w-[113%] bg-secondary"></div>
            </div>
          </div>

          <div className="w-full lg:w-1/4 relative">
            {renderSection("1W-1L", teams[3])}
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
