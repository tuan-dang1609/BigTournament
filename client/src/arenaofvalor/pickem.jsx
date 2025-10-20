import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faX } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import MyNavbar2 from '../components/Navbar2';
import LeagueHeader from '../components/header';
import { useLeagueData } from '../hooks/useLeagueData';
import Modal from 'react-modal';
import PickemBracket from '../components/pickembracket.jsx';
import PickemDoubleBracket from '../components/pickemdouble.jsx';
const PickemChallenge = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [predictions, setPredictions] = useState({});
  const [questions, setQuestions] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [tempSelection, setTempSelection] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); // New search state
  const [detailedResults, setDetailedResults] = useState([]);
  // Map of questionId -> Set of correct team names
  const [correctMap, setCorrectMap] = useState({});
  const [isLocked, setIsLocked] = useState(false);
  const [globalCountdown, setGlobalCountdown] = useState(''); // Countdown cho thời gian khóa toàn cầu
  // Group questions by type so we can render each type as a separate section
  const questionsByType = (questions || []).reduce((acc, q) => {
    const t = q.type || 'other';
    if (!acc[t]) acc[t] = [];
    acc[t].push(q);
    return acc;
  }, {});

  const { game, league_id } = useParams();
  // Nếu route không có :game, mặc định dùng 'aov' (cập nhật nếu cần)
  const effectiveGame = game || 'aov';
  const [selectedGame, setSelectedGame] = useState(effectiveGame);
  // cache questions per game_short so we only fetch once per game
  const [questionsCache, setQuestionsCache] = useState({});
  // cache myanswer response once
  const [myAnswersSource, setMyAnswersSource] = useState(null);
  const { league, startTime, me } = useLeagueData(effectiveGame, league_id, currentUser);
  // Guards to prevent duplicate fetches
  const myAnswersFetchedRef = React.useRef(false);
  const questionsFetchedRef = React.useRef(new Set());
  const questionsInFlightRef = React.useRef(new Set());
  // helper to normalize strings for robust comparison
  const normalize = (s) => (typeof s === 'string' ? s.trim().toLowerCase() : s);
  // lightweight Levenshtein distance for fuzzy matching minor typos
  const levenshtein = (a = '', b = '') => {
    a = normalize(a) || '';
    b = normalize(b) || '';
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp = new Array(n + 1);
    for (let j = 0; j <= n; j++) dp[j] = j;
    for (let i = 1; i <= m; i++) {
      let prev = dp[0];
      dp[0] = i;
      for (let j = 1; j <= n; j++) {
        const temp = dp[j];
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
        prev = temp;
      }
    }
    return dp[n];
  };
  const closeMatch = (x, y, maxDist = 1) => {
    if (!x || !y) return false;
    return levenshtein(x, y) <= maxDist;
  };
  const isLongName = (s) => {
    const v = normalize(s) || '';
    return v.includes(' ') || v.length >= 6;
  };
  // Build a normalized Set of correct answers for a question with aliasing and constrained fuzzy
  const buildCorrectSet = (q) => {
    const list = Array.isArray(q?.correctAnswer) ? q.correctAnswer : [];
    const normalizedList = list.map((s) => normalize(s));
    const base = new Set(normalizedList);
    (q.options || []).forEach((opt) => {
      const n1 = normalize(opt?.name);
      const n2 = normalize(opt?.shortName);
      if ((n1 && base.has(n1)) || (n2 && base.has(n2))) {
        if (n1) base.add(n1);
        if (n2) base.add(n2);
      } else if (
        n1 &&
        isLongName(n1) &&
        normalizedList.some((v) => isLongName(v) && closeMatch(v, n1))
      ) {
        if (n1) base.add(n1);
        if (n2) base.add(n2);
      }
    });
    return base;
  };
  // Resolve a saved pick value (name or shortName) to the concrete option object
  const resolvePickToOption = (question, pick) => {
    const p = normalize(pick);
    return (question?.options || []).find(
      (o) => normalize(o?.name) === p || normalize(o?.shortName) === p
    );
  };
  // Check if an option is selected given the tempSelection array
  const isOptionSelected = (question, option, selections) => {
    const sel = selections || [];
    const id = option?._id;
    const n1 = normalize(option?.name);
    const n2 = normalize(option?.shortName);
    return sel.some((s) => {
      const pickOpt = resolvePickToOption(question, s);
      if (!pickOpt) return false;
      if (id && pickOpt?._id && pickOpt._id === id) return true;
      const pn1 = normalize(pickOpt?.name);
      const pn2 = normalize(pickOpt?.shortName);
      return (pn1 && pn1 === n1) || (pn2 && pn2 === n2);
    });
  };
  // Determine correctness for an option directly using correctMap
  const isOptionCorrect = (questionId, option) => {
    const set = correctMap[String(questionId)];
    if (!set || !(set instanceof Set) || set.size === 0) return 'unknown';
    const nm = normalize(option?.name);
    const sm = normalize(option?.shortName);
    if (nm && set.has(nm)) return 'correct';
    if (sm && set.has(sm)) return 'correct';
    // Only allow fuzzy matching for LONG full names to avoid matching short codes like 'dcn3' ~ 'dcn'
    const arr = Array.from(set);
    if (nm && isLongName(nm)) {
      const fuzzyHit = arr.some((v) => isLongName(v) && closeMatch(v, nm));
      if (fuzzyHit) return 'correct';
    }
    // Never fuzzy-match shortName tokens (e.g., 'DCN3' should not match 'DCN')
    return 'wrong';
  };
  // Global lock time: 22/10 at 2:00 AM (local timezone)
  useEffect(() => {
    const scrollToTop = () => {
      document.documentElement.scrollTop = 0;
      setLoading(true);
    };
    setTimeout(scrollToTop, 0);
    document.title = "Pick'em theo toàn giải";
  }, []);

  // Chuyển navigation thành danh sách các game (slug trong :game)
  const gamesList = [
    { name: 'Liên Quân Mobile', slug: 'aov' },
    { name: 'VALORANT', slug: 'val' },
    { name: 'Teamfight Tactics', slug: 'tft' },
  ];

  const navigationAll1 = {
    games: gamesList.map((g) => ({
      name: g.name,
      // Link chỉ dựa trên league_id (không chứa slug game)
      href: `/${league_id}/pickem`,
      // highlight theo game đang active (selectedGame)
      current: selectedGame === g.slug,
    })),
  };

  // Lấy thông tin giải đấu (league) và thông tin cá nhân của user từ hook dùng chung
  const getNavigation = () => navigationAll1.games;
  const navigation = getNavigation();
  // clickable navigation that navigates to league-scoped pickem with game slug
  const clickableNavigation = gamesList.map((g) => ({
    name: g.name,
    href: `/${league_id}/pickem/${g.slug}`,
    current: selectedGame === g.slug,
    // provide onClick still for debug, but now navigation will change the URL
    onClick: (e) => {
      // allow navigation via Link to handle URL change
    },
  }));

  // Sync selectedGame when route param changes (so /:league_id/pickem/:game works)
  useEffect(() => {
    if (game && game !== selectedGame) setSelectedGame(game);
  }, [game]);
  useEffect(() => {
    const fetchQuestionsAndPredictions = async () => {
      setLoading(true);
      try {
        const leagueId = league_id || 'valorant_test';
        const type = 'all';

        // Fetch myanswer once and cache
        // Ensure we attempt fetch when either `me` (enriched user) or `currentUser` is available
        // Use a local variable `apiAnswers` so we can map answers fetched in this run
        let apiAnswers = myAnswersSource;
        if (!myAnswersSource && !myAnswersFetchedRef.current && (me?._id || currentUser?._id)) {
          try {
            const userIdHeader = me?._id || currentUser._id || 'Beacon';
            const myAnswerResponse = await fetch(
              `http://localhost:3000/api/auth/${leagueId}/myanswer`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'x-user-id': userIdHeader,
                },
              }
            );
            if (myAnswerResponse.status === 404) {
              apiAnswers = [];
              setMyAnswersSource([]);
            } else {
              const predictionResult = await myAnswerResponse.json();
              const sourceAnswers =
                (predictionResult.data && predictionResult.data.answers) ||
                predictionResult.answers ||
                [];
              apiAnswers = sourceAnswers;
              setMyAnswersSource(sourceAnswers);
            }
            myAnswersFetchedRef.current = true;
          } catch (err) {
            apiAnswers = [];
            setMyAnswersSource([]);
          }
        }

        // If we already have questions cached for selectedGame, reuse them
        const game_short = selectedGame || effectiveGame || 'aov';
        if (questionsCache[game_short]) {
          setQuestions(questionsCache[game_short]);
          // Also rebuild correct map from cached questions
          try {
            const qArr = questionsCache[game_short] || [];
            const cmap = {};
            qArr.forEach((q) => {
              cmap[String(q.id)] = buildCorrectSet(q);
            });
            setCorrectMap(cmap);
          } catch (e) {}
        } else if (!questionsFetchedRef.current.has(game_short)) {
          // Prevent duplicate in-flight fetches for the same game_short (React StrictMode can double-invoke effects)
          if (questionsInFlightRef.current.has(game_short)) {
            // Wait briefly until the first in-flight call populates the cache
            let waited = 0;
            while (!questionsFetchedRef.current.has(game_short) && waited < 2000) {
              await new Promise((r) => setTimeout(r, 50));
              waited += 50;
            }
          } else {
            questionsInFlightRef.current.add(game_short);
            const questionResponse = await fetch(
              `http://localhost:3000/api/auth/${game_short}/${leagueId}/question/${type}`
            );
            const questionResult = await questionResponse.json();
            const fetchedQuestions = questionResult.questions || [];
            setQuestionsCache((prev) => ({ ...prev, [game_short]: fetchedQuestions }));
            setQuestions(fetchedQuestions);
            // Build correct answers map from API questions payload
            try {
              const cmap = {};
              fetchedQuestions.forEach((q) => {
                cmap[String(q.id)] = buildCorrectSet(q);
              });
              setCorrectMap(cmap);
            } catch (e) {}
            questionsFetchedRef.current.add(game_short);
            questionsInFlightRef.current.delete(game_short);
          }
        }

        // Map myAnswersSource (cached) to predictions using existing logic
        // prefer answers fetched in this run (apiAnswers) to avoid race with setState
        const sourceAnswers =
          typeof apiAnswers !== 'undefined' ? apiAnswers : myAnswersSource || [];
        const fetchedQuestions = questionsCache[selectedGame] || questions;
        const answers = {};
        for (let i = 0; i < sourceAnswers.length; i++) {
          const curr = sourceAnswers[i];
          const item = curr && curr._doc ? curr._doc : curr;
          const qid =
            item?.questionId ?? item?.question_id ?? item?.qid ?? item?.question?.id ?? item?._id;
          // allow qid === 0 (zero) — only skip if null or undefined
          if (qid === null || typeof qid === 'undefined') continue;
          let vals =
            item.selectedOptions ?? item.selectedTeams ?? item.selected ?? item.answers ?? [];
          if (vals && !Array.isArray(vals) && typeof vals === 'object') vals = Object.values(vals);
          vals = (vals || []).map((s) => (typeof s === 'string' ? s.trim() : s));
          answers[String(qid)] = vals;
        }

        // debug logs removed

        if (Object.keys(answers).length === 0 && sourceAnswers.length > 0) {
          // fallback: match by option names
          const fallback = {};
          const qList = fetchedQuestions || [];
          for (let qi = 0; qi < qList.length; qi++) {
            const q = qList[qi];
            const optNames = (q.options || []).map((o) =>
              (o.name || '').toString().trim().toLowerCase()
            );
            for (let si = 0; si < sourceAnswers.length; si++) {
              const s = sourceAnswers[si];
              const item = s && s._doc ? s._doc : s;
              const vals = (item.selectedOptions || item.selectedTeams || []).map((v) =>
                (v || '').toString().trim().toLowerCase()
              );
              if (vals.length === 0) continue;
              const matchedCount = vals.filter((v) => optNames.includes(v)).length;
              if (matchedCount > 0) {
                fallback[String(q.id)] = (item.selectedOptions || item.selectedTeams || []).map(
                  (v) => (typeof v === 'string' ? v.trim() : v)
                );
                break;
              }
            }
          }
          if (Object.keys(fallback).length > 0) {
            setPredictions(fallback);
          } else {
            setPredictions(answers || {});
          }
        } else {
          setPredictions(answers || {});
        }

        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    // Trigger fetch when currentUser is present or when selectedGame changes
    if (currentUser) {
      fetchQuestionsAndPredictions();
    }
  }, [currentUser, selectedGame, myAnswersSource, me]);

  // Fetch correct answers to enable green/red styling
  const getCorrectness = (questionId, teamName, teamShortName, isSelected = false) => {
    // Backward-compatible helper: only compute when selected
    if (!isSelected) return 'unknown';
    return isOptionCorrect(questionId, { name: teamName, shortName: teamShortName });
  };

  // Single global countdown
  useEffect(() => {
    // Thời gian khóa dựa trên giờ Helsinki cố định
    const dateInHelsinki = new Date('2024-12-28T18:16:00.000+02:00');

    // If the configured global lock date is already in the past, don't lock the UI.
    const now0 = new Date();
    if (isNaN(dateInHelsinki) || dateInHelsinki <= now0) {
      setIsLocked(false);
      setGlobalCountdown('');
      return; // no interval needed
    }

    const interval = setInterval(() => {
      const now = new Date(); // Lấy thời gian hiện tại của người dùng
      const timeDiff = dateInHelsinki - now; // Tính toán sự khác biệt

      // Kiểm tra nếu đã hết thời gian (khóa)
      if (timeDiff <= 0) {
        setIsLocked(true); // Nếu hết thời gian, khóa lựa chọn
        setGlobalCountdown('Đã hết thời gian. Bạn không thể lựa chọn nữa');
      } else {
        setIsLocked(false); // Nếu chưa hết thời gian, không khóa
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
        const seconds = Math.floor((timeDiff / 1000) % 60);
        setGlobalCountdown(
          `Lựa chọn sẽ khóa sau ${days.toString().padStart(2, '0')}:${hours
            .toString()
            .padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
            .toString()
            .padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(interval); // Dọn dẹp interval khi component unmount
  }, []);

  // debug logs removed

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const openModal = (question) => {
    // Do not open modal for single elimination bracket – it's rendered inline
    if (question?.type === 'single_eli_bracket' || question?.type === 'double_eli_bracket') return;
    setCurrentQuestion(question);
    setTempSelection(predictions[String(question?.id)] || []);
    setIsModalOpen(true);
    setSearchQuery(''); // Reset search query when opening the modal
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleTeamSelection = (team) => {
    if (!currentQuestion) return;

    // Only for maxChoose === 1
    if (currentQuestion.maxChoose === 1) {
      // Directly replace the selection with the new team, allowing switch in one click
      setTempSelection((prevSelection) => {
        const chosenKey = team.shortName || team.name;
        return prevSelection[0] === chosenKey ? [] : [chosenKey];
      });
    } else {
      // Original logic for maxChoose > 1
      const selectedTeams = tempSelection || [];
      const isAlready = selectedTeams.includes(team.name) || selectedTeams.includes(team.shortName);
      const newSelectedTeams = isAlready
        ? selectedTeams.filter((t) => t !== team.name && t !== team.shortName)
        : [...selectedTeams, team.shortName || team.name];

      if (newSelectedTeams.length <= currentQuestion.maxChoose) {
        setTempSelection(newSelectedTeams);
      }
    }
  };

  const confirmSelection = async () => {
    if (currentQuestion) {
      setPredictions({ ...predictions, [currentQuestion.id]: tempSelection });
      try {
        const data = {
          userId: me._id,
          answers: [
            {
              questionId: currentQuestion.id,
              selectedOptions: tempSelection,
              openTime: currentQuestion.openTime,
              closeTime: currentQuestion.closeTime,
            },
          ],
        };
        const response = await fetch(
          `http://localhost:3000/api/auth/${league_id}/submitPrediction`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          }
        );

        if (response.ok) {
          // comparepredictions removed: assume backend or another flow updates scores
        } else {
        }
      } catch (error) {}
    }
    closeModal(); // Close modal after submitting
  };
  const getGridColsClass = (maxChoose) => {
    return 'grid-cols-1 lg:grid-cols-3 sm:grid-cols-2'; // Mặc định là 3 cột cho lg nếu không khớp các điều kiện trên
  };
  // Responsive grid helper: if count > 2, use lg:5 cols, else shrink; always 1 col on smallest screens
  const gridClassForCount = (count) => {
    if (count > 2) return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8';
    if (count === 2) return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-8';
    return 'grid grid-cols-1 gap-8';
  };
  // Static tile (outside modal) to mirror modal style
  const StaticOptionTile = ({ option, correctness }) => (
    <div
      className={
        'w-full h-[88px] rounded-xl border flex items-center justify-start px-5 gap-4 shadow-sm ' +
        // Always show blue border for selected tiles in preview
        'border-blue-500 ' +
        (correctness === 'correct'
          ? 'bg-green-900/20'
          : correctness === 'wrong'
          ? 'bg-red-900/20'
          : 'bg-[#151619]')
      }
    >
      {option.img && (
        <img
          src={`https://drive.google.com/thumbnail?id=${option.img}`}
          alt={option.name}
          className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
        />
      )}
      <span className="text-white font-extrabold uppercase tracking-wide text-base sm:text-lg">
        {option.shortName || option.name}
      </span>
    </div>
  );
  // Player-style card content (image top, overlay name, question text, PTS badge)
  const PlayerQuestionCard = ({ question }) => {
    const selectedKeys = predictions[question.id] || [];
    const firstKey = Array.isArray(selectedKeys) ? selectedKeys[0] : undefined;
    const selectedOption = firstKey ? resolvePickToOption(question, firstKey) : null;
    const correctness = selectedOption ? isOptionCorrect(question.id, selectedOption) : 'unknown';
    const hasImg = !!selectedOption?.img;
    return (
      <div className="w-full">
        <div
          className={`relative w-full h-44 rounded-lg overflow-hidden border ${
            selectedOption ? 'border-blue-500' : 'border-gray-700'
          } ${
            selectedOption && correctness === 'correct'
              ? 'bg-green-900/20'
              : selectedOption && correctness === 'wrong'
              ? 'bg-red-900/20'
              : 'bg-[#151619]'
          }`}
        >
          {hasImg ? (
            <img
              src={`https://drive.google.com/thumbnail?id=${selectedOption.img}`}
              alt={selectedOption.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              Bấm để chọn người chơi
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 py-2 text-center">
            <span className="text-white font-extrabold uppercase tracking-wide">
              {selectedOption ? selectedOption.shortName || selectedOption.name : 'Chưa chọn'}
            </span>
          </div>
        </div>

        <p className="text-gray-200 text-center mt-3 leading-snug">{question.question}</p>

        <div className="flex justify-center mt-4">
          <div className="px-4 py-1.5 rounded-md border border-yellow-500 text-yellow-400 font-bold">
            {question.score || 0} PTS
          </div>
        </div>
      </div>
    );
  };
  // Unified card style for dark tiles (match provided screenshot)
  const cardTileClass =
    'mt-6 bg-[#0f0f10] border border-gray-700 rounded-lg p-4 flex flex-col justify-center items-center min-h-[110px] cursor-pointer shadow-sm';
  const getResultIcon = (questionId) => {
    if (!detailedResults) {
      return null; // Nếu detailedResults không tồn tại, trả về null
    }
    const result = detailedResults.find((res) => res.questionId === questionId);
    if (result === null) {
      return; // Trường hợp result là null thì bỏ qua
    }
    if (result && result.totalChoices === 0) {
      return null;
    }

    if (result && result.isTrue) {
      return (
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center bg-green-500 rounded-full p-2 w-8 h-8">
            <FontAwesomeIcon icon={faCheck} color="white" />
          </div>
          <div className="bg-gray-600 rounded-md px-2 py-1">
            <span className="text-white">+{result.pointsForQuestion}</span>
          </div>
        </div>
      );
    } else if (result && result.totalChoices > 0) {
      return (
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center bg-red-500 rounded-full p-2 w-8 h-8">
            <FontAwesomeIcon icon={faX} color="white" />
          </div>
          <div className="bg-gray-600 rounded-md px-2 py-1">
            <span className="text-white">+0</span>
          </div>
        </div>
      );
    }

    return null;
  };

  const filteredOptions =
    currentQuestion?.options?.filter((option) =>
      option?.name?.toLowerCase().includes(searchQuery)
    ) || [];

  if (loading) {
    return (
      <>
        {/* Hiển thị header giải đấu giống homepage */}
        <LeagueHeader
          me={me}
          league={league || { league: { name: '' }, season: {} }}
          league_id={league_id}
          startTime={startTime}
          endTime={league?.season?.time_end}
          currentUser={currentUser}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          getNavigation={() => clickableNavigation}
          MyNavbar2={MyNavbar2}
          game={game}
        />
        <div className="flex justify-center items-center min-h-screen">
          <span className="loading loading-dots loading-lg text-primary"></span>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Hiển thị header giải đấu luôn, giống như trang homepage */}
      <LeagueHeader
        me={me}
        league={league || { league: { name: '' }, season: {} }}
        league_id={league_id}
        startTime={startTime}
        endTime={league?.season?.time_end}
        currentUser={currentUser}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        getNavigation={() => clickableNavigation}
        MyNavbar2={MyNavbar2}
        game={game}
      />

      <div className="min-h-screen mt-40 mb-20 px-4 sm:px-10 lg:px-8">
        {/* Single countdown display */}
        <span className="block text-center text-[20px] text-error font-semibold mt-8 my-5 italic">
          {globalCountdown}
        </span>

        <form className="lg:p-2 p-1">
          <div className="space-y-8">
            {Object.entries(questionsByType).map(([t, qList]) => {
              // Special rendering for single/double elimination brackets: always show inline, no modal
              if (t === 'single_eli_bracket') {
                return (
                  <div key={t} className="space-y-6">
                    <h2 className="text-xl font-bold text-left capitalize">{t}</h2>
                    <div className={gridClassForCount(qList.length)}>
                      {qList.map((question) => (
                        <div
                          key={`${t}-${question.id}`}
                          className="bg-[#0f0f10] border border-gray-700 rounded-lg p-4"
                        >
                          <h3 className="w-full text-left text-[15px] font-semibold mb-4 text-gray-200">
                            {question.question}
                          </h3>
                          {question.bracket_id ? (
                            <PickemBracket
                              bracket_id={question.bracket_id}
                              league_id={league_id}
                              questionId={question.id}
                              userId={me?._id || currentUser?._id}
                              preloadedAnswers={predictions[String(question.id)] || []}
                              correctAnswers={question.correctAnswer || []}
                              options={question.options || []}
                              apiBase={import.meta.env?.VITE_API_BASE || 'http://localhost:3000'}
                            />
                          ) : (
                            <p className="text-gray-400 italic">Thiếu bracket_id</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              } else if (t === 'double_eli_bracket') {
                return (
                  <div key={t} className="space-y-6">
                    <h2 className="text-xl font-bold text-left capitalize">{t}</h2>
                    <div className={gridClassForCount(qList.length)}>
                      {qList.map((question) => (
                        <div
                          key={`${t}-${question.id}`}
                          className="bg-[#0f0f10] border border-gray-700 rounded-lg p-4"
                        >
                          <h3 className="w-full text-left text-[15px] font-semibold mb-4 text-gray-200">
                            {question.question}
                          </h3>
                          <PickemDoubleBracket
                            bracket_id={question.bracket_id}
                            league_id={league_id}
                            questionId={question.id}
                            userId={me?._id || currentUser?._id}
                            preloadedAnswers={predictions[String(question.id)] || []}
                            correctAnswers={question.correctAnswer || []}
                            options={question.options || []}
                            apiBase={import.meta.env?.VITE_API_BASE || 'http://localhost:3000'}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // Default rendering for other types
              return (
                <div key={t} className="space-y-6">
                  <h2 className="text-xl font-bold text-left capitalize">{t}</h2>

                  {/* maxChoose === 1 */}
                  <div className={gridClassForCount(qList.filter((q) => q.maxChoose === 1).length)}>
                    {qList
                      .filter((q) => q.maxChoose === 1)
                      .map((question) => (
                        <div
                          key={`${t}-${question.id}`}
                          className={cardTileClass}
                          onClick={() => {
                            if (!isLocked) openModal(question);
                          }}
                        >
                          {question.type === 'player' ? (
                            <PlayerQuestionCard question={question} />
                          ) : (
                            <>
                              <h3 className="w-full text-left text-[15px] font-semibold mb-2 text-gray-200">
                                {question.question}
                              </h3>
                              <hr className="w-full border-t border-gray-700 my-3" />
                              <div className="w-full">
                                {predictions[question.id]?.length > 0 ? (
                                  <div
                                    className={`grid ${getGridColsClass(
                                      question.maxChoose
                                    )} gap-4 w-full items-center justify-center`}
                                  >
                                    {predictions[question.id].map((team) => {
                                      const selectedTeam = resolvePickToOption(question, team);
                                      return selectedTeam ? (
                                        <StaticOptionTile
                                          key={team}
                                          option={selectedTeam}
                                          correctness={isOptionCorrect(question.id, selectedTeam)}
                                        />
                                      ) : null;
                                    })}
                                  </div>
                                ) : (
                                  <div className="w-full flex items-center justify-center">
                                    <p className="text-gray-400 italic">Ấn vào đây để chọn</p>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                  </div>

                  {/* maxChoose === 2 */}
                  <div className={gridClassForCount(qList.filter((q) => q.maxChoose === 2).length)}>
                    {qList
                      .filter((q) => q.maxChoose === 2)
                      .map((question) => (
                        <div
                          key={`${t}-${question.id}`}
                          className={cardTileClass}
                          onClick={() => {
                            if (!isLocked) {
                              openModal(question);
                            }
                          }}
                        >
                          {question.type === 'player' ? (
                            <PlayerQuestionCard question={question} />
                          ) : (
                            <>
                              <h3 className="w-full text-left text-[15px] font-semibold mb-2 text-gray-200">
                                {question.question}
                              </h3>
                              <hr className="w-full border-t border-gray-700 my-3" />
                              <div className="w-full">
                                {predictions[question.id]?.length > 0 ? (
                                  <div
                                    className={`grid ${getGridColsClass(
                                      question.maxChoose
                                    )} gap-4 w-full items-center justify-center`}
                                  >
                                    {predictions[question.id].map((team) => {
                                      const selectedTeam = resolvePickToOption(question, team);
                                      return selectedTeam ? (
                                        <StaticOptionTile
                                          key={team}
                                          option={selectedTeam}
                                          correctness={isOptionCorrect(question.id, selectedTeam)}
                                        />
                                      ) : null;
                                    })}
                                  </div>
                                ) : (
                                  <div className="w-full flex items-center justify-center">
                                    <p className="text-gray-400 italic">Ấn vào đây để chọn</p>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                  </div>

                  {/* maxChoose > 2 */}
                  <div className={gridClassForCount(qList.filter((q) => q.maxChoose > 2).length)}>
                    {qList
                      .filter((q) => q.maxChoose > 2)
                      .map((question) => (
                        <div
                          key={`${t}-${question.id}`}
                          className={cardTileClass}
                          onClick={() => {
                            if (!isLocked) {
                              openModal(question);
                            }
                          }}
                        >
                          {question.type === 'player' ? (
                            <PlayerQuestionCard question={question} />
                          ) : (
                            <>
                              <h3 className="w-full text-left text-[15px] font-semibold mb-2 text-gray-200">
                                {question.question}
                              </h3>
                              <hr className="w-full border-t border-gray-700 my-3" />
                              <div className="w-full">
                                {predictions[question.id]?.length > 0 ? (
                                  <div
                                    className={`grid ${getGridColsClass(
                                      question.maxChoose
                                    )} gap-4 w-full items-center justify-center`}
                                  >
                                    {predictions[question.id].map((team) => {
                                      const selectedTeam = resolvePickToOption(question, team);
                                      return selectedTeam ? (
                                        <StaticOptionTile
                                          key={team}
                                          option={selectedTeam}
                                          correctness={isOptionCorrect(question.id, selectedTeam)}
                                        />
                                      ) : null;
                                    })}
                                  </div>
                                ) : (
                                  <div className="w-full flex items-center justify-center">
                                    <p className="text-gray-400 italic">Ấn vào đây để chọn</p>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </form>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Select Teams"
        className="bg-[#0f0f10] text-white border border-gray-700 lg:p-8 p-3 rounded-lg shadow-xl max-w-7xl xl:mx-auto mx-2 mt-14 z-[10000] relative lg:mt-10"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-[9999]"
        ariaHideApp={false}
        shouldCloseOnOverlayClick={true} // Cho phép đóng khi nhấp vào vùng ngoài
      >
        <h2 className="text-lg font-semibold mb-4">{currentQuestion?.question}</h2>

        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Tìm đội hoặc người chơi"
          className="mb-4 p-2 w-full border bg-[#1c1c1e] text-white placeholder-gray-400 border-gray-700 rounded-lg"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto max-h-[300px] lg:max-h-[380px] p-2">
          {currentQuestion?.type === 'single_eli_bracket' && currentQuestion?.bracket_id ? (
            <div className="col-span-2 sm:col-span-3 lg:col-span-4">
              <PickemBracket
                bracket_id={currentQuestion.bracket_id}
                league_id={league_id}
                questionId={currentQuestion.id}
                userId={me?._id || currentUser?._id}
                apiBase={import.meta.env?.VITE_API_BASE || 'http://localhost:3000'}
              />
            </div>
          ) : (
            filteredOptions?.map((option) => {
              const selected = isOptionSelected(currentQuestion, option, tempSelection);
              const correctness = selected
                ? isOptionCorrect(currentQuestion?.id, option)
                : 'unknown';
              const disabled =
                currentQuestion.maxChoose > 1 &&
                tempSelection.length >= currentQuestion.maxChoose &&
                !selected;
              return (
                <motion.button
                  key={option.name}
                  type="button"
                  onClick={() => handleTeamSelection(option)}
                  className={`w-full h-[88px] rounded-xl border transition-colors duration-150 flex items-center justify-start px-5 gap-4 shadow-sm
                  ${
                    selected
                      ? 'border-blue-500 ring-2 ring-blue-400/40 bg-[#1a1b1e]'
                      : 'border-gray-700 bg-[#151619] hover:bg-[#1b1c20] hover:border-blue-400/60'
                  }
                  ${selected && correctness === 'correct' ? ' bg-green-900/20' : ''}
                  ${selected && correctness === 'wrong' ? ' bg-red-900/20' : ''}
                  ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
                  whileHover={{ scale: disabled ? 1 : 1.02 }}
                  whileTap={{ scale: disabled ? 1 : 0.98 }}
                  disabled={disabled}
                >
                  {option.img && (
                    <img
                      src={`https://drive.google.com/thumbnail?id=${option.img}`}
                      alt={option.name}
                      className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
                    />
                  )}
                  <span className="text-white font-extrabold uppercase tracking-wide text-base sm:text-lg">
                    {option.shortName || option.name}
                  </span>
                </motion.button>
              );
            })
          )}
        </div>

        {tempSelection.length === currentQuestion?.maxChoose && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={confirmSelection}
              className="bg-accent text-white px-4 py-3 rounded-lg"
            >
              Xác nhận & Gửi
            </button>
          </div>
        )}
      </Modal>
    </>
  );
};

export default PickemChallenge;
