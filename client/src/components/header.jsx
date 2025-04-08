import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from 'axios'

const LeagueHeader = ({ league, league_id, startTime, currentUser, isMenuOpen, setIsMenuOpen, getNavigation, MyNavbar2 }) => {
    const [registerPhase, setRegisterPhase] = useState('idle');
    const [joinCountdown, setJoinCountdown] = useState('');
    const [isCheckinPhase, setIsCheckinPhase] = useState(false);
    const handleAutoRegister = async () => {
        try {
            const userRes = await axios.get(`https://bigtournament-hq9n.onrender.com/api/user/${currentUser._id}`);

            const userInfo = userRes.data;

            const formData = {
                shortName: "",
                logoUrl: userInfo.profilePicture,
                color: "",
                team: {
                    name: userInfo.team?.name || "",
                    logoTeam: userInfo.team?.logoTeam || ""
                },
                games: ["Teamfight Tactics"],
                gameMembers: {
                    "Teamfight Tactics": [userInfo.riotID || ""]
                },
                usernameregister: userInfo._id,
                discordID: userInfo.discordID || "",
            };

            const response = await axios.post(
                `https://bigtournament-hq9n.onrender.com/api/auth/register/${league_id}`,
                formData
            );
            console.log("✅ Server phản hồi:", response.data);

            // hoặc: navigate(`/tft/${league_id}`); nếu muốn redirect
            window.location.reload();

        } catch (err) {
            console.error("❌ Error auto registering:", err);
            alert("❌ Đăng ký thất bại!");
        }
    };
    const handleUnregister = async () => {
      
        try {
          const res = await axios.delete(`http://localhost:3000/api/auth/unregister/${league?.league?.league_id}`, {
            data: {
              usernameregister: currentUser._id,
            }
          });
      
          window.location.reload();
        } catch (err) {
          console.error("❌ Lỗi khi hủy đăng ký:", err);
          alert("Có lỗi xảy ra khi hủy đăng ký.");
        }
      };
      
    useEffect(() => {
        if (!league?.season?.checkin_start || !league?.season?.checkin_end) return;

        const checkinStart = new Date(league.season.checkin_start);
        const checkinEnd = new Date(league.season.checkin_end);
        const now = new Date();

        if (now >= checkinStart && now <= checkinEnd) {
            setIsCheckinPhase(true);
        } else {
            setIsCheckinPhase(false);
        }
    }, [league]);
    useEffect(() => {
        if (!league || !startTime) return;

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

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);
            setJoinCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [league, startTime]);
    const currentPlayer = league?.players?.find(
        (p) => String(p.usernameregister) === String(currentUser?._id)
    );

    const isCheckedin = currentPlayer?.isCheckedin === true;

    const handleCheckin = async () => {
        try {
            const res = await fetch(`https://bigtournament-hq9n.onrender.com/api/auth/league/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    league_id: league.league.league_id,
                    game_short: league.league.game_short,
                    userId: currentUser._id
                })
            });

            const result = await res.json();
            if (res.ok) {
                window.location.reload(); // hoặc gọi lại API lấy league mới
            } else {
                alert("❌ Check-in thất bại: " + result.message);
            }
        } catch (err) {
            console.error("❌ Check-in error:", err);
            alert("Lỗi khi check-in.");
        }
    };

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
                                    <span className="text-[#00ff5c]">SẮP TỚI</span> • {new Date(startTime).toLocaleString('en-GB', {
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
                            <div className="sm:absolute relative px-4 md:px-8 sm:right-0 sm:bottom-10 text-sm md:text-base text-white font-semibold text-center sm:text-right">
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
  <div className="sm:absolute relative px-4 md:px-8 right-0 bottom-10 text-sm md:text-base text-white font-semibold text-right">
    <div className="mb-2 sm:mt-0 mt-12">
        Thời gian còn lại: <span className="text-orange-500">{joinCountdown}</span>   
    </div>

    <div className={`flex ${currentPlayer ? "sm:justify-end justify-center gap-2" : "sm:justify-end justify-center"}`}>
      {currentPlayer && (
        <button
          onClick={handleUnregister}
          className="bg-red-500 text-white font-bold px-4 py-2 rounded-md hover:bg-red-600 transition duration-200"
        >
          Hủy đăng ký
        </button>
      )}
      <button
        onClick={handleAutoRegister}
        className="bg-gradient-to-r from-[#f9febc] to-[#a8eabb] text-black font-bold px-4 py-2 rounded-md hover:opacity-90 transition duration-200"
      >
        {currentPlayer ? "Cập nhật" : "Đăng ký"}
      </button>
    </div>
  </div>
)}
                        {isCheckinPhase && currentUser && (
                            <div className="sm:absolute relative px-4 md:px-8 right-0 bottom-10 text-sm md:text-base text-white font-semibold text-right">
                                <div className="mb-2">
                                    Đang trong thời gian check-in!
                                </div>

                                {isCheckedin ? (
                                    <button
                                        disabled
                                        className="bg-gray-400 text-white font-bold px-4 py-2 rounded-md cursor-not-allowed"
                                    >
                                        ✅ Đã check-in
                                    </button>
                                ) : (
                                    <button
                                        className="bg-gradient-to-r from-[#f9febc] to-[#a8eabb] text-black font-bold px-4 py-2 rounded-md hover:opacity-90 transition duration-200"
                                        onClick={handleCheckin}
                                    >
                                        Check-in
                                    </button>
                                )}
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
