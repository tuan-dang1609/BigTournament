import { useState, useEffect } from 'react';
import MatchResult from "./match";

export default function MatchStat() {
    const [matchInfo, setMatchInfo] = useState(null);
    const [error, setError] = useState(null);
    const [numRound, setNumRound] = useState(null);
    const [kill, setAllKill] = useState(null);
    const [score, setScore] = useState(null);
    const matchid = 'b87161a7-0dea-4c7a-bf7a-6d1df1ea52db';
    const region = 'ap';

    useEffect(() => {
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
            })
            .catch(err => setError(err.message));
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

    return (
        <>
            <div className="matchstat">
                <div className="scoreboard-title">
                    <div className="scoreboard w-full">
                        <div className="team teamleft w-full flex items-center">
                            <div className="logo">
                                <img className="w-12 h-12 ml-2 max-lg:ml-0 max-lg:w-9 max-lg:h-9" 
                                     src="https://drive.google.com/thumbnail?id=1Y2tyRSmHv0GwkzdR5jXqNcgvI9pcYVWo" 
                                     alt="Team Left Logo" />
                            </div>
                            <div className="teamname">Paper Shark</div>
                        </div>
                        <div className="score-and-time">
                            <div className="score bg-[#362431]">
                                {score && score.length > 0 && (
                                    <>
                                        <span className={`scoreA ${score[0].rounds.won > score[1].rounds.won ? 'green-win' : 'red-lose'}`} id='score-left'>
                                            {score[0].rounds.won}
                                        </span>
                                    </>
                                )}
                            </div>
                            <div className="time text-sm uppercase bg-[#362431] text-white">
                                <span>Fin</span>
                                <span>19:00 - 25th Aug</span>
                            </div>
                            <div className="score bg-[#362431]">
                                {score && score.length > 1 && (
                                    <>
                                        <span className={`scoreA ${score[0].rounds.won < score[1].rounds.won ? 'green-win' : 'red-lose'}`} id='score-left'>
                                            {score[1].rounds.won}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="team teamright w-full flex items-center">
                            <div className="logo">
                                <img className="w-12 h-12 mr-2 max-lg:mr-0 max-lg:w-9 max-lg:h-9" 
                                     src="https://drive.google.com/thumbnail?id=1z1thZ57p3ZSxT2sY_RpoLT0wzBZoy_76" 
                                     alt="Team Right Logo" />
                            </div>
                            <div className="teamname">Hysteric</div>
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
