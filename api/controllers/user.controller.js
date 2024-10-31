import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';

export const test = (req, res) => {
  res.json({
    message: 'API is working!',
  });
};

// update user

export const updateUser = async (req, res, next) => {
  try {
    const updateFields = {
      discordID: req.body.discordID,
      riotID: req.body.riotID,
      nickname: req.body.nickname,
      garenaaccount: req.body.garenaaccount,
      profilePicture: req.body.profilePicture,
    };

    if (req.body.password) {
      updateFields.password = bcryptjs.hashSync(req.body.password, 10);
    }

    console.log("Updating user with fields:", updateFields); // Kiểm tra dữ liệu đầu vào

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log("Updated user:", updatedUser); // Kiểm tra dữ liệu sau khi cập nhật

    const { password, ...rest } = updatedUser._doc;
    res.status(200).json({ success: true, ...rest });
  } catch (error) {
    console.error("Error updating user:", error); // Log lỗi
    next(error);
  }
};



// delete user


export const deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json('User has been deleted...');
  } catch (error) {
    next(error);
  }

}