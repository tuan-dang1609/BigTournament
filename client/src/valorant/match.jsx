import React, { useState, useEffect } from "react";
import Verify from '../image/verified-symbol-icon.png'
const columns = [
  { key: "name", label: "Người chơi" },
  { key: "acs", label: "ACS" },
  { key: "kda", label: "K/D/A" },
  { key: "stats.kills/stats.deaths", label: "KD" },
  { key: "stats.headshotPercentage", label: "HS%" },
  { key: "fk", label: "FK" },
  { key: "fd", label: "FD" },
  { key: "mk", label: "MK" },
];

const PlayerStats = ({ data, registeredPlayers, teamA, teamB }) => {
  const [selectedMap, setSelectedMap] = useState(null);

  const getVerificationStatus = (gameName, tagLine) => {
    if (!registeredPlayers || registeredPlayers.length === 0) return '';

    const normalizedId = `${gameName}#${tagLine}`.toLowerCase().trim();
    const player = registeredPlayers.find(p =>
      p.riotID.toLowerCase().trim() === normalizedId
    );

    return player?.isregistered ? <img src={Verify} className="w-4 h-4" /> : '';
  };


  const mapData = data.reduce((acc, match) => {
    const mapName = match.matchInfo?.mapName;
    acc[mapName] = true;
    return acc;
  }, {});


  useEffect(() => {
    if (!selectedMap && Object.keys(mapData).length > 0) {
      setSelectedMap(Object.keys(mapData)[0]);
    }
  }, [mapData]);
  const playerData = data.find(match =>
    match.matchInfo?.mapName === selectedMap
  ) || data[0];
  // Định nghĩa renderTable TRƯỚC khi sử dụng
  const getPlayerTeamName = (player) => {
    const normalizedId = `${player.gameName}#${player.tagLine}`.toLowerCase().trim();
    const registeredPlayer = registeredPlayers.find(rp =>
      rp.riotID.toLowerCase().trim() === normalizedId
    );
    return registeredPlayer?.teamname || null;
  };

  const renderTable = (teamData, teamColor) => {
    return (
      <div className="w-full overflow-x-auto shadow-lg rounded-lg mb-8">
        <table className="w-full min-w-max table-auto font-bold text-center">
          <thead>
            <tr className="uppercase text-sm leading-normal sticky top-0">
              {columns.map((column, index) => (
                <th
                  key={column.key}
                  className={`py-[6px] bg-[#362431] px-2 text-center text-[10.5px] xl:text-[10.75px] text-white transition-colors ${index === 0 ? `sticky left-0 z-10` : ""
                    }`}
                >
                  <div className="flex items-center justify-center">
                    <span>{column.label}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="xl:text-[10.75px] text-[10.5px]">
            {teamData.map((row, rowIndex) => {
              return (
                <tr
                  key={rowIndex}
                  className={`border-${teamColor}-200 hover:bg-${teamColor}-100 transition-colors`}
                >
                  {columns.map((column, columnIndex) => {
                    let cellData;
                    const columnKeys = column.key.split('.');

                    // Xử lý từng loại cột
                    switch (column.key) {
                      case "name":
                        cellData = (
                          <div className="flex items-center">
                            <img
                              src={row.imgCharacter}
                              alt={row.characterId}
                              className="w-8 h-8 rounded-full mr-2"
                            />
                            <span className="lg:flex lg:flex-row hidden">
                              {row.gameName}#{row.tagLine}
                              <span className="text-xs ml-1">
                                {getVerificationStatus(row.gameName, row.tagLine)}
                              </span>
                            </span>
                            <span className="lg:hidden flex flex-row">
                              {row.gameName}
                              <span className="text-xs ml-1">
                                {getVerificationStatus(row.gameName, row.tagLine)}
                              </span>
                            </span>
                          </div>
                        );
                        break;

                      case "performanceScore":
                        cellData = row.stats?.score || 'N/A';
                        break;

                      case "acs":
                        cellData = row.stats.roundsPlayed > 0
                          ? (row.stats.score / row.stats.roundsPlayed).toFixed(1)
                          : 'N/A';
                        break;

                      case "kda":
                        cellData = `${row.stats.kills || 0}/${row.stats.deaths || 0}/${row.stats.assists || 0}`;
                        break;

                      case "stats.kills/stats.deaths":
                        cellData = row.stats.deaths === 0
                          ? row.stats.kills
                          : (row.stats.kills / row.stats.deaths).toFixed(1);
                        break;

                      case "stats.headshotPercentage":
                        cellData = `${row.stats.headshotPercentage}%`;
                        break;

                      case "fk":
                        cellData = row.stats.firstKills;
                        break;
                      case "fd":
                        cellData = row.stats.firstKills;
                        break;
                      case "mk":
                        cellData = row.stats.multiKills;
                        break;

                      default:
                        // Xử lý các trường hợp nested object
                        cellData = columnKeys.reduce((acc, key) => {
                          if (acc && acc[key] !== undefined) return acc[key];
                          return 'N/A';
                        }, row);
                    }

                    return (
                      <td
                        key={`${rowIndex}-${column.key}`}
                        className={`py-2 px-3 text-center ${columnIndex === 0 ? "sticky left-0 z-10 bg-base-100" : ""
                          }`}
                        style={columnIndex === 0 ? {
                          width: '150px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        } : { width: '50px' }}
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
  };

  const renderMapTabs = () => (
    <div className="flex items-center justify-between !bg-[#362431] p-2 mb-2 mt-1">
      <span className="text-white text-[11px] font-bold mr-4">THÔNG SỐ</span>
      <div className="flex gap-2">
        {Object.keys(mapData).map((mapName) => {
          // Tìm match tương ứng với mapName
          const matchForTab = data.find(
            (match) => match.matchInfo?.mapName === mapName
          );

          let scoreDisplay = "";
          if (matchForTab && matchForTab.teams) {
            // Lấy teamId thực tế của teamA và teamB
            const sortedPlayers = matchForTab.players.reduce((acc, player) => {
              const playerTeamName = getPlayerTeamName(player);
              if (playerTeamName) {
                acc[playerTeamName] = player.teamId;
              }
              return acc;
            }, {});

            // Xác định đúng teamName cho Red và Blue
            let actualTeamA = Object.keys(sortedPlayers).find(
              (team) => sortedPlayers[team] === "Red"
            ) || "Đội Đỏ";

            let actualTeamB = Object.keys(sortedPlayers).find(
              (team) => sortedPlayers[team] === "Blue"
            ) || "Đội Xanh";

            // Lấy điểm số đúng của từng team
            const redTeam = matchForTab.teams.find(team => team.teamId === "Red");
            const blueTeam = matchForTab.teams.find(team => team.teamId === "Blue");

            let scoreA = redTeam ? redTeam.roundsWon : 0;
            let scoreB = blueTeam ? blueTeam.roundsWon : 0;

            // Đảm bảo teamA luôn nằm bên trái và teamB bên phải
            if (actualTeamA !== teamA) {
              // Hoán đổi nếu teamA không khớp với actualTeamA
              [actualTeamA, actualTeamB] = [actualTeamB, actualTeamA];
              [scoreA, scoreB] = [scoreB, scoreA];
            }

            scoreDisplay = `${scoreA} - ${scoreB}`;
          }

          return (
            <button
              key={mapName}
              onClick={() => setSelectedMap(mapName)}
              className={`px-4 py-2 text-[10px] font-bold rounded ${selectedMap === mapName ? "bg-white text-black" : "bg-[#4A374A] text-white"
                }`}
            >
              {mapName.toUpperCase()} ({scoreDisplay})
            </button>
          );
        })}
      </div>
    </div>
  );
  return (
    <>{renderMapTabs()}
      <div className="w-full overflow-x-auto flex flex-col xl:flex-row gap-x-7">
        {playerData?.players && (
          <>
            <div className="w-full xl:w-[49%]">
              {renderTable(
                playerData.players.filter(p => {
                  const playerTeamName = getPlayerTeamName(p);

                  // Nếu có teamname, nhóm vào đúng teamname
                  if (playerTeamName === teamA) return true;

                  // Nếu không có teamname, nhóm vào team có cùng teamId với teamA
                  return playerTeamName === null &&
                    playerData.players.some(player =>
                      getPlayerTeamName(player) === teamA && player.teamId === p.teamId
                    );
                }),
                "red"
              )}
            </div>
            <div className="w-full xl:w-[49%]">
              {renderTable(
                playerData.players.filter(p => {
                  const playerTeamName = getPlayerTeamName(p);

                  // Nếu có teamname, nhóm vào đúng teamname
                  if (playerTeamName === teamB) return true;

                  // Nếu không có teamname, nhóm vào team có cùng teamId với teamB
                  return playerTeamName === null &&
                    playerData.players.some(player =>
                      getPlayerTeamName(player) === teamB && player.teamId === p.teamId
                    );
                }),
                "blue"
              )}
            </div>
          </>
        )}
      </div>
    </>

  );
};

export default PlayerStats;