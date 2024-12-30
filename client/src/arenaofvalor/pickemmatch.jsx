import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux"; // Assuming you're using Redux to get the current user
import MyNavbar2 from "../components/Navbar2";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faX } from '@fortawesome/free-solid-svg-icons';
import Image from '../image/waiting.png'
const PickemChallenge = () => {
  const { currentUser } = useSelector((state) => state.user); // Get current user from Redux store
  const [selectedTeams, setSelectedTeams] = useState({});
  const [questions, setQuestions] = useState([]);
  const [submitStatus, setSubmitStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [userRegister, setUserRegister] = useState(null); // Store the fetched team data
  const [detailedResults, setDetailedResults] = useState([]); // To store detailed results
  const [countdowns, setCountdowns] = useState({}); // Countdown state for each question
  const [selectedCategory, setSelectedCategory] = useState("day3");
  const [categories, setCategories] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Trạng thái dropdown
  useEffect(() => {
    const scrollToTop = () => {
      document.documentElement.scrollTop = 0;
      setLoading(true);
    };
    setTimeout(scrollToTop, 0);
    document.title = "Pick'em theo trận";
  }, []);

  const navigationAll1 = {
    aov: [
      { name: "Đoán theo trận", href: "/arenaofvalor/pickem/pickemmatch", current: location.pathname === "/arenaofvalor/pickem/pickemmatch" },
      { name: "Đoán tổng thể", href: "/arenaofvalor/pickem/pickemall", current: location.pathname === "/arenaofvalor/pickem/pickemall" },
      { name: "Bảng xếp hạng", href: "/arenaofvalor/pickem/leaderboard", current: location.pathname === "/arenaofvalor/pickem/leaderboard" },
    ]
  };
  const getNavigation = () => navigationAll1.aov;
  const navigation = getNavigation();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true); // Bắt đầu loading khi fetch dữ liệu

      try {
        // Fetch teams
        const teamsResponse = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/allteamAOVcolor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ usernameregister: currentUser })
        });

        const teamsData = await teamsResponse.json();
        setUserRegister(teamsData);
        const questionsResponse = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/getquestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const questionsData = await questionsResponse.json();
        const filteredQuestions = questionsData.data.filter(q => q.type === 'team');
        setQuestions(filteredQuestions);
        const uniqueCategories = Array.from(
          new Set(filteredQuestions.map((q) => q.category))
        );
        setCategories(uniqueCategories);

        setLoading(false);
        const scoreResponse = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/comparepredictions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser._id })
        });

        const scoreResult = await scoreResponse.json();
        if (!scoreResult) {
          return null;
        } else {
          setDetailedResults(scoreResult.detailedResults);
        }
  
       
        setLoading(false);
        // Sau khi teams và questions đã được fetch xong, tiếp tục fetch checkuserprediction
        if (currentUser?._id) {
          const predictionsResponse = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/checkuserprediction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser._id }),
          });

          const predictionsData = await predictionsResponse.json();

          // Map predictions vào state selectedTeams
          const previousSelections = predictionsData.data?.answers.reduce((acc, curr) => {
            acc[curr.questionId] = curr.selectedTeams[0];
            return acc;
          }, {});
          setSelectedTeams(previousSelections || {});

          // Sau khi lấy dữ liệu selectedTeams xong, gọi thêm API comparepredictions
          
        }

        // Ngừng loading sau khi toàn bộ các API đã hoàn thành
       
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false); // Nếu xảy ra lỗi cũng cần dừng loading
      }
    };

    if (currentUser) {
      fetchInitialData();
    }
  }, [currentUser]);
  const getGradientBackground = (index, color, selected) => {
    if (selected) {
      if (index === 0) {
        return `linear-gradient(to right, black, ${color})`;
      } else if (index === 1) {
        return `linear-gradient(to left, black, ${color})`;
      }
    }
    return "none"; // Trả về màu mặc định nếu không có đội nào được chọn
  };
  // C  ountdown logic for each question
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const newCountdowns = {};
  
      questions.forEach((question) => {
        const lockTime = new Date(question.timelock);
        const timeDiff = lockTime - now;
  
        if (timeDiff <= 0) {
          newCountdowns[`${question.category}-${question.id}`] = "Đã khóa lựa chọn";
        } else {
          const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
          const seconds = Math.floor((timeDiff / 1000) % 60);
          newCountdowns[`${question.category}-${question.id}`] = `Khóa lựa chọn sau ${days.toString().padStart(2, '0')}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
        }
      });
  
      setCountdowns(newCountdowns);
    }, 1000);
  
    return () => clearInterval(interval);
  }, [questions]);
  
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setIsDropdownOpen(false); // Đóng dropdown sau khi chọn
  };

  const handleClickOutside = (event) => {
    if (!event.target.closest(".dropdown-container")) {
      setIsDropdownOpen(false);
    }
  };
  const handleTeamSelect = async (questionId, teamName) => {
    const newSelectedTeams = { ...selectedTeams };
    newSelectedTeams[questionId] = teamName;
    setSelectedTeams(newSelectedTeams);
  
    // Gửi yêu cầu lưu dự đoán với cặp `category-id`
    try {
      const response = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/submitPrediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser._id,
          answers: [
            {
              questionId: questionId, // Chứa cả `category` và `id`
              selectedTeams: [teamName],
            },
          ],
        }),
      });
  
      if (response.ok) {
        const scoreResponse = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/comparepredictions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser._id })
        });
        const scoreResult = await scoreResponse.json();
        setDetailedResults(scoreResult.detailedResults);
      } else {
        const result = await response.json();
        setSubmitStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error submitting prediction:", error);
    }
  };

  const getTeamWidth = (questionId, teamName) => {
    const selectedTeam = selectedTeams[questionId];

    if (selectedTeam === teamName) {
      return "lg:w-[75%] w-[70%]";
    }
    return selectedTeam ? "lg:w-[25%] w-[30%]" : "w-1/2";
  };

  const getTeamData = (teamName) => {
    if (!userRegister) {
      return { logoUrl: '', shortName: '', color: 'bg-black' };
    }

    const team = userRegister.find(team => team.teamName === teamName);

    if (team) {
      const shortName = team.shortName;
      const logoUrl = team.logoUrl;
      return { logoUrl, shortName, color: `${team.color}` };
    } else {
      return { logoUrl: '', shortName: '', color: 'bg-black' };
    }
  };

  const getResultIcon = (questionId) => {
    // Kiểm tra nếu detailedResults là undefined hoặc null
    if (!detailedResults) {
        return null; // Nếu detailedResults không tồn tại, trả về null
    }

    const result = detailedResults.find((res) => res.questionId === questionId);
    
    if (result === null) {
      return null; // Trường hợp result là null thì bỏ qua
    }
    
    if (result && result.totalChoices === 0) {
      return null;
    }

    if (result && result.isTrue) {
      return (
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center bg-green-500 rounded-full p-2 w-8 h-8">
            <FontAwesomeIcon icon={faCheck} color="white" />
          </div>
          <div className="bg-gray-600 rounded-md px-2 py-1">
            <span className="text-white">+{result.pointsForQuestion}</span>
          </div>
        </div>
      );
    } else if (result && result.totalChoices > 0) {
      return (
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center bg-red-500 rounded-full p-2 w-8 h-8">
            <FontAwesomeIcon icon={faX} color="white" />
          </div>
          <div className="bg-gray-600 rounded-md px-2 py-1">
            <span className="text-white">+0</span>
          </div>
        </div>
      );
    }

    return null;
};  

const formatCategory = (category) => {
  // Format category thành chữ hoa đầu từ, ví dụ: "Day 1"
  return category.replace(/day(\d+)/i, "Day $1");
};
  if (loading) {
    return (
      <>
        <MyNavbar2 navigation={navigation} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
        <div className="flex justify-center items-center min-h-[100dvh]">
          <span className="loading loading-dots loading-lg text-primary"></span>
        </div>
      </>
    );
  }
  
    const filteredQuestions = selectedCategory === "all"
    ? questions
    : questions.filter((question) => question.category === selectedCategory);

return (
  <>
    <MyNavbar2 navigation={navigation} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
    
    <div className="font-sans flex flex-col items-center justify-center mt-40 lg:p-4 p-2">
    <div className="relative dropdown-container mb-6">
        <button
          className="btn m-1 flex items-center"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          {formatCategory(selectedCategory)}
          <svg
            width="12px"
            height="12px"
            className="inline-block h-2 w-2 fill-current opacity-60 ml-1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 2048 2048"
          >
            <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
          </svg>
        </button>
        {isDropdownOpen && (
          <ul className="absolute rounded-lg w-52 p-2 shadow-lg bg-base-100 z-[9999]">
          {categories.map((category) => (
            <li key={category} className="mb-2 last:mb-0">
              <label className="flex items-center cursor-pointer w-full">
                <input
                  type="radio"
                  name="category-dropdown"
                  className="hidden" // Ẩn input radio để chỉ dùng nút làm giao diện
                  aria-label={category}
                  value={category}
                  checked={selectedCategory === category}
                  onChange={() => handleCategoryChange(category)}
                />
                <div
                  className={`w-full py-2 px-4 rounded-md text-left ${
                    selectedCategory === category ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'
                  } hover:bg-primary hover:text-white transition-colors`}
                >
                  {formatCategory(category)}
                </div>
              </label>
            </li>
          ))}
        </ul>
        )}
      </div>
      <div className="w-full">
        {/* Hiển thị danh sách câu hỏi dựa trên selectedCategory */}
        <div className="w-full lg:max-w-[95%] max-w-full mx-auto overflow-hidden">
  <div className="lg:p-6 p-2">
    {filteredQuestions.length > 0 ? (
      filteredQuestions.map((question) => {
        const timelock = new Date(question.timelock);
        const now = new Date();
        const isLocked = now >= timelock;

        return (
          <div key={`${question.category}-${question.id}`} className="mb-8">
            {/* Câu hỏi và timelock */}
            <h3 className="text-lg font-semibold mb-4 flex lg:flex-row flex-col gap-x-4 items-center">
  {question.question}
  {getResultIcon(`${question.category}-${question.id}`) ? (
    getResultIcon(`${question.category}-${question.id}`)
  ) : (
    
      <span className="text-error">{countdowns[`${question.category}-${question.id}`]}</span>
    
  )}
</h3>
            <div className="flex flex-row justify-between items-stretch md:h-32 h-28 lg:gap-3 gap-1 relative">
              {question.options.map((option, index) => {
                const { logoUrl, color, shortName } = getTeamData(option.name);
                const selectedTeam = selectedTeams[`${question.category}-${question.id}`];

                return (
                  <button
                    key={`${option._id}-${index}`}
                    aria-label={`Select ${option.name}`}
                    style={{
                      backgroundImage: selectedTeam === option.name
                        ? getGradientBackground(index, color, true)
                        : "none",
                      backgroundColor: selectedTeam === option.name ? "initial" : "#cbcbcb",
                    }}
                    className={`py-6 px-3 flex md:flex-row ${index === 0 ? 'flex-col-reverse' : 'flex-col'} ${getTeamWidth(
                      `${question.category}-${question.id}`,
                      option.name
                    )} text-white font-bold text-xl md:text-2xl rounded-lg flex items-center justify-center transition-all duration-300 ease-in-out focus:outline-none`}
                    onClick={() => handleTeamSelect(`${question.category}-${question.id}`, option.name)}
                    disabled={isLocked}
                  >
                    {index === 0 && (
                      <>
                        <span
                          className={`transition-opacity duration-300 lg:text-[20px] md:text-[16px] text-[12px] ${selectedTeam === option.name || !selectedTeam
                            ? "opacity-100"
                            : "hidden w-0"
                            }`}
                        >
                          <span className="md:inline hidden">{option.name}</span>
                          <span className="md:hidden uppercase">{shortName}</span>
                        </span>
                        <img
                          src={`https://drive.google.com/thumbnail?id=${logoUrl}`}
                          alt={`${option.name} Logo`}
                          className="lg:w-20 lg:h-20 md:w-16 md:h-16 w-12 h-12 xl:ml-5 md:ml-3 ml-0 mb-1"
                        />
                      </>
                    )}

                    {index === 1 && (
                      <>
                        <img
                          src={`https://drive.google.com/thumbnail?id=${logoUrl}`}
                          alt={`${option.name} Logo`}
                          className="lg:w-20 lg:h-20 md:w-16 md:h-16 w-12 h-12 lg:mr-5 md:mr-3 mr-0 mb-1"
                        />
                        <span
                          className={`transition-opacity duration-300 lg:text-[20px] md:text-[16px] text-[12px] ${selectedTeam === option.name || !selectedTeam
                            ? "opacity-100"
                            : "hidden w-0"
                            }`}
                        >
                          <span className="md:inline hidden">{option.name}</span>
                          <span className="md:hidden uppercase">{shortName}</span>
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })
    ) : (
      <div className="flex items-center flex-col justify-center align-center w-full text-center text-lg font-semibold text-base-content">
        <img src={Image} className="h-28 w-28 mb-10"></img>
        <p>Dự đoán các trận sẽ hiện khi các cặp đấu đã được xác định. Các bạn vui lòng quay lại sau nhé.</p>
      </div>
    )}
    {submitStatus && <p className="mt-4 text-lg">{submitStatus}</p>}
  </div>
</div>
      </div>
    </div>
  </>
);
};

export default PickemChallenge;
