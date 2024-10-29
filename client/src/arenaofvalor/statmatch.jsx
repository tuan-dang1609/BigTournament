import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import FeatureRichTable from "./match.jsx";

export default function MatchStat() {
    const { round, Match } = useParams();
    const [matchData, setMatchData] = useState(null);
    const [matchData2, setMatchData2] = useState(null);
    const [mapData, setMapData] = useState({});
    const [selectedMap, setSelectedMap] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMatchData = async () => {
        try {
            const response = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/findmatchid', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    round: round,
                    Match: Match,
                    game: "Arena Of Valor"
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setMatchData(data);

            if (data.matchid && data.matchid.length > 0) {
                fetchMatchDetails(data.matchid);
            } else {
                setIsLoading(false);
            }

        } catch (error) {
            setError(`Failed to fetch match data: ${error.message}`);
            console.error("Error details:", error);
            setIsLoading(false);
        }
    };

    const fetchMatchDetails = async (matchIds) => {
        try {
            const results = await Promise.all(
                matchIds.map(id =>
                    fetch(`https://dongchuyennghiep-backend.vercel.app/api/auth/fetchmatchAOV/${id}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({})
                    })
                    .then(res => {
                        if (!res.ok) {
                            throw new Error(`HTTP error! status: ${res.status}`);
                        }
                        return res.json();
                    })
                    .catch(err => {
                        console.error(`Error fetching match data for ID ${id}:`, err);
                        return null;
                    })
                )
            );
    
            const validResults = results.filter(result => result !== null);
            if (validResults.length > 0) {
                setMatchData2(validResults)
                setMapData(validResults); // Lưu cả 3 trận đấu vào mapData
                setSelectedMap(validResults[0].info[0]); // Chọn bản đồ đầu tiên mặc định
            }
    
            setIsLoading(false);
        } catch (error) {
            setError(`Failed to fetch match details: ${error.message}`);
            console.error("Error details:", error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMatchData();
    }, [round, Match]);
    useEffect(() => {
        fetchMatchData();
    }, [round, Match]);
    

    const formatTime = (utcTime) => {
        if (!utcTime) return "Invalid date";
        const date = new Date(utcTime);
        if (isNaN(date.getTime())) return "Invalid date";

        const options = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        const time = new Intl.DateTimeFormat('en-US', options).format(date);
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

    const renderMapTabs = () => {

    
        return (
            <div className="flex items-center justify-between bg-[#362431] p-2 mb-1">
                <span className="text-white text-[11px] font-bold mr-4">MATCH STATS</span>
                <div className="flex gap-2">
                    {mapData[0].info.map((map, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedMap(map)} // Chọn trận đấu hiện tại
                            className={`px-4 py-2 text-[11px] font-bold rounded ${selectedMap === map ? 'bg-white text-black' : 'bg-[#4A374A] text-white'}`}
                        >
                            Trận {index + 1}
                        </button>
                    ))}
                </div>
            </div>
        );
    };
    
    
    

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="loading loading-dots loading-lg text-primary"></span>
            </div>
        );
    }

    if (error) {
        return <div className="text-center text-red-500 mt-40">{error}</div>;
    }

    // Lấy dữ liệu từ phần tử đầu tiên của `matchData2` nếu nó là một mảng
    const { teamA, teamB, scoreteamA, scoreteamB, timestartmatch, league, type ,group} = matchData2?.[0] || {};
    
    return (
        <>
            <div className="matchstat">
                <div className="scoreboard-title mt-5 mx-0 my-1">
                    <div className="scoreboard w-full">
                        <div className="team teamleft w-full flex items-center">
                            <div className="logo">
                                <img
                                    className="w-12 h-12 ml-2 max-lg:ml-0 max-lg:w-9 max-lg:h-9"
                                    src="https://drive.google.com/thumbnail?id=1z1thZ57p3ZSxT2sY_RpoLT0wzBZoy_76"
                                    alt="Team Left Logo"
                                />
                            </div>
                            <div className="teamname">{teamA}</div>
                        </div>
                        <div className="score-and-time">
                            <div className="score bg-[#362431]">
                                <span
                                    className={`scoreA ${scoreteamA > scoreteamB ? 'green-win' : 'red-lose'}`}
                                    id='score-left'
                                >
                                    {scoreteamA}
                                </span>
                            </div>
                            <div className="time text-sm uppercase bg-[#362431] text-white">
                                <span>Fin</span>
                                <span>{formatTime(timestartmatch)}</span>
                            </div>
                            <div className="score bg-[#362431]">
                                <span
                                    className={`scoreA ${scoreteamA < scoreteamB ? 'green-win' : 'red-lose'}`}
                                    id='score-right'
                                >
                                    {scoreteamB}
                                </span>
                            </div>
                        </div>
                        <div className="team teamright w-full flex items-center">
                            <div className="logo">
                                <img
                                    className="w-12 h-12 mr-2 max-lg:mr-0 max-lg:w-9 max-lg:h-9"
                                    src="https://drive.google.com/thumbnail?id=1Y2tyRSmHv0GwkzdR5jXqNcgvI9pcYVWo"
                                    alt="Team Right Logo"
                                />
                            </div>
                            <div className="teamname">{teamB}</div>
                        </div>
                    </div>
                    <div className='title bg-[#362431]'>
                        <span className='league all-title'>{league}</span>
                        <span className='group all-title text-white'>{group} ● {type}</span>
                    </div>
                </div>
                {renderMapTabs()}
                <div>
                    <FeatureRichTable 
                        matchInfo={selectedMap?.infoTeamleft?.data || []} 
                        opponentInfo={selectedMap?.infoTeamright?.data || []} 
                        error={error} 
                    />
                </div>
            </div>
        </>
    );
}
