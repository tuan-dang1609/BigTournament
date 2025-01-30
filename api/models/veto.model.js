import mongoose from "mongoose";

const matchSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  team1: { type: String, required: true },
  team2: { type: String, required: true },
  matchType: { type: String, enum: ["BO1", "BO3", "BO5"], required: true },
  maps: {
    pool: { type: [String], default: ["Bind", "Haven", "Split", "Ascent", "Icebox", "Breeze", "Fracture","Abyss","Pearl","Sunset","Lotus"] },
    banned: [{ type: String }],
    picked: [{ type: String }],
    selected: [{ type: String }]
  },
  sides: [{
    map: String,
    team1: String,
    team2: String
  }],
  currentPhase: { type: String, enum: ["ban", "pick", "side", "completed"], default: "ban" },
  currentTurn: { type: String, enum: ["team1", "team2"], required: true },
  createdAt: { type: Date, default: Date.now }
});

export const BanPickValo = mongoose.model("BanPickValo", matchSchema,"BanPickValo");