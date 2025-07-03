import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import 'animate.css';
import MyNavbar2 from '../components/Navbar2';
import LeagueHeader from '../components/header';
import { useLeagueData } from '../hooks/useLeagueData';
import axios from 'axios';

const Leaderboard = () => {
  const [loading, setLoading] = useState(true);
  const { currentUser } = useSelector((state) => state.user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { game, league_id } = useParams();
  const { league, me } = useLeagueData(game, league_id, currentUser);
  const [allMatchData, setAllMatchData] = useState({});
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
    // Khi vào trang leaderboard, luôn fetch lại toàn bộ match data từ API
    if (!league?.matches) return;
    const matchIdSet = new Set();
    Object.values(league.matches || {}).forEach((day) => {
      day.forEach((lobby) => {
        lobby.matchIds.forEach((id) => {
          if (id !== '0') matchIdSet.add(id);
        });
      });
    });
    const fetchAllMatches = async () => {
      const matchFetchPromises = Array.from(matchIdSet).map((matchId) =>
        axios
          .get(`https://bigtournament-hq9n.onrender.com/api/tft/match/${matchId}`)
          .then((res) => ({ matchId, data: res.data }))
          .catch((err) => {
            console.error('❌ Match fetch failed for', matchId, err);
            return { matchId, data: null };
          })
      );
      const matchResults = await Promise.all(matchFetchPromises);
      const allMatchDataTemp = {};
      matchResults.forEach(({ matchId, data }) => {
        if (data) allMatchDataTemp[matchId] = data;
      });
      setAllMatchData(allMatchDataTemp);
    };
    fetchAllMatches();
  }, [league]);

  useEffect(() => {
    const generateLeaderboard = () => {
      if (!league || !league.matches || !league.matches[selectedDay]) return;
      if (!allMatchData || Object.keys(allMatchData).length === 0) return;

      const lobbies = league.matches[selectedDay];
      const maxMatches = Math.max(...lobbies.map((l) => l.matchIds.length));
      setColumnCount(maxMatches);

      const playerScores = {};
      const registeredNames = new Set(league.players.map((p) => p.ign?.[0]).filter(Boolean));

      for (let matchIndex = 0; matchIndex < maxMatches; matchIndex++) {
        const presentPlayers = new Set();
        let matchExists = false;

        for (const lobby of lobbies) {
          const matchId = lobby.matchIds[matchIndex];
          if (matchId === '0' || !allMatchData[matchId]) continue;
          matchExists = true;

          const match = allMatchData[matchId];
          const participants = match.info.participants.map((p) => ({
            name: `${p.riotIdGameName}#${p.riotIdTagline}`,
            placement: p.placement,
          }));

          const outsiders = participants.filter((p) => !registeredNames.has(p.name));
          const outsidersPlacements = outsiders.map((p) => p.placement);

          match.info.participants.forEach((p) => {
            const name = `${p.riotIdGameName}#${p.riotIdTagline}`;
            let score = 9 - p.placement;

            if (!registeredNames.has(name)) return;

            presentPlayers.add(name);

            const outsiderAbove = outsidersPlacements.filter((o) => o < p.placement).length;
            if (outsiderAbove > 0) {
              score += outsiderAbove;
            }

            if (!playerScores[name]) {
              playerScores[name] = {
                name,
                scores: Array(maxMatches).fill(0),
                total: 0,
              };
            }

            playerScores[name].scores[matchIndex] = score;
            playerScores[name].total += score;
          });
        }

        registeredNames.forEach((name) => {
          if (!playerScores[name]) {
            playerScores[name] = {
              name,
              scores: Array(maxMatches).fill(0),
              total: 0,
            };
          }

          if (matchExists && !presentPlayers.has(name)) {
            playerScores[name].scores[matchIndex] = 1;
            playerScores[name].total += 1;
          }
        });
      }

      const sorted = Object.values(playerScores).sort((a, b) => b.total - a.total);

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
              const name = `${p.riotIdGameName}#${p.riotIdTagline}`;
              if (!registeredNames.has(name)) return;

              if (!prevScores[name]) prevScores[name] = 0;
              prevScores[name] += 9 - p.placement;
            });
          }
        }

        const top8Names = Object.entries(prevScores)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name]) => name);

        filtered = sorted.filter((p) => top8Names.includes(p.name));
      }

      // GẮN AVATAR VÀ LOGO
      const playerMap = {};
      league.players.forEach((p) => {
        const ign = p.ign?.[0];
        const avatar = `https://drive.google.com/thumbnail?id=${p.logoUrl}`;
        const teamLogo = `https://drive.google.com/thumbnail?id=${p.team.logoTeam}`;
        if (ign) {
          playerMap[ign] = {
            avatar: avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
            teamLogo: teamLogo || null,
          };
        }
      });

      const leaderboardWithProfile = filtered.map((p) => ({
        ...p,
        avatar: playerMap[p.name]?.avatar,
        teamLogo: playerMap[p.name]?.teamLogo,
      }));

      setLeaderboardData(leaderboardWithProfile);
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
