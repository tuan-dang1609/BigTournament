import mongoose from "mongoose";

const matchSchema = new mongoose.Schema({
  banPhase: { type: Number, default: 1 }, // 1 = Ban đầu, 2 = Ban sau pick
  pickPhase: { type: Number, default: 1 }, // 1 = Pick đầu, 2 = Pick sau
  id: { type: String, required: true, unique: true },
  team1: { type: String, required: true },
  team2: { type: String, required: true },
  deciderMap: { type: String },
  matchType: { type: String, enum: ["BO1", "BO3", "BO5"], required: true },
  maps: {
    pool: { type: [String], default: ["Ascent", "Icebox", "Fracture", "Haven","Lotus","Pearl","Split"] },
    banned: [{
      name: { type: String },      // Tên map bị ban
      bannedBy: { type: String }   // Tên đội ban
    }],
    picked: [{ 
      name: { type: String },      // Tên map được pick
      pickedBy: { type: String }   // Tên đội pick
    }],
    selected: [{ type: String }]
  },
  sides: [{
    map: { type: String, required: true },
    pickedBy: { type: String, required: true }, // Thêm trường này
    team1: { type: String, enum: ['Attacker', 'Defender', 'TBD', null], default: null },
    team2: { type: String, enum: ['Attacker', 'Defender', 'TBD', null], default: null }
  }],
  currentPhase: { type: String, enum: ["ban", "pick", "side", "completed"], default: "ban" },
  currentTurn: { type: String, enum: ["team1", "team2"], required: true },
  createdAt: { type: Date, default: Date.now }
});
const BanPickValo = mongoose.model("BanPickValo", matchSchema,"BanPickValo");
export default BanPickValo