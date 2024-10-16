import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    discordID:{
      type:String,
      unique: true,
      default:""
    },
    riotID:{
      type:String,
      unique: true,
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
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema,'users');

export default User;
