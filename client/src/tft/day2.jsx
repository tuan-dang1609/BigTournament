import React, { useEffect, useState } from 'react';
import DCN from '../image/waiting.png'
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import MyNavbar2 from "../components/Navbar2";
const MatchData = () => {
    const [lobbyData, setLobbyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPlayers, setShowPlayers] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const roundIndex =  'Chung kết tổng';
    const driverObj = driver({
        showProgress: true,
        steps: [
            {
                popover: {
                    title: 'Luật Checkmate',
                    description: `
                        <ul class="mt-2 list-disc list-inside space-y-2 text-sm font-semibold">
                            <li><span class="font-medium">Người chơi đầu tiên đạt được 20 điểm sẽ đặt lobby vào trạng thái "check".</span></li>
                            <li><span class="font-medium">Sau khi đạt 20 điểm, người chơi đó cần giành vị trí thứ nhất trong một ván đấu tiếp theo để giành chiến thắng chung cuộc.</span></li>
                            <li><span class="font-medium">Nếu có nhiều người chơi đạt 20 điểm, tất cả đều có cơ hội giành chiến thắng bằng cách về nhất trong các ván đấu tiếp theo.</span></li>
                            <li><span class="font-medium">Chung kết tổng sẽ tiếp tục cho đến khi một người chơi đủ điều kiện (đã đạt 20 điểm) giành được vị trí thứ nhất.</span></li>
                            <li><span class="font-medium">Tối đa 7 ván đấu sẽ được chơi trong Chung kết tổng.</span></li>
                            <li><span class="font-medium">Nếu sau 7 ván đấu vẫn chưa có người chiến thắng, người chơi đủ điều kiện có thứ hạng cao nhất trong ván đấu thứ 7 sẽ được công nhận là nhà vô địch.</span></li>
                        </ul>
                    `
                }
            },
        ]
    });
    const participantMap = {};
    const navigationAll1 = {
        aov: [
            { name: "Vòng 1", href: "/tft/ranking/total/day1", current: location.pathname === "/tft/ranking/total/day1" },
            { name: "Vòng 2", href: "/tft/ranking/total/day2", current: location.pathname === "/tft/ranking/total/day2" },
            { name: "Chung kết tổng", href: "/tft/grandfinal", current: location.pathname === "/tft/grandfinal" },
        ],
    };
    const getNavigation = () => navigationAll1.aov;
    // Hàm kích hoạt hướng dẫn
    const startTour = () => {
        driverObj.drive();
    };
    const lobbies = [
        { id: 'Lobby 1', matchIds: ['VN2_792107377', 'VN2_792163516', 'VN2_792224651', 'VN2_792279979', 'VN2_792339190', '0', '0'] },
    ];

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

    const getPoints = (placement) => {
        if (placement >= 1 && placement <= 8) {
            return 9 - placement;
        }
        return 0;
    };

    useEffect(() => {
        const scrollToTop = () => {
            document.documentElement.scrollTop = 0;
        };

        setTimeout(scrollToTop, 0);
        document.title = "Chung kết tổng giải TFT";
    }, []);

    useEffect(() => {
        const fetchLobbyData = async () => {
            try {
                setLoading(true);

                const lobbyPromises = lobbies.map(async (lobby) => {
                    const matchPromises = lobby.matchIds.map(async (matchId) => {
                        if (matchId === '0') {
                            return { info: { participants: [] }, isFake: true }; // Đánh dấu trận giả
                        }

                        const response = await fetch(`https://bigtournament-hq9n.onrender.com/api/tft/match/${matchId}`);
                        if (!response.ok) {
                            throw new Error('Failed to fetch match data');
                        }
                        return response.json();
                    });

                    const matchData = await Promise.all(matchPromises);

                    const participantMap = {};

                    matchData.forEach((match, matchIndex) => {
                        if (match.isFake) {
                            // Trận giả, gán tất cả người chơi có placement "N/A" và điểm 0
                            Object.keys(participantMap).forEach((puuid) => {
                                participantMap[puuid].placements[matchIndex] = 'TBD';
                                participantMap[puuid].points[matchIndex] = 0;
                            });
                            return;
                        }

                        match.info.participants.forEach((participant) => {
                            const { puuid, placement } = participant;

                            if (!participantMap[puuid]) {
                                participantMap[puuid] = { puuid, placements: [], points: [], note: '' };
                            }

                            participantMap[puuid].placements[matchIndex] = placement || 'TBD';
                            participantMap[puuid].points[matchIndex] = placement ? getPoints(placement) : 0;

                            // Cập nhật ghi chú ngay khi có đủ điều kiện
                            const totalPoints = participantMap[puuid].points.reduce((acc, curr) => acc + curr, 0);
                            if (totalPoints >= 20 && matchIndex >= 4 && participantMap[puuid].placements[matchIndex] === 1) {
                                participantMap[puuid].note = 'Top 1';
                            }
                        });
                    });

                    // Fetch account data only once and cache it in localStorage
                    const puuids = Object.keys(participantMap);
                    let accounts = JSON.parse(localStorage.getItem('accounts'));
                    if (!accounts) {
                        const accountResponse = await fetch(`https://bigtournament-hq9n.onrender.com/api/accounts`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ puuids })
                        });
                        if (!accountResponse.ok) {
                            throw new Error('Failed to fetch account data');
                        }
                        accounts = await accountResponse.json();
                        // Cache the account data in localStorage
                        localStorage.setItem('accounts', JSON.stringify(accounts));
                    }

                    const participants = Object.values(participantMap).map((participant, index) => {
                        const totalPoints = participant.points.reduce((acc, curr) => acc + curr, 0);
                        return {
                            ...participant,
                            gameNameTag: `${accounts[index]?.gameName || 'Unknown'}#${accounts[index]?.tagLine || '0000'}`,
                            gameName: `${accounts[index]?.gameName || 'Unknown'}`,
                            totalPoints,
                            note: participant.note,
                            checkmate: totalPoints >= 20 ? '✅' : '❌',
                        };
                    });


                    // Sort by total points
                    participants.sort((a, b) => {
                        if (a.note === 'thắng nhờ top 1' && b.note !== 'thắng nhờ top 1') {
                            return -1;
                        } else if (a.note !== 'thắng nhờ top 1' && b.note === 'thắng nhờ top 1') {
                            return 1;
                        } else {
                            return b.totalPoints - a.totalPoints;
                        }
                    });

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

    const checkSpecialCondition = (participant) => {
        let note = '';
        let checkmate = false;

        if (participant.totalPoints >= 20) {
            checkmate = true;
            if (participant.points.includes(8)) {
                note = 'thắng nhờ top 1';
            }
        }

        return { note, checkmate };
    };

    // In the fetchLobbyData function
    const participants = Object.values(participantMap).map((participant, index) => {
        const { note, checkmate } = checkSpecialCondition(participant);
        return {
            ...participant,
            gameNameTag: `${accounts[index]?.gameName || 'Unknown'}#${accounts[index]?.tagLine || '0000'}`,
            gameName: `${accounts[index]?.gameName || 'Unknown'}`,
            totalPoints: participant.points.reduce((acc, curr) => acc + curr, 0),
            note,
            checkmateStatus: checkmate ? 'Đạt' : 'Chưa đạt',
        };
    });




    if (loading) return (
        <div>Loading...</div>
    );

    return (
        <div><MyNavbar2 navigation={getNavigation()} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
            <div className='mt-40 mx-auto lg:w-[88%] w-[92%]'>
                <div className='flex lg:flex-row flex-col-reverse items-center justify-center'>
                    <div className='lg:w-[70%] w-full'>
                        <h2 className='uppercase p-2 text-base-content font-bold lg:text-[30px] text-[30px] lg:text-left text-center'>{roundIndex}</h2>
                        <h2 className='uppercase p-2 text-center lg:text-[25px] text-[18px] text-base-content font-bold'>Cách tính điểm</h2>
                        <div className="grid lg:grid-cols-4 grid-cols-1 bg-[#48042c] h-full rounded">
                            {pointsDisplay.map((text, index) => (
                                <div key={index} className={`px-2 lg:my-3 my-2 flex items-center lg:justify-center score-item ${index !== 3 && index !== 7 ? 'lg:border-r' : ''}`}>
                                    {text}
                                </div>
                            ))}
                        </div>
                        <button onClick={startTour} className="bg-[#48042c] font-bold text-white px-4 py-2 rounded-md mt-2 mb-4">
                            Luật Checkmate
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
                {lobbyData.map((lobby, index) => (
                    <div className="table-container mb-10">
                        <div className="overflow-x-auto rounded-es-lg rounded-ee-lg shadow-md border border-[#48042c]">
                            <table key={index} className=" table-fixed min-w-full text-base-content lg:w-full md:w-[170%] w-[300%] font-semibold">
                                <thead className="bg-[#48042c] text-white ">
                                    <tr>

                                        <th className='p-2 bg-[#48042c] sticky left-0 z-10 lg:!w-[210px] w-[120px] md:!w-[180px]'>Tên Người Chơi</th>
                                        <th>Tổng Điểm</th>
                                        {Array.from({ length: lobby.matchCount }, (_, i) => (
                                            <th key={i}>Trận {i + 1}</th>
                                        ))}

                                        <th>Ghi chú</th>
                                        <th className=''>Checkmate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lobby.participants.map((participant, index) => (
                                        <tr key={index} className="hover:bg-[#ff7104] hover:!text-white">
                                            <td className="lg:w-[210px] w-[180px] bg-base-100 text-base-content sticky left-0 z-10 p-2">
                                                <p className='lg:block hidden'>{participant.gameNameTag}</p>
                                                <p className='lg:hidden block'>{participant.gameName}</p>
                                            </td>
                                            <td className=" px-4 py-2 text-center font-semibold">{participant.totalPoints}</td>
                                            {Array.from({ length: lobby.matchCount }, (_, matchIndex) => (
                                                <td key={matchIndex} className="px-4 py-2 text-center">{showPlayers ? participant.placements[matchIndex] || 'TBD' : participant.points[matchIndex] || 0}</td>
                                            ))}

                                            <td className='text-center'>{participant.note}</td>
                                            <td className='text-center'>{participant.checkmate}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

};

export default MatchData;