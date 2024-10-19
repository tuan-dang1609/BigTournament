import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import { errorHandler } from '../utils/error.js';
import jwt from 'jsonwebtoken';
import BanPick from '../models/veto.model.js';
import AllGame from '../models/allgame.model.js';
import MatchID from '../models/matchid.model.js';
import TeamRegister from '../models/registergame.model.js'
import PredictionPickem from '../models/response.model.js';
import CorrectAnswersSubmit from '../models/correctanswer.model.js';
import AllUserScore from '../models/alluserscore.model.js';
import Queue from 'bull';
import StaticTeam from '../models/bracket.model.js';
const scoreQueue = new Queue('score-processing');

let shuffledOnce = false;  // Đảm bảo chỉ xáo 1 lần duy nhất

export const ProcessSwissStage = async (req, res) => {
  try {
    // Kiểm tra nếu các trận đấu đã tồn tại cho vòng 1-0, 0-1 và 1-1
    const round10Matches = await StaticTeam.find({ round: '1-0' });
    const round01Matches = await StaticTeam.find({ round: '0-1' });
    const round11MatchesExisting = await StaticTeam.find({ round: '1-1' });

    // Nếu đã có các trận đấu cho 1-0, 0-1 và 1-1, không cần tạo lại
    if (round10Matches.length > 0 && round01Matches.length > 0 && round11MatchesExisting.length > 0) {
      return res.status(200).json({ message: 'Swiss stage already processed for this round' });
    }

    const winners = [];
    const losers = [];

    // Lấy các trận đấu từ round 0-0
    const round00Matches = await StaticTeam.find({ round: '0-0' });

    if (!round00Matches.length) {
      return res.status(404).json({ message: 'No matches found in round 0-0' });
    }

    // Phân loại đội thắng và thua từ round 0-0
    round00Matches.forEach(match => {
      if (match.scoreA > match.scoreB) {
        winners.push(match.teamA);
        losers.push(match.teamB);
      } else if (match.scoreA < match.scoreB) {
        winners.push(match.teamB);
        losers.push(match.teamA);
      }
    });

    // Shuffle đội thắng và thua
    shuffleArray(winners);
    shuffleArray(losers);

    // Tạo cặp đấu cho 1-0 và 0-1 nếu chưa có
    if (round10Matches.length === 0) {
      const winnerMatches = createSwissPairs(winners, '1-0');
      await Promise.all(winnerMatches.map(match => AddBracketSwiss(match)));
    }

    if (round01Matches.length === 0) {
      const loserMatches = createSwissPairs(losers, '0-1');
      await Promise.all(loserMatches.map(match => AddBracketSwiss(match)));
    }

    // Xử lý tiếp các round "1-0" và "0-1" để tạo nhánh 1-1
    const subsequentRoundsResult = await processSubsequentRounds();

    res.status(200).json({
      message: 'Swiss stage processed successfully',
      playoffTeams: subsequentRoundsResult.playoffTeams,
      eliminatedTeams: subsequentRoundsResult.eliminatedTeams,
      round11Matches: subsequentRoundsResult.round11Matches
    });

  } catch (error) {
    console.error('Error processing Swiss stage:', error);
    res.status(500).json({ error: 'Failed to process Swiss stage' });
  }
};

// Function to process 1-0 and 0-1 rounds and generate playoff and 1-1 matches
const processSubsequentRounds = async () => {
  try {
    const round10Matches = await StaticTeam.find({ round: '1-0' });
    const round01Matches = await StaticTeam.find({ round: '0-1' });
    const round11MatchesExisting = await StaticTeam.find({ round: '1-1' });

    if (round11MatchesExisting.length > 0) {
      return {
        playoffTeams: [],
        eliminatedTeams: [],
        round11Matches: round11MatchesExisting
      };
    }

    const playoffTeams = [];
    const moveToRound11 = [];
    const eliminatedTeams = [];

    // Xử lý các đội thắng/thua ở round 1-0
    round10Matches.forEach(match => {
      if (match.scoreA > match.scoreB) {
        playoffTeams.push(match.teamA);
        moveToRound11.push(match.teamB);
      } else if (match.scoreA < match.scoreB) {
        playoffTeams.push(match.teamB);
        moveToRound11.push(match.teamA);
      }
    });

    // Xử lý các đội thắng/thua ở round 0-1
    round01Matches.forEach(match => {
      if (match.scoreA > match.scoreB) {
        moveToRound11.push(match.teamA);
        eliminatedTeams.push(match.teamB);
      } else if (match.scoreA < match.scoreB) {
        moveToRound11.push(match.teamB);
        eliminatedTeams.push(match.teamA);
      }
    });

    shuffleArray(moveToRound11);
    const round11Matches = createSwissPairs(moveToRound11, '1-1');

    await Promise.all(round11Matches.map(match => AddBracketSwiss(match)));

    return {
      playoffTeams,
      eliminatedTeams,
      round11Matches
    };
  } catch (error) {
    console.error('Error processing subsequent rounds:', error);
    throw error;
  }
};


