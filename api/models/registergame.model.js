// backend/models/Team.js
import mongoose from 'mongoose';

const gameMembersSchema = new mongoose.Schema({}, { strict: false });

const teamSchema = new mongoose.Schema({
    discordID:{
        type:String
    },
    usernameregister:{
        type:String
    },
    teamName: {
        type: String,
        trim: true,
        unique:true,
    },
    shortName: {
        type: String,
        unique:true,
        trim: true,
        maxlength: 5
    },
    classTeam: {
        type: String,
        required: true,
        trim: true,
    },
    color: {
        type: String,
        trim: true,
    }
    ,
    logoUrl: {
        type: String,
        trim: true,
        unique:true,
    },
    games: {
        type: [String],
        required: true,
        validate: [arrayLimit, 'At least one game must be selected']
    },
    gameMembers: {
        type: Map,
        of: [String],
        required: true,
    }
}, { timestamps: true });

function arrayLimit(val) {
    return val.length > 0;
}

// Define the variable for the model
const TeamRegister = mongoose.model('TeamRegister', teamSchema,'TeamRegister');

// Export the variable
export default TeamRegister;
