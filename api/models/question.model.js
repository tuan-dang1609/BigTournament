import mongoose from "mongoose";

const { Schema } = mongoose;

// Define optionSchema for each option in the question
const optionSchema = new Schema({
  name: { type: String, required: true },
  img: { type: String, required: true },
  // Optional team short code (e.g., HLE, TES). Present for team-based questions.
  shortName: { type: String, required: false, default: "" },
});

// Define questionSchema for each question
const questionSchema = new Schema({
  timelock: { type: Date },
  openTime: { type: Date }, // Thời gian mở cho phép pickem cho câu hỏi
  closeTime: { type: Date }, // Thời gian đóng cho phép pickem cho câu hỏi
  id: { type: Number, required: true },
  question: { type: String, required: true },
  maxChoose: { type: Number, required: true },
  game_short: { type: String }, // Đổi tên category thành game_short
  type: { type: String, required: true },
  options: [optionSchema],
  score: { type: Number, default: 0 },
  bracket_id: { type: String }, // Thêm trường bracket_id
  correctAnswer: { type: [String], default: [] }, // Mảng đáp án đúng, mặc định rỗng
});

// Schema lớn hơn chứa các câu hỏi Pickem Challenge cho từng giải
const pickemChallengeSchema = new Schema({
  league_id: { type: String, required: true }, // Kiểu String
  questions: [questionSchema],
  createdAt: { type: Date, default: Date.now },
});

// Model cho Pickem Challenge của từng giải
const PickemChallenge = mongoose.model(
  "PickemChallenge",
  pickemChallengeSchema,
  "PickemChallenge"
);

export default PickemChallenge;
