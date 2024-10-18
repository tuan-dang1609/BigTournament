import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux"; // Assuming you're using Redux to get the current user

const PickemChallenge = () => {
  const { currentUser } = useSelector((state) => state.user); // Get current user from Redux store
  const [selectedTeams, setSelectedTeams] = useState({});
  const [questions, setQuestions] = useState([]);
  const [submitStatus, setSubmitStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

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
      return windowWidth >= 768 ? "w-[60%]" : "w-[70%]";
    }
    return selectedTeam ? "w-[40%]" : "w-1/2";
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="font-sans bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl overflow-hidden">
        <h1 className="text-3xl font-bold text-center py-6 bg-blue-600 text-white">
          League of Legends Pick'em Challenge
        </h1>
        <div className="p-6">
          {questions.map((question) => (
            <div key={question.id} className="mb-8">
              <h3 className="text-lg font-semibold mb-4">{question.question}</h3>
              <div className="flex flex-col md:flex-row justify-between items-stretch h-96 md:h-64 relative">
                {question.options.map((option) => (
                  <button
                    key={option.name}
                    aria-label={`Select ${option.name}`}
                    className={`${getTeamWidth(
                      question.id,
                      option.name
                    )} h-1/2 md:h-full bg-gray-400 text-white font-bold text-xl md:text-2xl flex items-center justify-center transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-300 ${
                      selectedTeams[question.id] === option.name
                        ? "ring-4 ring-blue-300"
                        : ""
                    }`}
                    onClick={() => handleTeamSelect(question.id, option.name)}
                  >
                    <img
                      src={option.logo}
                      alt={`${option.name} Logo`}
                      className="w-8 h-8 mr-2"
                    />
                    {option.name}
                  </button>
                ))}
              </div>

              {/* Selected Team Message */}
              <div className="mt-4 text-center">
                {selectedTeams[question.id] ? (
                  <p className="text-lg font-semibold text-gray-700">
                    You've selected{" "}
                    <span className="font-bold text-blue-600">
                      {selectedTeams[question.id]}
                    </span>
                  </p>
                ) : (
                  <p className="text-lg font-semibold text-gray-700">
                    Select a team to make your pick!
                  </p>
                )}
              </div>
            </div>
          ))}
          {submitStatus && <p className="mt-4 text-lg">{submitStatus}</p>}
        </div>
      </div>
    </div>
  );
};

export default PickemChallenge;