// Hàm xáo trộn đội
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

// Hàm tạo cặp đấu từ danh sách đội
const createSwissPairs = (teams, round) => {
  const matches = [];
  for (let i = 0; i < teams.length; i += 2) {
    if (teams[i + 1]) {
      const matchID = `match_${round}_${i / 2}`;
      matches.push({
        teamA: teams[i],
        scoreA: 0,  // Điểm mặc định
        teamB: teams[i + 1],
        scoreB: 0,  // Điểm mặc định
        matchID,
        round
      });
    }
  }
  return matches;
};

export const AddBracketSwiss = async (match) => {
  const { teamA, scoreA, teamB, scoreB, matchID, round } = match;  // Truyền trực tiếp từ match object

  if (!teamA || !teamB) {
    console.error('Missing team data:', match);  // In ra lỗi nếu thiếu dữ liệu
    throw new Error('Missing team data');
  }

  const newTeam = new StaticTeam({
    teamA,
    scoreA,
    teamB,
    scoreB,
    matchID,
    round
  });

  try {
    await newTeam.save();
    return newTeam;
  } catch (error) {
    console.error('Failed to create team:', error);
    throw new Error('Failed to create team');
  }
};
export const AddBracketSwiss2 = async (req, res) => {
  const { teamA, scoreA, teamB, scoreB, matchID, round } = req.body;

  const newTeam = new StaticTeam({
    teamA,
    scoreA,
    teamB,
    scoreB,
    matchID,
    round
  });

  try {
    await newTeam.save();
    res.status(201).json(newTeam);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create team' });
  }
};
export const FindBracketSwiss = async (req, res) => {
  try {
    const teams = await StaticTeam.find(); 
    res.status(200).json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
};

export const signup = async (req, res, next) => {
  const { riotID, username, password, discordID } = req.body;
  try {
    const hashedPassword = bcryptjs.hashSync(password, 10);
    const newUser = new User({ riotID, username, discordID, password: hashedPassword });

    await newUser.save();
    res.status(201).json({ message: 'Tạo tài khoản thành công' });
  } catch (error) {
    return next(errorHandler(500, 'Tạo tài khoản thất bại'));
  }
};
export const comparePredictions = async (req, res) => {
  try {
    const { userId } = req.body;  // Expecting userId in the request body

    // Fetch the user's predictions by userId
    const userPrediction = await PredictionPickem.findOne({ userId });
    if (!userPrediction) {
      return res.status(404).json({ message: 'User prediction not found' });
    }

    // Fetch the correct answers
    const correctAnswers = await CorrectAnswersSubmit.findOne();
    if (!correctAnswers) {
      return res.status(404).json({ message: 'Correct answers not found' });
    }

    // Initialize counters
    let totalCorrectChoices = 0;
    let totalPossibleChoices = 0;
    let totalPoints = 0;
    let detailedResults = [];

    // Point system based on questionId
    const pointSystem = {
      3: 5,   // Question 3 is worth 5 points per correct answer
      4: 20,  // Question 4 is worth 20 points per correct answer
      5: 8    // Question 5 is worth 8 points per correct answer
    };

    // Iterate over the user's predictions
    userPrediction.answers.forEach((userAnswer) => {
      // Find the corresponding correct answer for the same questionId
      const correctAnswer = correctAnswers.answers.find(
        (ans) => ans.questionId === userAnswer.questionId
      );

      if (correctAnswer) {
        // Count how many teams the user got right
        let correctChoicesForQuestion = 0;
        correctAnswer.correctTeams.forEach((correctTeam) => {
          if (userAnswer.selectedTeams.includes(correctTeam)) {
            correctChoicesForQuestion += 1;
          }
        });

        // Calculate points for this question
        const pointsForQuestion = correctChoicesForQuestion * (pointSystem[userAnswer.questionId] || 0);
        totalPoints += pointsForQuestion;

        // Add detailed result for the question
        detailedResults.push({
          questionId: userAnswer.questionId,
          correctChoices: correctChoicesForQuestion,
          totalChoices: correctAnswer.correctTeams.length,
          pointsForQuestion
        });

        // Increment the total counts
        totalCorrectChoices += correctChoicesForQuestion;
        totalPossibleChoices += correctAnswer.correctTeams.length;
      }
    });

    // Save the total score to AllUserScore collection
    await AllUserScore.findOneAndUpdate(
      { userID: userId },  // Find by userId
      { userID: userId, totalScore: totalPoints },  // Update or set the totalScore
      { upsert: true, new: true }  // Create a new document if not found, return the updated document
    );

    // Return the detailed result and the total number of correct answers and points
    res.status(200).json({
      message: `User got ${totalCorrectChoices} out of ${totalPossibleChoices} choices correct and earned ${totalPoints} points.`,
      totalCorrectChoices,
      totalPossibleChoices,
      totalPoints,
      detailedResults
    });
  } catch (error) {
    console.error('Error comparing predictions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const submitPrediction = async (req, res) => {
  try {
    const { userId, answers } = req.body;

    // Validate request body
    if (!userId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid input. Please provide userId and answers.' });
    }

    // Find the user's prediction or create new one
    const existingPrediction = await PredictionPickem.findOne({ userId });
    
    if (existingPrediction) {
      answers.forEach((newAnswer) => {
        const existingAnswerIndex = existingPrediction.answers.findIndex(
          (answer) => answer.questionId === newAnswer.questionId
        );
        if (existingAnswerIndex !== -1) {
          existingPrediction.answers[existingAnswerIndex].selectedTeams = newAnswer.selectedTeams;
        } else {
          existingPrediction.answers.push(newAnswer);
        }
      });
      await existingPrediction.save();
    } else {
      const newPrediction = new PredictionPickem({ userId, answers });
      await newPrediction.save();
    }

    // After saving, push the task to Bull queue for background processing
    scoreQueue.add({ userId, answers });

    res.status(200).json({ success: true, message: 'Prediction submitted and processing in the background.' });
  } catch (error) {
    console.error('Error submitting prediction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const leaderboardpickem = async (req, res) => {
  try {
    // Fetch the leaderboard data sorted by totalScore
    const leaderboardEntries = await AllUserScore.find({})
      .sort({ totalScore: -1 })  // Sort by totalScore in descending order

    // Create an array to hold the enriched leaderboard data
    const enrichedLeaderboard = await Promise.all(
      leaderboardEntries.map(async (entry) => {
        // Fetch the corresponding user data
        const user = await User.findOne({ _id: entry.userID });
        if (user) {
          return {
            name: user.username,           // User's name
            avatar: user.profilePicture,   // User's profile picture
            score: entry.totalScore        // User's score
          };
        } else {
          return null;  // Handle case where user is not found (optional)
        }
      })
    );

    // Filter out any null values (in case any user wasn't found)
    const filteredLeaderboard = enrichedLeaderboard.filter(entry => entry !== null);

    // Send the enriched leaderboard data as the response
    res.status(200).json({
      message: 'Leaderboard fetched successfully!',
      leaderboard: filteredLeaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
export const getUserPickemScore = async (req, res) => {
  try {
    const { userID } = req.body; // Assuming you're sending the userId in the request body

    // Find the user's score in the AllUserScore collection
    const userScoreEntry = await AllUserScore.findOne({ userID: userID });

    if (!userScoreEntry) {
      return res.status(404).json({ message: "User score not found" });
    }

    // Find the user's details in the User collection
    const user = await User.findOne({ _id: userID });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare the response data
    const userData = {
      name: user.username,          // User's name
      avatar: user.profilePicture,  // User's profile picture
      score: userScoreEntry.totalScore // User's total score
    };

    // Send the user's data as the response
    res.status(200).json({
      message: "User score and image fetched successfully!",
      userData: userData
    });
  } catch (error) {
    console.error('Error fetching user score:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const submitCorrectAnswer = async (req, res) => {
  try {
    const { answers } = req.body;

    // Validate the input
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid input. Please provide an array of answers.' });
    }

    // Loop through each answer and update/add correct answers for each question
    for (const answer of answers) {
      const { questionId, correctTeams } = answer;

      if (!questionId || !correctTeams || !Array.isArray(correctTeams)) {
        return res.status(400).json({ error: `Invalid input for questionId: ${questionId}. Please provide questionId and correctTeams.` });
      }

      // Check if the document with the correct answers exists
      const existingDocument = await CorrectAnswersSubmit.findOne({
        'answers.questionId': questionId
      });

      if (existingDocument) {
        // Update the correctTeams for the existing questionId
        await CorrectAnswersSubmit.updateOne(
          { 'answers.questionId': questionId },
          { $set: { 'answers.$.correctTeams': correctTeams } }
        );
      } else {
        // If questionId doesn't exist, push a new answer into the answers array
        await CorrectAnswersSubmit.updateOne(
          {}, // You may want to target a specific document if needed
          { $push: { answers: { questionId, correctTeams } } },
          { upsert: true } // Create the document if it doesn't exist
        );
      }
    }

    // Fetch the updated correct answers
    const updatedCorrectAnswers = await CorrectAnswersSubmit.findOne();

    // Fetch all user predictions
    const allPredictions = await PredictionPickem.find();

    // Recalculate the score for each user based on the updated correct answers
    const pointSystem = {
      3: 5,   // Question 3 is worth 5 points per correct answer
      4: 20,  // Question 4 is worth 20 points per correct answer
      5: 8    // Question 5 is worth 8 points per correct answer
    };

    for (const prediction of allPredictions) {
      let totalPoints = 0;

      // Calculate points for each user's predictions
      prediction.answers.forEach((userAnswer) => {
        const correctAnswer = updatedCorrectAnswers.answers.find(
          (ans) => ans.questionId === userAnswer.questionId
        );

        if (correctAnswer) {
          let correctChoicesForQuestion = 0;
          correctAnswer.correctTeams.forEach((correctTeam) => {
            if (userAnswer.selectedTeams.includes(correctTeam)) {
              correctChoicesForQuestion += 1;
            }
          });

          const pointsForQuestion = correctChoicesForQuestion * (pointSystem[userAnswer.questionId] || 0);
          totalPoints += pointsForQuestion;
        }
      });

      // Update the user's total score in the AllUserScore collection
      await AllUserScore.findOneAndUpdate(
        { userID: prediction.userId },  // Find by userId
        { userID: prediction.userId, totalScore: totalPoints },  // Update the score
        { upsert: true, new: true }  // Create if not found
      );
    }

    res.status(201).json({ message: 'Correct answers added/updated and user scores recalculated successfully!' });
  } catch (error) {
    console.error('Error adding/updating correct answers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const finduserPrediction = async (req, res) => {
  try {
    const { userId } = req.body;

    // Find prediction by userId
    const prediction = await PredictionPickem.findOne({ userId });

    if (prediction) {
      return res.status(200).json({ message: 'Prediction found', data: prediction });
    } else {
      return res.status(404).json({ message: 'No prediction found for this user' });
    }
  } catch (error) {
    console.error('Error checking prediction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const addAllGame = async (req,res,next) => {
  const { url,game,image,description,badges } = req.body;
  try{
    const existingGame = await AllGame.findOne({game})
    if (existingGame){
      existingGame.url = url;
      existingGame.game = game;
      existingGame.image = image;
      existingGame.description = description;
      existingGame.badges = badges;
      await existingGame.save();
      res.status(200).json({ message: 'Game updated successfully' });
    }else{
      const newGame = new AllGame({
        url,game,image,description,badges
      });
      await newGame.save()
      res.status(201).json({message:"Game added succesfully"})
    }
  }catch(error){
    next(error)
  }
}

export const addMatchID = async (req, res, next) => {
  try {
    const { matchid, teamA, teamB, round,Match} = req.body;

    // Check if the required fields are provided
    if (!matchid || !teamA || !teamB || !round||!Match) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find if the matchid already exists
    let match = await MatchID.findOne({ matchid });

    if (match) {
      // Update the existing match details
      match.teamA = teamA;
      match.teamB = teamB;
      match.round = round;
      match.Match = Match;
      await match.save();
      return res.status(200).json({ message: "MatchID updated successfully" });
    } else {
      // Create a new match ID entry
      const newMatchId = new MatchID({ matchid, teamA, teamB, round,Match});
      await newMatchId.save();
      return res.status(201).json({ message: "MatchID added successfully" });
    }
  } catch (error) {
    // Handle errors properly
    return next(error);
  }
};
export const findAllMatchID = async (req, res, next) => {
  try {
    const allGame = await MatchID.find();

    if (!allGame || allGame.length === 0) {
      return next(errorHandler(404, 'No Game found'));
    }

    res.status(200).json(allGame);
  } catch (error) {
    next(error);
  }
};
export const findAllteam = async (req, res, next) => {
  try {
    const allTeam = await TeamRegister.find();

    if (!allTeam || allTeam.length === 0) {
      return next(errorHandler(404, 'No Game found'));
    }

    res.status(200).json(allTeam);
  } catch (error) {
    next(error);
  }
};

export const findmatchID = async (req, res, next) => {
  const { round, Match } = req.body
  try {
    const allGame = await MatchID.findOne({round, Match });

    if (!allGame || allGame.length === 0) {
      return next(errorHandler(404, 'No Game found'));
    }

    res.status(200).json(allGame);
  } catch (error) {
    next(error);
  }
};

export const findAllGame = async (req, res, next) => {
  try {
    const allGame = await AllGame.find();

    if (allGame.length === 0) {
      return next(errorHandler(404, 'No Game found'));
    }

    res.status(200).json(allGame);
  } catch (error) {
    next(error);
  }
};
export const addBanPickVeto = async (req, res) => {
  try {

      const { id,group, veto } = req.body;

      // Ensure veto is an array and not empty
      if (!Array.isArray(veto) || veto.length === 0) {
          return res.status(400).json({ error: 'Veto should be a non-empty array' });
      }

      const newBanPick = new BanPick({
          id,group,
          veto
      });

      await newBanPick.save();

      res.status(201).json(newBanPick);
  } catch (err) {
      res.status(400).json({ error: err.message });
  }
};
export const findBanPickVeto = async (req, res) => {
  try {
 // Add logging to debug

      const { id,group } = req.body;

      const newBanPick = await BanPick.findOne({
        id,group
      });



      res.status(200).json(newBanPick);
  } catch (err) {
      res.status(400).json({ error: err.message });
  }
};



export const signin = async (req, res, next) => {
  const { username, password } = req.body;
  try {
    const validUser = await User.findOne({ username });

    if (!validUser) return next(errorHandler(404, 'Người dùng không tìm thấy'));

    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) return next(errorHandler(401, 'Thông tin đăng nhập sai'));

    const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    if (!validUser._doc) return next(errorHandler(500, 'Không thể truy cập dữ liệu người dùng'));

    const { password: hashedPassword, ...rest } = validUser._doc;
    
    const expiryDate = new Date(Date.now() + 60 * 60 * 1000); // 1 giờ

    res
      .cookie('access_token', token, { httpOnly: true, expires: expiryDate })
      .status(200)
      .json(rest);
  } catch (error) {
    return next(errorHandler(500, 'Lỗi máy chủ nội bộ'));
  }
};

export const findPlayer = async (req, res, next) => {
  const { _id } = req.body;
  try {
    const validUser = await User.findOne({ _id  });

    if (!validUser) {
      return next(errorHandler(404, 'User not found'));
    }
    res.status(200).json(validUser);
  } catch (error) {
    next(error);
  }
};

export const signout = (req, res) => {
  res.clearCookie('access_token').status(200).json('Signout success!');
};
