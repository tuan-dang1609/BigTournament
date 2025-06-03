import React, { useEffect, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useDispatch, useSelector } from 'react-redux';
import { signInStart, signInFailure, signInSuccess } from '../../redux/user/userSlice';
import { useNavigate, useLocation, Link } from 'react-router-dom';

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const { loading, error } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation(); // To capture the previous link
  useEffect(() => {
    document.title = 'Đăng nhập';
  }, []);
  // Check if there's a 'from' location or default to home ('/')
  const from = location.state?.from?.pathname || '/tft/tft_set_10';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(signInStart());
    try {
      const res = await fetch('https://bigtournament-hq9n.onrender.com/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success === false) {
        dispatch(signInFailure(data));
        return;
      }

      dispatch(signInSuccess(data));

      // Navigate to the original page or default to '/'
      navigate(from, { replace: true });
    } catch (error) {
      dispatch(signInFailure(error));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center text-gray-800">
          Đăng Nhập
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="mt-1 text-black block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
                disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
              placeholder="Enter your username"
              required
              aria-label="Username"
              autoComplete="current-username"
            />
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 text-black block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none"
                placeholder="Enter your password"
                required
                aria-label="Password"
                autoComplete="current-password"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500 transition ease-in-out duration-150"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5" />
                  ) : (
                    <FaEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              {loading ? 'Đăng nhập vào ' : 'Đăng nhập'}
              {loading ? <AiOutlineLoading3Quarters className="animate-spin h-5 w-5 ml-2" /> : null}
            </button>
          </div>
        </form>
        {error && (
          <p className="mt-4 text-center text-sm text-red-600">
            {error.message || 'Something went wrong!'}
          </p>
        )}
        <p className="mt-4 text-center text-sm text-gray-600">
          Chưa có tài khoản?{' '}
          <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
            Đăng kí
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-gray-600">
          <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
            Quên mật khẩu?
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginForm;
