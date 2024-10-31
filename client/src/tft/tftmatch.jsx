import React, { useEffect, useState } from 'react';

const MatchData = () => {
    const [puuidData, setPuuidData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPlayers, setShowPlayers] = useState(true);

    const matchIds = ['VN2_628709191','VN2_628737890'];

    const getPoints = (placement) => {
        if (placement >= 1 && placement <= 8) {
            return 9 - placement;
        }
        return 0;
    };

    useEffect(() => {
        const fetchAllMatches = async () => {
            try {
                setLoading(true);
                
                // Lấy thông tin trận đấu từ backend
                const promises = matchIds.map(async (matchId) => {
                    const response = await fetch(`https://dongchuyennghiep-backend.vercel.app/api/tft/match/${matchId}`);
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                });

                const data = await Promise.all(promises);

                const puuidMap = {};
                data.forEach((matchData, matchIndex) => {
                    matchData.info.participants.forEach(participant => {
                        const { puuid, placement } = participant;
                        if (!puuidMap[puuid]) {
                            puuidMap[puuid] = { puuid, placements: [], points: [] };
                        }
                        puuidMap[puuid].placements[matchIndex] = placement;
                        puuidMap[puuid].points[matchIndex] = getPoints(placement);
                    });
                });

                // Gửi một yêu cầu duy nhất để lấy thông tin tài khoản cho tất cả các `puuid`
                const puuidArray = Object.values(puuidMap).map(participant => participant.puuid);
                const response = await fetch(`https://dongchuyennghiep-backend.vercel.app/api/accounts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ puuids: puuidArray }) // Truyền mảng `puuids` qua body
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch account data');
                }

                const accountDataArray = await response.json();
                
                // Thêm thông tin gameNameTag và tính tổng điểm
                let accountDataWithTags = Object.values(puuidMap).map((participant, index) => ({
                    ...participant,
                    gameNameTag: `${accountDataArray[index].gameName}#${accountDataArray[index].tagLine}`,
                    totalPoints: participant.points.reduce((acc, curr) => acc + curr, 0) // Tính tổng điểm
                }));

                // Sắp xếp theo tổng điểm giảm dần
                accountDataWithTags.sort((a, b) => b.totalPoints - a.totalPoints);

                setPuuidData(accountDataWithTags);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAllMatches();
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className='mt-20 mx-auto lg:w-[90%]'>
            <div className='flex lg:flex-row flex-col lg:gap-x-2'>
            <h1>Matches Data</h1>
            <div className="flex items-center mb-4">
                <label className="relative inline-block w-14 h-8">
                    <input
                        type="checkbox"
                        checked={showPlayers}
                        onChange={() => setShowPlayers(!showPlayers)}
                        className="sr-only"
                    />
                    <div
                        className={`block bg-gray-300 w-14 h-8 rounded-full ${showPlayers ? 'bg-green-500' : 'bg-green-500'} transition duration-300 ease-in-out`}
                    ></div>
                    <div
                        className={`dot absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ease-in-out ${showPlayers ? 'transform translate-x-6' : ''}`}
                    ></div>
                </label>
                <span className="ml-2">{showPlayers ? 'Hiển thị Placement' : 'Hiển thị Điểm'}</span>
            </div>

            </div>
            

            <table border="1" cellPadding="10" cellSpacing="0" className='text-center w-full'>
                <thead>
                    <tr>
                        <th></th>
                        <th>Game Name</th>
                        {matchIds.map((_, index) => (
                            <th key={index}>Trận {index + 1}</th>
                        ))}
                        <th>Tổng điểm</th>
                    </tr>
                </thead>
                <tbody>
                    {puuidData.map((row, index) => (
                        <tr key={index}>
                            <td>{index + 1}</td> {/* Rank tổng dựa trên index sau khi sắp xếp */}
                            <td className='text-left'>{row.gameNameTag || 'N/A'}</td>
                            {matchIds.map((_, matchIndex) => (
                                <td key={matchIndex}>
                                    {showPlayers ? 
                                        (row.placements[matchIndex] || 'N/A') : 
                                        (row.points[matchIndex] || 0)}
                                </td>
                            ))}
                            <td>{row.totalPoints}</td> {/* Cột tổng điểm */}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default MatchData;
