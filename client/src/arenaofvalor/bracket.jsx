import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Image from '../image/waiting.png'
const TournamentBracket = () => {
  const [teams, setTeams] = useState([[], [], [], []]);
  const [loading, setLoading] = useState(true);
  const [idmatch, setMatchId] = useState([]);
  document.title = "Playoff Liên Quân DCN: Season 2"
  const fetchTeams = async () => {
    try {
      const response = await fetch(
        'https://docs.google.com/spreadsheets/d/1ZGF4cPHRmKL5BSzgAMtUD2WWYrB-Dpx8Q_gFha5T0dY/gviz/tq?sheet=Play-in&range=A1:L20'
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      const json = JSON.parse(text.substring(47, text.length - 2));

      const teamResponse = await fetch(
        "https://bigtournament-hq9n.onrender.com/api/auth/findallteamAOV",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!teamResponse.ok) throw new Error(`HTTP error! status: ${teamResponse.status}`);
      const teamData = await teamResponse.json();

      const columns = [0, 3, 6, 9, 12, 15];
      const updatedTeams = columns.map((col) =>
        json.table.rows.map((row) => {
          const teamName = row.c[col + 1]?.v || "Unknown";
          const team = teamData.find((t) => t.teamName === teamName);

          return {
            name: teamName,
            icon: team ? `https://drive.google.com/thumbnail?id=${team.logoUrl}` : Image,
            score: row.c[col + 2]?.v || 0,
          };
        })
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
  const renderAdvance = (team1, team2, hasMargin = true, additionalMargin = '') => (
    <Link
      to={getMatchLink(team1, team2)}
      className={`relative flex flex-col gap-y-[3px] overflow-hidden ${hasMargin ? 'my-4' : 'mb-0'} ${additionalMargin}`}
    >
      {[team1, team2].map((team, index) => (
        <div
          key={index}
          className={`2xl:pl-[6px] pl-[4px] flex items-center justify-between bg-white lg:first:mb-[268px]`}
        >
          <div className="flex items-center h-14">
            <img src={team?.icon} alt={team?.name || 'Team Logo'} className="w-8 h-8 mr-2" />
            <span className="text-black">{team?.name || 'Unknown'}</span>
          </div>

        </div>
      ))}
    </Link>
  );

  const renderAdvance2 = (team1, team2, hasMargin = true, additionalMargin = '') => (
    <Link
      to={getMatchLink(team1, team2)}
      className={`relative flex flex-col gap-y-[3px] overflow-hidden ${hasMargin ? 'my-4' : 'mb-0'} ${additionalMargin}`}
    >
      {[team1, team2].map((team, index) => (
        <div
          key={index}
          className={`2xl:pl-[6px] pl-[4px] flex items-center justify-between bg-white lg:first:mb-[108px]`}
        >
          <div className="flex items-center h-14">
            <img src={team?.icon} alt={team?.name || 'Team Logo'} className="w-8 h-8 mr-2" />
            <span className="text-black">{team?.name || 'Unknown'}</span>
          </div>

        </div>
      ))}
    </Link>
  );


  const renderSection = (title, matchups, className = "") => {
    const styles = roundStyles[title] || { border: "border-gray-300", titleBg: "bg-[#D9D9D94D]" };

    return (
      <div className={`flex flex-col  ${styles.border} overflow-hidden ${title === "1W-1L" ? "lg:mt-5" : ""}`}>
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
  const renderAdvanceSection = (title, matchups, className = "") => {
    const styles = roundStyles[title] || { border: "border-gray-300", titleBg: "bg-[#D9D9D94D]" };

    return (
      <div className={`flex flex-col  ${styles.border} overflow-hidden ${title === "1W-1L" ? "lg:mt-5" : ""}`}>
        <h2 className={`text-lg font-bold p-2 ${styles.titleBg} border ${styles.border} `}>{title}</h2>
        <div className="py-2">
          {matchups.map((matchup, index) => (
            <div key={index} className={className}>
              {renderAdvance(matchup[0] || {}, matchup[1] || {})}
            </div>
          ))}
        </div>
      </div>
    );
  };
  const renderAdvanceSection2 = (title, matchups, className = "") => {
    const styles = roundStyles[title] || { border: "border-gray-300", titleBg: "bg-[#D9D9D94D]" };

    return (
      <div className={`flex flex-col  ${styles.border} overflow-hidden ${title === "1W-1L" ? "lg:mt-5" : ""}`}>
        <h2 className={`text-lg font-bold p-2 ${styles.titleBg} border ${styles.border} `}>{title}</h2>
        <div className="py-2">
          {matchups.map((matchup, index) => (
            <div key={index} className={className}>
              {renderAdvance2(matchup[0] || {}, matchup[1] || {})}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 relative">
      
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <span className="loading loading-dots loading-lg text-primary"></span>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-5 mt-20 text-center">Vòng Play-off</h1>
          <div className="max-w-[900px] justify-center flex flex-col mx-auto mb-10">
    <p>Hiii! Xin chào tất cả các bạn, chào mừng các bạn đã đến với vòng đấu Play-off, và đây là một số luật lệ tụi mình sẽ có update thêm trong tương lai nhaaaa: </p>
    <ul class="list-disc">
        <li>Tất cả các trận ở đây là BO5. Riêng các trận chung kết tổng sẽ là BO7.</li>
        <li>Các cặp trận được xếp dựa trên ELO tích được ở vòng bảng.</li>
        <li>Thể thức là Double Elimination. Nghĩa là các bạn sẽ có 2 cơ hội. Riêng từ tranh hạng 4 trở đi sẽ chỉ có 1 cơ hội.</li>
        <li>Thời gian sẽ được thông báo ở kênh riêng trên <a href="https://discord.gg/4AGUSHS2">Discord</a>.</li>
        <li>Trước giờ thi đấu 2h các bạn phải đưa lại đội hình cho BTC để bọn mình dễ dàng kiểm soát thông tin người chơi.</li>
        <li>Mọi thông tin khác tụi mình sẽ thông báo riêng trên kênh đấu giải.</li>
        <li>Thời gian thi đấu BTC thông báo sẽ là cố định và KHÔNG thể dời dưới mọi hình thức. Nếu không đủ thành viên thi đấu thì chỉ có thể tìm Stand-in hoặc bị xử thua</li>
    </ul>
    <p> Và đó là tất cả những điều chúng mình muốn gửi đến các bạn, chúc các bạn thi đấu tốt nhaaaaaaa.</p>
</div>
          <div className="flex flex-col lg:flex-row justify-between space-y-8 lg:space-y-0 lg:space-x-16 relative">

            <div className="w-full lg:w-1/4 relative">
              <div>
                {renderSection("Tứ kết (BO5)", [
                  [teams[0][0], teams[0][1]],
                  [teams[0][2], teams[0][3]],
                  [teams[0][4], teams[0][5]],
                  [teams[0][6], teams[0][7]],
                ], 'lg:!mb-[48px] lg:last:!mb-[0px] lg:first:!mt-[10px]')}
                <div className="hidden lg:block absolute top-[7.9rem] left-full h-[2px] lg:w-[10%] bg-secondary"></div>
                <div className="hidden lg:block absolute top-[calc(7.9rem)] lg:left-[110%] h-[165px] w-[2.3px] bg-secondary"></div>
                <div className="hidden lg:block absolute top-[18.1rem] left-full h-[2px] lg:w-[10%] bg-secondary"></div>
                <div className="hidden lg:block absolute top-[13rem] lg:left-[110%]  h-[2px] lg:w-[10%] bg-secondary"></div>

                <div className="hidden lg:block absolute top-[28.2rem] left-full h-[2px] lg:w-[10%]  bg-secondary"></div>
                <div className="hidden lg:block absolute top-[calc(28.2rem)] lg:left-[110%] h-[165px] w-[2.3px] bg-secondary"></div>
                <div className="hidden lg:block absolute top-[38.4rem] left-full h-[2px] lg:w-[10%]  bg-secondary"></div>
                <div className="hidden lg:block absolute top-[33.3rem] lg:left-[110%]  h-[2px] lg:w-[10%] bg-secondary"></div>
              </div>

            </div>
            <div className="w-full lg:w-1/4 relative">
              {renderSection("Bán kết (BO5)", [
                [teams[1][0], teams[1][1]],
                [teams[1][2], teams[1][3]],
              ], 'lg:!mt-[100px] last:!mb-[0px] lg:!mb-[208px]')}
              <div className="hidden lg:block absolute top-[13.1rem] left-full h-[2px] lg:w-[10%]  bg-secondary"></div>
              <div className="hidden lg:block absolute top-[calc(13.1rem)] lg:left-[110%] h-[325px] w-[2.3px] bg-secondary"></div>
              <div className="hidden lg:block absolute top-[33.3rem] left-full h-[2px] lg:w-[10%]  bg-secondary"></div>
              <div className="hidden lg:block absolute top-[23.2rem] lg:left-[110%]  h-[2px] lg:w-[10%] bg-secondary"></div>
            </div>
            <div className="w-full lg:w-1/4 relative">
            {renderSection("Chung kết nhánh thắng (BO5)", [
                [teams[2][0], teams[2][1]]
              ], 'lg:!mt-[262px] last:!mb-[0px]')}
            <div className="hidden lg:block absolute top-[23.2rem] left-full h-[2px] lg:w-[10%]  bg-secondary"></div>
              <div className="hidden lg:block absolute top-[calc(23.2rem)] lg:left-[110%] h-[560px] w-[2.3px] bg-secondary"></div>
              <div className="hidden lg:block absolute top-[58.1rem] left-full h-[2px] lg:w-[10%]  bg-secondary"></div>
              <div className="hidden lg:block absolute top-[40.0rem] lg:left-[110%]  h-[2px] lg:w-[10%] bg-secondary"></div>
            </div>
            <div className="hidden lg:block lg:w-1/4 relative">
            {renderSection("Chung kết tổng (BO7)", [
                [teams[3][0], teams[3][1]]
              ], 'lg:!mt-[530px]')}

            </div>

          </div>
          <div className="flex flex-col lg:w-[74%] lg:flex-row justify-between space-y-8 lg:space-y-0 lg:space-x-16 relative">

            <div className="w-full lg:w-1/4 relative">
              <div>
                {renderSection("Last Chance 1 (BO5)", [
                  [teams[0][9], teams[0][10]],
                  [teams[0][11], teams[0][12]],
                ], 'lg:!mb-[48px] lg:last:!mb-[0px] lg:first:!mt-[10px]')}
                <div className="hidden lg:block absolute top-[7.9rem] left-full h-[2px] lg:w-[29%]  bg-secondary"></div>
                <div className="hidden lg:block absolute top-[18.1rem] left-full h-[2px] lg:w-[29%] bg-secondary"></div>
              </div>

            </div>
            <div className="w-full lg:w-1/4 relative">
              {renderSection("Last Chance 2 (BO5)", [
                [teams[1][9], teams[1][10]],
                [teams[1][11], teams[1][12]],
              ], 'lg:!mb-[48px] lg:last:!mb-[0px] lg:first:!mt-[10px]')}
              <div className="hidden lg:block absolute top-[7.9rem] left-full h-[2px] lg:w-[10%]  bg-secondary"></div>
              <div className="hidden lg:block absolute top-[calc(7.9rem)] lg:left-[110%] h-[165.5px] w-[2.3px] bg-secondary"></div>
              <div className="hidden lg:block absolute top-[18.1rem] left-full h-[2px] lg:w-[10%]  bg-secondary"></div>
              <div className="hidden lg:block absolute top-[13rem] lg:left-[110%]  h-[2px] lg:w-[19%] bg-secondary"></div>
            </div>
            <div className="w-full lg:w-1/4 relative">
            {renderSection("Tranh hạng 4 (BO5)", [
                [teams[2][9], teams[2][10]]
              ], 'lg:first:!mt-[98px]')}
             <div className="hidden lg:block absolute top-[13rem] lg:left-[100%]  h-[2px] lg:w-[29%] bg-secondary"></div>
            </div>
            <div className="w-full lg:w-1/4 relative">
            {renderSection("Trang Hạng 3 (BO5)", [
                [teams[3][9], teams[3][10]]
              ], 'lg:first:!mt-[98px]')}

            </div>
            <div className="w-full lg:hidden relative">
            {renderSection("Chung kết Tổng (BO7)", [
                [teams[3][0], teams[3][1]]
              ], 'lg:!mt-[500px] last:!mb-[0px]')}

            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TournamentBracket;
