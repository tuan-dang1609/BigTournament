import mongoose from "mongoose";

const { Schema } = mongoose;

// Schema cho từng câu trả lời của người dùng
const answerSchema = new Schema({
  questionId: { type: Number, required: true },
  selectedOptions: { type: [String], required: true },
  openTime: { type: Date }, // Thời gian mở pickem cho câu hỏi này
  closeTime: { type: Date }, // Thời gian đóng pickem cho câu hỏi này
});

const responseItemSchema = new Schema({
  // Keep userId for backward compatibility, but group display info under `user`
  userId: { type: String, required: true },
  user: {
    id: { type: String },
    nickname: { type: String },
    team: {
      name: { type: String },
      logoTeam: { type: String },
      shortName: { type: String },
    },
  },
  answers: [answerSchema],
  totalScore: { type: Number, default: 0 },
  // Per-user logs live here
  logs: {
    type: [
      new Schema(
        {
          userId: { type: String, required: true },
          questionId: { type: Number, required: true },
          type: { type: String, required: true },
          // stages log only: FE-only visualization tokens aggregated per question (final state)
          stages: {
            qf: { type: [String], default: [] },
            sf: { type: [String], default: [] },
            uf: { type: [String], default: [] },
            ls1: { type: [String], default: [] },
            ls2: { type: [String], default: [] },
            fourth: { type: [String], default: [] },
            third: { type: [String], default: [] },
            second: { type: [String], default: [] },
            first: { type: [String], default: [] },
          },
          user: {
            id: { type: String },
            nickname: { type: String },
            team: {
              name: { type: String },
              logoTeam: { type: String },
              shortName: { type: String },
            },
          },
          ip: { type: String },
          createdAt: { type: Date, default: Date.now },
          updatedAt: { type: Date, default: Date.now },
        },
        { _id: false }
      ),
    ],
    default: [],
  },
});

const pickemResponseSchema = new Schema({
  league_id: { type: String, required: true },
  responses: [responseItemSchema],
  createdAt: { type: Date, default: Date.now },
});

const PickemResponse = mongoose.model(
  "PickemResponse",
  pickemResponseSchema,
  "PickemResponse"
);

export default PickemResponse;
