// Route: Lấy leaderboard PickemScore cho league_id
import PickemScore from "../models/pickemscore.model.js";
import PickemChallenge from "../models/question.model.js";
import User from "../models/user.model.js";
import BanPickValo from "../models/veto.model.js";
import Organization from "../models/team.model.js";
import DCNLeague from "../models/tournament.model.js";

import Bracket from "../models/bracket.model.js";
import ValorantMatch from "../models/valorantmatch.model.js";
import MatchID from "../models/matchid.model.js";
import PickemResponse from "../models/response.model.js";
const router = express.Router();

// Router-level: rely on global CORS middleware in `index.js`.
// Allow preflight to short-circuit here but do not set Access-Control-Allow-Origin
router.use((req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Middleware: require a single API key for all routes in this router
function requireApiKey(req, res, next) {
  // allow preflight through
  if (req.method === "OPTIONS") return next();

  const provided = (
    req.headers["x-api-key"] ||
    req.query.api_key ||
    (req.body && req.body.api_key) ||
    ""
  ).toString();
  const expected =
    process.env.API_KEY_DCN || process.env.API_KEY || process.env.DCN_API_KEY;
  if (!expected) {
    console.error(
      "API key not configured in environment (checked API_KEY_DCN/API_KEY/DCN_API_KEY)"
    );
    return res
      .status(500)
      .json({ error: "Server misconfiguration1: API key not set" });
  }
  if (!provided || provided !== expected) {
    return res.status(401).json({ error: "Invalid API key" });
  }
  next();
}

// Apply to all routes declared after this line
router.use(requireApiKey);

// Helpers for single elimination bracket serialization without schema changes
const BRACKET_PREFIX = {
  quarterfinal: "QF",
  semifinal: "SF",
  first: "1ST",
  second: "2ND",
};
const PREFIX_TO_STAGE = {
  QF: "quarterfinal",
  SF: "semifinal",
  "1ST": "first",
  "2ND": "second",
};
function serializeBracketObjectToFlatArray(obj) {
  // obj example: { quarterfinal:[], semifinal:[], first:[], second:[] }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return [];
  const out = [];
  for (const [stage, arr] of Object.entries(obj)) {
    const pref = BRACKET_PREFIX[stage];
    if (!pref) continue;
    (arr || []).forEach((v) => {
      if (typeof v === "string" && v.trim()) out.push(`${pref}:${v.trim()}`);
    });
  }
  return out;
}
function deserializeFlatArrayToBracketObject(arr) {
  const result = { quarterfinal: [], semifinal: [], first: [], second: [] };
  if (!Array.isArray(arr)) return result;
  for (const s of arr) {
    if (typeof s !== "string") continue;
    const idx = s.indexOf(":");
    if (idx <= 0) continue;
    const pref = s.slice(0, idx);
    const val = s.slice(idx + 1);
    const stage = PREFIX_TO_STAGE[pref];
    if (stage && val) result[stage].push(val);
  }
  return result;
}

// Helpers for double elimination bracket (final placements) serialization
// We store positions as prefixes: P7_8, P5_6, P4, P3, P2, P1
const DOUBLE_PREFIX = {
  pos_7_8: "P7_8",
  pos_5_6: "P5_6",
  pos_4: "P4",
  pos_3: "P3",
  pos_2: "P2",
  pos_1: "P1",
};
const PREFIX_TO_DOUBLE_STAGE = {
  P7_8: "pos_7_8",
  P5_6: "pos_5_6",
  P4: "pos_4",
  P3: "pos_3",
  P2: "pos_2",
  P1: "pos_1",
};
function serializeDoubleBracketObjectToFlatArray(obj) {
  // obj example: { pos_7_8: [a,b], pos_5_6: [c,d], pos_4:[e], pos_3:[f], pos_2:[g], pos_1:[h] }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return [];
  const out = [];
  const keyMap = new Map(
    Object.entries(DOUBLE_PREFIX).map(([k, v]) => [k.toLowerCase(), v])
  );
  for (const [stageRaw, arr] of Object.entries(obj)) {
    const stage = String(stageRaw).toLowerCase();
    const pref = keyMap.get(stage);
    if (!pref) continue;
    (arr || []).forEach((v) => {
      if (typeof v === "string" && v.trim()) out.push(`${pref}:${v.trim()}`);
    });
  }
  return out;
}
function deserializeFlatArrayToDoubleBracketObject(arr) {
  const result = {
    pos_7_8: [],
    pos_5_6: [],
    pos_4: [],
    pos_3: [],
    pos_2: [],
    pos_1: [],
  };
  if (!Array.isArray(arr)) return result;
  for (const s of arr) {
    if (typeof s !== "string") continue;
    const idx = s.indexOf(":");
    if (idx <= 0) continue;
    const pref = s.slice(0, idx);
    const val = s.slice(idx + 1);
    const stage = PREFIX_TO_DOUBLE_STAGE[pref];
    if (stage && val) result[stage].push(val);
  }
  return result;
}

// Helpers for double elimination stage tokens (for FE visualization only)
// Supported prefixes: QF, SF, UF (Upper Final), LS1, LS2, FOURTH, THIRD, SECOND, FIRST
const DOUBLE_STAGE_TOKEN_MAP = {
  QF: "qf",
  SF: "sf",
  UF: "uf",
  LS1: "ls1",
  LS2: "ls2",
  FOURTH: "fourth",
  THIRD: "third",
  SECOND: "second",
  FIRST: "first",
};
const DOUBLE_STAGE_PREFIX = {
  qf: "QF",
  sf: "SF",
  uf: "UF",
  ls1: "LS1",
  ls2: "LS2",
  fourth: "FOURTH",
  third: "THIRD",
  second: "SECOND",
  first: "FIRST",
};
function deserializeDoubleStageTokens(arr) {
  const result = {
    qf: [],
    sf: [],
    uf: [],
    ls1: [],
    ls2: [],
    fourth: [],
    third: [],
    second: [],
    first: [],
  };
  if (!Array.isArray(arr)) return result;
  for (const s of arr) {
    if (typeof s !== "string") continue;
    const idx = s.indexOf(":");
    if (idx <= 0) continue;
    const prefRaw = s.slice(0, idx);
    const pref = String(prefRaw).toUpperCase();
    const val = s.slice(idx + 1);
    const key = DOUBLE_STAGE_TOKEN_MAP[pref];
    if (key && val) result[key].push(val);
  }
  return result;
}
function serializeDoubleStageObjectToFlatArray(obj) {
  // obj example: { qf:[], sf:[], uf:[], ls1:[], ls2:[], fourth:[], third:[], second:[], first:[] }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return [];
  const out = [];
  for (const [stageRaw, arr] of Object.entries(obj)) {
    const key = String(stageRaw || "").toLowerCase();
    const pref = DOUBLE_STAGE_PREFIX[key];
    if (!pref) continue;
    (arr || []).forEach((v) => {
      if (typeof v === "string" && v.trim()) out.push(`${pref}:${v.trim()}`);
    });
  }
  return out;
}

router.get("/pickemscore/:league_id/leaderboard", async (req, res) => {
  try {
    const { league_id } = req.params;
    // Lấy tất cả điểm của user cho league_id
    const scores = await PickemScore.find({ league_id });
    // Lấy thông tin userId
    const userIds = scores.map((s) => s.userId);
    const users = await User.find({ _id: { $in: userIds } });
    // Map userId -> user
    const userMap = new Map(users.map((u) => [String(u._id), u]));
    // Tạo leaderboard
    const leaderboard = scores
      .map((s) => {
        const user = userMap.get(String(s.userId));
        return {
          username: user?.username || "",
          userId: s.userId,
          logoURL: user?.logoURL || user?.profilePicture || "",
          Score: s.score || 0,
        };
      })
      .sort((a, b) => b.Score - a.Score);
    res.json({ league_id, leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route: Leaderboard directly from PickemResponse (no separate PickemScore doc)
// Ranking rules:
// - Primary: totalScore (desc)
// - Tie-breaker: earlier lastUpdate (asc). lastUpdate is the latest updatedAt among a user's logs.
//   If a user has no logs, we treat lastUpdate as very large so they are ranked lower on ties.
router.get("/pickem/:league_id/leaderboard", async (req, res) => {
  try {
    const { league_id } = req.params;
    const doc = await PickemResponse.findOne({ league_id }).lean();
    if (!doc)
      return res.status(404).json({ message: "No responses for league" });

    const responses = Array.isArray(doc.responses) ? doc.responses : [];

    // Collect possible user ids for enrichment
    const idCandidates = responses
      .map((r) => String(r?.user?.id || r?.userId || ""))
      .filter((v) => v);
    const objectIds = idCandidates.filter((v) => /^[0-9a-fA-F]{24}$/.test(v));
    const users = await User.find({ _id: { $in: objectIds } })
      .select("username profilePicture nickname team")
      .lean();
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const leaderboard = responses.map((r) => {
      const uid = String(r?.user?.id || r?.userId || "");
      const userHit = userMap.get(uid);
      const score = Number(r?.totalScore || 0);
      // lastUpdate = latest update timestamp across logs; higher means later
      let lastUpdate = Number.MAX_SAFE_INTEGER;
      if (Array.isArray(r?.logs) && r.logs.length) {
        lastUpdate = r.logs.reduce((mx, l) => {
          const t = new Date(l?.updatedAt || l?.createdAt || 0).getTime();
          return Math.max(mx, isNaN(t) ? 0 : t);
        }, 0);
      }
      const username = userHit?.username || r?.userId || "";
      const nickname = userHit?.nickname || r?.user?.nickname || "";
      const teamName = userHit?.team?.name || r?.user?.team?.name || "";
      const logoTeam = userHit?.team?.logoTeam || r?.user?.team?.logoTeam || "";
      const img = userHit?.profilePicture || r?.user?.team?.logoTeam || "";
      return {
        userId: uid,
        username,
        nickname,
        team: teamName,
        logoTeam,
        img,
        Score: score,
        _lastUpdate: lastUpdate,
      };
    });

    // Sort by score desc, then earlier lastUpdate asc
    leaderboard.sort((a, b) => {
      if (b.Score !== a.Score) return b.Score - a.Score;
      return a._lastUpdate - b._lastUpdate;
    });

    // Strip private fields
    const result = leaderboard.map(
      ({ userId, username, nickname, team, logoTeam, img, Score }) => ({
        userId,
        username,
        nickname,
        team,
        logoTeam,
        img,
        Score,
      })
    );

    res.json({ league_id, leaderboard: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Route: Gộp thêm câu hỏi Pickem (player/team), chỉ update nếu đã có PickemChallenge
// Hàm chấm điểm Pickem cho toàn bộ user
async function gradePickem(league_id, force = false) {
  const pickemDoc = await PickemChallenge.findOne({ league_id });
  const pickemResDoc = await PickemResponse.findOne({ league_id });
  if (!pickemDoc) {
    return;
  }
  if (!pickemResDoc) {
    return;
  }
  for (const userRes of pickemResDoc.responses) {
    let totalScore = 0;
    for (const ans of userRes.answers) {
      // Tìm question tương ứng
      const ques = pickemDoc.questions.find((qq) => qq.id === ans.questionId);
      if (!ques) {
        continue;
      }
      if (
        !ques ||
        !Array.isArray(ques.correctAnswer) ||
        ques.correctAnswer.length === 0
      ) {
        continue;
      }

      // Kiểm tra range thời gian pickem
      const now = new Date();
      // If not forcing, enforce answer-level open/close time range if provided
      if (!force && ans.openTime && ans.closeTime) {
        if (now < new Date(ans.openTime) || now > new Date(ans.closeTime)) {
          continue;
        }
      }

      // Xử lý validate cho double_eli_bracket và single_eli_bracket
      let userAns = ans.selectedOptions;
      let correctAns = ques.correctAnswer;
      let matched = 0;
      if (
        (ques.type === "double_eli_bracket" ||
          ques.type === "single_eli_bracket") &&
        Array.isArray(correctAns)
      ) {
        let matched = 0;
        const hasPrefix = correctAns.some(
          (x) => typeof x === "string" && x.includes(":")
        );
        if (hasPrefix) {
          // Compare by stage groups via prefixes (order-insensitive within stage)
          const canonDouble = (p) => {
            const pref = String(p || "")
              .toUpperCase()
              .trim();
            // Map podium synonyms to placement prefixes
            if (pref === "1ST" || pref === "FIRST") return "P1";
            if (pref === "2ND" || pref === "SECOND") return "P2";
            if (pref === "3RD" || pref === "THIRD") return "P3";
            if (pref === "4TH" || pref === "FOURTH") return "P4";
            return pref;
          };
          const groupByPrefix = (arr, isDouble) => {
            const m = new Map();
            for (const s of arr || []) {
              if (typeof s !== "string") continue;
              const idx = s.indexOf(":");
              if (idx <= 0) continue;
              const rawPref = s.slice(0, idx);
              const pref = isDouble ? canonDouble(rawPref) : rawPref;
              const val = s.slice(idx + 1);
              if (!m.has(pref)) m.set(pref, new Set());
              if (val) m.get(pref).add(val);
            }
            return m;
          };
          const isDouble = ques.type === "double_eli_bracket";
          const corrMap = groupByPrefix(correctAns, isDouble);

          // Option 2: augment user answer tokens with stage tokens from per-user logs (if exist)
          let combinedUserTokens = Array.isArray(userAns) ? [...userAns] : [];
          if (isDouble && Array.isArray(userRes.logs)) {
            const logEntry = userRes.logs.find(
              (l) => Number(l.questionId) === Number(ans.questionId)
            );
            const stages = logEntry?.stages || logEntry?.selectedStages;
            if (stages && typeof stages === "object") {
              try {
                const stageTokens =
                  serializeDoubleStageObjectToFlatArray(stages);
                if (Array.isArray(stageTokens) && stageTokens.length) {
                  // Dedupe tokens via Set to avoid double-counting same prefix:value
                  const set = new Set([
                    ...(combinedUserTokens || []),
                    ...stageTokens,
                  ]);
                  combinedUserTokens = Array.from(set);
                }
              } catch (e) {
                // ignore stage serialization errors
              }
            }
          }
          const userMap = groupByPrefix(combinedUserTokens || [], isDouble);

          // Debug logging for scoring details (defaults to QID=6 for double_eli_bracket)
          const debugQid = Number(process.env.PICKEM_DEBUG_QID || 6);
          const debugEnabled = isDouble && Number(ans.questionId) === debugQid;
          if (debugEnabled) {
            const mapToObj = (m) =>
              Object.fromEntries(
                Array.from(m.entries()).map(([k, v]) => [k, Array.from(v)])
              );
            console.log(
              `[PickemGrade] user=${userRes.userId} q=${ans.questionId} type=${ques.type}`
            );
            console.log("[PickemGrade] correctAns(groups):", mapToObj(corrMap));
            console.log("[PickemGrade] userAns(groups):   ", mapToObj(userMap));
          }
          for (const [pref, corrSet] of corrMap.entries()) {
            const uSet = userMap.get(pref) || new Set();
            let prefMatches = 0;
            const matchedTokens = [];
            for (const v of uSet) {
              if (corrSet.has(v)) {
                matched++;
                prefMatches++;
                matchedTokens.push(v);
              }
            }
            if (
              Number(process.env.PICKEM_DEBUG_QID || 6) ===
                Number(ans.questionId) &&
              ques.type === "double_eli_bracket"
            ) {
              console.log(
                `[PickemGrade] q=${ans.questionId} pref=${pref} matched=${prefMatches} tokens=`,
                matchedTokens
              );
            }
          }
        } else {
          // Positional compare fallback
          for (let i = 0; i < correctAns.length; i++) {
            if (userAns[i] === correctAns[i]) matched++;
          }
        }
        if (matched > 0) {
          const add =
            (typeof ques.score === "number" ? ques.score : 0) * matched;
          if (
            Number(process.env.PICKEM_DEBUG_QID || 6) ===
              Number(ans.questionId) &&
            ques.type === "double_eli_bracket"
          ) {
            console.log(
              `[PickemGrade] q=${ans.questionId} matchedTotal=${matched}, ques.score=${ques.score} -> pointsAdded=${add}`
            );
          }
          totalScore += add;
        }
      } else if (
        ques.type === "team" ||
        ques.type === "player" ||
        ques.type === "lol_champ"
      ) {
        // Chấm điểm: chỉ cần đúng bất kỳ vị trí nào, không cần đúng thứ tự
        let correctSet = new Set(correctAns);
        let matched = 0;
        for (let i = 0; i < userAns.length; i++) {
          if (correctSet.has(userAns[i])) matched++;
        }
        if (matched > 0) {
          totalScore +=
            (typeof ques.score === "number" ? ques.score : 0) * matched;
        }
      }
    }
    // Final per-user debug total for focused question ID
    if (Number(process.env.PICKEM_DEBUG_QID || 6)) {
      console.log(
        `[PickemGrade] user=${userRes.userId} totalScore(after grade)=${totalScore}`
      );
    }
    userRes.totalScore = totalScore;
  }
  await pickemResDoc.save();
}
router.post("/:league_id/addquestion", async (req, res) => {
  try {
    const { league_id } = req.params;
    // incoming request body processed
    let questionsInput = Array.isArray(req.body) ? req.body : [req.body];
    const leagueDoc = await DCNLeague.findOne({
      "league.league_id": league_id,
    });
    if (!leagueDoc)
      return res.status(404).json({ message: "League not found" });

    let pickemDoc = await PickemChallenge.findOne({ league_id });
    if (!pickemDoc) {
      pickemDoc = new PickemChallenge({ league_id, questions: [] });
    }

    let updatedQuestions = [];

    for (const q of questionsInput) {
      // correctAnswer input processed
      // Tạo options cho từng câu hỏi
      let options = [];
      if (q.type === "player") {
        // Build player options by taking User.profilePicture, fallback to default image id if user not found
        const DEFAULT_IMG = "1wRTVjigKJEXt8iZEKnBX5_2jG7Ud3G-L";
        const gameShort = q.game_short || q.game;
        let players = leagueDoc.players;
        if (gameShort) {
          players = players.filter(
            (p) =>
              p.game === gameShort ||
              p.game === leagueDoc.league.game_name ||
              p.game === leagueDoc.league.game_short
          );
        }
        // Resolve profile pictures per player (by usernameregister)
        const LEGACY_DEFAULT_IMG = "1VaB3F9rNKhn4Vfrm4oUq9QaGoINQ6Deg";
        for (const player of players) {
          let img = DEFAULT_IMG;
          try {
            if (player?.usernameregister) {
              const userDoc = await User.findById(
                player.usernameregister
              ).select("profilePicture");
              const candidate = (userDoc?.profilePicture || "").trim();
              // If no image or legacy default image, fall back to the new DEFAULT_IMG
              img =
                !candidate || candidate === LEGACY_DEFAULT_IMG
                  ? DEFAULT_IMG
                  : candidate;
            }
          } catch (e) {
            img = DEFAULT_IMG;
          }
          (player.ign || []).forEach((ign) => {
            if (typeof ign === "string" && ign.trim()) {
              options.push({ name: ign.trim(), img });
            }
          });
        }
      } else if (
        q.type === "team" ||
        q.type === "bracket" ||
        q.type === "swiss_bracket" ||
        q.type === "double_eli_bracket" ||
        q.type === "single_eli_bracket"
      ) {
        const gameShort = q.game_short || q.game;
        let players = leagueDoc.players;
        if (gameShort) {
          players = players.filter(
            (p) =>
              p.game === gameShort ||
              p.game === leagueDoc.league.game_name ||
              p.game === leagueDoc.league.game_short
          );
        }
        const teamMap = new Map();
        players.forEach((player) => {
          if (player.team && player.team.name) {
            teamMap.set(player.team.name, {
              name: player.team.name,
              shortName: player.team.shortName || "",
              img: player.team.logoTeam || "",
            });
          }
        });
        options = Array.from(teamMap.values());
      } else if (q.type === "lol_champ") {
        // Build LoL champions list as options; use DDragon champion id for images
        const champs = await fetchLoLChampions("en_US");
        options = champs.map(({ id, name }) => ({ name, img: id }));
      } else {
        continue; // skip invalid type
      }

      // Chuẩn hóa correctAnswer cho single_eli_bracket hoặc double_eli_bracket nếu client gửi object
      let correctAnswer;
      if (
        (q.type === "single_eli_bracket" || q.type === "double_eli_bracket") &&
        q.correctAnswer &&
        !Array.isArray(q.correctAnswer) &&
        typeof q.correctAnswer === "object"
      ) {
        if (q.type === "single_eli_bracket") {
          correctAnswer = serializeBracketObjectToFlatArray(q.correctAnswer);
        } else {
          // double_eli_bracket: hỗ trợ 2 dạng object
          // 1) placements: { pos_7_8, pos_5_6, pos_4, pos_3, pos_2, pos_1 } -> P7_8:/P5_6:/...
          // 2) stages: { qf, sf, uf, ls1, ls2, fourth, third, second, first } -> QF:/SF:/.../FIRST:
          const hasPlacementKeys = [
            "pos_7_8",
            "pos_5_6",
            "pos_4",
            "pos_3",
            "pos_2",
            "pos_1",
          ].some((k) =>
            Object.prototype.hasOwnProperty.call(q.correctAnswer, k)
          );
          const hasStageKeys = [
            "qf",
            "sf",
            "uf",
            "ls1",
            "ls2",
            "fourth",
            "third",
            "second",
            "first",
          ].some((k) =>
            Object.prototype.hasOwnProperty.call(q.correctAnswer, k)
          );
          if (hasPlacementKeys) {
            correctAnswer = serializeDoubleBracketObjectToFlatArray(
              q.correctAnswer
            );
          } else if (hasStageKeys) {
            correctAnswer = serializeDoubleStageObjectToFlatArray(
              q.correctAnswer
            );
          } else {
            correctAnswer = [];
          }
        }
      } else {
        correctAnswer = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
      }
      // correctAnswer input processed
      // Nếu là double_eli_bracket hoặc single_eli_bracket thì giữ nguyên mảng phẳng
      // Các loại khác giữ nguyên như cũ
      // final correctAnswer prepared
      // Luôn cập nhật correctAnswer khi update hoặc thêm mới
      // Nếu truyền id, kiểm tra có tồn tại không
      let questionIdx = -1;
      if (typeof q.id === "number") {
        questionIdx = pickemDoc.questions.findIndex((ques) => ques.id === q.id);
      }

      if (questionIdx !== -1) {
        // Update câu hỏi cũ, luôn cập nhật correctAnswer đã chuẩn hóa
        pickemDoc.questions[questionIdx] = {
          ...pickemDoc.questions[questionIdx],
          ...q,
          options,
          correctAnswer,
          openTime: q.openTime
            ? new Date(q.openTime)
            : pickemDoc.questions[questionIdx].openTime,
          closeTime: q.closeTime
            ? new Date(q.closeTime)
            : pickemDoc.questions[questionIdx].closeTime,
        };
        updatedQuestions.push(pickemDoc.questions[questionIdx]);
      } else {
        // Thêm mới, luôn lưu correctAnswer đã chuẩn hóa
        let newId =
          typeof q.id === "number" ? q.id : pickemDoc.questions.length;
        const questionObj = {
          id: newId,
          question: q.question,
          maxChoose: q.maxChoose,
          game_short: q.game_short || q.game || "",
          league_id,
          type: q.type,
          bracket_id: q.bracket_id || "",
          options,
          score: typeof q.score === "number" ? q.score : 0,
          correctAnswer,
          openTime: q.openTime ? new Date(q.openTime) : undefined,
          closeTime: q.closeTime ? new Date(q.closeTime) : undefined,
        };
        pickemDoc.questions.push(questionObj);
        updatedQuestions.push(questionObj);
      }
    }
    await pickemDoc.save();
    // Chấm lại điểm cho toàn bộ user (force grading to ignore open/close windows)
    await gradePickem(league_id, true);

    // === CẬP NHẬT LEADERBOARD TỪ ĐIỂM ĐÃ CHẤM (gradePickem) ===
    try {
      const pickemResDoc = await PickemResponse.findOne({ league_id });
      let leaderboard = [];
      if (pickemResDoc) {
        for (const userRes of pickemResDoc.responses) {
          let totalScore = userRes.totalScore || 0;
          // Lấy thông tin user: nếu userId là ObjectId thì dùng findById, nếu là string thì dùng findOne({ username })
          let user = null;
          if (/^[0-9a-fA-F]{24}$/.test(userRes.userId)) {
            user = await User.findById(userRes.userId);
          } else {
            user = await User.findOne({ username: userRes.userId });
          }
          leaderboard.push({
            username: user?.username || userRes.userId || "",
            userId: userRes.userId,
            logoURL: user?.logoURL || user?.profilePicture || "",
            Score: totalScore,
          });
        }
        leaderboard.sort((a, b) => b.Score - a.Score);
        await PickemScore.findOneAndUpdate(
          { league_id },
          { league_id, leaderboard },
          { upsert: true }
        );
      }
    } catch (err) {
      console.error("Error updating PickemScore leaderboard:", err);
    }
    // === END CHẤM ĐIỂM ===

    res.status(200).json({
      message: "Questions processed",
      data: pickemDoc,
      updatedQuestions,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route: Lấy danh sách câu hỏi theo league_id, game_short và type (không trả về correctAnswer)
router.get("/:game_short/:league_id/question/:type", async (req, res) => {
  try {
    const { league_id, game_short, type } = req.params;
    const pickemDoc = await PickemChallenge.findOne({ league_id });
    if (!pickemDoc)
      return res.status(404).json({ message: "Pickem challenge not found" });

    // Support aggregating across ALL game_short when game_short === 'all' (or missing)
    const wantedGame = (game_short || "").toString().toLowerCase();
    const includeAllGames = !wantedGame || wantedGame === "all";
    const wantedType = (type || "").toString().toLowerCase();
    const includeAllTypes = !wantedType || wantedType === "all";

    const questions = (pickemDoc.questions || []).filter((q) => {
      const qGame = (q.game_short || "").toString().toLowerCase();
      if (!includeAllGames && qGame !== wantedGame) return false;
      if (!includeAllTypes) return q.type === type;
      return true;
    });

    const sanitized = questions.map((q) => ({
      id: q.id,
      question: q.question,
      type: q.type,
      options: q.options || [],
      score: q.score,
      maxChoose: q.maxChoose,
      correctAnswer: q.correctAnswer,
      game_short: q.game_short,
      bracket_id: q.bracket_id,
      openTime: q.openTime,
      closeTime: q.closeTime,
    }));

    // Compute totalPoint (filtered set) as sum of (maxChoose * score)
    const totalPoint = sanitized.reduce(
      (sum, q) => sum + (Number(q.maxChoose) || 0) * (Number(q.score) || 0),
      0
    );

    // Compute league-wide total across ALL game_short (respecting type filter unless type === 'all')
    const leagueScope = (pickemDoc.questions || []).filter((q) =>
      includeAllTypes ? true : q.type === type
    );
    const totalPointAll = leagueScope.reduce(
      (sum, q) => sum + (Number(q.maxChoose) || 0) * (Number(q.score) || 0),
      0
    );

    res.json({
      league_id,
      game_short,
      type,
      count: sanitized.length,
      questions: sanitized,
      totalPoint,
      // New: grand total across ALL game_short for this league (and matching type when provided)
      totalPointAll,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post("/:league_id/submitPrediction", async (req, res) => {
  try {
    const { league_id } = req.params;
    const { userId, answers } = req.body;

    if (!league_id || !userId || !answers || !Array.isArray(answers)) {
      return res
        .status(400)
        .json({ error: "Thiếu league_id, userId hoặc answers." });
    }

    // Tạm giữ nguyên selectedOptions (có thể là mảng hoặc object) và lưu openTime/closeTime nếu có
    let formattedAnswers = answers.map((ans) => ({
      questionId: ans.questionId,
      selectedOptions: ans.selectedOptions,
      openTime: ans.openTime ? new Date(ans.openTime) : undefined,
      closeTime: ans.closeTime ? new Date(ans.closeTime) : undefined,
    }));

    // Enrich saved response with user's nickname and team info when possible
    let pickemDoc = await PickemResponse.findOne({ league_id });

    // Try to resolve user by ObjectId or username
    let user = null;
    try {
      if (/^[0-9a-fA-F]{24}$/.test(String(userId))) {
        user = await User.findById(userId).select("-password");
      } else {
        user = await User.findOne({ username: userId }).select("-password");
      }
    } catch (err) {
      // ignore lookup errors, we'll save without enrichment
      user = null;
    }

    const responseEntry = {
      userId,
      user: {
        id: user ? String(user._id) : String(userId),
        nickname: user?.nickname,
        team: user?.team || undefined,
      },
      answers: formattedAnswers,
    };

    if (!pickemDoc) {
      pickemDoc = new PickemResponse({
        league_id,
        responses: [responseEntry],
      });
      await pickemDoc.save();
    } else {
      const userIndex = pickemDoc.responses.findIndex(
        (r) => String(r.userId) === String(userId)
      );
      if (userIndex !== -1) {
        // Merge incoming answers into existing answers.
        // Only replace an existing answer when questionId + game_short + type match;
        // otherwise append the incoming answer so we don't overwrite unrelated entries.
        const existingAnswers = pickemDoc.responses[userIndex].answers || [];

        // Load question bank to get game_short/type for matching
        const pickemQuestionDoc = await PickemChallenge.findOne({ league_id });

        // For single_eli_bracket & double_eli_bracket: serialize object form to flat [String] with prefixes
        formattedAnswers = formattedAnswers.map((incoming) => {
          const incomingQ = pickemQuestionDoc?.questions?.find(
            (q) => q.id === incoming.questionId
          );
          if (
            (incomingQ?.type === "single_eli_bracket" ||
              incomingQ?.type === "double_eli_bracket") &&
            incoming.selectedOptions &&
            !Array.isArray(incoming.selectedOptions) &&
            typeof incoming.selectedOptions === "object"
          ) {
            const selectedOptions =
              incomingQ?.type === "single_eli_bracket"
                ? serializeBracketObjectToFlatArray(incoming.selectedOptions)
                : serializeDoubleBracketObjectToFlatArray(
                    incoming.selectedOptions
                  );
            return {
              ...incoming,
              selectedOptions,
            };
          }
          // Ensure array for non-object
          let selectedOptions = Array.isArray(incoming.selectedOptions)
            ? incoming.selectedOptions
            : [];
          // For double_eli_bracket, strip FE-only stage tokens before saving the answer
          if (incomingQ?.type === "double_eli_bracket") {
            const allowed = new Set(Object.values(DOUBLE_PREFIX));
            selectedOptions = selectedOptions.filter((s) => {
              if (typeof s !== "string") return false;
              const idx = s.indexOf(":");
              if (idx <= 0) return false;
              const pref = s.slice(0, idx);
              return allowed.has(pref);
            });
          }
          return { ...incoming, selectedOptions };
        });

        const mergedAnswers = [...existingAnswers];

        for (const incoming of formattedAnswers) {
          // Determine metadata for the incoming answer's question
          const incomingQ = pickemQuestionDoc?.questions?.find(
            (q) => q.id === incoming.questionId
          );
          const incomingGame = incomingQ?.game_short;
          const incomingType = incomingQ?.type;

          const matchIdx = mergedAnswers.findIndex((ea) => {
            if (ea.questionId !== incoming.questionId) return false;
            const existingQ = pickemQuestionDoc?.questions?.find(
              (q) => q.id === ea.questionId
            );
            const existingGame = existingQ?.game_short;
            const existingType = existingQ?.type;
            return (
              existingGame === incomingGame && existingType === incomingType
            );
          });

          if (matchIdx !== -1) {
            // Replace the matching existing answer
            mergedAnswers[matchIdx] = incoming;
          } else {
            // No matching existing answer: append
            mergedAnswers.push(incoming);
          }
        }

        pickemDoc.responses[userIndex].answers = mergedAnswers;
        pickemDoc.responses[userIndex].user = responseEntry.user;
      } else {
        pickemDoc.responses.push(responseEntry);
      }
      await pickemDoc.save();
    }

    // Persist a single stages log per question (double_eli_bracket) aggregated to the latest state
    try {
      const pickemQuestionDoc = await PickemChallenge.findOne({ league_id });
      const clientIp =
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.ip;
      const userIdxForLog = pickemDoc.responses.findIndex(
        (r) => String(r.userId) === String(userId)
      );
      if (userIdxForLog === -1)
        throw new Error("User response not found to append logs");

      // Build a latest stages object per question from incoming answers
      const stageByQid = new Map();
      for (const ans of answers || []) {
        const ques = pickemQuestionDoc?.questions?.find(
          (q) => q.id === ans.questionId
        );
        if (ques?.type !== "double_eli_bracket") continue;
        const flat = Array.isArray(ans.selectedOptions)
          ? ans.selectedOptions
          : [];
        const stages = deserializeDoubleStageTokens(flat);
        // Backfill podium stages from final placements when not explicitly present in the incoming stage tokens
        const bracketObj = deserializeFlatArrayToDoubleBracketObject(flat);
        stages.first =
          stages.first && stages.first.length
            ? stages.first
            : bracketObj.pos_1 || [];
        stages.second =
          stages.second && stages.second.length
            ? stages.second
            : bracketObj.pos_2 || [];
        stages.third =
          stages.third && stages.third.length
            ? stages.third
            : bracketObj.pos_3 || [];
        stages.fourth =
          stages.fourth && stages.fourth.length
            ? stages.fourth
            : bracketObj.pos_4 || [];
        stageByQid.set(ans.questionId, stages);
      }

      const userLogs = (pickemDoc.responses[userIdxForLog].logs =
        pickemDoc.responses[userIdxForLog].logs || []);

      for (const [qid, stages] of stageByQid.entries()) {
        const existingIdx = userLogs.findIndex(
          (l) => Number(l.questionId) === Number(qid)
        );
        const logEntry = {
          userId: String(userId),
          questionId: Number(qid),
          type: "double_eli_bracket",
          stages,
          user: responseEntry.user,
          ip: clientIp,
          updatedAt: new Date(),
        };
        // Token count to decide whether to overwrite existing
        const countTokens = (st) =>
          (st?.qf?.length || 0) +
          (st?.sf?.length || 0) +
          (st?.uf?.length || 0) +
          (st?.ls1?.length || 0) +
          (st?.ls2?.length || 0) +
          (st?.fourth?.length || 0) +
          (st?.third?.length || 0) +
          (st?.second?.length || 0) +
          (st?.first?.length || 0);
        let targetIdx = existingIdx;
        if (existingIdx !== -1) {
          const existing = userLogs[existingIdx];
          const existingStages =
            existing?.stages || existing?.selectedStages || {};
          const newCount = countTokens(stages);
          const oldCount = countTokens(existingStages);
          // Only overwrite if new log is richer or equal
          if (newCount >= oldCount) {
            userLogs[existingIdx] = { ...existing, ...logEntry };
          }
        } else {
          // Create a new log entry
          userLogs.push({ ...logEntry, createdAt: new Date() });
          targetIdx = userLogs.length - 1;
        }
        // Deduplicate: remove any other logs with the same questionId
        for (let i = userLogs.length - 1; i >= 0; i--) {
          if (
            i !== targetIdx &&
            Number(userLogs[i].questionId) === Number(qid)
          ) {
            userLogs.splice(i, 1);
          }
        }
      }
      await pickemDoc.save();
    } catch (logErr) {
      console.error("Error writing per-user logs:", logErr?.message || logErr);
    }

    // Chấm lại điểm cho toàn bộ user
    await gradePickem(league_id);
    res.status(200).json({
      success: true,
      message: "Dự đoán đã được lưu và đã chấm lại điểm số.",
      data: pickemDoc,
    });
  } catch (error) {
    console.error("Error submitting prediction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// Route: Lấy câu trả lời của user cho 1 league
router.get("/:league_id/myanswer", async (req, res) => {
  try {
    const { league_id } = req.params;
    // user id có thể được truyền bằng query ?userId=... hoặc header x-user-id
    const userId =
      req.query.userId || req.headers["x-user-id"] || req.body?.userId;
    // Cho phép includeLogs đến từ query hoặc body, mặc định TRUE để luôn trả log
    const includeLogsParam =
      typeof req.query.includeLogs !== "undefined"
        ? req.query.includeLogs
        : req.body?.includeLogs;
    const includeLogs =
      includeLogsParam === true ||
      includeLogsParam === "true" ||
      includeLogsParam === undefined;
    // Chấp nhận questionId từ query hoặc body
    const rawQid =
      typeof req.query.questionId !== "undefined"
        ? req.query.questionId
        : req.body?.questionId;
    const questionIdFilter =
      typeof rawQid !== "undefined" ? Number(rawQid) : undefined;

    if (!userId)
      return res
        .status(400)
        .json({ error: "Missing userId (query or x-user-id header)" });

    const pickemResDoc = await PickemResponse.findOne({ league_id });
    if (!pickemResDoc)
      return res.status(404).json({ error: "No responses for league" });

    const userRes = pickemResDoc.responses.find(
      (r) => String(r.userId) === String(userId)
    );
    if (!userRes)
      return res.status(404).json({ error: "No answers found for this user" });

    // Build user object: prefer stored user subdoc, otherwise try to resolve
    let userObj = userRes.user;
    if (!userObj) {
      try {
        let lookupUser = null;
        if (/^[0-9a-fA-F]{24}$/.test(String(userId))) {
          lookupUser = await User.findById(userId).select("-password");
        } else {
          lookupUser = await User.findOne({ username: userId }).select(
            "-password"
          );
        }
        if (lookupUser) {
          userObj = {
            id: String(lookupUser._id),
            nickname: lookupUser.nickname,
            team: lookupUser.team || undefined,
          };
        }
      } catch (err) {
        userObj = { id: String(userId) };
      }
    }

    // Return user's answers; include question meta by default (unless includeMeta explicitly "false")
    const includeMeta = req.query.includeMeta !== "false";
    if (!includeMeta) {
      const base = {
        league_id,
        userId,
        user: userObj,
        totalScore: userRes.totalScore || 0,
        answers: userRes.answers || [],
      };
      if (includeLogs) {
        const logs = Array.isArray(userRes.logs) ? userRes.logs : [];
        // Reduce to best entry per questionId (prefer more tokens; break ties by latest ts)
        const latestByQ = new Map();
        const emptyStages = {
          qf: [],
          sf: [],
          uf: [],
          ls1: [],
          ls2: [],
          fourth: [],
          third: [],
          second: [],
          first: [],
        };
        const countTokens = (st) =>
          (st.qf?.length || 0) +
          (st.sf?.length || 0) +
          (st.uf?.length || 0) +
          (st.ls1?.length || 0) +
          (st.ls2?.length || 0) +
          (st.fourth?.length || 0) +
          (st.third?.length || 0) +
          (st.second?.length || 0) +
          (st.first?.length || 0);
        for (const l of logs) {
          const key = Number(l.questionId);
          const ts = new Date(l.updatedAt || l.createdAt || 0).getTime();
          const stages = l.stages || l.selectedStages || emptyStages;
          const tokens = countTokens(stages);
          const current = latestByQ.get(key);
          if (!current) {
            latestByQ.set(key, {
              _ts: ts,
              _tokens: tokens,
              questionId: key,
              stages,
            });
          } else if (
            tokens > current._tokens ||
            (tokens === current._tokens && ts > current._ts)
          ) {
            latestByQ.set(key, {
              _ts: ts,
              _tokens: tokens,
              questionId: key,
              stages,
            });
          }
        }
        if (typeof questionIdFilter === "number") {
          const entry = latestByQ.get(questionIdFilter);
          return res.json({
            ...base,
            logs: entry ? entry.stages : emptyStages,
          });
        }
        const latestArr = Array.from(latestByQ.values()).map(
          ({ _ts, _tokens, ...rest }) => rest
        );
        return res.json({ ...base, logs: latestArr });
      }
      return res.json(base);
    }

    const pickemDoc = await PickemChallenge.findOne({ league_id });
    const enriched = (userRes.answers || []).map((ans) => {
      const ques = pickemDoc?.questions?.find((q) => q.id === ans.questionId);
      const base = {
        questionId: ans.questionId,
        selectedOptions: ans.selectedOptions,
        openTime: ans.openTime,
        closeTime: ans.closeTime,
        question: ques?.question,
        type: ques?.type,
        maxChoose: ques?.maxChoose,
        score: ques?.score,
        options: ques?.options || [],
      };
      if (ques?.type === "single_eli_bracket") {
        return {
          ...base,
          selectedBracket: deserializeFlatArrayToBracketObject(
            ans.selectedOptions || []
          ),
        };
      } else if (ques?.type === "double_eli_bracket") {
        const bracketObj = deserializeFlatArrayToDoubleBracketObject(
          ans.selectedOptions || []
        );
        const stages = deserializeDoubleStageTokens(ans.selectedOptions || []);
        // Backfill podium stages from final placements when not explicitly present
        stages.first =
          stages.first && stages.first.length
            ? stages.first
            : bracketObj.pos_1 || [];
        stages.second =
          stages.second && stages.second.length
            ? stages.second
            : bracketObj.pos_2 || [];
        stages.third =
          stages.third && stages.third.length
            ? stages.third
            : bracketObj.pos_3 || [];
        stages.fourth =
          stages.fourth && stages.fourth.length
            ? stages.fourth
            : bracketObj.pos_4 || [];
        return {
          ...base,
          selectedBracket: bracketObj,
          // FE-only: expose stage tokens like single_eli to visualize user picks
          selectedStages: stages,
        };
      }
      return base;
    });

    const responsePayload = {
      league_id,
      userId,
      user: userObj,
      totalScore: userRes.totalScore || 0,
      answers: enriched,
    };
    if (includeLogs) {
      const logs = Array.isArray(userRes.logs) ? userRes.logs : [];
      // Reduce to best entry per questionId (prefer more tokens; break ties by latest ts)
      const latestByQ = new Map();
      const emptyStages = {
        qf: [],
        sf: [],
        uf: [],
        ls1: [],
        ls2: [],
        fourth: [],
        third: [],
        second: [],
        first: [],
      };
      const countTokens = (st) =>
        (st.qf?.length || 0) +
        (st.sf?.length || 0) +
        (st.uf?.length || 0) +
        (st.ls1?.length || 0) +
        (st.ls2?.length || 0) +
        (st.fourth?.length || 0) +
        (st.third?.length || 0) +
        (st.second?.length || 0) +
        (st.first?.length || 0);
      for (const l of logs) {
        const key = Number(l.questionId);
        const ts = new Date(l.updatedAt || l.createdAt || 0).getTime();
        const stages = l.stages || l.selectedStages || emptyStages;
        const tokens = countTokens(stages);
        const current = latestByQ.get(key);
        if (!current) {
          latestByQ.set(key, {
            _ts: ts,
            _tokens: tokens,
            questionId: key,
            stages,
          });
        } else if (
          tokens > current._tokens ||
          (tokens === current._tokens && ts > current._ts)
        ) {
          latestByQ.set(key, {
            _ts: ts,
            _tokens: tokens,
            questionId: key,
            stages,
          });
        }
      }
      if (typeof questionIdFilter === "number") {
        const entry = latestByQ.get(questionIdFilter);
        responsePayload.logs = entry ? entry.stages : emptyStages;
      } else {
        responsePayload.logs = Array.from(latestByQ.values()).map(
          ({ _ts, _tokens, ...rest }) => rest
        );
      }
    }
    return res.json(responsePayload);
  } catch (err) {
    console.error("Error in /:league_id/myanswer:", err);
    res.status(500).json({ error: err.message });
  }
});

// Route: Lấy câu trả lời Pick'em của bất kỳ user theo league (viewer mode)
// API: GET /:league_id/pickem/:userid
// - Params:
//   - league_id: id của giải đấu
//   - userid: có thể là ObjectId (24 hex) hoặc username (string)
// - Query (tùy chọn):
//   - includeMeta=true|false (mặc định true): có trả kèm thông tin câu hỏi
//   - includeLogs=true|false (mặc định true): có trả kèm logs stage cho double_eli_bracket
//   - questionId=<number>: chỉ trả lời cho 1 câu hỏi cụ thể
router.get("/:league_id/pickem/:userid", async (req, res) => {
  try {
    const { league_id, userid } = req.params;

    if (!userid)
      return res.status(400).json({ error: "Missing userid param in path" });

    const includeLogsParam =
      typeof req.query.includeLogs !== "undefined"
        ? req.query.includeLogs
        : req.body?.includeLogs;
    const includeLogs =
      includeLogsParam === true ||
      includeLogsParam === "true" ||
      includeLogsParam === undefined;

    const rawQid =
      typeof req.query.questionId !== "undefined"
        ? req.query.questionId
        : req.body?.questionId;
    const questionIdFilter =
      typeof rawQid !== "undefined" ? Number(rawQid) : undefined;

    const pickemResDoc = await PickemResponse.findOne({ league_id });
    if (!pickemResDoc)
      return res.status(404).json({ error: "No responses for league" });

    // userId trong doc có thể lưu là ObjectId string hoặc username string
    const userRes = pickemResDoc.responses.find(
      (r) => String(r.userId) === String(userid)
    );
    if (!userRes)
      return res.status(404).json({ error: "No answers found for this user" });

    // Xây user object: ưu tiên subdoc đã lưu, nếu thiếu thì thử resolve
    let userObj = userRes.user;
    if (!userObj) {
      try {
        let lookupUser = null;
        if (/^[0-9a-fA-F]{24}$/.test(String(userid))) {
          lookupUser = await User.findById(userid).select("-password");
        } else {
          lookupUser = await User.findOne({ username: userid }).select(
            "-password"
          );
        }
        if (lookupUser) {
          userObj = {
            id: String(lookupUser._id),
            nickname: lookupUser.nickname,
            team: lookupUser.team || undefined,
          };
        }
      } catch (err) {
        userObj = { id: String(userid) };
      }
    }

    const includeMeta = req.query.includeMeta !== "false";
    if (!includeMeta) {
      const base = {
        league_id,
        userId: userid,
        user: userObj,
        totalScore: userRes.totalScore || 0,
        answers: userRes.answers || [],
      };
      if (includeLogs) {
        const logs = Array.isArray(userRes.logs) ? userRes.logs : [];
        const latestByQ = new Map();
        const emptyStages = {
          qf: [],
          sf: [],
          uf: [],
          ls1: [],
          ls2: [],
          fourth: [],
          third: [],
          second: [],
          first: [],
        };
        const countTokens = (st) =>
          (st.qf?.length || 0) +
          (st.sf?.length || 0) +
          (st.uf?.length || 0) +
          (st.ls1?.length || 0) +
          (st.ls2?.length || 0) +
          (st.fourth?.length || 0) +
          (st.third?.length || 0) +
          (st.second?.length || 0) +
          (st.first?.length || 0);
        for (const l of logs) {
          const key = Number(l.questionId);
          const ts = new Date(l.updatedAt || l.createdAt || 0).getTime();
          const stages = l.stages || l.selectedStages || emptyStages;
          const tokens = countTokens(stages);
          const current = latestByQ.get(key);
          if (!current) {
            latestByQ.set(key, {
              _ts: ts,
              _tokens: tokens,
              questionId: key,
              stages,
            });
          } else if (
            tokens > current._tokens ||
            (tokens === current._tokens && ts > current._ts)
          ) {
            latestByQ.set(key, {
              _ts: ts,
              _tokens: tokens,
              questionId: key,
              stages,
            });
          }
        }
        if (typeof questionIdFilter === "number") {
          const entry = latestByQ.get(questionIdFilter);
          return res.json({
            ...base,
            logs: entry ? entry.stages : emptyStages,
          });
        }
        const latestArr = Array.from(latestByQ.values()).map(
          ({ _ts, _tokens, ...rest }) => rest
        );
        return res.json({ ...base, logs: latestArr });
      }
      return res.json(base);
    }

    // includeMeta = true -> enrich answers with question metadata
    const pickemDoc = await PickemChallenge.findOne({ league_id });
    const enriched = (userRes.answers || []).map((ans) => {
      const ques = pickemDoc?.questions?.find((q) => q.id === ans.questionId);
      const base = {
        questionId: ans.questionId,
        selectedOptions: ans.selectedOptions,
        openTime: ans.openTime,
        closeTime: ans.closeTime,
        question: ques?.question,
        type: ques?.type,
        maxChoose: ques?.maxChoose,
        score: ques?.score,
        options: ques?.options || [],
      };
      if (ques?.type === "single_eli_bracket") {
        return {
          ...base,
          selectedBracket: deserializeFlatArrayToBracketObject(
            ans.selectedOptions || []
          ),
        };
      } else if (ques?.type === "double_eli_bracket") {
        const bracketObj = deserializeFlatArrayToDoubleBracketObject(
          ans.selectedOptions || []
        );
        const stages = deserializeDoubleStageTokens(ans.selectedOptions || []);
        // Backfill podium
        stages.first =
          stages.first && stages.first.length
            ? stages.first
            : bracketObj.pos_1 || [];
        stages.second =
          stages.second && stages.second.length
            ? stages.second
            : bracketObj.pos_2 || [];
        stages.third =
          stages.third && stages.third.length
            ? stages.third
            : bracketObj.pos_3 || [];
        stages.fourth =
          stages.fourth && stages.fourth.length
            ? stages.fourth
            : bracketObj.pos_4 || [];
        return { ...base, selectedBracket: bracketObj, selectedStages: stages };
      }
      return base;
    });

    const responsePayload = {
      league_id,
      userId: userid,
      user: userObj,
      totalScore: userRes.totalScore || 0,
      answers: enriched,
    };
    if (includeLogs) {
      const logs = Array.isArray(userRes.logs) ? userRes.logs : [];
      const latestByQ = new Map();
      const emptyStages = {
        qf: [],
        sf: [],
        uf: [],
        ls1: [],
        ls2: [],
        fourth: [],
        third: [],
        second: [],
        first: [],
      };
      const countTokens = (st) =>
        (st.qf?.length || 0) +
        (st.sf?.length || 0) +
        (st.uf?.length || 0) +
        (st.ls1?.length || 0) +
        (st.ls2?.length || 0) +
        (st.fourth?.length || 0) +
        (st.third?.length || 0) +
        (st.second?.length || 0) +
        (st.first?.length || 0);
      for (const l of logs) {
        const key = Number(l.questionId);
        const ts = new Date(l.updatedAt || l.createdAt || 0).getTime();
        const stages = l.stages || l.selectedStages || emptyStages;
        const tokens = countTokens(stages);
        const current = latestByQ.get(key);
        if (!current) {
          latestByQ.set(key, {
            _ts: ts,
            _tokens: tokens,
            questionId: key,
            stages,
          });
        } else if (
          tokens > current._tokens ||
          (tokens === current._tokens && ts > current._ts)
        ) {
          latestByQ.set(key, {
            _ts: ts,
            _tokens: tokens,
            questionId: key,
            stages,
          });
        }
      }
      if (typeof questionIdFilter === "number") {
        const entry = latestByQ.get(questionIdFilter);
        responsePayload.logs = entry ? entry.stages : emptyStages;
      } else {
        responsePayload.logs = Array.from(latestByQ.values()).map(
          ({ _ts, _tokens, ...rest }) => rest
        );
      }
    }
    return res.json(responsePayload);
  } catch (err) {
    console.error("Error in /:league_id/pickem/:userid:", err);
    res.status(500).json({ error: err.message });
  }
});
// Route: Cập nhật score và correctAnswer cho câu hỏi Pickem theo id

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

dotenv.config();
const apiKeyValorant = process.env.API_KEY_VALORANT_RIOT;

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
// Fetch current LoL champions from Data Dragon
// Fetch current LoL champions from Data Dragon (id for images, name for display)
async function fetchLoLChampions(locale = "en_US") {
  try {
    const versionsResp = await axios.get(
      "https://ddragon.leagueoflegends.com/api/versions.json"
    );
    const versions = Array.isArray(versionsResp.data) ? versionsResp.data : [];
    const ver = versions[0] || "15.20.1";
    const champsResp = await axios.get(
      `https://ddragon.leagueoflegends.com/cdn/${ver}/data/${locale}/champion.json`
    );
    const dataObj = champsResp?.data?.data || {};
    const champions = Object.values(dataObj)
      .map((c) => ({ id: c?.id, name: c?.name }))
      .filter((c) => c.id && c.name);
    champions.sort((a, b) => a.name.localeCompare(b.name));
    return champions;
  } catch (e) {
    console.error("Failed to fetch LoL champions:", e?.message || e);
    return [];
  }
}
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
// Get Riot account by Riot ID and then return TFT league data by PUUID
router.get("/riot/tft/by-riotid/:gameName/:tagLine", async (req, res) => {
  const { gameName, tagLine } = req.params;
  try {
    const accountResp = await axios.get(
      `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
        gameName
      )}/${encodeURIComponent(tagLine)}`,
      { headers: { "X-Riot-Token": process.env.TFT_KEY } }
    );

    const { puuid } = accountResp.data;

    const leagueResp = await axios.get(
      `https://vn2.api.riotgames.com/tft/league/v1/by-puuid/${encodeURIComponent(
        puuid
      )}`,
      { headers: { "X-Riot-Token": process.env.TFT_KEY } }
    );

    // Filter only entries with queueType === 'RANKED_TFT'
    const rawLeague = Array.isArray(leagueResp.data) ? leagueResp.data : [];
    const filtered = rawLeague.filter(
      (entry) => entry && entry.queueType === "RANKED_TFT"
    );

    // Merge into single response object (include gameName/tagLine and ranked fields)
    const first = filtered[0] || null;
    const merged = {
      gameName: accountResp.data.gameName || gameName,
      tagLine: accountResp.data.tagLine || tagLine,
    };

    // Populate ranked fields with safe defaults so response always contains them
    merged.queueType = first?.queueType;
    merged.leagueId = first?.leagueId;
    merged.tier = first?.tier;
    merged.rank = first?.rank;
    merged.leaguePoints =
      typeof first?.leaguePoints === "number" ? first.leaguePoints : null;
    merged.wins = typeof first?.wins === "number" ? first.wins : 0;
    merged.losses = typeof first?.losses === "number" ? first.losses : 0;
    merged.veteran = Boolean(first?.veteran);
    merged.inactive = Boolean(first?.inactive);
    merged.freshBlood = Boolean(first?.freshBlood);
    merged.hotStreak = Boolean(first?.hotStreak);
    const totalGames = merged.wins + merged.losses;
    merged.winrate =
      totalGames > 0
        ? parseFloat(((merged.wins * 100) / totalGames).toFixed(2))
        : 0;

    // CORS handled by global middleware
    return res.json(merged);
  } catch (error) {
    console.error("Error in /riot/tft/by-riotid:", error.message);
    return res
      .status(error.response?.status || 500)
      .json({ error: error.response?.data || error.message });
  }
});
router.get("/findallteamValorant", findAllteamValorant);
router.post("/findallteamTFTDouble", findAllteamTFTDouble);
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
router.post("/:game_name/:league_id/checkregister", async (req, res) => {
  const { game_name, league_id } = req.params;
  const { usernameregister } = req.body;

  try {
    const game = game_name;

    // ✅ Tìm đúng giải theo league_id và game TFT
    const league = await DCNLeague.findOne({
      "league.league_id": league_id,
      "league.game_short": game,
    });

    if (!league) {
      return res.status(404).json({ message: "League not found" });
    }

    // ✅ Kiểm tra xem player có trong players không
    const player = league.players.find(
      (p) => String(p.usernameregister) === String(usernameregister)
    );

    if (player) {
      return res.status(200).json(player);
    }

    return res.status(404).json({ message: "Player not found in this league" });
  } catch (error) {
    console.error("❌ Error in /:league_id/checkregisterTFT:", error);
    res.status(500).json({ message: "Server error" });
  }
});
router.post("/checkregisterorz", async (req, res) => {
  try {
    const { usernameregister } = req.body; // usernameregister là currentUser._id
    const existingTeam = await Organization.findOne({
      "players._id": usernameregister,
    });

    if (existingTeam) {
      // Nếu tìm thấy _id trong players, trả lại thông tin đội
      return res.status(200).json(existingTeam);
    }

    // Nếu không tìm thấy đội, trả lại lỗi 404
    return res.status(404).json({ message: "Team not found" });
  } catch (error) {
    // Xử lý lỗi server
    res.status(500).json({ message: error });
  }
});
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

    // Bỏ hết kiểm tra regex, chỉ cần submit là được

    // Tìm đội hiện tại của user
    const existingTeam = await Organization.findOne({ usernameregister });

    // Kiểm tra trùng team
    const nicknames = gameMembers.map((p) => p.nickname);
    const users = await User.find({ nickname: { $in: nicknames } });

    // Gán _id và username cho từng player trong gameMembers nếu tìm thấy user
    const gameMembersWithId = gameMembers.map((p) => {
      const user = users.find((u) => u.nickname === p.nickname);
      return {
        ...p,
        _id: user ? user._id : undefined,
        username: user ? user.username : "",
      };
    });

    if (existingTeam) {
      // Tách danh sách thành viên cũ & mới
      const oldNicknames = existingTeam.players.map((p) => p.nickname);
      const newNicknames = gameMembersWithId.map((p) => p.nickname);
      const removedMembers = oldNicknames.filter(
        (name) => !newNicknames.includes(name)
      );
      const addedOrKeptMembers = newNicknames;

      // Cập nhật đội
      existingTeam.team = teamName;
      existingTeam.shortname = shortName;
      existingTeam.class = classTeam;
      existingTeam.logoURL = logoUrl;
      existingTeam.players = gameMembersWithId;
      existingTeam.color = color;

      const updatedTeam = await existingTeam.save();

      // Gỡ team của người bị xóa
      await Promise.all(
        removedMembers.map((name) =>
          User.findOneAndUpdate({ nickname: name }, { team: "" })
        )
      );

      // Cập nhật team mới cho thành viên
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

    // Nếu chưa có đội, tạo mới
    const newTeam = new Organization({
      discordID,
      usernameregister,
      team: teamName,
      shortname: shortName,
      class: classTeam,
      logoURL: logoUrl,
      players: gameMembersWithId,
      color: color,
    });

    const savedTeam = await newTeam.save();

    // Cập nhật team cho thành viên mới
    await Promise.all(
      gameMembersWithId.map((member) =>
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
      // CORS handled by global middleware
      return res.json({ source: "database", matchData: data });
    }

    // Lock để tránh race condition
    while (matchLocks.get(matchId)) {
      await new Promise((resolve) => setTimeout(resolve, 100));
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
      // Lấy dictionary cho character/map
      const dictionaryResponse = await axios.get(
        "https://bigtournament-1.onrender.com/api/valorant/dictionary"
      );
      const characterMap = {};
      const mapMap = {};

      dictionaryResponse.data.maps?.forEach((map) => {
        if (map.assetPath) {
          mapMap[map.assetPath.toUpperCase()] = map.name;
          mapMap[map.assetPath.toLowerCase()] = map.name;
        }
        if (map.id) {
          mapMap[map.id.toUpperCase()] = map.name;
          mapMap[map.id.toLowerCase()] = map.name;
        }
        // Debug log
        // console.log('Map dictionary entry:', map.assetPath, map.id, map.name);
      });

      dictionaryResponse.data.characters?.forEach((char) => {
        if (char.id) {
          characterMap[char.id.toUpperCase()] = char.name;
          characterMap[char.id.toLowerCase()] = char.name;
        }
        // Debug log
        // console.log('Character dictionary entry:', char.id, char.name);
      });

      // Gọi API Riot lấy match data
      const apiKeyValorant = process.env.API_KEY_VALORANT_RIOT;
      const response = await axios.get(
        `https://ap.api.riotgames.com/val/match/v1/matches/${matchId}`,
        { headers: { "X-Riot-Token": apiKeyValorant } }
      );

      const matchData = response.data;
      const rawMapId = matchData?.matchInfo?.mapId?.toUpperCase();
      // Try both upper and lower case for mapId
      let mapName =
        mapMap[rawMapId] ||
        mapMap[rawMapId?.toLowerCase()] ||
        mapMap[rawMapId?.toUpperCase()];
      if (!mapName) {
        console.error(
          "Không tìm thấy mapName cho mapId:",
          rawMapId,
          "mapMap:",
          Object.keys(mapMap)
        );
        mapName = "Unknown";
      }
      matchData.matchInfo.mapName = mapName;

      // Giữ nguyên roundResults gốc để tính toán advancedStats
      const roundResultsFull = matchData.roundResults || [];

      // Tạo roundResults rút gọn để trả về/lưu DB
      const roundResults = roundResultsFull.map((round) => ({
        roundNum: round.roundNum,
        winningTeam: round.winningTeam,
        winningTeamRole: round.winningTeamRole,
        roundCeremony: round.roundCeremony,
      }));

      if (matchData?.players) {
        matchData.players.forEach((player) => {
          // Try both upper and lower case for characterId
          let cleanId = player.characterId;
          let charName =
            characterMap[cleanId?.toUpperCase()] ||
            characterMap[cleanId?.toLowerCase()];
          if (!charName) {
            console.error(
              "Không tìm thấy characterName cho characterId:",
              cleanId,
              "characterMap:",
              Object.keys(characterMap)
            );
            charName = "Unknown";
          }
          player.characterName = charName;
          player.imgCharacter =
            charName !== "Unknown"
              ? `https://dongchuyennghiep.vercel.app/agent/${charName}.png`
              : "Unknown";
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

            // Tính advancedStats dựa trên roundResults gốc (có playerStats)
            const advancedStats = calculatePlayerStats(
              player,
              roundResultsFull
            );
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

      await ValorantMatch.findOneAndUpdate(
        { matchId },
        { matchId, data: finalData },
        { upsert: true, new: true }
      );

      // CORS handled by global middleware
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

    // CORS handled by global middleware
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
            `https://bigtournament-1.onrender.com/api/valorant/match/${mId}`
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
