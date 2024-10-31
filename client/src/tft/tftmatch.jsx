import React, { useEffect, useState } from 'react';

const MatchData = () => {
    const [puuidData, setPuuidData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPlayers, setShowPlayers] = useState(true);

    const matchIds = ['VN2_625876667', 'VN2_623274428', 'VN2_619818603'];
    const apiKey = 'RGAPI-7b899223-ca3c-455f-98e7-a1d996bfda55';

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
                const promises = matchIds.map(async (matchId) => {
                    const response = await fetch(`https://sea.api.riotgames.com/tft/match/v1/matches/${matchId}?api_key=${apiKey}`);
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

                // Chuyển đổi puuid thành gameName#tagLine
                const puuidArray = Object.values(puuidMap);
                const accountPromises = puuidArray.map(async (participant) => {
                    const response = await fetch(`https://asia.api.riotgames.com/riot/account/v1/accounts/by-puuid/${participant.puuid}?api_key=${apiKey}`);
                    const accountData = await response.json();
                    return { ...participant, gameNameTag: `${accountData.gameName}#${accountData.tagLine}` };
                });

                const accountData = await Promise.all(accountPromises);
                setPuuidData(accountData);
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
