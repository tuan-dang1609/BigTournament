import express from "express";
import dotenv from "dotenv";
import {
  findAllteamValorant,
  findAllteamTFT,
  findAllteamAOV,
  findAllteamTFTDouble,
  signin,
  signup,
  teamHOF,
  leagueHOF,
  findleagueHOF,
  findteamHOF,
  signout,
  getCorrectAnswers,
  comparePredictionmultiple,
  calculateMaxPoints,
  getUserPickemScore,
  comparePredictions,
  submitPrediction,
  submitCorrectAnswer,
  leaderboardpickem,
  finduserPrediction,
  findPlayer,
  findAllteam,
  addBanPickVeto,
  findBanPickVeto,
  addAllGame,
  findAllGame,
  addMatchID,
  findAllMatchID,
  findmatchID,
} from "../controllers/auth.controller.js";
import { fetchPlayerProfilesValo } from "../controllers/fetchPlayerProfilesValo.controller.js";
import QuestionPickem from "../models/question.model.js";
import PowerRankingAOV from "../models/powerRankingAOV.model.js";
import Response from "../models/response.model.js";
import TeamRegister from "../models/registergame.model.js";
import Match from "../models/match.model.js";
import User from "../models/user.model.js";
import BanPickValo from "../models/veto.model.js";
import Organization from "../models/team.model.js";
import DCNLeague from "../models/tournament.model.js";
import TeamTFT from "../models/registergame.model.js";
import Bracket from "../models/bracket.model.js";
import ValorantMatch from "../models/valorantmatch.model.js";
import MatchID from "../models/matchid.model.js";
dotenv.config();
const apiKeyValorant = process.env.API_KEY_VALORANT_RIOT;
const router = express.Router();
const calculatePlayerStats = (player, roundResults) => {
  const { puuid } = player;
  let firstKills = 0;
  let multiKills = 0;
  let headshots = 0;
  let bodyshots = 0;
  let legshots = 0;
  let totalDamage = 0;
  let firstDeaths = 0;
  let clutches = 0;
  let aces = 0;

  roundResults.forEach((round) => {
    const stats = round.playerStats?.find((stat) => stat.puuid === puuid);

    // Tìm first death
    const allKills =
      round.playerStats?.flatMap((stat) => stat.kills || []) || [];
    const earliestKill = allKills.reduce(
      (min, curr) =>
        curr.timeSinceRoundStartMillis < min.timeSinceRoundStartMillis
          ? curr
          : min,
      allKills[0]
    );
    if (earliestKill?.victim === puuid) firstDeaths += 1;

    if (stats) {
      const earliestKillTime = Math.min(
        ...allKills.map((k) => k.timeSinceRoundStartMillis)
      );
      const firstKill = stats.kills.find(
        (kill) =>
          kill.killer === puuid &&
          kill.timeSinceRoundStartMillis === earliestKillTime
      );
      if (firstKill) firstKills += 1;

      if ((stats.kills || []).length >= 3) multiKills += 1;

      (stats.damage || []).forEach((dmg) => {
        headshots += dmg.headshots || 0;
        bodyshots += dmg.bodyshots || 0;
        legshots += dmg.legshots || 0;
        totalDamage += dmg.damage || 0;
      });
    }

    // Đếm clutch/ace từ roundCeremony
    if (round.roundCeremony === "CeremonyClutch" && stats?.kills?.length) {
      clutches += 1;
    }
    if (round.roundCeremony === "CeremonyAce" && stats?.kills?.length >= 5) {
      aces += 1;
    }
  });

  const totalShots = headshots + bodyshots + legshots;
  const headshotPercentage =
    totalShots > 0
      ? parseFloat(((headshots / totalShots) * 100).toFixed(0))
      : 0;

  return {
    firstKills,
    multiKills,
    headshots,
    bodyshots,
    legshots,
    headshotPercentage,
    totalDamage,
    firstDeaths,
    clutches,
    aces,
  };
};

