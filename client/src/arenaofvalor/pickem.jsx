import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  // Total scoreboard
  const [totalScore, setTotalScore] = useState(0);
  const [maxPoints, setMaxPoints] = useState(0);
  // Map of questionId -> Set of correct team names
  const [correctMap, setCorrectMap] = useState({});
  const [isLocked, setIsLocked] = useState(false);
  const [globalCountdown, setGlobalCountdown] = useState(''); // Countdown cho thời gian khóa toàn cầu
  // Header stats for Pick'em header (score + top%)
  const [pickemStats, setPickemStats] = useState(null);
  // Global tick for per-question timers
  const [nowTs, setNowTs] = useState(Date.now());
  // Group questions by type so we can render each type as a separate section
  const questionsByType = (questions || []).reduce((acc, q) => {
    const t = q.type || 'other';
    if (!acc[t]) acc[t] = [];
    acc[t].push(q);
    return acc;
  }, {});

  const { type, league_id, userId: viewUserId } = useParams();
  const viewerMode = !!viewUserId; // if viewing someone else's picks
  // Chế độ mới: chỉ có 2 tab type: 'bracket' và 'event'
  const effectiveType = type || 'bracket';
  const [selectedType, setSelectedType] = useState(effectiveType);
  // cache questions per game_short so we only fetch once per game
  const [questionsCache, setQuestionsCache] = useState({});
  // cache myanswer response once
  const [myAnswersSource, setMyAnswersSource] = useState(null);
  // Suy đoán game từ league_id để phục vụ header/hook (nếu không có tham số game trong route)
  const inferGameFromLeagueId = (lid) => {
    const s = (lid || '').toLowerCase();
    if (s.includes('val')) return 'val';

    if (s.includes('lol')) return 'lol';
    return 'aov';
  };
  const effectiveGame = inferGameFromLeagueId(league_id);
  const { league, startTime, me } = useLeagueData(effectiveGame, league_id, currentUser);
  // Guards to prevent duplicate fetches
  const myAnswersFetchedRef = React.useRef(false);
  const initDoneRef = React.useRef(false);
  const leaderboardFetchedRef = React.useRef(false);
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

  // Chỉ còn 2 tab: bracket và event
  const categoriesList = [
    { name: 'Bracket', slug: 'bracket' },
    { name: 'Event', slug: 'event' },
  ];

  // Time helper utilities
  const parseIso = (s) => {
    try {
      return s ? new Date(s) : null;
    } catch {
      return null;
    }
  };
  const isBeforeOpen = (q) => {
    const ot = parseIso(q?.openTime);
    if (!ot) return false;
    return nowTs < ot.getTime();
  };
  const isAfterClose = (q) => {
    const ct = parseIso(q?.closeTime);
    if (!ct) return false;
    return nowTs >= ct.getTime();
  };
  const formatCountdown = (ms) => {
    if (ms <= 0) return '00:00:00:00';
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const seconds = Math.floor((ms / 1000) % 60);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };
  const formatLocalTime = (iso) => {
    const d = parseIso(iso);
    if (!d) return '';
    return d.toLocaleString(undefined, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };
  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const navigationAll1 = {
    games: categoriesList.map((g) => ({
      name: g.name,
      // Use viewer-mode links when viewing another user's picks
      href: viewerMode
        ? `/${league_id}/pickem/view/${encodeURIComponent(viewUserId)}/${g.slug}`
        : `/${league_id}/pickem/${g.slug}`,
      // highlight theo type đang active
      current: selectedType === g.slug,
    })),
  };

  // Lấy thông tin giải đấu (league) và thông tin cá nhân của user từ hook dùng chung
  const getNavigation = () => navigationAll1.games;
  const navigation = getNavigation();
  // clickable navigation that navigates to league-scoped pickem with game slug
  const clickableNavigation = categoriesList.map((g) => ({
    name: g.name,
    href: viewerMode
      ? `/${league_id}/pickem/view/${encodeURIComponent(viewUserId)}/${g.slug}`
      : `/${league_id}/pickem/${g.slug}`,
    current: selectedType === g.slug,
    // provide onClick still for debug, but now navigation will change the URL
    onClick: (e) => {
      // Prevent route navigation to avoid re-mount and re-fetch; switch in place
      try {
        e?.preventDefault?.();
      } catch {}
      setSelectedType(g.slug);
      // Update URL without navigating (no re-mount)
      const newUrl = viewerMode
        ? `/${league_id}/pickem/view/${encodeURIComponent(viewUserId)}/${g.slug}`
        : `/${league_id}/pickem/${g.slug}`;
      if (typeof window !== 'undefined' && window.location?.pathname !== newUrl) {
        window.history.pushState({}, '', newUrl);
      }
    },
  }));

  // Sync selectedType when route param changes (so /:league_id/pickem/:type works)
  useEffect(() => {
    if (type && type !== selectedType) setSelectedType(type);
  }, [type]);
  // If in viewer mode without :type segment, normalize URL to include default 'bracket'
  useEffect(() => {
    if (viewerMode && !type && league_id && viewUserId) {
      const targetType = selectedType || 'bracket';
      const newUrl = `/${league_id}/pickem/view/${encodeURIComponent(viewUserId)}/${targetType}`;
      if (typeof window !== 'undefined' && window.location?.pathname !== newUrl) {
        window.history.replaceState({}, '', newUrl);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerMode, type, league_id, viewUserId]);
  // Persist last selected game for returning from leaderboard
  useEffect(() => {
    try {
      if (selectedType && typeof window !== 'undefined') {
        localStorage.setItem('pickem:lastType', selectedType);
      }
    } catch {}
  }, [selectedType]);
  useEffect(() => {
    // Prefetch all questions and answers once on page load; if viewerMode, fetch target user's answers
    const init = async () => {
      setLoading(true);
      try {
        const leagueId = league_id || 'valorant_test';
        const qType = 'all';
        const API_BASE =
          import.meta.env?.VITE_API_BASE || 'https://bigtournament-hq9n.onrender.com';

        // 1) Fetch answers once (mine or target user's)
        let apiAnswers = myAnswersSource;
        let apiTotalLocal = null;
        if (!myAnswersSource && !myAnswersFetchedRef.current) {
          try {
            let myAnswerResponse;
            if (viewerMode && viewUserId) {
              myAnswerResponse = await fetch(
                `${API_BASE}/api/auth/${leagueId}/pickem/${encodeURIComponent(
                  viewUserId
                )}?includeMeta=true`
              );
            } else {
              const userIdHeader = me?._id || currentUser?._id || 'Beacon';
              myAnswerResponse = await fetch(`${API_BASE}/api/auth/${leagueId}/myanswer`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'x-user-id': userIdHeader,
                },
              });
            }
            if (myAnswerResponse.status === 404) {
              apiAnswers = [];
              setMyAnswersSource([]);
            } else {
              const predictionResult = await myAnswerResponse.json();
              const sourceAnswers =
                (predictionResult.data && predictionResult.data.answers) ||
                predictionResult.answers ||
                [];
              const apiTotal =
                (predictionResult.data && predictionResult.data.totalScore) ||
                predictionResult.totalScore ||
                0;
              apiAnswers = sourceAnswers;
              setMyAnswersSource(sourceAnswers);
              apiTotalLocal = Number(apiTotal) || 0;
              setTotalScore(apiTotalLocal);
            }
            myAnswersFetchedRef.current = true;
          } catch (err) {
            apiAnswers = [];
            setMyAnswersSource([]);
          }
        }

        // 2) Prefetch questions for ALL games upfront (fixed list)
        const gameSlugs = ['aov', 'val'];
        const fetches = gameSlugs.map(async (slug) => {
          const r = await fetch(`${API_BASE}/api/auth/${slug}/${leagueId}/question/${qType}`);
          const j = await r.json();
          return { slug, result: j };
        });
        const results = await Promise.all(fetches);
        // Build cache and determine league-wide total; also combine all questions
        const nextCache = {};
        let leagueTotalFromApi = null;
        let combinedForFallback = [];
        let allQuestions = [];
        results.forEach(({ slug, result }) => {
          const qArr = Array.isArray(result?.questions) ? result.questions : [];
          const qArrWithSlug = qArr.map((q) => ({ ...q, _gameSlug: slug }));
          nextCache[slug] = qArrWithSlug;
          combinedForFallback = combinedForFallback.concat(qArrWithSlug);
          allQuestions = allQuestions.concat(qArrWithSlug);
          if (typeof result?.totalPointAll === 'number' && result.totalPointAll >= 0) {
            leagueTotalFromApi = result.totalPointAll;
          }
        });
        setQuestionsCache(nextCache);

        // Set questions to combined list (across all games); filtering by type is done in render
        const initialQuestions = allQuestions;
        setQuestions(initialQuestions);
        // Build correct map for initially displayed questions
        const cmap = {};
        initialQuestions.forEach((q) => {
          cmap[String(q.id)] = buildCorrectSet(q);
        });
        setCorrectMap(cmap);

        // Use league-wide total from API; fallback to combined sum across all slugs
        const fallbackTotal = combinedForFallback.reduce(
          (acc, q) => acc + (q?.score || 0) * (q?.maxChoose || 1),
          0
        );
        setMaxPoints(typeof leagueTotalFromApi === 'number' ? leagueTotalFromApi : fallbackTotal);

        // 3) Map my answers into predictions once
        const sourceAnswers =
          typeof apiAnswers !== 'undefined' ? apiAnswers : myAnswersSource || [];
        const answers = {};
        for (let i = 0; i < sourceAnswers.length; i++) {
          const curr = sourceAnswers[i];
          const item = curr && curr._doc ? curr._doc : curr;
          const qid =
            item?.questionId ?? item?.question_id ?? item?.qid ?? item?.question?.id ?? item?._id;
          if (qid === null || typeof qid === 'undefined') continue;
          let vals =
            item.selectedOptions ?? item.selectedTeams ?? item.selected ?? item.answers ?? [];
          if (vals && !Array.isArray(vals) && typeof vals === 'object') vals = Object.values(vals);
          vals = (vals || []).map((s) => (typeof s === 'string' ? s.trim() : s));
          answers[String(qid)] = vals;
        }
        if (Object.keys(answers).length === 0 && sourceAnswers.length > 0) {
          // fallback: match by option names in the initially displayed set
          const fallback = {};
          const qList = initialQuestions || [];
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
          if (Object.keys(fallback).length > 0) setPredictions(fallback);
          else setPredictions(answers || {});
        } else {
          setPredictions(answers || {});
        }

        // 4) Fetch leaderboard ONCE and compute rank (+ optional Top %)
        if (viewerMode && viewUserId && !leaderboardFetchedRef.current) {
          // Viewer mode: compute the viewed user's rank/score/name
          leaderboardFetchedRef.current = true;
          try {
            const lbResp = await fetch(`${API_BASE}/api/auth/pickem/${leagueId}/leaderboard`);
            const lbJson = await lbResp.json();
            const arr = Array.isArray(lbJson?.leaderboard) ? lbJson.leaderboard : [];
            const total = arr.length || 1;
            const idx = arr.findIndex((e) => String(e.userId) === String(viewUserId));
            if (idx >= 0) {
              const entry = arr[idx] || {};
              const rank = idx + 1;
              const topPercent = Math.ceil((rank / total) * 100);
              const score = Number(entry.Score ?? entry.score ?? 0);
              const userName = entry.nickname || entry.username || entry.name || '';
              setPickemStats({ score, rank, topPercent, userName });
            } else {
              // Not found on leaderboard; fall back to any known totalScore and generic Top 100%
              setPickemStats({
                score: Number((apiTotalLocal ?? totalScore) || 0),
                rank: undefined,
                topPercent: 100,
                userName: String(viewUserId),
              });
            }
          } catch (e) {
            setPickemStats({
              score: Number((apiTotalLocal ?? totalScore) || 0),
              rank: undefined,
              topPercent: 100,
              userName: String(viewUserId),
            });
          }
        } else if (!viewerMode && !leaderboardFetchedRef.current) {
          leaderboardFetchedRef.current = true;
          try {
            const lbResp = await fetch(`${API_BASE}/api/auth/pickem/${leagueId}/leaderboard`);
            const lbJson = await lbResp.json();
            const arr = Array.isArray(lbJson?.leaderboard) ? lbJson.leaderboard : [];
            const total = arr.length || 1;
            const myId = String(me?._id || currentUser?._id || '');
            const rankIndex = arr.findIndex((e) => String(e.userId) === myId);
            const rank = rankIndex >= 0 ? rankIndex + 1 : total; // if not found, worst rank
            const topPercent = Math.ceil((rank / total) * 100);
            setPickemStats({ score: Number((apiTotalLocal ?? totalScore) || 0), rank, topPercent });
          } catch (e) {
            // Fallback: still show score, default Top 100%
            setPickemStats({
              score: Number((apiTotalLocal ?? totalScore) || 0),
              rank: undefined,
              topPercent: 100,
            });
          }
        } else if (!viewerMode) {
          // If leaderboard already fetched, still ensure score sync
          setPickemStats((prev) => ({
            ...(prev || {}),
            score: Number((apiTotalLocal ?? totalScore) || 0),
          }));
        }

        setLoading(false);
      } catch (e) {
        setLoading(false);
      }
    };
    if (!viewerMode && !currentUser) return;
    if (initDoneRef.current) return; // run once per page load
    initDoneRef.current = true;
    init();
  }, [currentUser, viewerMode, viewUserId]);

  // When switching tabs, only swap questions from cache; don't re-fetch
  useEffect(() => {
    const cached = questionsCache[selectedType];
    if (cached) {
      setQuestions(cached);
      const cmap = {};
      (cached || []).forEach((q) => {
        cmap[String(q.id)] = buildCorrectSet(q);
      });
      setCorrectMap(cmap);
    }
  }, [selectedType, questionsCache]);

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

  const canInteract = (question) => {
    if (viewerMode) return false;
    if (isLocked) return false;
    if (isBeforeOpen(question)) return false;
    if (isAfterClose(question)) return false; // non-viewer shouldn't interact after close
    return true;
  };

  const openModal = (question) => {
    // Do not open modal for single elimination bracket – it's rendered inline
    if (viewerMode) return; // viewer cannot edit
    if (question?.type === 'single_eli_bracket' || question?.type === 'double_eli_bracket') return;
    if (!canInteract(question)) return;
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
    if (viewerMode) {
      closeModal();
      return;
    }
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
          `https://bigtournament-hq9n.onrender.com/api/auth/${league_id}/submitPrediction`,
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
    if (count > 2)
      return ' grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8';
    if (count === 2) return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-8';
    return 'grid grid-cols-1 gap-8';
  };
  // Static tile (outside modal) to mirror modal style
  const StaticOptionTile = ({ option, correctness }) => (
    <div
      className={
        'w-full h-[88px] rounded-xl border flex items-center justify-start px-5 gap-4 shadow-sm ' +
        // Always show blue border for selected tiles in preview
        'border-gray-700 ' +
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
    const isChamp = question?.type === 'lol_champ';
    const hasImg = isChamp ? !!selectedOption : !!selectedOption?.img;
    const champKey = selectedOption?.img || selectedOption?.name;
    const imageSrc = isChamp
      ? `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${encodeURIComponent(
          champKey || ''
        )}_0.jpg`
      : selectedOption?.img
      ? `https://drive.google.com/thumbnail?id=${selectedOption.img}`
      : '';
    return (
      <div className="w-full">
        <div
          className={`relative  h-44  rounded-lg overflow-hidden border ${
            selectedOption ? 'border-gray-700' : 'border-gray-700'
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
              src={imageSrc}
              alt={selectedOption?.name}
              className="absolute inset-0 w-full h-44  object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              {isChamp ? 'Bấm để chọn tướng' : 'Bấm để chọn người chơi'}
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
  // Unified card styles: event tiles keep fixed width; bracket tiles should stretch (no fixed width)
  const cardTileClassEvent =
    'mt-6 bg-[#0f0f10] mx-auto border border-gray-700 rounded-lg p-4 flex flex-col justify-center items-center min-h-[110px] w-[256px] cursor-pointer shadow-sm relative';
  const cardTileClassBracket =
    'mt-6 bg-[#0f0f10] border border-gray-700 rounded-lg p-4 flex flex-col justify-center items-center min-h-[110px] w-full cursor-pointer shadow-sm relative';

  const filteredOptions =
    currentQuestion?.options?.filter((option) =>
      option?.name?.toLowerCase().includes(searchQuery)
    ) || [];

  // Progress: answered/total across all questions (personal only)
  const allQuestionsList = React.useMemo(() => {
    const values = Object.values(questionsCache || {});
    if (values.length > 0) return values.flat();
    return questions || [];
  }, [questionsCache, questions]);
  // Progress based on total required choices (sum of maxChoose) vs. chosen count (sum of picks, capped by maxChoose) — personal only
  const progressData = React.useMemo(() => {
    let totalQuestions = 0;
    let completedQuestions = 0;
    const details = [];
    if (Array.isArray(allQuestionsList)) {
      totalQuestions = allQuestionsList.length;
      for (const q of allQuestionsList) {
        const type = q?.type;
        const picks = predictions[String(q?.id)];
        const optionsCount = Array.isArray(q?.options) ? q.options.length : 0;

        let required = 0;
        let chosen = 0;
        if (type === 'single_eli_bracket' || type === 'double_eli_bracket') {
          // Infer teams if options only list downstream slots
          let nTeams = optionsCount;
          if (
            (q?.bracket_id && optionsCount && optionsCount <= 4) ||
            (!optionsCount && q?.bracket_id)
          ) {
            nTeams = Math.max(2, optionsCount * 2 || 8);
          }
          if (type === 'single_eli_bracket') {
            required = Math.max(0, nTeams - 1);
            const relevant = new Set(['QF', 'SF', '1ST']);
            const uniq = Array.isArray(picks) ? Array.from(new Set(picks)) : [];
            chosen = uniq.reduce((acc, token) => {
              if (typeof token !== 'string') return acc;
              const i = token.indexOf(':');
              if (i === -1) return acc;
              const pre = token.slice(0, i).trim();
              return relevant.has(pre) ? acc + 1 : acc;
            }, 0);
          } else {
            // Business rule: cap required picks for double-elimination at 8 (e.g., 8-team bracket -> 14 events but only need 8 picks to mark complete)
            required = Math.min(8, Math.max(0, 2 * nTeams - 2));
            const relevant = new Set([
              'QF',
              'SF',
              'UF',
              'LS1',
              'LS2',
              'FOURTH',
              'THIRD',
              'SECOND',
              'FIRST',
              'P7_8',
              'P5_6',
              'P4',
              'P3',
              'P2',
              'P1',
            ]);
            const uniq = Array.isArray(picks) ? Array.from(new Set(picks)) : [];
            chosen = uniq.reduce((acc, token) => {
              if (typeof token !== 'string') return acc;
              const i = token.indexOf(':');
              if (i === -1) return acc;
              const pre = token.slice(0, i).trim();
              return relevant.has(pre) ? acc + 1 : acc;
            }, 0);
          }
        } else {
          const max = Number(q?.maxChoose) > 0 ? Number(q?.maxChoose) : 1;
          required = max;
          chosen = Array.isArray(picks) ? picks.length : 0;
        }

        const complete = required > 0 ? chosen >= required : false;
        if (complete) completedQuestions += 1;
        details.push({
          id: q?.id,
          type,
          optionsCount,
          required,
          chosen,
          complete,
          picks: Array.isArray(picks) ? picks : [],
        });
      }
    }
    return { totalQuestions, completedQuestions, details };
  }, [allQuestionsList, predictions]);
  const totalCount = progressData.totalQuestions;
  const answeredCount = progressData.completedQuestions;

  // Debug logs removed per request

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
          game={effectiveGame}
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
        game={effectiveGame}
        pickemStats={pickemStats}
      />
      <div className="xl:w-[1408px] w-full mx-auto">
        {/* Link to leaderboard page */}
        <div className="px-4 lg:px-8 mt-6 flex justify-end">
          <Link
            to={`/${league_id}/pickem/leaderboard`}
            className="inline-flex items-center justify-center bg-white text-black border border-black rounded-md px-5 py-2 font-extrabold uppercase tracking-wide hover:bg-gray-100 active:scale-[.98] transition"
          >
            Xem BXH
          </Link>
        </div>
        {/* Personal progress bar (hidden in viewer mode) - sticky at bottom */}
        {!viewerMode && (
          <div className="fixed bottom-0 left-0 right-0 z-40">
            {/* Full-width progress track not affected by container paddings */}
            <div className="h-1.5 w-full bg-[#1f2937]">
              <div
                className="h-full bg-[#12d6d6] transition-[width] duration-500"
                style={{
                  width: `${totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0}%`,
                }}
                aria-hidden="true"
              />
            </div>
            {/* Label bar aligned to content container, independent of the progress width */}
            <div className="mx-auto xl:w-[1408px] px-4 lg:px-8">
              <div className="w-full bg-[#0d0f12] text-[#12d6d6] px-4 py-4 flex items-center gap-2 rounded-t shadow-[0_-2px_6px_rgba(0,0,0,0.4)] border-t border-gray-800">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                </svg>
                <span className="font-bold tracking-wide">
                  HOÀN THÀNH {answeredCount}/{totalCount}
                </span>
              </div>
            </div>
          </div>
        )}
        <div className="min-h-screen mt-10 mb-20 px-4 lg:px-8">
          {/* Single countdown display */}
          <span className="block text-center text-[20px] text-error font-semibold mt-8 my-5 italic">
            {globalCountdown}
          </span>

          {/* Total Score pill */}
          <div className="w-full flex items-center justify-start mb-6">
            <div className="inline-flex items-baseline gap-2 rounded-3xl border border-gray-700 px-4 py-2">
              <span className="text-yellow-400 font-extrabold tracking-wider">TOTAL:</span>
              <span className="text-white text-xl font-extrabold">{totalScore || 0}</span>
              <span className="text-gray-400">/ {maxPoints || 0} pts</span>
            </div>
          </div>

          <form className="lg:p-2 p-1">
            <div className="space-y-10">
              {['aov', 'val'].map((slug) => {
                const GAME_NAMES = {
                  aov: 'Liên Quân Mobile',
                  val: 'VALORANT',
                };
                const BRACKET_TYPES = new Set([
                  'single_eli_bracket',
                  'double_eli_bracket',
                  'swiss_stage',
                  'swiss_bracket',
                ]);
                const qsForGame = (questions || []).filter((q) => q?._gameSlug === slug);
                if (!qsForGame || qsForGame.length === 0) return null;
                const byType = qsForGame.reduce((acc, q) => {
                  const isBracket = BRACKET_TYPES.has(q?.type);
                  const match = selectedType === 'bracket' ? isBracket : !isBracket;
                  if (!match) return acc;
                  const key = q?.type || 'other';
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(q);
                  return acc;
                }, {});
                const entries = Object.entries(byType);
                if (entries.length === 0) return null;
                return (
                  <div key={slug} className="space-y-6">
                    <h2 className="text-2xl font-bold text-left">{GAME_NAMES[slug] || slug}</h2>
                    {entries.map(([t, qList]) => {
                      if (t === 'single_eli_bracket') {
                        return (
                          <div key={`${slug}-${t}`} className="space-y-4">
                            <h3 className="text-xl font-semibold text-left capitalize">{t}</h3>
                            <div className="grid grid-cols-1 gap-8">
                              {qList.map((question) => (
                                <div
                                  key={`${t}-${question.id}`}
                                  className="bg-[#0f0f10] border border-gray-700 rounded-lg p-4"
                                >
                                  <h4 className="w-full text-left text-[15px] font-semibold mb-4 text-gray-200">
                                    {question.question}
                                  </h4>
                                  {question.bracket_id ? (
                                    <div className="relative">
                                      <div
                                        className={
                                          isBeforeOpen(question)
                                            ? 'blur-sm pointer-events-none'
                                            : ''
                                        }
                                      >
                                        <PickemBracket
                                          bracket_id={question.bracket_id}
                                          league_id={league_id}
                                          questionId={question.id}
                                          userId={me?._id || currentUser?._id}
                                          onDraftChange={(qid, selected) =>
                                            setPredictions((prev) => ({ ...prev, [qid]: selected }))
                                          }
                                          preloadedAnswers={predictions[String(question.id)] || []}
                                          correctAnswers={question.correctAnswer || []}
                                          options={question.options || []}
                                          apiBase={
                                            import.meta.env?.VITE_API_BASE ||
                                            'https://bigtournament-hq9n.onrender.com'
                                          }
                                          readOnly={
                                            viewerMode ||
                                            isLocked ||
                                            (!viewerMode && isAfterClose(question))
                                          }
                                        />
                                      </div>
                                      {isBeforeOpen(question) && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="bg-black/60 text-white rounded px-3 py-2 text-center">
                                            <div>
                                              Sẽ mở vào lúc {formatLocalTime(question.openTime)}
                                            </div>
                                            <div className="text-sm opacity-80">
                                              Còn:{' '}
                                              {formatCountdown(
                                                new Date(question.openTime).getTime() - nowTs
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      {!viewerMode && isAfterClose(question) && (
                                        <div className="absolute inset-0 pointer-events-none flex items-start justify-end">
                                          <div className="m-2 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded">
                                            ĐÃ ĐÓNG
                                          </div>
                                        </div>
                                      )}
                                    </div>
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
                          <div key={`${slug}-${t}`} className="space-y-4">
                            <h3 className="text-xl font-semibold text-left capitalize">{t}</h3>
                            <div className="grid grid-cols-1 gap-8">
                              {qList.map((question) => (
                                <div
                                  key={`${t}-${question.id}`}
                                  className="bg-[#0f0f10] border border-gray-700 rounded-lg p-4"
                                >
                                  <h4 className="w-full text-left text-[15px] font-semibold mb-4 text-gray-200">
                                    {question.question}
                                  </h4>
                                  <div className="relative">
                                    <div
                                      className={
                                        isBeforeOpen(question) ? 'blur-md pointer-events-none' : ''
                                      }
                                    >
                                      <PickemDoubleBracket
                                        bracket_id={question.bracket_id}
                                        league_id={league_id}
                                        questionId={question.id}
                                        userId={me?._id || currentUser?._id}
                                        onDraftChange={(qid, selected) =>
                                          setPredictions((prev) => ({ ...prev, [qid]: selected }))
                                        }
                                        preloadedAnswers={predictions[String(question.id)] || []}
                                        correctAnswers={question.correctAnswer || []}
                                        options={question.options || []}
                                        apiBase={
                                          import.meta.env?.VITE_API_BASE ||
                                          'https://bigtournament-hq9n.onrender.com'
                                        }
                                        readOnly={
                                          viewerMode ||
                                          isLocked ||
                                          (!viewerMode && isAfterClose(question))
                                        }
                                        viewUserId={viewerMode ? viewUserId : null}
                                      />
                                    </div>
                                    {isBeforeOpen(question) && (
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-black/60 text-white rounded px-3 py-2 text-center">
                                          <div>
                                            Sẽ mở vào lúc {formatLocalTime(question.openTime)}
                                          </div>
                                          <div className="text-sm opacity-80">
                                            Còn:{' '}
                                            {formatCountdown(
                                              new Date(question.openTime).getTime() - nowTs
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {!viewerMode && isAfterClose(question) && (
                                      <div className="absolute inset-0 pointer-events-none flex items-start justify-end">
                                        <div className="m-2 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded">
                                          ĐÃ ĐÓNG
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      // default/event-like rendering (also one-column if selectedType === 'bracket')
                      return (
                        <div key={`${slug}-${t}`} className="space-y-4">
                          <h3 className="text-xl font-semibold text-left capitalize">{t}</h3>
                          {/* maxChoose === 1 */}
                          <div
                            className={
                              selectedType === 'bracket'
                                ? 'grid grid-cols-1 gap-8'
                                : gridClassForCount(qList.filter((q) => q.maxChoose === 1).length)
                            }
                          >
                            {qList
                              .filter((q) => q.maxChoose === 1)
                              .map((question) => (
                                <div
                                  key={`${t}-${question.id}`}
                                  className={
                                    selectedType === 'bracket'
                                      ? cardTileClassBracket
                                      : cardTileClassEvent
                                  }
                                  onClick={() => {
                                    if (canInteract(question)) openModal(question);
                                  }}
                                >
                                  <div
                                    className={
                                      isBeforeOpen(question)
                                        ? 'blur-sm pointer-events-none w-full'
                                        : 'w-full'
                                    }
                                  >
                                    {question.type === 'player' ||
                                    question.type === 'lol_champ' ||
                                    question.type === 'team' ? (
                                      <PlayerQuestionCard question={question} />
                                    ) : (
                                      <>
                                        <h4 className="w-full text-left text-[15px] font-semibold mb-2 text-gray-200">
                                          {question.question}
                                        </h4>
                                        <hr className="w-full border-t border-gray-700 my-3" />
                                        <div className="w-full">
                                          {predictions[question.id]?.length > 0 ? (
                                            <div
                                              className={`grid ${getGridColsClass(
                                                question.maxChoose
                                              )} gap-4 w-full items-center justify-center`}
                                            >
                                              {predictions[question.id].map((team) => {
                                                const selectedTeam = resolvePickToOption(
                                                  question,
                                                  team
                                                );
                                                return selectedTeam ? (
                                                  <StaticOptionTile
                                                    key={team}
                                                    option={selectedTeam}
                                                    correctness={isOptionCorrect(
                                                      question.id,
                                                      selectedTeam
                                                    )}
                                                  />
                                                ) : null;
                                              })}
                                            </div>
                                          ) : (
                                            <div className="w-full flex items-center justify-center">
                                              <p className="text-gray-400 italic">
                                                Ấn vào đây để chọn
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  {isBeforeOpen(question) && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="bg-black/60 text-white rounded px-3 py-2 text-center">
                                        <div>
                                          Sẽ mở vào lúc {formatLocalTime(question.openTime)}
                                        </div>
                                        <div className="text-sm opacity-80">
                                          Còn:{' '}
                                          {formatCountdown(
                                            new Date(question.openTime).getTime() - nowTs
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {!viewerMode && isAfterClose(question) && (
                                    <div className="absolute inset-0 pointer-events-none flex items-start justify-end">
                                      <div className="m-2 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded">
                                        ĐÃ ĐÓNG
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>

                          {/* maxChoose === 2 */}
                          <div
                            className={
                              selectedType === 'bracket'
                                ? 'grid grid-cols-1 gap-8'
                                : gridClassForCount(qList.filter((q) => q.maxChoose === 2).length)
                            }
                          >
                            {qList
                              .filter((q) => q.maxChoose === 2)
                              .map((question) => (
                                <div
                                  key={`${t}-${question.id}`}
                                  className={
                                    selectedType === 'bracket'
                                      ? cardTileClassBracket
                                      : cardTileClassEvent
                                  }
                                  onClick={() => {
                                    if (canInteract(question)) {
                                      openModal(question);
                                    }
                                  }}
                                >
                                  <div
                                    className={
                                      isBeforeOpen(question)
                                        ? 'blur-sm pointer-events-none w-full'
                                        : 'w-full'
                                    }
                                  >
                                    {question.type === 'player' ||
                                    question.type === 'lol_champ' ||
                                    question.type === 'team' ? (
                                      <PlayerQuestionCard question={question} />
                                    ) : (
                                      <>
                                        <h4 className="w-full text-left text-[15px] font-semibold mb-2 text-gray-200">
                                          {question.question}
                                        </h4>
                                        <hr className="w-full border-t border-gray-700 my-3" />
                                        <div className="w-full">
                                          {predictions[question.id]?.length > 0 ? (
                                            <div
                                              className={`grid ${getGridColsClass(
                                                question.maxChoose
                                              )} gap-4 w-full items-center justify-center`}
                                            >
                                              {predictions[question.id].map((team) => {
                                                const selectedTeam = resolvePickToOption(
                                                  question,
                                                  team
                                                );
                                                return selectedTeam ? (
                                                  <StaticOptionTile
                                                    key={team}
                                                    option={selectedTeam}
                                                    correctness={isOptionCorrect(
                                                      question.id,
                                                      selectedTeam
                                                    )}
                                                  />
                                                ) : null;
                                              })}
                                            </div>
                                          ) : (
                                            <div className="w-full flex items-center justify-center">
                                              <p className="text-gray-400 italic">
                                                Ấn vào đây để chọn
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  {isBeforeOpen(question) && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="bg-black/60 text-white rounded px-3 py-2 text-center">
                                        <div>
                                          Sẽ mở vào lúc {formatLocalTime(question.openTime)}
                                        </div>
                                        <div className="text-sm opacity-80">
                                          Còn:{' '}
                                          {formatCountdown(
                                            new Date(question.openTime).getTime() - nowTs
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {!viewerMode && isAfterClose(question) && (
                                    <div className="absolute inset-0 pointer-events-none flex items-start justify-end">
                                      <div className="m-2 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded">
                                        ĐÃ ĐÓNG
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>

                          {/* maxChoose > 2 */}
                          <div
                            className={
                              selectedType === 'bracket'
                                ? 'grid grid-cols-1 gap-8'
                                : gridClassForCount(qList.filter((q) => q.maxChoose > 2).length)
                            }
                          >
                            {qList
                              .filter((q) => q.maxChoose > 2)
                              .map((question) => (
                                <div
                                  key={`${t}-${question.id}`}
                                  className={
                                    selectedType === 'bracket'
                                      ? cardTileClassBracket
                                      : cardTileClassEvent
                                  }
                                  onClick={() => {
                                    if (canInteract(question)) {
                                      openModal(question);
                                    }
                                  }}
                                >
                                  <div
                                    className={
                                      isBeforeOpen(question)
                                        ? 'blur-sm pointer-events-none w-full'
                                        : 'w-full'
                                    }
                                  >
                                    {question.type === 'player' ||
                                    question.type === 'lol_champ' ||
                                    question.type === 'team' ? (
                                      <PlayerQuestionCard question={question} />
                                    ) : (
                                      <>
                                        <h4 className="w-full text-left text-[15px] font-semibold mb-2 text-gray-200">
                                          {question.question}
                                        </h4>
                                        <hr className="w-full border-t border-gray-700 my-3" />
                                        <div className="w-full">
                                          {predictions[question.id]?.length > 0 ? (
                                            <div
                                              className={`grid ${getGridColsClass(
                                                question.maxChoose
                                              )} gap-4 w-full items-center justify-center`}
                                            >
                                              {predictions[question.id].map((team) => {
                                                const selectedTeam = resolvePickToOption(
                                                  question,
                                                  team
                                                );
                                                return selectedTeam ? (
                                                  <StaticOptionTile
                                                    key={team}
                                                    option={selectedTeam}
                                                    correctness={isOptionCorrect(
                                                      question.id,
                                                      selectedTeam
                                                    )}
                                                  />
                                                ) : null;
                                              })}
                                            </div>
                                          ) : (
                                            <div className="w-full flex items-center justify-center">
                                              <p className="text-gray-400 italic">
                                                Ấn vào đây để chọn
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  {isBeforeOpen(question) && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="bg-black/60 text-white rounded px-3 py-2 text-center">
                                        <div>
                                          Sẽ mở vào lúc {formatLocalTime(question.openTime)}
                                        </div>
                                        <div className="text-sm opacity-80">
                                          Còn:{' '}
                                          {formatCountdown(
                                            new Date(question.openTime).getTime() - nowTs
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {!viewerMode && isAfterClose(question) && (
                                    <div className="absolute inset-0 pointer-events-none flex items-start justify-end">
                                      <div className="m-2 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded">
                                        ĐÃ ĐÓNG
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      );
                    })}
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
                  onDraftChange={(qid, selected) =>
                    setPredictions((prev) => ({ ...prev, [qid]: selected }))
                  }
                  apiBase={
                    import.meta.env?.VITE_API_BASE || 'https://bigtournament-hq9n.onrender.com'
                  }
                  readOnly={viewerMode || isLocked}
                />
              </div>
            ) : (
              filteredOptions?.map((option) => {
                const selected = isOptionSelected(currentQuestion, option, tempSelection);
                const correctness = selected
                  ? isOptionCorrect(currentQuestion?.id, option)
                  : 'unknown';
                const disabled =
                  viewerMode ||
                  (currentQuestion.maxChoose > 1 &&
                    tempSelection.length >= currentQuestion.maxChoose &&
                    !selected);
                const isChamp = currentQuestion?.type === 'lol_champ';
                const champKey = option?.img || option?.name;
                const optionImgSrc = isChamp
                  ? `https://ddragon.leagueoflegends.com/cdn/15.20.1/img/champion/${encodeURIComponent(
                      champKey || ''
                    )}.png`
                  : option?.img
                  ? `https://drive.google.com/thumbnail?id=${option.img}`
                  : '';
                return (
                  <motion.button
                    key={option.name}
                    type="button"
                    onClick={() => handleTeamSelection(option)}
                    className={`w-full h-[88px] rounded-xl border transition-colors duration-150 flex items-center justify-start px-5 gap-4 shadow-sm
                  ${
                    selected
                      ? 'border-gray-700 ring-2 ring-blue-400/40 bg-[#1a1b1e]'
                      : 'border-gray-700 bg-[#151619] hover:bg-[#1b1c20] hover:border-blue-400/60'
                  }
                  ${selected && correctness === 'correct' ? ' bg-green-900/20' : ''}
                  ${selected && correctness === 'wrong' ? ' bg-red-900/20' : ''}
                  ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
                    whileHover={{ scale: disabled ? 1 : 1.02 }}
                    whileTap={{ scale: disabled ? 1 : 0.98 }}
                    disabled={disabled}
                  >
                    {optionImgSrc && (
                      <img
                        src={optionImgSrc}
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

          {!viewerMode && tempSelection.length === currentQuestion?.maxChoose && (
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
      </div>
    </>
  );
};

export default PickemChallenge;
