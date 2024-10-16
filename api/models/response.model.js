import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const questionResponseSchema = new Schema({
  questionId: { type: Number, required: true },     // Question ID (e.g., 3, 4, 5, etc.)
  selectedTeams: { type: [String], required: true } // Selected teams for this question
});

const predictionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  answers: { type: [questionResponseSchema], required: true },  // Array of question answers 
});

export default model('PredictionPickem', predictionSchema,'PredictionPickem');