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
      { name: "Đoán tổng thể", href: "/arenaofvalor/pickemall", current: location.pathname === "/arenaofvalor/pickemall" },
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
      setLoading(true);
      try {
        // Fetch teams và questions song song bằng Promise.all
        const [teamsResponse, questionsResponse] = await Promise.all([
          // Fetch teams
          fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/allteamAOVcolor', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ usernameregister: currentUser })
          }),
          
          // Fetch questions
          fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/getquestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        ]);

        // Xử lý kết quả của các API đã fetch xong
        const teamsData = await teamsResponse.json();
        setUserRegister(teamsData);

        const questionsData = await questionsResponse.json();
        const filteredQuestions = questionsData.data.filter(q => q.type === 'team');
        setQuestions(filteredQuestions);

        // Sau khi fetch teams và questions xong, dừng loading
        setLoading(false);

        // Sau đó fetch tiếp predictions nếu có currentUser
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
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (currentUser) {
      fetchInitialData();
    }
  }, [currentUser]);

  const handleTeamSelect = async (questionId, teamName) => {
    const newSelectedTeams = { ...selectedTeams };
    newSelectedTeams[questionId] = teamName;
    setSelectedTeams(newSelectedTeams);
  
    // Automatically submit when team is selected
    try {
      const response = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/submitPrediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser._id,
          answers: [
            {
              questionId: questionId,
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
        setSubmitStatus(`Prediction for question ${questionId} submitted successfully!`);
        setTotalScore(scoreResult.totalPoints || 0);
      } else {
        const result = await response.json();
        setSubmitStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      setSubmitStatus("Error submitting predictions.");
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

  const getGradientBackground = (index, color, selected) => {
    if (selected) {
      if (index === 0) {
        return `linear-gradient(to right, black, ${color})`;
      } else if (index === 1) {
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
                <div className="flex flex-row justify-between items-stretch md:h-32 h-28 lg:gap-3 gap-1 relative">
                  {question.options.map((option, index) => {
                    const { logoUrl, color, shortName } = getTeamData(option.name);
                    const selectedTeam = selectedTeams[question.id];
                    
                    return (
                      <button
                        key={option.name}
                        aria-label={`Select ${option.name}`}
                        style={{
                          backgroundImage: selectedTeam === option.name
                            ? getGradientBackground(index, color, true)
                            : "none",
                          backgroundColor: selectedTeam === option.name ? "initial" : "#cbcbcb",
                        }}
                        className={`py-6 px-3 flex md:flex-row ${index === 0 ? 'flex-col-reverse' : 'flex-col'} ${getTeamWidth(
                          question.id,
                          option.name
                        )} text-white font-bold text-xl md:text-2xl rounded-lg flex items-center justify-center transition-all duration-300 ease-in-out focus:outline-none`}
                        onClick={() => handleTeamSelect(question.id, option.name)}
                      >
                        {index === 0 && (
                          <>
                            <span
                              className={`transition-opacity duration-300 lg:text-[20px] md:text-[16px] text-[12px] ${
                                selectedTeam === option.name || !selectedTeam
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
                              className={`transition-opacity duration-300 lg:text-[20px] md:text-[16px] text-[12px] ${
                                selectedTeam === option.name || !selectedTeam
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
            ))}
            {submitStatus && <p className="mt-4 text-lg">{submitStatus}</p>}
          </div>
        </div>
      </div>
    </>
  );
};

export default PickemChallenge;
