import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {  FaMinus, FaUserPlus } from "react-icons/fa";
import { motion } from "framer-motion";
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const TeamRegistrationForm = () => {
    const { currentUser} = useSelector((state) => state.user);
    const [formData, setFormData] = useState({
        usernameregister:currentUser,
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
    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/checkregister',{usernameregister:currentUser}, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                SetuserRegister(data); // Save the fetched teams
            } catch (error) {
                console.error("Failed to fetch teams:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeams();
    }, []);
    const gameOptions = ["Liên Quân Mobile"];
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
                navigate('/arenaofvalor');
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
        const updatedGameMembers = { ...formData.gameMembers };
        updatedGameMembers[game][index] = value;
    
        // Check if the value exists elsewhere in the same game members list
        const isDuplicate = updatedGameMembers[game].filter((member) => member === value).length > 1;
    
        if (isDuplicate) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                gameMembers: `Thành viên "${value}" đã tồn tại.`
            }));
        } else {
            // Remove the error when no longer a duplicate
            const newErrors = { ...errors };
            delete newErrors.gameMembers;
            setErrors(newErrors);
        }
    
        setFormData({ ...formData, gameMembers: updatedGameMembers });
    };
    
    

    const addMember = (game) => {
        const updatedGameMembers = { ...formData.gameMembers };
        
        // Check if the game already has 9 members
        if (updatedGameMembers[game].length < 8) {
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
    
        // Temporary object to store errors
        let tempErrors = { ...errors };
    
        // Validate all fields
        const formFields = ["teamName", "shortName", "classTeam", "logoUrl", "games", "gameMembers"];
        formFields.forEach((field) => {
            validateField(field, formData[field]);
    
            // Update tempErrors based on validation results
            if (errors[field]) {
                tempErrors[field] = errors[field];
            }
        });
    
        // Check if there are still errors (including for duplicate members)
        if (Object.keys(tempErrors).length > 0) {
            setErrors(tempErrors); // Update the actual errors state
            setSubmitStatus({ success: false, message: "Please fix the errors in the form." });
            return;
        }
    
        // Proceed with form submission if no errors
        try {
            const response = await axios.post('https://dongchuyennghiep-backend.vercel.app/api/auth/registerAOV', formData);
            setSubmitStatus({ success: true, message: "Team registered successfully!" });
            setSignupSuccess(true);
    
            // Reset the form and errors state after successful submission
            setFormData({
                teamName: "",
                shortName: "",
                classTeam: "",
                logoUrl: "",
                games: [],
                gameMembers: {}
            });
            setErrors({});
        } catch (error) {
            if (error.response && error.response.data) {
                setSubmitStatus({ success: false, message: error.response.data.message || "Submission failed." });
            } else {
                setSubmitStatus({ success: false, message: error.response?.data?.message || error.message || "An unexpected error occurred." });
            }
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
                    <div className="mx-auto">
                        <div>
                            <h1 className="text-3xl font-bold text-center">Đơn đăng kí giải Arena Of Valor DCN: Season 2</h1>
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
                                    <label className="leading-loose font-semibold text-base-content" htmlFor="classTeam">Team bạn là của lớp nào</label>
                                    <input
                                        type="text"
                                        id="classTeam"
                                        name="classTeam"
                                        value={formData.classTeam}
                                        onChange={handleInputChange}
                                        className="px-4 py-2 border bg-white focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                        placeholder="Lớp của team bạn đang học"
                                    />
                                    {errors.classTeam && (
                                        <p className="text-red-500 text-xs italic">{errors.classTeam}</p>
                                    )}
                                </div>

                                <div className="flex flex-col">
                                    <label className="leading-loose font-semibold text-base-content" htmlFor="logoUrl">
                                    Logo ID của team bạn
                                    </label>
                                    <input
                                        type="text"
                                        id="logoUrl"
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


                                <div className="flex flex-col">
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
                                    <div key={game} className="flex flex-col mt-4">
                                        <label className="leading-loose text-base-content font-bold">Thành viên của game {game}</label>
                                        <small className="text-base-content mt-1">
                                        Mình khuyên phần này các bạn nên đọc{" "}
                                        <Link className="text-primary" to="https://docs.google.com/document/d/1zlei9yIWtSLfukegTeREZd8iwH2EUT1rTECH4F6Ph64/edit?tab=t.6823b1wcmvmd" target="_blank" rel="noopener noreferrer">
                                            <strong>lưu ý</strong>
                                        </Link>.
                                    </small>
                                        {formData.gameMembers[game].map((member, index) => (
                                            <div key={index} className="flex items-center space-x-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={member}
                                                    onChange={(e) => handleMemberChange(game, index, e.target.value)}
                                                    className="px-4 py-2 !text-base-content border focus:ring-gray-500 focus:border-primary w-full sm:text-sm border-gray-300 rounded-md focus:outline-none "
                                                    placeholder={`Username của thành viên ${index + 1}`}
                                                />

                                                {(game === "League Of Legends" || game === "Valorant" || game === "Liên Quân Mobile") && formData.gameMembers[game].length > 5 && (
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
