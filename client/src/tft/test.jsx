import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MyNavbar2 from "../components/Navbar2";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import DCN from '../image/LOGO.png'
const lobbies = {
    day1: [
        { id: 'Lobby 1', matchIds: ['VN2_838453360', '0', '0'] },
        { id: 'Lobby 2', matchIds: ['0', '0', '0'] }
    ],
    day2: [
        { id: 'Lobby 1', matchIds: ['0', '0', '0'] },
        { id: 'Lobby 2', matchIds: ['0', '0', '0'] }
    ]
};

const getPoints = (placement) => (placement >= 1 && placement <= 8 ? 9 - placement : 0);

const CombinedLeaderboard = () => {
    const { day } = useParams();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showPlayers, setShowPlayers] = useState(false);
    const navigationAll1 = {
        aov: [
            { name: "Vòng 1", href: "/tft/ranking/total/day1", current: location.pathname === "/tft/ranking/total/day1" },
            { name: "Vòng 2", href: "/tft/ranking/total/day2", current: location.pathname === "/tft/ranking/total/day2" },
            { name: "Chung kết tổng", href: "/tft/grandfinal", current: location.pathname === "/tft/grandfinal" },
        ],
    };
    const driverObj = driver({
        showProgress: true,
        steps: [
            {
                popover: {
                    title: 'Luật Tiebreaker',
                    description: `
                            <p class="mt-2 font-semibold">Bất kỳ người chơi nào có điểm số bằng nhau trong các trường hợp như Reseeding Lobbies, cắt điểm cuối ngày, hoặc xếp hạng chung cuộc sẽ được phân biệt theo các tiêu chí sau:</p>
                            <ul class="mt-2 list-disc list-inside space-y-2 text-sm font-semibold">
                                <li><span class="font-medium">Tổng số điểm trong giải đấu.</span></li>
                                <li><span class="font-medium">Số trận thắng cao nhất</span> và số lần lọt vào <span class="font-medium">Top 4</span> trong giai đoạn giải đấu (chiến thắng được tính gấp đôi).</li>
                                <li>Số lần đạt được từng thứ hạng cụ thể trong một lobby <span class="font-medium">(1st, 2nd, 3rd, v.v.)</span> trong giai đoạn giải đấu.</li>
                                <li>Vị trí hoàn thành trong trận đấu gần nhất của giai đoạn giải đấu, sau đó là thứ hạng của từng trận đấu trước đó <span class="font-medium">(ví dụ: Trận 5, 4, 3, v.v.).</span></li>
                            </ul>
                        `
                }
            },
        ]
    });

    const startTour = () => {
        driverObj.drive();
    };
    const getNavigation = () => navigationAll1.aov;
    const score = [
        { top: 1, point: 8 },
        { top: 2, point: 7 },
        { top: 3, point: 6 },
        { top: 4, point: 5 },
        { top: 5, point: 4 },
        { top: 6, point: 3 },
        { top: 7, point: 2 },
        { top: 8, point: 1 },
    ];


    // Tạo chuỗi theo định dạng "1st Place -> 8 Points"
    const pointsDisplay = score.map((item) => {
        return <p className='text-white'><strong className='text-[#ff7104]'>Hạng {item.top}</strong> → {item.point} Điểm</p>
    });
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

                        const response = await fetch(`https://bigtournament-hq9n.onrender.com/api/tft/match/${matchId}`);
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
                    const accountResponse = await fetch(`https://bigtournament-hq9n.onrender.com/api/accounts`, {
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
    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <span className="loading loading-dots loading-lg text-[#ff7104]"></span>
        </div>
    );
    if (error) return <p>Error: {error}</p>;

    const maxMatches = Math.max(...lobbies[day].map(lobby => lobby.matchIds.length));

    return (
        <div><MyNavbar2 navigation={getNavigation()} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
            <div className="mt-40 mx-auto lg:w-[85%] w-[92%]">
                <div className='flex lg:flex-row flex-col-reverse items-center justify-center'>
                    <div className='lg:w-[70%] w-full'>
                        <h2 className='uppercase p-2 text-base-content font-bold lg:text-[32px] text-[30px] lg:text-left text-center'>Bảng xếp hạng tổng - {day.toUpperCase()}</h2>
                        <h2 className='uppercase p-2 text-center lg:text-[25px] text-[18px] text-base-content font-bold'>Cách tính điểm</h2>
                        <div className="grid lg:grid-cols-4 grid-cols-1 bg-[#48042c] h-full rounded">
                            {pointsDisplay.map((text, index) => (
                                <div key={index} className={`px-2 lg:my-3 my-2 flex items-center lg:justify-center score-item ${index !== 3 && index !== 7 ? 'lg:border-r' : ''}`}>
                                    {text}
                                </div>
                            ))}
                        </div>
                        <button onClick={startTour} className="bg-[#48042c] font-bold text-white px-4 py-2 rounded-md mt-2 mb-4">
                            Luật Tiebreaker
                        </button>
                    </div>
                    <div className='lg:w-[30%] w-full flex items-center justify-center'>
                        <img src={DCN} className='lg:w-[250px] w-[150px] lg:mt-0 mt-5 h-auto' />
                    </div>
                </div>
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
                        <span className="ml-2">{showPlayers ? 'Hiển Thị Hạng' : 'Hiển Thị Điểm'}</span>
                    </div>
                </div>
                <div className="table-container">
                    <div className="overflow-x-auto rounded-es-lg rounded-ee-lg shadow-md border border-[#48042c] mb-10 ">
                        <div className='flex lg:flex-row flex-col-reverse items-center justify-center '>
                            <table border="1" cellPadding="10" cellSpacing="0" className="table-fixed min-w-full text-base-content lg:w-full w-[140%] font-semibold">
                                <thead className='bg-[#48042c] text-white'>
                                    <tr>
                                        <th className='p-2 bg-[#48042c] sticky left-0 z-10 lg:!w-[270px] !w-[180px]'>Game Name</th>
                                        <th className='px-4 py-2 text-center'>Tổng điểm</th>
                                        {Array.from({ length: maxMatches }).map((_, index) => (
                                            <th key={index} className='px-4 py-2 text-center'>Trận {index + 1}</th>
                                        ))}

                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.map((participant, index) => (
                                        <tr key={index} className="hover:bg-[#ff7104] hover:!text-white">
                                            <td className="lg:w-[210px] w-[150px] bg-base-100 text-base-content sticky left-0 z-10 p-2">
                                                <p className='lg:block hidden'>{participant.gameNameTag}</p>
                                                <p className='lg:hidden block'>{participant.gameName}</p>
                                            </td>
                                            <td className=" px-4 py-2 text-center font-semibold">{participant.totalPoints}</td>
                                            {Array.from({ length: maxMatches }).map((_, matchIndex) => (
                                                <td key={matchIndex} className='px-4 py-2 text-center'>{participant.points[matchIndex] || 0}</td>
                                            ))}

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default CombinedLeaderboard;