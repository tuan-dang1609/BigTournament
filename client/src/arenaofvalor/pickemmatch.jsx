import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux"; // Assuming you're using Redux to get the current user
import MyNavbar2 from "../components/Navbar2";

const PickemChallenge = () => {
  const { currentUser } = useSelector((state) => state.user); // Get current user from Redux store
  const [selectedTeams, setSelectedTeams] = useState({});
  const [questions, setQuestions] = useState([]);
  const [submitStatus, setSubmitStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Define your team colors
  const teamColors = [
    { name: "We Are One", bg: "bg-red-200" },
    { name: "Kero Esport", bg: "bg-yellow-200" },
  ];

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
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchQuestionsAndPredictions = async () => {
      setLoading(true);
      try {
        // Fetch the questions
        const questionResponse = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/getquestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const questionResult = await questionResponse.json();

        // Filter to show only questions with "type": "team"
        const filteredQuestions = questionResult.data.filter(q => q.type === 'team');
        setQuestions(filteredQuestions);

        // Fetch the user's previous predictions
        if (currentUser?._id) {
          const predictionResponse = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/checkuserprediction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser._id }),
          });
          const predictionResult = await predictionResponse.json();

          // Map the predictions to `selectedTeams` state
          const previousSelections = predictionResult.data?.answers.reduce((acc, curr) => {
            acc[curr.questionId] = curr.selectedTeams[0]; // Assuming single team choice for each question
            return acc;
          }, {});
          setSelectedTeams(previousSelections || {});
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchQuestionsAndPredictions();
    }
  }, [currentUser]);

  const handleSubmit = async (questionId, teamName) => {
    try {
      const response = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/submitPrediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser._id, // Replace with actual user ID
          answers: [
            {
              questionId: questionId,
              selectedTeams: [teamName],
            },
          ],
        }),
      });
      const result = await response.json();
      setSubmitStatus(response.ok ? `Prediction for question ${questionId} submitted successfully!` : `Error: ${result.error}`);
    } catch (error) {
      setSubmitStatus("Error submitting predictions.");
    }
  };

  const handleTeamSelect = (questionId, teamName) => {
    const newSelectedTeams = { ...selectedTeams };
    newSelectedTeams[questionId] = teamName;
    setSelectedTeams(newSelectedTeams);

    // Automatically submit when team is selected
    handleSubmit(questionId, teamName);
  };

  const getTeamWidth = (questionId, teamName) => {
    const selectedTeam = selectedTeams[questionId];
    if (selectedTeam === teamName) {
      return windowWidth >= 768 ? "w-[75%]" : "w-[75%]";
    }
    return selectedTeam ? "w-[25%]" : "w-1/2";
  };

  // Function to get background color based on team name
  const getBackgroundColor = (teamName) => {
    const team = teamColors.find((team) => team.name === teamName);
    return team ? team.bg : "bg-gray-400"; // Default to gray if no match
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

  return (
    <>
      <MyNavbar2 navigation={navigation} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <div className="font-sans min-h-screen flex items-center justify-center mt-36 p-4">
        <div className="w-full lg:max-w-[95%] max-w-[99%] overflow-hidden">
          <div className="lg:p-6 p-2">
            {questions.map((question) => (
              <div key={question.id} className="mb-8">
                <h3 className="text-lg font-semibold mb-4">{question.question}</h3>
                <div className="flex flex-row justify-between items-stretch h-28 relative">
                  {question.options.map((option, index) => (
                    <button
                      key={option.name}
                      aria-label={`Select ${option.name}`}
                      className={`py-6 px-3 ${getTeamWidth(
                        question.id,
                        option.name
                      )} ${getBackgroundColor(option.name)} text-white font-bold text-xl md:text-2xl flex items-center justify-center transition-all duration-300 ease-in-out focus:outline-none ${
                        selectedTeams[question.id] === option.name
                          ? ""
                          : ""
                      }`}
                      onClick={() => handleTeamSelect(question.id, option.name)}
                    >
                      {/* Left side team layout: [teamName][logo] */}
                      {index === 0 && (
                        <>
                          <span
                            className={`transition-opacity duration-300 ${
                              selectedTeams[question.id] === option.name || !selectedTeams[question.id]
                                ? "opacity-100"
                                : "opacity-0 w-0"
                            }`}
                          >
                            {option.name}
                          </span>
                          <img
                            src={`https://drive.google.com/thumbnail?id=${option.logo}`}
                            alt={`${option.name} Logo`}
                            className="w-16 h-16 ml-2"
                          />
                        </>
                      )}

                      {/* Right side team layout: [logo][teamName] */}
                      {index === 1 && (
                        <>
                          <img
                            src={`https://drive.google.com/thumbnail?id=${option.logo}`}
                            alt={`${option.name} Logo`}
                            className="w-16 h-16 mr-2"
                          />
                          <span
                            className={`transition-opacity duration-300 ${
                              selectedTeams[question.id] === option.name || !selectedTeams[question.id]
                                ? "opacity-100"
                                : "opacity-0 w-0"
                            }`}
                          >
                            {option.name}
                          </span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {submitStatus && <p className="mt-4 text-lg">{submitStatus}</p>}
          </div>
        </div>
      </div>
    </>
  );
};

export default PickemChallenge;
