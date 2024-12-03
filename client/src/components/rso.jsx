import React, { useEffect, useState } from 'react';
import axios from 'axios';

const RSO_Authorization = () => {
  const [tokens, setTokens] = useState(null); // Để lưu trữ token
  const [loading, setLoading] = useState(false); // Để hiển thị trạng thái loading
  const [error, setError] = useState(''); // Để hiển thị lỗi nếu có

  // Hàm xử lý đăng nhập Riot Games (chuyển hướng người dùng đến trang OAuth của Riot)
  const handleRiotLogin = () => {
    window.location.href = 'http://localhost:3000/auth/riot'; // Điều hướng đến backend của bạn (OAuth)
  };

  // Hàm xử lý callback từ Riot Games
  const handleOAuthCallback = async (code) => {
    setLoading(true);
    try {
      // Gửi mã "code" qua backend để lấy token
      const response = await axios.get(`http://localhost:3000/oauth?code=${code}`);
      setTokens(response.data); // Lưu token vào state
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('Failed to authenticate with Riot Games');
    }
  };

  useEffect(() => {
    // Lấy "code" từ query string nếu có sau khi người dùng được redirect từ Riot
    const queryParams = new URLSearchParams(window.location.search);
    const code = queryParams.get('code');

    if (code) {
      handleOAuthCallback(code); // Nếu có code thì gọi hàm xử lý callback
    }
  }, []);

  return (
    <div className="App mt-40">
      <h1>Login with Riot Games</h1>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Nếu chưa có token, hiển thị nút đăng nhập */}
      {!tokens ? (
        <button onClick={handleRiotLogin}>Sign In with Riot Games</button>
      ) : (
        <div>
          <h2>Successfully Authenticated</h2>
          {/* Hiển thị token dưới dạng JSON trong thẻ <pre> */}
          <pre>{JSON.stringify(tokens, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default RSO_Authorization;
