import React, { useState, useEffect } from "react";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { SiRiotgames,SiDiscord } from "react-icons/si";
import { Link, useNavigate } from 'react-router-dom';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    discordID:"",
    riotID: "",
    username: "",
    email: "",
    password: "",
    retypePassword: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(4); // Initialize countdown state

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{7,}$/;
    return passwordRegex.test(password);
  };

  const validateField = (name, value) => {
    let newErrors = { ...errors };

    switch (name) {
      case "discordID":
        if (!value.trim()) {
          newErrors.discordID = "Phải nhập Discord ID";
        } else {
          delete newErrors.discordID;
        }
        break;
      case "riotID":
        if (!value.trim()) {
          newErrors.riotID = "Phải nhập RiotID";
        } else {
          delete newErrors.riotID;
        }
        break;
      case "username":
        if (!value.trim()) {
          newErrors.username = "Phải nhập tên người dùng";
        } else {
          delete newErrors.username;
        }
        break;
      case "email":
        if (!value.trim()) {
          newErrors.email = "Phải nhập Email";
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = "Định dạng email không đúng";
        } else {
          delete newErrors.email;
        }
        break;
      case "password":
        if (!value) {
          newErrors.password = "Phải nhập mật khẩu";
        } else if (!validatePassword(value)) {
          newErrors.password = "Mật khẩu phải có ít nhất 7 ký tự, bao gồm một chữ cái viết hoa và một số";
        } else {
          delete newErrors.password;
        }
        if (formData.retypePassword && value !== formData.retypePassword) {
          newErrors.retypePassword = "Mật khẩu không khớp";
        } else {
          delete newErrors.retypePassword;
        }
        break;
      case "retypePassword":
        if (!value) {
          newErrors.retypePassword = "Nhập lại mật khẩu";
        } else if (value !== formData.password) {
          newErrors.retypePassword = "Mật khẩu không khớp";
        } else {
          delete newErrors.retypePassword;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      validateField(key, formData[key]);
    });

    if (Object.keys(newErrors).length === 0) {
      try {
        setLoading(true);
        setErrorMessage("");

        const res = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        setLoading(false);

        if (data.success === false) {
          setErrorMessage(data.message || "Something went wrong!");
          return;
        }

        setSignupSuccess(true);
      } catch (error) {
        setLoading(false);
        setErrorMessage("An error occurred. Please try again.");
      }
    } else {
      setErrors(newErrors);
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === "password") {
      setShowPassword(!showPassword);
    } else {
      setShowRetypePassword(!showRetypePassword);
    }
  };

  useEffect(() => {
    if (signupSuccess) {
      const timer = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);

      if (countdown === 0) {
        navigate('/');
      }

      // Cleanup the interval on component unmount
      return () => clearInterval(timer);
    }
  }, [signupSuccess, countdown, navigate]);

  if (signupSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Đăng kí thành công!</h2>
          <p className="text-center text-gray-600">
            Cảm ơn bạn đã tạo tài khoản. Bây giờ bạn có thể đăng nhập bằng thông tin đăng nhập của mình.
          </p>
          <p className="text-center text-gray-600 mt-4">
            Tự động chuyển tới trang chủ trong {countdown} giây...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center mt-16">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Create an Account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Riot ID Input */}
          <div>
            <label htmlFor="riotID" className="block text-sm font-medium text-gray-700">
              Riot ID
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SiRiotgames className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                name="riotID"
                id="riotID"
                className={`bg-white text-black block w-full pl-10 pr-3 py-2 border ${errors.riotID ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder="Enter your Riot ID"
                value={formData.riotID}
                onChange={handleChange}
                aria-invalid={errors.riotID ? "true" : "false"}
                aria-describedby="riotID-error"
              />
            </div>
            {errors.riotID && (
              <p className="mt-2 text-sm text-red-600" id="riotID-error">
                {errors.riotID}
              </p>
            )}
          </div>
                      {/* Discord ID Input */}
          <div>
            <label htmlFor="discordID" className="block text-sm font-medium text-gray-700">
              Discord ID
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SiDiscord className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                name="discordID"
                id="discordID"
                className={`bg-white text-black block w-full pl-10 pr-3 py-2 border ${errors.discordID ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder="Enter your Discord ID"
                value={formData.discordID}
                onChange={handleChange}
                aria-invalid={errors.discordID ? "true" : "false"}
                aria-describedby="discordID-error"
              />
            </div>
            {errors.discordID && (
              <p className="mt-2 text-sm text-red-600" id="riotID-error">
                {errors.discordID}
              </p>
            )}
          </div>
          {/* Username Input */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                name="username"
                id="username"
                className={`bg-white text-black block w-full pl-10 pr-3 py-2 border ${errors.username ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                aria-invalid={errors.username ? "true" : "false"}
                aria-describedby="username-error"
              />
            </div>
            {errors.username && (
              <p className="mt-2 text-sm text-red-600" id="username-error">
                {errors.username}
              </p>
            )}
          </div>

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="email"
                name="email"
                id="email"
                className={`bg-white text-black block w-full pl-10 pr-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby="email-error"
              />
            </div>
            {errors.email && (
              <p className="mt-2 text-sm text-red-600" id="email-error">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                className={`bg-white text-black block w-full pl-10 pr-10 py-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby="password-error"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
                  onClick={() => togglePasswordVisibility("password")}
                >
                  {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-red-600" id="password-error">
                {errors.password}
              </p>
            )}
          </div>

          {/* Retype Password Input */}
          <div>
            <label htmlFor="retypePassword" className="block text-sm font-medium text-gray-700">
              Retype Password
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type={showRetypePassword ? "text" : "password"}
                name="retypePassword"
                id="retypePassword"
                className={`bg-white text-black block w-full pl-10 pr-10 py-2 border ${errors.retypePassword ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder="Retype your password"
                value={formData.retypePassword}
                onChange={handleChange}
                aria-invalid={errors.retypePassword ? "true" : "false"}
                aria-describedby="retypePassword-error"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
                  onClick={() => togglePasswordVisibility("retypePassword")}
                >
                  {showRetypePassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            {errors.retypePassword && (
              <p className="mt-2 text-sm text-red-600" id="retypePassword-error">
                {errors.retypePassword}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              {loading ? 'Loading...' : 'Sign Up'}
            </button>
          </div>

          {errorMessage && (
            <p className="mt-2 text-sm text-red-600 text-center">
              {errorMessage}
            </p>
          )}
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/signin" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
