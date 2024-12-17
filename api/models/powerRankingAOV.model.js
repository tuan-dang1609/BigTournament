import mongoose from 'mongoose';

const powerRankingAOVSchema = new mongoose.Schema({
  teamName: { type: String, required: true },
  points: { type: Number, default: 500 }, // Điểm ban đầu mặc định là 500
  createdAt: { type: Date, default: Date.now },
});

const PowerRankingAOV = mongoose.model('PowerRankingAOV', powerRankingAOVSchema,'PowerRankingAOV');
export default PowerRankingAOV;
