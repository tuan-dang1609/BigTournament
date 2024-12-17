import React, { useEffect, useState } from "react";
import axios from "axios";

const PowerRankingAOV = () => {
  const [rankings, setRankings] = useState([]); // Lưu trữ bảng xếp hạng
  const [loading, setLoading] = useState(true); // Trạng thái loading
  const [error, setError] = useState(null); // Lưu lỗi (nếu có)

  // Gọi API để lấy dữ liệu bảng xếp hạng
  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const response = await axios.post("https://dongchuyennghiep-backend.vercel.app/api/auth/powerrankingaov"); // URL API
        setRankings(response.data.data); // Cập nhật dữ liệu
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Có lỗi xảy ra khi lấy dữ liệu.");
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
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
            <tr style={{ backgroundColor: "#f4f4f4" }}>
              <th>Hạng</th>
              <th>Tên Đội</th>
              <th>Logo</th>
              <th>Điểm</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((team, index) => (
              <tr key={team._id}>
                <td>{index + 1}</td>
                <td>{team.teamName}</td>
                <td>
                  {team.teamLogo ? (
                    <img
                      src={team.teamLogo}
                      alt={team.teamName}
                      width="50"
                      height="50"
                      style={{ borderRadius: "50%" }}
                    />
                  ) : (
                    "N/A"
                  )}
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
