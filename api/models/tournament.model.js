import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  id: String,
  season_id: String,
  title: String,
  date: Date,
  subtitle: String,
  content: String,
}, { _id: false });

const seasonSchema = new mongoose.Schema({
  season_number: String,
  time_start: Date,
  time_end: Date,
  registration_start: Date,
  registration_end: Date,
  current_team_count: Number,
  total_prize_pool: Number,
  max_registration: Number,
  created_at: Date,
  updated_at: Date,
  header_image_url: String,
  thumbnail_url: String,
  season_name: String
}, { _id: false });

const leagueSchema = new mongoose.Schema({
  league_id: String,
  organizer_id: String,
  name: String,
  season_number: String,
  game_name: String,
  banner_image_url: String,
  players_per_team: Number,
  starts_at: Date,
  description: String,
  skill_levels: [String],
  school_allowed: [String]
}, { _id: false });

const DCNLeagueSchema = new mongoose.Schema({
  league: leagueSchema,
  season: seasonSchema,
  milestones: [milestoneSchema]
}, { timestamps: true });

export default mongoose.model('DCN League', DCNLeagueSchema,'DCN League');
