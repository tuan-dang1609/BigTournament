import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from 'react-router-dom';
import { FaDiscord, FaUser } from "react-icons/fa";
import { SiRiotgames } from "react-icons/si";
import { MdLock } from "react-icons/md";
import garenaLogo from '../image/AOVLogo.png';
import verifyIcon from '../image/verified-symbol-icon.png'
import {
    updateUserStart,
    updateUserSuccess,
    updateUserFailure,
    updateRiotID 
} from '../../redux/user/userSlice.js';

export default function Profile() {
    const [countdown, setCountdown] = useState(4);
    const [errors, setErrors] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading1, setLoading] = useState(true);
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({});
    const { currentUser, loading, error } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const [loggedInUser, setLoggedInUser] = useState("");
    const handleRiotLogin = () => {
        window.location.href = "https://bigtournament-hq9n.onrender.com/sso/login-riot";
        // Set riotID vào formData sau khi người dùng đăng nhập thành công
        setFormData({ ...formData, riotID: loggedInUser });
    }
    const handleLogout = () => {
        setLoggedInUser(""); // Xóa loggedInUser khi nhấn nút "X"
        // Sau khi xóa, gán lại riotID vào formData để hiển thị nút đăng nhập lại
        setFormData((prevFormData) => ({
            ...prevFormData,
            riotID: "",  // Xóa giá trị riotID trong formData
        }));
        // Cập nhật redux state với "Đăng nhập với Riot Games"
        dispatch(updateRiotID("Đăng nhập với Riot Games"));
    };
    useEffect(() => {
        // Lấy access_token, gameName, và tagName từ URL query string
        const urlParams = new URLSearchParams(window.location.search);
        const gameName = urlParams.get("gameName");
        const tagName = urlParams.get("tagName");

        if (gameName && tagName) {
            setLoggedInUser(`${gameName}#${tagName}`);
        }
    }, []);
    useEffect(() => {
        const scrollToTop = () => {
            document.documentElement.scrollTop = 0;
            setLoading(false);
        };
        document.title = "Cập nhật Profile";
        setTimeout(scrollToTop, 0);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value ,riotID: loggedInUser});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        // Ensure the button's name attribute is correctly checked
        const buttonName = e.nativeEvent.submitter.name;  // Use submitter to get the button that was clicked
    
        if (buttonName === 'updateProfile') {
            try {
                dispatch(updateUserStart());
                const res = await fetch(`https://bigtournament-hq9n.onrender.com/api/user/update/${currentUser._id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });
                const data = await res.json();
                console.log(data);
                if (data.success === false) {
                    dispatch(updateUserFailure(data));
                    return;
                }
                dispatch(updateUserSuccess(data));
                setUpdateSuccess(true);
            } catch (error) {
                dispatch(updateUserFailure(error));
            }
        }
    };
    
    useEffect(() => {
        if (loggedInUser) {
          const updateRiotIDImmediately = async () => {
            try {
              const updatedData = {
                ...formData,
                riotID: loggedInUser,
              };
      
              const res = await fetch(`https://bigtournament-hq9n.onrender.com/api/user/update/${currentUser._id}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
              });
      
              const data = await res.json();
              console.log('RiotID updated:', data);
      
              if (!data.success) {
                dispatch(updateUserFailure(data));
              } else {
                dispatch(updateUserSuccess(data));
                setUpdateSuccess(true);
              }
      
              setFormData(updatedData); // Cập nhật formData state nếu cần
            } catch (error) {
              console.error("Lỗi khi cập nhật RiotID:", error);
              dispatch(updateUserFailure(error));
            }
          };
      
          updateRiotIDImmediately();
        }
      }, [loggedInUser]);
       // Theo dõi khi loggedInUser thay đổi
    useEffect(() => {
        if (updateSuccess) {
            const timer = setInterval(() => {
                setCountdown((prevCountdown) => prevCountdown - 1);
            }, 1000);

            if (countdown === 0) {
                navigate('/');
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
                <div className="flex flex-col space-y-4">
    {!loggedInUser && (currentUser.riotID === "TBD" || !currentUser.riotID || currentUser.riotID === "Đăng nhập với Riot Games") ? (
        <button
            id="riotID"
            name="riotID"
            onClick={(e) => {
                e.preventDefault();
                handleRiotLogin();
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    riotID: loggedInUser,  // Gán giá trị loggedInUser vào riotID trong formData
                }));
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
        >
            <div className="flex flex-row items-center justify-center gap-x-2">{loggedInUser || "Đăng nhập với Riot Games"} <SiRiotgames /></div>
        </button>
    ) : (
        <button
            className="bg-red-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-between"
        >
            <div className="flex flex-row gap-x-1 items-center justify-center">
            <span>{loggedInUser || currentUser.riotID} </span>
            <img src = {verifyIcon} className="h-5 w-5"/>
            </div>
            <span
                className="text-white ml-2 cursor-pointer"
                onClick={handleLogout} // Gọi handleLogout khi nhấn "X"
            >
                X
            </span>
        </button>
    )}
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

    {/* Submit Button */}
    <button
        type="submit"
        name="updateProfile"  // Ensure the button has the 'name' attribute
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm font-medium text-white bg-secondary hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
        {isSubmitted ? "Đang cập nhật..." : "Cập nhật"}
    </button>
</form>



            </div>
        </div>
    );
}
