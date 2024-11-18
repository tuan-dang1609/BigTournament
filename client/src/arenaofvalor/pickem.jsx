import React, { useState, useEffect } from "react";
import { FaExclamationCircle } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faX } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import MyNavbar2 from "../components/Navbar2";
import Modal from "react-modal";

const PickemChallenge = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [predictions, setPredictions] = useState({});
  const [questions, setQuestions] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [tempSelection, setTempSelection] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); // New search state
  const [detailedResults, setDetailedResults] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [globalCountdown, setGlobalCountdown] = useState(""); // Countdown cho thời gian khóa toàn cầu
  const questionsGroup1 = questions.filter(q => q.maxChoose === 1);
  const questionsGroup2 = questions.filter(q => q.maxChoose === 2);
  const questionsGroup3 = questions.filter(q => q.maxChoose > 2);
  // Global lock time: 22/10 at 2:00 AM (local timezone)
  useEffect(() => {
    const scrollToTop = () => {
      document.documentElement.scrollTop = 0;
      setLoading(true);
    };
    setTimeout(scrollToTop, 0);
    document.title = "Pick'em theo toàn giải";
  }, []);

  const navigationAll1 = {
    aov: [
      { name: "Đoán theo trận", href: "/arenaofvalor/pickem/pickemmatch", current: location.pathname === "/arenaofvalor/pickem/pickemmatch" },
      { name: "Đoán tổng thể", href: "/arenaofvalor/pickem/pickemall", current: location.pathname === "/arenaofvalor/pickem/pickemall" },
      { name: "Bảng xếp hạng", href: "/arenaofvalor/pickem/leaderboard", current: location.pathname === "/arenaofvalor/pickem/leaderboard" },
    ],
  };

  const getNavigation = () => navigationAll1.aov;
  const navigation = getNavigation();

  useEffect(() => {
    const fetchQuestionsAndPredictions = async () => {
      setLoading(true);
      try {
        const questionResponse = await fetch("https://dongchuyennghiep-backend.vercel.app/api/auth/getquestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const questionResult = await questionResponse.json();
        const filteredQuestions = questionResult.data.filter((q) => q.type === "multiple");
        setQuestions(filteredQuestions);

        if (!currentUser?._id) return;
        const predictionResponse = await fetch("https://dongchuyennghiep-backend.vercel.app/api/auth/checkuserprediction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser._id }),
        });
        if (predictionResponse.status === 404) {
          setLoading(false);
          return; // Không tiếp tục chạy khi lỗi 404
        }
        const predictionResult = await predictionResponse.json();
        const answers = predictionResult.data?.answers.reduce((acc, curr) => {
          acc[curr.questionId] = curr.selectedTeams;
          return acc;
        }, {});
        setPredictions(answers || {});
        const scoreResponse = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/comparepredictions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser._id })
        });

        const scoreResult = await scoreResponse.json();
        setDetailedResults(scoreResult.detailedResults);
        setLoading(false)
      } catch (error) {

      }
    };
    currentUser && fetchQuestionsAndPredictions();
  }, [currentUser]);

  // Single global countdown
  useEffect(() => {
    // Thời gian khóa dựa trên giờ Helsinki cố định
    const dateInHelsinki = new Date("2024-12-29T18:16:00.000+02:00");

    const interval = setInterval(() => {
      const now = new Date(); // Lấy thời gian hiện tại của người dùng
      const timeDiff = dateInHelsinki - now; // Tính toán sự khác biệt

      // Kiểm tra nếu đã hết thời gian (khóa)
      if (timeDiff <= 0) {
        setIsLocked(true); // Nếu hết thời gian, khóa lựa chọn
        setGlobalCountdown("Đã hết thời gian. Bạn không thể lựa chọn nữa");
      } else {
        setIsLocked(false); // Nếu chưa hết thời gian, không khóa
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
        const seconds = Math.floor((timeDiff / 1000) % 60);
        setGlobalCountdown(
          `Lựa chọn sẽ khóa sau ${days.toString().padStart(2, "0")}:${hours
            .toString()
            .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      }
    }, 1000);

    return () => clearInterval(interval); // Dọn dẹp interval khi component unmount
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const openModal = (question) => {
    setCurrentQuestion(question);
    setTempSelection(predictions[question.id] || []);
    setIsModalOpen(true);
    setSearchQuery(""); // Reset search query when opening the modal
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleTeamSelection = (team) => {
    if (!currentQuestion) return;
  
    // Only for maxChoose === 1
    if (currentQuestion.maxChoose === 1) {
      // Directly replace the selection with the new team, allowing switch in one click
      setTempSelection((prevSelection) =>
        prevSelection[0] === team.name ? [] : [team.name]
      );
    } else {
      // Original logic for maxChoose > 1
      const selectedTeams = tempSelection || [];
      const newSelectedTeams = selectedTeams.includes(team.name)
        ? selectedTeams.filter((t) => t !== team.name)
        : [...selectedTeams, team.name];
  
      if (newSelectedTeams.length <= currentQuestion.maxChoose) {
        setTempSelection(newSelectedTeams);
      }
    }
  };

  const confirmSelection = async () => {
    if (currentQuestion) {
      setPredictions({ ...predictions, [currentQuestion.id]: tempSelection });
      try {
        const data = {
          userId: currentUser._id,
          answers: [
            {
              questionId: currentQuestion.id,
              selectedTeams: tempSelection,
            },
          ],
        };
        const response = await fetch("https://dongchuyennghiep-backend.vercel.app/api/auth/submitPrediction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const scoreResponse = await fetch("https://dongchuyennghiep-backend.vercel.app/api/auth/comparepredictions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUser._id }),
          });

          const scoreResult = await scoreResponse.json();
          setDetailedResults(scoreResult.detailedResults);
          setTotalScore(scoreResult.totalPoints || 0);
        } else {

        }
      } catch (error) {

      }
    }
    closeModal(); // Close modal after submitting
  };
  const getGridColsClass = (maxChoose) => {
    if (maxChoose === 8) return 'grid-cols-2 md:grid-cols-4 lg:grid-cols-8';
    if (maxChoose === 5) return 'grid-cols-2 md:grid-cols-5 lg:grid-cols-5';
    if (maxChoose === 4) return 'grid-cols-2 md:grid-cols-4 lg:grid-cols-4';
    return 'grid-cols-2 md:grid-cols-4 lg:grid-cols-3'; // Mặc định là 3 cột cho lg nếu không khớp các điều kiện trên
  };
  const getResultIcon = (questionId) => {
    if (!detailedResults) {
      return null; // Nếu detailedResults không tồn tại, trả về null
    }
    const result = detailedResults.find((res) => res.questionId === questionId);
    if (result === null) {
      return; // Trường hợp result là null thì bỏ qua
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

  const filteredOptions = currentQuestion?.options.filter((option) =>
    option.name.toLowerCase().includes(searchQuery)
  );

  if (loading) {
    return (
      <>
        <MyNavbar2 navigation={navigation} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
        <div className="flex justify-center items-center min-h-screen">
          <span className="loading loading-dots loading-lg text-primary"></span>
        </div>
      </>
    );
  }

  return (
    <>
      <MyNavbar2 navigation={navigation} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <div className="min-h-screen mt-40 mb-20 px-4 sm:px-10 lg:px-8">
        {/* Single countdown display */}
        <span className="block text-center text-[20px] text-error font-semibold mt-8 my-5 italic">{globalCountdown}</span>

        <form className="lg:p-2 p-1">
        <div className="space-y-8">
  {/* Nhóm maxChoose === 1 */}
  <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 lg:grid-cols-4 gap-8">
    {questionsGroup1.map((question) => (
      <div
        key={question.id}
        className="mt-8 text-black bg-white border-2 border-gray-300 rounded-lg p-4 flex flex-col justify-between lg:min-h-[230px] min-h-[200px] cursor-pointer"
        onClick={() => {
          if (!isLocked) {
            openModal(question);
          }
        }}
      >
        <h3 className="text-[15px] font-semibold flex items-center gap-x-5 my-2">
          {question.question}
          {getResultIcon(question.id)}
        </h3>
        <div className="flex items-center justify-center">
          {predictions[question.id]?.length > 0 ? (
            <div className={`px-3 grid grid-cols-${question.maxChoose} gap-x-8 items-center`}>
              {predictions[question.id].map((team) => {
                const selectedTeam = question.options.find((option) => option.name === team);
                return selectedTeam ? (
                  <div key={team} className="flex flex-col items-center">
                    {selectedTeam.logo && (
                      <img
                        src={`https://drive.google.com/thumbnail?id=${selectedTeam.logo}`}
                        alt={selectedTeam.name}
                        className="w-28 h-28"
                      />
                    )}
                    <p className="text-center text-[14px] mt-1 font-semibold">{selectedTeam.name}</p>
                  </div>
                ) : null;
              })}
            </div>
          ) : (
            <p className="text-gray-600">Ấn vào đây để chọn</p>
          )}
        </div>
      </div>
    ))}
  </div>

  {/* Nhóm maxChoose === 2 */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    {questionsGroup2.map((question) => (
      <div
        key={question.id}
        className="mt-8 text-black bg-white border-2 border-gray-300 rounded-lg p-4 flex flex-col justify-between lg:min-h-[230px] min-h-[200px] cursor-pointer"
        onClick={() => {
          if (!isLocked) {
            openModal(question);
          }
        }}
      >
        <h3 className="text-[15px] font-semibold flex items-center gap-x-5 my-2">
          {question.question}
          {getResultIcon(question.id)}
        </h3>
        <div className="flex items-center justify-center">
          {predictions[question.id]?.length > 0 ? (
            <div className={`px-3 grid grid-cols-${question.maxChoose} gap-x-20 items-center`}>
              {predictions[question.id].map((team) => {
                const selectedTeam = question.options.find((option) => option.name === team);
                return selectedTeam ? (
                  <div key={team} className="flex flex-col items-center">
                    {selectedTeam.logo && (
                      <img
                        src={`https://drive.google.com/thumbnail?id=${selectedTeam.logo}`}
                        alt={selectedTeam.name}
                        className="w-28 h-28"
                      />
                    )}
                    <p className="text-center text-[14px] mt-1 font-semibold">{selectedTeam.name}</p>
                  </div>
                ) : null;
              })}
            </div>
          ) : (
            <p className="text-gray-600">Ấn vào đây để chọn</p>
          )}
        </div>
      </div>
    ))}
  </div>

  {/* Nhóm maxChoose > 2 */}
  <div className="grid grid-cols-1 gap-8">
      {questionsGroup3.map((question) => (
        <div
          key={question.id}
          className="mt-8 text-black bg-white border-2 border-gray-300 rounded-lg p-4 flex flex-col justify-between lg:min-h-[230px] min-h-[200px] cursor-pointer"
          onClick={() => {
            if (!isLocked) {
              openModal(question);
            }
          }}
        >
          <h3 className="text-[15px] font-semibold flex items-center gap-x-5 my-2">
            {question.question}
            {getResultIcon(question.id)}
          </h3>
          <div className="flex items-center justify-center">
            {predictions[question.id]?.length > 0 ? (
              <div
                className={`grid ${getGridColsClass(question.maxChoose)} xl:gap-x-16 lg:gap-x-5 gap-x-8 gap-y-8 items-center`}
              >
                {predictions[question.id].map((team) => {
                  const selectedTeam = question.options.find((option) => option.name === team);
                  return selectedTeam ? (
                    <div key={team} className="flex flex-col items-center">
                      {selectedTeam.logo && (
                        <img
                          src={`https://drive.google.com/thumbnail?id=${selectedTeam.logo}`}
                          alt={selectedTeam.name}
                          className="lg:w-28 lg:h-28 w-24 h-24"
                        />
                      )}
                      <p className="text-center text-[14px] mt-1 font-semibold">{selectedTeam.name}</p>
                    </div>
                  ) : null;
                })}
              </div>
            ) : (
              <p className="text-black">Ấn vào đây để chọn</p>
            )}
          </div>
        </div>
      ))}
    </div>
</div>
        </form>
      </div>

      <Modal
  isOpen={isModalOpen}
  onRequestClose={closeModal}
  contentLabel="Select Teams"
  className="bg-white border-2 border-gray-300 lg:p-8 p-2 rounded-lg shadow-lg max-w-7xl xl:mx-auto mx-2 mt-14 z-[10000] relative lg:mt-10"
  overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-[9999]"
  ariaHideApp={false}
  shouldCloseOnOverlayClick={true} // Cho phép đóng khi nhấp vào vùng ngoài
>
  <h2 className="text-lg text-black font-semibold mb-4">{currentQuestion?.question}</h2>

  <input
    type="text"
    value={searchQuery}
    onChange={handleSearchChange}
    placeholder="Tìm đội hoặc người chơi"
    className="mb-4 p-2 w-full border bg-white text-black border-gray-300 rounded-lg"
  />

  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto max-h-[300px] lg:max-h-[380px] p-2">
    {filteredOptions?.map((option) => (
      <motion.button
        key={option.name}
        type="button"
        onClick={() => handleTeamSelection(option)}
        className={`p-2 rounded-lg text-sm flex flex-col items-center justify-center 
          ${tempSelection.includes(option.name)
            ? "bg-gradient-to-r from-secondary to-accent text-white"
            : "bg-gray-200 text-gray-800 border-2 border-accent"
          }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={
          currentQuestion.maxChoose > 1 && 
          tempSelection.length >= currentQuestion.maxChoose && 
          !tempSelection.includes(option.name)
        }
      >
        {option.logo && (
          <img
            src={`https://drive.google.com/thumbnail?id=${option.logo}`}
            alt={option.name}
            className="w-16 h-16 sm:h-20 sm:w-20 mb-2"
          />
        )}
        <p className="sm:text-[14.5px] text-[12px] pb-2 font-semibold">{option.name}</p>
      </motion.button>
    ))}
  </div>

  {tempSelection.length === currentQuestion?.maxChoose && (
    <div className="mt-6 flex justify-end">
      <button onClick={confirmSelection} className="bg-accent text-white px-2 py-3 rounded-lg">
        Xác nhận & Gửi
      </button>
    </div>
  )}
</Modal>

    </>
  );
};

export default PickemChallenge;
