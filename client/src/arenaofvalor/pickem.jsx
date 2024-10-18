import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux"; // Assuming you're using Redux to manage user state

const PickemChallengeMatch = () => {
  const { currentUser } = useSelector((state) => state.user); // Assuming currentUser is stored in Redux state
  const [selectedTeams, setSelectedTeams] = useState(Array(3).fill(null));
  const [errors, setErrors] = useState(Array(3).fill(""));
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [selectedWidths, setSelectedWidths] = useState(Array(3).fill({ blue: false, red: false }));
  const [submitStatus, setSubmitStatus] = useState(null); // To track submission status
  const [existingPredictions, setExistingPredictions] = useState([]); // To store existing predictions

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch existing predictions
  useEffect(() => {
    const fetchExistingPredictions = async () => {
      if (currentUser && currentUser._id) {
        try {
          const response = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/checkuserprediction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser._id }),
          });
          const result = await response.json();
          setExistingPredictions(result.data?.answers || []);
        } catch (error) {
          console.error("Error fetching existing predictions:", error);
        }
      }
    };
    fetchExistingPredictions();
  }, [currentUser]);

  const handleTeamSelect = (index, teamSide) => {
    const newSelectedTeams = [...selectedTeams];
    const newErrors = [...errors];
    const newSelectedWidths = [...selectedWidths];

    newSelectedTeams[index] = teamSide;
    newErrors[index] = "";
    newSelectedWidths[index] = { blue: teamSide === "blue", red: teamSide === "red" };

    setSelectedTeams(newSelectedTeams);
    setErrors(newErrors);
    setSelectedWidths(newSelectedWidths);

    console.log("Selected Teams: ", newSelectedTeams); // Log selected teams
  };

  const submitPrediction = async () => {
    if (!currentUser || !currentUser._id) {
      setSubmitStatus("Error: You must be logged in to submit predictions.");
      return;
    }

    // Preparing the prediction data with the selected teams and questionIds
    const predictionData = matches.map((match, index) => {
      const selectedTeam = selectedTeams[index];
      let selectedTeamsArray = [];
      if (selectedTeam === "blue") {
        selectedTeamsArray = [match.blue.team];
      } else if (selectedTeam === "red") {
        selectedTeamsArray = [match.red.team];
      }
      return {
        questionId: match.questionId,
        selectedTeams: selectedTeamsArray,
      };
    });

    // Merge existing predictions with the new ones
    const mergedPredictions = [...existingPredictions];

    predictionData.forEach(newAnswer => {
      const existingAnswerIndex = mergedPredictions.findIndex(answer => answer.questionId === newAnswer.questionId);
      if (existingAnswerIndex !== -1) {
        mergedPredictions[existingAnswerIndex].selectedTeams = newAnswer.selectedTeams;
      } else {
        mergedPredictions.push(newAnswer);
      }
    });

    try {
      console.log("Submitting prediction...", mergedPredictions); // Log the payload before submission

      const response = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/submitPrediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser._id,
          answers: mergedPredictions,
        }),
      });

      const data = await response.json();
      console.log("API Response:", data); // Log the response

      if (response.ok) {
        setSubmitStatus("Prediction submitted successfully!");
        console.log("Prediction submitted successfully!");
      } else {
        setSubmitStatus(`Error: ${data.error}`);
        console.log("Error submitting prediction: ", data.error);
      }
    } catch (error) {
      console.error("Error submitting prediction:", error);
      setSubmitStatus("Error submitting prediction. Please try again later.");
    }
  };

  const getTeamWidth = (index, teamSide) => {
    const isSelectedWidth = selectedWidths[index][teamSide];

    if (isSelectedWidth) {
      return windowWidth >= 768 ? "w-[75%]" : "w-[30%]";
    }
    return selectedTeams[index] ? "w-[25%]" : "w-[70%]";
  };

  // Include questionId for each match
  const matches = [
    {
      questionId: "1", // Unique questionId for each match
      blue: { team: "T1", bgColor: "bg-red-600", logo: "https://example.com/t1-logo.png" },
      red: { team: "FNATIC", bgColor: "bg-yellow-500", logo: "https://example.com/fnatic-logo.png" },
    },
    {
      questionId: "2", // Unique questionId for each match
      blue: { team: "G2", bgColor: "bg-black", logo: "https://example.com/g2-logo.png" },
      red: { team: "SKT", bgColor: "bg-red-400", logo: "https://example.com/skt-logo.png" },
    },
    {
      questionId: "3", // Unique questionId for each match
      blue: { team: "Cloud9", bgColor: "bg-blue-300", logo: "https://example.com/cloud9-logo.png" },
      red: { team: "FPX", bgColor: "bg-red-500", logo: "https://example.com/fpx-logo.png" },
    },
  ];

  return (
    <div className="font-sans bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl overflow-hidden">
        <h1 className="text-3xl font-bold text-center py-6 bg-blue-600 text-white">
          League of Legends Pick'em Challenge
        </h1>
        <div className="p-6">
          {matches.map((match, index) => (
            <div key={index} className="mb-8 last:mb-0">
              <div className="flex flex-row justify-between items-stretch h-96 md:h-64 relative">
                {/* Blue Team */}
                <button
                  aria-label={`Select ${match.blue.team}`}
                  className={`${getTeamWidth(index, "blue")} ${match.blue.bgColor} h-1/2  text-white font-bold text-xl md:text-2xl flex items-center justify-center transition-all duration-300 ease-in-out focus:outline-none`}
                  onClick={() => handleTeamSelect(index, "blue")}
                >
                  <img
                    src={match.blue.logo}
                    alt={`${match.blue.team} Logo`}
                    className="w-8 h-8 mr-2"
                  />
                  {match.blue.team}
                </button>

                {/* Red Team */}
                <button
                  aria-label={`Select ${match.red.team}`}
                  className={`${getTeamWidth(index, "red")} ${match.red.bgColor} h-1/2  text-white font-bold text-xl md:text-2xl flex items-center justify-center transition-all duration-300 ease-in-out focus:outline-none`}
                  onClick={() => handleTeamSelect(index, "red")}
                >
                  {match.red.team}
                  <img
                    src={match.red.logo}
                    alt={`${match.red.team} Logo`}
                    className="w-8 h-8 ml-2"
                  />
                </button>
              </div>

              <div className="mt-6 text-center">
                {selectedTeams[index] ? (
                  <p className="text-lg font-semibold text-gray-700">
                    You've selected{" "}
                    <span
                      className={`font-bold ${
                        selectedTeams[index] === "blue" ? "text-blue-600" : "text-red-600"
                      }`}
                    >
                      {selectedTeams[index] === "blue" ? match.blue.team : match.red.team}
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

          {/* Submit Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={submitPrediction}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
            >
              Submit Prediction
            </button>
          </div>

          {submitStatus && (
            <div className="mt-6 text-center">
              <p className={`mt-4 ${submitStatus.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                {submitStatus}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PickemChallengeMatch;
