import mongoose from "mongoose";

const TFTMatchSchema = new mongoose.Schema(
  {
    matchId: { type: String, required: true, unique: true },
    data: { type: Object, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("TFTMatch", TFTMatchSchema);
