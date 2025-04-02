import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {nickname:{
    type:String,
    required: true,
    default:"TBD"
  },
    discordID:{
      type:String,
      required:true,
      default:""
    },
    className:{
      type:String,
      required:true,
      default:""
    },
    garenaaccount:{
      type:String,
      required: true,
      default:"TBD"
    },
    riotID:{
      type:String,
      default:""
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
 
    password: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      default:
        '1wRTVjigKJEXt8iZEKnBX5_2jG7Ud3G-L',
    },
    team:{
      type: String,
      default:""
    }
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema,'users');

export default User;
