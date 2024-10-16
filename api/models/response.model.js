import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const questionResponseSchema = new Schema({
  questionId: { type: Number, required: true },   
  selectedTeams: { type: [String], required: true } 
});

const predictionSchema = new Schema({
  userId: { type: String },
  answers: { type: [questionResponseSchema], required: true },  // Array of question answers 
});
const PredictionPickem = mongoose.model('PredictionPickem', predictionSchema,'PredictionPickem');
export default PredictionPickem;