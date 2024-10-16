import React, { useState, useEffect } from "react";
import { FaExclamationCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";

const PickemChallenge = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [predictions, setPredictions] = useState({
    qualifiedTeams: [], // For question 3
    question4Teams: [], // For question 4 (select 2 teams)
    question5Teams: [], // For question 5 (select 3 teams)
  });
  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState(""); // To track submit status

  // Fetch existing predictions if available
  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const response = await fetch(`https://dongchuyennghiep-backend.vercel.app/api/auth/checkuserprediction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId: currentUser._id })
        });
  
        const result = await response.json();
        if (response.ok) {
          // Populate the form with the user's previous responses
          const previousPrediction = result.data;
          const answers = previousPrediction.answers.reduce((acc, curr) => {
            acc[curr.questionId] = curr.selectedTeams;
            return acc;
          }, {});
          setPredictions(answers);
        } else {
          console.log(result.message);
        }
      } catch (error) {
        console.error("Error fetching prediction:", error);
      }
    };
  
    if (currentUser._id) {
      fetchPrediction();
    }
  }, [currentUser]);

  const questions = [
    {
      id: 3,
      question: `Team nào sẽ vượt qua vòng 1 (Select up to 5)`,
      maxQualifiedTeams: 5,
      type: "multiple",
      options: [
        { name: "We Are One", logo: "1HtwSX-OrX12BdekcMt5B0DUWbsfXQ95L" },
        { name: "Kero Esport", logo: "1VOegHodLok5NHcWvS6GECprWaMRo45uE" },
        { name: "Dong Chuyen Nghiep", logo: "19JF-fhVhMdsCD9HlE8CY-Nv9B9v-1Rpu" },
        { name: "Young Gen", logo: "1ZzhKLmpxond5b7jqkuYAw1BSe5cydqkZ" },
        { name: "DWG KIA", logo: "1xDI973eUq_zqhC4xIte5s1N2dwqn7-GP" },
        { name: "10A4", logo: "10LaLO23gCAlnmOpI04es2kicyLARuRM9" }
      ]
    },
    {
      id: 4,
      question: `Chọn 2 đội sẽ tiến vào chung kết`,
      maxQualifiedTeams: 2,
      type: "multiple",
      options: [
        { name: "We Are One", logo: "1HtwSX-OrX12BdekcMt5B0DUWbsfXQ95L" },
        { name: "Kero Esport", logo: "1VOegHodLok5NHcWvS6GECprWaMRo45uE" },
        { name: "Dong Chuyen Nghiep", logo: "19JF-fhVhMdsCD9HlE8CY-Nv9B9v-1Rpu" },
        { name: "Young Gen", logo: "1ZzhKLmpxond5b7jqkuYAw1BSe5cydqkZ" },
        { name: "DWG KIA", logo: "1xDI973eUq_zqhC4xIte5s1N2dwqn7-GP" },
        { name: "10A4", logo: "10LaLO23gCAlnmOpI04es2kicyLARuRM9" }
      ]
    },
    {
      id: 5,
      question: `Chọn 3 đội sẽ vào vòng bán kết`,
      maxQualifiedTeams: 3,
      type: "multiple",
      options: [
        { name: "We Are One", logo: "1HtwSX-OrX12BdekcMt5B0DUWbsfXQ95L" },
        { name: "Kero Esport", logo: "1VOegHodLok5NHcWvS6GECprWaMRo45uE" },
        { name: "Dong Chuyen Nghiep", logo: "19JF-fhVhMdsCD9HlE8CY-Nv9B9v-1Rpu" },
        { name: "Young Gen", logo: "1ZzhKLmpxond5b7jqkuYAw1BSe5cydqkZ" },
        { name: "DWG KIA", logo: "1xDI973eUq_zqhC4xIte5s1N2dwqn7-GP" },
        { name: "10A4", logo: "10LaLO23gCAlnmOpI04es2kicyLARuRM9" }
      ]
    }
  ];

  const handleTeamSelection = (team, question) => {
    const selectedTeams = predictions[question.id] || [];
    const newSelectedTeams = selectedTeams.includes(team.name)
      ? selectedTeams.filter((t) => t !== team.name)
      : [...selectedTeams, team.name];

    if (newSelectedTeams.length <= question.maxQualifiedTeams) {
      setPredictions({ ...predictions, [question.id]: newSelectedTeams });
      validateQualifiedTeams(newSelectedTeams, question.maxQualifiedTeams, question.id);
    }
  };

  const validateQualifiedTeams = (selectedTeams, maxQualifiedTeams, questionId) => {
    const newErrors = { ...errors };
    if (selectedTeams.length !== maxQualifiedTeams) {
      newErrors[questionId] = `Please select exactly ${maxQualifiedTeams} teams`;
    } else {
      delete newErrors[questionId];
    }
    setErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validQuestions = questions.filter((q) => q.type === "multiple").map((q) => ({
      id: q.id,
      selected: predictions[q.id]?.length || 0,
      max: q.maxQualifiedTeams
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

        const response = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/submitPrediction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();
        if (response.ok) {
          setSubmitStatus("Predictions submitted successfully!");
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
                      className={`p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex flex-col items-center justify-center ${
                        predictions[question.id]?.includes(option.name)
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-800"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {option.logo && (
                        <img
                          src={`https://drive.google.com/thumbnail?id=${option.logo}`}
                          alt={option.name}
                          className="w-28 h-28 mb-4"
                        />
                      )}
                      {option.name}
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
