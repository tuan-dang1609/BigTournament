import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";;
import { useSelector } from "react-redux";
import 'animate.css';
import MyNavbar2 from "../components/Navbar2";
// Custom hook to detect screen size
import { useParams } from 'react-router-dom';
import LeagueHeader from "../components/header";
import { useLeagueData } from "../hooks/useLeagueData";

const MemberPage = () => {
    const [loading, setLoading] = useState(true);
    const { currentUser } = useSelector((state) => state.user);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [joinCountdown, setJoinCountdown] = useState('');
    const [registerPhase, setRegisterPhase] = useState('idle');
    const { game, league_id } = useParams();
    const { league, startTime } = useLeagueData(game, league_id);
    const max = parseInt(league?.season?.max_registration) || 64;
    const currentPlayer = league?.players?.find(
        (p) => String(p.usernameregister) === String(currentUser?._id)
    );

    const isCheckedin = currentPlayer?.isCheckedin === true;

    // GMT+0 => GMT+3 = 15:00
    useEffect(() => {
        if (!startTime) return;
        if (!league?.season?.registration_start || !league?.season?.registration_end) return;

        const regStart = new Date(league.season.registration_start);
        const regEnd = new Date(league.season.registration_end);

        const updateCountdown = () => {
            const now = new Date();
            let diff;
            if (now < regStart) {
                diff = regStart - now;
                setRegisterPhase('before');
            } else if (now >= regStart && now <= regEnd) {
                diff = regEnd - now;
                setRegisterPhase('during');
            } else {
                setRegisterPhase('after');
                return;
            }

            if (diff <= 0) return;

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);
            setJoinCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        };


        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [league]);


    useEffect(() => {
        const scrollToTop = () => {
            document.documentElement.scrollTop = 0;
            setLoading(false);
        };
        setTimeout(scrollToTop, 0);
        if(league){
            document.title = `${league.league.name}`;

        }

    }, [league]);


    const navigationAll1 = {
        aov: [
            { name: "Tổng quan", href: `/${game}/${league_id}`, current: location.pathname === `/${game}/${league_id}` },
            { name: "Người chơi", href: `/${game}/${league_id}/players`, current: location.pathname === `/${game}/${league_id}/players` },
            { name: "Luật", href: `/${game}/${league_id}/rule`, current: location.pathname === `/${game}/${league_id}/rule` },
        ],
    };
    const getNavigation = () => navigationAll1.aov;
    if (!league) {
        return (
            <div className="min-h-screen flex justify-center items-center text-white ">
                <span className="loading loading-dots loading-lg text-primary">Loading league...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col text-white">
            {/* Header Section */}
            <LeagueHeader
                league={league}
                startTime={league.season.time_start}
                currentUser={currentUser}
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
                getNavigation={getNavigation}
                MyNavbar2={MyNavbar2}
                league_id={league_id}
            />

            <div className="p-4 md:px-8">
                <h2 className="text-2xl font-bold mb-4">Người chơi đã đăng ký</h2>
                <div className="overflow-x-auto">
                    <table className="table-auto w-full border-separate border-spacing-y-2">
                        <thead>
                            <tr className="text-left text-gray-400 uppercase text-sm">
                                <th className="pl-16">Người chơi</th>
                                <th className="text-right pr-2">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {league.players.map((team, index) => {
                                return (
                                    <tr key={index} className="hover:bg-gray-800 transition duration-200">
                                        <td className="flex items-center space-x-4 py-2 pl-2">
                                            {/* Logo đội */}
                                            <img
                                                src={team.team?.logoTeam ? `https://drive.google.com/thumbnail?id=${team.team.logoTeam}` : ""}
                                                alt="team-logo"
                                                className={`w-10 h-10 rounded-full object-cover ${team.team?.logoTeam ? '' : 'invisible'}`}
                                            />

                                            {/* Logo người chơi + tên */}
                                            <div className="flex items-center space-x-4">
                                                <img
                                                    src={`https://drive.google.com/thumbnail?id=${team.logoUrl}`}
                                                    alt="player-logo"
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                                <span className="text-white font-semibold sm:text-[15px] text-[12px]">{team.ign}</span>
                                            </div>
                                    
                                        </td>

                                        <td
                                            className={`font-bold text-right sm:text-[15px] text-[12px] pr-2 ${team.isCheckedin ? 'text-green-500' : 'text-red-500'
                                                }`}
                                        >
                                            {team.isCheckedin ? 'Checked-in' : 'Chưa check-in'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                </div>
            </div>


        </div>
    );
};

export default MemberPage;
