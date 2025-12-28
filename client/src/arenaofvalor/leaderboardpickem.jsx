import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import MyNavbar2 from '../components/Navbar2';
import LeagueHeader from '../components/header';
import { useLeagueData } from '../hooks/useLeagueData';
import { Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import 'chart.js/auto';
import Image from '../image/waiting.png';
// Register the annotation plugin
import { Chart } from 'chart.js';
Chart.register(annotationPlugin);

const LeaderboardComponent = () => {
  const { currentUser } = useSelector((state) => state.user);
  const { league_id } = useParams();
  const [lastGame, setLastGame] = useState('aov');
  // League header data (same header as pickem page)
  const { league, startTime, me } = useLeagueData('aov', league_id, currentUser);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [rankedLeaderboardData, setRankedLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRank, setUserRank] = useState(null);
  const [maxScore, SetMaxScore] = useState(null);
  const [points, setPoints] = useState([]);
  const [counts, setCounts] = useState([]);
  const [scoretop1, setScoreTop1] = useState(null);
  // Header stats for Pick'em header (score + top%) on leaderboard page
  const [pickemStats, setPickemStats] = useState(null);

  // State to store tier scores
  const [tierScores, setTierScores] = useState({
    sTierScore: 0,
    aTierScore: 0,
    bTierScore: 0,
    cTierScore: 0,
  });

  useEffect(() => {
    const scrollToTop = () => {
      document.documentElement.scrollTop = 0;
    };
    setTimeout(scrollToTop, 0);
    document.title = 'Bảng xếp hạng Dự đoán';
    try {
      const g = typeof window !== 'undefined' ? localStorage.getItem('pickem:lastGame') : null;
      if (g) setLastGame(g);
    } catch {}
  }, []);

  const LeaderboardRow = ({
    user,
    className,
    isSticky = false,
    highlightUser = false,
    tierColor,
  }) => (
    <tr
      className={`border-b-[0.1px] ${className} first:border-t-[0.1px] border-opacity-20 ${
        isSticky ? 'border-white text-white' : 'border-base-content text-base-content'
      } transition duration-300 ease-in-out`}
      style={highlightUser ? { color: tierColor } : {}}
    >
      <td className={`px-4 py-3 text-left w-[10%] ${isSticky ? '' : 'first:border-0'}`}>
        <div className="flex items-center justify-center">
          <span
            className={`text-[12px] font-semibold md:text-[14px] ${
              highlightUser ? 'text-primary' : ''
            }`}
            style={highlightUser ? { color: tierColor } : {}}
          >
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
          <div className="flex items-center gap-2">
            <span
              className={`text-[12px] font-semibold md:text-[14px] ${
                highlightUser ? 'text-primary' : ''
              }`}
              style={highlightUser ? { color: tierColor } : {}}
            >
              {user.name}
            </span>
            {user.logoTeam && (
              <img
                className="h-10 w-10 object-contain ml-5"
                src={`https://drive.google.com/thumbnail?id=${user.logoTeam}`}
                alt={`${user.team || 'team'} logo`}
              />
            )}
          </div>
        </div>
      </td>
      <td className="py-3 px-6 text-center lg:w-[25%] w-[32%]">
        <div className="flex items-center justify-center gap-3">
          <span
            className={`text-[12px] font-semibold md:text-[16px] ${
              highlightUser ? 'text-primary' : ''
            }`}
            style={highlightUser ? { color: tierColor } : {}}
          >
            {user.score} PTS
          </span>
          {/* View pick'em of this user (read-only) - hide for current user */}
          {!highlightUser && (
            <Link
              to={`/${league_id}/pickem/view/${encodeURIComponent(
                user.userId || user.rawUsername || user.name
              )}/${
                (typeof window !== 'undefined' && localStorage.getItem('pickem:lastType')) ||
                'bracket'
              }`}
              className="inline-flex items-center justify-center hover:opacity-80"
              aria-label="Xem Pick'em"
              title="Xem Pick'em"
            >
              {/* Eye icon (inline SVG) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 md:w-6 md:h-6"
              >
                <path d="M12 5c-5 0-9 4.5-10 7 1 2.5 5 7 10 7s9-4.5 10-7c-1-2.5-5-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
              </svg>
            </Link>
          )}
        </div>
      </td>
    </tr>
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const API_BASE = import.meta.env?.VITE_API_BASE || 'https://bigtournament-1.onrender.com';

        // 1) Fetch leaderboard (live, from PickemResponse) for this league
        const leaderboardResponse = await fetch(
          `${API_BASE}/api/auth/pickem/${league_id}/leaderboard`
        );
        const leaderboardResult = await leaderboardResponse.json();

        // 2) Fetch questions for all game_short to compute Perfect Pick’em (totalPointAll)
        const questionsResp = await fetch(`${API_BASE}/api/auth/all/${league_id}/question/all`);
        const questionsJson = await questionsResp.json();

        // Map leaderboard fields to UI shape
        const rawList = Array.isArray(leaderboardResult)
          ? leaderboardResult
          : leaderboardResult?.leaderboard || [];
        const mapped = (rawList || []).map((u) => ({
          userId: u.userId,
          // keep raw username for identification
          rawUsername: u.username,
          name: u.nickname || u.username,
          avatar: u.img || u.profilePicture || '',
          score: Number(u.Score ?? u.score ?? 0),
          team: u.team || '',
          logoTeam: u.logoTeam || '',
        }));

        if (mapped.length > 0) {
          const topScore = mapped[0].score;
          setScoreTop1(topScore);
          setLeaderboardData(mapped);
        } else {
          setLeaderboardData([]);
        }

        const maxTotal =
          typeof questionsJson?.totalPointAll === 'number'
            ? questionsJson.totalPointAll
            : Array.isArray(questionsJson?.questions)
            ? questionsJson.questions.reduce(
                (acc, q) => acc + (q?.score || 0) * (q?.maxChoose || 1),
                0
              )
            : null;
        if (typeof maxTotal === 'number') SetMaxScore(maxTotal);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (league_id) fetchData();
  }, [league_id]);

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

      const currentUserRank = rankedData.find(
        (user) =>
          user.userId === currentUser?._id ||
          user.rawUsername === currentUser?.username ||
          user.name === currentUser?.username
      );
      if (currentUserRank) {
        setUserRank({ ...currentUserRank });
        const total = rankedData.length || 1;
        const topPercent = Math.ceil((currentUserRank.rank / total) * 100);
        setPickemStats({
          score: Number(currentUserRank.score || 0),
          rank: currentUserRank.rank,
          topPercent,
        });
      } else {
        // Default if user not in leaderboard yet
        setPickemStats({ score: undefined, rank: undefined, topPercent: undefined });
      }
    }
  }, [leaderboardData, currentUser]);

  const TierRewardsTable = ({ userScore, tierScores }) => {
    const tiers = [
      {
        name: 'Perfect Picks',
        score: maxScore,
        reward: 'Perfecto + TBD',
        highlight: userScore === maxScore,
        color: '#D4AF37',
      },
      {
        name: 'Hạng 1',
        score: scoretop1,
        reward: 'Danh hiệu 1ST + TBD',
        highlight: userScore === scoretop1,
        color: '#C0A240',
      },
      {
        name: 'S',
        score: tierScores.sTierScore,
        top: 'Top 5%',
        reward: 'Danh hiệu Tier S',
        highlight:
          userScore >= tierScores.sTierScore && userScore < maxScore && userScore < scoretop1,
        color: '#ff9800',
      },
      {
        name: 'A',
        score: tierScores.aTierScore,
        top: 'Top 20%',
        reward: 'Danh hiệu Tier A',
        highlight: userScore >= tierScores.aTierScore && userScore < tierScores.sTierScore,
        color: '#CC52CE',
      },
      {
        name: 'B',
        score: tierScores.bTierScore,
        top: 'Top 40%',
        reward: '',
        highlight: userScore >= tierScores.bTierScore && userScore < tierScores.aTierScore,
        color: '#00bcd4',
      },
      {
        name: 'C',
        score: tierScores.cTierScore,
        top: 'Top 70%',
        reward: '',
        highlight: userScore >= tierScores.cTierScore && userScore < tierScores.bTierScore,
        color: '#4caf50',
      },
    ];

    return (
      <div className="mx-auto mb-8 lg:w-[92%] w-full">
        <h3 className="text-2xl font-bold text-base-content mb-4 text-center">
          Phần thưởng các Bậc
        </h3>
        <table className="mx-auto text-left border-collapse border-base-content w-[98%]">
          <tbody>
            {tiers.map((tier, index) => (
              <tr
                key={index}
                className={`border-b-2 border-base-content px-4 ${
                  tier.highlight ? 'font-semibold' : ''
                }`}
                style={{
                  color: tier.highlight ? tier.color : 'inherit',
                  borderBottomColor: tier.highlight ? tier.color : 'rgba(128, 128, 128, 0.18)',
                }}
              >
                <td className="border-base-content xl:px-4 px-1 py-3 w-[80px] md:w-[20%] lg:text-[16px] text-[12px]">
                  {tier.name}
                </td>
                <td className="border-base-content lg:px-5 px-2 py-3 lg:text-[16px] text-[12px]">
                  {tier.top}
                </td>
                <td className="border-base-content lg:px-5 px-2 py-3 lg:text-[16px] text-[12px]">
                  {tier.score} PTS
                </td>
                <td className="border-base-content lg:px-5 px-2 py-3 text-right lg:text-[16px] text-[12px]">
                  {tier.reward}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  useEffect(() => {
    if (rankedLeaderboardData.length > 0) {
      const sortedData = [...rankedLeaderboardData].sort((a, b) => b.score - a.score);

      const scoreCountMap = {};
      sortedData.forEach((user) => {
        scoreCountMap[user.score] = (scoreCountMap[user.score] || 0) + 1;
      });

      const pointsData = Object.keys(scoreCountMap).map(Number);
      const countsData = Object.values(scoreCountMap);

      setPoints(pointsData);
      setCounts(countsData);

      // Calculate tier scores based on percentile
      const totalUsers = rankedLeaderboardData.length;

      const getPercentileScore = (percentile) => {
        const index = Math.floor((percentile / 100) * totalUsers);
        return rankedLeaderboardData[index]?.score || 0;
      };

      const sTierScore = getPercentileScore(5); // Top 5%
      const aTierScore = getPercentileScore(20); // Top 20%
      const bTierScore = getPercentileScore(40); // Top 40%
      const cTierScore = getPercentileScore(70); // Top 70%

      // Map tier scores to the closest index on the X-axis
      const getClosestIndex = (score) => {
        let closestIndex = pointsData.findIndex((point) => point >= score);
        return closestIndex !== -1 ? closestIndex : pointsData.length - 1;
      };

      const sTierIndex = getClosestIndex(sTierScore);
      const aTierIndex = getClosestIndex(aTierScore);
      const bTierIndex = getClosestIndex(bTierScore);
      const cTierIndex = getClosestIndex(cTierScore);

      // Set the tier scores correctly in state
      setTierScores({
        sTierScore,
        aTierScore,
        bTierScore,
        cTierScore,
        sTierIndex,
        aTierIndex,
        bTierIndex,
        cTierIndex,
      });

      // Log for debugging
      console.log({ sTierScore, aTierScore, bTierScore, cTierScore });
      console.log({ sTierIndex, aTierIndex, bTierIndex, cTierIndex });
    }
  }, [rankedLeaderboardData]);

  const prepareChartData = () => {
    const { sTierScore, aTierScore, bTierScore, cTierScore } = tierScores;
    const userScore = userRank ? userRank.score : null;
    const userScoreIndex = points.indexOf(userScore);

    const getPointColor = (point) => {
      if (point >= sTierScore) return '#ff9800';
      if (point >= aTierScore) return '#CC52CE';
      if (point >= bTierScore) return '#00bcd4';
      if (point >= cTierScore) return '#4caf50';
      return '#6A5ACD';
    };

    return {
      labels: points,
      datasets: [
        {
          label: 'Number of Users',
          data: counts,
          borderColor: '#556B2F',
          fill: false,
          borderWidth: 2,
          pointBackgroundColor: points.map((point, index) =>
            index === userScoreIndex ? '#6A5ACD' : ''
          ),
          pointRadius: points.map((point, index) => (index === userScoreIndex ? 6 : 0)),
          segment: {
            borderColor: (ctx) => getPointColor(points[ctx.p0DataIndex]),
          },
        },
        // Dummy datasets for showing legend labels only
        {
          label: 'Tier D',
          borderColor: '#6A5ACD',
          backgroundColor: 'rgba(255, 255, 255, 0)',
          pointRadius: 0,
          data: [], // No actual data, just for legend
          fill: false,
          borderWidth: 2,
          hidden: false, // Ensure it shows in the legend
        },
        {
          label: 'Tier C',
          borderColor: '#4caf50',
          backgroundColor: 'rgba(255, 255, 255, 0)',
          pointRadius: 0,
          borderWidth: 2,
          data: [], // No actual data, just for legend
          fill: false,
          hidden: false, // Ensure it shows in the legend
        },
        {
          label: 'Tier B',
          borderColor: '#00bcd4',
          backgroundColor: 'rgba(255, 255, 255, 0)',
          pointRadius: 0,
          borderWidth: 2,
          data: [], // No actual data, just for legend
          fill: false,
          hidden: false, // Ensure it shows in the legend
        },
        {
          label: 'Tier A',
          borderColor: '#CC52CE',
          backgroundColor: 'rgba(255, 255, 255, 0)',
          pointRadius: 0,
          borderWidth: 2,
          borderWidth: 2,
          data: [], // No actual data, just for legend
          fill: false,
          hidden: false, // Ensure it shows in the legend
        },
        {
          label: 'Tier S',
          borderColor: '#ff9800',
          backgroundColor: 'rgba(255, 255, 255, 0)',
          pointRadius: 0,
          borderWidth: 2,
          data: [], // No actual data, just for legend
          fill: false,
          hidden: false, // Ensure it shows in the legend
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          filter: (legendItem) => legendItem.text !== 'Number of Users',
          color: 'rgba(128, 128, 128,1)',
          usePointStyle: true,
        },
        onClick: (e) => {},
      },
      tooltip: {
        enabled: false,
      },
      annotation: {
        annotations: (() => {
          const cIdx = tierScores.cTierIndex;
          const bIdx = tierScores.bTierIndex;
          const aIdx = tierScores.aTierIndex;
          const sIdx = tierScores.sTierIndex;
          const anns = {};
          // Background ranges like the mock (cyan, red, purple)
          if ([cIdx, bIdx].every((v) => Number.isFinite(v))) {
            anns.rangeCtoB = {
              type: 'box',
              xMin: cIdx,
              xMax: bIdx,
              backgroundColor: 'rgba(0, 188, 212, 0.18)',
              borderWidth: 0,
              drawTime: 'beforeDatasetsDraw',
            };
          }
          if ([bIdx, aIdx].every((v) => Number.isFinite(v))) {
            anns.rangeBtoA = {
              type: 'box',
              xMin: bIdx,
              xMax: aIdx,
              backgroundColor: 'rgba(183, 28, 28, 0.16)',
              borderWidth: 0,
              drawTime: 'beforeDatasetsDraw',
            };
          }
          if ([aIdx, sIdx].every((v) => Number.isFinite(v))) {
            anns.rangeAtoS = {
              type: 'box',
              xMin: aIdx,
              xMax: sIdx,
              backgroundColor: 'rgba(204, 82, 206, 0.14)',
              borderWidth: 0,
              drawTime: 'beforeDatasetsDraw',
            };
          }
          // Vertical dashed lines with numeric labels at thresholds
          if (Number.isFinite(cIdx)) {
            anns.cTierLine = {
              type: 'line',
              xMin: cIdx,
              xMax: cIdx,
              borderColor: '#00bcd4',
              borderWidth: 1.5,
              borderDash: [6, 6],
              label: {
                content: String(tierScores.cTierScore || ''),
                enabled: true,
                position: 'start',
                color: '#00e5ff',
                backgroundColor: 'rgba(0,0,0,0)',
                padding: 0,
                yAdjust: -8,
                font: { size: 13, weight: 'bold' },
              },
            };
          }
          if (Number.isFinite(bIdx)) {
            anns.bTierLine = {
              type: 'line',
              xMin: bIdx,
              xMax: bIdx,
              borderColor: '#ff4238',
              borderWidth: 1.5,
              borderDash: [6, 6],
              label: {
                content: String(tierScores.bTierScore || ''),
                enabled: true,
                position: 'start',
                color: '#ff4238',
                backgroundColor: 'rgba(0,0,0,0)',
                padding: 0,
                yAdjust: -8,
                font: { size: 13, weight: 'bold' },
              },
            };
          }
          if (Number.isFinite(aIdx)) {
            anns.aTierLine = {
              type: 'line',
              xMin: aIdx,
              xMax: aIdx,
              borderColor: '#9c27b0',
              borderWidth: 1.5,
              borderDash: [6, 6],
              label: {
                content: String(tierScores.aTierScore || ''),
                enabled: true,
                position: 'start',
                color: '#cc52ce',
                backgroundColor: 'rgba(0,0,0,0)',
                padding: 0,
                yAdjust: -8,
                font: { size: 13, weight: 'bold' },
              },
            };
          }
          if (Number.isFinite(sIdx)) {
            anns.sTierLine = {
              type: 'line',
              xMin: sIdx,
              xMax: sIdx,
              borderColor: '#ffffff',
              borderWidth: 1,
              borderDash: [6, 6],
              label: {
                content: String(points[points.length - 1] || ''),
                enabled: true,
                position: 'start',
                color: '#ffffff',
                backgroundColor: 'rgba(0,0,0,0)',
                padding: 0,
                yAdjust: -8,
                font: { size: 13, weight: 'bold' },
              },
            };
          }
          return anns;
        })(),
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'rgba(128, 128, 128,1)',
          callback: function (value) {
            if (
              value === tierScores.sTierIndex ||
              value === tierScores.aTierIndex ||
              value === tierScores.bTierIndex ||
              value === tierScores.cTierIndex
            ) {
              return points[value];
            }
            return '';
          },
        },
        grid: { display: false },
        title: { display: true, text: 'Điểm', color: 'rgba(128, 128, 128,1)' },
        border: { color: 'rgba(128, 128, 128,1)' },
        display: true,
      },
      y: { display: false },
    },
  };

  if (loading) {
    return (
      <>
        {/* Header like pickem page, no pickemStats here */}
        <LeagueHeader
          me={me}
          league={league || { league: { name: '' }, season: {} }}
          league_id={league_id}
          startTime={startTime}
          endTime={league?.season?.time_end}
          currentUser={currentUser}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          getNavigation={() => []}
          MyNavbar2={MyNavbar2}
          pickemStats={pickemStats}
        />
        <div className="flex justify-center items-center min-h-screen">
          <span className="loading loading-dots loading-lg text-primary"></span>
        </div>
      </>
    );
  }

  if (!loading && leaderboardData.length === 0) {
    return (
      <>
        {/* Header like pickem page, no pickemStats here */}
        <LeagueHeader
          me={me}
          league={league || { league: { name: '' }, season: {} }}
          league_id={league_id}
          startTime={startTime}
          endTime={league?.season?.time_end}
          currentUser={currentUser}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          getNavigation={() => []}
          MyNavbar2={MyNavbar2}
          pickemStats={pickemStats}
        />
        <div className="flex items-center min-h-screen flex-col justify-center align-center w-full text-center text-lg font-semibold text-base-content">
          <img src={Image} className="h-28 w-28 mb-10" alt="Thông báo" />
          <p>
            Bảng xếp hạng sẽ hiện khi có kết quả của trận đấu đầu tiên. Các bạn vui lòng quay lại
            sau nhé.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header like pickem page, no pickemStats here */}
      <LeagueHeader
        me={me}
        league={league || { league: { name: '' }, season: {} }}
        league_id={league_id}
        startTime={startTime}
        endTime={league?.season?.time_end}
        currentUser={currentUser}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        getNavigation={() => []}
        MyNavbar2={MyNavbar2}
        pickemStats={pickemStats}
      />
      {/* Link back to play picks (pickem) */}
      <div className="container mx-auto px-4 mt-6 flex justify-end">
        <Link
          to={`/${league_id}/pickem/${
            (typeof window !== 'undefined' && localStorage.getItem('pickem:lastType')) || 'bracket'
          }`}
          className="inline-flex items-center justify-center bg-white text-black border border-black rounded-md px-5 py-2 font-extrabold uppercase tracking-wide hover:bg-gray-100 active:scale-[.98] transition"
        >
          PLAY CRYSTAL BALL
        </Link>
      </div>
      <div className="container mx-auto px-4 py-8 mt-6 mb-2">
        <h2 className="text-3xl font-bold mb-6 text-center text-base-content">
          Bảng xếp hạng Pick'em Challenge
        </h2>
        <div className="container mx-auto flex xl:flex-row xl:gap-2 lg:gap-5 flex-col lg:mb-10">
          <div className="bg-base-100 w-full rounded-lg lg:my-0 my-5">
            {points.length > 0 && (
              <div className="xl:w-[100%] w-[98%] lg:h-[320px] h-[250px] mt-16 mx-auto">
                <Line
                  data={prepareChartData()}
                  options={{ ...chartOptions, maintainAspectRatio: false }}
                />
              </div>
            )}
          </div>
          <TierRewardsTable userScore={userRank ? userRank.score : 0} tierScores={tierScores} />
        </div>
        <div className="overflow-hidden mb-12">
          <table className="w-[98%] mx-auto">
            <tbody className="text-gray-600 text-sm font-light">
              {rankedLeaderboardData.slice(0, 20).map((user, index) => (
                <LeaderboardRow
                  className="last:!border-b-0"
                  key={user._id || `${user.rank}-${index}`}
                  user={user}
                  highlightUser={
                    user.userId === currentUser?._id ||
                    user.rawUsername === currentUser?.username ||
                    user.name === currentUser?.username
                  }
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
                <LeaderboardRow
                  user={userRank}
                  className="first:!border-t-0"
                  isSticky={true}
                  highlightUser={true}
                  tierColor={
                    userRank.score === maxScore
                      ? '#D4AF37'
                      : userRank.score >= tierScores.sTierScore
                      ? '#ff9800'
                      : userRank.score >= tierScores.aTierScore
                      ? '#CC52CE'
                      : userRank.score >= tierScores.bTierScore
                      ? '#00bcd4'
                      : userRank.score >= tierScores.cTierScore
                      ? '#4caf50'
                      : '#6A5ACD'
                  }
                />
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default LeaderboardComponent;
