import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Image from '../image/waiting.png'
const TournamentBracketAOV16 = () => {
    const [teams, setTeams] = useState([[], [], [], [], [], []]);
    const [loading, setLoading] = useState(true);
    const [idmatch, setMatchId] = useState([]);
    const containerRef = useRef(null);

    // Hàm lấy dữ liệu từ Google Sheets và backend
    const fetchTeams = async () => {
        
        try {
            const response = await fetch(
                "https://docs.google.com/spreadsheets/d/1ZGF4cPHRmKL5BSzgAMtUD2WWYrB-Dpx8Q_gFha5T0dY/gviz/tq?sheet=Swiss Stage 1&range=A1:R20"
            );
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const text = await response.text();
            const json = JSON.parse(text.substring(47, text.length - 2));

            const teamResponse = await fetch(
                "https://dongchuyennghiep-backend.vercel.app/api/auth/findallteamAOV",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            if (!teamResponse.ok) throw new Error(`HTTP error! status: ${teamResponse.status}`);
            const teamData = await teamResponse.json();

            const columns = [0, 3, 6, 9, 12, 15];
            const updatedTeams = columns.map((col) =>
                json.table.rows.map((row) => {
                    const teamName = row.c[col + 1]?.v || "Unknown";
                    const team = teamData.find((t) => t.teamName === teamName);

                    return {
                        name: teamName,
                        icon: team ? `https://drive.google.com/thumbnail?id=${team.logoUrl}` : Image,
                        score: row.c[col + 2]?.v || 0,
                    };
                })
            );

            setTeams(updatedTeams);
        } catch (error) {
            console.error("Failed to fetch teams:", error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        const scrollToTop = () => {
            document.documentElement.scrollTop = 0;
        };
        setTimeout(scrollToTop, 0);
        document.title = "Vòng Thụy Sỹ 1";

    }, []);
    const handleScrollLeft = () => {
        if (containerRef.current) {
            containerRef.current.scrollLeft -= 200;
        }
    };

    const handleScrollRight = () => {
        if (containerRef.current) {
            containerRef.current.scrollLeft += 200;
        }
    };


    // Hàm lấy dữ liệu danh sách trận đấu từ backend
    const fetchGames = async () => {
        try {
            const response = await axios.post(
                "https://dongchuyennghiep-backend.vercel.app/api/auth/findallmatchid"
            );
            const filteredGames = response.data.filter((game) => game.game === "Arena Of Valor");

            setMatchId(filteredGames);
        } catch (error) {
            console.error("Failed to fetch games:", error);
        }
    };

    useEffect(() => {
        fetchTeams();
        fetchGames();
    }, []);

    // Hàm tạo đường dẫn cho từng trận đấu
    const getMatchLink = (team1, team2) => {
        if (!team1.name || !team2.name) return "#";

        const match = idmatch.find(
            (m) =>
                (m.teamA.toLowerCase() === team1.name.toLowerCase() &&
                    m.teamB.toLowerCase() === team2.name.toLowerCase()) ||
                (m.teamA.toLowerCase() === team2.name.toLowerCase() &&
                    m.teamB.toLowerCase() === team1.name.toLowerCase())
        );

        if (match) {
            return `/arenaofvalor/match/${match.round}/${match.Match}`;
        } else {
            return "#";
        }
    };

    // Hàm render thông tin của từng cặp đấu
    const renderMatchup = (team1, team2, hasMargin = true) => (
        <Link
            to={getMatchLink(team1, team2)}
            className={`relative flex flex-col gap-y-[3px] overflow-hidden ${hasMargin ? "my-4" : "mb-0"
                }`}
        >
            {[team1, team2].map((team, index) => (
                <div
                    key={index}
                    className="2xl:pl-[6px] pl-[4px] flex items-center justify-between bg-white"
                >
                    <div className="flex items-center ">
                        <img
                            src={team?.icon}
                            alt={team?.name || "Team Logo"}
                            className="w-9 h-9 mr-4 ml-1"
                        />
                        <span className="text-black">{team?.name || "Unknown"}</span>
                    </div>
                    <div className="flex items-center justify-center w-14 h-14 bg-[#d9d9d9e5]">
                        <span className="font-bold text-[#f4aa49ef] text-[19px]">
                            {team?.score || 0}
                        </span>
                    </div>
                </div>
            ))}
        </Link>
    );

    // Hàm render các phần section cho từng vòng đấu
    const renderSection = (title, matchups, className = "") => (
        <div className={`flex flex-col ${className} border-2 border-gray-300 rounded-lg overflow-hidden`}>
            <h2 className="text-lg font-bold p-2 bg-[#D9D9D94D] border-b border-gray-300">
                {title}
            </h2>
            <div className="py-2 px-4 bg-[#D9D9D94D]">
                {matchups.map((matchup, index) => (
                    <div key={index}>
                        {renderMatchup(matchup[0] || {}, matchup[1] || {})}
                    </div>
                ))}
            </div>
        </div>
    );
    // Hàm render các đội tiến vào vòng loại trực tiếp
    const renderAdvanceSection = () => (
        <div className="flex flex-col border-2 border-gray-300 rounded-lg overflow-hidden relative">
            <h2 className="text-lg font-bold p-2 bg-[#D9D9D94D] border-b border-gray-300">
                Tiến tới Play-off
            </h2>
            <div className="p-2">
                {teams[5].slice(0, 8).map((team, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border-b last:border-b-0">
                        <div className="flex items-center">
                            {team.icon !== "🏅" ? (
                                <img src={team.icon} alt={team.name || "Team Logo"} className="w-8 h-8 mr-2" />
                            ) : (
                                <span className="w-8 h-8 mr-2">{team.icon}</span>
                            )}
                            <span>{team.name || "Unknown"}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // Hàm render các đội bị loại
    const renderEliminateSection = () => (
        <div className="flex flex-col border-2 border-gray-300 overflow-hidden relative rounded-lg">
            <h2 className="text-lg font-bold p-2 bg-[#D9D9D94D] border-b border-gray-300">
                Bị loại
            </h2>
            <div className="p-2">
                {teams[5].slice(9, 17).map((team, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border-b last:border-b-0">
                        <div className="flex items-center">
                        {team.icon !== "🚫" ? (
                                <img src={team.icon} className="w-8 h-8 mr-2" />
                            ) : (
                                <span className="w-8 h-8 mr-2">{team.icon}</span>
                            )}
                            <span>{team.name || "Unknown"}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
    return (
        <div className="relative w-[95%] lg:w-full mx-auto " id="bracket"  style={{ overflowX: 'scroll' }}>
            
            {loading ? (
                <div className="flex items-center justify-center min-h-screen">
                    <span className="loading loading-dots loading-lg text-primary"></span>
                </div>
            ) : (
                <>
                <h1 className="text-3xl font-bold mb-6 text-center mt-24">Vòng Thụy Sỹ 1</h1>
            <div className="max-w-[900px] justify-center flex flex-col mx-auto">
    <p>Hiii! Xin chào tất cả các bạn, chào mừng các bạn đã đến với vòng đấu Thụy Sĩ, và đây là một số luật lệ tụi mình sẽ có update thêm trong tương lai nhaaaa: </p>
    <ul class="list-disc">
        <li>8 đội gồm 2 đội thắng ở nhánh 2-0, 3 đội ở nhánh 2-1 và 3 đội thắng ở nhánh 2-2 sẽ đi tiếp.</li>
        <li>8 đội gồm 2 đội thua ở nhánh 0-2, 3 đội thua ở nhánh 1-2 và 3 đội thua ở nhánh 2-2 sẽ bị loại.</li>
        <li>Tất cả các trận ở đây là BO1. Riêng các trận quyết định (2-0, 0-2, 2-1, 1-2, 2-2) sẽ là BO3.</li>
        <li>Các bạn có thể kiểm tra kết quả trận đấu bằng cách ấn vào cặp trận.</li>
        <li>Thời gian sẽ được thông báo ở kênh riêng trên <a href="https://discord.gg/4AGUSHS2">Discord </a>.</li>
        <li>Trước giờ thi đấu 12h các bạn phải đưa lại đội hình cho BTC để bọn mình dễ dàng kiểm soát thông tin người chơi.</li>
        <li>Mọi thông tin khác tụi mình sẽ thông báo riêng trên kênh đấu giải.</li>
    </ul>
    <p> Và đó là tất cả những điều chúng mình muốn gửi đến các bạn, chúc các bạn thi đấu tốt nhaaaaaaa.</p>
</div>
           <div className="lg:flex justify-end hidden -z-99 mr-10 gap-1">
            <button
                onClick={handleScrollLeft}
                type="button"
                className="font-bold bg-primary text-white rounded-[50%] w-10 h-10 p-1 z-50"
            >
                &lt;
            </button>
            <button
                onClick={handleScrollRight}
                type="button"
                className="font-bold bg-primary text-white p-2 rounded-[50%] w-10 h-10 z-50"
            >
                &gt;
            </button>
            </div>
            <div className="w-full overflow-x-scroll scrollbar-none" ref={containerRef}>
                    <div  className="flex flex-col lg:flex-row justify-between lg:space-x-4 relative w-full lg:w-[140%] mx-auto">
                        <div className="w-full lg:w-1/6 lg:mt-40 mt-10 relative">
                            {renderSection("0W-0L", [
                                [teams[0][0], teams[0][1]],
                                [teams[0][2], teams[0][3]],
                                [teams[0][4], teams[0][5]],
                                [teams[0][6], teams[0][7]],
                                [teams[0][8], teams[0][9]],
                                [teams[0][10], teams[0][11]],
                                [teams[0][12], teams[0][13]],
                                [teams[0][14], teams[0][15]],
                            ])}
                            <div className="hidden lg:block absolute top-[calc(25%+1rem)] left-full h-[2.3px] w-[16px] bg-secondary"></div>
                            <div className="hidden lg:block absolute bottom-[calc(25%+2.5rem)] left-[calc(100%)] h-[2.3px] w-[16px] bg-secondary"></div>

                        </div>
                        <div className="w-full lg:mt-20 lg:w-1/6 mt-10 flex flex-col relative">
                            <div>
                                {renderSection("1W-0L", [
                                    [teams[1][0], teams[1][1]],
                                    [teams[1][2], teams[1][3]],
                                    [teams[1][4], teams[1][5]],
                                    [teams[1][6], teams[1][7]],
                                ])}
                                <div className="hidden lg:block absolute top-[5rem] left-full h-[2px] 2xl:w-[5%] xl:w-[6%] lg:w-[7%] bg-secondary"></div>
                                <div className="hidden lg:block absolute top-[30rem] left-full h-[2px] 2xl:w-[5%] xl:w-[6%] lg:w-[7%] bg-secondary"></div>
                            </div>
                            <div className="mt-10">
                                {renderSection("0W-1L", [
                                    [teams[1][9], teams[1][10]],
                                    [teams[1][11], teams[1][12]],
                                    [teams[1][13], teams[1][14]],
                                    [teams[1][15], teams[1][16]],
                                ])}
                                <div className="hidden lg:block absolute top-[52rem] left-full h-[2px] 2xl:w-[5%] xl:w-[6%] lg:w-[7%] bg-secondary"></div>
                                <div className="hidden lg:block absolute top-[70rem] left-full h-[2px] 2xl:w-[5%] xl:w-[6%] lg:w-[7%] bg-secondary"></div>
                            </div>
                        </div>
                        <div className="w-full lg:w-1/6 flex mt-10 flex-col relative">
                            <div>
                                {renderSection("2W-0L", [
                                    [teams[2][0], teams[2][1]],
                                    [teams[2][2], teams[2][3]],
                                ])}
                                <div className="hidden lg:block absolute top-[7rem] left-full h-[2px] 2xl:w-[214%] xl:w-[217%] lg:w-[220%] bg-secondary"></div>
                                <div className="hidden lg:block absolute top-[18rem] left-full h-[2px] 2xl:w-[5%] xl:w-[6%] lg:w-[7%] bg-secondary"></div>
                            </div>
                            <div className="mt-10">
                                {renderSection("1W-1L", [
                                    [teams[2][5], teams[2][6]],
                                    [teams[2][7], teams[2][8]],
                                    [teams[2][9], teams[2][10]],
                                    [teams[2][11], teams[2][12]],
                                ])}
                                <div className="hidden lg:block absolute top-[35rem] left-full h-[2px] 2xl:w-[5%] xl:w-[6%] lg:w-[7%] bg-secondary"></div>
                                <div className="hidden lg:block absolute top-[50rem] left-full h-[2px] 2xl:w-[5%] xl:w-[6%] lg:w-[7%] bg-secondary"></div>
                            </div>
                            <div className="mt-10">
                                {renderSection("0W-2L", [
                                    [teams[2][14], teams[2][15]],
                                    [teams[2][16], teams[2][17]],
                                ])}
                                <div className="hidden lg:block absolute top-[70rem] left-full h-[2px] 2xl:w-[5%] xl:w-[6%] lg:w-[7%] bg-secondary"></div>
                                <div className="hidden lg:block absolute top-[77rem] left-full h-[2px] 2xl:w-[214%] xl:w-[217%] lg:w-[220%] bg-secondary"></div>
                            </div>
                        </div>
                        <div className="w-full lg:w-1/6 lg:mt-48 mt-10 relative">
                            <div>
                                {renderSection("2W-1L", [
                                    [teams[3][0], teams[3][1]],
                                    [teams[3][2], teams[3][3]],
                                    [teams[3][4], teams[3][5]],
                                ])}
                                <div className="hidden lg:block absolute top-[10rem] left-full h-[2px] 2xl:w-[109%] xl:w-[111%] lg:w-[113%] bg-secondary"></div>
                                <div className="hidden lg:block absolute top-[25rem] left-full h-[2px] 2xl:w-[5%] xl:w-[6%] lg:w-[7%] bg-secondary"></div>
                            </div>
                            <div className="mt-10">
                                {renderSection("1W-2L", [
                                    [teams[3][7], teams[3][8]],
                                    [teams[3][9], teams[3][10]],
                                    [teams[3][11], teams[3][12]],
                                ])}
                                <div className="hidden lg:block absolute top-[50rem] left-full h-[2px] 2xl:w-[109%] xl:w-[111%] lg:w-[113%] bg-secondary"></div>
                                <div className="hidden lg:block absolute top-[35rem] left-full h-[2px] 2xl:w-[5%] xl:w-[6%] lg:w-[7%] bg-secondary"></div>
                            </div>
                        </div>
                        <div className="w-full lg:w-1/6 mt-10 lg:mt-[440px] relative">
                            {renderSection(
                                "2W-2L",
                                [
                                    [teams[4]?.[0] || {}, teams[4]?.[1] || {}],
                                    [teams[4]?.[2] || {}, teams[4]?.[3] || {}],
                                    [teams[4]?.[4] || {}, teams[4]?.[5] || {}],
                                ]
                            )}
                            <div className="hidden lg:block absolute top-[4rem] left-full h-[2px] 2xl:w-[5%] xl:w-[6%] lg:w-[7%] bg-secondary"></div>
                            <div className="hidden lg:block absolute top-[28rem] left-full h-[2px] 2xl:w-[5%] xl:w-[6%] lg:w-[7%] bg-secondary"></div>
                        </div>

                        <div className="w-full lg:w-1/6 mt-10 lg:mt-20 flex flex-col relative">
                            {renderAdvanceSection()}
                            <div className="lg:mt-80 mt-10">
                                {renderEliminateSection()}
                            </div>
                        </div>
                    </div>
                    </div>
                </>
                
            )}
                </div>
            );
};

            export default TournamentBracketAOV16;
