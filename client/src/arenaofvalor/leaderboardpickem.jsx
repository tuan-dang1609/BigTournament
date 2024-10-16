import React, { useState, useEffect } from "react";

const LeaderboardComponent = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true); // State to show loading state
  const [error, setError] = useState(null); // State to handle errors

  // Fetch leaderboard data on component mount
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('https://dongchuyennghiep-backend.vercel.app/api/auth/leaderboardpickem', {
          method: 'POST', // If you are using POST, otherwise change to GET
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ limit: 10 }) // Optional: Limit top 10 users
        });

        const result = await response.json();

        if (response.ok) {
          setLeaderboardData(result.leaderboard); // Set the leaderboard data
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

  if (loading) {
    return <div className="text-center py-8">Loading leaderboard...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Leaderboard</h2>
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Rank</th>
              <th className="py-3 px-6 text-left">User</th>
              <th className="py-3 px-6 text-center">Score</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {leaderboardData.map((user, index) => (
              <tr
                key={user._id} // Use unique key
                className="border-b border-gray-200 hover:bg-gray-100 transition duration-300 ease-in-out"
              >
                <td className="py-3 px-6 text-left whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="font-medium">{index + 1}</span>
                  </div>
                </td>
                <td className="py-3 px-6 text-left">
                  <div className="flex items-center">
                    <div className="mr-2">
                      <img
                        className="w-8 h-8 rounded-full"
                        src={`https://drive.google.com/thumbnail?id=${user.avatar}`} // Assuming the avatar URL is in the `avatar` field
                        alt={`${user.name}'s avatar`}
                      />
                    </div>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </td>
                <td className="py-3 px-6 text-center">
                  <div className="flex items-center justify-center">
                    <span className="font-medium">{user.score}</span> {/* Display user's score */}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardComponent;
