import mongoose from 'mongoose';

const allgameSchema = new mongoose.Schema({
    matchid: { type: [String] },
    teamA: { type: String, required: true },
    teamB: { type: String, required: true },
    round: { type: String, required: true },
    scoreA: { type: Number },
    scoreB: { type: Number },
    Match: { type: String },
    game:{type: String,required:true,default:"Valorant"}
});



const MatchID = mongoose.model('Match ID', allgameSchema, "Match ID");
export default MatchID;