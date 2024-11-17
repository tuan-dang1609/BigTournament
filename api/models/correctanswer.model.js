import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const correctAnswerSchema = new Schema({
  questionId: { type: String, required: true },     
  correctTeams: { type: [String], default: [] },    // Correct teams for this question
});

const CorrectAnswers = new Schema({
  answers: { type: [correctAnswerSchema], required: true },  // Array of correct answers
  createdAt: { type: Date, default: Date.now }
});
const CorrectAnswersSubmit = mongoose.model('CorrectAnswers', CorrectAnswers, 'CorrectAnswers');
export default CorrectAnswersSubmit;