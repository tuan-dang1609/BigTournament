import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Import useParams
import MatchResult from "./match";

export default function MatchStat() {
    const { round, matchid, team } = useParams(); // Destructure the parameters from useParams
    const [matchInfo, setMatchInfo] = useState(null);
    const [error, setError] = useState(null);
    const [numRound, setNumRound] = useState(null);
    const [kill, setAllKill] = useState(null);
    const [score, setScore] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // New state for loading
    const region = 'ap'; // You might need to dynamically set this based on your needs

    useEffect(() => {
        // Construct the URL dynamically using the parameters
        fetch(`https://dongchuyennghiep-backend.vercel.app/api/match/${region}/${matchid}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                setMatchInfo(data.data.players);
                setNumRound(data.data.rounds.length);
                setAllKill(data.data.kills);
                setScore(data.data.teams);
                setIsLoading(false); // Data fetching is complete, set isLoading to false
            })
            .catch(err => {
                setError(err.message);
                setIsLoading(false); // Even in case of an error, stop the loading
            });
    }, [region, matchid]);

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
        ); // Display while loading
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
                                    <>
                                        <span
                                            className={`scoreA ${score[0].rounds.won > score[1].rounds.won ? 'green-win' : 'red-lose'}`}
                                            id='score-left'
                                        >
                                            {score[0].rounds.won}
                                        </span>
                                    </>
                                )}
                            </div>
                            <div className="time text-sm uppercase bg-[#362431] text-white">
                                <span>Fin</span>
                                <span>19:00 - 24th JUL</span>
                            </div>
                            <div className="score bg-[#362431]">
                                {score && score.length > 1 && (
                                    <>
                                        <span
                                            className={`scoreA ${score[0].rounds.won < score[1].rounds.won ? 'green-win' : 'red-lose'}`}
                                            id='score-left'
                                        >
                                            {score[1].rounds.won}
                                        </span>
                                    </>
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
                <div className="">
                    <MatchResult matchInfo={matchInfo} numRound={numRound} kill={kill} error={error} />
                </div>
            </div>
        </>
    );
}
