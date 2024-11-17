import mongoose from 'mongoose';

const { Schema } = mongoose;

// Define optionSchema for each option in the question
const optionSchema = new Schema({
  name: { type: String, required: true },
  logo: { type: String, required: true }
});

// Define questionSchema for each question
const questionSchema = new Schema({
  timelock:{type:Date},
  id: { type: Number, required: true },  // No unique: true constraint
  question: { type: String, required: true },
  maxChoose: { type: Number, required: true },
  category:{type: String},
  type: { type: String, required: true },
  options: [optionSchema]
});

// Define the main schema
const QuestionPickem = mongoose.model('QuestionPickem', questionSchema,'QuestionPickem');

export default QuestionPickem;