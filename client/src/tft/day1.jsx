import React, { useEffect, useState } from 'react';
import DCN from '../image/LOGO.png'
import { driver } from "driver.js";
import { useParams } from 'react-router-dom';
import "driver.js/dist/driver.css";
import MyNavbar2 from "../components/Navbar2";

const MatchData = () => {
    const { day } = useParams();
    const [lobbyData, setLobbyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPlayers, setShowPlayers] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const roundIndex = day === 'day1' ? 1 : day === 'day2' ? 2 : 'Chung kết tổng';
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
    
    const navigationAll1 = {
        aov: [
          { name: "Vòng 1", href: "/tft/ranking/day1", current: location.pathname === "/tft/ranking/day1" },
          { name: "Vòng 2", href: "/tft/ranking/day2", current: location.pathname === "/tft/ranking/day2" },
        ],
      };
    const getNavigation = () => navigationAll1.aov;
    // Hàm kích hoạt hướng dẫn
    const startTour = () => {
        driverObj.drive();
    };
    const lobbies = {
        day1: [
            { id: 'Lobby 1', matchIds: ['0', '0', '0'] },
            { id: 'Lobby 2', matchIds: ['0', '0', '0'] },
            { id: 'Lobby 3', matchIds: ['0', '0', '0'] }
        ],
        day2: [
            { id: 'Lobby 1', matchIds: ['0', '0', '0'] },
            { id: 'Lobby 2', matchIds: ['0', '0', '0'] }
        ]
    };
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
        const scrollToTop = () => {
            document.documentElement.scrollTop = 0;
        };
        setTimeout(scrollToTop, 0);
        document.title = `Vòng ${roundIndex} giải TFT`;
    
    }, []);

    useEffect(() => {
        // Kiểm tra nếu 'day' có tồn tại trong lobbies
        if (!lobbies[day]) {
            setError('Không tìm thấy dữ liệu cho ngày này.');
            setLoading(false);
            return;
        }

        const fetchLobbyData = async () => {
            try {
                setLoading(true);
                const selectedLobbies = lobbies[day]; // Lấy lobbies của ngày cụ thể

                const lobbyPromises = selectedLobbies.map(async (lobby) => {
                    const matchPromises = lobby.matchIds.map(async (matchId) => {
                        if (matchId === '0') {
                            return { info: { participants: [] }, isFake: true };
                        }

                        const response = await fetch(`https://bigtournament.onrender.com/api/tft/match/${matchId}`);
                        if (!response.ok) throw new Error('Failed to fetch match data');
                        return response.json();
                    });

                    const matchData = await Promise.all(matchPromises);
                    const participantMap = {};

                    matchData.forEach((match, matchIndex) => {
                        if (match.isFake) {
                            Object.keys(participantMap).forEach((puuid) => {
                                participantMap[puuid].placements[matchIndex] = 'TBD';
                                participantMap[puuid].points[matchIndex] = 0;
                            });
                            return;
                        }

                        match.info.participants.forEach((participant) => {
                            const { puuid, placement } = participant;
                            if (!participantMap[puuid]) {
                                participantMap[puuid] = { puuid, placements: [], points: [] };
                            }
                            participantMap[puuid].placements[matchIndex] = placement || 'TBD';
                            participantMap[puuid].points[matchIndex] = placement ? (9 - placement) : 0;
                        });
                    });

                    const puuids = Object.keys(participantMap);
                    let accounts = JSON.parse(localStorage.getItem('accounts'));

                    if (!accounts) {
                        const accountResponse = await fetch(`https://bigtournament.onrender.com/api/accounts`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ puuids })
                        });

                        if (!accountResponse.ok) throw new Error('Failed to fetch account data');
                        accounts = await accountResponse.json();
                        localStorage.setItem('accounts', JSON.stringify(accounts));
                    }

                    const participants = Object.values(participantMap).map((participant, index) => ({
                        ...participant,
                        gameNameTag: `${accounts[index]?.gameName || 'Unknown'}#${accounts[index]?.tagLine || '0000'}`,
                        gameName: `${accounts[index]?.gameName || 'Unknown'}`,
                        totalPoints: participant.points.reduce((acc, curr) => acc + curr, 0)
                    }));

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
    }, [day]);



    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <span className="loading loading-dots loading-lg text-[#ff7104]"></span>
        </div>
    );
    if (error) return <p>Error: {error}</p>;

    return (
        <div><MyNavbar2 navigation={getNavigation()} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
        <div className="mt-40 mx-auto lg:w-[85%] w-[92%] ">
            <div className='flex lg:flex-row flex-col-reverse items-center justify-center'>
                <div className='lg:w-[70%] w-full'>
                    <h2 className='uppercase p-2 text-base-content font-bold lg:text-[40px] text-[30px] lg:text-left text-center'>Vòng {roundIndex}</h2>
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

            {lobbyData.map((lobby) => (
                <div key={lobby.lobbyId} className="mb-8">
                    <h2 className="text-lg font-bold text-center uppercase py-2 border rounded-ss-lg rounded-se-lg  border-[#48042c]">{lobby.lobbyId}</h2>

                    {/* Wrapper cho table */}
                    <div className="table-container">
                        <div className="overflow-x-auto rounded-es-lg rounded-ee-lg shadow-md border border-[#48042c]">
                            <table className="table-fixed min-w-full text-base-content lg:w-full w-[140%] font-semibold">
                                <thead className="bg-[#48042c] text-white">
                                    <tr>
                                        <th className="p-2 bg-[#48042c] sticky left-0 z-10 lg:!w-[270px] !w-[180px]"></th>
                                        <th className="px-4 py-2 text-center">Total</th>
                                        {Array.from({ length: lobby.matchCount }).map((_, index) => (
                                            <th key={index} className="px-4 py-2 text-center">
                                                Trận {index + 1}
                                            </th>
                                        ))}

                                    </tr>
                                </thead>
                                <tbody>
                                    {lobby.participants.map((participant, index) => (
                                        <tr key={participant.puuid} className="hover:bg-[#ff7104] hover:!text-white">
                                            <td className="lg:w-[210px] w-[150px] bg-base-100 text-base-content sticky left-0 z-10 p-2">
                                                <p className='lg:block hidden'>{participant.gameNameTag}</p>
                                                <p className='lg:hidden block'>{participant.gameName}</p>
                                                </td>
                                            <td className=" px-4 py-2 text-center font-semibold">{participant.totalPoints}</td>
                                            {Array.from({ length: lobby.matchCount }).map((_, matchIndex) => (
                                                <td key={matchIndex} className="px-4 py-2 text-center">
                                                    {showPlayers
                                                        ? participant.placements[matchIndex] || 'TBD'
                                                        : participant.points[matchIndex] || 0}
                                                </td>
                                            ))}

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        </div>
        
    );
};

export default MatchData;
