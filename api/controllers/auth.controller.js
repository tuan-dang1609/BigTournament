import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import { errorHandler } from '../utils/error.js';
import jwt from 'jsonwebtoken';
import Team from '../models/team.model.js';
import Match from '../models/match.model.js';
import BanPick from '../models/veto.model.js';
import mongoose from 'mongoose';
export const signup = async (req, res, next) => {
  const { riotID, username, email, password } = req.body;
  const hashedPassword = bcryptjs.hashSync(password, 10);
  const newUser = new User({ riotID, username, email, password: hashedPassword });
  try {
    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    next(error);
  }
};

export const addteam = async (req, res, next) => {
  const { team, logoURL, shortname, player1, player2, player3, player4, player5, player6, player7, player8, player9, player10 } = req.body;
  const newTeam = new Team({ team, logoURL, shortname, player1, player2, player3, player4, player5, player6, player7, player8, player9, player10 });
  try {
    await newTeam.save();
    res.status(201).json({ message: 'Team created successfully' });
  } catch (error) {
    next(error);
  }
};
export const findteam = async (req, res, next) => {
  const { player } = req.body;
  try {
    const validUser = await Team.findOne({
      $or: [
        { player1: player },
        { player2: player },
        { player3: player },
        { player4: player },
        { player5: player },
        { player6: player },
        { player7: player },
        { player8: player },
        { player9: player },
        { player10: player }
      ]
    });

    if (!validUser) {
      return next(errorHandler(404, 'User not found'));
    }

    const { ...rest } = validUser._doc;

    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};
// Assuming your Match model is in a file called matchModel.js

export const addMatch = async (req, res, next) => {
  const { idmatch, group, timestartmatch, league, type, teamleft, teamright, maps, stage } = req.body;

  // Initialize scores
  let scoreteamA = 0;
  let scoreteamB = 0;

  // Check if maps is defined and is an array
  if (Array.isArray(maps)) {
    // Calculate scores for each team based on the maps' scores
    maps.forEach(map => {
      const scoreLeft = map.infoTeamleft?.score;
      const scoreRight = map.infoTeamright?.score;

      if (scoreLeft !== undefined && scoreRight !== undefined) {
        if (scoreLeft > scoreRight) {
          scoreteamA += 1;
        } else if (scoreLeft < scoreRight) {
          scoreteamB += 1;
        }
      }
    });
  } else {
    return res.status(400).json({ message: 'Maps data is missing or not properly formatted' });
  }

  try {
    // Check if match with the given idmatch already exists
    const existingMatch = await Match.findOne({ idmatch, stage });

    if (existingMatch) {
      // Update existing match
      existingMatch.timestartmatch = timestartmatch;
      existingMatch.league = league;
      existingMatch.type = type;
      existingMatch.teamleft = teamleft;
      existingMatch.teamright = teamright;
      existingMatch.maps = maps;
      existingMatch.group = group;
      existingMatch.scoreteamA = scoreteamA;
      existingMatch.scoreteamB = scoreteamB;

      await existingMatch.save();
      res.status(200).json({ message: 'Match updated successfully' });
    } else {
      // Create new match
      const newMatch = new Match({
        idmatch,
        timestartmatch,
        league,
        type,
        teamleft,
        teamright,
        maps,
        group,
        scoreteamA,
        scoreteamB,
        stage
      });

      await newMatch.save();
      res.status(201).json({ message: 'Match added successfully' });
    }
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
export const findMatch = async (req, res, next) => {
  const { idmatch, stage } = req.body; // Removed _id and ign
  try {
    const query = {};

    // Only add to query if idmatch and stage are provided
    if (idmatch) {
      query.idmatch = idmatch;
    }

    if (stage) {
      query.stage = stage;
    }

    // Ensure both idmatch and stage are present in the query
    if (!idmatch || !stage) {
      return next(errorHandler(400, 'Both idmatch and stage are required'));
    }

    const validMatches = await Match.find(query).sort({ updatedAt: -1 });

    if (validMatches.length === 0) {
      return next(errorHandler(404, 'No matches found'));
    }

    res.status(200).json(validMatches);
  } catch (error) {
    next(error);
  }
};


export const findMatchPlayoff = async (req, res, next) => {
  const { idmatch, _id } = req.body;
  try {
    const validMatch = await Match.findOne({
      $or: [
        { idmatch: idmatch },
        { _id: _id }
      ]
    });

    if (!validMatch) {
      return next(errorHandler(404, 'User not found'));
    }

    const { password: hashedPassword, ...rest } = validMatch._doc;

    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};
export const getAllMatches = async (req, res, next) => {
  try {
    const allMatches = await Match.find();

    if (allMatches.length === 0) {
      return next(errorHandler(404, 'No matches found'));
    }

    res.status(200).json(allMatches);
  } catch (error) {
    next(error);
  }
};
export const signin = async (req, res, next) => {
  const { email, username, password } = req.body;
  try {
    const validUser = await User.findOne({
      $or: [
        { email: email },
        { username: username }
      ]
    });
    if (!validUser) return next(errorHandler(404, 'User not found'));
    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) return next(errorHandler(401, 'wrong credentials'));
    const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET);
    const { password: hashedPassword, ...rest } = validUser._doc;
    const expiryDate = new Date(Date.now() + 2629824000); // 1 hour
    res
      .cookie('access_token', token, { httpOnly: true, expires: expiryDate })
      .status(200)
      .json(rest);
  } catch (error) {
    next(error);
  }
};

export const findPlayer = async (req, res, next) => {
  const { riotID } = req.body;
  try {
    const validMatch = await User.findOne({ riotID });

    if (!validMatch) {
      return next(errorHandler(404, 'User not found'));
    }

    const userWithoutPassword = { ...validMatch._doc };

    res.status(200).json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
};

export const signout = (req, res) => {
  res.clearCookie('access_token').status(200).json('Signout success!');
};
