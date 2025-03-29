import React, { useEffect, useState } from "react";
import UNRANKED from '../ranklol/Unranked.png'
import axios from "axios";
import IRON from '../ranklol/Iron.png'
import BRONZE from '../ranklol/Bronze.png'
import SILVER from '../ranklol/Silver.png'
import GOLD from '../ranklol/Gold.png'
import PLATINUM from '../ranklol/Platinum.png'
import EMERALD from '../ranklol/Emerald.png'
import DIAMOND from '../ranklol/Diamond.png'
import MASTER from '../ranklol/Master.png'
import GRANDMASTER from '../ranklol/Grandmaster.png'
import CHALLENGER from '../ranklol/Challenger.png'
const PowerRankingTFTDouble = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allTeams, setAllTeams] = useState([]);

  useEffect(() => {
    const scrollToTop = () => {
      document.documentElement.scrollTop = 0;
    };
    setTimeout(scrollToTop, 0);
    document.title = "Bảng xếp hạng";
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allTeamResponse = await axios.post(
          "https://bigtournament-hq9n.onrender.com/api/auth/findallteamTFTDouble"
        );
        const allTeams = allTeamResponse.data;

        const rankedTeams = await Promise.all(
          allTeams.map(async (team) => {
            const rankResponse = await axios.post(
              "https://bigtournament-hq9n.onrender.com/api/auth/tft_double_rank",
              team
            );
            const rankData = rankResponse.data;

            // Assuming rankData contains an average rank object
            const averageRank = rankData.find(
              (entry) => entry.queueType === "RANKED_TFT_DOUBLE_UP_AVERAGE"
            );

            return {
              ...team,
              averageRank: averageRank || null,
            };
          })
        );

        setAllTeams(rankedTeams);
        setLoading(false);
      } catch (err) {
        console.error("Lỗi API:", err);
        setError(err.response?.data?.message || "Có lỗi xảy ra khi lấy dữ liệu.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
          <div className="lg:mt-32 mt-24 flex lg:flex-row flex-col lg:gap-y-1 gap-y-2 items-center justify-center mb-2 gap-x-2">
            <h1 className="text-center font-bold text-3xl text-primary">
              Bảng Xếp Hạng Các Đội
            </h1>
            <div className="badge badge-primary badge-outline p-2 mt-1 font-bold">
              BETA
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
                <th className="lg:w-[12%] w-[10%] py-3">Rank</th>
                <th className="text-left py-3">Tên Đội</th>
                <th className="text-left py-3">Thắng-Thua</th>
                <th className="text-left py-3">Tỉ lệ thắng</th>
                <th className="py-3">Cấp Bậc</th>
              </tr>
            </thead>
            <tbody className="pb-3 bg-base-100 text-base-content">
              {allTeams.map((team, index) => (
                <tr key={team._id}>
                  <td>{index + 1}</td>
                  <td className="text-left ">
                    <div className="flex flex-row">
                      <img
                        src={`https://drive.google.com/thumbnail?id=${team.logoUrl}`}
                        alt={`${team.teamName} logo`}
                        className="w-12 h-12 rounded-full mr-3"
                      />
                      <p className="flex items-center lg:text-[15px] text-[12px]">{team.teamName}</p>
                    </div>
                  </td>
                  <td className="items-center ">

                    <div className="flex lg:flex-row items-center justify-center">
                      {team.averageRank ? (
                        <>
                          <p className="flex items-center w-full lg:text-[15px] font-semibold text-[12px]">
                            {team.averageRank.wins}W - {team.averageRank.losses}L
                          </p>

                        </>
                      ) : (
                        "0"
                      )}
                    </div>
                  </td>
                  <td className="items-center ">

                    <div className="flex lg:flex-row items-center justify-center">
                      {team.averageRank ? (
                        <>
                          <p className="flex items-center w-full lg:text-[15px] font-semibold text-[12px]">
                            {(team.averageRank.losses + team.averageRank.wins === 0
                              ? 0
                              : ((team.averageRank.wins * 100) / (team.averageRank.losses + team.averageRank.wins)).toFixed(1))} %
                          </p>

                        </>
                      ) : (
                        "0"
                      )}
                    </div>
                  </td>
                  <td className="items-center">

                    <div className="lg:flex lg:flex-row items-center justify-center">
                      {team.averageRank ? (
                        <div className="flex lg:flex-row flex-col mx-auto">
                          <img
                            src={
                              {
                                IRON,
                                BRONZE,
                                SILVER,
                                GOLD,
                                PLATINUM,
                                EMERALD,
                                DIAMOND,
                                MASTER,
                                GRANDMASTER,
                                CHALLENGER,
                              }[team.averageRank.tier] || UNRANKED // Default to Iron if rank is missing
                            }
                            alt={`${team.averageRank.tier} Rank`}
                            className="lg:w-14 lg:h-14 w-16 h-16 lg:mr-2"
                          />
                          <p className="flex items-center lg:text-[15px] font-semibold text-[10.5px] lg:w-[180px]">
                            {team.averageRank.tier} {team.averageRank.rank} {team.averageRank?.leaguePoints || ""} LP
                          </p>

                        </div>
                      ) : (
                        "N/A"
                      )}
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default PowerRankingTFTDouble;
