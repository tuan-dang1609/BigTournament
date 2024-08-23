import mongoose from 'mongoose';

const banPick = new mongoose.Schema({
    map: { type: String, required: true },
    type: { type: String, enum: ['ban', 'pick', 'decider'], required: true },
    team: { type: String }, // Ensure team is a required string
    index: { type: Number, required: true },
    teamname:{type:String},
    image: { type: String } // URL or path to the map image
}, { _id: false });

const banPickSchema = new mongoose.Schema({
    id: { type: String, required: true},
    group: { type: String, required: true},
    veto: [banPick]
});

const BanPick = mongoose.model('BanPick', banPickSchema, "BanPickVeto");
export default BanPick;
