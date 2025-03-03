import React, { useEffect, useState } from 'react';

const lobbies = [
    { id: 'Lobby 1', matchIds: ['VN2_633813781'] },
    { id: 'Lobby 2', matchIds: ['VN2_776825141'] },
    { id: 'Lobby 3', matchIds: ['VN2_774619432'] }
];

const getPoints = (placement) => {
    if (placement >= 1 && placement <= 8) {
        return 9 - placement;
    }
    return 0;
};

const CombinedLeaderboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPlayers, setShowPlayers] = useState(true);

    useEffect(() => {
        const fetchLobbyData = async () => {
            try {
                setLoading(true);
                const participantMap = {};

                // Loop through each lobby and fetch its data individually
                for (const lobby of lobbies) {
                    const lobbyParticipants = {};
                    for (const matchId of lobby.matchIds) {
                        const response = await fetch(`https://dongchuyennghiep-backend.vercel.app/api/tft/match/${matchId}`);
                        if (!response.ok) {
                            throw new Error('Failed to fetch match data');
                        }
                        const matchData = await response.json();

                        matchData.info.participants.forEach((participant) => {
                            const { puuid, placement } = participant;
                            if (!lobbyParticipants[puuid]) {
                                lobbyParticipants[puuid] = { puuid, points: [] };
                            }
                            lobbyParticipants[puuid].points.push(getPoints(placement));
                        });
                    }

                    const puuids = Object.keys(lobbyParticipants);
                    const accountResponse = await fetch(`https://dongchuyennghiep-backend.vercel.app/api/accounts`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ puuids })
                    });

                    if (!accountResponse.ok) {
                        throw new Error('Failed to fetch account data');
                    }

                    const accounts = await accountResponse.json();
                    puuids.forEach((puuid, index) => {
                        const totalPoints = lobbyParticipants[puuid].points.reduce((acc, curr) => acc + curr, 0);
                        const gameNameTag = `${accounts[index]?.gameName || 'Unknown'}#${accounts[index]?.tagLine || '0000'}`;
                        if (!participantMap[puuid]) {
                            participantMap[puuid] = {
                                puuid,
                                gameNameTag,
                                points: [],
                                totalPoints: 0
                            };
                        }
                        participantMap[puuid].points.push(...lobbyParticipants[puuid].points);
                        participantMap[puuid].totalPoints += totalPoints;
                    });
                }

                // Convert participantMap to an array and sort by total points
                const participants = Object.values(participantMap).sort((a, b) => b.totalPoints - a.totalPoints);

                setLeaderboard(participants);
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
        <div className="mt-10 mx-auto lg:w-[90%]">
            <h2 className="text-lg font-bold mb-4">Bảng xếp hạng tổng</h2>
            
            <table border="1" cellPadding="10" cellSpacing="0" className="text-center w-full">
                <thead>
                    <tr>
                        <th></th>
                        <th>Game Name</th>
                        {Array.from({ length: lobbies.reduce((max, lobby) => Math.max(max, lobby.matchIds.length), 0) }).map((_, index) => (
                            <th key={index}>Trận {index + 1}</th>
                        ))}
                        <th>Tổng điểm</th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboard.map((participant, index) => (
                        <tr key={participant.puuid}>
                            <td>{index + 1}</td>
                            <td className="text-left">{participant.gameNameTag}</td>
                            {Array.from({ length: lobbies.reduce((max, lobby) => Math.max(max, lobby.matchIds.length), 0) }).map((_, matchIndex) => (
                                <td key={matchIndex}>
                                {participant.points[matchIndex] || 0}
                            </td>
                            ))}
                            <td>{participant.totalPoints}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CombinedLeaderboard;
