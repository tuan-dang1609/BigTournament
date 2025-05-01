// models/ValorantMatch.js
import mongoose from "mongoose";

const valorantMatchSchema = new mongoose.Schema(
  {
    matchId: { type: String, required: true, unique: true },
    data: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.models.ValorantMatch ||
  mongoose.model("ValorantMatch", valorantMatchSchema);
