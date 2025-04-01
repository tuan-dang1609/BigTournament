import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
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
    players: {
      type: [String], // mảng các tên người chơi
      validate: {
        validator: function (val) {
          return val.length >= 12 && val.length <= 20;
        },
        message: 'Đội phải có từ 12 đến 20 người chơi',
      },
      required: true,
    },
  },
  { timestamps: true }
);

const Team = mongoose.model('Team', userSchema, 'team');

export default Team;
