import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PlayerStats from "./match.jsx";
import Valoveto from './vetoshow.jsx';
export default function MatchStat2() {
    const { round, Match } = useParams();
    const [matchid, setMatchid] = useState([]);
    const [teamA, setteamA] = useState([]);
    const [teamB, setteamB] = useState([]);
    const [teamALogo, setTeamALogo] = useState('');
    const [teamBLogo, setTeamBLogo] = useState('');
    const [teamABgColor, setTeamABgColor] = useState('');
    const [teamBBgColor, setTeamBBgColor] = useState('');
    const [teamAshort, setTeamAshort] = useState('')
    const [teamBshort, setTeamBshort] = useState('')
    const [matchInfo, setMatchInfo] = useState([]);
    const [time, setTime] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [botype, setBotype] = useState('');
    const [banpickid, setbanpickid] = useState('');
    const [findteam, setFindteam] = useState([]);
    const [allPlayer, setAllPlayer] = useState([]);
    const [registeredPlayers, setRegisteredPlayers] = useState([]);
    const [error, setError] = useState(null);
    const hexToRgba = (hex, opacity) => {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // Step 1: Call 3 API song song
                const [matchRes, teamRes] = await Promise.all([
                    fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/findmatchid', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ round, Match, game: "Valorant" })
                    }),
                    fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/findallteamValorant', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    })
                ]);
    
                if (!matchRes.ok || !teamRes.ok) {
                    throw new Error("One or more API calls failed");
                }
    
                const [matchData, teamData] = await Promise.all([
                    matchRes.json(),
                    teamRes.json(),
  
                ]);
    
                // Step 2: Process match data
                const matchCount = matchData.matchid.length;
                let boType = matchCount === 1 ? 'BO1' : matchCount <= 3 ? 'BO3' : matchCount <= 5 ? 'BO5' : matchCount <= 7 ? 'BO7' : 'Invalid BO type';
    
                setMatchid(matchData.matchid);
                setteamA(matchData.teamA);
                setteamB(matchData.teamB);
                setBotype(boType);
                setbanpickid(matchData.banpickid);
    
                // Step 3: Fetch match details song song
                const matchDetailPromises = matchData.matchid.map(async (id) => {
                    const res = await fetch(`https://dongchuyennghiep-backend.vercel.app/api/valorant/match/${id}`);
                    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                    const data = await res.json();
                    return data.matchData;
                });
    
                const matchResults = await Promise.all(matchDetailPromises);
                setMatchInfo(matchResults);
                setTime(matchResults[0].matchInfo.gameStartMillis);
    
                const extractedPlayers = matchResults.flatMap(match =>
                    match.players
                        ?.filter(player => player.gameName && player.tagLine)
                        .map(player => `${player.gameName}#${player.tagLine}`)
                );
                const uniquePlayers = [...new Set(extractedPlayers)];
                setAllPlayer(uniquePlayers);
    
                // Step 4: Team info
                setFindteam(teamData);
                const teamAData = teamData.find(team => team.teamName === matchData.teamA);
                const teamBData = teamData.find(team => team.teamName === matchData.teamB);
                setTeamALogo(`https://drive.google.com/thumbnail?id=${teamAData?.logoUrl}`);
                setTeamBLogo(`https://drive.google.com/thumbnail?id=${teamBData?.logoUrl}`);
                setTeamABgColor(teamAData?.color || '#ffffff');
                setTeamBBgColor(teamBData?.color || '#ffffff');
                setTeamAshort(teamAData?.shortName);
                setTeamBshort(teamBData?.shortName);
    
                // Step 6: Check registered players
                const checkPlayerRes = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/check-registered-valorant', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ riotid: uniquePlayers }),
                });
    
                if (!checkPlayerRes.ok) throw new Error(`HTTP error! status: ${checkPlayerRes.status}`);
                const playerResult = await checkPlayerRes.json();
                setRegisteredPlayers(playerResult);
                setIsLoading(false);
    
            } catch (error) {
                console.error("Error fetching data:", error);
                setError(error.message);
                setIsLoading(false);
            }
        };
    
        fetchAllData();
    }, [round, Match]);
    
    // Kiểm tra kết quả
    useEffect(() => {
        console.log("Unique players:", allPlayer);
    }, [allPlayer]);
    useEffect(() => {
        console.log(matchInfo);
    }, [matchInfo]);
    const formatTime = (utcTime) => {
        const date = new Date(utcTime);
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
    const getPlayerTeamName = (player) => {
        if (!registeredPlayers || registeredPlayers.length === 0) return null;

        const normalizedId = `${player.gameName}#${player.tagLine}`.toLowerCase().trim();
        const registeredPlayer = registeredPlayers.find(rp =>
            rp.riotID.toLowerCase().trim() === normalizedId
        );

        return registeredPlayer?.teamname || null;
    };
    const calculateTotalWins = () => {
        let totalWinsA = 0;
        let totalWinsB = 0;

        matchInfo.forEach(match => {
            const sortedPlayers = match.players.reduce((acc, player) => {
                const playerTeamName = getPlayerTeamName(player);
                if (playerTeamName) {
                    acc[playerTeamName] = player.teamId;
                }
                return acc;
            }, {});

            let actualTeamA = Object.keys(sortedPlayers).find(
                (team) => sortedPlayers[team] === "Red"
            ) || "Đội Đỏ";

            let actualTeamB = Object.keys(sortedPlayers).find(
                (team) => sortedPlayers[team] === "Blue"
            ) || "Đội Xanh";

            const redTeam = match.teams.find(team => team.teamId === "Red");
            const blueTeam = match.teams.find(team => team.teamId === "Blue");

            let scoreA = redTeam ? redTeam.roundsWon : 0;
            let scoreB = blueTeam ? blueTeam.roundsWon : 0;

            if (actualTeamA !== teamA) {
                [actualTeamA, actualTeamB] = [actualTeamB, actualTeamA];
                [scoreA, scoreB] = [scoreB, scoreA];
            }

            if (scoreA > scoreB) {
                totalWinsA += 1;
            } else {
                totalWinsB += 1;
            }
        });

        return { totalWinsA, totalWinsB };
    };

    // Gọi hàm tính tổng trận thắng
    const { totalWinsA, totalWinsB } = calculateTotalWins();
    const getDaySuffix = (day) => {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    };

    const capitalizeFirstLetter = (string) => {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    };
    useEffect(() => {
        if (teamA && teamB) {
            document.title = `${teamA} vs ${teamB} | ${capitalizeFirstLetter(round)}`;
        } else {
            document.title = "Đang tải"; // Tiêu đề mặc định
        }
    }, [teamA, teamB]);

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
                <div className="scoreboard-title">
                    <div className="scoreboard w-full">
                        <div className="team teamleft w-full flex items-center" style={{ backgroundColor: hexToRgba(teamABgColor, 0.2) }}>
                            <div className="logo">
                                <img
                                    className="w-12 h-12 ml-2 max-lg:ml-0 max-lg:w-9 max-lg:h-9"
                                    src={teamALogo}
                                    alt="Team Left Logo"
                                />
                            </div>
                            <div className="teamname">
                                <span className="block sm:hidden">{teamAshort}</span> {/* Hiển thị teamAshort khi màn hình nhỏ hơn sm */}
                                <span className="hidden sm:block">{teamA}</span>       {/* Hiển thị teamA khi màn hình từ sm trở lên */}
                            </div>
                        </div>
                        <div className="score-and-time">
                            <div className="score bg-[#362431]">
                                <span
                                    className={`scoreA ${totalWinsA > totalWinsB ? 'green-win' : 'red-lose'}`}
                                    id='score-left'
                                >
                                    {totalWinsA}
                                </span>
                            </div>
                            <div className="time text-sm uppercase bg-[#362431] text-white">
                                <span>Fin</span>
                                <span>{formatTime(time)}</span>
                            </div>
                            <div className="score bg-[#362431]">
                                <span
                                    className={`scoreB ${totalWinsA < totalWinsB ? 'green-win' : 'red-lose'}`}
                                    id='score-right'
                                >
                                    {totalWinsB}
                                </span>
                            </div>
                        </div>
                        <div className="team teamright w-full flex items-center " style={{ backgroundColor: hexToRgba(teamBBgColor, 0.2) }}>
                            <div className="logo">
                                <img
                                    className="w-12 h-12 mr-2 max-lg:mr-0 max-lg:w-9 max-lg:h-9"
                                    src={teamBLogo}
                                    alt="Team Right Logo"
                                />
                            </div>
                            <div className="teamname">
                                <span className="block sm:hidden">{teamBshort}</span> {/* Hiển thị teamAshort khi màn hình nhỏ hơn sm */}
                                <span className="hidden sm:block">{teamB}</span>       {/* Hiển thị teamA khi màn hình từ sm trở lên */}
                            </div>
                        </div>
                    </div>

                    <div className='title bg-[#362431]'>
                        <span className='league all-title'>Valorant DCN Split 2</span>
                        <span className='group all-title text-white'>Nhánh {capitalizeFirstLetter(round)} ● {botype}</span>
                    </div>
                </div>
                <div className='flex'>
                    <div className='w-full'><Valoveto banpickid={banpickid} teams={findteam} /></div>

                </div>
                <div>
                    <PlayerStats
                        data={matchInfo}
                        registeredPlayers={registeredPlayers} // Thêm dòng này
                        teamA={teamA}
                        teamB={teamB}
                    />
                </div>
            </div>
        </>
    );
}
