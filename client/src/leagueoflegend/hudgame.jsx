import React, { useEffect, useState } from 'react';

const LiveGameDataLOL = () => {
  const [gameData, setGameData] = useState(null);

  useEffect(() => {
    // Hàm fetch dữ liệu từ API
    const fetchGameData = async () => {
      try {
        const response = await fetch(
          'https://bigtournament-1.onrender.com/api/auth/register/api/livegame'
        ); // Proxy backend
        const data = await response.json();
        setGameData(data);
      } catch (error) {
        console.error('Error fetching game data:', error);
      }
    };

    // Thiết lập để fetch liên tục mỗi 1 giây
    const interval = setInterval(fetchGameData, 1000);

    // Clear interval khi component unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-20">
      <h1>Live Game Data</h1>
      {gameData ? <pre>{JSON.stringify(gameData, null, 2)}</pre> : <p>Loading...</p>}
    </div>
  );
};

export default LiveGameDataLOL;
