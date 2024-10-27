import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  avatar: { type: String, required: true },
});

const teamSchema = new mongoose.Schema({
  game:{type:String,required:true},
  name: { type: String, required: true },
  logo: { type: String, required: true,default:"1wRTVjigKJEXt8iZEKnBX5_2jG7Ud3G-L" },
  color: { type: String, required: true },
  players: [playerSchema],
  league: { type: String, required: true},
});

const TeamHOF = mongoose.model("TeamHOF", teamSchema,"TeamHOF");
export default TeamHOF;
