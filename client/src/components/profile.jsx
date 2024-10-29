import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { FaDiscord, FaGamepad, FaUser } from "react-icons/fa";
import { SiRiotgames } from "react-icons/si";
import { MdLock } from "react-icons/md";
import garenaLogo from '../image/AOVLogo.png';
import {
    updateUserStart,
    updateUserSuccess,
    updateUserFailure,
} from '../../redux/user/userSlice.js';
import { useDispatch, useSelector } from "react-redux";

const ProfileUpdateForm = () => {
    const [formData, setFormData] = useState({
        avatar: "",
        garenaaccount: "",
        riotId: "",
        discordId: "",
        nickname: "",
        email: "",
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
    });
    const [errors, setErrors] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { currentUser } = useSelector((state) => state.user);

    useEffect(() => {
        document.title = "Cập nhật tài khoản"
        if (currentUser) {
            setFormData({
                avatar: currentUser.profilePicture || "",
                riotId: currentUser.riotID || "",
                garenaaccount: currentUser.garenaaccount || "",
                discordId: currentUser.discordID || "",
                nickname: currentUser.nickname || "",
                email: currentUser.email || "",
                currentPassword: "",
                newPassword: "",
                confirmNewPassword: "",
            });
        }
    }, [currentUser]);

    const validateField = (name, value) => {
        let fieldErrors = {};
        if (name === "newPassword" && value.length < 8) {
            fieldErrors[name] = "New password must be at least 8 characters long";
        } else if (name === "confirmNewPassword" && value !== formData.newPassword) {
            fieldErrors[name] = "Passwords do not match";
        } else {
            // Remove the error if validation passes
            fieldErrors[name] = "";
        }
        return fieldErrors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        const fieldErrors = validateField(name, value);
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let formErrors = {};

        // Validate fields before submitting
        Object.keys(formData).forEach((field) => {
            const fieldErrors = validateField(field, formData[field]);
            formErrors = { ...formErrors, ...fieldErrors };
        });

        // Remove empty errors (passed validations)
        const cleanedErrors = Object.fromEntries(
            Object.entries(formErrors).filter(([_, v]) => v)
        );

        if (Object.keys(cleanedErrors).length === 0) {
            dispatch(updateUserStart());
            try {
                const res = await fetch(`https://dongchuyennghiep-backend.vercel.app/api/user/update/${currentUser._id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });
                const data = await res.json();
                if (data.success === false) {
                    dispatch(updateUserFailure(data));
                    return;
                }
                dispatch(updateUserSuccess(data));
                setIsSubmitted(true);
                setTimeout(() => setIsSubmitted(false), 3000);
                navigate('/');
            } catch (error) {
                dispatch(updateUserFailure(error));
            }
        } else {
            setErrors(cleanedErrors);
        }
    };

    return (
        <div className="min-h-screen bg-base-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl w-full mx-auto space-y-8 bg-white p-8 mt-10 rounded-xl shadow-lg transform transition-all hover:scale-[1.01]">
                <h2 className="mt-1 text-center text-3xl font-bold text-gray-900">Cập nhật thông tin tài khoản</h2>

                {isSubmitted && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                        Profile updated successfully!
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm space-y-4">
                        {/* Avatar URL Field */}
                        <div>
                            <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">Avatar URL</label>
                            <div className="relative flex items-center">
                                <FaUser className="absolute left-0 pl-3 pointer-events-none h-7 w-7 text-gray-400" aria-hidden="true" />
                                <input
                                    id="avatar"
                                    name="avatar"
                                    type="text"
                                    className="bg-white appearance-none rounded-md block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="Enter avatar URL"
                                    value={formData.avatar}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Riot ID and Discord ID Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="riotId" className="block text-sm font-medium text-gray-700">Riot ID</label>
                                <div className="relative flex items-center">
                                    <SiRiotgames className="absolute left-0 pl-3 pointer-events-none h-7 w-7 text-gray-400" aria-hidden="true" />
                                    <input
                                        id="riotId"
                                        name="riotId"
                                        type="text"
                                        className="appearance-none bg-white rounded-md block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Your Riot ID"
                                        value={formData.riotId}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="garenaaccount" className="block text-sm font-medium text-gray-700">Tên trong game Liên Quân Mobile</label>
                                <div className="relative flex items-center">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <img src={garenaLogo} className="h-5 w-5" alt="Garena Logo" aria-hidden="true" />
                                    </div>
                                    <input
                                        id="garenaaccount"
                                        name="garenaaccount"
                                        type="text"
                                        className="appearance-none bg-white rounded-md block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Tên trong game Liên Quân Mobile"
                                        value={formData.garenaaccount}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="discordId" className="block text-sm font-medium text-gray-700">Tên trong Discord</label>
                                <div className="relative flex items-center">
                                    <FaDiscord className="absolute left-0 pl-3 pointer-events-none h-8 w-8 text-gray-400" aria-hidden="true" />
                                    <input
                                        id="discordId"
                                        name="discordId"
                                        type="text"
                                        className="bg-white appearance-none rounded-md block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Your Discord ID"
                                        value={formData.discordId}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Nickname Field */}
                        <div>
                            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">Nickname</label>
                            <div className="relative flex items-center">
                                <FaUser className="absolute left-0 pl-3 pointer-events-none h-7 w-7 text-gray-400" aria-hidden="true" />
                                <input
                                    id="nickname"
                                    name="nickname"
                                    type="text"
                                    className="appearance-none bg-white rounded-md block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="Choose a nickname"
                                    value={formData.nickname}
                                    onChange={handleChange}
                                    autoComplete="nickname"
                                />
                            </div>
                        </div>

                        {/* Current Password Field */}
                        <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Nhập mật khẩu hiện tại</label>
                            <div className="relative flex items-center">
                                <MdLock className="absolute left-0 pl-3 pointer-events-none h-7 w-7 text-gray-400" aria-hidden="true" />
                                <input
                                    id="currentPassword"
                                    name="currentPassword"
                                    type="password"
                                    className="appearance-none bg-white rounded-md block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="Nhập mật khẩu hiện tại"
                                    autoComplete="current-password"
                                    value={formData.currentPassword}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* New Password Field */}
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">Nhập mật khẩu mới</label>
                            <div className="relative flex items-center">
                                <MdLock className="absolute left-0 pl-3 pointer-events-none h-7 w-7 text-gray-400" aria-hidden="true" />
                                <input
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                    className={`appearance-none bg-white rounded-md block w-full pl-10 px-3 py-2 border ${errors.newPassword ? "border-red-500" : "border-gray-300"} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                    placeholder="Nhập mật khẩu mới"
                                    autoComplete="new-password"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                />
                            </div>
                            {errors.newPassword && (
                                <p className="mt-2 text-sm text-red-600" role="alert">{errors.newPassword}</p>
                            )}
                        </div>

                        {/* Confirm New Password Field */}
                        <div>
                            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">Nhập lại mật khẩu mới</label>
                            <div className="relative flex items-center">
                                <MdLock className="absolute left-0 pl-3 pointer-events-none h-7 w-7 text-gray-400" aria-hidden="true" />
                                <input
                                    id="confirmNewPassword"
                                    name="confirmNewPassword"
                                    type="password"
                                    className={`appearance-none bg-white rounded-md block w-full pl-10 px-3 py-2 border ${errors.confirmNewPassword ? "border-red-500" : "border-gray-300"} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                    placeholder="Nhập lại mật khẩu mới để xác nhận"
                                    value={formData.confirmNewPassword}
                                    autoComplete="new-password"
                                    onChange={handleChange}
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
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-accent hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 transform transition-all duration-200 ease-in-out active:scale-95"
                        >
                            Cập nhật
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileUpdateForm;
