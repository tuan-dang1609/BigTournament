import React, { useEffect } from "react";

function FeatureRichTable({ matchInfo, opponentInfo, error }) {
  const leftTeamData = [...(matchInfo || [])].sort((a, b) => (parseFloat(b.point) || 0) - (parseFloat(a.point) || 0));
  const rightTeamData = [...(opponentInfo || [])].sort((a, b) => (parseFloat(b.point) || 0) - (parseFloat(a.point) || 0));

  const columns = [
    { key: "IGN", label: "Người chơi" },
    { key: "point", label: "Score" },
    { key: "K", label: "K" },
    { key: "D", label: "D" },
    { key: "A", label: "A" },
    { key: "K/D", label: "K/D" },
    { key: "KP", label: "KP" },
    { key: "Gold", label: "🪙" }
  ];

  // Tính tổng K và A cho từng team
  const calculateTeamStats = (teamData) => {
    return teamData.reduce(
      (acc, player) => {
        acc.totalK += parseFloat(player.K) || 0;
        acc.totalA += parseFloat(player.A) || 0;
        return acc;
      },
      { totalK: 0, totalA: 0 }
    );
  };

  const leftTeamStats = calculateTeamStats(leftTeamData);
  const rightTeamStats = calculateTeamStats(rightTeamData);

  const renderTable = (teamData, teamName, teamColor, teamStats) => (
    <div className="w-full overflow-x-auto shadow-lg rounded-lg mb-8">
      <table className="w-full min-w-max table-auto font-bold text-center">
        <thead>
          <tr className="uppercase text-sm leading-normal sticky top-0">
            {columns.map((column, index) => (
              <th
                key={column.key}
                className={`py-[6px] bg-[#362431] px-2 text-center text-[10.5px] xl:text-[11.5px] text-white ${index === 0 ? "sticky left-0 z-10" : ""}`}
                style={index === 0 ? { width: '185px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : { width: '10px' }}
              >
                <span>{column.label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="xl:text-[11px] text-[10.5px] ">
          {teamData.map((row, rowIndex) => {
            const K = parseFloat(row.K) || 0;
            const A = parseFloat(row.A) || 0;

            const kastPercentage = teamStats.totalK > 0
              ? ((K + A) * 100 / teamStats.totalK).toFixed(1)
              : "N/A";

            return (
              <tr key={rowIndex} className={`hover:bg-${teamColor}-100 transition-colors`}>
                {columns.map((column, columnIndex) => {
                  let cellData;

                  if (column.key === "K/D") {
                    const kills = parseFloat(row.K);
                    const deaths = parseFloat(row.D);
                    cellData = deaths === 0 ? kills : (kills / deaths).toFixed(1);
                  } else if (column.key === "KP") {
                    cellData = `${kastPercentage}%`;
                  } else {
                    cellData = row[column.key] || "0";
                  }

                  return (
                    <td
                      key={`${rowIndex}-${column.key}`}
                      className={`first:text-left py-3 px-3 text-center ${columnIndex === 0 ? "sticky left-0 z-10 bg-base-100" : ""}`}
                      style={columnIndex === 0 ? { width: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : { width: '50px' }}
                    >
                      {cellData}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  if (error) {
    return <div className="text-red-500 text-center">Lỗi data hoặc do trận đấu chưa diễn ra. Các bạn quay lại sau nhé.</div>;
  }

  return (
    <div className="w-full overflow-x-auto flex flex-col xl:flex-row gap-x-7">
      <div className="w-full xl:w-[49%]">
        {renderTable(leftTeamData, "Team A - Perfect Vision", "red", leftTeamStats)}
      </div>
      <div className="w-full xl:w-[49%]">
        {renderTable(rightTeamData, "Team B - With'u", "blue", rightTeamStats)}
      </div>
    </div>
  );
}

export default FeatureRichTable;
