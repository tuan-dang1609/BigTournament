import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const allUserScoreSchema = new Schema({
  userID: { type: String, required: true },  // User ID as a string
  totalScore: { type: Number, required: true }  // Total score as an integer
});
const AllUserScore = mongoose.model('AllUserScore', allUserScoreSchema,'AllUserScore')
export default AllUserScore;