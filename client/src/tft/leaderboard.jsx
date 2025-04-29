import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import 'animate.css';
import MyNavbar2 from "../components/Navbar2";
import LeagueHeader from "../components/header";
import { useLeagueData } from "../hooks/useLeagueData";

const Leaderboard = () => {
    const [loading, setLoading] = useState(true);
    const { currentUser } = useSelector((state) => state.user);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [joinCountdown, setJoinCountdown] = useState('');
    const [registerPhase, setRegisterPhase] = useState('idle');
    const { game, league_id } = useParams();
    const { league, startTime, me, allMatchData } = useLeagueData(game, league_id, currentUser);
    const max = parseInt(league?.season?.max_registration) || 64;
    const currentPlayer = league?.players?.find(
        (p) => String(p.usernameregister) === String(currentUser?._id)
    );
    const isCheckedin = currentPlayer?.isCheckedin === true;

    const [selectedDay, setSelectedDay] = useState("day1");
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [columnCount, setColumnCount] = useState(0);

    useEffect(() => {
        if (!startTime) return;
        if (!league?.season?.registration_start || !league?.season?.registration_end) return;

        const regStart = new Date(league.season.registration_start);
        const regEnd = new Date(league.season.registration_end);

        const updateCountdown = () => {
            const now = new Date();
            let diff;
            if (now < regStart) {
                diff = regStart - now;
                setRegisterPhase('before');
            } else if (now >= regStart && now <= regEnd) {
                diff = regEnd - now;
                setRegisterPhase('during');
            } else {
                setRegisterPhase('after');
                return;
            }

            if (diff <= 0) return;

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);
            setJoinCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [league]);

    useEffect(() => {
        const scrollToTop = () => {
            document.documentElement.scrollTop = 0;
            setLoading(false);
        };
        setTimeout(scrollToTop, 0);
        if (league) {
            document.title = `${league.league.name}`;
        }
    }, [league]);

    useEffect(() => {
        const generateLeaderboard = () => {
            if (!league || !league.matches || !league.matches[selectedDay]) return;

            const lobbies = league.matches[selectedDay];
            const maxMatches = Math.max(...lobbies.map(l => l.matchIds.length));
            setColumnCount(maxMatches);

            const playerScores = {};
            const registeredNames = new Set(
                league.players.map(p => p.ign?.[0]).filter(Boolean)
            );

            for (let matchIndex = 0; matchIndex < maxMatches; matchIndex++) {
                const presentPlayers = new Set();
                let matchExists = false;

                for (const lobby of lobbies) {
                    const matchId = lobby.matchIds[matchIndex];
                    if (matchId === "0" || !allMatchData[matchId]) continue;
                    matchExists = true;

                    const match = allMatchData[matchId];

                    // Tách người chơi lạ và người chơi hợp lệ
                    const participants = match.info.participants.map(p => {
                        return {
                            name: `${p.riotIdGameName}#${p.riotIdTagline}`,
                            placement: p.placement
                        };
                    });

                    const outsiders = participants.filter(p => !registeredNames.has(p.name));
                    const outsidersPlacements = outsiders.map(p => p.placement);

                    match.info.participants.forEach(p => {
                        const name = `${p.riotIdGameName}#${p.riotIdTagline}`;
                        let score = 9 - p.placement;

                        if (!registeredNames.has(name)) return;

                        presentPlayers.add(name);

                        // Cộng thêm điểm nếu người chơi hợp lệ đứng dưới bất kỳ outsider nào
                        const outsiderAbove = outsidersPlacements.filter(o => o < p.placement).length;
                        if (outsiderAbove > 0) {
                            score += outsiderAbove;
                        }

                        if (!playerScores[name]) {
                            playerScores[name] = {
                                name,
                                scores: Array(maxMatches).fill(0),
                                total: 0
                            };
                        }

                        playerScores[name].scores[matchIndex] = score;
                        playerScores[name].total += score;
                    });
                }

                registeredNames.forEach(name => {
                    if (!playerScores[name]) {
                        playerScores[name] = {
                            name,
                            scores: Array(maxMatches).fill(0),
                            total: 0
                        };
                    }

                    if (matchExists && !presentPlayers.has(name)) {
                        playerScores[name].scores[matchIndex] = 1;
                        playerScores[name].total += 1;
                    }
                });
            }

            const sorted = Object.values(playerScores).sort((a, b) => b.total - a.total);

            // Gắn logoUrl theo IGN
            const playerMap = {};
            league.players.forEach(p => {
                const ign = p.ign?.[0];
                const avatar = `https://drive.google.com/thumbnail?id=${p.logoUrl}`;
                const teamLogo = `https://drive.google.com/thumbnail?id=${p.team.logoTeam}`;
                if (ign) {
                    playerMap[ign] = {
                        avatar: avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                        teamLogo: teamLogo || null
                    };
                }
            });


            const leaderboardWithProfile = sorted.map(p => ({
                ...p,
                avatar: playerMap[p.name]?.avatar,
                teamLogo: playerMap[p.name]?.teamLogo
            }));

            setLeaderboardData(leaderboardWithProfile);
        };

        generateLeaderboard();
    }, [selectedDay, league, allMatchData]);

    const navigationAll1 = {
        aov: [
            { name: "Tổng quan", href: `/${game}/${league_id}`, current: location.pathname === `/${game}/${league_id}` },
            { name: "Người chơi", href: `/${game}/${league_id}/players`, current: location.pathname === `/${game}/${league_id}/players` },
            { name: "Luật", href: `/${game}/${league_id}/rule`, current: location.pathname === `/${game}/${league_id}/rule` },
            { name: "BXH", href: `/${game}/${league_id}/leaderboard`, current: location.pathname === `/${game}/${league_id}/leaderboard` }
        ],
    };
    const getNavigation = () => navigationAll1.aov;

    if (!league) {
        return (
            <div className="min-h-screen flex justify-center items-center text-white ">
                <span className="loading loading-dots loading-lg text-primary">Loading league...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col text-white">
            <LeagueHeader
                league={league}
                startTime={league.season.time_start}
                currentUser={currentUser}
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
                getNavigation={getNavigation}
                MyNavbar2={MyNavbar2}
                league_id={league_id}
                me={me}
            />

            <div className="flex justify-center mt-4">
                <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="text-white p-2 rounded"
                >
                    {Object.keys(league?.matches || {}).map((dayKey) => (
                        <option key={dayKey} value={dayKey}>
                            {dayKey}
                        </option>
                    ))}
                </select>
            </div>

            <div className="overflow-x-auto mt-6 px-4">
                <table className="table w-full text-center">
                    <thead>
                        <tr>
                            <th>Tên người chơi</th>
                            <th>Tổ chức</th>
                            <th>Tổng điểm</th>
                            {Array.from({ length: columnCount }).map((_, i) => (
                                <th key={i}>Trận {i + 1}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboardData.map((player, index) => (
                            <tr key={index}>

                                <td className="flex items-center space-x-4 py-2 pl-2">

                                    {/* Logo người chơi + tên */}
                                    <div className="flex items-center space-x-4">
                                        <img
                                            src={`${player.avatar}`}
                                            alt="player-logo"
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <span className="text-white font-semibold sm:text-[15px] text-[12px]">{player.name}</span>
                                    
                                    </div>

                                </td>
                                <td className="">  
                                        <img
                                            src={player.teamLogo || ""}
                                            alt="team-logo"
                                            className={`w-10 h-10 rounded-full object-cover mx-auto ${player.teamLogo == "https://drive.google.com/thumbnail?id=" ? 'invisible' : ''}`}
                                        />

                                </td>
                                <td>{player.total}</td>
                                {player.scores.map((score, idx) => (
                                    <td key={idx}>{score}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Leaderboard;