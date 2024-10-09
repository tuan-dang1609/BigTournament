import React, { useState, useRef, useEffect } from "react";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";

function FeatureRichTable({ matchInfo, numRound, kill, error }) {
  const [data, setData] = useState([]);
  const [sortColumn, setSortColumn] = useState("performanceScore");
  const [sortDirection, setSortDirection] = useState("desc");
  const tableRef = useRef(null);
  const [imageUrls, setImageUrls] = useState({});
  const images = import.meta.glob('../agent/*.{png,jpg,jpeg,gif}');

  useEffect(() => {
    const loadImageUrls = async () => {
      const urls = {};
      await Promise.all(Object.entries(images).map(async ([path, resolver]) => {
        try {
          const module = await resolver();
          const filename = path.split('/').pop().split('.')[0];
          urls[filename.replace('%2F', '/')] = module.default;
        } catch (error) {
          console.error(`Failed to load image at ${path}`, error);
        }
      }));
      setImageUrls(urls);
    };
    loadImageUrls();
  }, []);

  useEffect(() => {
    if (matchInfo) {
      const maxScore = Math.max(...matchInfo.map(player => player.stats.score));
      const maxKills = Math.max(...matchInfo.map(player => player.stats.kills));
      const maxDamage = Math.max(...matchInfo.map(player => player.stats.damage.dealt));

      // Normalize each player's score, kills, and damage dealt between 0 and 1
      const normalizedData = matchInfo.map(player => {
        const normalizedScore = player.stats.score / maxScore;
        const normalizedKills = player.stats.kills / maxKills;
        const normalizedDamage = player.stats.damage.dealt / maxDamage;

        const acs = player.stats.score / numRound;
        const performanceScore = (
          (normalizedScore + normalizedKills + normalizedDamage) / 3
        ) * 10; // Scale the average of normalized values to 0-10

        return {
          ...player,
          acs: acs.toFixed(0),
          performanceScore: performanceScore.toFixed(1),
        };
      }).sort((a, b) => b.acs - a.acs);

      setData(normalizedData);
    }
  }, [matchInfo, numRound, kill]);

  const handleSort = (column) => {
    if (column !== "acs") {
      return; // Disable sorting for all columns except "acs"
    }
  
    // Toggle sort direction for the "acs" column
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  
    const sortedData = [...data].sort((a, b) => {
      let aValue = a[column];
      let bValue = b[column];
  
      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  
    setData(sortedData);
  };
  

  const columns = [
    { key: "name", label: "Player" },
    { key: "performanceScore", label: "Score" },
    { key: "acs", label: "ACS" },
    { key: "stats.kills", label: "K" },
    { key: "stats.deaths", label: "D" },
    { key: "stats.assists", label: "A" },
    { key: "stats.kills/stats.deaths", label: "KD" },
    { key: "stats.headshots", label: "HS%" },
    { key: "adr", label: "ADR" },
    { key: "fk", label: "FK" },
    { key: "mk", label: "MK" },
  ];

  const renderTable = (teamData, teamColor) => (
    <div ref={tableRef} className="w-full overflow-x-auto shadow-lg rounded-lg mb-8">
      <table className="w-full min-w-max table-auto font-bold text-center">
        <thead>
          <tr className={`uppercase text-sm leading-normal sticky top-0`}>
            {columns.map((column, index) => (
              <th
                key={column.key}
                className={`py-[6px] bg-[#362431] px-2 text-center text-[10.5px] text-white cursor-pointer hover:bg-${teamColor}-200 transition-colors ${index === 0 ? "sticky left-0 z-10 bg-${teamColor}-100" : ""}`}
                onClick={() => handleSort(column.key)}
                style={index === 0 ? { width: '190px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : { width: '10px' }}
              >
                <div className="flex items-center justify-center">
                  <span>{column.label}</span>
                  
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`text-[10.5px]`}>
          {teamData.map((row, rowIndex) => (
            <tr key={rowIndex} className={`border-${teamColor}-200 hover:bg-${teamColor}-100 transition-colors`}>
              {columns.map((column, columnIndex) => {
                let cellData;

                if (column.key === "acs" || column.key === "performanceScore") {
                  cellData = row[column.key];
                } else if (column.key === "adr") {
                  cellData = (row.stats.damage.dealt / numRound).toFixed(0);
                } 
                else if (column.key === "stats.kills/stats.deaths") {
                  // Calculate the KD ratio
                  const kills = row.stats.kills;
                  const deaths = row.stats.deaths;
                  cellData = deaths === 0 ? kills : (kills / deaths).toFixed(1);
                }
                else {
                  const columnKeys = column.key.split('.');
                  cellData = row;
                  columnKeys.forEach(key => {
                    cellData = cellData ? cellData[key] : 'N/A';
                  });
                }

                return (
                  <td key={`${rowIndex}-${column.key}`} className={`py-2 px-3 text-center ${columnIndex === 0 ? "sticky left-0 z-10 bg-base-100" : ""}`} style={columnIndex === 0 ? { width: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : { width: '50px' }}>
                    {column.key === "name" ? (
                      <div className="flex items-center">
                        <img
                          src={imageUrls[row.agent.name]}
                          alt={row.agent.name}
                          className="w-8 h-8 rounded-full mr-2"
                        />
                        <span>{row.name}#{row.tag}</span>
                      </div>
                    ) : (
                      cellData
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (error) {
    return <div className="text-red-500 text-center">Error: {error}</div>;
  }

  const redTeam = data.filter(player => player.team_id === "Red");
  const blueTeam = data.filter(player => player.team_id === "Blue");

  return (
    <div className="w-full overflow-x-auto flex flex-col xl:flex-row gap-5">
      <div className="w-full xl:w-[49%]">
        <h3 className="text-xl font-bold mb-2 text-red-600">Red Team</h3>
        {renderTable(redTeam, "red")}
      </div>
      <div className="w-full xl:w-[49%]">
        <h3 className="text-xl font-bold mb-2 text-blue-600">Blue Team</h3>
        {renderTable(blueTeam, "blue")}
      </div>
    </div>
  );
}

export default FeatureRichTable;
