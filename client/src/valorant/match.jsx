import React, { useState, useRef, useEffect } from "react";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";

function FeatureRichTable({ matchInfo, numRound, kill, error }) {
  const [data, setData] = useState([]);
  const [sortColumn, setSortColumn] = useState("acs");
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
      const sortedData = [...matchInfo].sort((a, b) => {
        const aAcs = a.stats.score / numRound;
        const bAcs = b.stats.score / numRound;
        if (aAcs < bAcs) return 1;
        if (aAcs > bAcs) return -1;
        return 0;
      });
      setData(sortedData);
    }
  }, [matchInfo, numRound]);

  const handleSort = (column) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }

    const sortedData = [...data].sort((a, b) => {
      let aValue = a;
      let bValue = b;

      if (column === "acs") {
        aValue = a.stats.score / numRound;
        bValue = b.stats.score / numRound;
      } else if (column === "adr") {
        aValue = a.stats.damage.dealt / numRound;
        bValue = b.stats.damage.dealt / numRound;
      } else {
        column.split('.').forEach(key => {
          aValue = aValue ? aValue[key] : 'N/A';
          bValue = bValue ? bValue[key] : 'N/A';
        });
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    setData(sortedData);
  };

  const columns = [
    { key: "name", label: "Player" },
    { key: "acs", label: "ACS" },
    { key: "stats.kills", label: "K" },
    { key: "stats.deaths", label: "D" },
    { key: "stats.assists", label: "A" },
    { key: "stats.headshots", label: "HS" },
    { key: "adr", label: "ADR" },
    { key: "fk", label: "FK" },
    { key: "mk", label: "MK" },
  ];

  const renderTable = (teamData, teamColor) => (
    <div ref={tableRef} className="w-full overflow-x-auto shadow-lg rounded-lg mb-8">
      <table className="w-full min-w-max table-auto font-bold text-center ">
        <thead>
          <tr className={`uppercase text-sm leading-normal sticky top-0`}>
            {columns.map((column, index) => (
              <th
                key={column.key}
                className={`py-[6px] bg-[#362431] px-2 text-center text-[10.5px] text-white cursor-pointer hover:bg-${teamColor}-200 transition-colors ${index === 0 ? "sticky left-0 z-10 bg-${teamColor}-100" : ""}`}
                onClick={() => handleSort(column.key)}
                style={index === 0 ? { width: '190px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : { width: '10px' }} // Set width for non-first columns
              >
                <div className="flex items-center justify-center">
                  <span>{column.label}</span>
                  <span className="ml-1">
                    {sortColumn === column.key ? (
                      sortDirection === "asc" ? (
                        <FaSortUp className={`text-${teamColor}-500`} />
                      ) : (
                        <FaSortDown className={`text-${teamColor}-500`} />
                      )
                    ) : (
                      <FaSort className={`text-${teamColor}-300`} />
                    )}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`text-[10.5px]`}>
          {teamData.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`border-${teamColor}-200 hover:bg-${teamColor}-100 transition-colors`}
            >
              {columns.map((column, columnIndex) => {
                let cellData;

                if (column.key === "acs") {
                  cellData = (row.stats.score / numRound).toFixed(0);
                } else if (column.key === "adr") {
                  cellData = (row.stats.damage.dealt / numRound).toFixed(0);
                } else {
                  const columnKeys = column.key.split('.');
                  cellData = row;
                  columnKeys.forEach(key => {
                    cellData = cellData ? cellData[key] : 'N/A';
                  });
                }

                return (
                  <td
                    key={`${rowIndex}-${column.key}`}
                    className={`py-2 px-3 text-center ${columnIndex === 0 ? "sticky left-0 z-10 bg-base-100" : ""}`}
                    style={columnIndex === 0 ? { width: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : { width: '50px' }} // Set width for non-first columns
                  >
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
