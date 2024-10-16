import express from 'express';
import { signin, signup, signout, comparePredictions, submitPrediction, submitCorrectAnswer, leaderboardpickem, finduserPrediction, findPlayer, findAllteam, addBanPickVeto, findBanPickVeto, addAllGame, findAllGame, addMatchID, findAllMatchID, findmatchID } from '../controllers/auth.controller.js';
import QuestionPickem from '../models/question.model.js';
import Response from '../models/response.model.js';
import TeamRegister from '../models/registergame.model.js'
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
router.post('/registerAOV', async (req, res) => {
    try {
        const { teamName, shortName, classTeam, logoUrl, games, gameMembers, usernameregister, discordID } = req.body;

        if (!teamName || !shortName || !classTeam || !logoUrl || !games || !gameMembers) {
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

        const existingTeam = await TeamRegister.findOne({ usernameregister });

        if (existingTeam) {
            // If the team is found, return the team information
            return res.status(200).json(existingTeam);
        } else {
            // If the team is not found, return an error message
            return res.status(404).json({ message: 'Could not find your registration form.' });
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
            if (!question.id || !question.question || !question.maxChoose || !question.type || !question.options || !Array.isArray(question.options)) {
                return res.status(400).json({
                    error: 'Invalid input. Please provide all required fields (id, question, maxChoose, type, and options).'
                });
            }

            // Check if type is "multiple"
            if (question.type !== 'multiple') {
                return res.status(400).json({
                    error: `Invalid input. Question type must be 'multiple'. Error in question id: ${question.id}`
                });
            }

            // Validate each option
            for (const option of question.options) {
                if (!option.name || !option.logo) {
                    return res.status(400).json({
                        error: `Invalid input. Each option must have a name and a logo. Error in question id: ${question.id}`
                    });
                }
            }

            // Upsert the question: Update if it exists, otherwise insert a new one
            await QuestionPickem.findOneAndUpdate(
                { id: question.id }, // Search by question id
                { 
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
