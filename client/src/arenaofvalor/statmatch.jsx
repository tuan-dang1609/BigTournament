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
    const [teamALogo, setTeamALogo] = useState('');
    const [loading, setLoading] = useState(true);
    const [teamBLogo, setTeamBLogo] = useState('');
    const [teamABgColor, setTeamABgColor] = useState('');
    const [teamBBgColor, setTeamBBgColor] = useState('');
    const [allPlayersTeamA, setAllPlayersTeamA] = useState([]);
    const [allPlayersTeamB, setAllPlayersTeamB] = useState([]);
    const [teamAProfiles, setTeamAProfiles] = useState([]);
    const [teamBProfiles, setTeamBProfiles] = useState([]);
    const [teamAGold, setTeamAGold] = useState(0);
    const [teamBGold, setTeamBGold] = useState(0);
    const fetchPlayerProfiles = async (playerIGNs) => {
        try {
            const response = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/fetchplayerprofiles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ players: playerIGNs }),
            });
            const profiles = await response.json();
            return profiles;
        } catch (error) {
            console.error('Error fetching player profiles:', error);
            return [];
        }
    };
    
    const fetchTeamLogos = async () => {
        try {
            const teamResponse = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/findallteamAOV', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!teamResponse.ok) {
                throw new Error(`HTTP error! status: ${teamResponse.status}`);
            }

            const teamData = await teamResponse.json();
            const teamAData = teamData.find(team => team.teamName === matchData.teamA);
            const teamBData = teamData.find(team => team.teamName === matchData.teamB);

            setTeamALogo(`https://drive.google.com/thumbnail?id=${teamAData?.logoUrl || ''}`);
            setTeamBLogo(`https://drive.google.com/thumbnail?id=${teamBData?.logoUrl || ''}`);
            setTeamABgColor(teamAData?.color || '#ffffff');
            setTeamBBgColor(teamBData?.color || '#ffffff');
        } catch (error) {
            console.error("Failed to fetch team logos:", error);
        }
    };

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

    const fetchAllPlayers = (info) => {
        const teamAPlayers = new Set();
        const teamBPlayers = new Set();

        info.forEach(match => {
            if (match.infoTeamleft && Array.isArray(match.infoTeamleft.data)) {
                match.infoTeamleft.data.forEach(player => teamAPlayers.add(player.IGN));
            }
            if (match.infoTeamright && Array.isArray(match.infoTeamright.data)) {
                match.infoTeamright.data.forEach(player => teamBPlayers.add(player.IGN));
            }
        });

        setAllPlayersTeamA(Array.from(teamAPlayers));
        setAllPlayersTeamB(Array.from(teamBPlayers));
    };
    
    useEffect(() => {
        fetchMatchData();
    }, [round, Match]);

    useEffect(() => {
        if (matchData) {
            fetchTeamLogos();
            
        }
    }, [matchData]);
   
    useEffect(() => {
        if (matchData2 && matchData2[0] && matchData2[0].info) {
            fetchAllPlayers(matchData2[0].info);
            const scrollToTop = () => {
                document.documentElement.scrollTop = 0;
                setLoading(true);
              };
              setTimeout(scrollToTop, 0);
              document.title = `${matchData2[0].group} | ${matchData2[0].teamA} vs ${matchData2[0].teamB}`;
        }
    }, [matchData2]);

    useEffect(() => {
        if (allPlayersTeamA.length > 0) {
            fetchPlayerProfiles(allPlayersTeamA).then(profiles => setTeamAProfiles(profiles));
        }
    }, [allPlayersTeamA]);

    useEffect(() => {
        if (allPlayersTeamB.length > 0) {
            fetchPlayerProfiles(allPlayersTeamB).then(profiles => setTeamBProfiles(profiles));
        }
    }, [allPlayersTeamB]);

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
                setMatchData2(validResults);
                setMapData(validResults);
                setSelectedMap(validResults[0].info[0]);
                fetchAllPlayers(validResults);
            }

            setIsLoading(false);
        } catch (error) {
            setError(`Failed to fetch match details: ${error.message}`);
            console.error("Error details:", error);
            setIsLoading(false);
        }
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
    useEffect(() => {
        if (selectedMap?.infoTeamleft?.data) {
            const totalGoldA = selectedMap.infoTeamleft.data.reduce((sum, player) => sum + (parseFloat(player.Gold) || 0), 0);
            const totalGoldB = selectedMap.infoTeamright.data.reduce((sum, player) => sum + (parseFloat(player.Gold) || 0), 0);
            setTeamAGold(totalGoldA);
            setTeamBGold(totalGoldB);
        }
    }, [selectedMap]);

    const totalGold = teamAGold + teamBGold;
    const teamAWidth = totalGold > 0 ? (teamAGold / totalGold) * 100 : 50;
    const teamBWidth = totalGold > 0 ? (teamBGold / totalGold) * 100 : 50;

    const renderGoldRatioBar = () => (
        <div className="w-full flex items-center justify-between mt-3 mb-3">
            <div className="w-full rounded-lg overflow-hidden flex" style={{ height: '40px' }}>
                {/* Phần của Team A */}
                <div
                    className="h-full text-white text-center flex items-center justify-center font-semibold transition-all duration-500 opacity-80"
                    style={{
                        width: `${teamAWidth}%`,
                        backgroundColor: hexToRgba(teamABgColor, 0.55) || 'rgba(0, 0, 255, 0.2)', // màu xanh với độ mờ
                    }}
                >
                    {teamAGold}
                </div>
                
                {/* Phần của Team B */}
                <div
                    className="h-full text-white text-center flex items-center justify-center font-semibold transition-all duration-500 opacity-80"
                    style={{
                        width: `${teamBWidth}%`,
                        backgroundColor: hexToRgba(teamBBgColor, 0.55) || 'rgba(255, 0, 0, 0.2)', // màu đỏ với độ mờ
                    }}
                >
                    {teamBGold}
                </div>
            </div>
        </div>
    );
    
    
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

    const hexToRgba = (hex, opacity) => {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    const renderMapTabs = () => {
        if (!Array.isArray(mapData)) return null;

        return (
            <div className="flex items-center justify-between bg-[#362431] p-2 mb-2">
                <span className="text-white text-[11px] font-bold mr-4">MATCH STATS</span>
                <div className="flex gap-2">
                    {mapData[0].info.map((map, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedMap(map)}
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

    const { teamA, teamB, scoreteamA, scoreteamB, timestartmatch, league, type, group } = matchData2?.[0] || {};

    return (
        <div className="matchstat">
            <div className="scoreboard-title mt-5 mx-0 my-1">
                <div className="scoreboard w-full">
                    <div className="team teamleft w-full flex items-center" style={{ backgroundColor: hexToRgba(teamABgColor, 0.2) }}>
                        <div className="logo">
                            <img className="w-12 h-12 ml-2 max-lg:ml-0 max-lg:w-9 max-lg:h-9" src={teamALogo} alt="Team Left Logo" />
                        </div>
                        <div className="teamname">{teamA}</div>
                    </div>
                    <div className="score-and-time">
                        <div className="score bg-[#362431]">
                            <span className={`scoreA ${scoreteamA > scoreteamB ? 'green-win' : 'red-lose'}`} id='score-left'>{scoreteamA}</span>
                        </div>
                        <div className="time text-sm uppercase bg-[#362431] text-white">
                            <span>Fin</span>
                            <span>{formatTime(timestartmatch)}</span>
                        </div>
                        <div className="score bg-[#362431]">
                            <span className={`scoreA ${scoreteamA < scoreteamB ? 'green-win' : 'red-lose'}`} id='score-right'>{scoreteamB}</span>
                        </div>
                    </div>
                    <div className="team teamright w-full flex items-center" style={{ backgroundColor: hexToRgba(teamBBgColor, 0.2) }}>
                        <div className="logo">
                            <img className="w-12 h-12 mr-2 max-lg:mr-0 max-lg:w-9 max-lg:h-9" src={teamBLogo} alt="Team Right Logo" />
                        </div>
                        <div className="teamname">{teamB}</div>
                    </div>
                </div>
                <div className='title bg-[#362431]'>
                    <span className='league all-title'>{league}</span>
                    <span className='group all-title text-white'>{group} ● {type}</span>
                </div>
            </div>

            {/* Display all players with profiles */}
            <div className='flex lg:flex-row flex-col mt-2 gap-x-4 w-full mb-4'>
                <div className="team-members p-4 lg:w-[50%] w-full lg:border-r-2 lg:border-base-content">
                    <h3 className="text-lg font-bold mb-2">Thành viên của {teamA}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-3 gap-y-1">
                        {teamAProfiles.map((player, index) => (
                            <div key={index} className="flex flex-col items-center justify-center">
                                <img src={`https://drive.google.com/thumbnail?id=${player.avatar || '1wRTVjigKJEXt8iZEKnBX5_2jG7Ud3G-L'}`} alt={player.name} className="w-20 h-20 rounded-full mb-2" />
                                <p className="text-[12.5px] font-semibold">{player.name || player}</p>
                            </div>
                        ))}
                    </div>
                </div>


                <div className="team-members p-4 lg:w-[50%] w-full">
                    <h3 className="text-lg font-bold mb-2">Thành viên của {teamB}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-3 gap-y-1">
                        {teamBProfiles.map((player, index) => (
                            <div key={index} className="flex flex-col items-center justify-center">
                                <img src={`https://drive.google.com/thumbnail?id=${player.avatar || '1wRTVjigKJEXt8iZEKnBX5_2jG7Ud3G-L'}`} alt={player.name} className="w-20 h-20 rounded-full mb-2" />
                                <p className="text-[12.5px] font-semibold">{player.name || player}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>


            {renderMapTabs()}
            {renderGoldRatioBar()}
            <FeatureRichTable matchInfo={selectedMap?.infoTeamleft?.data || []} opponentInfo={selectedMap?.infoTeamright?.data || []} error={error} />
        </div>
    );
}
