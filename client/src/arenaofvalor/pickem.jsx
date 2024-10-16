import React, { useState, useEffect } from "react";
import { FaExclamationCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";

const PickemChallenge = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [predictions, setPredictions] = useState({});
  const [questions, setQuestions] = useState([]); // Dynamic questions from backend
  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState("");
  const [totalScore, setTotalScore] = useState(0);

  // Fetch questions and predictions
  useEffect(() => {
    const fetchQuestionsAndPredictions = async () => {
      try {
        // Fetch questions from backend
        const questionResponse = await fetch(`https://dongchuyennghiep-backend.vercel.app/api/auth/getquestions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const questionResult = await questionResponse.json();
        if (questionResponse.ok && questionResult.data) {
          setQuestions(questionResult.data);
        }

        if (!currentUser || !currentUser._id) return;

        // Fetch existing predictions if available
        const predictionResponse = await fetch(`https://dongchuyennghiep-backend.vercel.app/api/auth/checkuserprediction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: currentUser._id })
        });

        const predictionResult = await predictionResponse.json();
        if (predictionResponse.ok && predictionResult.data) {
          const previousPrediction = predictionResult.data;
          const answers = previousPrediction.answers.reduce((acc, curr) => {
            acc[curr.questionId] = curr.selectedTeams;
            return acc;
          }, {});
          setPredictions(answers);
        } else {
          console.log("No previous predictions found.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (currentUser) {
      fetchQuestionsAndPredictions();
    }
  }, [currentUser]);

  const handleTeamSelection = (team, question) => {
    const selectedTeams = predictions[question.id] || [];
    const newSelectedTeams = selectedTeams.includes(team.name)
      ? selectedTeams.filter((t) => t !== team.name)
      : [...selectedTeams, team.name];

    if (newSelectedTeams.length <= question.maxChoose) {
      setPredictions({ ...predictions, [question.id]: newSelectedTeams });
      validateQualifiedTeams(newSelectedTeams, question.maxChoose, question.id);
    }
  };

  const validateQualifiedTeams = (selectedTeams, maxChoose, questionId) => {
    const newErrors = { ...errors };
    if (selectedTeams.length !== maxChoose) {
      newErrors[questionId] = `Please select exactly ${maxChoose} teams`;
    } else {
      delete newErrors[questionId];
    }
    setErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validQuestions = questions.map((q) => ({
      id: q.id,
      selected: predictions[q.id]?.length || 0,
      max: q.maxChoose
    }));

    const hasErrors = validQuestions.some((q) => q.selected !== q.max);

    if (!hasErrors) {
      try {
        const data = {
          userId: currentUser._id,
          answers: questions.map((q) => ({
            questionId: q.id,
            selectedTeams: predictions[q.id] || []
          }))
        };

        // Submit the predictions to the server
        const response = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/submitPrediction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        if (response.ok) {
          setSubmitStatus("Predictions submitted successfully!");

          // Now compare predictions and calculate total score
          const scoreResponse = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/comparepredictions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: currentUser._id }),
          });

          const scoreResult = await scoreResponse.json();
          if (scoreResponse.ok) {
            setTotalScore(scoreResult.totalPoints);  // Set the total score after comparison
          } else {
            console.log(`Error calculating score: ${scoreResult.message}`);
          }

        } else {
          setSubmitStatus(`Error: ${result.error}`);
        }
      } catch (error) {
        console.error("Error submitting predictions:", error);
        setSubmitStatus("Error submitting predictions.");
      }
    } else {
      console.log("Please correct the errors before submitting");
    }
  };

  return (
    <div className="min-h-screen mt-10 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto shadow-lg rounded-lg overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <form onSubmit={handleSubmit} className="p-6 space-y-6 md:w-full">
            {questions.map((question) => (
              <div key={question.id} className="space-y-4">
                <h3 className="text-lg font-semibold">{question.question}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {question.options.map((option) => (
                    <motion.button
                      key={option.name}
                      type="button"
                      onClick={() =>
                        handleTeamSelection(option, question)
                      }
                      className={`p-2 rounded-lg text-sm focus:outline-none flex flex-col items-center justify-center ${
                        predictions[question.id]?.includes(option.name)
                          ? "w-full bg-gradient-to-r from-secondary to-accent text-white p-3 rounded-lg font-semibold hover:bg-gradient-to-r hover:from-primary hover:to-accent focus:outline-none"
                          : "bg-gray-200 text-gray-800 p-3 border-2 border-accent"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {option.logo && (
                        <img
                          src={`https://drive.google.com/thumbnail?id=${option.logo}`}
                          alt={option.name}
                          className="w-28 h-28 mb-3"
                        />
                      )}<p className="text-[14.5px] pb-2 font-semibold">{option.name}</p>
                    </motion.button>
                  ))}
                </div>
                {errors[question.id] && (
                  <p className="text-red-500 text-sm flex items-center">
                    <FaExclamationCircle className="mr-1" />
                    {errors[question.id]}
                  </p>
                )}
              </div>
            ))}
            <motion.button
              type="submit"
              className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Submit Predictions
            </motion.button>
            {submitStatus && (
              <p className={`mt-4 text-sm ${submitStatus.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                {submitStatus}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default PickemChallenge;
