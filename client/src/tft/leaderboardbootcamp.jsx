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

  const [leaderboardData, setLeaderboardData] = useState([]);
  const [nextRunIso, setNextRunIso] = useState(null);
  const [nextRunHuman, setNextRunHuman] = useState(null);
  const [countdownMs, setCountdownMs] = useState(null);

  const formatTierFile = (tier) => {
    if (!tier) return 'Unranked';
    const t = String(tier).toLowerCase();
    return t.charAt(0).toUpperCase() + t.slice(1);
  };

  const styles = `
  .hot-flame { animation: flame 1.2s infinite; display:inline-block; transform-origin:center; }
  .hot-flame { display:flex; align-items:center; justify-content:center; margin-right:6px; }
  .hot-flame svg { width:22px; height:22px; }
  @keyframes flame { 0%{transform:translateY(0) scale(1) rotate(0deg)}50%{transform:translateY(-3px) scale(1.05) rotate(6deg)}100%{transform:translateY(0) scale(1) rotate(0deg)} }
  .gradient-strip { position:absolute; left:0; top:0; bottom:0; width:140px; pointer-events:none; background: linear-gradient(90deg, rgba(255,74,74,1) 0%, rgba(255,74,74,0.0) 85%); animation: gradientPulse 2.8s ease-in-out infinite; z-index:0; }
  .gradient-strip.transparent { background: none !important; opacity:0 !important; pointer-events:none; transition: opacity 220ms ease, background 220ms ease; }
  .player-avatar, .team-logo { position: relative; z-index: 20; }
  .player-cell { position: relative; z-index: 10; display:flex; align-items:center; }
  .badge-slot { width:64px; flex:0 0 64px; display:flex; align-items:center; justify-content:center; z-index:30; }
  @keyframes gradientPulse { 0%{opacity:0.95}50%{opacity:0.5}100%{opacity:0.95} }
  .rank-badge { display:flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:6px; background:rgba(255,255,255,0.12); color:#fff; font-weight:700; font-size:14px; z-index:40; }
  
  `;

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
  const fetchBootcampLeaderboard = async () => {
    try {
      const res = await fetch(
        `https://bigtournament-1.onrender.com/api/auth/${game}/bootcamp/${league_id}/leaderboard`
      );
      if (!res.ok) throw new Error('Failed to fetch bootcamp leaderboard');
      const data = await res.json();
      const entries = data.rank_league || [];
      // capture nextRun iso/human for countdown
      if (data.nextRun?.iso) {
        setNextRunIso(data.nextRun.iso);
        setNextRunHuman(data.nextRun.human || null);
      } else {
        setNextRunIso(null);
        setNextRunHuman(null);
      }

      // attach avatar/teamLogo from league.players when possible
      const puuidToProfile = {};
      (league?.players || []).forEach((p) => {
        const riotId = p.ign?.[0];
        // many existing players store logoUrl and team.logoTeam
        puuidToProfile[p.puuid] = {
          avatar: p.logoUrl ? `https://drive.google.com/thumbnail?id=${p.logoUrl}` : null,
          teamLogo: p.team?.logoTeam
            ? `https://drive.google.com/thumbnail?id=${p.team.logoTeam}`
            : null,
          riotId,
        };
      });

      const mapped = entries.map((e) => ({
        ...e,
        name: `${e.gameName || ''}${e.tagLine ? '#' + e.tagLine : ''}`,
        avatar: puuidToProfile[e.puuid]?.avatar || null,
        teamLogo: puuidToProfile[e.puuid]?.teamLogo || null,
      }));

      // backend returns leaderboard in correct order; do not sort on frontend
      setLeaderboardData(mapped);
    } catch (err) {
      console.error('Error fetching bootcamp leaderboard', err);
    }
  };

  useEffect(() => {
    fetchBootcampLeaderboard();
  }, [game, league_id, league]);

  // countdown effect: compute ms remaining from nextRunIso and tick every second
  useEffect(() => {
    let timer = null;
    if (!nextRunIso) {
      setCountdownMs(null);
      return () => {};
    }
    const update = () => {
      const target = new Date(nextRunIso).getTime();
      const ms = Math.max(0, target - Date.now());
      setCountdownMs(ms);
      if (ms <= 0) {
        // when countdown reaches 0, re-fetch leaderboard instead of full reload
        clearInterval(timer);
        try {
          // kick a refresh and reset nextRunIso until API returns new nextRun
          setNextRunIso(null);
          fetchBootcampLeaderboard();
        } catch (e) {
          // ignore
        }
      }
    };
    update();
    timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [nextRunIso]);

  const formatCountdown = (ms) => {
    if (ms == null) return '-';
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  const navigationAll1 = {
    aov: [
      {
        name: 'Tổng quan',
        href: `/${game}/bootcamp/${league_id}`,
        current: location.pathname === `/${game}/bootcamp/${league_id}`,
      },
      {
        name: 'BXH',
        href: `/${game}/bootcamp/${league_id}/leaderboard`,
        current: location.pathname === `/${game}/bootcamp/${league_id}/leaderboard`,
      },
      {
        name: 'Luật',
        href: `/${game}/bootcamp/${league_id}/rule`,
        current: location.pathname === `/${game}/bootcamp/${league_id}/rule`,
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

      <div className="overflow-x-auto mt-6 px-4 bg-base-100">
        <style>{styles}</style>
        <div className="w-[70%] mx-auto text-sm text-gray-300">
          <div className="flex flex-row w-[160px] justify-center items-center gap-2 bg-slate-800/90 px-3 py-2 rounded-full">
            <span
              className=" rounded-full bg-red-500 shadow-[0_0_8px_rgba(255,107,107,0.6)] animate-pulse"
              aria-hidden
            />
            <span className="text-slate-300 font-bold">Cập nhật sau</span>
            <span className="text-transparent font-bold bg-clip-text bg-gradient-to-r  items-center from-[#ff7a59] to-[#ff3b30]">
              {formatCountdown(countdownMs)}
            </span>
          </div>
        </div>
        <table className="table table-auto min-w-max text-center w-[70%] mx-auto font-semibold">
          <thead>
            <tr>
              <th className="sticky left-0 bg-base-100 z-20">Tên người chơi</th>
              <th className="bg-base-100 z-20">Rank</th>
              <th>Thắng</th>
              <th>Thua</th>
              <th>Tỉ lệ thắng</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.map((player, index) => (
              <tr key={player.puuid || index}>
                <td className="relative left-0 bg-base-100 z-10 flex items-center space-x-4 py-2 pl-2 player-cell">
                  <div className="badge-slot">
                    <div className="rank-badge">{index + 1}</div>
                  </div>
                  <img
                    src={player.avatar || `https://drive.google.com/thumbnail?id=${player.logoUrl}`}
                    alt="player-logo"
                    className="w-10 h-10 rounded-full object-cover player-avatar"
                  />
                  <span className="text-white font-semibold sm:text-[15px] text-[12px]">
                    {player.name}
                  </span>
                  <div className="flex flex-row items-center">
                    <img
                      src={
                        player.team?.logoTeam
                          ? `https://drive.google.com/thumbnail?id=${player.team.logoTeam}`
                          : player.teamLogo || ''
                      }
                      alt="team-logo"
                      className={`w-10 h-10 rounded-full object-cover team-logo ${
                        !player.team?.logoTeam && !player.teamLogo ? 'invisible' : ''
                      }`}
                    />
                    {player.hotStreak ? (
                      <div className="hot-flame text-[20px] ml-2" aria-hidden>
                        🔥
                      </div>
                    ) : (
                      <div style={{ width: 18, height: 18 }} />
                    )}
                  </div>
                </td>

                <td className="items-center justify-center">
                  <div className="flex items-center justify-center gap-x-2 whitespace-nowrap">
                    <img
                      src={`/ranklol/${formatTierFile(player.tier)}.png`}
                      className="w-16 h-16"
                    />
                    <span>
                      {player.rank ? player.rank : player.tier ? formatTierFile(player.tier) : '-'}
                    </span>
                    <span>{player.leaguePoints} LP</span>
                  </div>
                </td>
                <td>{player.wins ?? '-'}</td>
                <td>{player.losses ?? '-'}</td>
                <td>{player.winrate ? `${player.winrate}%` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;
