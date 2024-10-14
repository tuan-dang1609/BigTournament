import React, { useState } from "react";
import { FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa";
import { IoMdArrowDown } from "react-icons/io";
import { GiDragonHead } from "react-icons/gi";
import ImageDCN from '../image/waiting.png'
import LQ from '../image/LienQuan.jpg'
const CompetitionPage = () => {
    const teams = [
        
        {
            name: "Dragon Slayers",
            logo: "https://images.unsplash.com/photo-1577493340887-b7bfff550145?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
            players: ["John Doe", "Jane Smith", "Mike Johnson"]
        },
        {
            name: "Fire Breathers",
            logo: "https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
            players: ["Emily Brown", "David Lee", "Sarah Wilson"]
        },
        {
            name: "Scale Warriors",
            logo: "https://images.unsplash.com/photo-1531923664628-bf4b6e9c7220?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
            players: ["Tom Jackson", "Lisa Chen", "Robert Taylor"]
        },
        {
            name: "Wing Riders",
            logo: "https://images.unsplash.com/photo-1615963244664-0b3a58f74246?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
            players: ["Emma Davis", "Chris Martin", "Olivia Wang"]
        },
        {
            name: "Claw Crushers",
            logo: "https://images.unsplash.com/photo-1590419690008-905895e8fe0d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
            players: ["Alex Johnson", "Sophia Lee", "Daniel Kim", "Desoto", "Beacon"]
        },
        {
            name: "Flame Tamers",
            logo: "https://images.unsplash.com/photo-1566837945700-30057527ade0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
            players: ["Rachel Green", "Joey Tribbiani", "Chandler Bing"]
        }
    ];

    const scrollToContent = () => {
        const contentSection = document.getElementById("content-section");
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
                    <div className="text-6xl mb-6 text-red-500 flex items-center justify-center">
                        <img src={ImageDCN} alt="DCN logo" className="h-32 w-32" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold mb-4 animate-fade-in-down">Giải Liên Quân Mobile DCN: Season 2 </h1>
                    <p className="text-xl md:text-xl mb-8 animate-fade-in-up">Trình độ là tri thức, bức phá mọi tư duy</p>
                    <button className="bg-primary hover:bg-secondary text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300 ease-in-out transform hover:scale-105 animate-pulse">Đăng kí ngay</button>
                </div>
                <button onClick={scrollToContent} className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-4xl animate-bounce">
                    <IoMdArrowDown />
                </button>
            </header>

            {/* Content Section */}
            <section id="content-section" className="py-16 px-4 md:px-8 bg-base-100 text-base-content">
            <div className="max-w-6xl mx-auto">
    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">Competing Teams</h2>

    {/* Regular grid layout for full rows */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {teams.slice(0, Math.floor(teams.length / 4) * 4).map((team, index) => (
            <TeamCard key={index} team={team} className="w-full h-full max-w-[250px] mx-auto" />
        ))}
    </div>

    {/* Center the last row if there are fewer than 4 items */}
    {teams.length % 4 !== 0 && (
        <div className={`grid gap-8 mt-8 grid-cols-${teams.length % 4} justify-center`}>
            {teams.slice(-(teams.length % 4)).map((team, index) => (
                <TeamCard key={index} team={team} className="w-full h-full max-w-[250px] mx-auto" />
            ))}
        </div>
    )}
</div>


            </section>


        </div>
    );
};

const TeamCard = ({ team }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="bg-gray-700 p-2 lg:p-6 rounded-lg shadow-lg text-center transition duration-300 ease-in-out"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)
            }
        >
            <div className="w-full h-48 mb-4 overflow-hidden relative">
                <img
                    src={team.logo}
                    alt={`${team.name} logo`}
                    className={`w-full h-full xl:block hidden object-cover transition-opacity duration-300 ${isHovered ? 'lg:opacity-0' : 'opacity-100'}`}
                />
                <div className={`absolute inset-0 flex flex-col justify-center items-center transition-opacity duration-300 ${isHovered ? 'lg:opacity-100' : 'opacity-0'} hidden lg:flex`}>
                    {team.players.map((player, playerIndex) => (
                        <div key={playerIndex} className="h-1/3 flex items-center justify-center text-sm">{player}</div>
                    ))}
                </div>
                <div className="lg:hidden absolute inset-0 flex items-center">
                    <div className="w-2/5">
                        <img
                            src={team.logo}
                            alt={`${team.name} logo`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="w-3/5 h-full inset-0 flex flex-col justify-center items-center">
                        {team.players.map((player, playerIndex) => (
                            <div key={playerIndex} className="h-1/3 flex items-center justify-center text-sm">{player}</div>
                        ))}
                    </div>
                </div>
            </div>
            <h3 className="text-lg font-semibold">{team.name}</h3>
        </div>
    );
};

export default CompetitionPage;