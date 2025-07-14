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
router.post("/findmatchid", findmatchID);
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
router.post("/registerorz", async (req, res) => {
  try {
    const {
      teamName,
      shortName,
      classTeam,
      logoUrl,
      gameMembers,
      usernameregister,
      discordID,
      color,
    } = req.body;

    const validClassRegex = /^(10|11|12)(A([1-9]|1[0-8])|TH[1-2])$/;

    const isAllCuuHocSinh = classTeam.length === 1 && classTeam[0] === "Cựu";
    const isAllTruongLop = classTeam.every((cls) => validClassRegex.test(cls));

    const hasCuuHocSinh = classTeam.includes("Cựu");
    const hasLopKhac = classTeam.some((cls) => cls !== "Cựu");

    if (hasCuuHocSinh && hasLopKhac) {
      return res.status(400).json({
        message: 'classTeam không được chứa cả "Cựu" và lớp khác.',
      });
    }

    if (!isAllCuuHocSinh && !isAllTruongLop) {
      return res.status(400).json({
        message: 'classTeam phải là ["Cựu"] hoặc các lớp hợp lệ trong trường.',
      });
    }

    let outsiderCount = 0;

    for (let player of gameMembers) {
      const playerClass = player.class;

      if (!player.nickname || !playerClass) {
        return res.status(400).json({
          message: `Người chơi ${
            player.nickname || "không tên"
          } thiếu thông tin nickname hoặc class.`,
        });
      }

      if (isAllCuuHocSinh) {
        if (playerClass !== "Cựu học sinh") outsiderCount++;
      } else if (isAllTruongLop) {
        if (
          !classTeam.includes(playerClass) &&
          playerClass !== "Học sinh ngoài trường" &&
          playerClass !== "Cựu"
        ) {
          return res.status(400).json({
            message: `Người chơi ${player.nickname} có lớp không thuộc classTeam và không phải là cựu học sinh hoặc học sinh ngoài trường.`,
          });
        }
        if (playerClass === "Cựu" || playerClass === "Học sinh ngoài trường") {
          outsiderCount++;
        }
      }
    }

    if (outsiderCount > 3) {
      return res.status(400).json({
        message: `Tối đa chỉ được 3 người là học sinh ngoài trường hoặc học sinh khác lớp (với classTeam hiện tại). Hiện có ${outsiderCount} người.`,
      });
    }

    // ✅ Tìm đội hiện tại của user
    const existingTeam = await Organization.findOne({ usernameregister });
    const oldTeamName = existingTeam ? existingTeam.team : null;

    // ✅ Kiểm tra trùng team
    const nicknames = gameMembers.map((p) => p.nickname);
    const users = await User.find({ nickname: { $in: nicknames } });

    if (existingTeam) {
      // ✅ Tách danh sách thành viên cũ & mới
      const oldNicknames = existingTeam.players.map((p) => p.nickname);
      const newNicknames = gameMembers.map((p) => p.nickname);
      const removedMembers = oldNicknames.filter(
        (name) => !newNicknames.includes(name)
      );
      const addedOrKeptMembers = newNicknames;

      // ✅ Cập nhật đội
      existingTeam.team = teamName;
      existingTeam.shortname = shortName;
      existingTeam.class = classTeam;
      existingTeam.logoURL = logoUrl;
      existingTeam.players = gameMembers;
      existingTeam.color = color;

      const updatedTeam = await existingTeam.save();

      // ✅ Gỡ team của người bị xóa
      await Promise.all(
        removedMembers.map((name) =>
          User.findOneAndUpdate({ nickname: name }, { team: "" })
        )
      );

      // ✅ Cập nhật team mới cho thành viên
      await Promise.all(
        addedOrKeptMembers.map((name) =>
          User.findOneAndUpdate(
            { nickname: name },
            {
              team: {
                name: teamName,
                logoTeam: logoUrl,
                shortName: shortName,
              },
            }
          )
        )
      );

      return res
        .status(200)
        .json({ message: "Cập nhật đội thành công!", team: updatedTeam });
    }

    // ✅ Nếu chưa có đội, tạo mới
    const newTeam = new Organization({
      discordID,
      usernameregister,
      team: teamName,
      shortname: shortName,
      class: classTeam,
      logoURL: logoUrl,
      players: gameMembers,
      color: color,
    });

    const savedTeam = await newTeam.save();

    // ✅ Cập nhật team cho thành viên mới
    await Promise.all(
      gameMembers.map((member) =>
        User.findOneAndUpdate(
          { nickname: member.nickname },
          {
            team: {
              name: teamName,
              logoTeam: logoUrl,
            },
          }
        )
      )
    );

    res
      .status(201)
      .json({ message: "Đăng ký đội thành công!", team: savedTeam });
  } catch (error) {
    console.error("Error registering team:", error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ errors });
    }
    res.status(500).json({ message: error });
  }
});
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
        matchStartTimes: matchData.matchStartTimes, // Add this line to include matchStartTimes in the response
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
router.post("/register/:league_id", async (req, res) => {
  const { league_id } = req.params;
  const {
    logoUrl,
    teamLogo, // 👈 thêm dòng này
    gameMembers,
    usernameregister,
    discordID,
    classTeam,
    games,
    teamName,
    shortName,
  } = req.body;

  try {
    const leagueDoc = await DCNLeague.findOne({
      "league.league_id": league_id,
    });

    if (!leagueDoc) {
      return res.status(404).json({ message: "League not found" });
    }

    const existingPlayerIndex = leagueDoc.players.findIndex(
      (p) => String(p.usernameregister) === String(usernameregister)
    );

    const selectedGame = games?.[0]; // 👈 lấy game thực sự mà người dùng chọn

    const playerData = {
      discordID,
      ign: (gameMembers?.[selectedGame] || []).filter((m) => m.trim() !== ""),
      usernameregister,
      logoUrl,
      classTeam,
      game: selectedGame,
      isCheckedin: leagueDoc.players[existingPlayerIndex]?.isCheckedin || false,
      team: {
        name: teamName || "",
        logoTeam: teamLogo || "", // 👈 lấy logo team riêng
        shortName: shortName || "",
      },
    };

    if (existingPlayerIndex === -1) {
      leagueDoc.players.push(playerData);
    } else {
      leagueDoc.players[existingPlayerIndex] = {
        ...leagueDoc.players[existingPlayerIndex],
        ...playerData,
      };
    }

    await leagueDoc.save();

    res.status(200).json({
      message: "Đăng ký thành công và đã thêm/cập nhật vào giải đấu!",
      player: playerData,
    });
  } catch (error) {
    console.error("❌ Error registering player:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});
// Add route to update player ready status
router.post("/updatePlayerReady", async (req, res) => {
  try {
    const { round, match, riotID, isReady, team, mapIndex, totalMaps } =
      req.body;

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

    // Helper to initialize isReady array
    function getIsReadyArray(existing, total) {
      if (Array.isArray(existing) && existing.length === total) return existing;
      const arr = Array(total).fill(false);
      if (Array.isArray(existing)) {
        for (let i = 0; i < Math.min(existing.length, total); i++)
          arr[i] = existing[i];
      }
      return arr;
    }

    if (existingPlayerIndex >= 0) {
      // Ensure isReady is an array of correct length
      let isReadyArr = getIsReadyArray(
        matchData.playersReady[teamKey][existingPlayerIndex].isReady,
        totalMaps
      );
      isReadyArr[mapIndex] = isReady;
      matchData.playersReady[teamKey][existingPlayerIndex].isReady = isReadyArr;
    } else {
      // New player: initialize isReady array
      const isReadyArr = Array(totalMaps).fill(false);
      isReadyArr[mapIndex] = isReady;
      matchData.playersReady[teamKey].push({ riotID, isReady: isReadyArr });
    }

    await matchData.save();

    // Use req.io if available, otherwise req.app.get('io')
    const io = req.io || (req.app && req.app.get && req.app.get("io"));
    if (io) {
      io.to(`match_${round}_${match}`).emit("playerReadyUpdated", {
        playersReady: matchData.playersReady,
        round,
        match,
      });
    }

    res.json({
      message: "Player ready status updated",
      playersReady: matchData.playersReady,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Simple in-memory lock for matchId (for demo/dev only, use Redis for production)
const matchLocks = new Map();

router.get("/valorant/matchdata/:matchId", async (req, res) => {
  const { matchId } = req.params;
  try {
    // Kiểm tra trong MongoDB trước
    let matchDoc = await ValorantMatch.findOne({ matchId }).lean();
    if (matchDoc) {
      // Loại bỏ roundResult khỏi dữ liệu trả về nếu có
      const data = { ...matchDoc.data };
      if (data.roundResults) {
        data.roundResults = data.roundResults.map(
          ({ roundResult, ...rest }) => rest
        );
      }
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.json({ source: "database", matchData: data });
    }

    // Lock để tránh race condition
    while (matchLocks.get(matchId)) {
      // Đợi 100ms rồi thử lại
      await new Promise((resolve) => setTimeout(resolve, 100));
      // Nếu có ai đó đã lưu xong thì lấy lại từ DB
      matchDoc = await ValorantMatch.findOne({ matchId }).lean();
      if (matchDoc) {
        const data = { ...matchDoc.data };
        if (data.roundResults) {
          data.roundResults = data.roundResults.map(
            ({ roundResult, ...rest }) => rest
          );
        }
        res.setHeader("Access-Control-Allow-Origin", "*");
        return res.json({ source: "database", matchData: data });
      }
    }
    matchLocks.set(matchId, true);
    try {
      // Nếu muốn nhẹ nhất, không nhập roundResults luôn nếu không cần
      const roundResults = undefined; // Không nhập roundResults vào finalData

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

            // Nếu không có roundResults thì truyền mảng rỗng vào advancedStats
            const advancedStats = calculatePlayerStats(player, []);
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
        // Không nhập roundResults nếu không cần
      };

      await ValorantMatch.findOneAndUpdate(
        { matchId },
        { matchId, data: finalData },
        { upsert: true, new: true }
      );

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.json({ source: "riot", matchData: finalData });
    } finally {
      matchLocks.delete(matchId);
    }
  } catch (error) {
    matchLocks.delete(matchId);
    console.error("Lỗi khi lấy dữ liệu trận đấu Valorant:", error.message);
    res
      .status(error.response?.status || 500)
      .json({ error: "Không thể lấy dữ liệu trận đấu Valorant" });
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

router.post("/valorant/save-match/:matchId", async (req, res) => {
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
      // roundResult: round.roundResult, // Bỏ trường này để test tốc độ
      winningTeam: round.winningTeam,
      winningTeamRole: round.winningTeamRole,
      roundCeremony: round.roundCeremony,
      playerStats: (round.playerStats || []).map((ps) => ({
        puuid: ps.puuid,
        kills: ps.kills || [],
        damage: ps.damage || [],
      })),
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
router.post("/create", async (req, res) => {
  try {
    const match = new BanPickValo({
      ...req.body,
      id: Math.random().toString(36).substr(2, 9),
      currentTurn: "team1",
    });
    await match.save();
    res.status(201).json(match);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.post("/status", async (req, res) => {
  try {
    const match = await BanPickValo.findOne({ id: req.body.matchId }).lean();

    if (!match) {
      console.log(`Không tìm thấy match với ID: ${req.body.matchId}`);
      return res.status(404).json({
        error: "Match not found",
        receivedId: req.body.matchId,
        storedIds: await BanPickValo.distinct("id"),
      });
    }

    res.json(match);
  } catch (error) {
    console.error("Lỗi truy vấn database:", error);
    res.status(500).json({ error: error.message });
  }
});
router.post("/action", async (req, res) => {
  const io = req.io;
  const { matchId, action } = req.body;

  try {
    const match = await BanPickValo.findOne({ id: matchId });
    if (!match) return res.status(404).json({ error: "Match not found" });

    if (action === "ban") await processBan(match, req.body);
    if (action === "pick") await processPick(match, req.body);
    if (action === "side") await processSide(match, req.body);

    await match.save();

    // ✅ Load lại bản cập nhật từ DB trước khi emit
    const updatedMatch = await BanPickValo.findOne({ id: matchId });
    console.log("📢 EMITTING MATCH UPDATE");
    io.to(matchId).emit("matchUpdated", updatedMatch);

    res.json(updatedMatch);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
async function processPick(match, { map, role }) {
  if (match.matchType === "BO1") {
    mapSide.team1 = side;
    mapSide.team2 = side === "Attacker" ? "Defender" : "Attacker";

    match.currentPhase = "completed"; // kết thúc
    return;
  }
  if (match.currentPhase !== "pick") throw new Error("Invalid phase for pick");
  // Validate lượt pick
  else if (match.matchType === "BO3" || match.matchType === "BO5") {
    const currentPickCount = match.maps.picked.length;

    if (currentPickCount === 0 && role !== "team1") {
      throw new Error("Only Team 1 can make the first pick");
    }

    if (currentPickCount === 1 && role !== "team2") {
      throw new Error("Only Team 2 can make the second pick");
    }
  }

  // Thêm thông tin pickedBy
  match.maps.picked.push({
    name: map,
    pickedBy: role === "team1" ? match.team1 : match.team2,
  });

  match.maps.pool = match.maps.pool.filter((m) => m !== map);

  // Thêm vào sides với pickedBy
  match.sides.push({
    map,
    pickedBy: role === "team1" ? match.team1 : match.team2,
    team1: null,
    team2: null,
  });

  // Xử lý lượt pick
  if (match.matchType === "BO3") {
    const pickedCount = match.maps.picked.length;

    if (pickedCount === 1) {
      match.currentTurn = "team2";
    } else if (pickedCount === 2) {
      match.currentPhase = "ban";
      match.banPhase = 2;
      match.currentTurn = "team1";
    }
  } else if (match.matchType === "BO5") {
    const pickedCount = match.maps.picked.length;

    if (pickedCount < 4) {
      // Chuyển lượt cho team kia sau mỗi pick
      match.currentTurn = match.currentTurn === "team1" ? "team2" : "team1";
    }

    if (pickedCount === 4) {
      // Khi đã pick đủ 4 map → chọn map còn lại làm decider
      const deciderMap = match.maps.pool[0];
      match.maps.selected = [
        ...match.maps.picked.map((p) => p.name),
        deciderMap,
      ];
      match.maps.pool = [];

      // Thêm vào sides
      const alreadyInSides = match.sides.some((s) => s.map === deciderMap);
      if (!alreadyInSides) {
        match.sides.push({
          map: deciderMap,
          pickedBy: "Decider",
          team1: null,
          team2: null,
        });
      }

      match.currentPhase = "side";
      match.currentTurn = "team2"; // hoặc random chọn team bắt đầu pick side
    }
  }
  await match.save();
}

async function processBan(match, { map }) {
  if (match.currentPhase !== "ban") throw new Error("Invalid phase for ban");

  // Thêm thông tin bannedBy
  match.maps.banned.push({
    name: map,
    bannedBy: match.currentTurn === "team1" ? match.team1 : match.team2,
  });

  match.maps.pool = match.maps.pool.filter((m) => m !== map);

  // Xử lý BO3 (Logic cập nhật lượt)
  if (match.matchType === "BO3") {
    if (match.banPhase === 1) {
      if (match.maps.banned.length === 2) {
        match.currentPhase = "pick";
        match.currentTurn = "team1";
        match.banPhase = 2;
      } else {
        match.currentTurn = match.currentTurn === "team1" ? "team2" : "team1";
      }
    } else if (match.banPhase === 2) {
      if (match.maps.banned.length === 4) {
        const deciderMap = match.maps.pool[0];
        match.maps.selected = [
          ...match.maps.picked.map((p) => p.name),
          deciderMap,
        ];

        match.maps.pool = [];

        // ✅ Thêm decider vào sides với pickedBy là team1
        const alreadyInSides = match.sides.some((s) => s.map === deciderMap);
        if (!alreadyInSides) {
          match.sides.push({
            map: deciderMap,
            pickedBy: match.team1,
            team1: null,
            team2: null,
          });
        }

        match.currentPhase = "side";
        match.currentTurn = "team2"; // team2 chọn side vì team1 pick map
      } else {
        match.currentTurn = match.currentTurn === "team1" ? "team2" : "team1";
      }
    }
  } else if (match.matchType === "BO1") {
    const banCount = match.maps.banned.length;

    // Khi đã ban 6 map (3 lượt mỗi đội)
    if (banCount === 6) {
      // Lấy map cuối cùng làm Decider
      const deciderMap = match.maps.pool[0];
      match.maps.selected = [deciderMap];
      match.maps.pool = [];

      match.sides.push({
        map: deciderMap,
        pickedBy: "Decider",
        team1: null,
        team2: null,
      });

      match.currentPhase = "side";
      match.currentTurn = "team1";
    }
    // Chưa đủ 6 bans -> đổi lượt
    else {
      match.currentTurn = match.currentTurn === "team1" ? "team2" : "team1";
    }
  } else if (match.matchType === "BO5") {
    const banCount = match.maps.banned.length;
    const pickCount = match.maps.picked.length;

    if (banCount === 1) {
      match.currentTurn = match.currentTurn === "team1" ? "team2" : "team1";
    } else if (banCount === 2) {
      match.currentPhase = "pick";
      match.pickPhase = 1;
      match.currentTurn = "team1";
    }

    // ✅ Khi đã pick đủ 4 map → xác định decider
    if (pickCount === 5 && match.maps.pool.length === 0) {
      const deciderMap = match.maps.pool[0];

      match.maps.selected = [
        ...match.maps.picked.map((p) => p.name),
        deciderMap,
      ];

      match.maps.pool = [];

      const alreadyInSides = match.sides.some((s) => s.map === deciderMap);
      if (!alreadyInSides) {
        match.sides.push({
          map: deciderMap,
          pickedBy: "Decider",
          team1: "TBD",
          team2: "TBD",
        });
      }

      match.currentPhase = "side";
      match.currentTurn = "team1"; // hoặc tùy theo logic bạn chọn bên
    }
  }

  await match.save();
}
async function processSide(match, { map, side }) {
  if (match.currentPhase !== "side") {
    throw new Error("Invalid phase for side selection");
  }

  // Kiểm tra map có trong danh sách selected không
  if (!match.maps.selected.includes(map)) {
    throw new Error("Map not in selected maps");
  }

  // Tìm side configuration cho map
  const mapSide = match.sides.find((s) => s.map === map);

  if (!mapSide) {
    throw new Error("Map side configuration not found");
  }

  // Xác định team đang chọn side
  const team = match.currentTurn;

  // Validate role
  if (!["team1", "team2"].includes(team)) {
    throw new Error("Invalid team for side selection");
  }

  // Cập nhật side cho đội hiện tại
  if (team === "team1") {
    mapSide.team1 = side;
    // Đội 2 sẽ tự động nhận side ngược lại
    mapSide.team2 = side === "Attacker" ? "Defender" : "Attacker";
  } else {
    mapSide.team2 = side;
    // Đội 1 sẽ tự động nhận side ngược lại
    mapSide.team1 = side === "Attacker" ? "Defender" : "Attacker";
  }

  // Chuyển lượt chọn sang đội tiếp theo
  const nextTeam = team === "team1" ? "team2" : "team1";
  match.currentTurn = nextTeam;

  // Kiểm tra đã chọn hết tất cả sides chưa
  const allSidesSelected = match.sides.every(
    (s) => s.team1 !== null && s.team2 !== null
  );

  if (allSidesSelected) {
    match.currentPhase = "completed";
  }
}
export default router;
