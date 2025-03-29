import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ForgotPassword() {
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('https://bigtournament.onrender.com/api/auth/alluser',{method: 'POST'});
      const users = await res.json();

      const matchedUser = users.find(
        (user) =>
          user.username.toLowerCase() === username.toLowerCase() &&
          user.nickname.toLowerCase() === nickname.toLowerCase()
      );

      if (!matchedUser) {
        setMessage({ type: 'error', text: 'Không tìm thấy người dùng phù hợp.' });
        return;
      }
      // Gửi yêu cầu reset password
      const updateRes = await fetch(`https://bigtournament.onrender.com/api/user/update/${matchedUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'HoangTuan2004' }),
      });

      const updateData = await updateRes.json();

      if (updateData.success === false) {
        setMessage({ type: 'error', text: 'Đặt lại mật khẩu thất bại.' });
      } else {
        setMessage({ type: 'success', text: 'Mật khẩu đã được đặt lại thành "HoangTuan2004".' });
        setTimeout(() => navigate('/signin'), 2500);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra. Vui lòng thử lại sau.' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Quên Mật Khẩu</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 text-black block w-full px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              required
            />
          </div>
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">Nickname</label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="mt-1 text-black block w-full px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow"
          >
            Đặt lại mật khẩu
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-center text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
