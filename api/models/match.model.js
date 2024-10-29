import mongoose from 'mongoose';

const agentSchema = new mongoose.Schema(
  {
    
    IGN: {
      type: String,
      
    },
    point: {
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
    Gold:{
      type:String
    }
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



const mapSchema = new mongoose.Schema(
  {

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
    info: [mapSchema],
    scoreteamA: {
      type: Number,
      default: 0,
    },
    scoreteamB: {
      type: Number,
      default: 0,
    },
    teamA:{
      type:String,
      required:true
    },
    teamB:{
      type:String,
      required:true
    }
  },
  { timestamps: true }
);

const Match = mongoose.model('Match', matchSchema, 'MatchInfo');

export default Match;
