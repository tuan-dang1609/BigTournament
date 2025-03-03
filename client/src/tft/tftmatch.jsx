import React, { useEffect, useState } from 'react';

const MatchData = () => {
    const [lobbyData, setLobbyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPlayers, setShowPlayers] = useState(true);

    const lobbies = [
        { id: 'Lobby 1', matchIds: ['VN2_633813781'] },
        { id: 'Lobby 2', matchIds: ['VN2_715042777'] },
        { id: 'Lobby 3', matchIds: ['VN2_774619432'] }
    ];
    

    const getPoints = (placement) => {
        if (placement >= 1 && placement <= 8) {
            return 9 - placement;
        }
        return 0;
    };

    useEffect(() => {
        document.title = "Bảng xếp hạng TFT";

        const fetchLobbyData = async () => {
            try {
                setLoading(true);
                
                const lobbyPromises = lobbies.map(async (lobby) => {
                    const matchPromises = lobby.matchIds.map(async (matchId) => {
                        const response = await fetch(`https://dongchuyennghiep-backend.vercel.app/api/tft/match/${matchId}`);
                        if (!response.ok) {
                            throw new Error('Failed to fetch match data');
                        }
                        return response.json();
                    });

                    const matchData = await Promise.all(matchPromises);

                    const participantMap = {};
                    matchData.forEach((match, matchIndex) => {
                        match.info.participants.forEach((participant) => {
                            const { puuid, placement } = participant;
                            if (!participantMap[puuid]) {
                                participantMap[puuid] = { puuid, placements: [], points: [] };
                            }
                            participantMap[puuid].placements[matchIndex] = placement || 'N/A';
                            participantMap[puuid].points[matchIndex] = placement ? getPoints(placement) : 0;
                        });
                    });

                    // Fetch account data
                    const puuids = Object.keys(participantMap);
                    const accountResponse = await fetch(`https://dongchuyennghiep-backend.vercel.app/api/accounts`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ puuids })
                    });

                    if (!accountResponse.ok) {
                        throw new Error('Failed to fetch account data');
                    }

                    const accounts = await accountResponse.json();
                    const participants = Object.values(participantMap).map((participant, index) => ({
                        ...participant,
                        gameNameTag: `${accounts[index]?.gameName || 'Unknown'}#${accounts[index]?.tagLine || '0000'}`,
                        totalPoints: participant.points.reduce((acc, curr) => acc + curr, 0)
                    }));

                    // Sort by total points
                    participants.sort((a, b) => b.totalPoints - a.totalPoints);

                    return { lobbyId: lobby.id, participants, matchCount: lobby.matchIds.length };
                });

                const allLobbies = await Promise.all(lobbyPromises);
                setLobbyData(allLobbies);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLobbyData();
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="mt-20 mx-auto lg:w-[90%]">
            <div className="flex lg:flex-row flex-col lg:gap-x-2">
                <div className="flex items-center mb-4">
                    <label className="relative inline-block w-14 h-8">
                        <input
                            type="checkbox"
                            checked={showPlayers}
                            onChange={() => setShowPlayers(!showPlayers)}
                            className="sr-only"
                        />
                        <div className={`block bg-gray-300 w-14 h-8 rounded-full ${showPlayers ? 'bg-green-500' : 'bg-gray-500'} transition duration-300 ease-in-out`}></div>
                        <div className={`dot absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ease-in-out ${showPlayers ? 'transform translate-x-6' : ''}`}></div>
                    </label>
                    <span className="ml-2">{showPlayers ? 'Hiển thị Placement' : 'Hiển thị Điểm'}</span>
                </div>
            </div>

            {lobbyData.map((lobby) => (
                <div key={lobby.lobbyId} className="mb-8">
                    <h2 className="text-lg font-bold">{lobby.lobbyId}</h2>
                    <table border="1" cellPadding="10" cellSpacing="0" className="text-center w-full">
                        <thead>
                            <tr>
                                <th></th>
                                <th>Game Name</th>
                                {Array.from({ length: lobby.matchCount }).map((_, index) => (
                                    <th key={index}>Trận {index + 1}</th>
                                ))}
                                <th>Tổng điểm</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lobby.participants.map((participant, index) => (
                                <tr key={participant.puuid}>
                                    <td>{index + 1}</td>
                                    <td className="text-left">{participant.gameNameTag}</td>
                                    {Array.from({ length: lobby.matchCount }).map((_, matchIndex) => (
                                        <td key={matchIndex}>
                                            {showPlayers
                                                ? participant.placements[matchIndex] || 'N/A'
                                                : participant.points[matchIndex] || 0}
                                        </td>
                                    ))}
                                    <td>{participant.totalPoints}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
};

export default MatchData;
