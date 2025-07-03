import { useState, useEffect } from 'react';
import axios from 'axios';

let cachedLeague = null;
let cachedMe = null;
let cachedMatchData = {};
let cachedParams = { game: null, league_id: null, user_id: null };

export const useLeagueData = (game, league_id, currentUser, round, Match) => {
  const [league, setLeague] = useState(cachedLeague);
  const [loading, setLoading] = useState(!cachedLeague);
  const [startTime, setStartTime] = useState(null);
  const [me, setMe] = useState(cachedMe);

  // Valorant statmatch state
  const [matchid, setMatchid] = useState([]);
  const [teamA, setteamA] = useState([]);
  const [teamB, setteamB] = useState([]);
  const [botype, setBotype] = useState('');
  const [banpickid, setbanpickid] = useState('');
  const [matchInfo, setMatchInfo] = useState([]);
  const [time, setTime] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      if (
        cachedLeague &&
        cachedParams.game === game &&
        cachedParams.league_id === league_id &&
        cachedMe &&
        cachedParams.user_id === currentUser?._id
      ) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const leaguePromise = fetch(
          `https://bigtournament-hq9n.onrender.com/api/auth/${game}/${league_id}`
        ).then((res) => res.json());
        const mePromise = currentUser?._id
          ? axios
              .get(`https://bigtournament-hq9n.onrender.com/api/user/${currentUser._id}`)
              .then((res) => res.data)
          : Promise.resolve(null);

        // Fetch matchid and matchdata if round and Match are available
        let matchDataPromise = Promise.resolve(null);
        if (round && Match) {
          matchDataPromise = fetch('https://bigtournament-hq9n.onrender.com/api/auth/findmatchid', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ round, Match }),
          })
            .then((res) => {
              if (!res.ok) throw new Error('Match API call failed');
              return res.json();
            })
            .then(async (matchData) => {
              setMatchid(matchData.matchid);
              setteamA(matchData.teamA);
              setteamB(matchData.teamB);
              setBotype(
                matchData.matchid.length === 1
                  ? 'BO1'
                  : matchData.matchid.length <= 3
                  ? 'BO3'
                  : matchData.matchid.length <= 5
                  ? 'BO5'
                  : matchData.matchid.length <= 7
                  ? 'BO7'
                  : 'Invalid BO type'
              );
              setbanpickid(matchData.banpickid || '');
              const matchDetailPromises = matchData.matchid.map(async (id) => {
                const res = await fetch(
                  `https://bigtournament-hq9n.onrender.com/api/auth/valorant/matchdata/${id}`
                );
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const data = await res.json();
                return data.matchData;
              });
              const matchResults = await Promise.all(matchDetailPromises);
              setMatchInfo(matchResults);
              setTime(matchResults[0]?.matchInfo?.gameStartMillis);
              return true;
            })
            .catch((error) => {
              setError(error.message);
              return false;
            });
        }

        const [leagueData, meData] = await Promise.all([
          leaguePromise,
          mePromise,
          matchDataPromise,
        ]);

        if (leagueData) {
          setLeague(leagueData);
          setStartTime(new Date(leagueData.season.time_start));
          cachedLeague = leagueData;
          cachedParams.game = game;
          cachedParams.league_id = league_id;
        }

        if (meData) {
          setMe(meData);
          cachedMe = meData;
          cachedParams.user_id = currentUser._id;
        }
      } catch (err) {
        console.error('❌ Fetch all error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [game, league_id, currentUser, round, Match]);

  return {
    league,
    loading,
    startTime,
    me,
    // Không trả về allMatchData nữa
    matchid,
    teamA,
    teamB,
    botype,
    banpickid,
    matchInfo,
    time,
    error,
  };
};

export const resetLeagueCache = () => {
  cachedLeague = null;
  cachedMe = null;
  cachedMatchData = {};
  cachedParams = { game: null, league_id: null, user_id: null };
};
