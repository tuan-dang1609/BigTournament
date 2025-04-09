import { useState, useEffect } from "react";
import axios from "axios";

let cachedLeague = null;
let cachedParams = { game: null, league_id: null };

export const useLeagueData = (game, league_id, currentUser) => {
  const [league, setLeague] = useState(cachedLeague);
  const [loading, setLoading] = useState(!cachedLeague);
  const [startTime, setStartTime] = useState(null);
  const [me, setMe] = useState(null);

  // Fetch league
  useEffect(() => {
    const fetchData = async () => {
      if (
        cachedLeague &&
        cachedParams.game === game &&
        cachedParams.league_id === league_id
      ) {
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(
          `https://bigtournament-hq9n.onrender.com/api/auth/${game}/${league_id}`
        );
        if (res.ok) {
          const data = await res.json();
          setLeague(data);
          setStartTime(new Date(data.season.time_start));

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

  // Fetch user
  useEffect(() => {
    const fetchMe = async () => {
      if (!currentUser?._id) return;

      try {
        const res = await axios.get(
          `https://bigtournament-hq9n.onrender.com/api/user/${currentUser._id}`
        );
        setMe(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch user:", err);
      }
    };

    fetchMe();
  }, [currentUser]);

  return { league, loading, startTime, me };
};

export const resetLeagueCache = () => {
  cachedLeague = null;
  cachedParams = { game: null, league_id: null };
};
