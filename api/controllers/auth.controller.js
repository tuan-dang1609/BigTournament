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
import TeamHOF from '../models/teamhof.model.js'
import LeagueHOF from '../models/league.model.js';
import QuestionPickem from '../models/question.model.js';
const scoreQueue = new Queue('score-processing');

const pointSystem = {
  1: 15,
  2: 10,
  3: 10,
  9: 10,
  4: 15,  // Question 4 is worth 15 points per correct answer
  5: 9,    // Question 5 is worth 9 points per correct answer
  6: 8,
  7:10,
  8: 8, 
  10:10,
  11:12,
  12:11,
  13: 12,
  14: 20,
  15:20,
  16:4,
  17:12
};

for (let day = 1; day <= 8; day++) {
  for (let question = 1; question <= 8; question++) {
    pointSystem[`day${day}-${question}`] = 10;
  }
}
export const signup = async (req, res, next) => {
  const { garenaaccount,nickname,riotID, username, password, discordID } = req.body;
  try {
    const hashedPassword = bcryptjs.hashSync(password, 10);
    const newUser = new User({ garenaaccount,nickname,riotID, username, discordID, password: hashedPassword });

    await newUser.save();
    res.status(201).json({ message: 'Tạo tài khoản thành công' });
  } catch (error) {
    return next(errorHandler(500, 'Tạo tài khoản thất bại'));
  }
};
export const teamHOF = async (req, res, next) => {
  try {
    const teams = req.body;

    // Kiểm tra nếu `teams` không phải là mảng, trả về lỗi
    if (!Array.isArray(teams)) {
      return res.status(400).json({ message: "Data must be an array of teams" });
    }

    // Tạo các hoạt động `upsert` cho từng đội
    const operations = teams.map((team) => ({
      updateOne: {
        filter: { name: team.name, game: team.game ,league: team.league}, // Điều kiện xác định đội đã tồn tại
        update: { $set: team },
        upsert: true // Thêm mới nếu không tồn tại
      }
    }));

    // Thực hiện `bulkWrite` với các hoạt động `upsert`
    const result = await TeamHOF.bulkWrite(operations);
    
    res.status(201).json({ message: "Teams added or updated successfully", result });
  } catch (error) {
    res.status(400).json({ message: "Error adding or updating teams", error: error.message });
  }
};

export const leagueHOF = async (req, res, next) => {
  try {
    const leagues = req.body;

    // Kiểm tra nếu `leagues` không phải là mảng, trả về lỗi
    if (!Array.isArray(leagues)) {
      return res.status(400).json({ message: "Data must be an array of leagues" });
    }

    // Tạo các hoạt động `upsert` cho từng giải đấu
    const operations = leagues.map((league) => ({
      updateOne: {
        filter: { league: league.league,game:league.game,name:league.name }, // Điều kiện xác định giải đấu đã tồn tại
        update: { $set: league },
        upsert: true // Thêm mới nếu không tồn tại
      }
    }));

    // Thực hiện `bulkWrite` với các hoạt động `upsert`
    const result = await LeagueHOF.bulkWrite(operations);

    res.status(201).json({ message: "Leagues added or updated successfully", result });
  } catch (error) {
    res.status(400).json({ message: "Error adding or updating leagues", error: error.message });
  }
};

export const findleagueHOF = async (req, res, next) => {
  try {
    const leagues = await LeagueHOF.find();
    res.status(200).json(leagues);
  } catch (error) {
    res.status(400).json({ message: "Lỗi khi lấy danh sách giải đấu", error: error.message });
  }
};
export const findteamHOF = async (req, res, next) => {
  const { league } = req.params;

  try {
    // Tìm tất cả các đội trong giải đấu được chỉ định
    const teams = await TeamHOF.find({ league });

    // Kiểm tra từng người chơi trong mỗi đội
    const enrichedTeams = await Promise.all(
      teams.map(async (team) => {
        // Kiểm tra từng thành viên trong đội
        const enrichedPlayers = await Promise.all(
          team.players.map(async (player) => {
            // Tìm người dùng theo riotID trùng với tên thành viên
            const user = await User.findOne({ riotID: player.name });

            if (user) {
              // Trả về dữ liệu người dùng nếu tìm thấy
              return {
                name: user.nickname,
                avatar: user.profilePicture
              };
            }

            // Nếu không tìm thấy người dùng, trả về dữ liệu mặc định của player
            return player;
          })
        );

        // Trả về dữ liệu đội với danh sách thành viên đã cập nhật
        return {
          ...team.toObject(), // Sử dụng toObject() để chuyển đổi tài liệu thành đối tượng JavaScript
          players: enrichedPlayers,
        };
      })
    );

    res.status(200).json(enrichedTeams);
  } catch (error) {
    res.status(400).json({ message: "Error fetching teams", error: error.message });
  }
};

