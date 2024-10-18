import React, { useState, useEffect } from "react";
import { FaExclamationCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import MyNavbar2 from "../components/Navbar2";
import Modal from 'react-modal';

const PickemChallenge = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [predictions, setPredictions] = useState({});
  const [questions, setQuestions] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState("");
  const [totalScore, setTotalScore] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [tempSelection, setTempSelection] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); // New search state

  const navigationAll1 = {
    aov: [
      { name: "Đoán theo trận", href: "/arenaofvalor/pickem/pickemmatch", current: location.pathname === "/arenaofvalor/pickem/pickemmatch" },
      { name: "Đoán tổng thể", href: "/arenaofvalor/pickem", current: location.pathname === "/arenaofvalor/pickem" },
      { name: "Bảng xếp hạng", href: "/arenaofvalor/pickem/leaderboard", current: location.pathname === "/arenaofvalor/pickem/leaderboard" },
    
    ]
  };

  const getNavigation = () => navigationAll1.aov;
  const navigation = getNavigation();
  useEffect(() => {
    document.title="Pick'em Challenge Liên Quân Mobile"
    const fetchQuestionsAndPredictions = async () => {
      setLoading(true);
      try {
        const questionResponse = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/getquestions', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }
        });
        const questionResult = await questionResponse.json();
        const filteredQuestions = questionResult.data.filter(q => q.type === 'multiple');
        setQuestions(filteredQuestions);

        if (!currentUser?._id) return;
        const predictionResponse = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/checkuserprediction', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser._id })
        });
        const predictionResult = await predictionResponse.json();
        const answers = predictionResult.data?.answers.reduce((acc, curr) => {
          acc[curr.questionId] = curr.selectedTeams;
          return acc;
        }, {});
        setPredictions(answers || {});
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    currentUser && fetchQuestionsAndPredictions();
  }, [currentUser]);

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

  const confirmSelection = () => {
    if (currentQuestion) {
      setPredictions({ ...predictions, [currentQuestion.id]: tempSelection });
    }
    closeModal();
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const filteredOptions = currentQuestion?.options.filter(option =>
    option.name.toLowerCase().includes(searchQuery)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasErrors = questions.some((q) => (predictions[q.id]?.length || 0) !== q.maxChoose);
    if (!hasErrors) {
      try {
        const data = {
          userId: currentUser._id,
          answers: questions.map((q) => ({
            questionId: q.id,
            selectedTeams: predictions[q.id] || []
          }))
        };
        const response = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/submitPrediction', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        });
        const result = await response.json();
        setSubmitStatus(response.ok ? "Kết quả dự đoán của bạn đã gửi thành công!" : `Error: ${result.error}`);
        if (response.ok) {
          const scoreResponse = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/comparepredictions', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser._id })
          });
          const scoreResult = await scoreResponse.json();
          setTotalScore(scoreResult.totalPoints || 0);
        }
      } catch (error) {
        setSubmitStatus("Error submitting predictions.");
      }
    }
  };

  if (loading) {
    return (
      <>
        <MyNavbar2 navigation={navigation}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen} />
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
        <form onSubmit={handleSubmit} className="lg:p-6 p-1 space-y-6">
          {questions.map((question) => (
            <div key={question.id} className="space-y-4">
              <h3 className="text-lg font-semibold">{question.question}</h3>
              <div className="mx-1">
                <div
                  className="bg-white border-2 border-gray-300 rounded-lg lg:p-4 py-4 flex items-center justify-center cursor-pointer"
                  onClick={() => openModal(question)}
                >
                  {predictions[question.id]?.length > 0 ? (
                   <div className={`grid grid-cols-2 ${question.maxChoose === 3 ? 'lg:grid-cols-3' : question.maxChoose === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-2 lg:gap-x-8`}>
                      {predictions[question.id]?.map((team) => {
                        const selectedTeam = question.options.find((option) => option.name === team);
                        return (
                          <div key={team} className="lg:p-8 p-1 aspect-square rounded-lg text-sm flex flex-col items-center justify-center 
                            bg-gradient-to-r from-secondary to-accent text-white">
                            {selectedTeam?.logo && (
                              <img
                                src={`https://drive.google.com/thumbnail?id=${selectedTeam.logo}`}
                                alt={selectedTeam.name}
                                className="lg:w-28 lg:h-28 w-16 h-16 mb-2"
                              />
                            )}
                            <p className="text-center lg:text-[15px] text-[12px] lg:mt-4 mt-1 font-semibold">{selectedTeam.name}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-600">Click to select teams</p>
                  )}
                </div>
              </div>
              {errors[question.id] && (
                <p className="text-red-500 text-sm flex items-center">
                  <FaExclamationCircle className="mr-1" />
                  {errors[question.id]}
                </p>
              )}
            </div>
          ))}
          <motion.button type="submit" className="w-full bg-accent text-white p-3 rounded-lg font-semibold hover:bg-blue-700">
            Gửi dự đoán kết quả của tôi
          </motion.button>
          {submitStatus && <p className={`mt-4 text-[15px] font-semibold ${submitStatus.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{submitStatus}</p>}
        </form>
      </div>

      <Modal
  isOpen={isModalOpen}
  onRequestClose={closeModal}
  contentLabel="Select Teams"
  className="bg-white border-2 border-gray-300 lg:p-8 p-2 rounded-lg shadow-lg max-w-7xl xl:mx-auto mx-2 mt-12 z-[10000] relative lg:mt-10"
  overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-[9999]"
  ariaHideApp={false}
  shouldCloseOnOverlayClick={false}
>
  <h2 className="text-lg font-semibold mb-4">{currentQuestion?.question}</h2>

        {/* Search Bar */}
    <input
      type="text"
          value={searchQuery}
          onChange={handleSearchChange}
      placeholder="Search teams..."
          className="mb-4 p-2 w-full border border-gray-300 rounded-lg"
    />

  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto max-h-[300px] lg:max-h-[380px] p-2">
    {filteredOptions?.map((option) => (
      <motion.button
        key={option.name}
        type="button"
        onClick={() => handleTeamSelection(option)}
        className={`p-2 rounded-lg text-sm flex flex-col items-center justify-center 
          ${tempSelection.includes(option.name) ? "bg-gradient-to-r from-secondary to-accent text-white" : "bg-gray-200 text-gray-800 border-2 border-accent"}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={
          tempSelection.length >= currentQuestion?.maxChoose &&
          !tempSelection.includes(option.name)
        }
      >
        {option.logo && <img src={`https://drive.google.com/thumbnail?id=${option.logo}`} alt={option.name} className="w-16 h-16 sm:h-20 sm:w-20 mb-2" />}
        <p className="sm:text-[14.5px] text-[12px] pb-2 font-semibold">{option.name}</p>
      </motion.button>
    ))}
  </div>

  {tempSelection.length === currentQuestion?.maxChoose && (
    <div className="mt-6 flex justify-end">
      <button onClick={confirmSelection} className="bg-blue-600 text-white p-2 rounded-lg">
        Confirm
      </button>
    </div>
  )}
</Modal>


    </>
  );
};

export default PickemChallenge;
