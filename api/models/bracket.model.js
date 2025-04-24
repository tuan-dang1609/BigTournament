// models/Bracket.js
import mongoose from 'mongoose';

const factionSchema = new mongoose.Schema({
  number: Number,
  score: Number,
  winner: Boolean,
  entity: {
    id: String,
    name: String,
    avatar: String,
  },
  previousMatch: {
    group: Number,
    round: Number,
    placement: Number
  }
}, { _id: false });

const matchDetailSchema = new mongoose.Schema({
  id: String,
  number: Number,
  originId: String,
  status: String,
  schedule: Number,
  bestOf: Number,
  factions: [factionSchema]
}, { _id: false });

const roundSchema = new mongoose.Schema({
  number: Number,
  matches: [String]
}, { _id: false });

const bracketSchema = new mongoose.Schema({
  game: String,
  league_id: String,
  type: String,
  rounds: [roundSchema],
  matches: { type: Map, of: matchDetailSchema }
}, { timestamps: true });

export default mongoose.model('Bracket', bracketSchema,'Bracket');
