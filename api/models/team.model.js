import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    discordID: {
      type: String,
    },
    usernameregister: {
      type: String,
    },
    color: {
      type: String,
    },
    team: {
      type: String,
      unique: true,
      required: true,
    },
    logoURL: {
      type: String,
      unique: true,
      required: true,
    },
    shortname: {
      type: String,
      unique: true,
      required: true,
    },
    class: {
      type: [String],
      required: true,
    },
    players: {
      type: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId, required: true }, // thêm dòng này
          nickname: { type: String, required: true },
          class: { type: String, required: true },
          username: { type: String, required: true },
        },
      ],
      required: true,
    },
    trophy: {
      type: [
        {
          game: { type: String },
          rank: { type: Number }, // chưa validate ở đây
        },
      ],
    },
  },
  { timestamps: true }
);

const Organization = mongoose.model("Organization", userSchema, "Organization");

export default Organization;
