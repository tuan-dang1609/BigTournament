import React, { useState, useEffect } from "react";
import { FaPlus, FaMinus, FaUserPlus } from "react-icons/fa";
import { motion } from "framer-motion";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TeamRegistrationTFTDoubleForm = () => {
    const [formData, setFormData] = useState({
        teamName: "",
        shortName: "",
        classTeam: "",
        logoUrl: "",
        games: [],
        gameMembers: {}
    });

    const [errors, setErrors] = useState({});
    const [submitStatus, setSubmitStatus] = useState(null);
    const [signupSuccess, setSignupSuccess] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const navigate = useNavigate();

    const gameOptions = ["Teamfight Tactics Double Up"];

    useEffect(() => {
        if (signupSuccess) {
            const timer = setInterval(() => {
                setCountdown((prevCountdown) => prevCountdown - 1);
            }, 1000);

            if (countdown === 0) {
                navigate('/');
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
            updatedGameMembers[game] = (game === "Teamfight Tactics Double Up") ? Array(2).fill("") : [""];
        }

        setFormData({ ...formData, games: updatedGames, gameMembers: updatedGameMembers });
        validateField("games", updatedGames);
    };

    const handleMemberChange = (game, index, value) => {
        const updatedGameMembers = { ...formData.gameMembers };
        updatedGameMembers[game][index] = value;
        setFormData({ ...formData, gameMembers: updatedGameMembers });
        validateField("gameMembers", updatedGameMembers);
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
                    newErrors.teamName = "Team name is required";
                } else {
                    delete newErrors.teamName;
                }
                break;
            case "shortName":
                if (!value.trim()) {
                    newErrors.shortName = "Short name is required";
                } else if (value.length > 5) {
                    newErrors.shortName = "Short name should not exceed 5 characters";
                } else {
                    delete newErrors.shortName;
                }
                break;
            case "classTeam":
                if (!value.trim()) {
                    newErrors.classTeam = "Class is required";
                } else {
                    delete newErrors.classTeam;
                }
                break;
            case "logoUrl":
                delete newErrors.logoUrl;

                break;
            case "games":
                if (value.length === 0) {
                    newErrors.games = "Select at least one game";
                } else {
                    delete newErrors.games;
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
        const formFields = ["teamName", "classTeam", "games", "gameMembers"];
        formFields.forEach((field) => validateField(field, formData[field]));
    
    
        // Thêm console.log để kiểm tra dữ liệu trước khi gửi
        console.log("Submitting form data:", formData);
    
        try {
            const response = await axios.post('https://bigtournament-hq9n.onrender.com/api/auth/register', formData);
            setSubmitStatus({ success: true, message: "Team registered successfully!" });
            setSignupSuccess(true);
    
            // Reset form data sau khi đăng ký thành công
            setFormData({
                teamName: "",
                classTeam: "",
                games: [],
                gameMembers: {}
            });
            setErrors({});
        } catch (error) {
            setSubmitStatus({ success: false, message: error.response?.data?.message || error.message || "An unexpected error occurred." });
        }
    };
    

    if (signupSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                    <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Đăng kí thành công!</h2>
                    <p className="text-center text-gray-600">
                        Cảm ơn bạn đã đăng kí đội cho lớp. Bây giờ bạn có thể chờ đợi lịch thi đấu bằng cách theo dõi thông tin trong Discord trường mình nhé
                    </p>
                    <p className="text-center text-gray-600 mt-4">
                        Tự động chuyển tới trang chủ trong {countdown} giây...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-6 flex flex-col justify-center sm:py-12">
            <div className="relative py-3 lg:max-w-7xl lg:w-5/12 sm:mx-auto">
                <div className="relative px-4 py-8 sm:rounded-3xl sm:px-2 sm:py-12">
                    <div className="max-w-md mx-auto">
                        <div>
                            <h1 className="text-2xl font-bold text-center">Đơn đăng kí giải Esport DCN</h1>
                        </div>
                        <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
                            <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                                <div className="flex flex-col">
                                    <label className="leading-loose font-semibold text-base-content" htmlFor="teamName">Tên đội</label>
                                    <input
                                        type="text"
                                        id="teamName"
                                        name="teamName"
                                        value={formData.teamName}
                                        onChange={handleInputChange}
                                        className="px-4 py-2 border bg-white focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                        placeholder="Tên đội của bạn"
                                    />
                                    {errors.teamName && (
                                        <p className="text-red-500 text-xs italic">{errors.teamName}</p>
                                    )}
                                </div>

                                <div className="flex flex-col">
                                    <label className="leading-loose font-semibold text-base-content" htmlFor="shortName">Tên viết tắt của đội</label>
                                    <input
                                        type="text"
                                        id="shortName"
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

                                

                                <div className="flex flex-col">
                                    <label className="leading-loose font-semibold text-base-content" htmlFor="logoUrl">Google Drive Logo URL của bạn</label>
                                    <input
                                        type="text"
                                        id="logoUrl"
                                        name="logoUrl"
                                        value={formData.logoUrl}
                                        onChange={handleInputChange}
                                        className="px-4 py-2 bg-white border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                        placeholder="https://example.com/logo.png"
                                    />
                                    {errors.logoUrl && (
                                        <p className="text-red-500 text-xs italic">{errors.logoUrl}</p>
                                    )}
                                </div>

                                <div className="flex flex-col">
                                    <label className="leading-loose font-semibold text-base-content">Các game mà đội bạn sẽ tham gia</label>
                                    <div className="flex flex-wrap gap-2">
                                        {gameOptions.map((game) => (
                                            <motion.button
                                                key={game}
                                                type="button"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleGameToggle(game)}
                                                className={`px-4 py-2 rounded-full text-sm font-semibold ${formData.games.includes(game)
                                                        ? "bg-primary text-black"
                                                        : "bg-gray-200 text-gray-700"
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
                                    <div key={game} className="flex flex-col mt-4">
                                        <label className="leading-loose text-base-content font-bold">Thành viên của game {game}</label>
                                        {formData.gameMembers[game].map((member, index) => (
                                            <div key={index} className="flex items-center space-x-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={member}
                                                    onChange={(e) => handleMemberChange(game, index, e.target.value)}
                                                    className="px-4 py-2 !text-base-content border focus:ring-gray-500 focus:border-primary w-full sm:text-sm border-gray-300 rounded-md focus:outline-none "
                                                    placeholder={`${game} Member ${index + 1} username`}
                                                />

                                                {(game === "League Of Legends" || game === "Valorant"|| game === "Liên Quân Mobile") && formData.gameMembers[game].length > 5 && (
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

                                {errors.gameMembers && (
                                    <p className="text-red-500 text-xs italic">{errors.gameMembers}</p>
                                )}
                            </div>
                            <div className="pt-4 flex items-center space-x-4">
                                <motion.button
                                    type="submit"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-blue-500 flex justify-center items-center w-full text-white px-4 py-3 rounded-md focus:outline-none"
                                >
                                    Register Team
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

export default TeamRegistrationTFTDoubleForm;
