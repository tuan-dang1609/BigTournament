import { useState, useEffect } from "react";

export default function MatchStatLOL() {
    const [rawData, setRawData] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const matchId = "VN2_637421825";

    // Fetch match data
    useEffect(() => {
        fetch(`https://dongchuyennghiep-backend.vercel.app/api/lol/match/${matchId}`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Failed to fetch data");
                }
                return res.json();
            })
            .then((data) => {
                setRawData(data);
                setIsLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setIsLoading(false);
            });
    }, []);

    // Import all images
    const importAllImages = (directories) => {
        const images = {};

        directories.forEach((directory) => {
            let imageContext;
            if (directory === '../item') {
                imageContext = import.meta.glob('../item/*.png', { eager: true });
            } else if (directory === '../championLOL') {
                imageContext = import.meta.glob('../championLOL/*.png', { eager: true });
            }
            else if (directory === '../LOLrole') {
                imageContext = import.meta.glob('../LOLrole/*.png', { eager: true });
            }
            for (const path in imageContext) {
                const fileName = path.split('/').pop().replace('.png', '');
                images[fileName] = imageContext[path].default || imageContext[path];
            }
        });

        return images;
    };

    // Import from multiple directories
    const itemImages = importAllImages(['../item', '../championLOL', '../LOLrole']);

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

    const participants = rawData.info.participants;
    const gameDurationSeconds = rawData.info.gameDuration;
    const gameDurationMinutes = gameDurationSeconds / 60;

    // Define the priority order for team positions
    const teamPositionOrder = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'];
    const sortByTeamPosition = (players) => {
        return players.sort(
            (a, b) => teamPositionOrder.indexOf(a.teamPosition) - teamPositionOrder.indexOf(b.teamPosition)
        );
    };

    // Tách người chơi theo teamId
    const team1 = sortByTeamPosition(participants.filter((player) => player.teamId === 100));
    const team2 = sortByTeamPosition(participants.filter((player) => player.teamId === 200));

    const renderTable = (team) => (
        <div className="table-container p-2">
            {/* Wrapper for responsiveness */}
            <div className="overflow-x-auto">
                <table className="min-w-full table-auto text-base-content lg:w-full w-[280%] font-semibold">
                    <thead>
                        <tr>
                            <th className="p-2 border-b border-gray-700 sticky left-0 bg-base-100 z-10 lg:!w-[270px] !w-[180px]">Player</th>
                            <th className="p-2 border-b border-gray-700">Trang bị</th>
                            <th className="p-2 border-b border-gray-700">KDA</th>
                            <th className="p-2 border-b border-gray-700">CS</th>
                            <th className="p-2 border-b border-gray-700">Vàng đã nhận</th>
                            <th className="p-2 border-b border-gray-700">Điểm Tầm Nhìn</th>
                            <th className="p-2 border-b border-gray-700">Sát Thương</th>
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
                                <tr key={puuid}> {/* Đặt chiều cao hàng */}
                                    <td className="!h-[10px] border-b border-gray-700 lg:!w-[270px] !w-[180px] sticky left-0 bg-base-100 z-10">
                                        <div className="flex flex-row gap-x-3">
                                            <img src={itemImages[teamPosition]} alt={`${teamPosition}`} className="inline-block h-7 w-7 rounded" />
                                            <img src={itemImages[championName]} alt={`Item ${championName}`} className="inline-block h-7 w-7 rounded" />
                                            <span className="flex items-center">
                                                {/* Hiển thị đầy đủ khi màn hình >= 1024px */}
                                                <span className="hidden lg:inline text-[12px]">{riotIdGameName}#{riotIdTagline}</span>
                                                {/* Chỉ hiển thị riotIdGameName khi màn hình < 1024px */}
                                                <span className="lg:hidden text-[12px]">{riotIdGameName}</span>
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-2 border-b border-gray-700 flex gap-1 items-center justify-center">
                                        {[item0, item1, item2, item3, item4, item5, item6].map((item, index) => {
                                            const imgSrc = itemImages[item];
                                            return imgSrc ? (
                                                <img key={index} src={imgSrc} alt={`Item ${item}`} className="inline-block h-7 w-7" />
                                            ) : (
                                                <span key={index} className="text-red-500">N/A</span>
                                            );
                                        })}
                                    </td>
                                    <td className=" text-[13px] p-2 border-b border-gray-700 text-center">
                                        {kills}/{deaths}/{assists}{" "}
                                        {challenges?.visionScorePerMinute && (
                                            <span>
                                                ({challenges.kda.toFixed(1)})
                                            </span>
                                        )}
                                    </td>
                                    <td className=" text-[13px] p-2 border-b border-gray-700 text-center">
                                        {totalMinionsKilled + neutralMinionsKilled} (
                                        {((totalMinionsKilled + neutralMinionsKilled) / gameDurationMinutes).toFixed(1)})
                                    </td>
                                    <td className="text-[13px] p-2 border-b border-gray-700 text-center">{goldEarned}</td>
                                    <td className="text-[13px] p-2 border-b border-gray-700 text-center">
                                        {visionScore}{" "}
                                        {challenges?.visionScorePerMinute && (
                                            <span>
                                                ({challenges.visionScorePerMinute.toFixed(1)})
                                            </span>
                                        )}
                                    </td>
                                    <td className="text-[13px] p-2 border-b border-gray-700 text-center">{totalDamageDealtToChampions}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );




    return (
        <div className="matchstat">
            <div className="title bg-[#362431] text-white p-4">
                <h2 className="text-xl">League of Legends Match Stats</h2>
                <p>Nhánh 0-0 ● BO1</p>
            </div>
            {renderTable(team1)}
            {renderTable(team2)}
        </div>
    );
}
