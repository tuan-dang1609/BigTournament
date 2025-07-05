import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import 'animate.css';
import MyNavbar2 from '../components/Navbar2';
import LeagueHeader from '../components/header';
import { useLeagueData } from '../hooks/useLeagueData';

const Leaderboard = () => {
  const [loading, setLoading] = useState(true);
  const { currentUser } = useSelector((state) => state.user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { game, league_id } = useParams();
  const { league, me, allMatchData } = useLeagueData(game, league_id, currentUser);
  const currentPlayer = league?.players?.find(
    (p) => String(p.usernameregister) === String(currentUser?._id)
  );

  const [selectedDay, setSelectedDay] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [columnCount, setColumnCount] = useState(0);
  const daySchedule = {
    day1: new Date('2025-06-29T19:00:00'), // ví dụ: ngày thi đấu vòng loại 1
    day2: new Date('2025-07-01T19:00:00'), // ví dụ: vòng loại 2
  };
  useEffect(() => {
    if (!league?.matches) return;

    const today = new Date();
    let closestDay = null;

    for (const [dayKey, date] of Object.entries(daySchedule)) {
      if (!league.matches[dayKey]) continue;

      if (!closestDay || Math.abs(today - date) < Math.abs(today - closestDay.date)) {
        closestDay = { key: dayKey, date };
      }
    }

    if (closestDay) {
      setSelectedDay(closestDay.key);
    }
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
      // DEBUG LOGS
      console.log('league.players', league?.players);
      // registeredPuuids will be filled below
      if (!league || !league.matches || !league.matches[selectedDay]) return;

      const lobbies = league.matches[selectedDay];
      const maxMatches = Math.max(...lobbies.map((l) => l.matchIds.length));
      setColumnCount(maxMatches);

      const playerScores = {};
      // Map riotID -> puuid (from match data)
      const riotIdToPuuid = {};
      // Duyệt qua tất cả match để lấy mapping riotID -> puuid
      Object.values(allMatchData).forEach((match) => {
        match.info.participants.forEach((p) => {
          const riotId = `${p.riotIdGameName}#${p.riotIdTagline}`;
          riotIdToPuuid[riotId] = p.puuid;
        });
      });

      // Map puuid <-> player info, registeredPuuids
      const puuidToPlayer = {};
      const registeredPuuids = new Set();
      league.players.forEach((p) => {
        const riotId = p.ign?.[0];
        const puuid = riotIdToPuuid[riotId];
        if (puuid) {
          puuidToPlayer[puuid] = { ...p, riotId };
          registeredPuuids.add(puuid);
        }
      });
      console.log('registeredPuuids', Array.from(registeredPuuids));

      for (let matchIndex = 0; matchIndex < maxMatches; matchIndex++) {
        // DEBUG
        console.log('lobbies', lobbies);
        const presentPlayers = new Set();
        let matchExists = false;

        for (const lobby of lobbies) {
          // DEBUG
          // console.log('lobby', lobby);
          const matchId = lobby.matchIds[matchIndex];
          if (matchId === '0' || !allMatchData[matchId]) continue;
          matchExists = true;

          const match = allMatchData[matchId];
          // DEBUG
          // console.log('match', match);
          const participants = match.info.participants.map((p) => ({
            puuid: p.puuid,
            placement: p.placement,
          }));
          // DEBUG
          // console.log('participants', participants);

          const outsiders = participants.filter((p) => !registeredPuuids.has(p.puuid));
          const outsidersPlacements = outsiders.map((p) => p.placement);

          match.info.participants.forEach((p) => {
            // DEBUG
            // console.log('participant', p);
            const puuid = p.puuid;
            let score = 9 - p.placement;

            if (!registeredPuuids.has(puuid)) return;

            presentPlayers.add(puuid);

            const outsiderAbove = outsidersPlacements.filter((o) => o < p.placement).length;
            if (outsiderAbove > 0) {
              score += outsiderAbove;
            }

            if (!playerScores[puuid]) {
              playerScores[puuid] = {
                puuid,
                riotId: puuidToPlayer[puuid]?.riotId || '',
                scores: Array(maxMatches).fill(0),
                total: 0,
              };
            }

            playerScores[puuid].scores[matchIndex] = score;
            playerScores[puuid].total += score;
          });
        }

        registeredPuuids.forEach((puuid) => {
          if (!playerScores[puuid]) {
            playerScores[puuid] = {
              puuid,
              riotId: puuidToPlayer[puuid]?.riotId || '',
              scores: Array(maxMatches).fill(0),
              total: 0,
            };
          }

          if (matchExists && !presentPlayers.has(puuid)) {
            playerScores[puuid].scores[matchIndex] = 1;
            playerScores[puuid].total += 1;
          }
        });
      }

      const sorted = Object.values(playerScores).sort((a, b) => b.total - a.total);
      console.log('playerScores', playerScores);

      // === LỌC TOP 8 NGÀY TRƯỚC NẾU LÀ NGÀY CUỐI ===
      let filtered = sorted;

      const matchKeys = Object.keys(league.matches);
      const lastDayKey = matchKeys[matchKeys.length - 1];
      const prevDayKey = matchKeys[matchKeys.length - 2];

      if (selectedDay === lastDayKey && league.matches[prevDayKey]) {
        const prevLobbies = league.matches[prevDayKey];
        const maxMatchesPrev = Math.max(...prevLobbies.map((l) => l.matchIds.length));
        const prevScores = {};

        for (let matchIndex = 0; matchIndex < maxMatchesPrev; matchIndex++) {
          for (const lobby of prevLobbies) {
            const matchId = lobby.matchIds[matchIndex];
            if (matchId === '0' || !allMatchData[matchId]) continue;

            const match = allMatchData[matchId];
            match.info.participants.forEach((p) => {
              const puuid = p.puuid;
              if (!registeredPuuids.has(puuid)) return;

              if (!prevScores[puuid]) prevScores[puuid] = 0;
              prevScores[puuid] += 9 - p.placement;
            });
          }
        }

        const top8Puuids = Object.entries(prevScores)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([puuid]) => puuid);

        filtered = sorted.filter((p) => top8Puuids.includes(p.puuid));
      }

      // GẮN AVATAR VÀ LOGO
      const playerMap = {};
      league.players.forEach((p) => {
        const riotId = p.ign?.[0];
        const puuid = riotIdToPuuid[riotId];
        const avatar = `https://drive.google.com/thumbnail?id=${p.logoUrl}`;
        const teamLogo = `https://drive.google.com/thumbnail?id=${p.team.logoTeam}`;
        if (puuid) {
          playerMap[puuid] = {
            avatar: avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
            teamLogo: teamLogo || null,
            riotId: riotId || '',
          };
        }
      });

      const leaderboardWithProfile = filtered.map((p) => ({
        ...p,
        avatar: playerMap[p.puuid]?.avatar,
        teamLogo: playerMap[p.puuid]?.teamLogo,
        name: playerMap[p.puuid]?.riotId || p.riotId || p.puuid,
      }));

      setLeaderboardData(leaderboardWithProfile);
      console.log('leaderboardData', leaderboardWithProfile);
    };

    generateLeaderboard();
  }, [selectedDay, league, allMatchData]);

  const navigationAll1 = {
    aov: [
      {
        name: 'Tổng quan',
        href: `/${game}/${league_id}`,
        current: location.pathname === `/${game}/${league_id}`,
      },
      {
        name: 'Người chơi',
        href: `/${game}/${league_id}/players`,
        current: location.pathname === `/${game}/${league_id}/players`,
      },
      {
        name: 'BXH',
        href: `/${game}/${league_id}/leaderboard`,
        current: location.pathname === `/${game}/${league_id}/leaderboard`,
      },
      {
        name: 'Luật',
        href: `/${game}/${league_id}/rule`,
        current: location.pathname === `/${game}/${league_id}/rule`,
      },
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
        endTime={league.season.time_end}
        currentUser={currentUser}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        getNavigation={getNavigation}
        MyNavbar2={MyNavbar2}
        league_id={league_id}
        me={me}
        game={game}
      />

      <div className="flex justify-center mt-4">
        <select
          value={selectedDay || ''}
          onChange={(e) => setSelectedDay(e.target.value)}
          className="text-white p-2 rounded"
          disabled={!selectedDay}
        >
          {Object.keys(league?.matches || {}).map((dayKey, index) => (
            <option key={dayKey} value={dayKey}>
              Vòng {index + 1}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto mt-6 px-4 bg-base-100">
        <table className="table table-auto min-w-max text-center lg:w-full w-[120%]">
          <thead>
            <tr>
              <th className="sticky left-0 bg-base-100 z-20">Tên người chơi</th>
              <th className=" bg-base-100 z-20">Tổ chức</th>
              <th>Tổng điểm</th>
              {Array.from({ length: columnCount }).map((_, i) => (
                <th key={i}>Trận {i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(selectedDay === Object.keys(league.matches).slice(-1)[0]
              ? leaderboardData.slice(0, 8)
              : leaderboardData
            ).map((player, index) => (
              <tr key={index}>
                <td className="sticky left-0 bg-base-100 z-10 flex items-center space-x-4 py-2 pl-2">
                  <img
                    src={`${player.avatar}`}
                    alt="player-logo"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span className="text-white font-semibold sm:text-[15px] text-[12px]">
                    {player.name}
                  </span>
                </td>
                <td className="z-10">
                  <img
                    src={player.teamLogo || ''}
                    alt="team-logo"
                    className={`w-10 h-10 rounded-full object-cover mx-auto ${
                      player.teamLogo == 'https://drive.google.com/thumbnail?id=' ? 'invisible' : ''
                    }`}
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
