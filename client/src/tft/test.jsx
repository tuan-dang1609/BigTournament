import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const lobbies = {
    day1: [
        { id: 'Lobby 1', matchIds: ['VN2_633813781', '0', '0'] },
        { id: 'Lobby 2', matchIds: ['VN2_776825141', '0', '0'] }
    ],
    day2: [
        { id: 'Lobby 1', matchIds: ['VN2_633813781', '0', '0'] },
        { id: 'Lobby 2', matchIds: ['VN2_776825141', '0', '0'] }
    ]
};

const getPoints = (placement) => (placement >= 1 && placement <= 8 ? 9 - placement : 0);

const CombinedLeaderboard = () => {
    const { day } = useParams();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!lobbies[day]) return; // Kiểm tra nếu `day` không hợp lệ

        const fetchLobbyData = async () => {
            try {
                setLoading(true);
                const participantMap = {};

                for (const lobby of lobbies[day]) {
                    const lobbyParticipants = {};

                    for (const matchId of lobby.matchIds) {
                        if (matchId === '0') continue; // Bỏ qua trận đấu không có dữ liệu

                        const response = await fetch(`https://dongchuyennghiep-backend.vercel.app/api/tft/match/${matchId}`);
                        if (!response.ok) throw new Error('Failed to fetch match data');

                        const matchData = await response.json();
                        matchData.info.participants.forEach((participant) => {
                            const { puuid, placement } = participant;
                            if (!lobbyParticipants[puuid]) {
                                lobbyParticipants[puuid] = { puuid, points: [] };
                            }
                            lobbyParticipants[puuid].points.push(getPoints(placement));
                        });
                    }

                    // Lấy danh sách PUUID
                    const puuids = Object.keys(lobbyParticipants);
                    if (puuids.length === 0) continue; // Nếu không có người chơi, bỏ qua

                    // Fetch thông tin tài khoản
                    const accountResponse = await fetch(`https://dongchuyennghiep-backend.vercel.app/api/accounts`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ puuids })
                    });

                    if (!accountResponse.ok) throw new Error('Failed to fetch account data');
                    const accounts = await accountResponse.json();

                    // Cập nhật dữ liệu vào participantMap
                    puuids.forEach((puuid, index) => {
                        const totalPoints = lobbyParticipants[puuid].points.reduce((acc, curr) => acc + curr, 0);
                        const gameNameTag = `${accounts[index]?.gameName || 'Unknown'}#${accounts[index]?.tagLine || '0000'}`;

                        if (!participantMap[puuid]) {
                            participantMap[puuid] = { puuid, gameNameTag, points: [], totalPoints: 0 };
                        }
                        participantMap[puuid].points.push(...lobbyParticipants[puuid].points);
                        participantMap[puuid].totalPoints += totalPoints;
                    });
                }

                // Chuyển map thành array và sắp xếp theo tổng điểm
                const participants = Object.values(participantMap).sort((a, b) => b.totalPoints - a.totalPoints);
                setLeaderboard(participants);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLobbyData();
    }, [day]);

    if (!lobbies[day]) return <p>Không có dữ liệu cho ngày này</p>;
    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    const maxMatches = Math.max(...lobbies[day].map(lobby => lobby.matchIds.length));

    return (
        <div className="mt-10 mx-auto lg:w-[90%]">
            <h2 className="text-lg font-bold mb-4">Bảng xếp hạng tổng - {day.toUpperCase()}</h2>
            
            <table border="1" cellPadding="10" cellSpacing="0" className="text-center w-full">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Game Name</th>
                        {Array.from({ length: maxMatches }).map((_, index) => (
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
                            {Array.from({ length: maxMatches }).map((_, matchIndex) => (
                                <td key={matchIndex}>{participant.points[matchIndex] || 0}</td>
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