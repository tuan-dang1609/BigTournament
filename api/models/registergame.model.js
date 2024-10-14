import mongoose from 'mongoose';

const gameMembersSchema = new mongoose.Schema({}, { strict: false });

const teamSchema = new mongoose.Schema({
    teamName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    shortName: {
        type: String,
        required: true,
        unique: true,
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
        unique: true
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

// Custom validation to check if a member already exists in another team
teamSchema.pre('save', async function (next) {
    const team = this;
    
    // Flatten all gameMembers into one array
    let allMembers = [];
    for (let members of team.gameMembers.values()) {
        allMembers = allMembers.concat(members);
    }

    // Check if any of the gameMembers already exist in another team
    const existingTeams = await mongoose.model('TeamRegister').find({
        'gameMembers': {
            $in: allMembers
        }
    });

    if (existingTeams.length > 0) {
        const duplicateMembers = existingTeams.map(t => Array.from(t.gameMembers.values())).flat();
        const foundDuplicates = allMembers.filter(member => duplicateMembers.includes(member));
        
        if (foundDuplicates.length > 0) {
            const duplicateMessage = `The following members are already registered: ${foundDuplicates.join(', ')}`;
            const error = new Error(duplicateMessage);
            return next(error);
        }
    }

    next();
});

function arrayLimit(val) {
    return val.length > 0;
}

// Define the variable for the model
const TeamRegister = mongoose.model('TeamRegister', teamSchema, 'TeamRegister');

// Export the variable
export default TeamRegister;
