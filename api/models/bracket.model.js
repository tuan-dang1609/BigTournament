import mongoose from "mongoose";



const matchSchema = new mongoose.Schema({
  matchId: String,
  bestOf: { type: Number, default: 1 },
  matchIds: [String], // Các match thực tế
  factions: [
    {
      number: Number,
      teamId: { type: String, default: null },
      teamName: { type: String, default: null },
      score: { type: Number, default: 0 },
      winner: { type: Boolean, default: false },
    }
  ],
  winner: { type: String, default: null },
  ifWin: { type: String, default: null }, // matchId tiếp theo nếu thắng
  ifLose: { type: String, default: null }, // matchId tiếp theo nếu thua
});

const roundSchema = new mongoose.Schema({
  number: Number,
  name: String, // quarter-final, semi-final, etc.
  matches: [matchSchema]
});

const bracketSchema = new mongoose.Schema({
  game: String,
  leagueId: String,
  type: { type: String, default: "singleElimination" },
  rounds: [roundSchema],
}, { timestamps: true });

export default mongoose.model("Bracket", bracketSchema,"Bracket");
