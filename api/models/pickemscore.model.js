import mongoose from "mongoose";

const LeaderboardItemSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    userId: { type: String, required: true },
    logoURL: { type: String, default: "" },
    Score: { type: Number, default: 0 },
  },
  { _id: false }
);

const PickemScoreSchema = new mongoose.Schema({
  league_id: { type: String, required: true },
  leaderboard: [LeaderboardItemSchema],
});

export default mongoose.model("PickemScore", PickemScoreSchema);
