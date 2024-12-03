import React, { useEffect, useState } from 'react';
import axios from 'axios';

const RSO_Authorization = () => {
  const [tokens, setTokens] = useState(null); // Để lưu trữ token
  const [riotID, setRiotID] = useState(null); // Để lưu trữ riotID
  const [loading, setLoading] = useState(false); // Để hiển thị trạng thái loading
  const [error, setError] = useState(''); // Để hiển thị lỗi nếu có

  // Hàm xử lý đăng nhập Riot Games (chuyển hướng người dùng đến trang OAuth của Riot)
  const handleRiotLogin = () => {
    window.location.href = 'https://dongchuyennghiep-backend.vercel.app/auth/riot'; // Điều hướng đến backend của bạn (OAuth)
  };

  // Hàm xử lý callback từ Riot Games
  const handleOAuthCallback = async (code) => {
    setLoading(true);
    try {
      // Lấy token từ backend của bạn
      const response = await axios.get(`https://dongchuyennghiep-backend.vercel.app/oauth2-callback?code=${code}`);
      const tokensData = response.data;
      setTokens(tokensData); // Lưu token vào state

      // Sau khi có access token, gọi API của Riot Games để lấy thông tin người chơi
      const riotResponse = await axios.get('https://na1.api.riotgames.com/tft/summoner/v1/summoners/me', {
        headers: {
          Authorization: `Bearer ${tokensData.access_token}`, // Sử dụng access token để gọi API
        },
      });
      setRiotID(riotResponse.data.id); // Lưu riotID vào state

      setLoading(false);
    } catch (err) {
      setLoading(false);
      // Hiển thị thông báo lỗi chi tiết hơn nếu có
      setError(err.response ? err.response.data : 'Failed to authenticate with Riot Games');
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

          {riotID && (
            <div>
              <h3>Riot ID</h3>
              <p>{riotID}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RSO_Authorization;