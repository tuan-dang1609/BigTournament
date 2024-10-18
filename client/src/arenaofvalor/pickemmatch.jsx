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
  const [userRegister, setUserRegister] = useState(null); // Store the fetched team data
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
    const fetchTeams = async () => {
      try {
        const response = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/allteamAOVcolor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ usernameregister: currentUser })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setUserRegister(data); // Save the fetched user registration info
      } catch (error) {
        console.error("Error fetching team data:", error);
      } finally {
        setLoading(false); // Set loading to false once the check is complete
      }
    };

    fetchTeams();
  }, [currentUser]);

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
    
    // Always return 75% for the selected team and 25% for the unselected team
    if (selectedTeam === teamName) {
      return "lg:w-[80%] w-[70%]";
    }
    return selectedTeam ? "lg:w-[20%] w-[30%]" : "w-1/2"; // Default to 50%-50% if no team is selected
  };

  // Function to get logo and color from the userRegister data
  const getTeamData = (teamName) => {
    if (!userRegister) {
      return { logoUrl: '', color: 'bg-black' };
    }
  
    const team = userRegister.find(team => team.teamName === teamName);
    
    if (team) {
      // Construct the proper Google Drive thumbnail URL
      const logoUrl = team.logoUrl;
      return { logoUrl, color: `${team.color}` };
    } else {
      return { logoUrl: '', color: 'bg-black' };
    }
  };

  // Function to get the gradient based on position (left or right)
  const getGradientBackground = (index, color, selected) => {
    if (selected) {
      if (index === 0) {
        // For left-side team, gradient goes from black to color (right)
        return `linear-gradient(to right, black, ${color})`;
      } else if (index === 1) {
        // For right-side team, gradient goes from color to black (left)
        return `linear-gradient(to left, black, ${color})`;
      }
    }
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
      <div className="font-sans min-h-screen flex items-center justify-center mt-36 lg:p-4 p-2">
        <div className="w-full lg:max-w-[95%] max-w-full overflow-hidden">
          <div className="lg:p-6 p-2">
            {questions.map((question) => (
              <div key={question.id} className="mb-8">
                <h3 className="text-lg font-semibold mb-4">{question.question}</h3>
                <div className="flex flex-row justify-between items-stretch lg:h-32 h-24 lg:gap-3 gap-1 relative">
                  {question.options.map((option, index) => {
                    const { logoUrl, color } = getTeamData(option.name);
                    const selectedTeam = selectedTeams[question.id]; // Get the selected team for the current question
                    
                    return (
                      <button
                        key={option.name}
                        aria-label={`Select ${option.name}`}
                        style={{
                          backgroundImage: selectedTeam === option.name
                            ? getGradientBackground(index, color, true) // Show gradient when selected
                            : "none", // No gradient when not selected
                          backgroundColor: selectedTeam === option.name ? "initial" : "#cbcbcb", // gray if not selected
                        }}
                        className={`py-6 px-3 ${getTeamWidth(
                          question.id,
                          option.name
                        )} text-white font-bold text-xl md:text-2xl rounded-lg flex items-center justify-center transition-all duration-300 ease-in-out focus:outline-none ${
                          selectedTeam !== option.name && selectedTeam ? "bg-black" : ""
                        }`} // Apply bg-gray-500 if the option is not selected
                        onClick={() => handleTeamSelect(question.id, option.name)}
                      >
                        {/* Left side team layout: [teamName][logo] */}
                        {index === 0 && (
                          <>
                            <span
                              className={`transition-opacity duration-300 ${
                                selectedTeam === option.name || !selectedTeam
                                  ? "opacity-100 lg:text-[20px] text-[12px]"
                                  : "opacity-0 w-0"
                              }`}
                            >
                              {option.name}
                            </span>
                            <img
                              src={`https://drive.google.com/thumbnail?id=${logoUrl}`}
                              alt={`${option.name} Logo`}
                              className="lg:w-20 lg:h-20 w-10 h-10 lg:ml-5 ml-2"
                            />
                          </>
                        )}

                        {/* Right side team layout: [logo][teamName] */}
                        {index === 1 && (
                          <>
                            <img
                              src={`https://drive.google.com/thumbnail?id=${logoUrl}`}
                              alt={`${option.name} Logo`}
                              className="lg:w-20 lg:h-20 w-10 h-10 lg:mr-5 mr-2"
                            />
                            <span
                              className={`transition-opacity duration-300 ${
                                selectedTeam === option.name || !selectedTeam
                                  ? "opacity-100 lg:text-[20px] text-[12px]"
                                  : "opacity-0 w-0"
                              }`}
                            >
                              {option.name}
                            </span>
                          </>
                        )}
                      </button>
                    );
                  })}
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
