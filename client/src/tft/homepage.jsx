import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";;
import { useSelector } from "react-redux";
import 'animate.css';
import MyNavbar2 from "../components/Navbar2";
// Custom hook to detect screen size
import { useParams } from 'react-router-dom';
import LeagueHeader from "../components/header";
import { useLeagueData } from "../hooks/useLeagueData";


const CompetitionPage = () => {
    const [loading, setLoading] = useState(true);
    const { currentUser } = useSelector((state) => state.user);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [joinCountdown, setJoinCountdown] = useState('');
    const [registerPhase, setRegisterPhase] = useState('idle');
    const { game, league_id } = useParams();
    const { league,  startTime } = useLeagueData(game, league_id);
    const registered = parseInt(league?.season?.current_team_count) || 0;
    const max = parseInt(league?.season?.max_registration) || 64;
    const percent = Math.min((registered / max) * 100, 100);
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
        document.title = "Giải Teamfight Tactics DCN";

    }, []);



    const navigationAll1 = {
        aov: [
            { name: "Tổng quan", href: `/${game}/${league_id}`, current: location.pathname === `/${game}/${league_id}` },
            { name: "Người chơi", href: `/${game}/${league_id}/players`, current: location.pathname === `/${game}/${league_id}/players` },
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

            {/* Content Section */}
            <section id="participant" className="py-10 lg:py-16 px-2 md:px-8 flex lg:flex-row flex-col text-white">
                <div className="xl:w-[68%] lg:w-[70%] w-full  px-2 xl:px-8">
                    <div className="font-semibold">
                        <h2 className="text-3xl md:text-2xl font-bold mb-8">Thông tin</h2>
                        <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-y-10 uppercase ">
                            <div className="flex flex-row gap-x-1">
                                <div>
                                    <img src="/image/tft_icon.png" width={50} height={48} />
                                </div>
                                <div>
                                    <p className="lg:text-[14px] text-[#a7a7a7]">Game</p>
                                    <p className="lg:text-[14px]">{league.league.game_name}</p>
                                </div>
                            </div>
                            <div className="flex flex-row gap-x-2">
                                <div>
                                    <img src="/image/team_icon.png" width={48} height={48} />
                                </div>
                                <div>
                                    <p className="lg:text-[14px] text-[#a7a7a7]">Số người trong đội</p>
                                    <p className="lg:text-[14px]">{league.league.players_per_team}</p>
                                </div>
                            </div>
                            <div className="flex flex-row gap-x-2">
                                <div><svg xmlns="http://www.w3.org/2000/svg" fill="#fff" viewBox="0 0 24 24" width="48" height="48">
                                    <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.866 0-7 2.239-7 5v2h14v-2c0-2.761-3.134-5-7-5z" />
                                </svg></div>
                                <div>
                                    <p className="lg:text-[14px] text-[#a7a7a7]">Giới hạn người chơi</p>
                                    <p className="lg:text-[14px]">{league.season.max_registration}</p>
                                </div>
                            </div>
                            <div className="flex flex-row gap-x-2">
                                <div><img src="/image/prize.png" width={48} height={48} /></div>
                                <div>
                                    <p className="lg:text-[14px] text-[#a7a7a7]">Tổng giải thưởng</p>
                                    <p className="lg:text-[14px]">{league.season.total_prize_pool} VND</p>
                                </div>
                            </div>

                            <div className="flex flex-row gap-x-2">
                                <div><img src="/image/schedule.png" width={48} height={48} /></div>
                                <div>
                                    <p className="lg:text-[14px] text-[#a7a7a7]">Bắt đầu</p>
                                    <p className="lg:text-[14px]">{new Date(league.season.time_start).toLocaleString('en-GB', {
                                        weekday: 'short',
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                                        timeZoneName: 'short'
                                    })}</p>
                                </div>
                            </div>
                            <div className="flex flex-row gap-x-2">
                                <div><img src="/image/schedule.png" width={48} height={48} /></div>
                                <div>
                                    <p className="lg:text-[14px] text-[#a7a7a7]">Kết thúc</p>
                                    <p className="lg:text-[14px]">{new Date(league.season.time_end).toLocaleString('en-GB', {
                                        weekday: 'short',
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                                        timeZoneName: 'short'
                                    })}</p>
                                </div>
                            </div>

                        </div>
                    </div>
                    <section className=" py-12 text-white ">
                        <h2 className="text-3xl md:text-2xl font-bold mb-8">Tiến Trình</h2>
                        <div className="space-y-8">
                            {league?.milestones.map((item, index) => {
                                const date = new Date(item.date);
                                const isPast = date < new Date();

                                return (
                                    <div key={index} className="flex flex-row md:items-start gap-4">
                                        <div className="text-orange-500 text-xl">
                                            {isPast ? (
                                                <img src="/image/completed.png" width={24} height={24} />
                                            ) : (
                                                <img src="/image/ongoing.png" width={24} height={24} />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm text-gray-400 mb-1">
                                                {date.toLocaleString('en-GB', {
                                                    weekday: 'short',
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                                                    timeZoneName: 'short'
                                                })}
                                            </div>
                                            <div className="font-bold text-lg mb-1">{item.title}</div>
                                            {item.content && (
                                                <p className="text-sm text-gray-300 whitespace-pre-line">{item.content}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                </div>
                <div className="xl:w-[32%] lg:w-[30%] w-full px-2 xl:px-8">
                    <section className=" text-white ">
                        {/* TEAMS */}
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">Người chơi</h2>
                            <Link to={`/${game}/${league_id}/players`}>
                                <button className="text-orange-500 font-bold hover:underline text-sm">XEM TẤT CẢ</button>
                            </Link>
                        </div>

                        <div className="border border-gray-700 rounded-lg p-4 flex items-center space-x-3 mb-10">
                            <div className="relative w-8 h-8">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="16"
                                        stroke="#333"
                                        strokeWidth="4"
                                        fill="none"
                                    />
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="16"
                                        stroke="#ff6600"
                                        strokeWidth="4"
                                        fill="none"
                                        strokeDasharray={`${(percent / 100) * 100} 100`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="#fff" viewBox="0 0 24 24" width="16" height="16">
                                        <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.866 0-7 2.239-7 5v2h14v-2c0-2.761-3.134-5-7-5z" />
                                    </svg>
                                </div>
                            </div>

                            <span className="text-[14px] font-medium">
                                {parseInt(league?.season?.current_team_count).toLocaleString()} /{" "}
                                {parseInt(league?.season?.max_registration).toLocaleString()}
                            </span>
                        </div>

                        {/* REQUIREMENTS */}
                        <h2 className="text-[22px] font-bold mb-4">Yêu cầu</h2>
                        <div className="border border-gray-700 rounded-lg p-4 space-y-4 mb-10">
                            {/* Skill Level */}
                            <div className="flex flex-row items-stretch w-full justify-between">
                                {/* Skill Level label - align top */}
                                <div className="flex items-center">
                                    <p className="text-[14px] text-white font-bold ">Mức rank</p>
                                </div>

                                {/* Image row - align bottom */}
                                <div className="flex items-center space-x-2 self-end">
                                    <img
                                        src={`/ranklol/${league?.league?.skill_levels?.[0]}.png`}
                                        width={60}
                                        height={60}
                                        alt="Min Rank"
                                    />
                                    <span className="text-white text-[14px]">-</span>
                                    <img
                                        src={`/ranklol/${league?.league?.skill_levels?.slice(-1)[0]}.png`}
                                        width={48}
                                        height={48}
                                        alt="Max Rank"
                                    />
                                </div>
                            </div>


                            <hr className="border-gray-700" />

                            {/* Subscription */}
                            <div className="flex flex-row justify-between h-[48px] items-center">
                                <div className="text-[14px] text-white font-bold">Trường</div>
                                <div>

                                    <span className="font-bold">{league.league.school_allowed}</span>

                                </div>
                            </div>
                            <hr className="border-gray-700" />
                            <div className="flex flex-row justify-between h-[48px] items-center">
                                <div className="text-[14px] text-white font-bold">Vào Discord PN</div>
                                <div>

                                    <span className="font-bold">Có</span>

                                </div>
                            </div>
                        </div>
                        <h2 className="text-[22px] font-bold mb-4">Thông tin</h2>
                        <div className="border border-gray-700 rounded-lg p-4 space-y-4 mb-4">

                            {/* Subscription */}
                            <div className="flex flex-row justify-between h-[48px] items-center">
                                <div className="text-[14px] text-white font-bold">Facebook</div>
                                <div>

                                    <a className="text-[14px] font-bold text-orange-500" href="https://www.facebook.com/dongchuyennghiep">Dong Chuyen Nghiep</a>

                                </div>
                            </div>
                            <hr className="border-gray-700" />
                            <div className="flex flex-row justify-between h-[48px] items-center">
                                <div className="text-[14px] text-white font-bold">Discord</div>
                                <div>

                                    <a className="text-[14px] font-bold text-orange-500" href="https://discord.gg/crP48bD7">THPT Phú Nhuận</a>

                                </div>
                            </div>
                        </div>
                        <h2 className="text-[22px] font-bold mb-4">Giải thưởng</h2>
                        <div className="border border-gray-700 rounded-lg p-4 space-y-4 mb-10">

                            {league?.prizepool?.slice(0, 4).map((item, index) => (
                                <div key={index}>
                                    <div
                                        className={`flex flex-row justify-between h-[48px] items-center ${index !== 0 ? 'mt-[16px]' : ''
                                            }`}
                                    >
                                        <div className="text-[14px] text-white font-bold">{item.place}</div>
                                        <div className="text-[14px] font-bold text-orange-500">{item.prize}</div>
                                    </div>
                                    {index < 3 && <hr className="border-gray-700 mt-[16px]" />}
                                </div>
                            ))}

                        </div>
                    </section>
                </div>
            </section>
        </div>
    );
};

export default CompetitionPage;
