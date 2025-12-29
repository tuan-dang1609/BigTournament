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

  const formatTierFile = (tier) => {
    if (!tier) return 'Unranked';
    const t = String(tier).toLowerCase();
    return t.charAt(0).toUpperCase() + t.slice(1);
  };

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
    const fetchBootcampLeaderboard = async () => {
      try {
        const res = await fetch(`/api/auth/${game}/bootcamp/${league_id}/leaderboard`);
        if (!res.ok) throw new Error('Failed to fetch bootcamp leaderboard');
        const data = await res.json();
        const entries = data.rank_league || [];

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

        // sort by leaguePoints then wins
        mapped.sort(
          (a, b) => (b.leaguePoints || 0) - (a.leaguePoints || 0) || (b.wins || 0) - (a.wins || 0)
        );
        setLeaderboardData(mapped);
      } catch (err) {
        console.error('Error fetching bootcamp leaderboard', err);
      }
    };

    fetchBootcampLeaderboard();
  }, [game, league_id, league]);

  const navigationAll1 = {
    aov: [
      {
        name: 'Tổng quan',
        href: `/${game}/bootcamp/${league_id}`,
        current: location.pathname === `/${game}/${league_id}`,
      },
      {
        name: 'Người chơi',
        href: `/${game}/bootcamp/${league_id}/players`,
        current: location.pathname === `/${game}/${league_id}/players`,
      },
      {
        name: 'BXH',
        href: `/${game}/bootcamp/${league_id}/leaderboard`,
        current: location.pathname === `/${game}/${league_id}/leaderboard`,
      },
      {
        name: 'Luật',
        href: `/${game}/bootcamp/${league_id}/rule`,
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

      <div className="overflow-x-auto mt-6 px-4 bg-base-100">
        <table className="table table-auto min-w-max text-center lg:w-full w-full font-semibold">
          <thead>
            <tr>
              <th className="sticky left-0 bg-base-100 z-20">Tên người chơi</th>
              <th className="bg-base-100 z-20">Rank</th>
              <th>Wins</th>
              <th>Losses</th>
              <th>Winrate</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.map((player, index) => (
              <tr key={player.puuid || index}>
                <td className="sticky left-0 bg-base-100 z-10 flex items-center space-x-4 py-2 pl-2">
                  <img
                    src={player.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                    alt="player-logo"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span className="text-white font-semibold sm:text-[15px] text-[12px]">
                    {player.name}
                  </span>
                </td>

                <td className="items-center justify-center">
                  <div className="flex items-center justify-center gap-x-2 whitespace-nowrap">
                    <img
                      src={`/ranklol/${formatTierFile(player.tier)}.png`}
                      className="w-16 h-16"
                    />
                    <span>
                      {player.rank
                        ? player.rank
                        : player.tier
                        ? formatTierFile(player.tier)
                        : '-'}
                    </span>
                    <span>{player.leaguePoints ?? '-'} LP</span>
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
