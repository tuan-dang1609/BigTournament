import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';

export const test = (req, res) => {
  res.json({
    message: 'API is working!',
  });
};

// update user
export const getUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).select("-password"); // ❌ không trả về password

    if (!user) {
      return res.status(404).json({ success: false, message: "User không tồn tại" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Lỗi getUser:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi lấy user" });
  }
};
export const updateUser = async (req, res, next) => {

  try {
    if (req.body.password) {
      req.body.password = bcryptjs.hashSync(req.body.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          riotID:req.body.riotID,
          username: req.body.username,
          nickname:req.body.nickname,
          garenaaccount:req.body.garenaaccount,
          password: req.body.password,
          profilePicture: req.body.profilePicture,
        },
      },
      { new: true }
    );
    const { password, ...rest } = updatedUser._doc;
    res.status(200).json(rest);
  } catch (error) {
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