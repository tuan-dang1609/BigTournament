import React from "react";
import { Link } from "react-router-dom";

const LeagueHeader = ({ league, startTime, registerPhase, joinCountdown, currentUser, isMenuOpen, setIsMenuOpen, getNavigation, MyNavbar2 }) => {
    return (
        <>
            <header>
                <div
                    className="inset-0 bg-cover bg-center xl:aspect-[4/1] md:aspect-[3/1] sm:aspect-[2.4/1] aspect-[1.2/1]"
                    style={{
                        backgroundImage: `linear-gradient(0deg, rgb(6, 6, 6) 0%, rgba(6, 6, 6, 0.6) 50%, rgba(6, 6, 6, 0.4) 100%), url(${league.season.header_image_url})`,
                    }}
                    aria-label="Competition background"
                >
                    <div className="sm:relative z-10 h-full items-center flex sm:flex-row flex-col justify-center px-2 sm:text-left  text-center">
                        <div className="sm:mb-0 mb-4 sm:absolute relative md:left-5 left-0 sm:bottom-10 text-sm md:text-base text-white font-semibold pl-2 xl:pl-8">
                            <div className="text-sm font-bold mb-2 uppercase">
                                <p className="text-left">
                                    <span className="text-green-300">SẮP TỚI</span> • {new Date(startTime).toLocaleString('en-GB', {
                                        weekday: 'short',
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                                        timeZoneName: 'short'
                                    })}
                                </p>
                            </div>

                            <h1 className="md:text-[24px] text-[24px] xl:text-[40px] md:text-5xl text-left font-extrabold text-white sm:mb-4">
                                {league.league.name}
                            </h1>

                            <div className="text-sm text-gray-300">
                                Tổ chức bởi <span className="text-white font-semibold">{league.league.organizer_id}</span>
                            </div>
                        </div>


                        {registerPhase === 'before' && (
                            <div className="sm:absolute relative px-4 md:px-8  sm:right-0 sm:bottom-10 text-sm md:text-base text-white font-semibold text-center sm:text-right">
                                <div className="mb-2">
                                    Mở form sau: <span className="text-orange-500">{joinCountdown}</span>
                                </div>

                                {!currentUser ? (
                                    <Link to="/signin">
                                        <button className="bg-gradient-to-r from-[#f9febc] to-[#a8eabb] text-black font-bold px-4 py-2 rounded-md hover:opacity-90 transition duration-200">
                                            Đăng nhập để tham gia
                                        </button>
                                    </Link>
                                ) : (
                                    <Link to="https://discord.gg/crP48bD7" target="_blank" rel="noopener noreferrer">
                                        <button className="bg-gradient-to-r from-[#f9febc] to-[#a8eabb] text-black font-bold px-4 py-2 rounded-md hover:opacity-90 transition duration-200">
                                            Discord THPT Phú Nhuận
                                        </button>
                                    </Link>
                                )}
                            </div>
                        )}

                        {registerPhase === 'during' && (
                            <div className="sm:absolute relative px-4 md:px-8  right-0 bottom-10 text-sm md:text-base text-white font-semibold text-right">
                                <div className="mb-2">
                                    Time left to join: <span className="text-orange-500">{joinCountdown}</span>
                                </div>
                                <Link to="/tft/register">
                                    <button className="bg-gradient-to-r from-[#f9febc] to-[#a8eabb] text-black font-bold px-4 py-2 rounded-md hover:opacity-90 transition duration-200">
                                        Đăng ký
                                    </button>
                                </Link>
                            </div>
                        )}


                    </div>
                </div>
            </header>
            <div><MyNavbar2 navigation={getNavigation()} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} /></div>
        </>
    );
};

export default LeagueHeader;
