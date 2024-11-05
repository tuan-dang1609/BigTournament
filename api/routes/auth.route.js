import express from 'express';
import { signin, signup,teamHOF,leagueHOF,findleagueHOF,findteamHOF, signout,getCorrectAnswers,comparePredictionmultiple,calculateMaxPoints,getUserPickemScore,comparePredictions, submitPrediction, submitCorrectAnswer, leaderboardpickem, finduserPrediction, findPlayer, findAllteam, addBanPickVeto, findBanPickVeto, addAllGame, findAllGame, addMatchID, findAllMatchID, findmatchID } from '../controllers/auth.controller.js';
import QuestionPickem from '../models/question.model.js';
import Response from '../models/response.model.js';
import TeamRegister from '../models/registergame.model.js'
import Match from '../models/match.model.js';
import User from '../models/user.model.js';
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
router.post('/findallteamAOV', findAllteam)
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
        const match = new Match(req.body); // Lấy dữ liệu từ body request
        await match.save();
        res.status(201).json({ message: "Match added successfully", match });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: "Failed to add match" });
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

        if (!teamName || !shortName || !classTeam || !logoUrl || !games || !gameMembers||!color) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if any member is already registered in another team
        const existingTeam = await TeamRegister.findOne({ gameMembers: { $in: gameMembers } });

        if (existingTeam) {
            // Find the conflicting member(s)
            const conflictingMembers = existingTeam.gameMembers.filter(member => gameMembers.includes(member));
            return res.status(400).json({ message: `${conflictingMembers.join(', ')} đã được đăng ký ở đội khác` });
        }

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
        const game = ["Arena Of Valor"];
        const existingTeam = await TeamRegister.findOne({ usernameregister,game });

        if (existingTeam) {
            // If the team is found, return the team information
            return res.status(200).json(existingTeam);
        } 

    } catch (error) {
        // Handle server errors
        res.status(500).json({ message: 'Server error' });
    }
});
router.post('/checkregisterTFT', async (req, res) => {
    try {
        const { usernameregister } = req.body;
        const game = ["Teamfight Tactics"];
        const existingTeam = await TeamRegister.findOne({ usernameregister,game });

        if (existingTeam) {
            // If the team is found, return the team information
            return res.status(200).json(existingTeam);
        } 

    } catch (error) {
        // Handle server errors
        res.status(500).json({ message: 'Server error' });
    }
});
router.post('/checkregisterTFT', async (req, res) => {
    try {
        const { usernameregister } = req.body;
        const game = ["Teamfight Tactics"];
        const existingTeam = await TeamRegister.findOne({ usernameregister,game });

        if (existingTeam) {
            // If the team is found, return the team information
            return res.status(200).json(existingTeam);
        } 

    } catch (error) {
        // Handle server errors
        res.status(500).json({ message: 'Server error' });
    }
});
router.post('/allteamAOVcolor', async (req, res) => {
    try {
        const { usernameregister } = req.body;

        // Fetch only teamName, logoUrl, and color fields
        const teams = await TeamRegister.find().select('teamName shortName logoUrl color');

        if (teams.length > 0) {
            // If teams are found, return the relevant information
            return res.status(200).json(teams);
        } else {
            return res.status(404).json({ message: 'No teams found' });
        }

    } catch (error) {
        // Handle server errors
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/upsertquestions', async (req, res) => {
    try {
        const { questions } = req.body;

        // Validate that questions is an array
        if (!Array.isArray(questions)) {
            return res.status(400).json({ error: 'Invalid input. Please provide an array of questions.' });
        }

        for (const question of questions) {
            if (!question.id || !question.question || !question.maxChoose|| !question.timelock  || !question.type || !question.options || !Array.isArray(question.options)) {
                return res.status(400).json({
                    error: 'Invalid input. Please provide all required fields (id, question, maxChoose, type, and options).'
                });
            }
            // Upsert the question: Update if it exists, otherwise insert a new one
            await QuestionPickem.findOneAndUpdate(
                { id: question.id }, // Search by question id
                {   
                    timelock: question.timelock,
                    question: question.question, 
                    maxChoose: question.maxChoose, 
                    type: question.type, 
                    options: question.options 
                },
                { upsert: true, new: true } // Upsert: Insert if not found
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
