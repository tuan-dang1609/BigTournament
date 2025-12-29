import mongoose from "mongoose";

const { Schema } = mongoose;

// Subdocument for a single ranked entry (leaderboard style)
const RankEntrySchema = new Schema(
  {
    gameName: { type: String },
    tagLine: { type: String },
    leagueId: { type: String },
    tier: { type: String },
    rank: { type: String },
    leaguePoints: { type: Number, default: null },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    veteran: { type: Boolean, default: false },
    hotStreak: { type: Boolean, default: false },
    inactive: { type: Boolean, default: false },
    freshBlood: { type: Boolean, default: false },
    winrate: { type: Number, default: 0 },
    isEliminated: { type: Boolean, default: false },
    puuid: { type: String },
    lastUpdated: { type: Date, default: Date.now },
  },
  { _id: false }
);

const BootcampLeagueSchema = new Schema(
  {
    league_id: { type: String, required: true, unique: true, index: true },
    game_short: { type: String, required: true, index: true },
    isBootcamp: { type: Boolean, default: true },
    isCompleted: { type: Boolean, default: false },
    rank_league: { type: [RankEntrySchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("BootcampLeague", BootcampLeagueSchema);
