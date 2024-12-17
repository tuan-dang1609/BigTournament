import React, { useEffect, useState } from "react";
import axios from "axios";

const PowerRankingAOV = () => {
  const [rankings, setRankings] = useState([]); // Dữ liệu bảng xếp hạng
  const [loading, setLoading] = useState(true); // Trạng thái loading
  const [error, setError] = useState(null); // Trạng thái lỗi

  useEffect(() => {
    const fetchData = async () => {
      try {
          const rankingResponse = await axios.post(
            "https://dongchuyennghiep-backend.vercel.app/api/auth/powerrankingaov"
          );
      
          const allTeamResponse = await axios.post(
            "https://dongchuyennghiep-backend.vercel.app/api/auth/allteamAOVcolor"
          );
      
          const rankingsData = rankingResponse.data.data; // Dữ liệu bảng xếp hạng
          const allTeams = allTeamResponse.data; // Dữ liệu tất cả đội và logo
      
          // Kết hợp dữ liệu
          const combinedData = rankingsData.map((team) => {
            const matchedTeam = allTeams.find(
              (t) => t.teamName === team.teamName
            );
            return {
              ...team,
              logoUrl: matchedTeam ? matchedTeam.logoUrl : null,
            };
          });
      
          setRankings(combinedData);
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
    <div className="mt-40" style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Bảng Xếp Hạng Liên Quân Mobile</h1>
      
      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <table
          border="1"
          cellPadding="10"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "center",
          }}
        >
          <thead>
            <tr>
              <th>Hạng</th>
              <th className="text-left">Tên Đội</th>
              <th>Điểm</th>
            </tr>
          </thead>
          <tbody>
  {rankings.map((team, index) => (
    <tr key={team._id}>
      <td>{index + 1}</td>
      <td className="items-center flex text-left gap-x-6">
        {team.logoUrl && (
          <img
            src={`https://drive.google.com/thumbnail?id=${team.logoUrl}`}
            alt={team.teamName}
            className="aspect-square w-16 h-16"
          />
        )}
        <span>{team.teamName}</span>
      </td>
      <td>{team.points}</td>
    </tr>
  ))}
</tbody>

        </table>
      )}
    </div>
  );
};

export default PowerRankingAOV;
