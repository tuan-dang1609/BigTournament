import React, { useState, useEffect } from "react";
import { IoMdArrowDown } from "react-icons/io";
import ImageDCN from '../image/waiting.png';
import LQ from '../image/LienQuan.jpg';
import { Link } from "react-router-dom";
import { FaMedal } from "react-icons/fa";
import 'animate.css';
const CompetitionPage = () => {
    const [loading, setLoading] = useState(true);
    const [teams, setTeams] = useState([]);
    const prizePool = [
        { place: "1st", prize: "TBD", color: "#FFD700" }, // Gold
        { place: "2nd", prize: "TBD", color: "#C0C0C0" },  // Silver
        { place: "3rd", prize: "TBD", color: "#CD7F32" }   // Bronze
    ];
    useEffect(() => {
        const scrollToTop = () => {
            document.documentElement.scrollTop = 0;
            setLoading(false);
        };
        setTimeout(scrollToTop, 0);
        document.title = "Giải Liên Quân Mobile DCN";

    }, []);
    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/findallteamAOV', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setTeams(data); // Save the fetched teams
            } catch (error) {
                console.error("Failed to fetch teams:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeams();
    }, []);

    const scrollToContent = () => {
        const contentSection = document.getElementById("participant");
        contentSection.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="min-h-screen flex flex-col text-white">
            {/* Header Section */}
            <header className="relative h-screen">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${LQ})` }}
                    aria-label="Competition arena with spotlights"
                >
                    <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                </div>
                <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4">
                    <div className="text-6xl animate__animated animate__fadeIn mb-6 text-red-500 flex items-center justify-center">
                        <img src={ImageDCN} alt="DCN logo" className="h-32 w-32" />
                    </div>
                    <h1 className="text-6xl md:text-7xl animate__animated animate__fadeIn font-extrabold mb-6 animate-fade-in-down bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Giải Liên Quân Mobile DCN: Season 2 </h1>
                    <p className="animate__animated animate__fadeIn text-xl md:text-xl mb-8 animate-fade-in-up">Bản lĩnh tạo nên nhà vô địch, tư duy làm nên huyền thoại!</p>
                    <Link to="/arenaofvalor/register"><button className="animate__animated animate__fadeInUp bg-gradient-to-r from-primary to-accent hover:from-primary hover:to-accent text-white font-bold py-4 px-10 rounded-full text-xl transform hover:scale-105 shadow-lg">Đăng kí ngay</button></Link>
                </div>
                <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                    <button
                        onClick={scrollToContent}
                        className="absolute bottom-8 text-secondary hover:text-secondary transform -translate-x-1/2 text-4xl animate-bounce z-20 flex justify-center items-center"
                    >
                        <IoMdArrowDown />
                    </button>
                </div>

            </header>

            {/* Content Section */}
            <section id="participant" className="py-20 px-4 md:px-8 bg-gradient-to-b text-white">
                <div className="mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center text-primary">Các đội tham dự giải đấu</h2>

                    {loading ? (
                        <div className="flex items-center justify-center pt-24">
                        <span className="loading loading-dots loading-lg text-primary"></span>
                      </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                {teams.map((team, index) => (
                                    <TeamCard key={index} team={team} />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Prize Pool Section */}
            <div className="my-16 px-4">
    <h2 className="max-w-xl mx-auto text-4xl md:text-5xl font-bold mb-10 text-center text-primary"> {/* Removed bg-clip-text */}
        Giải thưởng
    </h2>
    <div className="mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {prizePool.map((prize, index) => (
                <div key={index} className="text-center bg-gray-800 rounded-lg p-6 shadow-xl transform hover:scale-105 transition duration-300 ease-in-out">
                    <div className="text-6xl mb-4 flex justify-center" style={{ color: prize.color }}>
                        <FaMedal />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{prize.place}</h3>
                    <p className="text-3xl font-semibold text-green-400">{prize.prize}</p>
                </div>
            ))}
        </div>
    </div>
</div>




        </div>
    );
};

const TeamCard = ({ team }) => {
    const [isHovered, setIsHovered] = useState(false);

    // Build the Google Drive image URL
    const logoUrl = `https://drive.google.com/thumbnail?id=${team.logoUrl}`;
    const players = team.gameMembers["Liên Quân Mobile"];

    return (
        <div
            className="bg-gray-700 py-1 lg:p-5 rounded-lg shadow-lg text-center transition duration-300 ease-in-out"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="w-full h-48  overflow-hidden relative">
                <img
                    src={logoUrl}
                    alt={`${team.teamName} logo`}
                    className={`w-full h-full lg:block hidden object-contain transition-opacity duration-300 ${isHovered ? 'lg:opacity-[.17]' : 'opacity-100'}`}
                />
                <div className={`absolute inset-0 flex flex-col justify-center items-center transition-opacity duration-300 ${isHovered ? 'lg:opacity-100' : 'opacity-0'} hidden lg:flex`}>
                    {players.map((player, playerIndex) => (
                        <div key={playerIndex} className="h-1/3 flex items-center font-semibold justify-center text-[14px]">{player}</div>
                    ))}
                </div>
                <div className="lg:hidden absolute inset-0 flex items-center border-b-2">
                    <div className="w-5/12 px-1 flex justify-center items-center">
                        <img
                            src={logoUrl}
                            alt={`${team.teamName} logo`}
                            className="max-w-[65%]  max-h-[65%] object-contain" // Ensure the image scales properly without distortion
                        />
                    </div>
                    <div className="w-7/12 h-full inset-0 flex flex-col justify-center items-center border-l-2">
                        {players.map((player, playerIndex) => (
                            <div key={playerIndex} className="h-1/3 flex items-center justify-center text-[15px] font-semibold">{player}</div>
                        ))}
                    </div>
                </div>

            </div>
            <h3 className="text-lg pt-3 pb-2 font-bold animate-fade-in-down bg-clip-text text-transparent bg-gradient-to-r from-secondary to-accent">{team.teamName}</h3>
        </div>
    );
};

export default CompetitionPage;
