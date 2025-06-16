import mongoose from "mongoose";

const playerReadySchema = new mongoose.Schema({
  riotID: { type: String, required: true },
  isReady: { type: [Boolean], default: [] },
});

const allgameSchema = new mongoose.Schema({
  matchid: { type: [String] },
  teamA: { type: String, required: true },
  teamB: { type: String, required: true },
  round: { type: String, required: true },
  scoreA: { type: Number },
  scoreB: { type: Number },
  Match: { type: String },
  banpickid: { type: String },
  game: { type: String, required: true, default: "Valorant" },
  playersReady: {
    team1: [playerReadySchema],
    team2: [playerReadySchema],
  },
});

const MatchID = mongoose.model("Match ID", allgameSchema, "Match ID");
export default MatchID;
