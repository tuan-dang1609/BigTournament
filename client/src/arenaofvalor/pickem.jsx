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
  const [errors, setErrors] = useState({});
  const [totalScore, setTotalScore] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [tempSelection, setTempSelection] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); // New search state
  const [detailedResults, setDetailedResults] = useState([]);
  const [globalCountdown, setGlobalCountdown] = useState(""); // Single countdown for global lock time

  // Global lock time: 22/10 at 2:00 AM (local timezone)
  const globalLockTime = new Date("2024-10-22T01:00:00");

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
        console.error("Error fetching data:", error);
      }
    };
    currentUser && fetchQuestionsAndPredictions();
  }, [currentUser]);

  // Single global countdown
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeDiff = globalLockTime - now;

      if (timeDiff <= 0) {
        setGlobalCountdown("Đã hết thời gian. Bạn không thể lựa chọn nữa");
      } else {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
        const seconds = Math.floor((timeDiff / 1000) % 60);
        setGlobalCountdown(
          `Lựa chọn sẽ khóa trong ${days.toString().padStart(2, "0")}d ${hours
            .toString()
            .padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
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

    const selectedTeams = tempSelection || [];
    const newSelectedTeams = selectedTeams.includes(team.name)
      ? selectedTeams.filter((t) => t !== team.name)
      : [...selectedTeams, team.name];
    if (newSelectedTeams.length <= currentQuestion.maxChoose) {
      setTempSelection(newSelectedTeams);
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
          console.error("Error submitting selection:", await response.text());
        }
      } catch (error) {
        console.error("Error submitting selection:", error);
      }
    }
    closeModal(); // Close modal after submitting
  };

  const getResultIcon = (questionId) => {
    const result = detailedResults.find((res) => res.questionId === questionId);

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
        <span className="block text-center text-[20px] text-error font-semibold mt-8 my-5">{globalCountdown}</span>

        <form className="lg:p-2 p-1">
          {questions.map((question) => {
            const now = new Date();
            const isLocked = now >= globalLockTime; // Use global lock time

            return (
              <div key={question.id} className="mt-8">
                <h3 className="lg:text-lg text-[17px] font-semibold flex lg:flex-row flex-col lg:items-center gap-x-5 my-2">
                  {question.question}
                  {getResultIcon(question.id)}
                </h3>
                <div
                  className={`mx-1 bg-white gap-x-6 border-2 border-gray-300 rounded-lg lg:p-4 py-4 flex items-center justify-center ${
                    isLocked ? "opacity-100" : "cursor-pointer"
                  }`}
                  onClick={() => !isLocked && openModal(question)}
                  disabled={isLocked}
                >
                  {predictions[question.id]?.length > 0 ? (
                    <div className="px-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5 gap-2 w-full">
                      {predictions[question.id]?.map((team) => {
                        const selectedTeam = question.options.find((option) => option.name === team);
                        return (
                          <div
                            key={team}
                            className="w-full rounded-lg lg:h-48 h-32 flex flex-col items-center justify-center bg-gradient-to-r from-secondary to-accent text-white bg-gray-200 border-2 border-accent"
                          >
                            {selectedTeam?.logo && (
                              <img
                                src={`https://drive.google.com/thumbnail?id=${selectedTeam.logo}`}
                                alt={selectedTeam.name}
                                className="lg:w-28 lg:h-28 w-16 h-16"
                              />
                            )}
                            <p className="text-center lg:text-[15px] text-[12px] lg:mt-1 mt-1 font-semibold">
                              {selectedTeam.name}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-600">Ấn vào đây để chọn</p>
                  )}
                </div>
              </div>
            );
          })}
        </form>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Select Teams"
        className="bg-white border-2 border-gray-300 lg:p-8 p-2 rounded-lg shadow-lg max-w-7xl xl:mx-auto mx-2 mt-14 z-[10000] relative lg:mt-10"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-[9999]"
        ariaHideApp={false}
        shouldCloseOnOverlayClick={false}
      >
        <h2 className="text-lg font-semibold mb-4">{currentQuestion?.question}</h2>

        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Tìm đội..."
          className="mb-4 p-2 w-full border bg-white text-black border-gray-300 rounded-lg"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto max-h-[300px] lg:max-h-[380px] p-2">
          {filteredOptions?.map((option) => (
            <motion.button
              key={option.name}
              type="button"
              onClick={() => handleTeamSelection(option)}
              className={`p-2 rounded-lg text-sm flex flex-col items-center justify-center 
              ${
                tempSelection.includes(option.name)
                  ? "bg-gradient-to-r from-secondary to-accent text-white"
                  : "bg-gray-200 text-gray-800 border-2 border-accent"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={
                tempSelection.length >= currentQuestion?.maxChoose &&
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
