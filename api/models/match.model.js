import mongoose from 'mongoose';

const agentSchema = new mongoose.Schema(
  {
    Agent: {
      type: String,
      
    },
    IGN: {
      type: String,
      
    },
    ACS: {
      type: String,
      
    },
    K: {
      type: String,
      
    },
    D: {
      type: String,
      
    },
    A: {
      type: String,
      
    },
    KD: {
      type: String,
      
    },
    ADR: {
      type: String,
      
    },
    HS: {
      type: String,
      
    },
    KAST: {
      type: String,
      
    },
    FK: {
      type: String,
      
    },
    MK: {
      type: String,
      
    },
  },
  { _id: false } // Prevents creation of an `_id` field in subdocuments
);

const teamInfoSchema = new mongoose.Schema(
  {
    score: {
      type: Number,
      required: true,
    },
    data: [agentSchema], // List of agents
  },
  { _id: false } // Prevents creation of an `_id` field in subdocuments
);

export const teamSchema = new mongoose.Schema(
  {
    logoURL: {
      type: String,
      required: true,
    },
    teamname: {
      type: String,
      required: true,
    },
  },
  { _id: false } // Prevents creation of an `_id` field in subdocuments
);

const mapSchema = new mongoose.Schema(
  {
    name: {
      type: String
    },
    pick: {
      type: String,
    },
    infoTeamleft: {
      type: teamInfoSchema,

    },
    infoTeamright: {
      type: teamInfoSchema,

    },
  },
  { _id: false } // Prevents creation of an `_id` field in subdocuments
);

const matchSchema = new mongoose.Schema(
  {
    idmatch: {
      type: String,
      required: true
    },
    timestartmatch: {
      type: Date,
      required: true,
    },
    league: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    group: {
      type: String,
      required: true,
    },
    stage:{
      type:String,
      required: true
    },
    teamleft: {
      type: teamSchema,
      required: true,
    },
    teamright: {
      type: teamSchema,
      required: true,
    },
    maps: [mapSchema],
    scoreteamA: {
      type: Number,
      default: 0,
    },
    scoreteamB: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Match = mongoose.model('Match', matchSchema, 'MatchInfo');

export default Match;
