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
    const [scoreA, setScoreA] = useState('');
    const [scoreB, setScoreB] = useState('');
    const [banpickid,setbanpickid] = useState('');
    const [dictionary, setDictionary] = useState(null)
    const [findteam,setFindteam] = useState([]);
    const hexToRgba = (hex, opacity) => {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };
    useEffect(() => {
        // Fetch match data (teamA, teamB, matchId)
        fetchGames();
    }, [round, Match]);
    useEffect(() => {
        const scrollToTop = () => {
            document.documentElement.scrollTop = 0;
            
        };
        setTimeout(scrollToTop, 0);

    }, []);
    useEffect(() => {
        // Fetch team logos and colors only when teamA and teamB are set
        if (teamA.length > 0 && teamB.length > 0) {
            fetchTeamLogos();
        }
    }, [teamA, teamB]);

    const fetchGames = async () => {
        try {
            const response = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/findmatchid', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    round: round,
                    Match: Match,
                    game: "Valorant"
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Đếm số lượng matchid
            const matchCount = data.matchid.length;

            // Xét trường hợp để trả về BOx
            let boType;
            if (matchCount === 1) {
                boType = 'BO1';
            } else if (matchCount <= 3) {
                boType = 'BO3';
            } else if (matchCount <= 5) {
                boType = 'BO5';
            } else if (matchCount <= 7) {
                boType = 'BO7';
            } else {
                boType = `Invalid BO type`; // Trường hợp không hợp lệ
            }

            // Cập nhật state
            setMatchid(data.matchid);
            setteamA(data.teamA);
            setteamB(data.teamB);
            setBotype(boType)
            setScoreA(data.scoreA);
            setScoreB(data.scoreB)
            setbanpickid(data.banpickid)

        } catch (error) {
            console.error("Failed to fetch game:", error);
        }
    };


    const fetchTeamLogos = async () => {
        try {
            const teamResponse = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/findallteamValorant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!teamResponse.ok) {
                throw new Error(`HTTP error! status: ${teamResponse.status}`);
            }

            const teamData = await teamResponse.json();
            setFindteam(teamData)
            const teamAData = teamData.find(team => team.teamName === teamA);
            const teamBData = teamData.find(team => team.teamName === teamB);

            setTeamALogo(`https://drive.google.com/thumbnail?id=${teamAData?.logoUrl}`);
            setTeamBLogo(`https://drive.google.com/thumbnail?id=${teamBData?.logoUrl}`);
            setTeamABgColor(teamAData?.color || '#ffffff');
            setTeamBBgColor(teamBData?.color || '#ffffff');
            setTeamAshort(teamAData?.shortName);
            setTeamBshort(teamBData?.shortName);
        } catch (error) {
            console.error("Failed to fetch team logos:", error);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const fetchDict = async () => {
            try {
                if (!dictionary) {
                    const res = await fetch(
                        `https://dongchuyennghiep-backend.vercel.app/api/valorant/dictionary`
                    );

                    if (!res.ok) throw new Error(`HTTP error! ${res.status}`);

                    const data = await res.json();
                    if (isMounted) {
                        setDictionary(data)
                        setIsLoading(false);

                    };
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message);
                    console.error("Dictionary fetch error:", err);
                    setIsLoading(false);
                }
            }
        };

        fetchDict();

        return () => {
            isMounted = false;
        };
    }, []);


    useEffect(() => {
        if (matchid.length > 0) {
            const fetchData = async () => {
                try {
                    const results = await Promise.all(
                        matchid.map(async (id) => {
                            const res = await fetch(`https://dongchuyennghiep-backend.vercel.app/api/valorant/match/${id}`);
                            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                            return res.json();
                        })
                    );
                    setMatchInfo(results);
                    setTime(results[0].matchInfo.gameStartMillis)

                } catch (err) {
                    setError(err.message);

                }
            };

            // Thêm điều kiện kiểm tra để tránh gọi API liên tục
            if (matchInfo.length === 0) {
                fetchData();
            }
        }
    }, [matchid]);

    
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
                                    className={`scoreA ${scoreA > scoreB ? 'green-win' : 'red-lose'}`}
                                    id='score-left'
                                >
                                    {scoreA}
                                </span>
                            </div>
                            <div className="time text-sm uppercase bg-[#362431] text-white">
                                <span>Fin</span>
                                <span>{formatTime(time)}</span>
                            </div>
                            <div className="score bg-[#362431]">
                                <span
                                    className={`scoreB ${scoreA < scoreB ? 'green-win' : 'red-lose'}`}
                                    id='score-right'
                                >
                                    {scoreB}
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
                <div className='w-full'><Valoveto banpickid={banpickid} teams={findteam}/></div>
                
                </div>
                <div>
                    <PlayerStats data={matchInfo} dictionary={dictionary}  />
                </div>
            </div>
        </>
    );
}
