import React, { useEffect, useState } from 'react';

const MatchData = () => {
    const [puuidData, setPuuidData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPlayers, setShowPlayers] = useState(true);

    const matchIds = ['VN2_625876667'];

    const getPoints = (placement) => {
        return placement >= 1 && placement <= 8 ? 9 - placement : 0;
    };

    useEffect(() => {
        const fetchAllMatches = async () => {
            try {
                setLoading(true);
                
                // Lấy thông tin trận đấu từ backend
                const matchResponses = await Promise.all(
                    matchIds.map(async (matchId) => {
                        const response = await fetch(`https://dongchuyennghiep-backend.vercel.app/api/tft/match/${matchId}`);
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                );

                const puuidMap = {};
                matchResponses.forEach((matchData, matchIndex) => {
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
                const accountResponse = await fetch(`https://dongchuyennghiep-backend.vercel.app/api/accounts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ puuids: puuidArray }) // Truyền mảng `puuids` qua body
                });

                if (!accountResponse.ok) {
                    throw new Error('Failed to fetch account data');
                }

                const accountDataArray = await accountResponse.json();
                const accountDataWithTags = Object.values(puuidMap).map((participant) => {
                    const accountData = accountDataArray.find(acc => acc.puuid === participant.puuid);
                    return {
                        ...participant,
                        gameNameTag: accountData ? `${accountData.gameName}#${accountData.tagLine}` : 'N/A'
                    };
                });

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
        <div className='mt-20'>
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
                        className={`block bg-gray-300 w-14 h-8 rounded-full ${showPlayers ? 'bg-green-500' : 'bg-gray-300'} transition duration-300 ease-in-out`}
                    ></div>
                    <div
                        className={`dot absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ease-in-out ${showPlayers ? 'transform translate-x-6' : ''}`}
                    ></div>
                </label>
                <span className="ml-2">{showPlayers ? 'Hiển thị Placement' : 'Hiển thị Điểm'}</span>
            </div>

            <table border="1" cellPadding="10" cellSpacing="0">
                <thead>
                    <tr>
                        <th>Game Name</th>
                        {matchIds.map((_, index) => (
                            <th key={index}>Trận {index + 1}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {puuidData.map((row, index) => (
                        <tr key={index}>
                            <td>{row.gameNameTag || 'N/A'}</td>
                            {matchIds.map((_, matchIndex) => (
                                <td key={matchIndex}>
                                    {showPlayers ? 
                                        (row.placements[matchIndex] || 'N/A') : 
                                        (row.points[matchIndex] || 0)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default MatchData;
