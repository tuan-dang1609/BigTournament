import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from 'react-router-dom';
import { FaDiscord, FaUser } from "react-icons/fa";
import { SiRiotgames } from "react-icons/si";
import { MdLock } from "react-icons/md";
import garenaLogo from '../image/AOVLogo.png';
import {
    updateUserStart,
    updateUserSuccess,
    updateUserFailure,
} from '../../redux/user/userSlice.js';

export default function Profile() {
    const [countdown, setCountdown] = useState(4);
    const [errors, setErrors] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading1, setLoading] = useState(true);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);  
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({});
    const { currentUser, loading, error } = useSelector((state) => state.user);
    const dispatch = useDispatch();

    useEffect(() => {
        const scrollToTop = () => {
            document.documentElement.scrollTop = 0;
            setLoading(false);
        };
        document.title = "Cập nhật Profile";
        setTimeout(scrollToTop, 0);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            dispatch(updateUserStart());
            const res = await fetch(`https://dongchuyennghiep-backend.vercel.app/api/user/update/${currentUser._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success === false) {
                dispatch(updateUserFailure(data));
                return;
            }
            dispatch(updateUserSuccess(data));
            setUpdateSuccess(true);
        } catch (error) {
            dispatch(updateUserFailure(error));
        }
    };

    useEffect(() => {
        if (updateSuccess) {
            const timer = setInterval(() => {
                setCountdown((prevCountdown) => prevCountdown - 1);
            }, 1000);

            if (countdown === 0) {
                navigate('/arenaofvalor');
            }

            // Cleanup the interval on component unmount
            return () => clearInterval(timer);
        }
    }, [updateSuccess, countdown, navigate]);

    if (updateSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                    <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Cập nhật thành công!</h2>
                    <p className="text-center text-gray-600">
                        Thông tin của bạn đã được cập nhật thành công.
                    </p>
                    <p className="text-center text-gray-600 mt-4">
                        Tự động chuyển tới trang chủ trong {countdown} giây...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mt-20 mx-auto w-full">
            <div className="max-w-2xl px-2 sm:px-6 mx-auto mb-6 ">
                <p className="text-3xl font-bold text-center mb-3">Thông tin của tôi</p>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {isSubmitted && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                            Profile updated successfully!
                        </div>
                    )}

                    <div className="rounded-md shadow-sm space-y-4">
                        {/* Avatar URL Field */}
                        <div>
                            <label htmlFor="profilePicture" className="block text-sm font-medium text-base-content">Avatar URL</label>
                            <div className="relative flex items-center">
                                <FaUser className="absolute left-0 pl-3 pointer-events-none h-7 w-7 text-gray-400" aria-hidden="true" />
                                <input
                                    id="profilePicture"
                                    name="profilePicture"
                                    type="text"
                                    defaultValue={currentUser.profilePicture}
                                    placeholder="Enter avatar URL"
                                    onChange={handleChange}
                                    className="bg-white appearance-none rounded-md block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        {/* Riot ID and Garena Account Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="riotID" className="block text-sm font-medium text-base-content">Riot ID</label>
                                <div className="relative flex items-center">
                                    <SiRiotgames className="absolute left-0 pl-3 pointer-events-none h-7 w-7 text-gray-400" aria-hidden="true" />
                                    <input
                                        id="riotID"
                                        name="riotID"
                                        type="text"
                                        defaultValue={currentUser.riotID}
                                        placeholder="Your Riot ID"
                                        onChange={handleChange}
                                        className="appearance-none bg-white rounded-md block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="garenaaccount" className="block text-sm font-medium text-base-content">Tên trong game Liên Quân Mobile</label>
                                <div className="relative flex items-center">
                                    <img src={garenaLogo} className="absolute left-0 pl-3 h-5 w-5 pointer-events-none" alt="Garena Logo" aria-hidden="true" />
                                    <input
                                        id="garenaaccount"
                                        name="garenaaccount"
                                        type="text"
                                        defaultValue={currentUser.garenaaccount}
                                        placeholder="Tên trong game Liên Quân Mobile"
                                        onChange={handleChange}
                                        className="appearance-none bg-white rounded-md block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Discord ID Field */}
                        <div>
                            <label htmlFor="discordID" className="block text-sm font-medium text-base-content">Discord ID</label>
                            <div className="relative flex items-center">
                                <FaDiscord className="absolute left-0 pl-3 pointer-events-none h-8 w-8 text-gray-400" aria-hidden="true" />
                                <input
                                    id="discordID"
                                    name="discordID"
                                    type="text"
                                    defaultValue={currentUser.discordID}
                                    placeholder="Your Discord ID"
                                    onChange={handleChange}
                                    className="bg-white appearance-none rounded-md block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        {/* Nickname Field */}
                        <div>
                            <label htmlFor="nickname" className="block text-sm font-medium text-base-content">Nickname</label>
                            <div className="relative flex items-center">
                                <FaUser className="absolute left-0 pl-3 pointer-events-none h-7 w-7 text-gray-400" aria-hidden="true" />
                                <input
                                    id="nickname"
                                    name="nickname"
                                    type="text"
                                    defaultValue={currentUser.nickname}
                                    placeholder="Choose a nickname"
                                    onChange={handleChange}
                                    autoComplete="nickname"
                                    className="appearance-none bg-white rounded-md block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        {/* Current Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-base-content">Mật khẩu hiện tại</label>
                            <div className="relative flex items-center">
                                <MdLock className="absolute left-0 pl-3 pointer-events-none h-7 w-7 text-gray-400" aria-hidden="true" />
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Enter current password"
                                    onChange={handleChange}
                                    className="appearance-none bg-white rounded-md block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        {/* New Password Field */}
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-base-content">Mật khẩu mới</label>
                            <div className="relative flex items-center">
                                <MdLock className="absolute left-0 pl-3 pointer-events-none h-7 w-7 text-gray-400" aria-hidden="true" />
                                <input
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                    placeholder="Enter new password"
                                    onChange={handleChange}
                                    className={`appearance-none bg-white rounded-md block w-full pl-10 px-3 py-3 border ${errors.newPassword ? "border-red-500" : "border-gray-300"} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                />
                            </div>
                            {errors.newPassword && (
                                <p className="mt-2 text-sm text-red-600" role="alert">{errors.newPassword}</p>
                            )}
                        </div>

                        {/* Confirm New Password Field */}
                        <div>
                            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-base-content">Xác nhận mật khẩu mới</label>
                            <div className="relative flex items-center">
                                <MdLock className="absolute left-0 pl-3 pointer-events-none h-7 w-7 text-gray-400" aria-hidden="true" />
                                <input
                                    id="confirmNewPassword"
                                    name="confirmNewPassword"
                                    type="password"
                                    placeholder="Confirm new password"
                                    onChange={handleChange}
                                    className={`appearance-none bg-white rounded-md block w-full pl-10 px-3 py-3 border ${errors.confirmNewPassword ? "border-red-500" : "border-gray-300"} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                />
                            </div>
                            {errors.confirmNewPassword && (
                                <p className="mt-2 text-sm text-red-600" role="alert">{errors.confirmNewPassword}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-accent hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 transform transition-all duration-200 ease-in-out active:scale-95"
                        >
                            Cập nhật
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}
