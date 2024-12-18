import React, { useEffect, useState } from "react";
import axios from "axios";

const PowerRankingAOV = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTeams, setExpandedTeams] = useState({});
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [playersData, setPlayersData] = useState({});

  // Kiểm tra kích thước màn hình
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 540);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch thông tin người chơi
  const fetchPlayerProfiles = async (playerIGNs) => {
    try {
      const response = await fetch(
        "https://dongchuyennghiep-backend.vercel.app/api/auth/fetchplayerprofiles",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ players: playerIGNs }),
        }
      );
      return await response.json();
    } catch (error) {
      console.error("Error fetching player profiles:", error);
      return [];
    }
  };

  // Fetch bảng xếp hạng và thông tin
  useEffect(() => {
    const fetchData = async () => {
      try {
        const rankingResponse = await axios.post(
          "https://dongchuyennghiep-backend.vercel.app/api/auth/powerrankingaov"
        );
        const allTeamResponse = await axios.post(
          "https://dongchuyennghiep-backend.vercel.app/api/auth/findallteamAOV"
        );

        const rankingsData = rankingResponse.data.data;
        const allTeams = allTeamResponse.data;

        // Kết hợp và sắp xếp dữ liệu
        const combinedData = rankingsData
          .map((team) => {
            const matchedTeam = allTeams.find(
              (t) => t.teamName === team.teamName
            );
            return {
              ...team,
              logoUrl: matchedTeam ? matchedTeam.logoUrl : null,
              shortName: matchedTeam ? matchedTeam.shortName : team.teamName,
              players: matchedTeam?.gameMembers?.["Liên Quân Mobile"] || [],
            };
          })
          .sort((a, b) => b.points - a.points);

        // Tính toán thứ hạng đồng hạng
        let currentRank = 1;
        combinedData.forEach((team, index, array) => {
          if (index > 0 && team.points === array[index - 1].points) {
            team.rank = array[index - 1].rank; // Giữ thứ hạng
          } else {
            team.rank = currentRank;
          }
          currentRank++;
        });

        setRankings(combinedData);

        // Fetch thông tin người chơi cho đội đứng đầu
        if (combinedData.length > 0) {
          const topTeamPlayers = combinedData[0].players;
          const profiles = await fetchPlayerProfiles(topTeamPlayers);
          setPlayersData((prev) => ({
            ...prev,
            [combinedData[0].teamName]: profiles,
          }));
          setExpandedTeams({ [combinedData[0].teamName]: true });
        }

        setLoading(false);
      } catch (err) {
        console.error("Lỗi API:", err);
        setError(err.response?.data?.message || "Có lỗi xảy ra khi lấy dữ liệu.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Toggle mở rộng thông tin đội
  const toggleTeam = async (teamName, players) => {
    setExpandedTeams((prev) => ({
      ...prev,
      [teamName]: !prev[teamName],
    }));

    if (!playersData[teamName] && players.length > 0) {
      const profiles = await fetchPlayerProfiles(players);
      setPlayersData((prev) => ({
        ...prev,
        [teamName]: profiles,
      }));
    }
  };

  const getGridCols = (teamPlayers) => {
    if (!teamPlayers || teamPlayers.length === 0) return 1;
    if (isSmallScreen) return 3;
    return Math.min(teamPlayers.length); // Tối đa 5 cột
  };

  return (
    <div className="lg:px-32 md:px-20 px-2">
      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
          <span className="loading loading-dots loading-lg text-primary"></span>
        </div>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <>
          <div className="mt-32 flex lg:flex-row flex-col lg:gap-y-1 gap-y-2 items-center justify-center mb-2 gap-x-2">
            <h1 className="text-center font-bold text-3xl text-primary ">Bảng Xếp Hạng Các Đội </h1>
            <div class="badge badge-primary badge-outline p-2 mt-1 font-semibold">BETA</div></div>
          <div >
            <div className="max-w-[900px] justify-center flex flex-col mx-auto">
              <p>Hiii! Xin chào tất cả các bạn, chào mừng các bạn đã đến với bảng xếp hạng các đội, và đây là một số thông tin về bảng xếp hạng này nhé: </p>
              <ul class="list-disc">
                <li>Bảng xếp hạng này là BETA, nghĩa là đang trong quá trình thử nghiệm.</li>
                <li>Tất cả các đội đều có điểm khởi điểm ban đầu là 500. Điểm này cũng sẽ áp dụng cho các đội tham gia sau này.</li>
                <li>Điểm số cộng/trừ dựa trên khoảng cách thứ hạng giữa 2 đội đấu và số ván đấu thắng chênh lệch trong 1 trận</li>
                <li>Bảng xếp hạng này cũng sẽ áp dụng để xếp hạt giống cho các giải sau này.</li>
                <li>Ấn vào dòng của đội đó để hiện lineup. Riêng đội hạng nhất sẽ tự động hiện.</li>
                <li>Nếu muốn hiện Avatar thành viên như team with'u thì các bạn update ảnh đại diện ở tài khoản của mình. Lưu ý là tài khoản đó phải trùng IGN thì mới đổi được avatar.</li>
              </ul>
              <p> Mọi thông tin thắc mắc hay gợi ý hay về cách tính điểm (ELO) thì có thể nhắn lên kênh Suggestion hoặc nhắn riêng Beacon nhé. </p>
            </div>
          </div>
          <table
            border="1"
            cellPadding="4"
            className="font-semibold bg-white bg-opacity-20 rounded-lg mt-5 mb-10"
            style={{
              width: "100%",
              textAlign: "center",
            }}
          >
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="lg:w-[12%] w-[10%] py-3"></th>
                <th className="text-left py-3">Tên Đội</th>
                <th className="py-3">Điểm</th>
              </tr>
            </thead>
            <tbody className="pb-3 text-black">
              {rankings.map((team) => (
                <React.Fragment key={team._id}>
                  <tr
                    onClick={() => toggleTeam(team.teamName, team.players)}
                    className="bg-gray-200 hover:bg-gray-300 transition-all duration-300 cursor-pointer mb-10"
                  >
                    <td className="py-3">{team.rank}</td>
                    <td className="text-left flex items-center gap-x-6 py-3">
                      {team.logoUrl && (
                        <img
                          src={`https://drive.google.com/thumbnail?id=${team.logoUrl}`}
                          alt={team.teamName}
                          className="aspect-square lg:w-20 lg:h-20 w-12 h-12"
                        />
                      )}
                      <span>
                        {isSmallScreen
                          ? team.shortName.toUpperCase()
                          : team.teamName}
                      </span>
                    </td>
                    <td className="py-3">{team.points}</td>
                  </tr>

                  {expandedTeams[team.teamName] && (
                    <tr className="">
                      <td colSpan="3" className="bg-gray-50">
                        <div
                          style={{
                            gridTemplateColumns: `repeat(${getGridCols(
                              playersData[team.teamName]
                            )}, minmax(0, 1fr))`,
                          }}
                          className="grid gap-2 justify-items-center transition-all duration-500 ease-in-out lg:p-2 p-1"
                        >
                          {playersData[team.teamName]?.length > 0 ? (
                            playersData[team.teamName].map(
                              (player, idx) => (
                                <div
                                  key={idx}
                                  className="flex flex-col items-center"
                                >
                                  <img
                                    src={`https://drive.google.com/thumbnail?id=${player.avatar}`}
                                    alt={player.name}
                                    className="lg:w-20 lg:h-20 w-14 h-14 rounded-full"
                                  />
                                  <span className="lg:text-base text-[11.5px] mt-3">
                                    {player.name}
                                  </span>
                                </div>
                              )
                            )
                          ) : (
                            <span className="loading loading-dots loading-lg text-primary"></span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default PowerRankingAOV;
