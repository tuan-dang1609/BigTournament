import React, { useState, useEffect } from "react";
import { FaTrophy } from "react-icons/fa";
import { IoMdAlert } from "react-icons/io";
import axios from "axios";

const TeamPageHOF = () => {
    // Đặt selectedLeague từ localStorage hoặc giá trị mặc định là "season1"
    const [selectedLeague, setSelectedLeague] = useState(() => localStorage.getItem("selectedLeague") || "season1");
    const [leagues, setLeagues] = useState([]);
    const [teamsData, setTeamsData] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = "Sảnh danh vọng Valorant";
        const fetchLeagues = async () => {
            try {
                const response = await axios.post("https://dongchuyennghiep-backend.vercel.app/api/auth/leagues/list");
                const filteredLeagues = response.data.filter(league => league.game === "Valorant");
                setLeagues(filteredLeagues);
            } catch (err) {
                setError("Không thể tải danh sách giải đấu.");
            }
        };
        fetchLeagues();
    }, []);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await axios.post(`https://dongchuyennghiep-backend.vercel.app/api/auth/teams/${selectedLeague}`);
                const arenaTeams = response.data
                    .filter(team => team.game === "Valorant")
                    .sort((a, b) => a.rank - b.rank);

                setTeamsData(arenaTeams);
            } catch (err) {
                setError("Không thể tải dữ liệu đội. Vui lòng thử lại sau.");
            } finally {
                setLoading(false);
            }
        };

        if (selectedLeague) {
            setLoading(true);
            fetchTeams();
        }
    }, [selectedLeague]);

    const handleLeagueSelect = (leagueId) => {
        setSelectedLeague(leagueId);
        localStorage.setItem("selectedLeague", leagueId); // Lưu trạng thái vào localStorage
        setLoading(true);
        document.documentElement.scrollTop = 0;
    };

    const ErrorMessage = () => (
        <div className="flex items-center justify-center p-4 bg-red-100 rounded-lg" role="alert">
            <IoMdAlert className="text-red-500 text-xl mr-2" />
            <p className="text-red-700">{error}</p>
        </div>
    );

    const TeamCard = ({ team }) => (
        <div
            className="p-6 mb-10 transition-all duration-300 w-full mx-auto max-w-[100%]"
            role="article"
            aria-label={`${team.name} team card`}
        >
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        {team.rank <= 3 && (
                            <div className="relative mr-4">
                                <FaTrophy className={`text-4xl ${team.rank === 1 ? "text-yellow-400" : team.rank === 2 ? "text-gray-400" : "text-orange-400"}`} />
                                <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-white text-black rounded-full text-xs font-bold px-1">{team.rank}</span>
                            </div>
                        )}
                        <img
                            src={`https://drive.google.com/thumbnail?id=${team.logo}`}
                            alt={`${team.name} logo`}
                            className="lg:w-20 lg:h-20 w-14 h-14 object-cover"
                        />
                        <h3 className="lg:text-2xl text-[15px] font-bold">{team.name}</h3>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-3 gap-y-1">
                    {team.players.map((player) => (
                        <div
                            key={player._id || `${team._id}-${player.name}`} // Sử dụng _id của player hoặc kết hợp team._id và player.name làm key
                            className="flex flex-col items-center rounded-lg p-3 transition-all duration-300 hover:bg-secondary w-full"
                            role="listitem"
                            aria-label={`Player ${player.name}`}
                        >
                            <img
                                src={`https://drive.google.com/thumbnail?id=${player.avatar}`}
                                alt={player.name}
                                className="lg:w-20 lg:h-20 w-14 h-14 rounded-full object-cover"
                            />
                            <span className="font-medium text-[15px] text-center mt-4">{player.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-base-100 mt-16">
            {loading ? (
                <div className="flex justify-center items-center min-h-screen w-full">
                    <span className="loading loading-dots loading-lg text-primary"></span>
                </div>
            ) : (
                <>
                    <div className="fixed w-[20%] h-screen bg-base-100 shadow-xl hidden xl:block overflow-y-auto">
                        <div className="mt-8">
                            <h2 className="text-2xl font-bold mb-6 text-center">Các mùa</h2>
                            <div className="flex flex-col space-y-3">
                                {leagues.map((league) => (
                                    <button
                                        key={league.id}
                                        onClick={() => handleLeagueSelect(league.id)}
                                        className={`p-4 rounded-lg font-semibold transition-all duration-300 text-left ${selectedLeague === league.id ? league.color : ""}`}
                                        aria-pressed={selectedLeague === league.id}
                                    >
                                        <span>{league.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:hidden w-full bg-base-100 shadow-lg p-4 fixed top-0 mt-[70px] z-10">
                        <select
                            value={selectedLeague}
                            onChange={(e) => handleLeagueSelect(e.target.value)}
                            className="w-full p-2 border-2 border-gray-200 rounded-lg"
                        >
                            {leagues.map((league) => (
                                <option key={league.id} value={league.id}>
                                    {league.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="lg:w-[80%] py-12 px-4 sm:px-6 lg:px-8 lg:mt-0 md:mt-10 lg:ml-[20%] w-full">
                        <div className="max-w-[1400px] mx-auto">
                            <h1 className="text-4xl font-bold text-center mb-12 mt-16 md:mt-0">Sảnh danh vọng các đội</h1>

                            <div className="space-y-4">
                                {error && <ErrorMessage />}
                                {teamsData.length > 0 ? (
                                    teamsData.map((team) => (
                                        <React.Fragment key={team._id || team.name}>
                                            <TeamCard team={team} />
                                            <div key={`divider-${team._id || team.name}`} className="border-t border-gray-300 my-6 last:border-none"></div>
                                        </React.Fragment>
                                    ))
                                ) : (
                                    !error && <p className="text-center">Đang tải dữ liệu...</p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default TeamPageHOF;
