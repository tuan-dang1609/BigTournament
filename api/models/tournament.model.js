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
  season_name: String,
  checkin_start:Date,
  checkin_end: Date, 
}, { _id: false });

const leagueSchema = new mongoose.Schema({
  league_id: String,
  organizer_id: String,
  name: String,
  season_number: String,
  game_name: String,
  game_short:String,
  banner_image_url: String,
  players_per_team: Number,
  description: String,
  skill_levels: [String],
  school_allowed: [String]
}, { _id: false });
const prizepoolSchema = new mongoose.Schema({
  place: String,
  prize: mongoose.Schema.Types.Mixed // dùng Mixed để hỗ trợ cả string và number
}, { _id: false });

const navigationSchema = new mongoose.Schema({
  name: String,
  href: String
}, { _id: false });
const teamSchema = new mongoose.Schema({
  name: String,
  logoTeam: String
}, { _id: false });
const allplayerSchema = new mongoose.Schema({
  discordID: String,
  ign: [String],
  classTeam: String,
  team: {
    name: String,
    logoTeam: String
  },
  usernameregister: String,
  logoUrl: String,
  game: String,
  isCheckedin: { type: Boolean, default: false }
}, { _id: false });

const matchGroupSchema = new mongoose.Schema({
  id: String,
  matchIds: [String]
}, { _id: false });



const DCNLeagueSchema = new mongoose.Schema({
  league: leagueSchema,
  season: seasonSchema,
  milestones: [milestoneSchema],
  prizepool: [prizepoolSchema],
  navigation: [navigationSchema],
  players:[allplayerSchema],
  matches: {
    type: Map,
    of: [matchGroupSchema], // 👈 mỗi key (ví dụ: "day1") sẽ chứa một array của matchGroup
    default: {}
  }
}, { timestamps: true });



export default mongoose.model('DCN League', DCNLeagueSchema,'DCN League');
