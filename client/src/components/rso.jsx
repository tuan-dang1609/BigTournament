import React, { useState } from "react";
import axios from "axios";

function App() {
  const [accessToken, setAccessToken] = useState("");
  const [userInfo, setUserInfo] = useState(null);

  const handleLogin = () => {
    const riotAuthUrl = "http://localhost:3000/auth/riot"; // Backend URL
    window.location.href = riotAuthUrl;
  };

  const fetchUserInfo = async () => {
    if (!accessToken) {
      alert("Vui lòng đăng nhập trước.");
      return;
    }

    try {
      const response = await axios.get("http://localhost:3000/auth/userinfo", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setUserInfo(response.data);
    } catch (error) {
      console.error("Error fetching user info:", error);
      alert("Lỗi lấy thông tin tài khoản.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">
          Riot Sign-On
        </h1>

        <div className="flex flex-col space-y-4">
          {!accessToken ? (
            <button
              onClick={handleLogin}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
            >
              Đăng nhập với Riot Games
            </button>
          ) : (
            <div>
              <p className="text-green-500 text-center mb-2">
                Đăng nhập thành công!
              </p>
              <button
                onClick={fetchUserInfo}
                className="bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg"
              >
                Lấy Thông Tin Tài Khoản
              </button>
            </div>
          )}

          {userInfo && (
            <div className="bg-gray-100 rounded-lg p-4 mt-4">
              <h2 className="text-lg font-bold mb-2">Thông Tin Tài Khoản:</h2>
              <pre className="text-sm bg-white p-2 rounded">{JSON.stringify(userInfo, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;