// backend/models/Team.js
import mongoose from 'mongoose';

const gameMembersSchema = new mongoose.Schema({}, { strict: false });

const teamSchema = new mongoose.Schema({
    teamName: {
        type: String,
        required: true,
        trim: true
    },
    shortName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5
    },
    classTeam: {
        type: String,
        required: true,
        trim: true
    },
    logoUrl: {
        type: String,
        required: true,
        trim: true,

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
        validate: {
            validator: function(value) {
                for (let members of value.values()) {
                    if (members.some(member => !member.trim())) {
                        return false;
                    }
                }
                return true;
            },
            message: 'All member fields must be filled'
        }
    }
}, { timestamps: true });

function arrayLimit(val) {
    return val.length > 0;
}

// Define the variable for the model
const TeamRegister = mongoose.model('TeamRegister', teamSchema,'TeamRegister');

// Export the variable
export default TeamRegister;
