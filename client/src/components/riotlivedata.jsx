// RiotLiveData.jsx
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  path: '/livetest/socket.io', // 👈 phải trùng với backend
  withCredentials: true,
}); // hoặc backend URL nếu deploy

function RiotLiveData() {
  const [riotData, setRiotData] = useState(null);

  useEffect(() => {
    socket.on('riotData', (data) => {
      console.log('📡 Received from backend:', data);
      setRiotData(data); // hoặc JSON.parse nếu data là JSON
    });

    return () => {
      socket.off('riotData');
    };
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">🔴 Riot WebSocket Data:</h2>
      <pre className="bg-gray-100 p-2 rounded text-sm">
        {riotData ? riotData : 'Waiting for data...'}
      </pre>
    </div>
  );
}

export default RiotLiveData;
