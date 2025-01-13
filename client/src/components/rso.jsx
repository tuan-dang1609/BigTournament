import React, { useEffect, useState } from "react";

function App() {
  const [loggedInUser, setLoggedInUser] = useState("");

  useEffect(() => {
    // Lấy access_token, gameName, và tagName từ URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const gameName = urlParams.get("gameName");
  const tagName = urlParams.get("tagName");

  if (gameName && tagName) {
    setLoggedInUser(`${gameName}#${tagName}`);
  }
}, []);


  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">
          Riot Sign-On
        </h1>

        <div className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-4">
  {!loggedInUser ? (
    <button
      onClick={() => (window.location.href = "https://dongchuyennghiep-backend.vercel.app/sso/login-riot")}
      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
    >
      Đăng nhập với Riot Games
    </button>
  ) : (
    <button
      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-between"
    >
      <span>{loggedInUser}</span>
      <span
        className="text-white ml-2 cursor-pointer"
        onClick={() => setLoggedInUser("")} // Xóa loggedInUser khi nhấn nút "X"
      >
        X
      </span>
    </button>
  )}
</div>

</div>

      </div>
    </div>
  );
}

export default App;
