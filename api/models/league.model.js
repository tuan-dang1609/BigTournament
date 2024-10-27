import mongoose from "mongoose";

const leagueSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  color: { type: String, required: true },
  game:{type:String,required:true},
  borderColor: { type: String, required: true },
  textColor: { type: String, required: true },
});

const League = mongoose.model("League", leagueSchema);
export default League;
