import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import MyNavbar2 from '../components/Navbar2';
import LeagueHeader from '../components/header';
import { useLeagueData } from '../hooks/useLeagueData';
import { Link } from 'react-router-dom';
import Image from '../image/waiting.png';

// Utility to get all unique teams from league.players
function getAllTeamsFromLeague(league) {
  if (!league?.players) return {};
  const teamsMap = {};
  league.players.forEach((player) => {
    if (player.team && player.team.name && player.team.logoTeam) {
      // Map by full name (team.name)
      teamsMap[player.team.name] = {
        logo: player.team.logoTeam,
        fullName: player.team.name,
        shortName: player.team.shortName || player.team.name, // add shortName from league
      };
    }
  });
  return teamsMap; // { fullName: {...}, ... }
}

const TournamentBracket = ({ league, game, league_id }) => {
  const [teams, setTeams] = useState([[], [], [], []]);
  const [loading, setLoading] = useState(true);
  const [idmatch, setMatchId] = useState([]);

  // Fetch bracket structure from Google Sheets and map to league teams
  const fetchTeams = async () => {
    try {
      const response = await fetch(
        `https://docs.google.com/spreadsheets/d/${league.season.bracket_id}/gviz/tq?sheet=Play-in&range=A1:R20`
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      const json = JSON.parse(text.substring(47, text.length - 2));

      // Get mapping from league
      const teamsMap = getAllTeamsFromLeague(league);
      const columns = [0, 3, 6, 9, 12, 15];
      const updatedTeams = columns.map((col) =>
        json.table.rows.map((row) => {
          const teamName = row.c[col + 1]?.v || 'Unknown';
          const teamInfo = teamsMap[teamName] || {};
          return {
            name: teamInfo.fullName || teamName,
            shortName: teamInfo.shortName || teamName, // use league shortName if available
            icon:
              teamInfo.logo && teamInfo.logo !== 'null'
                ? `https://drive.google.com/thumbnail?id=${teamInfo.logo}`
                : Image,
            score: row.c[col + 2]?.v || 0,
          };
        })
      );
      setTeams(updatedTeams);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all match data for the bracket
  const fetchGames = async () => {
    try {
      const response = await fetch(
        'https://bigtournament-hq9n.onrender.com/api/auth/findallmatchid',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setMatchId(data);
      console.log('Fetched idmatch:', data); // Debug log
    } catch (error) {
      console.error('Failed to fetch games:', error);
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchGames();
  }, [league]);

  // Updated getMatchLink to accept round and matchNum for unique match lookup
  const getMatchLink = (team1, team2, round, matchNum) => {
    if (!team1.name || !team2.name) return '#';

    const match = idmatch.find(
      (m) =>
        ((m.teamA.toLowerCase() === team1.name.toLowerCase() &&
          m.teamB.toLowerCase() === team2.name.toLowerCase()) ||
          (m.teamA.toLowerCase() === team2.name.toLowerCase() &&
            m.teamB.toLowerCase() === team1.name.toLowerCase())) &&
        (round ? m.round === round : true)
    );

    if (match) {
      if (Array.isArray(match.matchid) && match.matchid.some((id) => !id || id.trim() === '')) {
        return `/${game}/${league_id}/${match.round}/${match.Match}/lobby`;
      } else {
        return `/${game}/${league_id}/${match.round}/${match.Match}/match`;
      }
    } else {
      return '#';
    }
  };

  const roundStyles = {
    '0W-0L': { border: 'border-gray-300', titleBg: 'bg-[#D9D9D94D]' },
    '1W-0L': { border: 'border-gray-300', titleBg: 'bg-[#D9D9D94D]' },
    '1W-1L': { border: 'border-gray-300', titleBg: 'bg-[#D9D9D94D]' },
    '0W-1L': { border: 'border-gray-300', titleBg: 'bg-[#D9D9D94D]' },
    'Advance to play-off': { border: 'border-gray-300', titleBg: 'bg-[#D9D9D94D]' },
  };

  // Helper: get display name (show shortName if match, else full name)
  const getDisplayName = (team) => {
    if (!team || !team.name) return 'Unknown';
    // Try to find a match in idmatch
    const match = idmatch.find(
      (m) =>
        m.teamA.toLowerCase() === team.name.toLowerCase() ||
        m.teamB.toLowerCase() === team.name.toLowerCase()
    );
    if (match && team.shortName && team.shortName !== team.name) {
      return team.shortName; // show shortName if available and in a match
    }
    // If shortName exists and is not empty, prefer it
    if (team.shortName && team.shortName !== team.name) {
      return team.shortName;
    }
    return team.name;
  };

  // Updated renderMatchup to log round and matchNum on click
  const renderMatchup = (
    team1,
    team2,
    round,
    matchNum,
    hasMargin = true,
    additionalMargin = ''
  ) => (
    <Link
      to={getMatchLink(team1, team2, round, matchNum)}
      onClick={() => {
        console.log('Clicked match:', { round, matchNum, team1: team1.name, team2: team2.name });
      }}
      className={`relative flex flex-col gap-y-[3px] overflow-hidden ${
        hasMargin ? 'my-4' : 'mb-0'
      } ${additionalMargin}`}
    >
      {[team1, team2].map((team, index) => (
        <div
          key={index}
          className={`2xl:pl-[6px] pl-[4px] flex items-center justify-between bg-white`}
        >
          <div className="flex items-center">
            <img src={team?.icon} alt={team?.name || 'Team Logo'} className="w-8 h-8 mr-2" />
            <span className="text-black">{getDisplayName(team) || 'Unknown'}</span>
          </div>
          <div className="flex items-center justify-center w-14 h-14 bg-[#d9d9d9e5]">
            <span className="font-bold text-[#f4aa49ef] text-[19px]">{team?.score || 0}</span>
          </div>
        </div>
      ))}
    </Link>
  );

  // Updated renderSection to pass round and matchNum to renderMatchup
  const renderSection = (title, matchups, className = '') => {
    const styles = roundStyles[title] || { border: 'border-gray-300', titleBg: 'bg-[#D9D9D94D]' };

    return (
      <div
        className={`flex flex-col  ${styles.border} overflow-hidden ${
          title === '1W-1L' ? 'lg:mt-5' : ''
        }`}
      >
        <h2 className={`text-lg font-bold p-2 ${styles.titleBg} border ${styles.border} `}>
          {title}
        </h2>
        <div className="py-2">
          {matchups.map((matchup, index) => (
            <div key={index} className={className}>
              {renderMatchup(matchup[0] || {}, matchup[1] || {}, title, (index + 1).toString())}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Debug: log all possible team pair matchings after teams and idmatch are loaded
  useEffect(() => {
    if (!teams || !idmatch || teams.length === 0 || idmatch.length === 0) return;
    // Flatten all teams arrays and filter out empty slots
    const allTeamsFlat = teams.flat().filter((t) => t && t.shortName);
    for (let i = 0; i < allTeamsFlat.length; i++) {
      for (let j = i + 1; j < allTeamsFlat.length; j++) {
        getMatchLink(allTeamsFlat[i], allTeamsFlat[j]);
      }
    }
  }, [teams, idmatch]);

  // Debug: log if teams from the bracket are present in the league variable
  useEffect(() => {
    if (!teams || teams.length === 0 || !league) return;
    const teamsMap = getAllTeamsFromLeague(league);
    const allTeamsFlat = teams.flat().filter((t) => t && t.shortName);
    allTeamsFlat.forEach((team) => {
      if (!teamsMap[team.shortName]) {
        console.log('TEAM NOT IN LEAGUE:', team.shortName, team);
      } else {
        console.log('TEAM IN LEAGUE:', team.shortName, team);
      }
    });
  }, [teams, league]);

  return (
    <div className="container mx-auto p-4 relative">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <span className="loading loading-dots loading-lg text-primary"></span>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-5 text-center">Vòng Play-off</h1>
          <div className="flex flex-col lg:flex-row justify-between space-y-8 lg:space-y-0 lg:space-x-16 relative">
            <div className="w-full lg:w-1/4 relative">
              <div>
                {renderSection(
                  'Semi Final',
                  [
                    [teams[0][0], teams[0][1]],
                    [teams[0][2], teams[0][3]],
                    [teams[0][4], teams[0][5]],
                    [teams[0][6], teams[0][7]],
                  ],
                  'lg:!mb-[48px] lg:last:!mb-[0px] lg:first:!mt-[10px]'
                )}
              </div>
            </div>
            <div className="w-full lg:w-1/4 relative">
              {renderSection(
                'Bán kết (BO5)',
                [
                  [teams[1][0], teams[1][1]],
                  [teams[1][2], teams[1][3]],
                ],
                'lg:!mt-[100px] last:!mb-[0px] lg:!mb-[208px]'
              )}
            </div>
            <div className="w-full lg:w-1/4 relative">
              {renderSection(
                'Chung kết nhánh thắng (BO5)',
                [[teams[2][0], teams[2][1]]],
                'lg:!mt-[262px] last:!mb-[0px]'
              )}
            </div>
            <div className="hidden lg:block lg:w-1/4 relative">
              {renderSection('Chung kết tổng', [[teams[3][0], teams[3][1]]], 'lg:!mt-[530px]')}
            </div>
          </div>
          <div className="flex flex-col lg:w-[74%] lg:flex-row justify-between space-y-8 lg:space-y-0 lg:space-x-16 relative">
            <div className="w-full lg:w-1/4 relative">
              <div>
                {renderSection(
                  'Last Chance 1 (BO5)',
                  [
                    [teams[0][9], teams[0][10]],
                    [teams[0][11], teams[0][12]],
                  ],
                  'lg:!mb-[48px] lg:last:!mb-[0px] lg:first:!mt-[10px]'
                )}
              </div>
            </div>
            <div className="w-full lg:w-1/4 relative">
              {renderSection(
                'Last Chance 2 (BO5)',
                [
                  [teams[1][9], teams[1][10]],
                  [teams[1][11], teams[1][12]],
                ],
                'lg:!mb-[48px] lg:last:!mb-[0px] lg:first:!mt-[10px]'
              )}
            </div>
            <div className="w-full lg:w-1/4 relative">
              {renderSection(
                'Tranh hạng 4 (BO5)',
                [[teams[2][9], teams[2][10]]],
                'lg:first:!mt-[98px]'
              )}
            </div>
            <div className="w-full lg:w-1/4 relative">
              {renderSection(
                'Trang Hạng 3 (BO5)',
                [[teams[3][9], teams[3][10]]],
                'lg:first:!mt-[98px]'
              )}
            </div>
            <div className="w-full lg:hidden relative">
              {renderSection(
                'Chung kết tổng',
                [[teams[3][0], teams[3][1]]],
                'lg:!mt-[500px] last:!mb-[0px]'
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}; // <-- Closing brace for TournamentBracket

const BracketPage = () => {
  const [loading, setLoading] = useState(true);
  const { currentUser } = useSelector((state) => state.user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [joinCountdown, setJoinCountdown] = useState('');
  const [registerPhase, setRegisterPhase] = useState('idle');
  const { game, league_id } = useParams();
  const { league, startTime, me } = useLeagueData(game, league_id, currentUser);
  if ((me, league)) {
    console.log('LEAGUE DATA in BracketPage:', league, me);
  }

  const max = parseInt(league?.season?.max_registration) || 64;
  const currentPlayer = league?.players?.find(
    (p) => String(p.usernameregister) === String(currentUser?._id)
  );

  const isCheckedin = currentPlayer?.isCheckedin === true;

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
        name: 'Luật',
        href: `/${game}/${league_id}/rule`,
        current: location.pathname === `/${game}/${league_id}/rule`,
      },
      {
        name: 'BXH',
        href: `/${game}/${league_id}/leaderboard`,
        current: location.pathname === `/${game}/${league_id}/leaderboard`,
      },
    ],
  };

  const getNavigation = () => navigationAll1.aov;

  if (!league) {
    return (
      <div className="min-h-screen flex justify-center items-center text-white">
        <span className="loading loading-dots loading-lg text-primary">Loading league...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-white">
      {/* Header Section */}
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

      {/* Bracket Section */}
      <div className="flex justify-center items-start p-8">
        <TournamentBracket league={league} game={game} league_id={league_id} />
      </div>
    </div>
  );
};

export default BracketPage;
