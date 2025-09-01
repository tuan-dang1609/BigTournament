import { useState, useEffect } from 'react';
import axios from 'axios';

let cachedLeague = null;
let cachedMe = null;
let cachedMatchData = {};
let cachedParams = { game: null, league_id: null, user_id: null };

export const useLeagueData = (game, league_id, currentUser) => {
  const [league, setLeague] = useState(cachedLeague);
  const [loading, setLoading] = useState(!cachedLeague);
  const [startTime, setStartTime] = useState(null);
  const [me, setMe] = useState(cachedMe);
  const [allMatchData, setAllMatchData] = useState({});

  useEffect(() => {
    const fetchAll = async () => {
      if (
        cachedLeague &&
        cachedParams.game === game &&
        cachedParams.league_id === league_id &&
        cachedMe &&
        cachedParams.user_id === currentUser?._id
      ) {
        setAllMatchData({ ...cachedMatchData });
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

        const [leagueData, meData] = await Promise.all([leaguePromise, mePromise]);

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

        // Fetch all match data in parallel
        const matchIdSet = new Set();
        Object.values(leagueData.matches || {}).forEach((day) => {
          day.forEach((lobby) => {
            lobby.matchIds.forEach((id) => {
              if (id !== '0') matchIdSet.add(id);
            });
          });
        });

        const matchFetchPromises = Array.from(matchIdSet).map((matchId) => {
          if (cachedMatchData[matchId]) {
            return Promise.resolve({ matchId, data: cachedMatchData[matchId] });
          }
          return fetch(`https://bigtournament-hq9n.onrender.com/api/tft/match/${matchId}`)
            .then((res) => res.json())
            .then((data) => {
              cachedMatchData[matchId] = data;
              return { matchId, data };
            })
            .catch((err) => {
              console.error('❌ Match fetch failed for', matchId, err);
              return { matchId, data: null };
            });
        });

        const matchResults = await Promise.all(matchFetchPromises);
        const allMatchDataTemp = {};
        matchResults.forEach(({ matchId, data }) => {
          if (data) allMatchDataTemp[matchId] = data;
        });
        setAllMatchData(allMatchDataTemp);
      } catch (err) {
        console.error('❌ Fetch all error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [game, league_id, currentUser]);

  return { league, loading, startTime, me, allMatchData };
};

export const resetLeagueCache = () => {
  cachedLeague = null;
  cachedMe = null;
  cachedMatchData = {};
  cachedParams = { game: null, league_id: null, user_id: null };
};