export const calculateMaxPoints = async (req, res) => {
  try {
    const correctAnswers = await CorrectAnswersSubmit.findOne();
    if (!correctAnswers) {
      return res.status(404).json({ message: 'Correct answers not found' });
    }

    let totalMaxPoints = 0;
    const calculatedQuestions = [];

    for (const correctAnswer of correctAnswers.answers) {
      const questionId = correctAnswer.questionId;

      if (!questionId) {
        console.warn(`Invalid questionId: ${questionId}`);
        continue;
      }

      // Xử lý trường hợp `questionId` là dạng `category-id` hoặc chỉ `id`
      let question;
      if (questionId.includes('-')) {
        // Trường hợp `category-id` (ví dụ: `day1-5`)
        const [category, idStr] = questionId.split('-');
        const id = Number(idStr);

        if (!category || isNaN(id)) {
          console.warn(`Invalid questionId format: ${questionId}`);
          continue;
        }

        question = await QuestionPickem.findOne({ category, id });
      } else {
        // Trường hợp chỉ có `id` (dạng số, ví dụ: `10`)
        const id = Number(questionId);
        if (isNaN(id)) {
          console.warn(`Invalid numeric questionId: ${questionId}`);
          continue;
        }

        question = await QuestionPickem.findOne({ id });
      }

      if (!question) {
        console.warn(`Question with ID "${questionId}" not found in QuestionPickem`);
        continue;
      }

      // Tính điểm cho câu hỏi
      const pointsForQuestion = Math.min(correctAnswer.correctTeams.length, question.maxChoose) * (pointSystem[questionId] || 0);
      totalMaxPoints += pointsForQuestion;

      calculatedQuestions.push({
        questionId,
        pointsForQuestion,
        correctTeams: correctAnswer.correctTeams,
        maxChoose: question.maxChoose,
        pointSystemValue: pointSystem[questionId] || 0,
      });
    }

    console.log('Calculated Questions:', calculatedQuestions);

    res.status(200).json({
      message: `The maximum possible points if all answers are correct is ${totalMaxPoints}.`,
      totalMaxPoints,
      calculatedQuestions,
    });
  } catch (error) {
    console.error('Error calculating maximum points:', error);
    res.status(500).json({ error: 'Internal server error' });
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

        // Add detailed result for the question, including isTrue
        detailedResults.push({
          questionId: userAnswer.questionId,
          correctChoices: correctChoicesForQuestion,
          totalChoices: correctAnswer.correctTeams.length,
          pointsForQuestion,
          isTrue: correctChoicesForQuestion > 0  // Check if user got at least one correct choice
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

export const comparePredictionmultiple = async (req, res) => {
  try {
    const { userIds } = req.body;  // Expecting userIds as an array in the request body

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of userIds.' });
    }

    const results = [];

    // Loop through each userId
    for (const userId of userIds) {
      // Fetch the user's predictions by userId
      const userPrediction = await PredictionPickem.findOne({ userId });
      if (!userPrediction) {
        results.push({ userId, message: 'User prediction not found' });
        continue;  // Skip to the next userId
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

      // Push result for this userId
      results.push({
        userId,
        message: `User got ${totalCorrectChoices} out of ${totalPossibleChoices} choices correct and earned ${totalPoints} points.`,
        totalCorrectChoices,
        totalPossibleChoices,
        totalPoints,
        detailedResults
      });
    }

    // Return all results
    res.status(200).json({
      message: 'Comparison completed successfully for all users.',
      results
    });
  } catch (error) {
    console.error('Error comparing predictions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const submitPrediction = async (req, res) => {
  try {
    const data = req.body;

    // Kiểm tra xem body của request là một mảng (nhiều dự đoán) hay một đối tượng đơn (một dự đoán)
    const predictions = Array.isArray(data) ? data : [data]; // Đảm bảo predictions luôn là mảng

    let lastUserId = null; // Biến lưu userId của dự đoán cuối cùng được xử lý

    // Xác thực từng đối tượng dự đoán
    for (let prediction of predictions) {
      const { userId, answers } = prediction;

      if (!userId || !answers || !Array.isArray(answers)) {
        return res.status(400).json({ error: 'Invalid input. Please provide userId and answers.' });
      }

      lastUserId = userId; // Cập nhật biến lastUserId

      // Tìm dự đoán của người dùng hoặc tạo mới nếu chưa có
      let existingPrediction = await PredictionPickem.findOne({ userId });

      if (existingPrediction) {
        // Tạo một map để dễ dàng cập nhật hoặc thêm mới dựa trên questionId
        const answersMap = new Map(existingPrediction.answers.map((answer) => [answer.questionId.toString(), answer]));

        answers.forEach((newAnswer) => {
          const questionIdStr = newAnswer.questionId.toString();

          if (answersMap.has(questionIdStr)) {
            // Nếu đã có câu trả lời với questionId này, cập nhật selectedTeams
            answersMap.get(questionIdStr).selectedTeams = newAnswer.selectedTeams;
          } else {
            // Nếu chưa có câu trả lời với questionId này, thêm mới
            existingPrediction.answers.push(newAnswer);
          }
        });

        await existingPrediction.save();
      } else {
        // Tạo một tài liệu dự đoán mới nếu không tồn tại
        existingPrediction = new PredictionPickem({ userId, answers });
        await existingPrediction.save();
      }

      // Thêm tác vụ vào Bull queue để xử lý điểm số trong nền
      scoreQueue.add({ userId, answers });
    }

    // Lấy dự đoán đã cập nhật hoặc mới tạo cho userId cuối cùng được xử lý và trả về nó trong phản hồi
    const updatedPrediction = await PredictionPickem.findOne({ userId: lastUserId });
    res.status(200).json({ success: true, message: 'Predictions submitted and processing in the background.', data: updatedPrediction });
  } catch (error) {
    console.error('Error submitting prediction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const leaderboardpickem = async (req, res) => {
  try {
    // Fetch all leaderboard data with a high limit to override potential default limits
    const leaderboardEntries = await AllUserScore.find({})
      .sort({ totalScore: -1, updatedAt: 1 }); // Sort by totalScore in descending order

    // Log the number of results returned from the query
    console.log('Number of leaderboard entries:', leaderboardEntries.length);

    // Create an array to hold the enriched leaderboard data
    const enrichedLeaderboard = await Promise.all(
      leaderboardEntries.map(async (entry) => {
        // Fetch the corresponding user data using userID as a string
        const user = await User.findOne({ _id: entry.userID }).lean(); // Fetch user by string userID

        // Check if user exists
        if (user) {
          return {
            name: user.username,           // User's name
            avatar: user.profilePicture,   // User's profile picture
            score: entry.totalScore        // User's score
          };
        } else {
          // If user doesn't exist, return the userID as fallback
          return {
            name: entry.userID,             // Use userID as fallback for name
            avatar: "1wRTVjigKJEXt8iZEKnBX5_2jG7Ud3G-L",  // Default avatar
            score: entry.totalScore         // User's score
          };
        }
      })
    );

    // Send the enriched leaderboard data as the response
    res.status(200).json({
      message: 'Leaderboard fetched successfully!',
      leaderboard: enrichedLeaderboard
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

export const getCorrectAnswers = async (req, res) => {
  try {
    // Fetch the correct answers from the database
    const correctAnswers = await CorrectAnswersSubmit.findOne();
    if (!correctAnswers) {
      return res.status(404).json({ message: 'Correct answers not found.' });
    }

    // Return the correct answers
    res.status(200).json({
      message: 'Correct answers fetched successfully.',
      answers: correctAnswers.answers // Return the array of correct answers
    });
  } catch (error) {
    console.error('Error fetching correct answers:', error);
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
    const { matchid, teamA, teamB, round,Match,game} = req.body;

    // Check if the required fields are provided
    if (!matchid || !teamA || !teamB || !round||!Match) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find if the matchid already exists
    let match = await MatchID.findOne({ matchid,teamA,teamB,Match,round,game });

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
      const newMatchId = new MatchID({ matchid, teamA, teamB, round,Match,game});
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

export const findAllteamAOV = async (req, res, next) => {
  try {
    // Sử dụng truy vấn $in để kiểm tra mảng "games" có chứa "Liên Quân Mobile"
    const allTeam = await TeamRegister.find({ games: { $in: ["Liên Quân Mobile"] } });

    if (!allTeam || allTeam.length === 0) {
      return next(errorHandler(404, 'No teams found for "Liên Quân Mobile"'));
    }

    res.status(200).json(allTeam);
  } catch (error) {
    next(error);
  }
};
export const findAllteamValorant = async (req, res, next) => {
  try {
    // Sử dụng truy vấn $in để kiểm tra mảng "games" có chứa "Liên Quân Mobile"
    const allTeam = await TeamRegister.find({ games: { $in: ["Valorant"] } });

    if (!allTeam || allTeam.length === 0) {
      return next(errorHandler(404, 'No teams found for "Valorant"'));
    }

    res.status(200).json(allTeam);
  } catch (error) {
    next(error);
  }
};

export const findAllteamTFT = async (req, res, next) => {
  try {
    // Sử dụng truy vấn $in để kiểm tra mảng "games" có chứa "Liên Quân Mobile"
    const allTeam = await TeamRegister.find({ games: { $in: ["Teamfight Tactics"] } });

    if (!allTeam || allTeam.length === 0) {
      return next(errorHandler(404, 'No teams found for "Teamfight Tactics"'));
    }

    res.status(200).json(allTeam);
  } catch (error) {
    next(error);
  }
};
export const findAllteamTFTDouble = async (req, res, next) => {
  try {
    // Sử dụng truy vấn $in để kiểm tra mảng "games" có chứa "Liên Quân Mobile"
    const allTeam = await TeamRegister.find({ games: { $in: ["Teamfight Tactics Double Up"] } });

    if (!allTeam || allTeam.length === 0) {
      return next(errorHandler(404, 'No teams found for "Teamfight Tactics Double"'));
    }

    res.status(200).json(allTeam);
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
