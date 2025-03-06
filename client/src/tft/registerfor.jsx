import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FaMinus } from "react-icons/fa";
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
        logoUrl: "",
        color: "",
        games: [],
        gameMembers: {}
    });
    const [userRegister, setUserRegister] = useState(null); // Check if user is already registered
    const [errors, setErrors] = useState({});
    const [submitStatus, setSubmitStatus] = useState(null);
    const [signupSuccess, setSignupSuccess] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [loading, setLoading] = useState(true); // Loading state
    const [checkingRegistration, setCheckingRegistration] = useState(true); // New state for checking registration
    const navigate = useNavigate();
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const gameOptions = ["Teamfight Tactics"];
    const driverObj = driver({
        showProgress: true,
        steps: [
            { popover: { title: 'Chào mừng', description: 'Chào mừng bạn tới form đăng ký giải đấu TFT của Dong Chuyen Nghiep. Mình sẽ hướng dẫn chi tiết cách điền nhé.' } },
            { element: '#logoUrl', popover: { title: 'Logo', description: 'Điền URL ảnh em muốn đăng. Ví dụ https://drive.google.com/file/d/ 1wieQnqKp6C8xC6vm9V2eVfvw60 BXOND6/view?usp=drive_link thì mình ghi ở đây là 1wieQnqKp6C8xC6vm9V2eVfvw60BXOND6 và link phải phải để chế độ Public.' } },
            { element: '#gameChoose', popover: { title: 'Chọn game', description: 'Chọn vào game Teamfight Tactics. Click vào để thấy thêm phần điền tên trong game' } },
            { element: '#ign', popover: { title: 'Nhập IGN', description: 'Điền tên riot ID của mỗi thành viên. Ở form này tụi mình đã setup để tự điền riotID của bạn.' } },
            { element: '#submitTeam', popover: { title: 'Nộp đội', description: 'Khi bạn đã điền đúng theo yêu cầu, bạn sẽ nộp được. Sau khi nộp, các bạn có thể kiểm tra đội mình bằng cách lướt xuống mục các đội tham dự ở trang chủ nhé.' } },
            { popover: { title: 'Kết thúc', description: 'Như vậy là mình đã hướng dẫn các bạn cách điền form rồi. Hạn chót đã được thông báo ở Announcement Discord. Hẹn gặp lại các bạn ở giải đấu nhé!' } },
        ]
    });


    // Hàm kích hoạt hướng dẫn
    const startTour = () => {
        driverObj.drive();
    };
    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const bodyjson = JSON.stringify({ usernameregister: currentUser._id })
                console.log(bodyjson);
                const response = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/checkregisterTFT', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: bodyjson
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
    if (!currentUser.riotID || currentUser.riotID.trim() === '' || currentUser.riotID === 'Đăng nhập với Riot Games') {  
        navigate('/profile');  
    }
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
                navigate('/tft');
            }

            return () => clearInterval(timer);
        }
    }, [signupSuccess, countdown, navigate]);

    

    const handleGameToggle = (game) => {
        let updatedGames = [...formData.games];
        let updatedGameMembers = { ...formData.gameMembers };

        if (updatedGames.includes(game)) {
            updatedGames = updatedGames.filter((g) => g !== game);
            delete updatedGameMembers[game];
        } else {
            updatedGames.push(game);
            updatedGameMembers[game] = [`${currentUser.riotID}`]; // Tự động điền riotID
        }

        setFormData({ ...formData, games: updatedGames, gameMembers: updatedGameMembers });
        validateField("games", updatedGames);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        validateField(name, value);
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

            case "logoUrl":
                if (!value) {
                    newErrors.logoUrl = "Bạn phải tải lên logo của đội hợp lệ (PNG, tỷ lệ 1:1, kích thước không quá 500x500px).";
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
        const formFields = ["teamName", "shortName", "logoUrl", "games", "gameMembers"];
        formFields.forEach((field) => validateField(field, formData[field]));

        if (Object.keys(tempErrors).length > 0) {
            setErrors(tempErrors);
            setSubmitStatus({ success: false, message: "Please fix the errors in the form." });
            setLoadingSubmit(false);
            return;
        }

        try {
            const response = await axios.post('https://dongchuyennghiep-backend.vercel.app/api/auth/register', formData);
            setSubmitStatus({ success: true, message: "Team registered successfully!" });
            setSignupSuccess(true);

            setFormData({
                teamName: "",
                shortName: "",
                logoUrl: "",
                color: "",
                games: [],
                gameMembers: {}
            });
            setErrors({});
        } catch (error) {
            setSubmitStatus({ success: false, message: error.response?.data?.message || error.message || "An unexpected error occurred." });
        } finally {
            setLoadingSubmit(false);
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

    if (userRegister && userRegister.gameMembers["Teamfight Tactics"][0]) {
        return (
            <>
                <div className="min-h-screen flex flex-col sm:mx-96 mx-5 ">
                    <Link to='/tft' className="!justify-start flex mt-28 font-bold hover:underline text-lg lg:mb-2 mb-1">&lt; Quay lại</Link>
                    <div className="bg-white p-8 rounded-lg shadow-md w-full flex justify-center items-center flex-col">
                        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Bạn đã đăng kí đội</h2>

                        {/* Hiển thị logo từ chuỗi Base64 */}
                        <img
                            src={`https://drive.google.com/thumbnail?id=${userRegister.logoUrl}`}
                            className="w-28 h-28 mb-5"
                            alt="Logo của đội"
                        />
                        <p className="text-gray-600">Riot ID: {userRegister.gameMembers["Teamfight Tactics"][0]}</p>
                        <p className="text-gray-600">Game sẽ tham gia: {userRegister.games[0]}</p>
                    </div>
                </div>
            </>
        );
    }

    if (signupSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                    <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Đăng kí thành công!</h2>
                    <p className="text-center text-gray-600">Cảm ơn bạn đã đăng kí đội cho lớp.</p>
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
                            <h1 className="text-3xl font-bold text-center">Đơn Check'in Giải Teamfight Tactics</h1>
                        </div>
                        <button onClick={startTour} className="bg-blue-500 text-white px-4 py-2 rounded-md mt-4">
                            Hướng dẫn
                        </button>
                        <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
                            <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">


                                <div className="flex flex-col" id="logoUrl">
                                    <label className="leading-loose font-semibold text-base-content" htmlFor="logoUrl">
                                        Logo ID của bạn
                                    </label>
                                    <input
                                        type="text"

                                        name="logoUrl"
                                        value={formData.logoUrl}
                                        onChange={handleInputChange}
                                        className="px-4 py-2 bg-white border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                        placeholder="Nhập ID của tệp Google Drive"
                                    />
                                    {errors.logoUrl && (
                                        <p className="text-red-500 text-xs italic">{errors.logoUrl}</p>
                                    )}
                                </div>


                                <div className="flex flex-col" id="gameChoose">
                                    <label className="leading-loose font-semibold text-base-content">Chọn game mà bạn sẽ tham gia</label>
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
                                        <label className="leading-loose text-base-content font-bold">Riot ID của các thành viên</label>

                                        {formData.gameMembers[game].map((member, index) => (
                                            <div key={index} className="flex items-center space-x-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={formData.gameMembers[game][index] || ""}
                                                    readOnly
                                                    className="disabled px-4 py-2 !text-base-content border focus:ring-gray-500 focus:border-primary w-full sm:text-sm border-gray-300 rounded-md focus:outline-none"
                                                    placeholder={`Riot ID của thành viên ${index + 1}`}
                                                />

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

                                                {!(game === "League Of Legends" || game === "Valorant" || game === "Liên Quân Mobile") && formData.gameMembers[game].length > 3 && (
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


                                    </div>
                                ))}


                            </div>
                            <div className="pt-4 flex items-center space-x-4">
                                <motion.button
                                    type="submit"
                                    id="submitTeam"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-gradient-to-r from-secondary to-accent hover:from-secondary hover:to-accent text-white flex justify-center items-center w-full px-4 py-3 rounded-md focus:outline-none"
                                >
                                    {loadingSubmit ? "Đang nộp..." : "Đăng kí đội"}
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
