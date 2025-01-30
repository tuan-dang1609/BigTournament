import express from 'express';
import {findAllteamValorant,findAllteamTFT,findAllteamAOV,findAllteamTFTDouble, signin, signup,teamHOF,leagueHOF,findleagueHOF,findteamHOF, signout,getCorrectAnswers,comparePredictionmultiple,calculateMaxPoints,getUserPickemScore,comparePredictions, submitPrediction, submitCorrectAnswer, leaderboardpickem, finduserPrediction, findPlayer, findAllteam, addBanPickVeto, findBanPickVeto, addAllGame, findAllGame, addMatchID, findAllMatchID, findmatchID } from '../controllers/auth.controller.js';
import QuestionPickem from '../models/question.model.js';
import PowerRankingAOV from '../models/powerRankingAOV.model.js';
import Response from '../models/response.model.js';
import TeamRegister from '../models/registergame.model.js'
import Match from '../models/match.model.js';
import User from '../models/user.model.js';
import BanPickValo from '../models/veto.model.js';
const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.get('/signout', signout);
router.post('/findallgame', findAllGame)
router.post('/findplayer', findPlayer)
router.post('/banpick', addBanPickVeto)
router.post('/findbanpick', findBanPickVeto)
router.post('/allgame', addAllGame)
router.post('/addmatch', addMatchID)
router.post('/findallmatchid', findAllMatchID)
router.post('/findmatchid', findmatchID)
router.post('/findallteam', findAllteam)
router.post('/findallteamAOV', findAllteamAOV)
router.post('/findallteamTFT', findAllteamTFT)
router.post('/findallteamValorant', findAllteamValorant)
router.post('/findallteamTFTDouble', findAllteamTFTDouble)
router.post('/submitPrediction', submitPrediction)
router.post('/checkuserprediction', finduserPrediction)
router.post('/addcorrectanswer', submitCorrectAnswer)
router.post('/comparepredictions', comparePredictions);
router.post('/leaderboardpickem', leaderboardpickem)
router.post('/scoreformanyids', comparePredictionmultiple)
router.post('/getCorrectAnswers', getCorrectAnswers)
router.post('/maxscore',calculateMaxPoints)
router.post('/teamHOF', teamHOF)
router.post('/teams/:league', findteamHOF)
router.post('/leagues/list', findleagueHOF)
router.post('/leagues', leagueHOF)
router.post('/myrankpickem', getUserPickemScore)
router.post('/create', async (req, res) => {
  try {
    const match = new BanPickValo({
      ...req.body,
      id: Math.random().toString(36).substr(2, 9),
      currentTurn: "team1"
    });
    await match.save();
    res.status(201).json(match);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/action', async (req, res) => {
  try {
    const match = await BanPickValo.findOne({ id: req.body.matchId });
    if (!match) return res.status(404).json({ error: "Match not found" });

    // Process action logic
    if (req.body.action === "ban") await processBan(match, req.body);
    if (req.body.action === "pick") await processPick(match, req.body);
    if (req.body.action === "side") await processSide(match, req.body);

    await match.save();
    res.json(match);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.post('/status', async (req, res) => {
  try {
    console.log('Request body:', req.body); // Debug incoming request
    const match = await BanPickValo.findOne({ id: req.body.matchId }).lean();
    
    if (!match) {
      console.log(`Không tìm thấy match với ID: ${req.body.matchId}`);
      return res.status(404).json({ 
        error: "Match not found",
        receivedId: req.body.matchId,
        storedIds: await BanPickValo.distinct('id') 
      });
    }

    console.log('Found match:', match); // Debug kết quả tìm được
    res.json(match);
  } catch (error) {
    console.error('Lỗi truy vấn database:', error);
    res.status(500).json({ error: error.message });
  }
});
// Hàm hỗ trợ
function calculateRemainingBans(match) {
  const requiredBans = {
    BO1: 4,
    BO3: 2,
    BO5: 1
  }[match.matchType];
  
  return Math.max(0, requiredBans - match.maps.banned.length);
}

function getNextAction(match) {
  if (match.currentPhase === 'completed') return 'Match completed';
  
  const actions = {
    ban: `Waiting for ${match.currentTurn} to ban map`,
    pick: `Waiting for ${match.currentTurn} to pick map`,
    side: `Waiting for side selection`
  };
  
  return actions[match.currentPhase] || 'Unknown status';
}
// Helper functions for action processing
async function processBan(match, { map }) {
  if (match.currentPhase !== "ban") throw new Error("Invalid phase for ban");
  if (!match.maps.pool.includes(map)) throw new Error("Map not available");
  
  match.maps.banned.push(map);
  match.maps.pool = match.maps.pool.filter(m => m !== map);
  match.currentTurn = match.currentTurn === "team1" ? "team2" : "team1";
  
  checkBanCompletion(match);
}
async function processPick(match, { map }) {
  if (match.currentPhase !== 'pick') {
    throw new Error('Invalid phase for picking');
  }

  if (!match.maps.pool.includes(map)) {
    throw new Error('Map not available for picking');
  }

  // Thêm map vào danh sách đã pick
  match.maps.picked.push(map);
  match.maps.pool = match.maps.pool.filter(m => m !== map);

  // Xử lý logic pick theo loại match
  const pickRequirements = {
    BO1: 1,
    BO3: 2,
    BO5: 3
  }[match.matchType];

  // Chuyển lượt pick
  match.currentTurn = match.currentTurn === 'team1' ? 'team2' : 'team1';

  // Kiểm tra đã pick đủ map chưa
  if (match.maps.picked.length >= pickRequirements) {
    // Chuyển map đã pick thành map được chọn chính thức
    match.maps.selected = [...match.maps.picked];
    match.maps.picked = [];
    
    // Chuyển sang phase chọn side
    match.currentPhase = 'side';
    
    // Khởi tạo danh sách sides cho từng map
    match.sides = match.maps.selected.map(map => ({
      map,
      team1: null,
      team2: null
    }));
  }

  // Xử lý lượt pick đặc biệt cho BO3
  if (match.matchType === 'BO3' && match.maps.picked.length === 1) {
    // Ở BO3, lượt pick thứ 2 thuộc về đội còn lại
    match.currentTurn = match.currentTurn === 'team1' ? 'team2' : 'team1';
  }
}
function checkBanCompletion(match) {
  const requiredBans = { BO1: 4, BO3: 2, BO5: 1 }[match.matchType];
  if (match.maps.banned.length >= requiredBans) {
    match.currentPhase = "pick";
    match.currentTurn = "team1";
  }
}
async function processSide(match, { map, side }) {
  if (match.currentPhase !== 'side') {
    throw new Error('Invalid phase for side selection');
  }

  // Kiểm tra map có trong danh sách selected không
  if (!match.maps.selected.includes(map)) {
    throw new Error('Map not in selected maps');
  }

  // Tìm side configuration cho map
  const mapSide = match.sides.find(s => s.map === map);
  
  if (!mapSide) {
    throw new Error('Map side configuration not found');
  }

  // Xác định team đang chọn side
  const team = match.currentTurn;
  
  // Validate role
  if (!['team1', 'team2'].includes(team)) {
    throw new Error('Invalid team for side selection');
  }

  // Cập nhật side cho đội hiện tại
  if (team === 'team1') {
    mapSide.team1 = side;
    // Đội 2 sẽ tự động nhận side ngược lại
    mapSide.team2 = side === 'Attacker' ? 'Defender' : 'Attacker';
  } else {
    mapSide.team2 = side;
    // Đội 1 sẽ tự động nhận side ngược lại
    mapSide.team1 = side === 'Attacker' ? 'Defender' : 'Attacker';
  }

  // Chuyển lượt chọn sang đội tiếp theo
  match.currentTurn = team === 'team1' ? 'team2' : 'team1';

  // Kiểm tra đã chọn hết tất cả sides chưa
  const allSidesSelected = match.sides.every(s => 
    s.team1 !== null && s.team2 !== null
  );

  if (allSidesSelected) {
    match.currentPhase = 'completed';
  }
}
router.post('/powerrankingaov', async (req, res) => {
    try {
      // Truy vấn tất cả dữ liệu trong collection PowerRankingAOV
      const rankings = await PowerRankingAOV.find().sort({ points: -1 }); // Sắp xếp theo điểm giảm dần

      return res.status(200).json({
        message: 'Lấy bảng xếp hạng thành công!',
        data: rankings,
      });
    } catch (error) {
      console.error('Lỗi khi lấy bảng xếp hạng:', error);
      return res.status(500).json({ message: 'Lỗi server!', error: error.message });
    }
  });
  router.post('/addpowerrankingaov', async (req, res) => {
    try {
      // Lấy danh sách đội từ TeamRegister có game là 'Liên Quân Mobile'
      const teams = await TeamRegister.find({ games: 'Liên Quân Mobile' });
  
      if (!teams.length) {
        return res.status(404).json({ message: 'Không tìm thấy đội Liên Quân Mobile nào!' });
      }
  
      // Lấy tất cả dữ liệu bảng xếp hạng hiện có
      const existingRankings = await PowerRankingAOV.find({});
      const existingTeamNames = existingRankings.map(rank => rank.teamName);
  
      // Kiểm tra nếu collection rỗng, thêm toàn bộ danh sách đội từ TeamRegister
      if (!existingRankings.length) {
        const initialRankingData = teams.map(team => ({
          teamName: team.teamName,
          teamLogo: team.logoUrl,
          points: 500, // Điểm mặc định cho đội mới
        }));
  
        await PowerRankingAOV.insertMany(initialRankingData);
  
        return res.status(201).json({
          message: 'Đã thêm toàn bộ danh sách đội vào bảng xếp hạng!',
          teamsAdded: initialRankingData,
        });
      }
  
      // Kiểm tra JSON body, nếu rỗng thì chỉ cập nhật lại tên và logo đội
      if (Object.keys(req.body).length === 0) {
        for (const team of teams) {
          await PowerRankingAOV.updateOne(
            { teamName: team.teamName }, // Điều kiện tìm kiếm
            { $set: { teamName: team.teamName, teamLogo: team.logoUrl } } // Chỉ cập nhật tên và logo
          );
        }
        return res.status(200).json({ message: 'Đã cập nhật lại tên và logo đội thành công!' });
      }
  
      // Thêm các đội mới từ TeamRegister chưa có trong bảng xếp hạng
      const newTeams = teams.filter(team => !existingTeamNames.includes(team.teamName));
  
      const newRankingData = newTeams.map(team => ({
        teamName: team.teamName,
        teamLogo: team.logoUrl, // Logo đội
        points: 500, // Điểm mặc định cho đội mới
      }));
  
      // Chỉ thêm đội mới vào collection
      if (newRankingData.length > 0) {
        await PowerRankingAOV.insertMany(newRankingData);
      }
  
      return res.status(201).json({
        message: 'Cập nhật bảng xếp hạng thành công!',
        newTeamsAdded: newRankingData,
      });
    } catch (error) {
      console.error('Lỗi khi tạo/cập nhật bảng xếp hạng:', error);
      return res.status(500).json({ message: 'Lỗi server!', error: error.message });
    }
  });
  
  
router.post('/upsertquestionsWithDynamicLogo', async (req, res) => {
    try {
        const { questions } = req.body;

        if (!Array.isArray(questions)) {
            return res.status(400).json({ error: 'Invalid input. Please provide an array of questions.' });
        }

        // Default profile picture if no matching user found
        const defaultProfilePic = '1wRTVjigKJEXt8iZEKnBX5_2jG7Ud3G-L';

        for (const question of questions) {
            if (!question.id || !question.question || !question.maxChoose || !question.timelock || !question.type) {
                return res.status(400).json({
                    error: 'Invalid input. Please provide all required fields (id, question, maxChoose, type, and options).'
                });
            }

            // If options are empty, populate them from gameMembers for "Liên Quân Mobile" only
            const optionsWithDynamicLogo = question.options && question.options.length > 0
                ? question.options
                : await TeamRegister.find({ games: "Liên Quân Mobile" }).then(async (teams) =>
                    Promise.all(
                        teams.flatMap(async (team) => {
                            const memberOptions = await Promise.all(
                                Array.from(team.gameMembers.get("Liên Quân Mobile") || []).map(async (member) => {
                                    const user = await User.findOne({ garenaaccount: member });
                                    return {
                                        name: member, // Use member name from gameMembers
                                        logo: user ? user.profilePicture : defaultProfilePic // Use profilePicture or default
                                    };
                                })
                            );
                            return memberOptions;
                        })
                    )
                );

            await QuestionPickem.findOneAndUpdate(
                { id: question.id },
                {
                    timelock: question.timelock,
                    question: question.question,
                    maxChoose: question.maxChoose,
                    type: question.type,
                    options: optionsWithDynamicLogo.flat() // Flatten the array to include all members as individual options
                },
                { upsert: true, new: true }
            );
        }

        res.status(201).json({ message: 'Questions added/updated successfully!' });
    } catch (error) {
        console.error('Error adding/updating questions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/rankpointchange', async (req, res) => {
    try {
      const { idmatch } = req.body; // ID của trận đấu mới được thêm
  
      // Lấy thông tin trận đấu
      const match = await Match.findOne({ idmatch });
      if (!match) {
        return res.status(404).json({ message: "Match not found!" });
      }
  
      const { teamA, teamB, scoreteamA, scoreteamB } = match;
  
      // Lấy bảng xếp hạng hiện tại
      const rankings = await PowerRankingAOV.find().sort({ points: -1 });
  
      // Tìm thứ hạng của teamA và teamB
      const rankTeamA = rankings.findIndex(team => team.teamName === teamA);
      const rankTeamB = rankings.findIndex(team => team.teamName === teamB);
  
      if (rankTeamA === -1 || rankTeamB === -1) {
        return res.status(404).json({ message: "Teams not found in ranking!" });
      }
  
      const teamAData = rankings[rankTeamA];
      const teamBData = rankings[rankTeamB];
  
      // Tính toán khoảng cách thứ hạng
      const rankGap = Math.abs(rankTeamA - rankTeamB);
  
      let teamAGain = 0, teamBLoss = 0;
  
      // Logic cộng/trừ điểm
      if (scoreteamA > scoreteamB) { // teamA thắng
        if (rankTeamA > rankTeamB) {
          teamAGain = 50 + rankGap * 10; // Cộng nhiều điểm nếu thắng đội xếp cao hơn
          teamBLoss = 50 + rankGap * 10; // Trừ nhiều điểm
        } else {
          teamAGain = 20 + rankGap * 5; // Cộng ít điểm nếu thắng đội xếp thấp hơn
          teamBLoss = 20 + rankGap * 5; // Trừ ít điểm
        }
      } else if (scoreteamB > scoreteamA) { // teamB thắng
        if (rankTeamB > rankTeamA) {
          teamAGain = 50 + rankGap * 10;
          teamBLoss = 50 + rankGap * 10;
        } else {
          teamAGain = 20 + rankGap * 5;
          teamBLoss = 20 + rankGap * 5;
        }
      }
  
      // Update điểm cho teamA và teamB
      await PowerRankingAOV.updateOne(
        { teamName: teamA },
        { $inc: { points: teamAGain } }
      );
  
      await PowerRankingAOV.updateOne(
        { teamName: teamB },
        { $inc: { points: -teamBLoss } }
      );
  
      return res.status(200).json({
        message: "Ranking points updated successfully!",
        teamA: { name: teamA, pointsGained: teamAGain },
        teamB: { name: teamB, pointsLost: teamBLoss },
      });
    } catch (error) {
      console.error("Error updating rankings:", error);
      return res.status(500).json({ error: "Server error occurred!" });
    }
  });
router.post('/fetchplayerprofiles', async (req, res) => {
    try {
        const { players } = req.body; // Lấy danh sách các IGN từ request body
        const playerProfiles = await Promise.all(players.map(async (player) => {
            const user = await User.findOne({ garenaaccount: player });

            if (user) {
                return {
                    name: user.garenaaccount,
                    avatar: user.profilePicture,
                };
            }
            // Trả về thông tin mặc định nếu không tìm thấy người dùng
            return {
                name: player,
                avatar: '1wRTVjigKJEXt8iZEKnBX5_2jG7Ud3G-L', // Đường dẫn hoặc URL đến hình ảnh mặc định
            };
        }));

        res.status(200).json(playerProfiles);
    } catch (error) {
        console.error('Error fetching player profiles:', error);
        res.status(500).json({ error: 'Failed to fetch player profiles' });
    }
});
// Route để thêm mới trận đấu
router.post('/addmatchdetail', async (req, res) => {
  try {
    // Thêm trận đấu vào database
    const match = new Match(req.body);
    await match.save();

    const { teamA, teamB, scoreteamA, scoreteamB } = req.body;

    // Lấy bảng xếp hạng hiện tại và sắp xếp theo điểm giảm dần
    const allRankings = await PowerRankingAOV.find().sort({ points: -1 });

    // Tính toán thứ hạng đồng hạng
    let currentRank = 1;
    const rankings = allRankings.map((team, index, array) => {
      if (index > 0 && team.points === array[index - 1].points) {
        team.rank = array[index - 1].rank; // Giữ nguyên thứ hạng cho đội đồng hạng
      } else {
        team.rank = currentRank;
      }
      currentRank++;
      return team;
    });

    // Tìm thứ hạng của teamA và teamB
    const rankTeamA = rankings.findIndex(team => team.teamName === teamA);
    const rankTeamB = rankings.findIndex(team => team.teamName === teamB);

    if (rankTeamA === -1 || rankTeamB === -1) {
      return res.status(404).json({ message: "Teams not found in ranking!" });
    }

    // Tính toán khoảng cách thứ hạng
    const rankGap = Math.abs(rankings[rankTeamA].rank - rankings[rankTeamB].rank);
    const scoreGap = Math.abs(scoreteamA - scoreteamB);
    let teamAGain = 0, teamALoss = 0;
    let teamBGain = 0, teamBLoss = 0;

    // Logic cộng/trừ điểm
    if (scoreteamA > scoreteamB) { // teamA thắng
      if (rankings[rankTeamA].rank > rankings[rankTeamB].rank) {
        teamAGain = 25 + rankGap * 3 + scoreGap;
        teamBLoss = 25 + rankGap * 3 + scoreGap;
      } else if (rankings[rankTeamA].rank < rankings[rankTeamB].rank) {
        teamAGain = 18 + rankGap * 2 + scoreGap;
        teamBLoss = 18 + rankGap * 2 + scoreGap;
      } else {
        teamAGain = 21 + scoreGap;
        teamBLoss = 21 + scoreGap;
      }
    } else if (scoreteamB > scoreteamA) { // teamB thắng
      if (rankings[rankTeamB].rank > rankings[rankTeamA].rank) {
        teamBGain = 25 + rankGap * 3 + scoreGap;
        teamALoss = 25 + rankGap * 3 + scoreGap;
      } else if (rankings[rankTeamB].rank < rankings[rankTeamA].rank) {
        teamBGain = 18 + rankGap * 2 + scoreGap;
        teamALoss = 18 + rankGap * 2 + scoreGap;
      } else {
        teamBGain = 21 + scoreGap;
        teamALoss = 21 + scoreGap;
      }
    }

    // Update điểm số cho teamA và teamB
    if (scoreteamA > scoreteamB) {
      await PowerRankingAOV.updateOne(
        { teamName: teamA },
        { $inc: { points: teamAGain } }
      );
      await PowerRankingAOV.updateOne(
        { teamName: teamB },
        { $inc: { points: -teamBLoss } }
      );
    } else if (scoreteamB > scoreteamA) {
      await PowerRankingAOV.updateOne(
        { teamName: teamB },
        { $inc: { points: teamBGain } }
      );
      await PowerRankingAOV.updateOne(
        { teamName: teamA },
        { $inc: { points: -teamALoss } }
      );
    }

    return res.status(201).json({
      message: "Match added and rankings updated successfully!",
      teamA: { name: teamA, pointsGained: teamAGain || -teamALoss },
      teamB: { name: teamB, pointsGained: teamBGain || -teamBLoss },
    });
  } catch (error) {
    console.error("Error updating match and rankings:", error);
    return res.status(500).json({ error: "Failed to add match or update rankings." });
  }
});



  
router.post('/fetchmatchAOV/:idmatch', async (req, res) => {
    const { idmatch } = req.params; // Lấy `idmatch` từ body của request

    if (!idmatch) {
        return res.status(400).json({ error: "idmatch is required" });
    }

    try {
        const match = await Match.findOne({ idmatch });
        if (!match) {
            return res.status(404).json({ error: "Match not found" });
        }
        res.status(200).json(match);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch match" });
    }
});
// Route để cập nhật thông tin trận đấu
router.post('/updateMatch', async (req, res) => {
    const { idmatch } = req.body; // Giả sử chúng ta sử dụng `idmatch` làm điều kiện cập nhật
    try {
        const updatedMatch = await Match.findOneAndUpdate(
            { idmatch },
            req.body, // Dữ liệu mới từ request
            { new: true, runValidators: true }
        );

        if (!updatedMatch) {
            return res.status(404).json({ error: "Match not found" });
        }

        res.status(200).json({ message: "Match updated successfully", updatedMatch });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: "Failed to update match" });
    }
});



router.post('/register', async (req, res) => {
    try {
        const { teamName, shortName, classTeam, logoUrl, games, gameMembers, usernameregister, discordID,color } = req.body;
        // Check if any member is already registered in another team
        const existingTeam = await TeamRegister.findOne({ gameMembers: { $in: gameMembers } });
        const newTeam = new TeamRegister({
            discordID,
            usernameregister,
            teamName,
            shortName,
            classTeam,
            logoUrl,
            color,
            games,
            gameMembers,
        });

        const savedTeam = await newTeam.save();
        res.status(201).json(savedTeam);
    } catch (error) {
        console.error('Error registering team:', error);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ errors });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/checkregisterAOV', async (req, res) => {
    try {
        const { usernameregister } = req.body;
        const game = "Liên Quân Mobile";
        const existingTeam = await TeamRegister.findOne({ usernameregister, games: { $in: [game] } });

        if (existingTeam) {
            // Nếu tìm thấy đội, trả lại thông tin đội
            return res.status(200).json(existingTeam);
        } 

        // Nếu không tìm thấy đội, trả lại lỗi 404
        return res.status(404).json({ message: 'Team not found' }); 

    } catch (error) {
        // Xử lý lỗi server
        res.status(500).json({ message: 'Server error' });
    }
});
router.post('/checkregisterValorant', async (req, res) => {
  try {
      const { usernameregister } = req.body;
      const game = "Valorant";
      const existingTeam = await TeamRegister.findOne({ usernameregister, games: { $in: [game] } });

      if (existingTeam) {
          // Nếu tìm thấy đội, trả lại thông tin đội
          return res.status(200).json(existingTeam);
      } 

      // Nếu không tìm thấy đội, trả lại lỗi 404
      return res.status(404).json({ message: 'Team not found' }); 

  } catch (error) {
      // Xử lý lỗi server
      res.status(500).json({ message: 'Server error' });
  }
});
router.post('/checkregisterTFT', async (req, res) => {
    try {
        const { usernameregister } = req.body;
        const game = "Teamfight Tactics";
        const existingTeam = await TeamRegister.findOne({ usernameregister, games: { $in: [game] } });

        if (existingTeam) {
            // Nếu tìm thấy đội, trả lại thông tin đội
            return res.status(200).json(existingTeam);
        } 

        // Nếu không tìm thấy đội, trả lại lỗi 404
        return res.status(404).json({ message: 'Team not found' }); 

    } catch (error) {
        // Xử lý lỗi server
        res.status(500).json({ message: 'Server error' });
    }
});
router.post('/allteamAOVcolor', async (req, res) => {
  try {
      const { usernameregister } = req.body;

      // Fetch teams where games include "Liên Quân Mobile"
      const teams = await TeamRegister.find({ games: "Liên Quân Mobile" })
          .select('teamName shortName logoUrl color');

      if (teams.length > 0) {
          // If teams are found, return the relevant information
          return res.status(200).json(teams);
      } else {
          return res.status(404).json({ message: 'No teams found for Liên Quân Mobile' });
      }

  } catch (error) {
      // Handle server errors
      res.status(500).json({ message: 'Server error' });
  }
});


router.post('/upsertquestions', async (req, res) => {
    try {
        const { questions } = req.body;

        if (!Array.isArray(questions)) {
            return res.status(400).json({ error: 'Invalid input. Please provide an array of questions.' });
        }

        for (const question of questions) {
            if (!question.id || !question.question || !question.maxChoose || !question.timelock || !question.type || !question.options) {
                return res.status(400).json({
                    error: 'Invalid input. Please provide all required fields (id, question, maxChoose, type, and options).'
                });
            }

            // Check if options is empty and populate it with teams' names and logos for "Liên Quân Mobile" only
            const optionsWithLogos = question.options.length > 0
                ? await Promise.all(
                    question.options.map(async (option) => {
                        const team = await TeamRegister.findOne({ teamName: option.name });
                        return {
                            name: option.name,
                            logo: team ? team.logoUrl : null // Default to null if no team found
                        };
                    })
                )
                : await TeamRegister.find({ games: "Liên Quân Mobile" }).then((teams) =>
                    teams.map((team) => ({
                        name: team.teamName,
                        logo: team.logoUrl
                    }))
                );

            await QuestionPickem.findOneAndUpdate(
                { id: question.id,category: question.category },
                {
                    timelock: question.timelock,
                    question: question.question,
                    maxChoose: question.maxChoose,
                    type: question.type,
                    options: optionsWithLogos,
                    category:question.category
                },
                { upsert: true, new: true }
            );
        }

        res.status(201).json({ message: 'Questions added/updated successfully!' });
    } catch (error) {
        console.error('Error adding/updating questions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.post('/getquestions', async (req, res) => {
    try {
      const questions = await QuestionPickem.find(); // Fetch all questions
      if (!questions) {
        return res.status(404).json({ message: 'No questions found.' });
      }
      res.status(200).json({ data: questions });
    } catch (error) {
      console.error('Error fetching questions:', error);
      res.status(500).json({ message: 'Server error. Unable to fetch questions.' });
    }
  });
router.post('/findrespond', async (req, res) => {
    const { userId } = req.body;
    const response = await Response.findOne({ userId });
    res.json(response);
});




export default router;
