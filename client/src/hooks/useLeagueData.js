import { useState, useEffect } from "react";
import axios from "axios";

let cachedLeague = null;
let cachedMe = null; // cache user luôn
let cachedParams = { game: null, league_id: null, user_id: null };

export const useLeagueData = (game, league_id, currentUser) => {
  const [league, setLeague] = useState(cachedLeague);
  const [loading, setLoading] = useState(!cachedLeague);
  const [startTime, setStartTime] = useState(null);
  const [me, setMe] = useState(cachedMe);

  useEffect(() => {
    const fetchLeague = async () => {
      if (
        cachedLeague &&
        cachedParams.game === game &&
        cachedParams.league_id === league_id
      ) {
        return; // Đã cache league rồi
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
          cachedParams.game = game;
          cachedParams.league_id = league_id;
        }
      } catch (err) {
        console.error("❌ Fetch League Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeague();
  }, [game, league_id]);

  useEffect(() => {
    const fetchMe = async () => {
      if (!currentUser?._id) return;

      if (
        cachedMe &&
        cachedParams.user_id === currentUser._id
      ) {
        return; // Đã cache user rồi
      }

      try {
        const res = await axios.get(
          `https://bigtournament-hq9n.onrender.com/api/user/${currentUser._id}`
        );
        setMe(res.data);
        cachedMe = res.data;
        cachedParams.user_id = currentUser._id;
      } catch (err) {
        console.error("❌ Fetch Me Error:", err);
      }
    };

    fetchMe();
  }, [currentUser]);

  return { league, loading, startTime, me };
};

export const resetLeagueCache = () => {
  cachedLeague = null;
  cachedMe = null;
  cachedParams = { game: null, league_id: null, user_id: null };
};
