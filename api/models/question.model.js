import mongoose from 'mongoose';

const choiceSchema = new mongoose.Schema(
  {
    imageid: { type: String, required: true },
    teamname: { type: String },
    playername: { type: String },
  },
  { _id: false } // Prevents creation of an `_id` field in subdocuments
);

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    choice: [choiceSchema]
  },
  { _id: false } // Prevents creation of an `_id` field in subdocuments
);

const questionPickemSchema = new mongoose.Schema(
  {
    idquestionset: {
      required: true,
      type: String,
      unique: true // Ensure idquestionset is unique
    },
    questionSet: [questionSchema]
  },
  {
    timestamps: true, // Add timestamps for creation and update times
  }
);

const QuestionPickem = mongoose.model('QuestionPickem', questionPickemSchema, 'QuestionPickem');

export default QuestionPickem;
