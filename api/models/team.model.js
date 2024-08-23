import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        team: {
            type: String,
            unique: true,
            required:true
        },
        logoURL:{
            type: String,
            unique: true,
            required:true
        },
        shortname:{
            type:String,
            unique: true,
            required:true
        },
        player1: {
            type: String,
            required: true,
            unique: true,
        },
        player2: {
            type: String,
            required: true,
            unique: true,
        },
        player3: {
            type: String,
            required: true,
            unique: true,
        },
        player4: {
            type: String,
            required: true,
            unique: true,
        },
        player5: {
            type: String,
            required: true,
            unique: true,
        },
        player6: {
            type: String,
            required: true,
            unique: true,
        },
        player7: {
            type: String,
            default: ""
        },
        player8: {
            type: String,
            default: ""
        },
        player9: {
            type: String,
            default: ""
        },
        player10: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

const Team = mongoose.model('Team', userSchema, 'team');

export default Team;

