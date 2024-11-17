import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const questionResponseSchema = new Schema({
  questionId: { type: String, required: true },   
  selectedTeams: { type: [String], required: true } 
});

const predictionSchema = new Schema({
  userId: { type: String },
  answers: { type: [questionResponseSchema], required: true },  // Array of question answers 
},{
  timestamps: true // This adds `createdAt` and `updatedAt` fields automatically
});
const PredictionPickem = mongoose.model('PredictionPickem', predictionSchema,'PredictionPickem');
export default PredictionPickem;