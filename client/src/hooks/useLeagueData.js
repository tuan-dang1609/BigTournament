// hooks/useLeagueData.js
import { useState, useEffect } from "react";

let cachedLeague = null; // global cache
let cachedParams = { game: null, league_id: null };

export const useLeagueData = (game, league_id) => {
  const [league, setLeague] = useState(cachedLeague);
  const [loading, setLoading] = useState(!cachedLeague);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (
        cachedLeague &&
        cachedParams.game === game &&
        cachedParams.league_id === league_id
      ) {
        return; // ✅ Đã cache, không cần fetch lại
      }

      setLoading(true);
      try {
        const res = await fetch(`https://bigtournament-hq9n.onrender.com/api/auth/register/api/auth/${game}/${league_id}`);
        if (res.ok) {
          const data = await res.json();
          setLeague(data);
          setStartTime(new Date(data.season.time_start));

          // cache
          cachedLeague = data;
          cachedParams = { game, league_id };
        } else {
          console.warn("❌ API failed:", res.status);
        }
      } catch (err) {
        console.error("❌ Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [game, league_id]);

  return { league, loading, startTime };
};
export const resetLeagueCache = () => {
  cachedLeague = null;
  cachedParams = { game: null, league_id: null };
};