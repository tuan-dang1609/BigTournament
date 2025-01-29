import React, { useState, useRef, useEffect } from "react";
import playerData from "./test.json"

// Define the columns for the table
const columns = [
    { key: "name", label: "Người chơi" },
    { key: "performanceScore", label: "Score" },
    { key: "acs", label: "ACS" },
    { key: "kda", label: "K/D/A" },
    { key: "stats.kills/stats.deaths", label: "KD" },
    { key: "stats.headshotPercentage", label: "HS%" },
    { key: "adr", label: "ADR" },
    { key: "fk", label: "FK" },
    { key: "mk", label: "MK" },
];

const PlayerStats = () => {
    const [imageUrls, setImageUrls] = useState({});
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
    // Function to calculate the player stats
    const calculatePlayerStats = (player) => {
        const { puuid } = player;
        let firstKills = 0;
        let multiKills = 0;
        let totalDamage = 0;
        let headshots = 0;
        let bodyshots = 0;
        let legshots = 0;
        const gameName = player.gameName; // Truy cập trực tiếp từ player
        const tagName = player.tagLine;  // Truy cập trực tiếp từ player
        const roundPlayed = playerData.teams[0].roundsPlayed;
    
        playerData.roundResults.forEach((round) => {
            const stats = round.playerStats.find((stat) => stat.puuid === puuid);
            if (stats) {
                const firstKillInRound = stats.kills.find(
                    (kill) =>
                        kill.killer === puuid &&
                        kill.timeSinceRoundStartMillis ===
                        Math.min(
                            ...round.playerStats.flatMap((stat) =>
                                stat.kills.map((k) => k.timeSinceRoundStartMillis)
                            )
                        )
                );
                if (firstKillInRound) {
                    firstKills += 1;
                }
    
                if (stats.kills.length >= 3) {
                    multiKills += 1;
                }
    
                stats.damage.forEach((dmg) => {
                    totalDamage += dmg.damage;
                    headshots += dmg.headshots;
                    bodyshots += dmg.bodyshots;
                    legshots += dmg.legshots;
                });
            }
        });
    
        const totalShots = headshots + bodyshots + legshots;
        const headshotPercentage = totalShots > 0 ? ((headshots / totalShots) * 100).toFixed(0) : 0;
    
        return { tagName, gameName, roundPlayed, firstKills, multiKills, totalDamage, headshots, bodyshots, legshots, headshotPercentage };
    };

    const renderTable = (teamData, teamColor) => (
        <div className="w-full overflow-x-auto shadow-lg rounded-lg mb-8">
            <table className="w-full min-w-max table-auto font-bold text-center">
                <thead>
                    <tr className="uppercase text-sm leading-normal sticky top-0">
                        {columns.map((column, index) => (
                            <th
                                key={column.key}
                                className={`py-[6px] bg-[#362431] px-2 text-center text-[10.5px] xl:text-[10.75px] text-white hover:bg-${teamColor}-200 transition-colors ${index === 0 ? `sticky left-0 z-10 bg-${teamColor}-100` : ""}`}
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
                        // Get the player stats for the current row
                        const stats = calculatePlayerStats(row);

                        return (
                            <tr key={rowIndex} className={`border-${teamColor}-200 hover:bg-${teamColor}-100 transition-colors`}>
                                {columns.map((column, columnIndex) => {
                                    let cellData;

                                    // Handle specific columns based on their keys
                                    if (column.key === "performanceScore") {
                                        cellData = row.performanceScore;

                                    }
                                    else if (column.key === "acs") {
                                        cellData = (row.stats.score / stats.roundplayed).toFixed(1); // ADR = totalDamage / roundsPlayed
                                    }
                                    else if (column.key === "kda") {
                                        cellData = `${row.stats.kills}/${row.stats.deaths}/${row.stats.assists}`;
                                    } else if (column.key === "stats.headshotPercentage") {
                                        cellData = stats.headshotPercentage;
                                    } else if (column.key === "stats.kills/stats.deaths") {
                                        const kills = row.stats.kills;
                                        const deaths = row.stats.deaths;
                                        cellData = deaths === 0 ? kills : (kills / deaths).toFixed(1); // KD ratio
                                    } else if (column.key === "adr") {
                                        cellData = (stats.totalDamage / stats.roundplayed).toFixed(1); // ADR = totalDamage / roundsPlayed
                                    } else if (column.key === "fk") {
                                        cellData = stats.firstKills;
                                    } else if (column.key === "mk") {
                                        cellData = stats.multiKills;
                                    } else {
                                        // Fallback for other columns if not handled
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
                                                    <span>{row.gameName}#{row.tagLine}</span>
                                                </div>
                                            ) : (
                                                cellData
                                            )}
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


    // Group players by teamId
    const team1Data = playerData.players.filter(player => player.teamId === "Red");
    const team2Data = playerData.players.filter(player => player.teamId === "Blue");

    return (
        <div>
            <h1>Player Stats</h1>
            {/* Render tables for Team 1 and Team 2 */}
            {renderTable(team1Data, "team1Color")}
            {renderTable(team2Data, "team2Color")}
        </div>
    );
};

export default PlayerStats;
