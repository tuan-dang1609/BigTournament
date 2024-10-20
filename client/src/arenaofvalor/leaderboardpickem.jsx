import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import MyNavbar2 from "../components/Navbar2";
import { Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import 'chart.js/auto';


// Register the annotation plugin
import { Chart } from 'chart.js';
Chart.register(annotationPlugin);

const LeaderboardComponent = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [rankedLeaderboardData, setRankedLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRank, setUserRank] = useState(null);
  const [points, setPoints] = useState([]);  // Points for the x-axis
  const [counts, setCounts] = useState([]);  // Counts for the y-axis

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.title = "Bảng xếp hạng Dự đoán";
  }, []);

  const navigationAll1 = {
    aov: [
      { name: "Đoán theo trận", href: "/arenaofvalor/pickem/pickemmatch", current: location.pathname === "/arenaofvalor/pickem/pickemmatch" },
      { name: "Đoán tổng thể", href: "/arenaofvalor/pickem", current: location.pathname === "/arenaofvalor/pickem" },
      { name: "Bảng xếp hạng", href: "/arenaofvalor/pickem/leaderboard", current: location.pathname === "/arenaofvalor/pickem/leaderboard" },
    ]
  };

  const getNavigation = () => navigationAll1.aov;

  const LeaderboardRow = ({ user, className, isSticky = false, highlightUser = false }) => (
    <tr
      className={`border-b-[0.1px] ${className} first:border-t-[0.1px] border-opacity-20 ${isSticky ? "border-white text-white" : "border-base-content text-base-content"} transition duration-300 ease-in-out`}
      style={isSticky ? { height: "60px" } : {}}
    >
      <td className={`px-4 py-3 text-left whitespace-nowrap w-[10%] ${isSticky ? '' : 'first:border-0'}`}>
        <div className="flex items-center justify-center">
          <span className={`text-[12px] font-semibold md:text-[14px] ${highlightUser ? 'text-primary' : ''}`}>
            {user.rank}
          </span>
        </div>
      </td>
      <td className="lg:py-2 lg:px-6 py-3 text-left w-[55%] lg:w-[68%]">
        <div className="flex items-center">
          <div className="lg:mr-3 mr-2">
            <img
              className="lg:w-14 lg:h-14 h-12 w-12 rounded-full"
              src={`https://drive.google.com/thumbnail?id=${user.avatar}`}
              alt={`${user.name}'s avatar`}
            />
          </div>
          <span className={`text-[12px] font-semibold md:text-[14px] ${highlightUser ? 'text-primary' : ''}`}>
            {user.name}
          </span>
        </div>
      </td>
      <td className="py-3 px-6 text-center lg:w-[25%] w-[32%]">
        <div className="flex items-center justify-center">
          <span className={`text-[12px] font-semibold md:text-[16px] ${highlightUser ? 'text-primary' : ''}`}>
            {user.score} PTS
          </span>
        </div>
      </td>
    </tr>
  );

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/leaderboardpickem', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();

        if (response.ok) {
          setLeaderboardData(result.leaderboard);
        } else {
          throw new Error(result.message || 'Error fetching leaderboard');
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  useEffect(() => {
    if (leaderboardData.length > 0) {
      const calculateRanks = (data) => {
        let rank = 1;
        const rankedData = [{ ...data[0], rank }];

        for (let i = 1; i < data.length; i++) {
          if (data[i].score === data[i - 1].score) {
            rankedData.push({ ...data[i], rank });
          } else {
            rank = i + 1;
            rankedData.push({ ...data[i], rank });
          }
        }

        return rankedData;
      };

      const rankedData = calculateRanks(leaderboardData);
      setRankedLeaderboardData(rankedData);

      const currentUserRank = rankedData.find(user => user.name === currentUser.username);
      if (currentUserRank) {
        setUserRank({ ...currentUserRank });
      }
    }
  }, [leaderboardData, currentUser]);

  useEffect(() => {
    if (rankedLeaderboardData.length > 0) {
      const sortedData = [...rankedLeaderboardData].sort((a, b) => b.score - a.score);

      const scoreCountMap = {};
      sortedData.forEach(user => {
        scoreCountMap[user.score] = (scoreCountMap[user.score] || 0) + 1;
      });

      const pointsData = Object.keys(scoreCountMap).map(Number);
      const countsData = Object.values(scoreCountMap);

      setPoints(pointsData);
      setCounts(countsData);
    }
  }, [rankedLeaderboardData]);

  const prepareChartData = () => {
    const userScore = userRank ? userRank.score : null;
    const userScoreIndex = points.indexOf(userScore);

    // Function to get the color for a specific point based on its position (tier)
    const getPointColor = (point) => {
      const totalPoints = Math.max(...points);
      const tierIndex = Math.floor((point / totalPoints) * 5); // Divide into 5 tiers
      switch (tierIndex) {
        case 0: return '#ffffff'; // No Tier
        case 1: return '#4caf50'; // C Tier
        case 2: return '#00bcd4'; // B Tier
        case 3: return '#e91e63'; // A Tier
        case 4: return '#ff9800'; // S Tier
        default: return '#f39c12'; // Default color for safety
      }
    };

    return {
      labels: points,
      datasets: [
        {
          label: 'Number of Users', // Main dataset for the line, but we will hide it in the legend
          data: counts,
          borderColor: points.map(point => getPointColor(point)), // Dynamic line color based on point
          fill: false,
          borderWidth: 2,
          pointBackgroundColor: points.map((point, index) =>
            index === userScoreIndex ? 'white' : '' // Highlight the user's score with a purple dot
          ),
          pointRadius: points.map((point, index) =>
            index === userScoreIndex ? 6 : 0 // Larger dot for the current user
          ),
          segment: {
            borderColor: ctx => getPointColor(points[ctx.p0DataIndex]), // Color each segment according to the tier
          },
        },
        // Dummy datasets for showing legend labels only
        {
          label: 'No Tier',
          borderColor: '#ffffff',
          backgroundColor: '#ffffff',
          pointRadius: 0,
          data: [], // No actual data, just for legend
          fill: false,
          hidden: false, // Ensure it shows in the legend
        },
        {
          label: 'C Tier',
          borderColor: '#4caf50',
          backgroundColor: '#4caf50',
          pointRadius: 0,
          data: [], // No actual data, just for legend
          fill: false,
          hidden: false, // Ensure it shows in the legend
        },
        {
          label: 'B Tier',
          borderColor: '#00bcd4',
          backgroundColor: '#00bcd4',
          pointRadius: 0,
          data: [], // No actual data, just for legend
          fill: false,
          hidden: false, // Ensure it shows in the legen
        },
        {
          label: 'A Tier',
          borderColor: '#e91e63',
          backgroundColor: '#e91e63',
          pointRadius: 0,
          data: [], // No actual data, just for legend
          fill: false,
          hidden: false, // Ensure it shows in the legend
        },
        {
          label: 'S Tier',
          borderColor: '#ff9800',
          backgroundColor: '#ff9800',
          pointRadius: 0,
          data: [], // No actual data, just for legend
          fill: false,
          hidden: false, // Ensure it shows in the legend
        },
      ],
    };
  };

  // Chart options with specific control over the legend
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          filter: function (legendItem, chartData) {
            return legendItem.text !== 'Number of Users'; // Prevent 'Number of Users' from showing
          },
          color: '#ffffff', // White labels for the dark background
          usePointStyle: true,
        },
        onClick: (e) => {}, // Disable the default behavior of clicking on a legend
      },
      tooltip: {
        enabled: false, // This will turn off tooltips
      },
      annotation: {
        annotations: {
          // Line for the start of No Tier
          noTierLine: {
            type: 'line',
            xMin: 10,
            xMax: 10,
            borderColor: '#ffffff',
            borderWidth: 2,
            borderDash: [6, 6],
          },
          // Line for the start of C Tier
          cTierLine: {
            type: 'line',
            xMin: 24,
            xMax: 24,
            borderColor: '#4caf50',
            borderWidth: 2,
            borderDash: [6, 6],
          },
          // Line for the start of B Tier
          bTierLine: {
            type: 'line',
            xMin: 39,
            xMax: 39,
            borderColor: '#00bcd4',
            borderWidth: 2,
            borderDash: [6, 6],
          },
          // Line for the start of A Tier
          aTierLine: {
            type: 'line',
            xMin: 53,
            xMax: 53,
            borderColor: '#e91e63',
            borderWidth: 2,
            borderDash: [6, 6],
          },
          // Line for the start of S Tier
          sTierLine: {
            type: 'line',
            xMin: 84,
            xMax: 84,
            borderColor: '#ff9800',
            borderWidth: 2,
            borderDash: [6, 6],
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.4)', // White color with 0.4 opacity
          callback: function (value, index, values) {
            // Define custom ticks for 0, 20, 40, 60, 80
            return [0, 20, 40, 60, 80, 100].includes(value) ? value : null;
          },
          min: 0, // Minimum value on the x-axis
          max: 100, // Maximum value on the x-axis
        },
        grid: {
          display: false, // Hide grid lines
        },
        title: {
          display: true,
          text: 'Points',
          color: '#ffffff',
        },
      },
      y: {
        display: false, // Hide y-axis
      },
    },
  };



  // In your component's render

  if (loading) {
    return (
      <>
        <MyNavbar2 navigation={getNavigation()} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
        <div className="flex justify-center items-center min-h-screen">
          <span className="loading loading-dots loading-lg text-primary"></span>
        </div>
      </>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  return (
    <>
      <MyNavbar2 navigation={getNavigation()} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div className="container mx-auto px-4 py-8 mt-40">
        <h2 className="text-3xl font-bold mb-6 text-center text-base-content">Leaderboard</h2>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-base-100 w-full rounded-lg">
            {points.length > 0 && (
              <div className="w-full h-[200px]"> {/* Set width to 100% and height to 300px */}
                <Line data={prepareChartData()} options={{ ...chartOptions, maintainAspectRatio: false }} />
              </div>
            )}
          </div>
        </div>
        <div className="overflow-hidden">
          <table className="w-[98%] mx-auto">
            <tbody className="text-gray-600 text-sm font-light">
              {rankedLeaderboardData.slice(0, 20).map((user, index) => (
                <LeaderboardRow
                  className="last:!border-b-0"
                  key={user._id || `${user.rank}-${index}`}
                  user={user}
                  highlightUser={user.name === currentUser.username} // Add text-primary class if user is current user
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {userRank && (
        <div className="fixed bottom-0 w-full bg-black border-opacity-20 py-1 text-white flex items-center justify-between border-t-[0.1px] border-white">
          <div className="container mx-auto px-4">
            <table className="w-[98%] mx-auto">
              <tbody>
                <LeaderboardRow user={userRank} className="first:!border-t-0" isSticky={true} />
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default LeaderboardComponent;
