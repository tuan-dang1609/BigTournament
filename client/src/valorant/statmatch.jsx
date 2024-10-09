import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MatchResult from "./match";

export default function MatchStat() {
    const { round, Match } = useParams();
    const [matchid, setMatchid] = useState([]);
    const [matchInfo, setMatchInfo] = useState(null);
    const [error, setError] = useState(null);
    const [numRound, setNumRound] = useState(null);
    const [kill, setAllKill] = useState(null);
    const [score, setScore] = useState([]);
    const [time, setTime] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const region = 'ap';

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
            console.error("Failed to fetch game:");
        }
    };

    useEffect(() => {
        fetchGames();
    }, [round, Match]);

    useEffect(() => {
        if (matchid.length > 0) {
            Promise.all(
                matchid.map(id =>
                    fetch(`https://dongchuyennghiep-backend.vercel.app/api/match/${region}/${id}`)
                        .then(res => {
                            if (!res.ok) {
                                throw new Error(`HTTP error! status: ${res.status}`);
                            }
                            return res.json();
                        })
                        .then(data => ({
                            id,
                            data: data.data
                        }))
                        .catch(err => {
                            
                            return null;
                        })
                )
            ).then(results => {
                const validResults = results.filter(result => result !== null);
                if (validResults.length > 0) {
                    const combinedData = validResults.map(result => result.data);
                    const players = combinedData.flatMap(match => match.players);
                    const rounds = combinedData.reduce((sum, match) => sum + match.rounds.length, 0);
                    const kills = combinedData.flatMap(match => match.kills);
                    const teams = combinedData.flatMap(match => match.teams);
                    const time = formatTime(combinedData[0].metadata.started_at);

                    setMatchInfo(players);
                    setNumRound(rounds);
                    setAllKill(kills);
                    setScore(teams);
                    setTime(time);
                    setIsLoading(false);
                }
            }).catch(err => {
                setError(err.message);
                setIsLoading(false);
            });
        }
    }, [region, matchid]);

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
        if (day > 3 && day < 21) return 'th'; // Handle "11th" to "20th"
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    };

    useEffect(() => {
        if (kill && matchInfo && numRound) {
            const fkMap = {};
            const mkMap = {};

            matchInfo.forEach(player => {
                fkMap[player.puuid] = 0;
                mkMap[player.puuid] = 0;
            });

            const roundKillCount = {};

            kill.forEach(killEvent => {
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

            const updatedMatchInfo = matchInfo.map(player => ({
                ...player,
                fk: fkMap[player.puuid] || 0,
                mk: mkMap[player.puuid] || 0,
            }));

            const isSame = JSON.stringify(matchInfo) === JSON.stringify(updatedMatchInfo);
            if (!isSame) {
                setMatchInfo(updatedMatchInfo);
            }
        }
    }, [kill, matchInfo, numRound]);

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
                        <div className="team teamleft w-full flex items-center">
                            <div className="logo">
                                <img
                                    className="w-12 h-12 ml-2 max-lg:ml-0 max-lg:w-9 max-lg:h-9"
                                    src="https://drive.google.com/thumbnail?id=1z1thZ57p3ZSxT2sY_RpoLT0wzBZoy_76"
                                    alt="Team Left Logo"
                                />
                            </div>
                            <div className="teamname">Hysteric</div>
                        </div>
                        <div className="score-and-time">
                            <div className="score bg-[#362431]">
                                {score && score.length > 0 && (
                                    <span
                                        className={`scoreA ${score[0].rounds.won > score[1].rounds.won ? 'green-win' : 'red-lose'}`}
                                        id='score-left'
                                    >
                                        {score[0].rounds.won}
                                    </span>
                                )}
                            </div>
                            <div className="time text-sm uppercase bg-[#362431] text-white">
                                <span>Fin</span>
                                <span>{time}</span>
                            </div>
                            <div className="score bg-[#362431]">
                                {score && score.length > 1 && (
                                    <span
                                        className={`scoreA ${score[0].rounds.won < score[1].rounds.won ? 'green-win' : 'red-lose'}`}
                                        id='score-right'
                                    >
                                        {score[1].rounds.won}
                                    </span>
                                )}
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
                            <div className="teamname">Paper Shark</div>
                        </div>
                    </div>
                    <div className='title bg-[#362431]'>
                        <span className='league all-title'>Valorant DCN Split 2</span>
                        <span className='group all-title text-white'>Nhánh 0-0 ● BO1</span>
                    </div>
                </div>
                <div>
                    <MatchResult matchInfo={matchInfo} numRound={numRound} kill={kill} error={error} />
                </div>
            </div>
        </>
    );
}
