import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PlayerStats from './match.jsx';
import Valoveto from './vetoshow.jsx';
import { useSelector } from 'react-redux';
import MyNavbar2 from '../components/Navbar2';
import LeagueHeader from '../components/header';
import { useLeagueData } from '../hooks/useLeagueData';
export default function MatchStat2() {
  const { game, league_id, round, match } = useParams();
  const { currentUser } = useSelector((state) => state.user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [joinCountdown, setJoinCountdown] = useState('');
  const [registerPhase, setRegisterPhase] = useState('idle');
  const [registeredPlayers, setRegisteredPlayers] = useState([]);
  // Use new hook for all match data
  const {
    league,
    loading: isLoading,
    startTime,
    me,
    matchid,
    teamA,
    teamB,
    botype,
    banpickid,
    matchInfo,
    time,
    error,
  } = useLeagueData(game, league_id, currentUser, round, match);
  const hexToRgba = (hex, opacity) => {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

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

  // Compute all unique RiotIDs from matchInfo
  const allPlayer = [
    ...new Set(
      (matchInfo || []).flatMap((match) =>
        match.players
          ?.filter((player) => player.gameName && player.tagLine)
          .map((player) => `${player.gameName}#${player.tagLine}`)
      )
    ),
  ];

  // Derive findteam from league.players
  const findteam = Object.values(
    (league?.players || []).reduce((acc, player) => {
      if (player.team && player.team.name && !acc[player.team.name]) {
        acc[player.team.name] = {
          teamName: player.team.name,
          logoUrl: player.logoUrl || player.team.logoTeam,
          shortName: player.team.shortName,
          color: player.team.color || '#ffffff',
        };
      }
      return acc;
    }, {})
  );

  // Derived state: uniquePlayers, teams, logos, registeredPlayers, etc.
  useEffect(() => {
    if (
      !league ||
      !league.players ||
      league.players.length === 0 ||
      !matchInfo ||
      matchInfo.length === 0 ||
      !teamA ||
      !teamB
    ) {
      return;
    }
    // Step 1: uniquePlayers
    const extractedPlayers = matchInfo.flatMap((match) =>
      match.players
        ?.filter((player) => player.gameName && player.tagLine)
        .map((player) => `${player.gameName}#${player.tagLine}`)
    );
    const uniquePlayers = [...new Set(extractedPlayers)];
    // Step 2: teams (no longer needed to set state, handled as local variables)
    // Step 3: registeredPlayers
    const leaguePlayers = league.players;
    const leagueIGNs = leaguePlayers.flatMap((player) =>
      player.ign.map((ign) => ign.toLowerCase().trim())
    );
    const registeredPlayers = uniquePlayers.map((riotID) => {
      const isRegistered = leagueIGNs.includes(riotID.toLowerCase().trim());
      const playerObj = leaguePlayers.find((p) =>
        p.ign.map((i) => i.toLowerCase().trim()).includes(riotID.toLowerCase().trim())
      );
      return {
        riotID,
        isRegistered,
        teamname: playerObj?.team?.name || null,
        logoUrl: playerObj?.logoUrl || null,
      };
    });
    setRegisteredPlayers(registeredPlayers);
  }, [league, matchInfo, teamA, teamB]);

  // Kiểm tra kết quả
  useEffect(() => {
    console.log('Unique players:', allPlayer);
  }, [allPlayer]);
  useEffect(() => {
    console.log(matchInfo);
  }, [matchInfo]);
  const formatTime = (utcTime) => {
    const date = new Date(utcTime);
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
    const time = new Intl.DateTimeFormat('en-US', options).format(date);

    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const daySuffix = getDaySuffix(day);

    return `${time} - ${day}${daySuffix} ${month} ${year}`;
  };
  const getPlayerTeamName = (player) => {
    if (!registeredPlayers || registeredPlayers.length === 0) return null;

    const normalizedId = `${player.gameName}#${player.tagLine}`.toLowerCase().trim();
    const registeredPlayer = registeredPlayers.find(
      (rp) => rp.riotID.toLowerCase().trim() === normalizedId
    );

    return registeredPlayer?.teamname || null;
  };
  const calculateTotalWins = () => {
    let totalWinsA = 0;
    let totalWinsB = 0;

    matchInfo.forEach((match) => {
      // Count verified players for each team
      let verifiedA = 0;
      let verifiedB = 0;
      match.players.forEach((player) => {
        const normalizedId = `${player.gameName}#${player.tagLine}`.toLowerCase().trim();
        const reg = registeredPlayers.find(
          (p) => p.riotID.toLowerCase().trim() === normalizedId && p.isRegistered
        );
        const playerTeamName = getPlayerTeamName(player);
        if (reg) {
          if (playerTeamName === teamA) verifiedA++;
          if (playerTeamName === teamB) verifiedB++;
        }
      });
      if (verifiedA > verifiedB) {
        totalWinsA += 1;
      } else if (verifiedB > verifiedA) {
        totalWinsB += 1;
      } else {
        // fallback: use in-game score if equal
        const sortedPlayers = match.players.reduce((acc, player) => {
          const playerTeamName = getPlayerTeamName(player);
          if (playerTeamName) {
            acc[playerTeamName] = player.teamId;
          }
          return acc;
        }, {});
        let actualTeamA =
          Object.keys(sortedPlayers).find((team) => sortedPlayers[team] === 'Red') || 'Đội Đỏ';
        let actualTeamB =
          Object.keys(sortedPlayers).find((team) => sortedPlayers[team] === 'Blue') || 'Đội Xanh';
        const redTeam = match.teams.find((team) => team.teamId === 'Red');
        const blueTeam = match.teams.find((team) => team.teamId === 'Blue');
        let scoreA = redTeam ? redTeam.roundsWon : 0;
        let scoreB = blueTeam ? blueTeam.roundsWon : 0;
        if (actualTeamA !== teamA) {
          [actualTeamA, actualTeamB] = [actualTeamB, actualTeamA];
          [scoreA, scoreB] = [scoreB, scoreA];
        }
        if (scoreA > scoreB) {
          totalWinsA += 1;
        } else {
          totalWinsB += 1;
        }
      }
    });

    return { totalWinsA, totalWinsB };
  };

  // Gọi hàm tính tổng trận thắng
  const { totalWinsA, totalWinsB } = calculateTotalWins();
  const getDaySuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
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
      document.title = 'Đang tải'; // Tiêu đề mặc định
    }
  }, [teamA, teamB]);

  // Hàm xác định trạng thái xác thực của player (dùng cho icon Verify)
  const getVerificationStatus = (gameName, tagLine) => {
    if (!registeredPlayers || registeredPlayers.length === 0) return '';
    const normalizedId = `${gameName}#${tagLine}`.toLowerCase().trim();
    const player = registeredPlayers.find((p) => p.riotID.toLowerCase().trim() === normalizedId);
    return player && player.isRegistered ? (
      <img src={Verify} className="w-4 h-4 inline-block ml-1" alt="verified" />
    ) : (
      ''
    );
  };

  // Derive team info from league and teamA/teamB
  const teamsMap = {};
  (league?.players || []).forEach((player) => {
    if (player.team && player.team.name && !teamsMap[player.team.name]) {
      teamsMap[player.team.name] = {
        color: player.team.color || '#ffffff',
        shortName: player.team.shortName,
        logoUrl: player.logoUrl || player.team.logoTeam,
      };
    }
  });
  const teamABgColor = teamsMap[teamA]?.color || '#ffffff';
  const teamBBgColor = teamsMap[teamB]?.color || '#ffffff';
  const teamAshort = teamsMap[teamA]?.shortName || teamA;
  const teamBshort = teamsMap[teamB]?.shortName || teamB;
  const teamALogo = teamsMap[teamA]?.logoUrl
    ? `https://drive.google.com/thumbnail?id=${teamsMap[teamA].logoUrl}`
    : '';
  const teamBLogo = teamsMap[teamB]?.logoUrl
    ? `https://drive.google.com/thumbnail?id=${teamsMap[teamB].logoUrl}`
    : '';

  if (
    isLoading ||
    !league ||
    !league.players ||
    league.players.length === 0 ||
    !matchInfo ||
    matchInfo.length === 0 ||
    !teamA ||
    !teamB
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-dots loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <>
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

      <div className="matchstat">
        <div className="scoreboard-title">
          <div className="scoreboard w-full">
            <div
              className="team teamleft w-full flex items-center"
              style={{ backgroundColor: hexToRgba(teamABgColor, 0.2) }}
            >
              <div className="logo">
                <img
                  className="w-12 h-12 ml-2 max-lg:ml-0 max-lg:w-9 max-lg:h-9"
                  src={teamALogo}
                  alt="Team Left Logo"
                />
              </div>
              <div className="teamname">
                <span className="block sm:hidden">{teamAshort}</span>{' '}
                {/* Hiển thị teamAshort khi màn hình nhỏ hơn sm */}
                <span className="hidden sm:block">{teamA}</span>{' '}
                {/* Hiển thị teamA khi màn hình từ sm trở lên */}
              </div>
            </div>
            <div className="score-and-time">
              <div className="score bg-[#362431]">
                <span
                  className={`scoreA ${totalWinsA > totalWinsB ? 'green-win' : 'red-lose'}`}
                  id="score-left"
                >
                  {totalWinsA}
                </span>
              </div>
              <div className="time text-sm uppercase bg-[#362431] text-white">
                <span>Fin</span>
                <span>{formatTime(time)}</span>
              </div>
              <div className="score bg-[#362431]">
                <span
                  className={`scoreB ${totalWinsA < totalWinsB ? 'green-win' : 'red-lose'}`}
                  id="score-right"
                >
                  {totalWinsB}
                </span>
              </div>
            </div>
            <div
              className="team teamright w-full flex items-center "
              style={{ backgroundColor: hexToRgba(teamBBgColor, 0.2) }}
            >
              <div className="logo">
                <img
                  className="w-12 h-12 mr-2 max-lg:mr-0 max-lg:w-9 max-lg:h-9"
                  src={teamBLogo}
                  alt="Team Right Logo"
                />
              </div>
              <div className="teamname">
                <span className="block sm:hidden">{teamBshort}</span>{' '}
                {/* Hiển thị teamAshort khi màn hình nhỏ hơn sm */}
                <span className="hidden sm:block">{teamB}</span>{' '}
                {/* Hiển thị teamA khi màn hình từ sm trở lên */}
              </div>
            </div>
          </div>

          <div className="title bg-[#362431]">
            <span className="league all-title">{league.league.name.toLocaleUpperCase()}</span>
            <span className="group all-title text-white">
              Nhánh {capitalizeFirstLetter(round)} ● {botype}
            </span>
          </div>
        </div>
        <div className="flex">
          <div className="w-full">
            <Valoveto banpickid={banpickid} teams={findteam} />
          </div>
        </div>
        <div>
          <PlayerStats
            data={matchInfo}
            registeredPlayers={registeredPlayers} // Thêm dòng này
            teamA={teamA}
            teamB={teamB}
          />
        </div>
      </div>
    </>
  );
}
