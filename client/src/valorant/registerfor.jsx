import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FaMinus, FaUserPlus } from "react-icons/fa";
import { motion } from "framer-motion";
import axios from 'axios';
import Image from '../image/waiting.png'
import { useNavigate, Link } from 'react-router-dom';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
const TeamRegistrationForm = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [formData, setFormData] = useState({
        discordID: currentUser.discordID,
        usernameregister: currentUser._id,
        teamName: "",
        shortName: "",
        classTeam: "",
        logoUrl: "",
        color: "",
        games: [],
        gameMembers: {}
    });
    const [userRegister, setUserRegister] = useState(null); // Check if user is already registered
    const [errors, setErrors] = useState({});
    const [submitStatus, setSubmitStatus] = useState(null);
    const [signupSuccess, setSignupSuccess] = useState(false);
    const [countdown, setCountdown] = useState(10);
    const [loading, setLoading] = useState(true); // Loading state
    const [checkingRegistration, setCheckingRegistration] = useState(true); // New state for checking registration
    const [allUsers, setAllUsers] = useState([]); // Lưu tất cả người dùng
    const [suggestions, setSuggestions] = useState([]); // Lưu danh sách gợi ý
    const [activeInputIndex, setActiveInputIndex] = useState(null); // Theo dõi ô input đang nhập

    const navigate = useNavigate();
    const gameOptions = ["Valorant"];
    const driverObj = driver({
        showProgress: true,
        steps: [
            { popover: { title: 'Chào mừng', description: 'Chào mừng bạn tới form đăng ký giải đấu Valorant Dong Chuyen Nghiep. Mình sẽ hướng dẫn chi tiết cách điền nhé.' } },
            { element: '#teamName', popover: { title: 'Tên đội', description: 'Hãy nhập tên đội của bạn, tối đa là 15 ký tự. Lưu ý là không được đặt tên đội phản cảm, thiếu văn minh nhé.' } },
            { element: '#shortName', popover: { title: 'Tên viết tắt của đội', description: 'Hãy nhập tên viết tắt đội bạn, tối đa là 5 ký tự. Lưu ý là tên viết tắt đội phải không mang hàm ý xấu hay thiếu văn minh nhé' } },
            { element: '#classTeam', popover: { title: 'Lớp', description: 'Hãy nhập lớp bạn đang học. Cú pháp: xAy, trong đó x là 10,11,12 và y là thứ tự lớp trong khối. Lưu ý nếu là 1 lớp có 2 đội trở lên phải báo cho admin.' } },
            { element: '#logoUrl', popover: { title: 'Logo ID', description: 'Ví dụ bạn có link logo: https://drive.google.com/file/d/1_hPEfE40vu TmbCCVUFsVEwMai-B4je3z/view?usp=drive_link thì chỉ cần ghi 1_hPEfE40vuTmbCCVUFsVEwMai-B4je3z là được. Ảnh nhớ để chế độ Công Khai (Public) và có size 256x256 và clear background.' } },
            { element: '#color', popover: { title: 'Màu chủ đạo của đội', description: 'Chọn màu chủ đạo cho đội bạn.' } },
            { element: '#gameChoose', popover: { title: 'Chọn game', description: 'Chọn vào game Valorant. Click vào để thấy thêm phần điền tên trong game' } },
            { element: '#ign', popover: { title: 'Nhập IGN', description: 'Điền tên trong game của mỗi thành viên.' } },
            { element: '#addmember', popover: { title: 'Thêm thành viên', description: 'Bạn có thể add thêm tối đa 2 thành viên.' } },
            { element: '#removemember', popover: { title: 'Xóa thành viên', description: 'Bạn có thể xóa nếu như lỡ ấn thêm nhiều thành viên. Lưu ý nút này chỉ xuất hiện khi có 6 hoặc 7 người.' } },
            { element: '#submitTeam', popover: { title: 'Nộp đội', description: 'Khi bạn đã điền đúng theo yêu cầu, bạn sẽ nộp được. Sau khi nộp, các bạn có thể kiểm tra đội mình bằng cách lướt xuống mục các đội tham dự ở trang chủ nhé.' } },
            { popover: { title: 'Kết thúc', description: 'Như vậy là mình đã hướng dẫn các bạn cách điền form rồi nhé. Tụi mình sẽ chỉ giải đáp nếu có 2 đội trở lên trong 1 lớp đăng ký hay có lỗi (Bug) trong quá trình đăng ký. Hạn chót đã được thông báo ở Announcement Discord. Hẹn gặp lại các bạn ở giải đấu nhé!' } },
        ]
    });



    // Hàm kích hoạt hướng dẫn
    const startTour = () => {
        driverObj.drive();
    };
    useEffect(() => {
        const fetchAllUsers = async () => {
            try {
                const response = await axios.post("https://dongchuyennghiep-backend.vercel.app/api/auth/alluser"); // POST request
                const users = Array.isArray(response.data) ? response.data : response.data.users || [];
                setAllUsers(users); // Lưu vào state
            } catch (error) {
                console.error("Lỗi khi lấy danh sách tất cả người dùng:", error);
            }
        };

        fetchAllUsers();
    }, []); // Chỉ chạy một lần khi component mount
    useEffect(() => {
        if (userRegister) {
            setFormData({
                discordID: userRegister.discordID || currentUser.discordID,
                usernameregister: userRegister.usernameregister || currentUser._id,
                teamName: userRegister.teamName || "",
                shortName: userRegister.shortName || "",
                classTeam: userRegister.classTeam || "",
                logoUrl: userRegister.logoUrl || "",
                color: userRegister.color || "",
                games: userRegister.games || [],
                gameMembers: userRegister.gameMembers || {}
            });
        }
    }, [userRegister]);
    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/checkregisterValorant', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ usernameregister: currentUser._id })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setUserRegister(data); // Save the fetched user registration info
            } catch (error) {

            } finally {
                setLoading(false); // Set loading to false once the check is complete
                setCheckingRegistration(false); // Checking registration is done
            }
        };

        fetchTeams();
    }, [currentUser]);


    useEffect(() => {
        const scrollToTop = () => {
            document.documentElement.scrollTop = 0;
        };
        setTimeout(scrollToTop, 0);
        document.title = "Form đăng kí giải";
    }, []);

    useEffect(() => {
        if (signupSuccess) {
            const timer = setInterval(() => {
                setCountdown((prevCountdown) => prevCountdown - 1);
            }, 1000);

            if (countdown === 0) {
                navigate('/valorant');
            }

            return () => clearInterval(timer);
        }
    }, [signupSuccess, countdown, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        validateField(name, value);
    };

    const handleGameToggle = (game) => {
        let updatedGames = [...formData.games];
        let updatedGameMembers = { ...formData.gameMembers };

        if (updatedGames.includes(game)) {
            updatedGames = updatedGames.filter((g) => g !== game);
            delete updatedGameMembers[game];
        } else {
            updatedGames.push(game);
            updatedGameMembers[game] = (game === "League Of Legends" || game === "Valorant" || game === "Liên Quân Mobile") ? Array(5).fill("") : [""];
        }

        setFormData({ ...formData, games: updatedGames, gameMembers: updatedGameMembers });
        validateField("games", updatedGames);
    };

    const handleMemberChange = (game, index, value) => {
        setActiveInputIndex(index); // Xác định ô input đang nhập

        const updatedGameMembers = { ...formData.gameMembers };
        updatedGameMembers[game][index] = value;
        setFormData({ ...formData, gameMembers: updatedGameMembers });

        // Nếu nhập trên 2 ký tự, tìm tất cả RiotID gần giống
        if (value.length > 0) {
            const filteredUsers = allUsers
                .filter(user =>
                    user.nickname.toLowerCase().includes(value.toLowerCase()) ||
                    user.riotId.toLowerCase().includes(value.toLowerCase())
                )
                .slice(0, 5); // Lấy tối đa 5 kết quả gợi ý gần nhất

            setSuggestions(filteredUsers);
        } else {
            setSuggestions([]);
        }
    };


    // Xử lý khi mất focus hoặc nhấn Enter mà chưa chọn tên hợp lệ
    const handleInputBlur = (game, index) => {
        setTimeout(() => {
            const currentValue = formData.gameMembers[game][index];
            const isValid = allUsers.some(user => user.riotId === currentValue);

            if (!isValid) {
                setFormData(prev => {
                    const updatedGameMembers = { ...prev.gameMembers };
                    updatedGameMembers[game][index] = ""; // Reset nếu nhập sai
                    return { ...prev, gameMembers: updatedGameMembers };
                });
            }

            setActiveInputIndex(null); // Ẩn gợi ý sau khi mất focus
        }, 200); // Delay để đảm bảo onClick chạy trước khi reset
    };






    const addMember = (game) => {
        const updatedGameMembers = { ...formData.gameMembers };
        if (updatedGameMembers[game].length < 7) {
            updatedGameMembers[game] = [...updatedGameMembers[game], ""];
            setFormData({ ...formData, gameMembers: updatedGameMembers });
        }
    };

    const removeMember = (game, index) => {
        const updatedGameMembers = { ...formData.gameMembers };
        updatedGameMembers[game] = updatedGameMembers[game].filter((_, i) => i !== index);
        setFormData({ ...formData, gameMembers: updatedGameMembers });
        validateField("gameMembers", updatedGameMembers);
    };

    const validateField = (name, value) => {
        let newErrors = { ...errors };

        switch (name) {
            case "teamName":
                if (!value.trim()) {
                    newErrors.teamName = "Bạn phải nhập tên đội";
                } else {
                    delete newErrors.teamName;
                }
                break;
            case "shortName":
                if (!value.trim()) {
                    newErrors.shortName = "Bạn phải nhập tên viết tắt của đội";
                } else if (value.length > 5) {
                    newErrors.shortName = "Tên viết tắt của đội không được quá 5 kí tự";
                } else {
                    delete newErrors.shortName;
                }
                break;
            case "classTeam":
                if (!value.trim()) {
                    newErrors.classTeam = "Bạn phải nhập lớp";
                } else {
                    delete newErrors.classTeam;
                }
                break;
            case "logoUrl":
                if (!value.trim()) {
                    newErrors.logoUrl = "Bạn phải nhập Logo ID";
                } else {
                    delete newErrors.logoUrl;
                }
                break;
            case "color":
                if (!value.trim()) {
                    newErrors.color = "Bạn phải nhập màu chủ đạo cho đội của mình";
                } else {
                    delete newErrors.color;
                }
                break;
            case "games":
                if (value.length === 0) {
                    newErrors.games = "Hãy chọn ít nhất 1 game";
                } else {
                    delete newErrors.games;
                }
                break;
            case "gameMembers":
                if (Object.values(value).some((members) => members.some((member) => !member.trim()))) {
                    newErrors.gameMembers = "Bạn phải nhập tên thành viên sẽ tham gia";
                } else {
                    delete newErrors.gameMembers;
                }
                break;
            default:
                break;
        }

        setErrors(newErrors);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let tempErrors = { ...errors };
        const formFields = ["teamName", "shortName", "classTeam", "logoUrl", "games", "gameMembers"];
        formFields.forEach((field) => validateField(field, formData[field]));

        if (Object.keys(tempErrors).length > 0) {
            setErrors(tempErrors);
            setSubmitStatus({ success: false, message: "Please fix the errors in the form." });
            return;
        }

        try {
            const response = await axios.post('https://dongchuyennghiep-backend.vercel.app/api/auth/register', formData);
            setSubmitStatus({ success: true, message: "Team registered successfully!" });
            setSignupSuccess(true);

            setFormData({
                teamName: "",
                shortName: "",
                classTeam: "",
                logoUrl: "",
                color: "",
                games: [],
                gameMembers: {}
            });
            setErrors({});
        } catch (error) {
            setSubmitStatus({ success: false, message: error.response?.data?.message || error.message || "An unexpected error occurred." });
        }
    };

    if (checkingRegistration) {
        return (
            <div className="min-h-screen flex items-center justify-center ">
                <div className="p-8 rounded-lg shadow-md w-full max-w-xl mx-2 justify-center flex items-center flex-col">
                    <img src={Image} className=" h-32 w-32 pb-2" />
                    <h4 className="text-xl font-semibold text-center text-base-content">Hãy đợi hệ thống của tụi mình kiểm tra xem tài khoản của bạn đã từng đăng kí cho đội chưa nhé</h4>
                    <h4 className="text-xl font-semibold text-center text-base-content">Hành động này sẽ mất vài giây</h4>
                    <span className="loading loading-dots loading-lg text-primary mt-5"></span>
                </div>
            </div>
        );
    }

    if (loading) {
        return <div>Loading...</div>;
    }




    if (signupSuccess && userRegister.__v > 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                    <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Cập nhật thành công!</h2>
                    <p className="text-center text-gray-600">Cảm ơn bạn đã cập nhật đội.</p>
                    <p className="text-center text-gray-600">Link vào Discord: <a href="https://discord.gg/B4EKuhJ2" className="text-orange-400">Discord THPT Phú Nhuận</a></p>
                    <p className="text-center text-gray-600 mt-4">Tự động chuyển tới trang chủ trong {countdown} giây...</p>
                </div>
            </div>
        );
    } else if (signupSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                    <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Đăng kí thành công!</h2>
                    <p className="text-center text-gray-600">Cảm ơn bạn đã đăng kí đội.</p>
                    <p className="text-center text-gray-600">Link vào Discord: <a href="https://discord.gg/B4EKuhJ2" className="text-orange-400">Discord THPT Phú Nhuận</a></p>
                    <p className="text-center text-gray-600 mt-4">Tự động chuyển tới trang chủ trong {countdown} giây...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-6 flex flex-col justify-center sm:py-12">
            <div className="relative py-3 lg:max-w-7xl lg:w-5/12 sm:mx-auto">
                <div className="relative px-4 py-8 sm:rounded-3xl sm:px-2 sm:py-12 " >
                    <div className="mx-auto">
                        <div>
                            <h1 className="text-3xl font-bold text-center">Đơn đăng kí giải Valorant Đón Xuân DCN: Season 2</h1>
                        </div>
                        <button onClick={startTour} className="bg-blue-500 text-white px-4 py-2 rounded-md mt-4">
                            Hướng dẫn
                        </button>
                        <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
                            <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                                <div className="flex flex-col" id="teamName">
                                    <label className="leading-loose font-semibold text-base-content" htmlFor="teamName">Tên đội</label>
                                    <input
                                        type="text"

                                        name="teamName"
                                        value={formData.teamName}
                                        onChange={handleInputChange}
                                        className="px-4 py-2 border bg-white focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                        placeholder="Tên đội của bạn"
                                        maxLength="15"
                                    />
                                    {errors.teamName && (
                                        <p className="text-red-500 text-xs italic">{errors.teamName}</p>
                                    )}
                                </div>

                                <div className="flex flex-col" id="shortName">
                                    <label className="leading-loose font-semibold text-base-content" htmlFor="shortName">Tên viết tắt của đội</label>
                                    <input
                                        type="text"

                                        name="shortName"
                                        value={formData.shortName}
                                        onChange={handleInputChange}
                                        className="px-4 py-2 border bg-white focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                        placeholder="Tên viết tắt"
                                        maxLength="5"
                                    />
                                    {errors.shortName && (
                                        <p className="text-red-500 text-xs italic">{errors.shortName}</p>
                                    )}
                                </div>



                                <div className="flex flex-col" id="logoUrl">
                                    <label className="leading-loose font-semibold text-base-content" htmlFor="logoUrl">
                                        Logo ID của team bạn
                                    </label>
                                    <input
                                        type="text"

                                        name="logoUrl"
                                        value={formData.logoUrl}
                                        onChange={handleInputChange}
                                        className="px-4 py-2 bg-white border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                        placeholder="Nhập ID của tệp Google Drive"
                                    />
                                    <small className="text-base-content mt-1">
                                        Xem hướng dẫn{" "}
                                        <Link className="text-primary" to="https://docs.google.com/document/d/1zlei9yIWtSLfukegTeREZd8iwH2EUT1rTECH4F6Ph64/edit?tab=t.0" target="_blank" rel="noopener noreferrer">
                                            <strong>Tại Đây</strong>
                                        </Link>.
                                    </small>
                                    {errors.logoUrl && (
                                        <p className="text-red-500 text-xs italic">{errors.logoUrl}</p>
                                    )}
                                </div>

                                <div className="flex flex-col" id="color">
                                    <label className="leading-loose font-semibold text-base-content" htmlFor="logoUrl">
                                        Chọn màu chủ đạo cho đội của bạn
                                    </label>
                                    <input
                                        type="color"

                                        name="color"
                                        value={formData.color}
                                        onChange={handleInputChange}
                                        className="h-10 border-base-100 w-20"
                                    />
                                    <small className="text-base-content mt-1">
                                        Xem hướng dẫn{" "}
                                        <Link className="text-primary" to="https://docs.google.com/document/d/1zlei9yIWtSLfukegTeREZd8iwH2EUT1rTECH4F6Ph64/edit?tab=t.0" target="_blank" rel="noopener noreferrer">
                                            <strong>Tại Đây</strong>
                                        </Link>.
                                    </small>
                                    {errors.logoUrl && (
                                        <p className="text-red-500 text-xs italic">{errors.logoUrl}</p>
                                    )}
                                </div>

                                <div className="flex flex-col" id="gameChoose">
                                    <label className="leading-loose font-semibold text-base-content">Chọn game mà đội bạn sẽ tham gia</label>
                                    <div className="flex flex-wrap gap-2">
                                        {gameOptions.map((game) => (
                                            <motion.button
                                                key={game}
                                                type="button"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleGameToggle(game)}
                                                className={`px-4 py-2 rounded-full text-sm font-semibold ${formData.games.includes(game)
                                                    ? "bg-gradient-to-r from-secondary to-accent hover:from-secondary hover:to-accent text-white"
                                                    : "bg-gray-300 text-gray-900"
                                                    }`}
                                            >
                                                {game}
                                            </motion.button>
                                        ))}
                                    </div>
                                    {errors.games && (
                                        <p className="text-red-500 text-xs italic">{errors.games}</p>
                                    )}
                                </div>

                                {formData.games.map((game) => (
                                    <div key={game} className="flex flex-col mt-4" id="ign">
                                        <label className="leading-loose text-base-content font-bold">Tên trong game {game} của các thành viên</label>
                                        <small className="text-base-content mt-1">
                                            Mình khuyên phần này các bạn nên đọc{" "}
                                            <Link className="text-primary" to="https://docs.google.com/document/d/1zlei9yIWtSLfukegTeREZd8iwH2EUT1rTECH4F6Ph64/edit?tab=t.6823b1wcmvmd" target="_blank" rel="noopener noreferrer">
                                                <strong>lưu ý</strong>
                                            </Link>.
                                        </small>
                                        {formData.gameMembers[game].map((member, index) => (
                                            <div key={index} className="flex items-center space-x-2 mb-2">
                                                <div className="relative  focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600">
                                                    <input
                                                        type="text"
                                                        value={formData.gameMembers[game][index]}
                                                        onChange={(e) => handleMemberChange(game, index, e.target.value)}
                                                        onFocus={() => setActiveInputIndex(index)} // Khi focus vào ô input, lưu lại index
                                                        onBlur={() => handleInputBlur(game, index)} // Nếu mất focus, kiểm tra xem nhập đúng không
                                                        className="px-4 py-2 text-base-content font-bold lg:text-[14px] text-[12px] border focus:ring-gray-500 focus:border-primary w-full sm:text-sm border-gray-300 rounded-md focus:outline-none"
                                                        placeholder={`Nhập RiotID hoặc chọn từ danh sách`}
                                                    />

                                                    {/* Hiển thị danh sách gợi ý nếu có */}
                                                    {suggestions.length > 0 && activeInputIndex === index && (
                                                        <ul className="absolute z-10 bg-white border border-gray-300 rounded-md mt-1 w-full shadow-lg">
                                                            {suggestions.map((user) => (
                                                                <li
                                                                    key={user.riotId} // Đảm bảo mỗi RiotID là duy nhất
                                                                    onMouseDown={(e) => e.preventDefault()} // Ngăn mất focus khi click
                                                                    onClick={() => {
                                                                        handleMemberChange(game, activeInputIndex, user.riotId); // Gán vào đúng input
                                                                        setSuggestions([]); // Ẩn danh sách sau khi chọn
                                                                    }}
                                                                    className="cursor-pointer p-2 hover:bg-gray-200 flex items-center"
                                                                >
                                                                    <img
                                                                        src={`https://drive.google.com/thumbnail?id=${user.profilePicture}`}
                                                                        alt="profile"
                                                                        className="w-8 h-8 rounded-full mr-2"
                                                                    />
                                                                    <div>
                                                                        <strong>{user.nickname}</strong> <span className="text-black">({user.riotId})</span>
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>


                                                {(game === "League Of Legends" || game === "Valorant" || game === "Liên Quân Mobile") && formData.gameMembers[game].length > 5 && (
                                                    <motion.button
                                                        id="removemember"
                                                        type="button"
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => removeMember(game, index)}
                                                        className="bg-red-500 text-white p-2 rounded-full"
                                                    >
                                                        <FaMinus />
                                                    </motion.button>
                                                )}

                                                {!(game === "League Of Legends" || game === "Valorant" || game === "Liên Quân Mobile") && formData.gameMembers[game].length > 1 && (
                                                    <motion.button
                                                        type="button"
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => removeMember(game, index)}
                                                        className="bg-red-500 text-white p-2 rounded-full"
                                                    >
                                                        <FaMinus />
                                                    </motion.button>
                                                )}
                                            </div>
                                        ))}

                                        <motion.button
                                            id="addmember"
                                            type="button"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => addMember(game)}
                                            className="bg-green-500 text-white px-4 py-2 rounded-md flex items-center justify-center mt-2"
                                        >
                                            <FaUserPlus className="mr-2" /> Thêm thành viên cho đội
                                        </motion.button>
                                    </div>
                                ))}

                                {errors.gameMembers && (
                                    <p className="text-red-500 text-xs italic">{errors.gameMembers}</p>
                                )}
                            </div>
                            <div className="pt-4 flex items-center space-x-4">
                                <motion.button
                                    type="submit"
                                    id="submitTeam"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-gradient-to-r from-secondary to-accent hover:from-secondary hover:to-accent text-white flex justify-center items-center w-full px-4 py-3 rounded-md focus:outline-none"
                                >
                                    Đăng kí đội
                                </motion.button>
                            </div>
                        </form>

                        {submitStatus && (
                            <p className={`text-${submitStatus.success ? 'green' : 'red'}-500 text-xs italic`}>{submitStatus.message}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamRegistrationForm;