import axios from "axios";
router.post("/signup", signup);
router.post("/signin", signin);
router.get("/signout", signout);
router.post("/findallgame", findAllGame);
router.post("/findplayer", findPlayer);
router.post("/banpick", addBanPickVeto);
router.get("/findbanpick", findBanPickVeto);
router.post("/allgame", addAllGame);
router.post("/addmatch", addMatchID);
router.post("/findallmatchid", findAllMatchID);
router.get("/findmatchid", findmatchID);
router.get("/findallteam", findAllteam);
router.get("/findallteamAOV", findAllteamAOV);
router.get("/findallteamTFT", findAllteamTFT);
router.get("/findallteamValorant", findAllteamValorant);
router.post("/findallteamTFTDouble", findAllteamTFTDouble);
router.post("/submitPrediction", submitPrediction);
router.post("/checkuserprediction", finduserPrediction);
router.post("/addcorrectanswer", submitCorrectAnswer);
router.post("/comparepredictions", comparePredictions);
router.post("/leaderboardpickem", leaderboardpickem);
router.post("/scoreformanyids", comparePredictionmultiple);
router.post("/getCorrectAnswers", getCorrectAnswers);
router.post("/maxscore", calculateMaxPoints);
router.post("/teamHOF", teamHOF);
router.post("/teams/:league", findteamHOF);
router.post("/leagues/list", findleagueHOF);
router.post("/leagues", leagueHOF);
router.post("/myrankpickem", getUserPickemScore);
// Add this route to get match data with player ready status
router.get("/findmatch/:round/:match", async (req, res) => {
  try {
    const { round, match } = req.params;

    // Find match data using the correct field name 'Match' (capital M)
    const matchData = await MatchID.findOne({
      round: round,
      Match: match, // Note: capital M to match your schema
      game: "Valorant",
    });

    if (!matchData) {
      return res.status(404).json({ message: "Match not found" });
    }

    // Get banpick data if banpickid exists
    let banpickData = null;
    if (matchData.banpickid) {
      banpickData = await BanPickValo.findOne({ id: matchData.banpickid });
    }

    // Ensure proper JSON serialization
    const response = {
      matchData: {
        _id: matchData._id,
        matchid: matchData.matchid,
        teamA: matchData.teamA,
        teamB: matchData.teamB,
        round: matchData.round,
        Match: matchData.Match,
        scoreA: matchData.scoreA,
        scoreB: matchData.scoreB,
        banpickid: matchData.banpickid,
        game: matchData.game,
        playersReady: matchData.playersReady || { team1: [], team2: [] },
      },
      banpickData: banpickData
        ? {
            id: banpickData.id,
            team1: banpickData.team1,
            team2: banpickData.team2,
            matchType: banpickData.matchType,
            maps: banpickData.maps,
            sides: banpickData.sides,
            currentPhase: banpickData.currentPhase,
            currentTurn: banpickData.currentTurn,
            deciderMap: banpickData.deciderMap,
          }
        : null,
    };

    res.json(response);
  } catch (error) {
    console.error("Error in findmatch route:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Add route to update player ready status
router.post("/updatePlayerReady", async (req, res) => {
  try {
    const { round, match, riotID, isReady, team } = req.body;

    const matchData = await MatchID.findOne({
      round: round,
      Match: match,
      game: "Valorant",
    });

    if (!matchData) {
      return res.status(404).json({ message: "Match not found" });
    }

    // Initialize playersReady if it doesn't exist
    if (!matchData.playersReady) {
      matchData.playersReady = { team1: [], team2: [] };
    }

    const teamKey = team === "team1" ? "team1" : "team2";

    // Find existing player or add new one
    const existingPlayerIndex = matchData.playersReady[teamKey].findIndex(
      (p) => p.riotID === riotID
    );

    if (existingPlayerIndex >= 0) {
      matchData.playersReady[teamKey][existingPlayerIndex].isReady = isReady;
    } else {
      matchData.playersReady[teamKey].push({ riotID, isReady });
    }

    await matchData.save();

    const io = req.app.get("io");
    io.to(`match_${round}_${match}`).emit("playerReadyUpdated", {
      playersReady: matchData.playersReady,
      round,
      match,
    });

    res.json({
      message: "Player ready status updated",
      playersReady: matchData.playersReady,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/valorant/matchdata/:matchId", async (req, res) => {
  const { matchId } = req.params;

  try {
    // Tìm match đã được lưu trong MongoDB
    const matchDoc = await ValorantMatch.findOne({ matchId }).lean();

    if (!matchDoc) {
      return res
        .status(404)
        .json({ error: "Match data not found in database" });
    }

    const matchData = matchDoc.data;

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json({
      source: "database",
      matchData,
    });
  } catch (error) {
    console.error("Error fetching match data from MongoDB:", error.message);
    res.status(500).json({ error: "Failed to fetch match data from database" });
  }
});
router.get("/valorant/allmatchdata", async (req, res) => {
  try {
    const allMatches = await ValorantMatch.find({}).lean();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json({
      source: "database",
      total: allMatches.length,
      matches: allMatches,
    });
  } catch (error) {
    console.error("Error fetching all match data:", error.message);
    res.status(500).json({ error: "Failed to fetch all match data" });
  }
});

router.get("/valorant/save-match/:matchId", async (req, res) => {
  const { matchId } = req.params;

  try {
    const dictionaryResponse = await axios.get(
      "https://bigtournament-hq9n.onrender.com/api/valorant/dictionary"
    );
    const characterMap = {};
    const mapMap = {};

    dictionaryResponse.data.maps?.forEach((map) => {
      if (map.assetPath) mapMap[map.assetPath.toUpperCase()] = map.name;
    });

    dictionaryResponse.data.characters?.forEach((char) => {
      characterMap[char.id] = char.name;
    });

    const response = await axios.get(
      `https://ap.api.riotgames.com/val/match/v1/matches/${matchId}`,
      { headers: { "X-Riot-Token": apiKeyValorant } }
    );

    const matchData = response.data;
    const rawMapId = matchData?.matchInfo?.mapId?.toUpperCase();
    matchData.matchInfo.mapName = mapMap[rawMapId] || "Unknown";

    const roundResults = (matchData.roundResults || []).map((round) => ({
      roundNum: round.roundNum,
      roundResult: round.roundResult,
      winningTeam: round.winningTeam,
      winningTeamRole: round.winningTeamRole,
      roundCeremony: round.roundCeremony,
      playerStats:
        round.playerStats?.map((ps) => ({
          puuid: ps.puuid,
          kills: ps.kills || [],
          damage: ps.damage || [],
        })) || [],
    }));

    if (matchData?.players) {
      matchData.players.forEach((player) => {
        const cleanId = player.characterId?.toUpperCase();
        player.characterName = characterMap[cleanId] || "Unknown";
        player.imgCharacter =
          `https://dongchuyennghiep.vercel.app/agent/${characterMap[cleanId]}.png` ||
          "Unknown";
        player.riotID = `${player.gameName || "Unknown"}#${
          player.tagLine || "Unknown"
        }`;

        if (player.stats) {
          const kills = player.stats.kills || 0;
          const deaths = player.stats.deaths || 0;
          const assists = player.stats.assists || 0;
          const KDA = (kills + deaths) / (assists || 1);
          const acs = parseFloat(
            (player.stats.score / player.stats.roundsPlayed).toFixed(0)
          );
          player.stats.KD = `${kills}/${deaths}`;
          player.stats.KDA = parseFloat(KDA.toFixed(1));
          player.stats.acs = acs;

          const advancedStats = calculatePlayerStats(player, roundResults);
          Object.assign(player.stats, advancedStats);
          player.stats.adr = parseFloat(
            (advancedStats.totalDamage / player.stats.roundsPlayed).toFixed(1)
          );
        }
      });

      const redTeam = matchData.players
        .filter((p) => p.teamId === "Red")
        .sort((a, b) => b.stats?.acs - a.stats?.acs);
      const blueTeam = matchData.players
        .filter((p) => p.teamId === "Blue")
        .sort((a, b) => b.stats?.acs - a.stats?.acs);
      matchData.players = [...redTeam, ...blueTeam];

      if (matchData?.teams?.length === 2) {
        const [team1, team2] = matchData.teams;
        team1.is = team1.roundsWon > team2.roundsWon ? "Win" : "Loss";
        team2.is = team1.is === "Win" ? "Loss" : "Win";
      }
    }

    const finalData = {
      matchInfo: matchData.matchInfo,
      players: matchData.players,
      teams: matchData.teams,
      roundResults,
    };

    const saved = await ValorantMatch.findOneAndUpdate(
      { matchId },
      { matchId, data: finalData },
      { upsert: true, new: true }
    );

    res.json({ message: "Match data saved successfully", saved });
  } catch (error) {
    console.error("Error saving match data:", error.message);
    res
      .status(error.response?.status || 500)
      .json({ error: "Failed to save match data" });
  }
});

router.post("/:game/:league_id/bracket/create", async (req, res) => {
  const { game, league_id } = req.params;
  const { type, team } = req.body;

  if (type !== "singleElimination" || team !== 8) {
    return res
      .status(400)
      .json({ message: "Currently only supports singleElimination 8 teams." });
  }

  try {
    const bracket = new Bracket({
      game,
      leagueId: league_id,
      type,
      rounds: [],
    });

    // Quarter-finals
    const quarterFinalMatches = [];
    for (let i = 1; i <= 4; i++) {
      quarterFinalMatches.push({
        matchId: `quarter-final-${i}`,
        ifWin: `semi-final-${Math.ceil(i / 2)}`,
        ifLose: "eliminate",
        factions: [],
      });
    }
    bracket.rounds.push({
      number: 1,
      name: "Quarter Finals",
      matches: quarterFinalMatches,
    });

    // Semi-finals
    const semiFinalMatches = [];
    for (let i = 1; i <= 2; i++) {
      semiFinalMatches.push({
        matchId: `semi-final-${i}`,
        ifWin: "final",
        ifLose: "third-place",
        factions: [],
      });
    }
    bracket.rounds.push({
      number: 2,
      name: "Semi Finals",
      matches: semiFinalMatches,
    });

    // Final
    bracket.rounds.push({
      number: 3,
      name: "Finals",
      matches: [
        {
          matchId: "final",
          ifWin: "champion",
          ifLose: "runner-up",
          factions: [],
        },
      ],
    });

    // Third-place (Optional)
    bracket.rounds.push({
      number: 3,
      name: "Third Place",
      matches: [
        {
          matchId: "third-place",
          ifWin: "third",
          ifLose: "fourth",
          factions: [],
        },
      ],
    });

    await bracket.save();
    return res.json({ message: "Bracket created successfully", bracket });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/:game/:league_id/bracket", async (req, res) => {
  const { game, league_id } = req.params;
  const matchesPayload = Array.isArray(req.body) ? req.body : [req.body];

  try {
    let bracket = await Bracket.findOne({ game, leagueId: league_id });

    if (!bracket) {
      return res.status(404).json({ message: "Bracket not found" });
    }

    const leagueData = await DCNLeague.findOne({
      "league.league_id": league_id,
    });
    const playersFromLeague = leagueData?.players || [];

    // Step 1: Cập nhật matchIds trước
    for (const { matchId, matchIds } of matchesPayload) {
      const match = bracket.rounds
        .flatMap((r) => r.matches)
        .find((m) => m.matchId === matchId);
      if (match) {
        match.matchIds = matchIds;
      }
    }

    await bracket.save();

    // Step 2: Fetch match data và xác định winner/loser
    for (const { matchId } of matchesPayload) {
      const match = bracket.rounds
        .flatMap((r) => r.matches)
        .find((m) => m.matchId === matchId);
      if (!match || !match.matchIds || match.matchIds.length === 0) continue;

      let score = {};
      let allTeamIds = new Set();

      for (const mId of match.matchIds) {
        try {
          const response = await fetch(
            `https://bigtournament-hq9n.onrender.com/api/valorant/match/${mId}`
          );
          const apiData = await response.json();
          const matchData = apiData.matchData;
          if (!matchData) continue;

          const players = matchData.players || [];
          const blueTeam = players.filter((p) => p.teamId === "Blue");
          const redTeam = players.filter((p) => p.teamId === "Red");

          let blueTeamId = null,
            redTeamId = null;

          for (const p of blueTeam) {
            const ignFull = `${p.gameName}#${p.tagLine}`.toLowerCase();
            const found = playersFromLeague.find((player) =>
              player.ign.some((ign) => ign.toLowerCase() === ignFull)
            );
            if (found) {
              blueTeamId = found.team.name;
              break;
            }
          }

          for (const p of redTeam) {
            const ignFull = `${p.gameName}#${p.tagLine}`.toLowerCase();
            const found = playersFromLeague.find((player) =>
              player.ign.some((ign) => ign.toLowerCase() === ignFull)
            );
            if (found) {
              redTeamId = found.team.name;
              break;
            }
          }

          if (!blueTeamId || !redTeamId) continue;

          allTeamIds.add(blueTeamId);
          allTeamIds.add(redTeamId);

          let blueScore = blueTeam.reduce(
            (acc, p) => acc + (p.stats?.score || 0),
            0
          );
          let redScore = redTeam.reduce(
            (acc, p) => acc + (p.stats?.score || 0),
            0
          );

          if (blueScore > redScore) {
            score[blueTeamId] = (score[blueTeamId] || 0) + 1;
          } else {
            score[redTeamId] = (score[redTeamId] || 0) + 1;
          }
        } catch (err) {
          console.error(`Error fetching match ${mId}:`, err.message);
        }
      }

      const teamsInMatch = [...allTeamIds]
        .map((teamId) => ({
          teamId,
          score: score[teamId] || 0,
        }))
        .sort((a, b) => b.score - a.score);

      if (teamsInMatch.length > 0) {
        match.factions = teamsInMatch.map((team, idx) => ({
          number: idx + 1,
          teamId: team.teamId,
          teamName: team.teamId,
          score: team.score,
          winner: idx === 0,
        }));

        match.winner = teamsInMatch[0].teamId; // team thắng
        const loserTeamId = teamsInMatch[1]?.teamId; // team thua

        // Step 3: Update vào trận ifWin và ifLose
        if (match.ifWin) {
          const nextMatch = bracket.rounds
            .flatMap((r) => r.matches)
            .find((m) => m.matchId === match.ifWin);
          if (nextMatch) {
            const emptyFaction = nextMatch.factions.find((f) => !f.teamId);
            if (emptyFaction) {
              emptyFaction.teamId = match.winner;
              emptyFaction.teamName = match.winner;
            } else {
              nextMatch.factions.push({
                number: nextMatch.factions.length + 1,
                teamId: match.winner,
                teamName: match.winner,
                score: 0,
                winner: false,
              });
            }
          }
        }

        if (match.ifLose && loserTeamId) {
          const nextMatchLose = bracket.rounds
            .flatMap((r) => r.matches)
            .find((m) => m.matchId === match.ifLose);
          if (nextMatchLose) {
            const emptyFaction = nextMatchLose.factions.find((f) => !f.teamId);
            if (emptyFaction) {
              emptyFaction.teamId = loserTeamId;
              emptyFaction.teamName = loserTeamId;
            } else {
              nextMatchLose.factions.push({
                number: nextMatchLose.factions.length + 1,
                teamId: loserTeamId,
                teamName: loserTeamId,
                score: 0,
                winner: false,
              });
            }
          }
        }
      }
    }

    await bracket.save();

    return res.json({ message: "Bracket updated successfully", bracket });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to update bracket", error: error.message });
  }
});

// POST /:game/:league_id/:bracket
router.get("/:game/:league_id/bracket", async (req, res) => {
  const { game, league_id } = req.params;
  try {
    const bracket = await Bracket.findOne({ game, leagueId: league_id });
    if (!bracket) return res.status(404).json({ message: "Bracket not found" });

    res.json({
      payload: {
        type: bracket.type,
        rounds: bracket.rounds,
        matches: bracket.matches ? Object.fromEntries(bracket.matches) : {},
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/alluser", async (req, res) => {
  try {
    const allPlayers = await User.find({});
    const formattedPlayers = allPlayers.map((player) => ({
      discordID: player.discordID,
      riotId: player.riotID,
      className: player.className,
      garenaaccount: player.garenaaccount,
      nickname: player.nickname,
      username: player.username,
      id: player._id.toString(),
      profilePicture: player.profilePicture,
    }));
    res.json(formattedPlayers);
  } catch (error) {
    res.status(500).json({ Message: error.message });
  }
});

router.get("/:game/:league_id/check-registered-valorant", async (req, res) => {
  const { game, league_id } = req.params;
  try {
    const { teamA, teamB } = req.query;
    if (!teamA || !teamB) {
      return res.status(400).json({ message: "Missing team names" });
    }

    // Find the league with Valorant players
    const league = await DCNLeague.findOne({
      "league.game_short": game,
      "league.league_id": league_id,
    }).lean();
    if (!league) {
      return res.status(404).json({ message: "Valorant league not found" });
    }

    // Filter players by team name (teamA or teamB)
    const players = league.players.filter(
      (player) => player.team?.name === teamA || player.team?.name === teamB
    );

    // Return only igns and team info
    const result = players.map((player) => ({
      igns: player.ign,
      team: player.team,
      logoUrl: player.logoUrl,
      discordID: player.discordID,
      usernameregister: player.usernameregister,
    }));

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
// POST: Thêm dữ liệu mới
router.post("/dcn-league", async (req, res) => {
  try {
    const {
      league,
      season,
      milestones,
      prizepool,
      navigation,
      players = [],
      matches = {},
    } = req.body;

    // ✅ Lấy dữ liệu hiện tại nếu đã tồn tại
    const existingLeague = await DCNLeague.findOne({
      "league.game_name": league.game_name,
      "league.league_id": league.league_id,
      "season.season_number": season.season_number,
    });

    let finalPlayers = [];

    if (players.length === 0 && existingLeague) {
      // ✅ Nếu không truyền players từ client → giữ nguyên players cũ
      finalPlayers = existingLeague.players;
    } else {
      // ✅ Nếu có truyền thì dùng players mới, nhưng giữ nguyên trạng thái check-in cũ nếu có
      const existingMap = new Map(
        (existingLeague?.players || []).map((p) => [
          String(p.usernameregister),
          p,
        ])
      );

      finalPlayers = players.map((player) => ({
        ...player,
        isCheckedin:
          typeof player.isCheckedin === "boolean"
            ? player.isCheckedin
            : existingMap.get(String(player.usernameregister))?.isCheckedin ||
              false,
      }));
    }

    // ✅ Tính current_team_count
    const currentTeamCount = finalPlayers.filter(
      (p) => p.game === "Teamfight Tactics"
    ).length;

    // ✅ Tính check-in time
    const timeStart = new Date(season.time_start);
    const checkinStart = new Date(timeStart.getTime() - 3 * 60 * 60 * 1000); // -3h
    const checkinEnd = new Date(timeStart.getTime() - 30 * 60 * 1000); // -30min

    const updatedSeason = {
      ...season,
      current_team_count: currentTeamCount,
      checkin_start: checkinStart,
      checkin_end: checkinEnd,
    };

    // ✅ Upsert DCN League
    const updatedLeague = await DCNLeague.findOneAndUpdate(
      {
        "league.game_name": league.game_name,
        "league.league_id": league.league_id,
        "season.season_number": season.season_number,
      },
      {
        league,
        season: updatedSeason,
        milestones,
        prizepool,
        navigation,
        players: finalPlayers,
        matches,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      message: "DCN League saved or updated successfully!",
      data: updatedLeague,
    });
  } catch (err) {
    console.error("❌ Error in /dcn-league:", err);
    res.status(400).json({
      message: "Error saving/updating DCN League",
      error: err.message,
    });
  }
});

router.get("/:game/:league_id", async (req, res) => {
  const { game, league_id } = req.params;

  try {
    const data = await DCNLeague.findOne({
      "league.game_short": game,
      "league.league_id": league_id,
    }).lean();

    if (!data) {
      return res.status(404).json({ message: "League not found" });
    }

    // ✅ Tính số lượng team dựa vào players có game đúng
    const currentTeamCount = (data.players || []).length;

    data.season.current_team_count = currentTeamCount;

    res.status(200).json(data);
  } catch (err) {
    console.error("❌ Error in GET league route:", err);
    res
      .status(500)
      .json({ message: "Error fetching data", error: err.message });
  }
});
router.delete("/unregister/:league_id", async (req, res) => {
  const { league_id } = req.params;
  const { usernameregister } = req.body;

  try {
    const leagueDoc = await DCNLeague.findOne({
      "league.league_id": league_id,
    });

    if (!leagueDoc) {
      return res.status(404).json({ message: "League not found" });
    }

    // Xoá player khỏi danh sách
    leagueDoc.players = leagueDoc.players.filter(
      (p) => String(p.usernameregister) !== String(usernameregister)
    );

    await leagueDoc.save();

    res.status(200).json({ message: "Player đã được xoá khỏi giải đấu." });
  } catch (err) {
    console.error("❌ Error unregistering:", err);
    res.status(500).json({ message: "Lỗi server khi xoá player" });
  }
});
router.post("/league/checkin", async (req, res) => {
  const { league_id, game_short, userId } = req.body;

  console.log("📥 Check-in request received:");
  console.log("➡️ league_id:", league_id);
  console.log("➡️ game_short:", game_short);
  console.log("➡️ userId:", userId);
  try {
    const leagueDoc = await DCNLeague.findOne({
      "league.league_id": league_id,
      "league.game_short": game_short,
    });

    console.log("📄 Full leagueDoc:", JSON.stringify(leagueDoc, null, 2));
    if (!leagueDoc) {
      console.warn("❌ League not found");
      return res.status(404).json({ message: "League not found" });
    }

    console.log("✅ League found:", leagueDoc.league.name);

    // log danh sách usernameregister trong players
    const usernames = leagueDoc.players.map((p) => String(p.usernameregister));
    console.log("👥 Players usernameregister:", usernames);

    const playerIndex = leagueDoc.players.findIndex(
      (p) => String(p.usernameregister) === String(userId)
    );

    if (playerIndex === -1) {
      console.warn("❌ Player not found with userId:", userId);
      return res.status(404).json({ message: "Player not found" });
    }

    console.log("✅ Player matched:", leagueDoc.players[playerIndex]);

    // update isCheckedin
    leagueDoc.players[playerIndex].isCheckedin = true;
    await leagueDoc.save();

    console.log("✅ Check-in updated for user:", userId);

    res.status(200).json({ message: "Check-in success" });
  } catch (err) {
    console.error("❌ Error in /league/checkin:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
router.get("/fetchplayerprofilesvalo", fetchPlayerProfilesValo);
export default router;
