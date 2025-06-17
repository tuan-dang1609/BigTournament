import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLeagueData } from '../hooks/useLeagueData';
import MyNavbar2 from '../components/Navbar2';
import LeagueHeader from '../components/header';
import { io } from 'socket.io-client';

const socket = io('https://bigtournament-hq9n.onrender.com', {
  transports: ['websocket'],
  withCredentials: true,
});

const ValorantLobby = () => {
  const [countdown, setCountdown] = useState(30);
  const [matchFound, setMatchFound] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [joinCountdown, setJoinCountdown] = useState('');
  const [registerPhase, setRegisterPhase] = useState('idle');
  const [matchData, setMatchData] = useState(null);
  const [banpickData, setBanpickData] = useState(null);
  const [playersReady, setPlayersReady] = useState({ team1: [], team2: [] });

  // Get URL parameters and current user
  const { game, league_id, round, match } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);

  // Use the league data hook
  const { league, startTime, me } = useLeagueData(game, league_id, currentUser);

  // Player data structure
  const [players, setPlayers] = useState({
    team1: [],
    team2: [],
  });

  // Navigation configuration
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
  // Utility: get number of maps (BO1/BO3/BO5)
  const getTotalMaps = () => {
    if (banpickData && banpickData.maps && Array.isArray(banpickData.maps.selected)) {
      return banpickData.maps.selected.length;
    }
    // fallback: BO1
    return 1;
  };

  const getMapNames = () => {
    if (banpickData && banpickData.maps && Array.isArray(banpickData.maps.selected)) {
      return banpickData.maps.selected;
    }
    return Array(getTotalMaps()).fill('Unknown');
  };

  // Ensure mapNames is defined at the top-level of the component so it's available everywhere
  const mapNames = getMapNames();
  // Remove mapIndex from the route and useParams, and instead compute it based on matchData.matchid.length + 1
  // Compute mapIndex based on matchData.matchid.length (if available)
  const matchidLength =
    matchData && Array.isArray(matchData.matchid) ? matchData.matchid.length : 0;
  const mapIndex = matchidLength;
  const matchStartTimes =
    matchData && Array.isArray(matchData.matchStartTimes) ? matchData.matchStartTimes : [];
  const currentMatchStartTime = matchStartTimes[mapIndex]
    ? new Date(matchStartTimes[mapIndex])
    : null;
  // For the first match, use a fixed time if needed (e.g., from league or config)
  // For subsequent matches, use the stored time
  // Accept window: 15 minutes after start
  const acceptWindowMinutes = 15;
  const acceptEndTime = currentMatchStartTime
    ? new Date(currentMatchStartTime.getTime() + acceptWindowMinutes * 60000)
    : null;
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  const timeLeft = acceptEndTime ? Math.max(0, Math.floor((acceptEndTime - now) / 1000)) : 0;
  const showReadyButton = timeLeft > 0;

  // Get the current map name from banpickData.maps.selected using mapIndex
  const currentMapName = mapNames[mapIndex] || `Map ${mapIndex + 1}`;
  // Socket.io: join/leave match room and listen for updates
  useEffect(() => {
    if (!round || !match) return;
    socket.emit('joinMatchLobby', { round, match });
    socket.on('playerReadyUpdated', (data) => {
      if (data.round === round && data.match === match) {
        setMatchData((prev) => ({ ...prev, playersReady: data.playersReady }));
      }
    });
    socket.on('matchDataUpdated', (data) => {
      if (data.round === round && data.match === match) {
        setMatchData(data.matchData);
      }
    });
    return () => {
      socket.emit('leaveMatchLobby', { round, match });
      socket.off('playerReadyUpdated');
      socket.off('matchDataUpdated');
    };
  }, [round, match]);

  // Fetch match data, banpick data, and player data all in one effect
  useEffect(() => {
    const fetchAll = async () => {
      if (!round || !match) return;
      setLoading(true);
      try {
        // 1. Fetch match data
        const response = await axios.get(
          `https://bigtournament-hq9n.onrender.com/api/auth/findmatch/${round}/${match}`
        );
        setMatchData({ ...response.data.matchData });
        setPlayersReady(response.data.matchData.playersReady || { team1: [], team2: [] });
        setBanpickData(response.data.banpickData);

        // 2. Fetch team players
        const teamPlayers = await getTeamPlayers(response.data.matchData);
        // 3. Fetch player profiles
        const [team1Profiles, team2Profiles] = await Promise.all([
          fetchPlayerProfiles(teamPlayers.team1),
          fetchPlayerProfiles(teamPlayers.team2),
        ]);
        const createPlayerData = (profiles, teamKey) => {
          if (!Array.isArray(profiles)) return [];
          if (profiles.length === 0) return [];
          return profiles
            .map((profile, index) => {
              if (!profile || typeof profile !== 'object') return null;
              const riotID = profile.name || profile.riotID || `Unknown#${index}`;
              const readyStatus =
                response.data.matchData.playersReady?.[teamKey]?.find(
                  (p) => p && p.riotID === riotID
                )?.isReady || false;
              return {
                id: `${teamKey}_${index + 1}`,
                riotID: String(riotID),
                username: String(profile.nickname || riotID.split('#')[0] || 'Unknown'),
                avatar: `https://drive.google.com/thumbnail?id=${
                  profile.profilePicture || '1wRTVjigKJEXt8iZEKnBX5_2jG7Ud3G-L'
                }&sz=w100`,
                isReady:
                  response.data.matchData.playersReady?.[teamKey]?.find(
                    (p) => p && p.riotID === riotID
                  )?.isReady || [],
              };
            })
            .filter((player) => player !== null);
        };
        setPlayers({
          team1: createPlayerData(team1Profiles, 'team1'),
          team2: createPlayerData(team2Profiles, 'team2'),
        });
      } catch (error) {
        setError('Failed to load match/player data');
        setPlayers({ team1: [], team2: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [round, match]);

  // Fetch player profiles from your API
  const fetchPlayerProfiles = async (riotIDs) => {
    // Validate input - ensure it's an array
    if (!Array.isArray(riotIDs)) {
      console.log('RiotIDs is not an array:', riotIDs);
      return [];
    }

    if (riotIDs.length === 0) {
      console.log('No riot IDs provided');
      return [];
    }

    try {
      // Use GET and send riotIDs as a query parameter (comma-separated)
      const response = await axios.get(
        'https://bigtournament-hq9n.onrender.com/api/auth/fetchplayerprofilesvalo',
        {
          params: {
            players: riotIDs.join(','),
          },
        }
      );

      // Ensure response is an array
      const profiles = Array.isArray(response.data) ? response.data : [];
      console.log('Fetched profiles:', profiles);
      return profiles;
    } catch (error) {
      console.error('Error fetching player profiles:', error);
      // Return fallback data as array
      return riotIDs.map((riotID) => ({
        name: riotID,
        nickname: riotID.split('#')[0],
        avatar: '1wRTVjigKJEXt8iZEKnBX5_2jG7Ud3G-L',
      }));
    }
  };

  // Get team names from banpick data or match data
  const getTeamNames = () => {
    if (banpickData && banpickData.team1 && banpickData.team2) {
      return {
        team1: String(banpickData.team1),
        team2: String(banpickData.team2),
      };
    }
    if (matchData && matchData.teamA && matchData.teamB) {
      return {
        team1: String(matchData.teamA),
        team2: String(matchData.teamB),
      };
    }
    return {
      team1: 'Team 1',
      team2: 'Team 2',
    };
  };

  // Fix: getTeamPlayers should accept matchData as argument for initial load
  const getTeamPlayers = async (dataForTeams) => {
    const data = dataForTeams || matchData;
    if (!data || !data.teamA || !data.teamB) {
      console.log('No match data available');
      return { team1: [], team2: [] };
    }
    try {
      const response = await axios.get(
        `https://bigtournament-hq9n.onrender.com/api/auth/${game}/${league_id}/check-registered-valorant`,
        {
          params: {
            teamA: data.teamA,
            teamB: data.teamB,
          },
        }
      );
      if (!Array.isArray(response.data)) {
        console.error('Invalid response format from check-registered-valorant');
        return { team1: [], team2: [] };
      }
      const team1Players = response.data
        .filter((player) => player && player.team && player.team.name === data.teamA)
        .flatMap((player) => (Array.isArray(player.igns) ? player.igns : []))
        .filter((riotID) => riotID && typeof riotID === 'string');
      const team2Players = response.data
        .filter((player) => player && player.team && player.team.name === data.teamB)
        .flatMap((player) => (Array.isArray(player.igns) ? player.igns : []))
        .filter((riotID) => riotID && typeof riotID === 'string');
      return {
        team1: team1Players,
        team2: team2Players,
      };
    } catch (error) {
      console.error('Error fetching team players:', error);
      return { team1: [], team2: [] };
    }
  };

  // Only update ready status in players state on socket event
  useEffect(() => {
    socket.on('playerReadyUpdated', (data) => {
      if (data.round === round && data.match === match) {
        setPlayersReady(data.playersReady);
        setPlayers((prev) => {
          const updateReady = (teamArr, teamKey) =>
            teamArr.map((p) => {
              if (!p) return p;
              const found = data.playersReady?.[teamKey]?.find((x) => x.riotID === p.riotID);
              return found ? { ...p, isReady: found.isReady } : p;
            });
          return {
            team1: updateReady(prev.team1, 'team1'),
            team2: updateReady(prev.team2, 'team2'),
          };
        });
      }
    });
    return () => socket.off('playerReadyUpdated');
  }, [round, match]);

  // Update togglePlayerReady to accept mapIndex and totalMaps
  const togglePlayerReady = async (teamKey, playerId, mapIndex) => {
    const player = players[teamKey].find((p) => p && p.id === playerId);
    if (!player) return;
    const totalMaps = getTotalMaps();
    // Get current ready status for this map
    const readyArr = Array.isArray(player.isReady) ? player.isReady : [player.isReady];
    const isReadyForMap = readyArr[mapIndex] || false;
    try {
      await axios.post('https://bigtournament-hq9n.onrender.com/api/auth/updatePlayerReady', {
        round,
        match,
        riotID: player.riotID,
        isReady: !isReadyForMap,
        team: teamKey,
        mapIndex,
        totalMaps,
      });
      // Wait for socket event to update UI
    } catch (error) {
      console.error('Error updating player ready status:', error);
    }
  };

  // Get map name from banpick data
  const getMapName = () => {
    if (!banpickData) return 'Haven';

    try {
      // Check for selected maps
      if (
        banpickData.maps?.selected &&
        Array.isArray(banpickData.maps.selected) &&
        banpickData.maps.selected.length > 0
      ) {
        return String(banpickData.maps.selected[0]);
      }

      // Check for decider map
      if (banpickData.deciderMap) {
        return String(banpickData.deciderMap);
      }

      return 'Haven';
    } catch (error) {
      console.error('Error getting map name:', error);
      return 'Haven';
    }
  };

  // Utility: check if current user is in the lobby
  const isCurrentUserInLobby = () => {
    if (!me?.riotID) return false;
    const allPlayers = [...players.team1, ...players.team2];
    return allPlayers.some((player) => player && player.riotID === me.riotID);
  };

  // Handle current user ready/unready for the current map
  const handleCurrentUserReady = () => {
    if (!me?.riotID) return;
    // Find which team the user is in
    let teamKey = null;
    let playerId = null;
    for (const key of ['team1', 'team2']) {
      const player = players[key].find((p) => p && p.riotID === me.riotID);
      if (player) {
        teamKey = key;
        playerId = player.id;
        break;
      }
    }
    if (!teamKey || !playerId) return;
    togglePlayerReady(teamKey, playerId, mapIndex);
  };

  // Early return for loading league data
  if (!league) {
    return (
      <div className="min-h-screen flex justify-center items-center text-white">
        <span className="loading loading-dots loading-lg text-primary">Loading league...</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-blue-500"></div>
          <p className="text-white mt-4">Loading lobby...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate ready count for each team (only first 5 ready count)
  const readyCountTeam1 = players.team1
    .filter((p) => p && Array.isArray(p.isReady) && p.isReady[mapIndex])
    .slice(0, 5).length;
  const readyCountTeam2 = players.team2
    .filter((p) => p && Array.isArray(p.isReady) && p.isReady[mapIndex])
    .slice(0, 5).length;
  const readyPlayersCount = readyCountTeam1 + readyCountTeam2;
  const totalRequiredPlayers =
    Math.min(5, players.team1.length) + Math.min(5, players.team2.length);
  const allPlayersReady = readyCountTeam1 === 5 && readyCountTeam2 === 5;
  const currentUserPlayer = [...players.team1, ...players.team2].find(
    (p) => p && p.riotID === me?.riotID
  );
  const teamNames = getTeamNames();
  const mapName = getMapName();

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

      <div className="min-h-screen mb-20">
        {/* Header */}
        <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid md:grid-cols-3 grid-cols-1 items-center justify-between relative">
              <div className="flex items-center space-x-4 w-full md:w-auto justify-start md:justify-start min-w-[260px]">
                <img src="/image/val_icon.png" alt="Valorant" className="h-8" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Phòng chờ trận đấu</h1>
                  <p className="text-gray-400">
                    Competitive • {round} • {match}
                  </p>
                </div>
              </div>

              {/* Countdown Centered */}
              <div className="flex-1 flex md:justify-center justify-start  items-center py-4 md:order-2 order-1">
                <div className="flex items-center text-center md:flex-col flex-row-reverse md:gap-x-0 gap-x-2">
                  <div
                    className={`text-4xl font-bold ${
                      timeLeft <= 10 ? 'text-red-400' : 'text-white'
                    }`}
                  >
                    {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
                    {String(timeLeft % 60).padStart(2, '0')}
                  </div>
                  <div className="text-gray-400 text-sm">Thời gian xác nhận</div>
                </div>
              </div>

              <div className="flex items-center space-x-4 md:order-3 order-3 w-full md:w-auto justify-end md:justify-end min-w-[180px]">
                {/* On small screens, show image left and text right; on md+, text left and image right */}
                <div className="flex flex-row-reverse md:flex-row items-center md:gap-x-0 gap-x-2 space-x-2 md:space-x-4 w-full md:w-auto">
                  <div className=" md:text-right text-left w-full md:w-auto">
                    <div className="text-white font-semibold">Bản đồ</div>
                    <div className="text-gray-400">{currentMapName}</div>
                  </div>
                  <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden mr-2 md:mr-0 ml-0 md:ml-2">
                    <img
                      src={`/image/${currentMapName}.jpg`}
                      alt={currentMapName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/image/haven.jpg';
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Match Status */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div
            className={`text-center py-4 rounded-lg ${
              allPlayersReady
                ? 'bg-green-900/30 border border-green-500'
                : 'bg-yellow-900/30 border border-yellow-500'
            }`}
          >
            <div
              className={`text-lg font-semibold ${
                allPlayersReady ? 'text-green-400' : 'text-yellow-400'
              }`}
            >
              {allPlayersReady
                ? '✅ Tất cả người chơi đã sẵn sàng - Trận đấu sẽ bắt đầu sớm!'
                : '⏳ Chờ tất cả người chơi...'}
            </div>
          </div>
        </div>

        {/* Teams */}
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <div className="grid lg:grid-cols-2 gap-8 relative">
            <TeamSection
              team={players.team1}
              teamName={teamNames.team1}
              teamKey="team1"
              teamColor="bg-gradient-to-r from-blue-600 to-blue-700"
              me={me}
              mapIndex={mapIndex}
            />

            <div className="flex items-center justify-center lg:hidden">
              <div className="text-4xl font-bold text-gray-500">VS</div>
            </div>

            <TeamSection
              team={players.team2}
              teamName={teamNames.team2}
              teamKey="team2"
              teamColor="bg-gradient-to-r from-red-600 to-red-700"
              me={me}
              mapIndex={mapIndex}
            />

            {/* VS Divider for desktop */}
            <div className="hidden lg:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center border-4 border-gray-600">
                <span className="text-2xl font-bold text-white">VS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-4">
                {/* Ready Button for Current User */}
                {isCurrentUserInLobby() &&
                  showReadyButton &&
                  (() => {
                    const myTeamKey = players.team1.some((p) => p.riotID === me?.riotID)
                      ? 'team1'
                      : 'team2';
                    const myPlayer = players[myTeamKey].find((p) => p.riotID === me?.riotID);
                    const readyCount = players[myTeamKey]
                      .filter((p) => p && Array.isArray(p.isReady) && p.isReady[mapIndex])
                      .slice(0, 5).length;
                    // If current user is already ready, always show the cancel button
                    if (Array.isArray(myPlayer?.isReady) && myPlayer.isReady[mapIndex]) {
                      return (
                        <>
                          <button
                            onClick={handleCurrentUserReady}
                            className="px-6 py-3 rounded-lg font-semibold transition-colors bg-red-600 hover:bg-red-700 text-white"
                          >
                            HỦY
                          </button>
                          <div className="w-px h-8 bg-gray-600"></div>
                        </>
                      );
                    }
                    // If not ready and 5 are already ready, hide the button
                    if (readyCount >= 5) return null;
                    // Otherwise, show the ready button
                    return (
                      <>
                        <button
                          onClick={handleCurrentUserReady}
                          className="px-6 py-3 rounded-lg font-semibold transition-colors bg-green-600 hover:bg-green-700 text-white"
                        >
                          SẴN SÀNG
                        </button>
                        <div className="w-px h-8 bg-gray-600"></div>
                      </>
                    );
                  })()}

                <div className="text-center">
                  <div className="text-white font-semibold">
                    {readyPlayersCount}/{totalRequiredPlayers} Sẵn sàng
                  </div>
                  <div className="text-gray-400 text-sm">Người chơi</div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-lg font-semibold ${
                      allPlayersReady ? 'text-green-400' : 'text-yellow-400'
                    }`}
                  >
                    {allPlayersReady ? 'Sẵn sàng bắt đầu trận đấu' : 'Chờ tất cả người chơi'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Pass 'me' and 'mapIndex' as a prop to PlayerCard and TeamSection
const TeamSection = ({ team, teamName, teamKey, teamColor, me, mapIndex }) => {
  if (!Array.isArray(team)) {
    console.error(`Team ${teamKey} is not an array:`, team);
    return (
      <div className="space-y-4">
        <div className={`text-center py-3 rounded-lg ${teamColor}`}>
          <h2 className="text-xl font-bold text-white">{teamName}</h2>
          <div className="text-sm text-gray-300">Không tìm thấy người chơi</div>
        </div>
      </div>
    );
  }
  // Only count the first 5 ready players
  const readyPlayers = team.filter(
    (player) => player && Array.isArray(player.isReady) && player.isReady[mapIndex]
  );
  const readyCount = readyPlayers.length > 5 ? 5 : readyPlayers.length;
  const maxReady = Math.min(5, team.length);
  // Find the index of the current user in the team
  const currentUserIndex = team.findIndex((p) => p && me && p.riotID === me.riotID);
  // Only allow ready button for first 5 players or if not enough ready yet
  const canCurrentUserReady =
    currentUserIndex > -1 &&
    (currentUserIndex < 5 ||
      readyCount < 5 ||
      (Array.isArray(team[currentUserIndex].isReady) && team[currentUserIndex].isReady[mapIndex]));
  // Hide ready button for players 6+ if 5 are already ready
  const hideReadyForExtra = (idx) => idx >= 5 && readyCount >= 5;
  return (
    <div className="space-y-4">
      <div className={`text-center py-3 rounded-lg ${teamColor}`}>
        <h2 className="text-xl font-bold text-white">{teamName}</h2>
        <div className="text-sm text-gray-300">
          {readyCount}/{maxReady} Sẵn sàng
        </div>
      </div>
      <div className="space-y-3">
        {team.length === 0 ? (
          <div className="text-center text-gray-400 py-4">
            Không có người chơi nào đăng ký cho đội này
          </div>
        ) : (
          team.map((player, idx) =>
            player ? (
              <PlayerCard
                key={player.id}
                player={player}
                teamKey={teamKey}
                me={me}
                mapIndex={mapIndex}
                canReady={canCurrentUserReady || idx < 5}
                hideReady={hideReadyForExtra(idx)}
              />
            ) : null
          )
        )}
      </div>
    </div>
  );
};

const PlayerCard = ({ player, teamKey, me, mapIndex, canReady, hideReady }) => {
  if (!player) return null;
  const isCurrentUser = me?.riotID === player.riotID;
  const readyArr = Array.isArray(player.isReady) ? player.isReady : [player.isReady];
  return (
    <div
      className={`bg-gray-800 rounded-lg p-4 border-2 transition-all duration-300 ${
        readyArr[mapIndex] ? 'border-green-500 bg-green-900/20' : 'border-red-500 bg-red-900/20'
      } ${isCurrentUser ? '' : ''}`}
    >
      <div className="flex items-center space-x-3">
        <div className="relative">
          <img
            src={player.avatar}
            alt={player.username}
            className="w-12 h-12 rounded-full border-2 border-gray-600 object-cover"
            onError={(e) => {
              e.target.src =
                'https://drive.google.com/thumbnail?id=1wRTVjigKJEXt8iZEKnBX5_2jG7Ud3G-L&sz=w100';
            }}
          />
          <div
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-800 ${
              readyArr[mapIndex] ? 'bg-green-500' : 'bg-red-500'
            }`}
          ></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-white font-semibold truncate" title={player.riotID}>
              {player.username}
            </h3>
            {isCurrentUser && (
              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">BẠN</span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-1 truncate" title={player.riotID}>
            {player.riotID}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValorantLobby;
