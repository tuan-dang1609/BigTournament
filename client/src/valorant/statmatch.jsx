import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MatchResult from "./match";

export default function MatchStat() {
    const { round, Match } = useParams();
    const [matchid, setMatchid] = useState([]);
    const [mapData, setMapData] = useState({});
    const [dictionary, setDictionary] = useState({});
    const [matchInfo, setMatchInfo] = useState([]);
    const [error, setError] = useState(null);
    const [numRound, setNumRound] = useState(null);
    const [kill, setAllKill] = useState([]);
    const [score, setScore] = useState([]);
    const [time, setTime] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMap, setSelectedMap] = useState(null);
    useEffect(() => {
        // Fetch dictionary data
        const fetchDictionary = async () => {
            try {
                const response = await fetch('https://dongchuyennghiep-backend.vercel.app/api/valorant/dictionary');
                const data = await response.json();
                setDictionary(data.maps || []);
            } catch (error) {
                console.error('Error fetching maps:', error);
            }
        };

        fetchDictionary();
    }, []);
    const fetchGames = async () => {
        try {
            const response = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/findmatchid', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    round: round,
                    Match: Match
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setMatchid(data.matchid);
        } catch (error) {
            console.error("Failed to fetch game:", error);
        }
    };
    useEffect(() => {
        const scrollToTop = () => {
            document.documentElement.scrollTop = 0;
            setLoading(false);
        };
        setTimeout(scrollToTop, 0);
        document.title = "Giải Liên Quân Mobile DCN";

    }, []);
    useEffect(() => {
        fetchGames();
    }, [round, Match]);

    useEffect(() => {
        if (matchid.length > 0) {
            Promise.all(
                matchid.map(async id => {
                    try {
                        const res = await fetch(`https://dongchuyennghiep-backend.vercel.app/api/valorant/match/${id}`);
                        console.log(`Raw response for match ${id}:`, res); // In toàn bộ phản hồi
                        if (!res.ok) {
                            throw new Error(`HTTP error! status: ${res.status}`);
                        }
                        const data = await res.json();
                        return {
                            data: data
                        };
                    } catch (err) {
                        console.error(`Error fetching match ${id}:`, err);
                        return null;
                    }
                })
            )
                .then(responses => {
                    const validResponses = responses.filter(response => response !== null);
                    setMapData(validResponses);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("Error in Promise.all:", err);
                    setError(err.message);
                    setIsLoading(false);
                });
        }
    }, [matchid]);



    const formatTime = (utcTime) => {
        const date = new Date(utcTime);

        const time = date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        const day = date.getDate();
        const month = date.toLocaleString('en-US', { month: 'short' });
        const year = date.getFullYear();
        const daySuffix = getDaySuffix(day);

        return `${time} - ${day}${daySuffix} ${month} ${year}`;
    };

    const getDaySuffix = (day) => {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    };

    const RenderMapTabs = ({ mapData, mapsDictionary }) => {
        const [selectedMap, setSelectedMap] = useState("");

        // Lấy danh sách mapId duy nhất từ mapData
        const mapIds = [...new Set(mapData.map(match => match.data.matchInfo.mapId))];


        // Ánh xạ mapId sang tên thân thiện bằng mapsDictionary
        const getMapName = (mapId) => {
            const mapInfo = mapsDictionary.find(map => map.assetPath === mapId);
            return mapInfo ? mapInfo.name : "Unknown Map";

        };

        // Cập nhật selectedMap với map đầu tiên khi component mount
        useEffect(() => {
            if (mapIds.length > 0) {
                setSelectedMap(mapIds[0]);
            }
        }, [mapIds]);

        return (
            <div className="flex items-center justify-between bg-[#362431] p-2 mb-2">
                <span className="text-white text-[11px] font-bold mr-4">MATCH STATS</span>
                <div className="flex gap-2">
                    {mapIds.map((mapId) => (
                        <button
                            key={mapId}
                            onClick={() => setSelectedMap(mapId)}
                            className={`px-4 py-2 text-[11px] font-bold rounded transition-colors duration-300 ${selectedMap === mapId ? 'bg-white text-black' : 'bg-[#4A374A] text-white hover:bg-[#5C3F5C] hover:text-gray-300'
                                }`}
                        >
                            {getMapName(mapId).toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const PlayerTable = ({ players }) => {
        // Nhóm các player theo teamId
        const teams = players.reduce((acc, player) => {
            if (!acc[player.teamId]) {
                acc[player.teamId] = [];
            }
            acc[player.teamId].push(player);
            return acc;
        }, {});

        // Sắp xếp các đội, Blue trước Red
        const sortedTeams = ['Blue', 'Red', ...Object.keys(teams).filter(teamId => teamId !== 'Blue' && teamId !== 'Red')];

        return (
            <div className="overflow-x-auto">
                {sortedTeams.map((teamId) => (
                    <div key={teamId} className="mb-4">
                        <h2 className="text-lg font-bold">{teamId} Team</h2>
                        <table className="min-w-full table-auto text-base-content lg:w-full w-[280%] font-semibold">
                            <thead className="bg-[#362431] text-white">
                                <tr>
                                    <th className="p-2 bg-[#362431] sticky left-0 z-10 lg:!w-[270px] !w-[180px]">Game Name</th>
                                    <th className="p-2">Score</th>
                                    <th className="p-2">Kills</th>
                                    <th className="p-2">Deaths</th>
                                    <th className="p-2">Assists</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teams[teamId].map((player) => (
                                    <tr key={player.puuid}>
                                        <td className="p-2 lg:!w-[270px] !w-[180px] sticky left-0 bg-base-100 z-10">{player.gameName}#{player.tagLine}</td>
                                        <td className="p-2">{(player.stats.score / player.stats.roundsPlayed).toFixed(0)}</td>
                                        <td className="p-2">{player.stats.kills}</td>
                                        <td className="p-2">{player.stats.deaths}</td>
                                        <td className="p-2">{player.stats.assists}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        );
    };
    const PlayerHeadshots = ({ roundResults }) => {
        // Hàm tính tổng headshots cho mỗi player
        const calculateHeadshots = (playerStats) => {
            const headshotsMap = {};

            // Duyệt qua tất cả các phần tử trong playerStats
            playerStats.forEach((stat) => {
                const { receiver, headshots } = stat;
                // Cộng headshots vào người chơi tương ứng
                if (!headshotsMap[receiver]) {
                    headshotsMap[receiver] = 0;
                }
                headshotsMap[receiver] += headshots;
            });

            return headshotsMap;
        };

        const headshots = calculateHeadshots(roundResults.playerStats);

        return (
            <div className="data-output">
                <pre>{JSON.stringify(headshots, null, 2)}</pre>
            </div>
        );
    };
    const calculateFKAndMK = (players, kills) => {
        const fkMap = {};
        const mkMap = {};

        players.forEach(player => {
            fkMap[player.puuid] = 0;
            mkMap[player.puuid] = 0;
        });

        const roundKillCount = {};

        kills.forEach(killEvent => {
            const { killer, round } = killEvent;

            if (!roundKillCount[round]) {
                roundKillCount[round] = {};
                fkMap[killer.puuid] += 1;
            }

            if (!roundKillCount[round][killer.puuid]) {
                roundKillCount[round][killer.puuid] = 0;
            }
            roundKillCount[round][killer.puuid] += 1;

            if (roundKillCount[round][killer.puuid] === 3) {
                mkMap[killer.puuid] += 1;
            }
        });

        const updatedMatchInfo = players.map(player => ({
            ...player,
            fk: fkMap[player.puuid] || 0,
            mk: mkMap[player.puuid] || 0,
        }));

        setMatchInfo(updatedMatchInfo);
    };

    const selectedData = selectedMap ? matchInfo : [];
    const selectedKills = selectedMap ? kill : [];
    const selectedTeams = selectedMap ? score : [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="loading loading-dots loading-lg text-primary"></span>
            </div>
        );
    }

    return (
        <>

            <div className="matchstat">
                {mapData &&
                    mapData.map((match, index) => (
                        <div key={index} className="scoreboard-title">
                            <div className="scoreboard w-full">
                                <div className="team teamleft w-full flex items-center">
                                    <div className="logo">
                                        <img
                                            className="w-12 h-12 ml-2 max-lg:ml-0 max-lg:w-9 max-lg:h-9"

                                            alt="Team Left Logo"
                                        />
                                    </div>
                                    <div className="teamname"></div>
                                </div>
                                <div className="score-and-time">
                                    <div className="score bg-[#362431]">
                                        {match.rounds && (
                                            <span
                                                className={`scoreA ${match.rounds.teamLeft > match.rounds.teamRight
                                                    ? 'green-win'
                                                    : 'red-lose'
                                                    }`}
                                                id="score-left"
                                            >

                                            </span>
                                        )}
                                    </div>
                                    <div className="time text-sm uppercase bg-[#362431] text-white">
                                        <span>FIN</span>
                                        <span>{formatTime(match.data.matchInfo.gameStartMillis)}</span>
                                    </div>
                                    <div className="score bg-[#362431]">
                                        {match.rounds && (
                                            <span
                                                className={`scoreA ${match.rounds.teamLeft < match.rounds.teamRight
                                                    ? 'green-win'
                                                    : 'red-lose'
                                                    }`}
                                                id="score-right"
                                            >
                                                {match.rounds.teamRight}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="team teamright w-full flex items-center">
                                    <div className="logo">
                                        <img
                                            className="w-12 h-12 mr-2 max-lg:mr-0 max-lg:w-9 max-lg:h-9"

                                            alt="Team Right Logo"
                                        />
                                    </div>
                                    <div className="teamname"></div>
                                </div>
                            </div>
                            <div className="title bg-[#362431]">
                                <span className="league all-title"></span>
                                <span className="group all-title text-white"></span>
                            </div>
                            <RenderMapTabs mapData={mapData} mapsDictionary={dictionary} />
                            <div className="data-output">
                                <PlayerTable players={match.data.players} />
                            </div>
                            
                        </div>
                    ))}
            </div>

        </>
    );
}
