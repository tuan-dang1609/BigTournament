import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  teamA: { type: String, required: true },
  scoreA: { type: Number, required: true },
  teamB: { type: String, required: true },
  scoreB: { type: Number, required: true },
  matchID: { type: String, required: true },
  round: { type: String, required: true }
});

const StaticTeam = mongoose.model('BracketTeamSwiss', teamSchema,'BracketTeamSwiss');

export default StaticTeam;
