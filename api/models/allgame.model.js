import mongoose from 'mongoose';

const allgameSchema = new mongoose.Schema({
    url: { type: String, required: true },
    game: { type: String, required: true },
    image: { type: String }, // Ensure team is a required string
    description: { type: String},
    badges:{type:[String]}
});



const AllGame = mongoose.model('All game', allgameSchema, "All Game");
export default AllGame;