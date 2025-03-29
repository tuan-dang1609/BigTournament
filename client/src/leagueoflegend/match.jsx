import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function MatchStatLOL() {
    const [rawData, setRawData] = useState({});
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [rawtimeline,setRawtimeline] = useState({})
    const [selectedMatchId, setSelectedMatchId] = useState(null);
    const [selectedTab, setSelectedTab] = useState("table"); // Tab mặc định là bảng
    const matchIds = ["VN2_637421825", "VN2_724137610"];

    // Fetch match data
    useEffect(() => {
        const fetchAllMatches = async () => {
            try {
                const matchPromises = matchIds.map((matchId) =>
                    fetch(`https://bigtournament-hq9n.onrender.com/api/lol/match/${matchId}`).then((res) => {
                        if (!res.ok) {
                            throw new Error(`Failed to fetch data for matchId: ${matchId}`);
                        }
                        return res.json();
                    })
                );
                const timeline = matchIds.map((matchId) =>
                    fetch(`https://bigtournament-hq9n.onrender.com/api/lol/match/timeline/${matchId}`).then((res) => {
                        if (!res.ok) {
                            throw new Error(`Failed to fetch data for matchId: ${matchId}`);
                        }
                        return res.json();
                    })
                ); 
                const results = await Promise.all(matchPromises);
                const rawtimeline = await Promise.all(timeline)
                const matchData = {};
                const thetimeline = {};
                matchIds.forEach((id, index) => {
                    matchData[id] = results[index];
                    thetimeline[id] = rawtimeline[index]
                });
                setRawData(matchData);
                setRawtimeline(thetimeline)
                setIsLoading(false);
                setSelectedMatchId(matchIds[0]);
            } catch (err) {
                setError(err.message);
                setIsLoading(false);
            }
        };

        fetchAllMatches();
    }, []);
    
    // Sử dụng hàm với dữ liệu
    useEffect(() => {
        if (Object.keys(rawtimeline).length > 0) {
            matchIds.forEach((matchId) => {
                const timelineData = rawtimeline[matchId]?.info;
                if (timelineData) {
                    const teamGoldData = calculateTeamGoldPerInterval(timelineData);
                    console.log(`Gold per interval for match ${matchId}:`, teamGoldData);
                }
            });
        }
    }, [rawtimeline]);
    // Import all images
    const renderMapTabs = () => {
        return (
            <div className="flex items-center justify-between bg-[#362431] p-2 mb-2">
                <span className="text-white text-[11px] font-bold mr-4">MATCH STATS</span>
                <div className="flex gap-2">
                    {matchIds.map((matchId, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedMatchId(matchId)} // Cập nhật selectedMatchId
                            className={`px-4 py-2 text-[11px] font-bold rounded ${selectedMatchId === matchId ? 'bg-white text-black' : 'bg-[#4A374A] text-white'}`}
                        >
                            Trận {index + 1}
                        </button>
                    ))}
                </div>
            </div>
        );
    };
    const renderTabs = () => {
        return (
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setSelectedTab("table")}
                    className={`px-4 py-2 text-[11px] font-bold rounded ${selectedTab === "table" ? 'bg-white text-black' : 'bg-[#4A374A] text-white'}`}
                >
                    Bảng Thống Kê
                </button>
                <button
                    onClick={() => setSelectedTab("chart")}
                    className={`px-4 py-2 text-[11px] font-bold rounded ${selectedTab === "chart" ? 'bg-white text-black' : 'bg-[#4A374A] text-white'}`}
                >
                    Biểu Đồ
                </button>
            </div>
        );
    };
    const importAllImages = (directories) => {
        const images = {};

        directories.forEach((directory) => {
            let imageContext;
            if (directory === "../item") {
                imageContext = import.meta.glob("../item/*.png", { eager: true });
            } else if (directory === "../championLOL") {
                imageContext = import.meta.glob("../championLOL/*.png", { eager: true });
            } else if (directory === "../LOLrole") {
                imageContext = import.meta.glob("../LOLrole/*.png", { eager: true });
            }
            for (const path in imageContext) {
                const fileName = path.split("/").pop().replace(".png", "");
                images[fileName] = imageContext[path].default || imageContext[path];
            }
        });

        return images;
    };

    // Import from multiple directories
    const itemImages = importAllImages(["../item", "../championLOL", "../LOLrole"]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="loading loading-dots loading-lg text-primary"></span>
            </div>
        );
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    const renderTable = (team, gameDurationMinutes) => (
        <div className="table-container p-2">
            <div className="overflow-x-auto">
                <table className="min-w-full table-auto text-base-content lg:w-full w-[280%] font-semibold">
                    <thead className="bg-[#362431] text-white">
                        <tr>
                            <th className="p-2 bg-[#362431] sticky left-0 z-10 lg:!w-[270px] !w-[180px]">Player</th>
                            <th className="p-2  ">Trang bị</th>
                            <th className="p-2  ">KDA</th>
                            <th className="p-2  ">CS</th>
                            <th className="p-2  ">Vàng đã nhận</th>
                            <th className="p-2  ">Điểm Tầm Nhìn</th>
                            <th className="p-2  ">Sát Thương</th>
                        </tr>
                    </thead>
                    <tbody>
                        {team.map((participant) => {
                            const {
                                teamPosition,
                                championName,
                                item0,
                                item1,
                                item2,
                                item3,
                                item4,
                                item5,
                                item6,
                                riotIdGameName,
                                riotIdTagline,
                                totalMinionsKilled,
                                neutralMinionsKilled,
                                puuid,
                                kills,
                                deaths,
                                assists,
                                visionScore,
                                totalDamageDealtToChampions,
                                goldEarned,
                                challenges,
                            } = participant;

                            return (
                                <tr key={puuid} className="!h-[45.2px]">
                                    <td className="lg:!w-[270px] !w-[180px] sticky left-0 bg-base-100 z-10">
                                        <div className="flex flex-row gap-x-3">
                                            <img src={itemImages[teamPosition]} alt={`${teamPosition}`} className="inline-block h-7 w-7 rounded" />
                                            <img src={itemImages[championName]} alt={`Item ${championName}`} className="inline-block h-7 w-7 rounded" />
                                            <span className="flex items-center">
                                                <span className="hidden lg:inline text-[12px]">{riotIdGameName}#{riotIdTagline}</span>
                                                <span className="lg:hidden text-[12px]">{riotIdGameName}</span>
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-2  flex gap-1 items-center justify-center">
                                        {[item0, item1, item2, item3, item4, item5, item6].map((item, index) => {
                                            const imgSrc = itemImages[item];
                                            return imgSrc ? (
                                                <img key={index} src={imgSrc} alt={`Item ${item}`} className="inline-block h-7 w-7" />
                                            ) : (
                                                <span key={index} className="text-red-500">N/A</span>
                                            );
                                        })}
                                    </td>
                                    <td className=" text-[13px] p-2   text-center">
                                        {kills}/{deaths}/{assists}{" "}
                                        {challenges?.visionScorePerMinute && (
                                            <span>
                                                ({challenges.kda.toFixed(1)})
                                            </span>
                                        )}
                                    </td>
                                    <td className=" text-[13px] p-2   text-center">
                                        {totalMinionsKilled + neutralMinionsKilled} (
                                        {((totalMinionsKilled + neutralMinionsKilled) / gameDurationMinutes).toFixed(1)})
                                    </td>
                                    <td className="text-[13px] p-2   text-center">{goldEarned}</td>
                                    <td className="text-[13px] p-2   text-center">
                                        {visionScore}{" "}
                                        {challenges?.visionScorePerMinute && (
                                            <span>
                                                ({challenges.visionScorePerMinute.toFixed(1)})
                                            </span>
                                        )}
                                    </td>
                                    <td className="text-[13px] p-2   text-center">{totalDamageDealtToChampions}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
    const calculateTeamGoldPerInterval = (timelineData) => {
        if (!timelineData || !timelineData.frames) {
            console.error("Invalid timeline data:", timelineData);
            return [];
        }

        const team1Ids = [1, 2, 3, 4, 5];
        const team2Ids = [6, 7, 8, 9, 10];

        return timelineData.frames.map((frame) => {
            const participantFrames = frame.participantFrames;

            const team1Gold = team1Ids.reduce(
                (total, id) => total + (participantFrames[id.toString()]?.totalGold || 0),
                0
            );
            const team2Gold = team2Ids.reduce(
                (total, id) => total + (participantFrames[id.toString()]?.totalGold || 0),
                0
            );

            return {
                timestamp: frame.timestamp / 1000, // Convert milliseconds to seconds
                goldDifference: team1Gold - team2Gold,
            };
        });
    };

    const renderGoldDifferenceChart = (matchId) => {
        const timelineData = rawtimeline[matchId]?.info;
        if (!timelineData) return null;
    
        const goldDifferenceData = calculateTeamGoldPerInterval(timelineData);
    
        const data = {
            labels: goldDifferenceData.map((entry) => {
                const timestampInSeconds = Math.floor(entry.timestamp); // Làm tròn xuống để lấy số giây
                const minutes = Math.floor(timestampInSeconds / 60); // Tính phút
                const seconds = timestampInSeconds % 60; // Tính giây
                return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`; // Định dạng mm:ss
            }),
            datasets: [
                {
                    label: "Chênh lệch vàng 2 đội",
                    data: goldDifferenceData.map((entry) => entry.goldDifference),
                    borderColor: "#ff4500",
                    backgroundColor: "rgba(255, 69, 0, 0.3)",
                    fill: true,
                    tension: 0.4,
                },
            ],
        };
    
        const options = {
            responsive: true,
            maintainAspectRatio: false,  // Tắt tính năng giữ tỷ lệ
            plugins: {
                legend: {
                    display: true,
                    position: "top",
                    onClick: (e) => e.stopImmediatePropagation(),  // Vô hiệu hóa click vào legend
                },
                tooltip: {
                    callbacks: {
                        label: (tooltipItem) => {
                            // Kiểm tra giá trị goldDifference
                            const goldDifference = tooltipItem.raw;
                            if (goldDifference > 0) {
                                return `Team Xanh dẫn trước ${Math.abs(goldDifference)}`;
                            } else if (goldDifference < 0) {
                                return `Team Đỏ dẫn trước ${Math.abs(goldDifference)}`;
                            } else {
                                return `Hai đội hòa`;
                            }
                        },
                    },
                },
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Time (mm:ss)",
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: "Chênh lệch vàng",
                    },
                    ticks: {
                        stepSize: 4000,
                        beginAtZero: true,
                    },
                },
            },
        };
    
        return (
            <div style={{ height: "320px", width: "100%" }}>
                <Line data={data} options={options} />
            </div>
        );
    };
    
    const renderSelectedMatch = () => {
        const matchId = selectedMatchId;
        const data = rawData[matchId]?.info;
        if (!data) return null;

        const participants = data.participants;
        const gameDurationSeconds = data.gameDuration;
        const gameDurationMinutes = gameDurationSeconds / 60;

        const teamPositionOrder = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];
        const sortByTeamPosition = (players) =>
            players.sort((a, b) => teamPositionOrder.indexOf(a.teamPosition) - teamPositionOrder.indexOf(b.teamPosition));

        const team1 = sortByTeamPosition(participants.filter((player) => player.teamId === 100));
        const team2 = sortByTeamPosition(participants.filter((player) => player.teamId === 200));

        return (
            <div key={matchId}>
                {selectedTab === "table" ? renderTable(team1, gameDurationMinutes) : renderGoldDifferenceChart(matchId)}
                {selectedTab === "table" ? renderTable(team2, gameDurationMinutes) : null}
            </div>
        );
    };

    
    
    
    return (
        <div className="matchstat">
            <div className="scoreboard-title mt-5 mx-0 my-1">
                <div className="scoreboard w-full">
                    <div className="team teamleft w-full flex items-center" >
                        <div className="logo">
                            <img className="w-12 h-12 ml-2 max-lg:ml-0 max-lg:w-9 max-lg:h-9"  alt="Team Left Logo" />
                        </div>
                        <div className="teamname"></div>
                    </div>
                    <div className="score-and-time">
                        <div className="score bg-[#362431]">
                            <span id='score-left'></span>
                        </div>
                        <div className="time text-sm uppercase bg-[#362431] text-white">
                            <span>Fin</span>
                            <span></span>
                        </div>
                        <div className="score bg-[#362431]">
                            <span  id='score-right'></span>
                        </div>
                    </div>
                    <div className="team teamright w-full flex items-center" >
                        <div className="logo">
                            <img className="w-12 h-12 mr-2 max-lg:mr-0 max-lg:w-9 max-lg:h-9" alt="Team Right Logo" />
                        </div>
                        <div className="teamname"></div>
                    </div>
                </div>
                <div className='title bg-[#362431]'>
                    <span className='league all-title'></span>
                    <span className='group all-title text-white'> ● </span>
                </div>
            </div>
            {renderMapTabs()} {/* Render map tabs */}
            {renderTabs()}
            {renderSelectedMatch()} {/* Render selected match data */}
        </div>
    );

}
