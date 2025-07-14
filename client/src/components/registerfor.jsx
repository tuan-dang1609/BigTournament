import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import axios from 'axios';
import Image from '../image/waiting.png';
import { useNavigate, Link } from 'react-router-dom';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
const TeamRegistrationForm = () => {
  // Thêm state để lưu file ảnh logo
  const [logoFile, setLogoFile] = useState(null);
  const { currentUser } = useSelector((state) => state.user);
  const [formData, setFormData] = useState({
    discordID: currentUser.discordID,
    usernameregister: currentUser._id,
    teamName: '',
    shortName: '',
    classTeam: [],
    logoUrl: '',
    color: '',
    gameMembers: [],
  });
  const [userRegister, setUserRegister] = useState(null); // Check if user is already registered
  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState(null);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [loading, setLoading] = useState(true); // Loading state
  const [checkingRegistration, setCheckingRegistration] = useState(true); // New state for checking registration
  const [allUsers, setAllUsers] = useState([]); // Lưu tất cả người dùng
  const [suggestions, setSuggestions] = useState([]); // Lưu danh sách gợi ý
  const [activeInputIndex, setActiveInputIndex] = useState(null); // Theo dõi ô input đang nhập
  const [playerCount, setPlayerCount] = useState(6);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [classTeamInput, setClassTeamInput] = useState('');
  const navigate = useNavigate();

  const driverObj = driver({
    showProgress: true,
    steps: [
      {
        popover: {
          title: 'Chào mừng',
          description:
            'Chào mừng bạn tới form đăng ký giải đấu DCN Inter-Class Esport Cup 2025. Mình sẽ hướng dẫn chi tiết cách điền nhé.',
        },
      },
      {
        element: '#teamName',
        popover: {
          title: 'Tên đội',
          description:
            'Hãy nhập tên đội của bạn, tối đa là 25 ký tự. Lưu ý là không được đặt tên đội phản cảm, thiếu văn minh nhé.',
        },
      },
      {
        element: '#shortName',
        popover: {
          title: 'Tên viết tắt của đội',
          description:
            'Hãy nhập tên viết tắt đội bạn, tối đa là 5 ký tự. Lưu ý là tên viết tắt đội phải không mang hàm ý xấu hay thiếu văn minh nhé',
        },
      },
      {
        element: '#classTeam',
        popover: {
          title: 'Lớp',
          description:
            'Hãy nhập các lớp sẽ có trong tổ chức. Cú pháp: xAy, trong đó x là 10,11,12 và y là thứ tự lớp trong khối. Team cựu học sinh sẽ ghi là Cựu. Lưu ý là tối đa 3 lớp. Cú pháp đăng ký từ 2 lớp trở lên: xAy xAz. Ví dụ: 11A1 12A2 (tổ chức sẽ là 2 lớp)',
        },
      },
      {
        element: '#logoUrl',
        popover: {
          title: 'Logo ID',
          description:
            'Link logo sẽ có dạng này: https://drive.google.com/file/d/1_hPEfE40 vuTmbCCVUFsVEwMai-B4je3z/view?usp=drive_link. Ảnh nhớ để chế độ Công Khai (Public) và có size 256x256 và clear background.',
        },
      },
      {
        element: '#color',
        popover: { title: 'Màu chủ đạo của đội', description: 'Chọn màu chủ đạo cho đội bạn.' },
      },
      {
        element: '#num',
        popover: {
          title: 'Ghi số lượng người chơi',
          description:
            'Ghi số lượng người chơi có trong tổ chức. Tối thiểu là 6 người, tối đa là 20 người chơi trong 1 tổ chức',
        },
      },
      {
        element: '#nickname',
        popover: {
          title: 'Nhập IGN',
          description:
            'Điền nickname của các thành viên đăng ký. Lưu ý là các người chơi phải đăng ký tài khoản trên website của DCN thì mới điền đưọc vào đây. Nếu các bạn nhập sai/không có tên thì sẽ tự động xóa.',
        },
      },
      {
        element: '#submitTeam',
        popover: {
          title: 'Nộp đội',
          description:
            'Khi bạn đã điền đúng theo yêu cầu, bạn sẽ nộp được. Sau khi nộp, các bạn có thể kiểm tra đội mình bằng cách lướt xuống mục các đội tham dự ở trang chủ nhé.',
        },
      },
      {
        popover: {
          title: 'Kết thúc',
          description:
            'Như vậy là mình đã hướng dẫn các bạn cách điền form rồi nhé. Các bạn vẫn có thể cập nhật form này trong suốt giai đoạn đăng ký đội hình. Tụi mình sẽ chỉ giải đáp khi có lỗi (Bug) trong quá trình đăng ký. Hạn chót đã được thông báo ở Announcement Discord. Hẹn gặp lại các bạn ở giải đấu nhé!',
        },
      },
    ],
  });

  // Hàm kích hoạt hướng dẫn
  const startTour = () => {
    driverObj.drive();
  };
  useEffect(() => {
    if (playerCount >= 6 && playerCount <= 20) {
      const updatedMembers = Array.from({ length: playerCount }, (_, i) => {
        return formData.gameMembers[i] || { nickname: '', class: '' };
      });
      setFormData({ ...formData, gameMembers: updatedMembers });
    }
  }, [playerCount]);
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await axios.get(
          'https://bigtournament-hq9n.onrender.com/api/auth/alluser'
        ); // POST request
        const users = Array.isArray(response.data) ? response.data : response.data.users || [];
        setAllUsers(users); // Lưu vào state
      } catch (error) {
        console.error('Lỗi khi lấy danh sách tất cả người dùng:', error);
      }
    };

    fetchAllUsers();
  }, []); // Chỉ chạy một lần khi component mount

  useEffect(() => {
    if (userRegister && userRegister._id) {
      setFormData({
        discordID: userRegister.discordID || currentUser.discordID,
        usernameregister: userRegister.usernameregister || currentUser._id,
        teamName: userRegister.team || '',
        shortName: userRegister.shortname || '',
        classTeam: userRegister.class || [],
        logoUrl: userRegister.logoURL || '',
        color: userRegister.color || '',
        gameMembers: Array.isArray(userRegister.players) ? userRegister.players : [],
      });
      setClassTeamInput(userRegister.class?.join(' ') || '');
      console.log('userRegister.players:', userRegister.players);
    }
  }, [userRegister]);
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch(
          'https://bigtournament-hq9n.onrender.com/api/auth/checkregisterorz',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ usernameregister: currentUser._id }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setUserRegister(data); // Save the fetched user registration info
      } catch (error) {
      } finally {
        setLoading(false); // Set loading to false once the check is complete
        setCheckingRegistration(false); // Checking registration is done
      }
    };

    fetchTeams();
  }, [currentUser]);

  useEffect(() => {
    const scrollToTop = () => {
      document.documentElement.scrollTop = 0;
    };
    setTimeout(scrollToTop, 0);
    document.title = 'Form đăng kí giải';
  }, []);

  useEffect(() => {
    if (signupSuccess) {
      const timer = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);

      if (countdown === 0) {
        navigate('/valorant');
      }

      return () => clearInterval(timer);
    }
  }, [signupSuccess, countdown, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    let processedValue = value;

    if (name === 'logoUrl') {
      // Tìm ID trong link Google Drive (từ /d/ đến /)
      const match = value.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
      processedValue = match ? match[1] : value;
    }

    setFormData({ ...formData, [name]: processedValue });
    validateField(name, processedValue);
  };
  const handleMemberChange = (index, value) => {
    setActiveInputIndex(index);

    const updatedGameMembers = [...formData.gameMembers]; // ✅ clone đúng kiểu array
    updatedGameMembers[index].nickname = value; // ✅ cập nhật nickname
    setFormData({ ...formData, gameMembers: updatedGameMembers });

    if (value.length > 0) {
      const filteredUsers = allUsers
        .filter(
          (user) =>
            user.nickname.toLowerCase().includes(value.toLowerCase()) ||
            user.riotId.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 5);
      setSuggestions(filteredUsers);
    } else {
      setSuggestions([]);
    }
  };
  // ⚠️ Thay vì removeMember(game, index), dùng:
  const removeMember = (index) => {
    const updated = formData.gameMembers.filter((_, i) => i !== index);
    setFormData({ ...formData, gameMembers: updated });
    setPlayerCount(updated.length);
  };

  const handleNicknameBlur = (index) => {
    setTimeout(() => {
      const value = formData.gameMembers[index].nickname;
      const isValid = allUsers.some((user) => user.nickname === value);
      if (!isValid) {
        const updated = [...formData.gameMembers];
        updated[index].nickname = '';
        setFormData({ ...formData, gameMembers: updated });
      }
      setActiveInputIndex(null);
    }, 200);
  };

  const validateField = (name, value) => {
    let newErrors = { ...errors };

    switch (name) {
      case 'teamName':
        if (!value.trim()) {
          newErrors.teamName = 'Bạn phải nhập tên đội';
        } else {
          delete newErrors.teamName;
        }
        break;
      case 'shortName':
        if (!value.trim()) {
          newErrors.shortName = 'Bạn phải nhập tên viết tắt của đội';
        } else if (value.length > 5) {
          newErrors.shortName = 'Tên viết tắt của đội không được quá 5 kí tự';
        } else {
          delete newErrors.shortName;
        }
        break;
      case 'classTeam':
        if (!Array.isArray(value) || value.length === 0) {
          newErrors.classTeam = 'Bạn phải nhập lớp';
        } else {
          delete newErrors.classTeam;
        }
        break;
      case 'logoUrl':
        if (!value.trim()) {
          newErrors.logoUrl = 'Bạn phải nhập Logo ID';
        } else {
          delete newErrors.logoUrl;
        }
        break;
      case 'color':
        if (!value.trim()) {
          newErrors.color = 'Bạn phải nhập màu chủ đạo cho đội của mình';
        } else {
          delete newErrors.color;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let tempErrors = { ...errors };
    const formFields = ['teamName', 'shortName', 'classTeam', 'logoUrl', 'gameMembers'];
    formFields.forEach((field) => validateField(field, formData[field]));

    // Debug log các giá trị trước khi submit
    console.log('logoFile:', logoFile);
    console.log('formData.logoUrl trước khi upload:', formData.logoUrl);

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      setSubmitStatus({ success: false, message: 'Please fix the errors in the form.' });
      return;
    }

    let logoUrl = formData.logoUrl;
    if (logoFile) {
      const formDataFile = new FormData();
      formDataFile.append('image', logoFile);
      try {
        const res = await axios.post('http://localhost:3000/api/upload-image', formDataFile, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        // Debug log kết quả upload
        console.log('Kết quả upload:', res.data);
        // Đảm bảo url là /image/filename
        if (res.data.url && res.data.url.includes('/image/')) {
          logoUrl = res.data.url;
        } else if (res.data.filename) {
          logoUrl = `/image/${res.data.filename}`;
        } else {
          logoUrl = res.data.url || '';
        }
      } catch (err) {
        setSubmitStatus({
          success: false,
          message: 'Lỗi upload ảnh: ' + (err.response?.data?.error || err.message),
        });
        return;
      }
    }

    // Debug log logoUrl trước khi gửi đăng ký
    console.log('logoUrl gửi lên backend:', logoUrl);

    try {
      const response = await axios.post(
        'https://bigtournament-hq9n.onrender.com/api/auth/registerorz',
        { ...formData, logoUrl }
      );
      // Debug log kết quả đăng ký
      console.log('Kết quả đăng ký:', response.data);
      setSubmitStatus({ success: true, message: 'Team registered successfully!' });
      setSignupSuccess(true);
      setFormData({
        teamName: '',
        shortName: '',
        classTeam: [],
        logoUrl: '',
        color: '',
        gameMembers: [],
      });
      setLogoFile(null);
      setErrors({});
    } catch (error) {
      setSubmitStatus({
        success: false,
        message: error.response?.data?.message || error.message || 'An unexpected error occurred.',
      });
    }
  };

  if (checkingRegistration) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="p-8 rounded-lg shadow-md w-full max-w-xl mx-2 justify-center flex items-center flex-col">
          <img src={Image} className=" h-32 w-32 pb-2" />
          <h4 className="text-xl font-semibold text-center text-base-content">
            Hãy đợi hệ thống của tụi mình kiểm tra xem tài khoản của bạn đã từng đăng kí cho đội
            chưa nhé
          </h4>
          <h4 className="text-xl font-semibold text-center text-base-content">
            Hành động này sẽ mất vài giây
          </h4>
          <span className="loading loading-dots loading-lg text-primary mt-5"></span>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (signupSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
            Đăng kí/Cập nhật thành công!
          </h2>
          <p className="text-center text-gray-600">Cảm ơn bạn đã đăng kí đội.</p>
          <p className="text-center text-gray-600">
            Link vào Discord:{' '}
            <a href="https://discord.gg/B4EKuhJ2" className="text-orange-400">
              Discord THPT Phú Nhuận
            </a>
          </p>
          <p className="text-center text-gray-600 mt-4">
            Tự động chuyển tới trang chủ trong {countdown} giây...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 lg:max-w-7xl lg:w-5/12 sm:mx-auto">
        <div className="relative px-4 py-8 sm:rounded-3xl sm:px-2 sm:py-12 ">
          <div className="mx-auto">
            <div>
              <h1 className="text-3xl font-bold text-center">
                Đơn đăng kí tổ chức cho giải DCN Inter-Class Esport Cup 2025
              </h1>
            </div>
            <button
              onClick={startTour}
              className="bg-blue-500 text-white px-4 py-2 rounded-md mt-4"
            >
              Hướng dẫn
            </button>
            <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <div className="flex flex-col" id="teamName">
                  <label
                    className="leading-loose font-semibold text-base-content"
                    htmlFor="teamName"
                  >
                    Tên đội
                  </label>
                  <input
                    type="text"
                    name="teamName"
                    value={formData.teamName}
                    onChange={handleInputChange}
                    className="px-4 py-2 border bg-white focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                    placeholder="Tên đội của bạn"
                    maxLength="25"
                  />
                  {errors.teamName && (
                    <p className="text-red-500 text-xs italic">{errors.teamName}</p>
                  )}
                </div>

                <div className="flex flex-col" id="shortName">
                  <label
                    className="leading-loose font-semibold text-base-content"
                    htmlFor="shortName"
                  >
                    Tên viết tắt của đội
                  </label>
                  <input
                    type="text"
                    name="shortName"
                    value={formData.shortName}
                    onChange={handleInputChange}
                    className="px-4 py-2 border bg-white focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                    placeholder="Tên viết tắt"
                    maxLength="5"
                  />
                  {errors.shortName && (
                    <p className="text-red-500 text-xs italic">{errors.shortName}</p>
                  )}
                </div>

                <div className="flex flex-col" id="classTeam">
                  <label
                    className="leading-loose font-semibold text-base-content"
                    htmlFor="classTeam"
                  >
                    Team bạn là của lớp nào
                  </label>
                  <input
                    type="text"
                    name="classTeam"
                    value={classTeamInput} // dùng input riêng, không join trực tiếp từ mảng
                    onChange={(e) => {
                      const value = e.target.value;
                      setClassTeamInput(value); // luôn giữ nguyên input người dùng

                      // Nếu chỉ nhập "Cựu học sinh"
                      if (value.trim().toLowerCase() === 'cựu học sinh') {
                        setFormData({ ...formData, classTeam: ['Cựu học sinh'] });
                        return;
                      }

                      const classArray = value
                        .split(' ')
                        .map((cls) => cls.trim())
                        .filter((cls) => cls.length > 0);

                      setFormData({ ...formData, classTeam: classArray });
                    }}
                    className="px-4 py-2 border bg-white focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                    placeholder="Nhập các lớp cách nhau bằng dấu cách, ví dụ: 11A15 12A2"
                  />
                  {errors.classTeam && (
                    <p className="text-red-500 text-xs italic">{errors.classTeam}</p>
                  )}
                </div>

                <div className="flex flex-col" id="logoUrl">
                  <label
                    className="leading-loose font-semibold text-base-content"
                    htmlFor="logoUrl"
                  >
                    Logo của team bạn (upload file ảnh)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    name="logoUrl"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setLogoFile(file);
                    }}
                    className="px-4 py-2 bg-white border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                  />
                  {logoFile ? (
                    <img
                      src={URL.createObjectURL(logoFile)}
                      alt="logo preview"
                      className="w-16 h-16 mt-2 rounded-full object-cover border"
                    />
                  ) : (
                    formData.logoUrl && (
                      <img
                        src={formData.logoUrl}
                        alt="logo preview"
                        className="w-16 h-16 mt-2 rounded-full object-cover border"
                      />
                    )
                  )}
                  {errors.logoUrl && (
                    <p className="text-red-500 text-xs italic">{errors.logoUrl}</p>
                  )}
                </div>

                <div className="flex flex-col" id="color">
                  <label
                    className="leading-loose font-semibold text-base-content"
                    htmlFor="logoUrl"
                  >
                    Chọn màu chủ đạo cho đội của bạn
                  </label>
                  <input
                    type="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="h-10 border-base-100 w-20"
                  />
                  {errors.logoUrl && (
                    <p className="text-red-500 text-xs italic">{errors.logoUrl}</p>
                  )}
                </div>
                <div className="flex flex-col" id="num">
                  <label className="leading-loose font-semibold text-base-content" htmlFor="count">
                    Số Lượng Thành viên đội bạn{' '}
                  </label>
                  <input
                    type="number"
                    min={6}
                    max={20}
                    value={playerCount}
                    onChange={(e) => setPlayerCount(parseInt(e.target.value) || 6)}
                    className="border p-2 rounded w-32 mb-4 text-base-content"
                    placeholder="Số lượng thành viên"
                  />
                </div>
                <div className="flex flex-col mt-4" id="nickname">
                  <label className="leading-loose text-base-content font-bold">
                    Danh sách thành viên
                  </label>
                  {formData.gameMembers.map((member, index) => (
                    <div key={index} className="flex gap-2 mb-2 relative">
                      <input
                        type="text"
                        placeholder="Nickname"
                        value={member.nickname}
                        onChange={(e) => handleMemberChange(index, e.target.value)}
                        onBlur={() => handleNicknameBlur(index)}
                        onKeyDown={(e) => {
                          if (suggestions.length > 0) {
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setSelectedSuggestionIndex((prev) =>
                                prev < suggestions.length - 1 ? prev + 1 : 0
                              );
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setSelectedSuggestionIndex((prev) =>
                                prev > 0 ? prev - 1 : suggestions.length - 1
                              );
                            } else if (e.key === 'Enter') {
                              e.preventDefault();
                              const selectedUser = suggestions[selectedSuggestionIndex];
                              if (selectedUser) {
                                const updated = [...formData.gameMembers];
                                updated[index].nickname = selectedUser.nickname;
                                updated[index].class = selectedUser.className;
                                setFormData({ ...formData, gameMembers: updated });
                                setSuggestions([]);
                              }
                            }
                          }
                        }}
                        className="font-semibold text-[14px] border p-2 rounded w-1/2 text-base-content"
                      />
                      {suggestions.length > 0 && activeInputIndex === index && (
                        <ul className="absolute z-10 bg-white border rounded shadow w-1/2 top-full mt-1">
                          {suggestions.map((user, i) => (
                            <li
                              key={user.id}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                const updated = [...formData.gameMembers];
                                updated[index].nickname = user.nickname;
                                updated[index].class = user.className;
                                setFormData({ ...formData, gameMembers: updated });
                                setSuggestions([]);
                              }}
                              className={` flex flex-row font-semibold p-2 cursor-pointer hover:bg-gray-200 ${
                                i === selectedSuggestionIndex ? 'bg-gray-300' : ''
                              }`}
                            >
                              <img
                                src={`https://drive.google.com/thumbnail?id=${user.profilePicture}`}
                                alt="profile"
                                className="w-8 h-8 rounded-full mr-2"
                              />
                              <strong>{user.nickname}</strong> ({user.className})
                            </li>
                          ))}
                        </ul>
                      )}
                      <input
                        type="text"
                        placeholder="Lớp"
                        value={member.class}
                        disabled
                        className="text-[14px] font-semibold border p-2 rounded w-1/2 text-base-content cursor-not-allowed"
                      />
                      {formData.gameMembers.length > 6 && (
                        <button
                          type="button"
                          onClick={() => removeMember(index)}
                          className="text-red-500"
                        >
                          X
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {errors.gameMembers && (
                  <p className="text-red-500 text-xs italic">{errors.gameMembers}</p>
                )}
              </div>

              <div className="pt-4 flex items-center space-x-4">
                <motion.button
                  type="submit"
                  id="submitTeam"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-secondary to-accent hover:from-secondary hover:to-accent text-white flex justify-center items-center w-full px-4 py-3 rounded-md focus:outline-none"
                >
                  Đăng kí đội
                </motion.button>
              </div>
            </form>

            {submitStatus && (
              <p className={`text-${submitStatus.success ? 'green' : 'red'}-500 text-xs italic`}>
                {submitStatus.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamRegistrationForm;
