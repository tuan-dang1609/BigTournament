import mongoose from "mongoose";

const { Schema } = mongoose;

// Subdocument for a single ranked entry (leaderboard style)
const RankEntrySchema = new Schema(
  {
    gameName: { type: String },
    tagLine: { type: String },
    discordID: String,
    classTeam: String,
    team: {
      name: String,
      logoTeam: String,
      shortName: String,
    },
    usernameregister: String,
    logoUrl: String,
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
    eliminationAt: { type: String, default: null },
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
    // List of puuid that are eliminated to avoid refetching Riot data
    eliminated: { type: [String], default: [] },
    // Map of puuid -> elimination round name
    eliminatedRounds: { type: Map, of: String, default: {} },
    rank_last_updated: { type: Date, default: null },
    // Rounds define scheduled elimination checkpoints.
    // Example: { name: 'Đợt 1', runAt: Date, take: 15 }
    rounds: {
      type: [
        {
          name: { type: String },
          runAt: { type: Date },
          take: { type: Number, default: 0 },
          // When true, `take` is treated as a percentage of total players (ceil rounded)
          takeIsPercent: { type: Boolean, default: false },
          executed: { type: Boolean, default: false },
          executedAt: { type: Date, default: null },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("BootcampLeague", BootcampLeagueSchema);
