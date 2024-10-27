import React, { useState, useEffect } from "react";
import { FaTrophy } from "react-icons/fa";
import { IoMdAlert } from "react-icons/io";
import { MdArrowBack } from "react-icons/md";
import axios from "axios"; // Thêm axios để gọi API

const TeamPage = () => {
    const [selectedLeague, setSelectedLeague] = useState("pro");
    const [leagues, setLeagues] = useState([]);
    const [teamsData, setTeamsData] = useState({});
    const [error, setError] = useState(null);

    // Lấy danh sách leagues từ API khi component được render lần đầu
    useEffect(() => {
        const fetchLeagues = async () => {
            try {
                const response = await axios.post("https://dongchuyennghiep-backend.vercel.app/api/auth/leagues/list"); // Đảm bảo đường dẫn phù hợp với backend của bạn
                setLeagues(response.data);
            } catch (err) {
                setError("Không thể tải danh sách giải đấu.");
            }
        };

        fetchLeagues();
    }, []);

    // Lấy dữ liệu teams dựa trên selectedLeague
    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await axios.post(`https://dongchuyennghiep-backend.vercel.app/api/auth/teams/${selectedLeague}`);
                setTeamsData({ [selectedLeague]: response.data });
            } catch (err) {
                setError("Không thể tải dữ liệu đội. Vui lòng thử lại sau.");
            }
        };

        if (selectedLeague) {
            fetchTeams();
        }
    }, [selectedLeague]);

    const ErrorMessage = () => (
        <div className="flex items-center justify-center p-4 bg-red-100 rounded-lg" role="alert">
            <IoMdAlert className="text-red-500 text-xl mr-2" />
            <p className="text-red-700">{error}</p>
        </div>
    );

    const TeamCard = ({ team, rank }) => (
        <div
            className="p-6 mb-10 transition-all duration-300 w-full mx-auto max-w-[100%]"
            role="article"
            aria-label={`${team.name} team card`}
        >
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        {rank <= 3 && (
                            <div className="relative mr-4">
                                <FaTrophy className={`text-2xl ${rank === 1 ? "text-yellow-400" : rank === 2 ? "text-gray-400" : "text-orange-400"}`} />
                                <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-white rounded-full text-xs font-bold px-1">{rank}</span>
                            </div>
                        )}
                        <img
                            src={team.logo}
                            alt={`${team.name} logo`}
                            className="w-20 h-20 rounded-full object-cover"
                        />
                        <h3 className="text-2xl font-bold">{team.name}</h3>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-3">
                    {team.players.map((player, index) => (
                        <div
                            key={index}
                            className="flex flex-col items-center rounded-lg p-3 transition-all duration-300 hover:bg-secondary w-full"
                            role="listitem"
                            aria-label={`Player ${player.name}`}
                        >
                            <img
                                src={player.avatar}
                                alt={player.name}
                                className="w-20 h-20 rounded-full object-cover"
                            />
                            <span className="font-medium text-center mt-4">{player.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-base-100 mt-16">
            {/* Sidebar */}
            <div className="fixed w-[20%] h-screen bg-base-100 shadow-xl hidden md:block overflow-y-auto">
                <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-6 text-center">Leagues</h2>
                    <div className="flex flex-col space-y-3">
                        {leagues.map((league) => (
                            <button
                                key={league.id}
                                onClick={() => setSelectedLeague(league.id)}
                                className={`p-4 rounded-lg font-semibold transition-all duration-300 text-left ${selectedLeague === league.id ? league.color : ""}`}
                                aria-pressed={selectedLeague === league.id}
                            >
                                {league.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="lg:hidden w-full bg-base-100 shadow-lg p-4 fixed top-0 mt-[70px] z-10">
                <select
                    value={selectedLeague}
                    onChange={(e) => setSelectedLeague(e.target.value)}
                    className="w-full p-2 border-2 border-gray-200 rounded-lg"
                >
                    {leagues.map((league) => (
                        <option key={league.id} value={league.id}>
                            {league.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Main Content */}
            <div className="lg:w-[80%] py-12 px-4 sm:px-6 lg:px-8 lg:ml-[20%] w-full">
                <div className="max-w-[1400px] mx-auto">
                    <h1 className="text-4xl font-bold text-center mb-12 mt-16 md:mt-0">Team Hall of Fame</h1>

                    <div className="space-y-4">
                        {error && <ErrorMessage />}
                        {teamsData[selectedLeague] ? (
                            teamsData[selectedLeague].map((team, index) => (
                                <React.Fragment key={team.id}>
                                    <TeamCard team={team} rank={index + 1} />
                                    {index < teamsData[selectedLeague].length - 1 && (
                                        <div className="border-t border-gray-300 my-6"></div> // Divider line
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            !error && <p className="text-center">Đang tải dữ liệu...</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamPage;
