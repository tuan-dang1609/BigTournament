import React, { useEffect, useState } from 'react';

const CombinedLeaderboard = ({ lobbies }) => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        try {
            setLoading(true);
            const combinedMap = {};

            lobbies.forEach((lobby) => {
                lobby.participants.forEach((participant) => {
                    const { puuid, gameNameTag, totalPoints } = participant;
                    if (!combinedMap[puuid]) {
                        combinedMap[puuid] = {
                            puuid,
                            gameNameTag,
                            totalPoints: 0,
                        };
                    }
                    combinedMap[puuid].totalPoints += totalPoints;
                });
            });

            const sortedLeaderboard = Object.values(combinedMap).sort((a, b) => b.totalPoints - a.totalPoints);
            setLeaderboard(sortedLeaderboard);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [lobbies]);

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
                        <th>Tổng điểm</th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboard.map((participant, index) => (
                        <tr key={participant.puuid}>
                            <td>{index + 1}</td>
                            <td className="text-left">{participant.gameNameTag}</td>
                            <td>{participant.totalPoints}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CombinedLeaderboard;
