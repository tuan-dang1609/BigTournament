import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
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
  const [allPlayersReady, setAllPlayersReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [joinCountdown, setJoinCountdown] = useState('');
  const [registerPhase, setRegisterPhase] = useState('idle');
  const [matchData, setMatchData] = useState(null);
  const [banpickData, setBanpickData] = useState(null);

  // Get URL parameters and current user
  const { game, league_id, round, match } = useParams();
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

  // Fetch match data and banpick data
  useEffect(() => {
    const fetchMatchData = async () => {
      if (!round || !match) return;

      setLoading(true);
      try {
        const response = await axios.get(
          `https://bigtournament-hq9n.onrender.com/api/auth/findmatch/${round}/${match}`
        );

        console.log('Match Response:', response.data);
        setMatchData(response.data.matchData);
        setBanpickData(response.data.banpickData);
      } catch (error) {
        console.error('Error fetching match data:', error);
        setError('Failed to load match data');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchData();
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
      const response = await axios.get('http://localhost:3000/api/auth/fetchplayerprofilesvalo', {
        params: {
          players: riotIDs.join(','),
        },
      });

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

  // Get ready players from registered teams
  const getTeamPlayers = async () => {
    if (!matchData || !matchData.teamA || !matchData.teamB) {
      console.log('No match data available');
      return { team1: [], team2: [] };
    }

    try {
      // Use the new GET endpoint with teamA and teamB as query params
      const response = await axios.get(
        `http://localhost:3000/api/auth/${game}/${league_id}/check-registered-valorant`,
        {
          params: {
            teamA: matchData.teamA,
            teamB: matchData.teamB,
          },
        }
      );

      if (!Array.isArray(response.data)) {
        console.error('Invalid response format from check-registered-valorant');
        return { team1: [], team2: [] };
      }

      // Filter players by team
      const team1Players = response.data
        .filter((player) => player && player.team && player.team.name === matchData.teamA)
        .flatMap((player) => (Array.isArray(player.igns) ? player.igns : []))
        .filter((riotID) => riotID && typeof riotID === 'string');

      const team2Players = response.data
        .filter((player) => player && player.team && player.team.name === matchData.teamB)
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

  // Initialize players data
  useEffect(() => {
    const initializePlayers = async () => {
      if (!matchData) return;

      try {
        const teamPlayers = await getTeamPlayers();
        console.log('Team Players Result:', teamPlayers);

        // Fetch profiles for both teams - ensure we always get arrays
        const [team1Profiles, team2Profiles] = await Promise.all([
          fetchPlayerProfiles(teamPlayers.team1),
          fetchPlayerProfiles(teamPlayers.team2),
        ]);

        console.log('Team1 Profiles:', team1Profiles);
        console.log('Team2 Profiles:', team2Profiles);

        // Create player objects with strict validation
        const createPlayerData = (profiles, teamKey) => {
          // CRITICAL: Ensure profiles is always an array
          if (!Array.isArray(profiles)) {
            console.error(`Profiles for ${teamKey} is not an array:`, profiles);
            return []; // Return empty array instead of trying to map
          }

          // If profiles array is empty, return empty array
          if (profiles.length === 0) {
            console.log(`No profiles found for ${teamKey}`);
            return [];
          }

          return profiles
            .map((profile, index) => {
              if (!profile || typeof profile !== 'object') {
                console.error(`Invalid profile at index ${index}:`, profile);
                return null;
              }

              const riotID = profile.name || profile.riotID || `Unknown#${index}`;
              const readyStatus =
                matchData.playersReady?.[teamKey]?.find((p) => p && p.riotID === riotID)?.isReady ||
                false;

              return {
                id: `${teamKey}_${index + 1}`,
                riotID: String(riotID),
                username: String(profile.nickname || riotID.split('#')[0] || 'Unknown'),
                avatar: `https://drive.google.com/thumbnail?id=${
                  profile.avatar || '1wRTVjigKJEXt8iZEKnBX5_2jG7Ud3G-L'
                }&sz=w100`,
                isReady: Boolean(readyStatus),
              };
            })
            .filter((player) => player !== null); // Remove null entries
        };

        const team1Data = createPlayerData(team1Profiles, 'team1');
        const team2Data = createPlayerData(team2Profiles, 'team2');

        console.log('Final Team1 Data:', team1Data);
        console.log('Final Team2 Data:', team2Data);

        setPlayers({
          team1: team1Data,
          team2: team2Data,
        });
      } catch (error) {
        console.error('Error initializing players:', error);
        setError('Failed to load player data');
        // Set empty arrays on error
        setPlayers({
          team1: [],
          team2: [],
        });
      }
    };

    initializePlayers();
  }, [matchData]);

  // Check if current user is in the lobby
  const isCurrentUserInLobby = () => {
    if (!me?.riotID) return false;
    const allPlayers = [...players.team1, ...players.team2];
    return allPlayers.some((player) => player && player.riotID === me.riotID);
  };

  // Countdown timer effect
  useEffect(() => {
    if (matchFound && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, matchFound]);

  // Check if all players are ready (max 5 per team)
  useEffect(() => {
    if (players.team1.length > 0 && players.team2.length > 0) {
      const team1Ready = players.team1.filter((p) => p && p.isReady).length;
      const team2Ready = players.team2.filter((p) => p && p.isReady).length;

      // Each team needs max 5 players ready
      const team1RequiredReady = Math.min(5, players.team1.length);
      const team2RequiredReady = Math.min(5, players.team2.length);

      setAllPlayersReady(team1Ready >= team1RequiredReady && team2Ready >= team2RequiredReady);
    }
  }, [players]);

  // In togglePlayerReady, do NOT update local state directly, just call the API
  const togglePlayerReady = async (teamKey, playerId) => {
    const player = players[teamKey].find((p) => p && p.id === playerId);
    if (!player) return;

    try {
      await axios.post('https://bigtournament-hq9n.onrender.com/api/auth/updatePlayerReady', {
        round,
        match,
        riotID: player.riotID,
        isReady: !player.isReady,
        team: teamKey,
      });
      // Do not update local state here; wait for socket event
    } catch (error) {
      console.error('Error updating player ready status:', error);
    }
  };

  const handleCurrentUserReady = async () => {
    if (!isCurrentUserInLobby()) return;

    const allPlayers = [...players.team1, ...players.team2];
    const currentUserPlayer = allPlayers.find((p) => p && p.riotID === me.riotID);

    if (currentUserPlayer) {
      const teamKey = players.team1.some((p) => p && p.id === currentUserPlayer.id)
        ? 'team1'
        : 'team2';
      await togglePlayerReady(teamKey, currentUserPlayer.id);
    }
  };

  const PlayerCard = ({ player, teamKey }) => {
    if (!player) return null;

    const isCurrentUser = me?.riotID === player.riotID;

    return (
      <div
        className={`bg-gray-800 rounded-lg p-4 border-2 transition-all duration-300 ${
          player.isReady ? 'border-green-500 bg-green-900/20' : 'border-red-500 bg-red-900/20'
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
                player.isReady ? 'bg-green-500' : 'bg-red-500'
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

  const TeamSection = ({ team, teamName, teamKey, teamColor }) => {
    if (!Array.isArray(team)) {
      console.error(`Team ${teamKey} is not an array:`, team);
      return (
        <div className="space-y-4">
          <div className={`text-center py-3 rounded-lg ${teamColor}`}>
            <h2 className="text-xl font-bold text-white">{teamName}</h2>
            <div className="text-sm text-gray-300">No players found</div>
          </div>
        </div>
      );
    }

    const readyCount = team.filter((player) => player && player.isReady).length;
    const maxReady = Math.min(5, team.length);

    return (
      <div className="space-y-4">
        <div className={`text-center py-3 rounded-lg ${teamColor}`}>
          <h2 className="text-xl font-bold text-white">{teamName}</h2>
          <div className="text-sm text-gray-300">
            {readyCount}/{maxReady} Ready
          </div>
        </div>

        <div className="space-y-3">
          {team.length === 0 ? (
            <div className="text-center text-gray-400 py-4">
              No players registered for this team
            </div>
          ) : (
            team
              .slice(0, 5)
              .map((player) =>
                player ? <PlayerCard key={player.id} player={player} teamKey={teamKey} /> : null
              )
          )}
        </div>
      </div>
    );
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

  const readyPlayersCount = [...players.team1, ...players.team2].filter(
    (p) => p && p.isReady
  ).length;
  const totalRequiredPlayers =
    Math.min(5, players.team1.length) + Math.min(5, players.team2.length);
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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img src="/image/val_icon.png" alt="Valorant" className="h-8" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Match Lobby</h1>
                  <p className="text-gray-400">
                    Competitive • {round} • {match}
                  </p>
                </div>
              </div>

              <div className="text-center">
                <div
                  className={`text-4xl font-bold ${
                    countdown <= 10 ? 'text-red-400' : 'text-white'
                  }`}
                >
                  {String(Math.floor(countdown / 60)).padStart(2, '0')}:
                  {String(countdown % 60).padStart(2, '0')}
                </div>
                <div className="text-gray-400 text-sm">Time to accept</div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-white font-semibold">Map</div>
                  <div className="text-gray-400">{mapName}</div>
                </div>
                <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                  <img
                    src={`/image/${mapName}.jpg`}
                    alt={mapName}
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
                ? '✅ All Players Ready - Match Starting Soon!'
                : '⏳ Waiting for all players to ready up...'}
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
            />

            <div className="flex items-center justify-center lg:hidden">
              <div className="text-4xl font-bold text-gray-500">VS</div>
            </div>

            <TeamSection
              team={players.team2}
              teamName={teamNames.team2}
              teamKey="team2"
              teamColor="bg-gradient-to-r from-red-600 to-red-700"
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
                {isCurrentUserInLobby() && (
                  <>
                    <button
                      onClick={handleCurrentUserReady}
                      className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                        currentUserPlayer?.isReady
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {currentUserPlayer?.isReady ? 'HỦY' : 'SẴN SÀNG'}
                    </button>

                    <div className="w-px h-8 bg-gray-600"></div>
                  </>
                )}

                <div className="text-center">
                  <div className="text-white font-semibold">
                    {readyPlayersCount}/{totalRequiredPlayers} Ready
                  </div>
                  <div className="text-gray-400 text-sm">Players</div>
                </div>

                <div className="w-px h-8 bg-gray-600"></div>

                <div className="text-center">
                  <div
                    className={`text-lg font-semibold ${
                      allPlayersReady ? 'text-green-400' : 'text-yellow-400'
                    }`}
                  >
                    {allPlayersReady ? 'Ready to Start Match' : 'Waiting for All Players'}
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

export default ValorantLobby;
