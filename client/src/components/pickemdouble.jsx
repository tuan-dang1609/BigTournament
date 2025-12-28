import { useEffect, useRef, useState } from 'react';

// Keep the same frontend layout, but refactor data source and interactions to match pickembracket.jsx patterns
const TournamentBracket = ({
  bracket_id,
  league_id,
  questionId,
  userId,
  preloadedAnswers,
  correctAnswers = [],
  options = [],
  apiBase = 'https://bigtournament-1.onrender.com',
  readOnly = false,
  viewUserId = null,
  onDraftChange,
}) => {
  const [teams, setTeams] = useState([[], [], [], []]);
  const DEBUG = false; // disable all debug logging
  const [loading, setLoading] = useState(true);
  const [placements, setPlacements] = useState({
    pos_7_8: [],
    pos_5_6: [],
    pos_4: [],
    pos_3: [],
    pos_2: [],
    pos_1: [],
  });
  // Interactive bracket states (Upper Bracket QF/SF/Final, Lower Bracket LC1/LC2)
  const createMatch = (a, b) => ({ a: { name: a || '' }, b: { name: b || '' }, winnerIndex: null });
  const [ubQF, setUbQF] = useState([
    createMatch('', ''),
    createMatch('', ''),
    createMatch('', ''),
    createMatch('', ''),
  ]);
  const [ubSF, setUbSF] = useState([createMatch('', ''), createMatch('', '')]);
  const [ubFinal, setUbFinal] = useState(createMatch('', ''));
  const [lc1, setLc1] = useState([createMatch('', ''), createMatch('', '')]);
  const [lc2, setLc2] = useState([createMatch('', ''), createMatch('', '')]);
  // Winner from 'Tranh hạng 4' advances to 'Trang Hạng 3'
  const [thirdCandidate, setThirdCandidate] = useState('');
  // Grand Final: UB winner vs 3rd-place winner
  const [gfFinal, setGfFinal] = useState(createMatch('', ''));
  // Auto-save guards similar to pickembracket
  const debounceRef = useRef(null);
  const inFlightRef = useRef(false);
  const lastSavedRef = useRef('');
  const hydratingRef = useRef(true);
  // Prevent duplicate hydration calls
  const hydrationInFlightRef = useRef(false);
  // Guard repeated Google Sheets fetches
  const fetchedSheetIdRef = useRef(null);
  const sheetInFlightRef = useRef(false);
  document.title = 'Playoff Liên Quân DCN: Season 2';
  // remove verbose one-time console dumps

  // Correctness helpers
  const normalize = (s) => {
    if (typeof s !== 'string') return s;
    // Remove diacritics and lowercase for robust matching
    return s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  };
  const isLongName = (s) => {
    const v = normalize(s) || '';
    return v.includes(' ') || v.length >= 6;
  };
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
  const correctPrefixMapRef = useRef({});
  useEffect(() => {
    const map = {};
    const add = (prefix, value) => {
      const p = String(prefix || '').trim();
      const v = normalize(value);
      if (!p || !v) return;
      if (!map[p]) map[p] = new Set();
      map[p].add(v);
    };
    const list = Array.isArray(correctAnswers) ? correctAnswers : [];
    list.forEach((ans) => {
      if (typeof ans !== 'string') return;
      const idx = ans.indexOf(':');
      if (idx === -1) return;
      const prefix = ans.slice(0, idx).trim();
      const rawName = ans.slice(idx + 1).trim();
      if (!prefix || !rawName) return;
      // Always add the original prefix
      add(prefix, rawName);
      // Alias placement prefixes to stage names for correctness highlighting
      switch (prefix) {
        case 'P4':
          add('FOURTH', rawName);
          break;
        case 'P3':
          add('THIRD', rawName);
          break;
        case 'P2':
          add('SECOND', rawName);
          break;
        case 'P1':
          add('FIRST', rawName);
          break;
        default:
          break;
      }
      const opt = (options || []).find(
        (o) =>
          normalize(o?.name) === normalize(rawName) ||
          normalize(o?.shortName) === normalize(rawName)
      );
      if (opt) {
        if (opt.name) add(prefix, opt.name);
        if (opt.shortName) add(prefix, opt.shortName);
        // Also alias the options names for placement-to-stage mapping
        switch (prefix) {
          case 'P4':
            if (opt.name) add('FOURTH', opt.name);
            if (opt.shortName) add('FOURTH', opt.shortName);
            break;
          case 'P3':
            if (opt.name) add('THIRD', opt.name);
            if (opt.shortName) add('THIRD', opt.shortName);
            break;
          case 'P2':
            if (opt.name) add('SECOND', opt.name);
            if (opt.shortName) add('SECOND', opt.shortName);
            break;
          case 'P1':
            if (opt.name) add('FIRST', opt.name);
            if (opt.shortName) add('FIRST', opt.shortName);
            break;
          default:
            break;
        }
      }
    });
    correctPrefixMapRef.current = map;
  }, [correctAnswers, options]);
  const getCorrectness = (prefix, teamName, isSelected) => {
    if (!isSelected) return 'unknown';
    const map = correctPrefixMapRef.current || {};
    const set = map[String(prefix || '').trim()] || new Set();
    if (!set.size) return 'unknown';
    const nm = normalize(teamName);
    if (nm && set.has(nm)) return 'correct';
    if (nm && isLongName(nm)) {
      const arr = Array.from(set);
      if (arr.some((v) => isLongName(v) && closeMatch(v, nm))) return 'correct';
    }
    return 'wrong';
  };

  const toSelectedOptions = (pl) => {
    const out = [];
    (pl.pos_7_8 || []).forEach((n) => n && out.push(`P7_8:${n}`));
    (pl.pos_5_6 || []).forEach((n) => n && out.push(`P5_6:${n}`));
    (pl.pos_4 || []).forEach((n) => n && out.push(`P4:${n}`));
    (pl.pos_3 || []).forEach((n) => n && out.push(`P3:${n}`));
    (pl.pos_2 || []).forEach((n) => n && out.push(`P2:${n}`));
    (pl.pos_1 || []).forEach((n) => n && out.push(`P1:${n}`));
    return Array.from(new Set(out));
  };

  const scheduleSave = (nextPlacements) => {
    if (readOnly) return; // disable autosave in read-only mode
    if (hydratingRef.current) return; // skip autosave while hydrating UI
    if (!league_id || typeof questionId === 'undefined' || !userId) return;
    const pl = nextPlacements ?? placements;
    const selectedOptions = toSelectedOptions(pl);
    // FE sync: push selections up so parent can update progress immediately
    try {
      if (typeof onDraftChange === 'function') {
        onDraftChange(questionId, selectedOptions);
      }
    } catch {}
    // Also include FE-only stage tokens for logging and rehydration
    const stageTokens = buildStageTokens();
    const selectedWithStages = Array.from(new Set([...selectedOptions, ...stageTokens]));
    const key = JSON.stringify([...selectedWithStages].sort());
    if (key === lastSavedRef.current) return;
    if (DEBUG) {
      /* debug disabled */
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        const payload = { userId, answers: [{ questionId, selectedOptions: selectedWithStages }] };
        if (DEBUG) console.debug('[PickemDouble] POST submitPrediction payload:', payload);
        const res = await fetch(`${apiBase}/api/auth/${league_id}/submitPrediction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (DEBUG) console.debug('[PickemDouble] submitPrediction status:', res.status);
        if (res.ok) lastSavedRef.current = key;
      } catch {
      } finally {
        inFlightRef.current = false;
      }
    }, 400);
  };

  // Build FE-only stage tokens from current interactive state
  const buildStageTokens = () => {
    const tokens = [];
    // QF winners
    ubQF.forEach((m) => {
      if (m.winnerIndex != null) {
        const w = m.winnerIndex === 0 ? m.a.name : m.b.name;
        if (w) tokens.push(`QF:${w}`);
      }
    });
    // SF winners
    ubSF.forEach((m) => {
      if (m.winnerIndex != null) {
        const w = m.winnerIndex === 0 ? m.a.name : m.b.name;
        if (w) tokens.push(`SF:${w}`);
      }
    });
    // Upper Final winner
    if (ubFinal.winnerIndex != null) {
      const w = ubFinal.winnerIndex === 0 ? ubFinal.a.name : ubFinal.b.name;
      if (w) tokens.push(`UF:${w}`);
    }
    // LC1 winners
    lc1.forEach((m) => {
      if (m.winnerIndex != null) {
        const w = m.winnerIndex === 0 ? m.a.name : m.b.name;
        if (w) tokens.push(`LS1:${w}`);
      }
    });
    // LC2 winners
    lc2.forEach((m) => {
      if (m.winnerIndex != null) {
        const w = m.winnerIndex === 0 ? m.a.name : m.b.name;
        if (w) tokens.push(`LS2:${w}`);
      }
    });
    // Podium choices derived from placements
    (placements.pos_4 || []).forEach((n) => n && tokens.push(`FOURTH:${n}`));
    (placements.pos_3 || []).forEach((n) => n && tokens.push(`THIRD:${n}`));
    (placements.pos_2 || []).forEach((n) => n && tokens.push(`SECOND:${n}`));
    (placements.pos_1 || []).forEach((n) => n && tokens.push(`FIRST:${n}`));
    return tokens;
  };

  // Interaction helpers
  const getWinner = (m) =>
    m && m.winnerIndex != null ? (m.winnerIndex === 0 ? m.a : m.b) : { name: '' };
  const getLoser = (m) =>
    m && m.winnerIndex != null ? (m.winnerIndex === 0 ? m.b : m.a) : { name: '' };

  const onQFClick = (matchIdx, whichIndex) => {
    if (readOnly) return;
    setUbQF((prev) => {
      const next = prev.map((m, i) => (i === matchIdx ? { ...m, winnerIndex: whichIndex } : m));
      // Propagate winners to UB SF, losers to LC1
      const w1 = getWinner(next[0]).name;
      const w2 = getWinner(next[1]).name;
      const w3 = getWinner(next[2]).name;
      const w4 = getWinner(next[3]).name;
      const l1 = getLoser(next[0]).name;
      const l2 = getLoser(next[1]).name;
      const l3 = getLoser(next[2]).name;
      const l4 = getLoser(next[3]).name;
      setUbSF([createMatch(w1, w2), createMatch(w3, w4)]);
      setLc1([createMatch(l1, l2), createMatch(l3, l4)]);
      // Reset downstream
      setUbFinal(createMatch('', ''));
      setLc2([createMatch('', ''), createMatch('', '')]);
      setPlacements((prevPl) => ({
        ...prevPl,
        pos_7_8: [],
        pos_5_6: [],
        pos_4: [],
        pos_3: [],
        pos_1: [],
        pos_2: [],
      }));
      return next;
    });
  };

  const onSFClick = (matchIdx, whichIndex) => {
    if (readOnly) return;
    setUbSF((prev) => {
      const next = prev.map((m, i) => (i === matchIdx ? { ...m, winnerIndex: whichIndex } : m));
      const fw1 = getWinner(next[0]).name;
      const fw2 = getWinner(next[1]).name;
      const fl1 = getLoser(next[0]).name;
      const fl2 = getLoser(next[1]).name;
      // UB Final participants
      setUbFinal(createMatch(fw1, fw2));
      // LC2 A-sides from UB SF losers; B-sides from LC1 winners (when decided later)
      const lc1w1 = getWinner(lc1[0]).name;
      const lc1w2 = getWinner(lc1[1]).name;
      setLc2([createMatch(fl1, lc1w1), createMatch(fl2, lc1w2)]);
      // Clear dependent placements
      setPlacements((prevPl) => ({ ...prevPl, pos_5_6: [], pos_4: [], pos_3: [] }));
      // Reset downstream third-place candidate when SF changes
      setThirdCandidate('');
      // Reset Grand Final participants when upstream changes
      setGfFinal(createMatch('', ''));
      return next;
    });
  };

  const onUBFinalClick = (whichIndex) => {
    if (readOnly) return;
    setUbFinal((prev) => {
      const next = { ...prev, winnerIndex: whichIndex };
      // Set Grand Final A-side (UB winner); B-side will be 3rd place winner when available
      const ubWinner = whichIndex === 0 ? prev.a.name : prev.b.name;
      setGfFinal((old) => createMatch(ubWinner || '', placements.pos_3?.[0] || ''));
      return next;
    });
  };

  const onLC1Click = (matchIdx, whichIndex) => {
    if (readOnly) return;
    setLc1((prev) => {
      const next = prev.map((m, i) => (i === matchIdx ? { ...m, winnerIndex: whichIndex } : m));
      // Update LC2 B-sides with LC1 winners if UB SF losers already known
      setLc2((old) => {
        const fl1 = old[0]?.a?.name || '';
        const fl2 = old[1]?.a?.name || '';
        const w1 = getWinner(next[0]).name;
        const w2 = getWinner(next[1]).name;
        return [createMatch(fl1, w1), createMatch(fl2, w2)];
      });
      // Set 7-8th when both LC1 losers known
      const l1 = getLoser(next[0]).name;
      const l2 = getLoser(next[1]).name;
      if (l1 && l2) {
        const newPl = { ...placements, pos_7_8: [l1, l2] };
        setPlacements(newPl);
        scheduleSave(newPl);
      }
      return next;
    });
  };

  const onLC2Click = (matchIdx, whichIndex) => {
    if (readOnly) return;
    setLc2((prev) => {
      const next = prev.map((m, i) => (i === matchIdx ? { ...m, winnerIndex: whichIndex } : m));
      const lA = getLoser(next[0]).name;
      const lB = getLoser(next[1]).name;
      if (lA && lB) {
        const newPl = { ...placements, pos_5_6: [lA, lB] };
        setPlacements(newPl);
        scheduleSave(newPl);
      }
      return next;
    });
  };

  const fetchTeams = async () => {
    try {
      if (!bracket_id) throw new Error('Missing bracket_id');
      // Prevent duplicate fetches (StrictMode or prop churn)
      if (fetchedSheetIdRef.current === bracket_id) {
        setLoading(false);
        return;
      }
      if (sheetInFlightRef.current) return;
      sheetInFlightRef.current = true;
      const response = await fetch(
        `https://docs.google.com/spreadsheets/d/${bracket_id}/gviz/tq?sheet=Play-in&range=A1:L20`
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      const json = JSON.parse(text.substring(47, text.length - 2));

      // Columns for this sheet layout, drop icon/score per request; keep only names
      const columns = [0, 3, 6, 9, 12, 15].filter((c) => c <= json.table.cols.length - 2);
      const updatedTeams = columns.map((col) =>
        json.table.rows.map((row) => ({
          name: (row.c[col + 1]?.v || '').toString(),
        }))
      );
      setTeams(updatedTeams);
      if (DEBUG) {
        /* debug disabled */
      }
      // Seed QF from sheet first column
      const qf = [
        createMatch(updatedTeams?.[0]?.[0]?.name, updatedTeams?.[0]?.[1]?.name),
        createMatch(updatedTeams?.[0]?.[2]?.name, updatedTeams?.[0]?.[3]?.name),
        createMatch(updatedTeams?.[0]?.[4]?.name, updatedTeams?.[0]?.[5]?.name),
        createMatch(updatedTeams?.[0]?.[6]?.name, updatedTeams?.[0]?.[7]?.name),
      ];
      setUbQF(qf);
      setUbSF([createMatch('', ''), createMatch('', '')]);
      setUbFinal(createMatch('', ''));
      setLc1([createMatch('', ''), createMatch('', '')]);
      setLc2([createMatch('', ''), createMatch('', '')]);
      fetchedSheetIdRef.current = bracket_id;
    } catch (error) {
      // swallow fetch errors (no console)
    } finally {
      sheetInFlightRef.current = false;
      setLoading(false);
    }
  };

  const hydrateFromAnswers = async () => {
    try {
      if (hydrationInFlightRef.current) return;
      hydrationInFlightRef.current = true;
      hydratingRef.current = true;
      // Luôn cố gắng gọi myanswer sớm nhất có thể; không chặn bởi loading/questionId
      if (!league_id || !userId) return;
      // Always try fetching myanswer first (prefer server-enriched data)
      let norm = null;
      let usedStages = false;
      let data = null;
      // In read-only viewer mode, call viewer API; otherwise call myanswer
      if (readOnly && viewUserId) {
        // Viewer mode: fetch from viewer endpoint
        if (DEBUG) {
          /* debug disabled */
        }
        const viewerUrl = `${apiBase}/api/auth/${league_id}/pickem/${encodeURIComponent(
          viewUserId
        )}?includeMeta=true${
          typeof questionId !== 'undefined' ? `&questionId=${encodeURIComponent(questionId)}` : ''
        }&userId=${encodeURIComponent(userId)}`;
        try {
          const res = await fetch(viewerUrl);
          if (res.ok) data = await res.json();
        } catch (err) {
          // ignore viewer fetch errors
        }
      } else if (!readOnly) {
        // Normal mode: fetch from myanswer
        if (DEBUG) {
          /* debug disabled */
        }
        const urlBase = `${apiBase}/api/auth/${league_id}/myanswer?includeMeta=true`;
        const url1 =
          urlBase +
          (typeof questionId !== 'undefined'
            ? `&questionId=${encodeURIComponent(questionId)}`
            : '') +
          `&userId=${encodeURIComponent(userId)}`;
        try {
          const res1 = await fetch(url1);
          if (res1.ok) data = await res1.json();
        } catch {}
        if (!data) {
          try {
            const res2 = await fetch(
              urlBase +
                (typeof questionId !== 'undefined'
                  ? `&questionId=${encodeURIComponent(questionId)}`
                  : ''),
              { headers: { 'x-user-id': userId } }
            );
            if (res2.ok) data = await res2.json();
          } catch {}
        }
      }
      if (!data && Array.isArray(preloadedAnswers) && preloadedAnswers.length > 0) {
        if (DEBUG) {
          /* debug disabled */
        }
        const list = Array.isArray(preloadedAnswers) ? preloadedAnswers : [];
        const pl = { pos_7_8: [], pos_5_6: [], pos_4: [], pos_3: [], pos_2: [], pos_1: [] };
        list.forEach((s) => {
          const [prefix, name] = String(s).split(':');
          switch (prefix) {
            case 'P7_8':
              if (name && !pl.pos_7_8.includes(name)) pl.pos_7_8.push(name);
              break;
            case 'P5_6':
              if (name && !pl.pos_5_6.includes(name)) pl.pos_5_6.push(name);
              break;
            case 'P4':
              pl.pos_4 = name ? [name] : [];
              break;
            case 'P3':
              pl.pos_3 = name ? [name] : [];
              break;
            case 'P2':
              pl.pos_2 = name ? [name] : [];
              break;
            case 'P1':
              pl.pos_1 = name ? [name] : [];
              break;
            default:
              break;
          }
        });
        norm = pl;
      }
      if (data) {
        if (DEBUG) {
          /* debug disabled */
        }
        const answers = (data?.answers || []).filter(
          (a) => Number(a?.questionId) === Number(questionId)
        );
        if (!answers.length) {
          // If no matching question yet (questionId may be undefined early), keep waiting for next hydrate
          return;
        }
        const ans = answers[0] || {};
        // Prefer stages from logs to reconstruct interactive highlights
        let stageObj = null;
        if (data?.logs) {
          if (Array.isArray(data.logs)) {
            const found = data.logs.find((l) => Number(l.questionId) === Number(questionId));
            stageObj = found?.stages;
          } else if (typeof data.logs === 'object' && data.logs.first !== undefined) {
            stageObj = data.logs;
          }
          if (DEBUG) {
            /* debug disabled */
          }
        }
        // Fallback: nếu stageObj rỗng, thử lấy từ enriched answer (selectedStages)
        const isEmptyStages = (st) => {
          if (!st) return true;
          const keys = ['qf', 'sf', 'uf', 'ls1', 'ls2', 'fourth', 'third', 'second', 'first'];
          return keys.every((k) => (Array.isArray(st[k]) ? st[k].length === 0 : true));
        };
        if (ans.selectedBracket) {
          const sb = ans.selectedBracket || {};
          if (DEBUG) {
            /* debug disabled */
          }
          norm = {
            pos_7_8: sb.pos_7_8 || [],
            pos_5_6: sb.pos_5_6 || [],
            pos_4: sb.pos_4 || [],
            pos_3: sb.pos_3 || [],
            pos_2: sb.pos_2 || [],
            pos_1: sb.pos_1 || [],
          };
          // Nếu có stages, dựng lại toàn bộ bracket theo các lựa chọn đã lưu
          let useStages = stageObj;
          if (isEmptyStages(useStages) && ans.selectedStages) {
            if (DEBUG) {
              /* debug disabled */
            }
            useStages = ans.selectedStages;
          }
          if (!isEmptyStages(useStages)) {
            rebuildFromStages(useStages, sb);
            usedStages = true;
          }
        } else if (Array.isArray(ans.selectedOptions)) {
          if (DEBUG) {
            /* debug disabled */
          }
          const pl = { pos_7_8: [], pos_5_6: [], pos_4: [], pos_3: [], pos_2: [], pos_1: [] };
          ans.selectedOptions.forEach((s) => {
            const [prefix, name] = String(s).split(':');
            switch (prefix) {
              case 'P7_8':
                if (!pl.pos_7_8.includes(name)) pl.pos_7_8.push(name);
                break;
              case 'P5_6':
                if (!pl.pos_5_6.includes(name)) pl.pos_5_6.push(name);
                break;
              case 'P4':
                pl.pos_4 = name ? [name] : [];
                break;
              case 'P3':
                pl.pos_3 = name ? [name] : [];
                break;
              case 'P2':
                pl.pos_2 = name ? [name] : [];
                break;
              case 'P1':
                pl.pos_1 = name ? [name] : [];
                break;
              default:
                break;
            }
          });
          norm = pl;
          let useStages = stageObj;
          if (isEmptyStages(useStages) && ans.selectedStages) {
            if (DEBUG) {
              /* debug disabled */
            }
            useStages = ans.selectedStages;
          }
          if (!isEmptyStages(useStages)) {
            rebuildFromStages(useStages, pl);
            usedStages = true;
          }
        }
      }
      if (norm && !usedStages) {
        setPlacements(norm);
        if (DEBUG) {
          /* debug disabled */
        }
        const withStages = [...toSelectedOptions(norm), ...buildStageTokens()];
        lastSavedRef.current = JSON.stringify([...new Set(withStages)].sort());
      }
    } catch {
    } finally {
      hydrationInFlightRef.current = false;
      hydratingRef.current = false;
    }
  };

  // Dựng lại toàn bộ bracket từ stages + placements chung cuộc
  const rebuildFromStages = (stages, bracketObj) => {
    try {
      const safeArr = (x) => (Array.isArray(x) ? x : []);
      const sQF = safeArr(stages.qf);
      const sSF = safeArr(stages.sf);
      const sUF = safeArr(stages.uf);
      const sLS1 = safeArr(stages.ls1);
      const sLS2 = safeArr(stages.ls2);
      const sFirst = safeArr(stages.first);
      const sSecond = safeArr(stages.second);
      const sThird = safeArr(stages.third);
      const sFourth = safeArr(stages.fourth);

      // Clone current seeded QF to start from their participants
      const qf = ubQF.map((m) => ({ a: { ...m.a }, b: { ...m.b }, winnerIndex: null }));
      const eqName = (x, y) => {
        const nx = normalize(x);
        const ny = normalize(y);
        if (nx === ny) return true;
        // Fuzzy match to tolerate minor differences
        return closeMatch(nx, ny, 1);
      };
      const findIdx = (m, name) =>
        eqName(m?.a?.name, name) ? 0 : eqName(m?.b?.name, name) ? 1 : null;

      if (DEBUG)
        console.debug('[PickemDouble] rebuildFromStages input:', {
          stages,
          bracketObj,
          seededQF: qf,
        });
      // Apply QF winners
      qf.forEach((m) => {
        const w = sQF.find((n) => eqName(n, m.a.name) || eqName(n, m.b.name));
        if (w) m.winnerIndex = findIdx(m, w);
      });
      if (DEBUG) console.debug('[PickemDouble] QF after apply:', qf);

      // Build UB SF from QF winners
      const qfWinners = [0, 1, 2, 3].map((i) =>
        qf[i]?.winnerIndex != null ? (qf[i].winnerIndex === 0 ? qf[i].a.name : qf[i].b.name) : ''
      );
      const qfLosers = [0, 1, 2, 3].map((i) =>
        qf[i]?.winnerIndex != null ? (qf[i].winnerIndex === 0 ? qf[i].b.name : qf[i].a.name) : ''
      );
      const sf = [
        createMatch(qfWinners[0] || '', qfWinners[1] || ''),
        createMatch(qfWinners[2] || '', qfWinners[3] || ''),
      ];
      if (DEBUG) console.debug('[PickemDouble] SF participants:', sf);
      sf.forEach((m) => {
        const w = sSF.find((n) => eqName(n, m.a.name) || eqName(n, m.b.name));
        if (w) m.winnerIndex = findIdx(m, w);
      });
      if (DEBUG) console.debug('[PickemDouble] SF after apply:', sf);

      // UB Final from SF winners
      const sfWinners = [0, 1].map((i) =>
        sf[i]?.winnerIndex != null ? (sf[i].winnerIndex === 0 ? sf[i].a.name : sf[i].b.name) : ''
      );
      const sfLosers = [0, 1].map((i) =>
        sf[i]?.winnerIndex != null ? (sf[i].winnerIndex === 0 ? sf[i].b.name : sf[i].a.name) : ''
      );
      const ubf = createMatch(sfWinners[0] || '', sfWinners[1] || '');
      {
        const w = sUF.find((n) => eqName(n, ubf.a.name) || eqName(n, ubf.b.name));
        if (w) ubf.winnerIndex = findIdx(ubf, w);
      }
      if (DEBUG) console.debug('[PickemDouble] UBF after apply:', ubf);

      // LC1 from QF losers pair (l1 vs l2), (l3 vs l4)
      const lc1Local = [
        createMatch(qfLosers[0] || '', qfLosers[1] || ''),
        createMatch(qfLosers[2] || '', qfLosers[3] || ''),
      ];
      if (DEBUG) console.debug('[PickemDouble] LC1 participants:', lc1Local);
      lc1Local.forEach((m) => {
        const w = sLS1.find((n) => eqName(n, m.a.name) || eqName(n, m.b.name));
        if (w) m.winnerIndex = findIdx(m, w);
      });
      if (DEBUG) console.debug('[PickemDouble] LC1 after apply:', lc1Local);

      // LC2 from (loser SF1 vs winner LC1-1), (loser SF2 vs winner LC1-2)
      const lc1Winners = [0, 1].map((i) =>
        lc1Local[i]?.winnerIndex != null
          ? lc1Local[i].winnerIndex === 0
            ? lc1Local[i].a.name
            : lc1Local[i].b.name
          : ''
      );
      const lc2Local = [
        createMatch(sfLosers[0] || '', lc1Winners[0] || ''),
        createMatch(sfLosers[1] || '', lc1Winners[1] || ''),
      ];
      if (DEBUG) console.debug('[PickemDouble] LC2 participants:', lc2Local);
      lc2Local.forEach((m) => {
        const w = sLS2.find((n) => eqName(n, m.a.name) || eqName(n, m.b.name));
        if (w) m.winnerIndex = findIdx(m, w);
      });
      if (DEBUG) console.debug('[PickemDouble] LC2 after apply:', lc2Local);

      // TH4: giữa 2 winner LC2, loser là FOURTH
      const lc2Winners = [0, 1].map((i) =>
        lc2Local[i]?.winnerIndex != null
          ? lc2Local[i].winnerIndex === 0
            ? lc2Local[i].a.name
            : lc2Local[i].b.name
          : ''
      );
      const th4A = lc2Winners[0] || '';
      const th4B = lc2Winners[1] || '';
      const fourth = sFourth[0] || bracketObj?.pos_4?.[0] || '';
      const th4Winner = fourth ? (fourth === th4A ? th4B : fourth === th4B ? th4A : '') : '';
      const newThirdCandidate = th4Winner || '';
      if (DEBUG)
        console.debug('[PickemDouble] TH4 participants:', {
          th4A,
          th4B,
          fourth,
          th4Winner,
          newThirdCandidate,
        });

      // TH3: (loser UBF) vs (winner TH4). Loser là THIRD.
      const ubfLoser =
        ubf.winnerIndex != null ? (ubf.winnerIndex === 0 ? ubf.b.name : ubf.a.name) : '';
      const th3A = ubfLoser || '';
      const th3B = newThirdCandidate || '';
      const third = sThird[0] || bracketObj?.pos_3?.[0] || '';
      const th3Winner = third ? (third === th3A ? th3B : third === th3B ? th3A : '') : '';
      if (DEBUG)
        console.debug('[PickemDouble] TH3 participants:', { th3A, th3B, third, th3Winner });

      // GF: (winner UBF) vs (winner TH3). Winner là FIRST.
      const ubfWinner =
        ubf.winnerIndex != null ? (ubf.winnerIndex === 0 ? ubf.a.name : ubf.b.name) : '';
      const gfA = ubfWinner || '';
      const gfB = th3Winner || '';
      const first = sFirst[0] || bracketObj?.pos_1?.[0] || '';
      const gf = createMatch(gfA, gfB);
      if (first) gf.winnerIndex = gf.a.name === first ? 0 : gf.b.name === first ? 1 : null;
      if (DEBUG)
        console.debug('[PickemDouble] GF participants:', {
          gfA,
          gfB,
          first,
          gfWinnerIndex: gf.winnerIndex,
        });

      // Second: nếu chưa có từ stages, suy ra là team còn lại ở GF
      const second =
        sSecond[0] ||
        (gf.winnerIndex != null
          ? gf.winnerIndex === 0
            ? gf.b.name
            : gf.a.name
          : bracketObj?.pos_2?.[0] || '');
      if (DEBUG) console.debug('[PickemDouble] Podium resolved:', { first, second, third, fourth });

      // Cập nhật state hàng loạt
      setUbQF(qf);
      setUbSF(sf);
      setUbFinal(ubf);
      setLc1(lc1Local);
      setLc2(lc2Local);
      setThirdCandidate(newThirdCandidate);
      setGfFinal(gf);
      const builtPlacements = {
        pos_7_8: bracketObj?.pos_7_8 || [],
        pos_5_6: bracketObj?.pos_5_6 || [],
        pos_4: fourth ? [fourth] : bracketObj?.pos_4 || [],
        pos_3: third ? [third] : bracketObj?.pos_3 || [],
        pos_2: second ? [second] : bracketObj?.pos_2 || [],
        pos_1: first ? [first] : bracketObj?.pos_1 || [],
      };
      setPlacements(builtPlacements);
      // Set lastSavedRef to avoid autosave right after hydration
      const stageTokens = stageTokensFrom(stages);
      const withStages = [...toSelectedOptions(builtPlacements), ...stageTokens];
      lastSavedRef.current = JSON.stringify([...new Set(withStages)].sort());
      if (DEBUG) console.debug('[PickemDouble] State updated from stages');
    } catch (e) {
      // no-op
    }
  };

  // Build tokens directly from a stages object
  const stageTokensFrom = (st) => {
    const tokens = [];
    const pushAll = (pref, arr) => (arr || []).forEach((n) => n && tokens.push(`${pref}:${n}`));
    pushAll('QF', st?.qf);
    pushAll('SF', st?.sf);
    pushAll('UF', st?.uf);
    pushAll('LS1', st?.ls1);
    pushAll('LS2', st?.ls2);
    pushAll('FOURTH', st?.fourth);
    pushAll('THIRD', st?.third);
    pushAll('SECOND', st?.second);
    pushAll('FIRST', st?.first);
    return tokens;
  };

  // Dump toàn bộ state để kiểm tra mỗi khi có thay đổi lớn
  useEffect(() => {
    if (!DEBUG) return;
    console.debug('[PickemDouble] STATE DUMP:', {
      ubQF,
      ubSF,
      ubFinal,
      lc1,
      lc2,
      thirdCandidate,
      gfFinal,
      placements,
    });
  }, [ubQF, ubSF, ubFinal, lc1, lc2, thirdCandidate, gfFinal, placements]);

  // Fetch teams only when bracket_id changes (guarded inside)
  useEffect(() => {
    fetchTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bracket_id]);

  // Hydrate answers independently; may run multiple times as props arrive, but no sheet fetch
  // Removed duplicate effect to avoid multiple myanswer calls; we'll hydrate after teams load.

  // Trì hoãn hydrate cho đến khi seed đội xong
  useEffect(() => {
    if (!loading) hydrateFromAnswers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, readOnly]);

  // Note: We no longer auto-save on state changes to avoid unintended submits on reload.
  // Saving only occurs via explicit user interactions that call scheduleSave(newPlacements).

  const roundStyles = {
    '0W-0L': { border: 'border-gray-300', titleBg: 'bg-[#D9D9D94D]' },
    '1W-0L': { border: 'border-gray-300', titleBg: 'bg-[#D9D9D94D]' },
    '1W-1L': { border: 'border-gray-300', titleBg: 'bg-[#D9D9D94D]' },
    '0W-1L': { border: 'border-gray-300', titleBg: 'bg-[#D9D9D94D]' },
    'Advance to play-off': { border: 'border-gray-300', titleBg: 'bg-[#D9D9D94D]' },
  };

  const renderMatchup = (
    team1,
    team2,
    hasMargin = true,
    additionalMargin = '',
    onTeamClick,
    isSelected,
    stagePrefix
  ) => (
    <div
      className={`relative flex flex-col gap-y-[3px] overflow-hidden ${
        hasMargin ? 'my-4' : 'mb-0'
      } ${additionalMargin}`}
    >
      {[team1, team2].map((team, index) => {
        const active = isSelected ? isSelected(team, index) : false;
        const correctness = getCorrectness(stagePrefix, team?.name, active);
        return (
          <div
            key={index}
            onClick={() => onTeamClick && onTeamClick(team, index)}
            className={`2xl:pl-[6px] pl-[4px] flex items-center justify-start border ${
              active
                ? `border-[#3d8fce] ${
                    correctness === 'correct'
                      ? 'bg-green-200'
                      : correctness === 'wrong'
                      ? 'bg-red-200'
                      : 'bg-white'
                  }`
                : 'bg-white border-transparent'
            } ${onTeamClick ? 'cursor-pointer hover:bg-gray-100' : ''}`}
          >
            <div className="flex items-center h-14">
              <span className="text-black">{team?.name || ''}</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderSection = (
    title,
    matchups,
    className = '',
    onTeamClickFactory,
    isSelectedFactory
  ) => {
    const styles = roundStyles[title] || { border: 'border-gray-300', titleBg: 'bg-[#D9D9D94D]' };
    const lowerTitle = String(title || '').toLowerCase();
    // Map section title to correctness prefix (case-insensitive)
    const stagePrefix = lowerTitle.includes('tứ kết')
      ? 'QF'
      : lowerTitle.includes('bán kết')
      ? 'SF'
      : lowerTitle.includes('chung kết nhánh thắng')
      ? 'UF'
      : lowerTitle.includes('last chance 1')
      ? 'LS1'
      : lowerTitle.includes('last chance 2')
      ? 'LS2'
      : lowerTitle.includes('tranh hạng 4')
      ? 'FOURTH'
      : lowerTitle.includes('trang hạng 3')
      ? 'THIRD'
      : lowerTitle.includes('chung kết tổng')
      ? 'FIRST'
      : '';

    return (
      <div
        className={`flex flex-col  ${styles.border} overflow-hidden ${
          title === '1W-1L' ? 'lg:mt-5' : ''
        }`}
      >
        <h2 className={`text-lg font-bold p-2 ${styles.titleBg} border ${styles.border} `}>
          {title}
        </h2>
        <div className="py-2">
          {matchups.map((matchup, index) => (
            <div key={index} className={className}>
              {renderMatchup(
                matchup[0] || {},
                matchup[1] || {},
                true,
                '',
                onTeamClickFactory ? onTeamClickFactory(index) : undefined,
                isSelectedFactory ? isSelectedFactory(index) : undefined,
                stagePrefix
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 relative">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <span className="loading loading-dots loading-lg text-primary"></span>
        </div>
      ) : (
        <>
          <div className="flex flex-col xl:flex-row justify-between space-y-8 xl:space-y-0 xl:space-x-16 relative">
            <div className="w-full xl:w-1/4 relative">
              <div>
                {renderSection(
                  'Tứ kết ',
                  ubQF.map((m) => [m.a, m.b]),
                  'xl:!mb-[48px] xl:last:!mb-[0px] xl:first:!mt-[10px]',
                  (i) => (team, which) => onQFClick(i, which),
                  (i) => (team, which) => ubQF[i]?.winnerIndex === which
                )}
                <div className="hidden xl:block absolute top-[7.9rem] left-full h-[2px] w-[10%] bg-secondary"></div>
                <div className="hidden xl:block absolute top-[calc(7.9rem)] left-[110%] h-[169px] w-[2.3px] bg-secondary"></div>
                <div className="hidden xl:block absolute top-[18.4rem] left-full h-[2px] w-[10%] bg-secondary"></div>
                <div className="hidden xl:block absolute top-[13.15rem] left-[110%]  h-[2px] w-[14%] bg-secondary"></div>

                <div className="hidden xl:block absolute top-[28.7rem] left-full h-[2px] w-[10%] bg-secondary"></div>
                <div className="hidden xl:block absolute top-[calc(28.7rem)] left-[110%] h-[169px] w-[2.3px] bg-secondary"></div>
                <div className="hidden xl:block absolute top-[39.2rem] left-full h-[2px] w-[10%]  bg-secondary"></div>
                <div className="hidden xl:block absolute top-[33.95rem] left-[110%] h-[2px] w-[14%] bg-secondary"></div>
              </div>
            </div>
            <div className="w-full xl:w-1/4 relative">
              {renderSection(
                'Bán kết ',
                ubSF.map((m) => [m.a, m.b]),
                'xl:!mt-[100px] last:!mb-[0px] xl:!mb-[213px]',
                (i) => (team, which) => onSFClick(i, which),
                (i) => (team, which) => ubSF[i]?.winnerIndex === which
              )}
              <div className="hidden xl:block absolute top-[13.3rem] left-full h-[2px] w-[10%]  bg-secondary"></div>
              <div className="hidden xl:block absolute top-[calc(13.3rem)] left-[110%] h-[330px] w-[2.3px] bg-secondary"></div>
              <div className="hidden xl:block absolute top-[33.9rem] left-full h-[2px] w-[10%]  bg-secondary"></div>
              <div className="hidden xl:block absolute top-[23.6rem] left-[110%] h-[2px] w-[14%] bg-secondary"></div>
            </div>
            <div className="w-full xl:w-1/4 relative">
              {renderSection(
                'Chung kết nhánh thắng ',
                [[ubFinal.a, ubFinal.b]],
                'xl:!mt-[266px] last:!mb-[0px]',
                () => (team, which) => onUBFinalClick(which),
                () => (team, which) => ubFinal?.winnerIndex === which
              )}
              <div className="hidden xl:block absolute top-[23.6rem] left-full h-[2px] w-[10%]  bg-secondary"></div>
              <div className="hidden xl:block absolute top-[calc(23.6rem)] left-[110%] h-[560px] w-[2.3px] bg-secondary"></div>
              <div className="hidden xl:block absolute top-[58.5rem] left-full h-[2px] w-[10%]  bg-secondary"></div>
              <div className="hidden xl:block absolute top-[40.1rem] left-[110%]  h-[2px] w-[14%] bg-secondary"></div>
            </div>
            <div className="hidden xl:block xl:w-1/4 relative">
              {renderSection(
                'Chung kết tổng (BO7)',
                [[gfFinal.a, gfFinal.b]],
                'xl:!mt-[530px]',
                () => (team, which) => {
                  // Only Grand Final decides 1st/2nd
                  setGfFinal((prev) => {
                    const next = { ...prev, winnerIndex: which };
                    const winner = which === 0 ? prev.a.name : prev.b.name;
                    const loser = which === 0 ? prev.b.name : prev.a.name;
                    const newPl = {
                      ...placements,
                      pos_1: winner ? [winner] : [],
                      pos_2: loser ? [loser] : [],
                    };
                    setPlacements(newPl);
                    scheduleSave(newPl);
                    return next;
                  });
                },
                () => (team, which) => gfFinal?.winnerIndex === which
              )}
            </div>
          </div>
          <div className="flex flex-col xl:w-[74%] xl:flex-row justify-between space-y-8 xl:space-y-0 xl:space-x-16 relative">
            <div className="w-full xl:w-1/4 relative">
              <div>
                {renderSection(
                  'Last Chance 1 ',
                  lc1.map((m) => [m.a, m.b]),
                  'xl:!mb-[48px] xl:last:!mb-[0px] xl:first:!mt-[10px]',
                  (i) => (team, which) => onLC1Click(i, which),
                  (i) => (team, which) => lc1[i]?.winnerIndex === which
                )}
                <div className="hidden xl:block absolute top-[8rem] left-full h-[2px] w-[35%]  bg-secondary"></div>
                <div className="hidden xl:block absolute top-[18.4rem] left-full h-[2px] w-[35%] bg-secondary"></div>
              </div>
            </div>
            <div className="w-full xl:w-1/4 relative">
              {renderSection(
                'Last Chance 2 ',
                lc2.map((m) => [m.a, m.b]),
                'xl:!mb-[48px] xl:last:!mb-[0px] xl:first:!mt-[10px]',
                (i) => (team, which) => onLC2Click(i, which),
                (i) => (team, which) => lc2[i]?.winnerIndex === which
              )}
              <div className="hidden xl:block absolute top-[8rem] left-full h-[2px] w-[10%]  bg-secondary"></div>
              <div className="hidden xl:block absolute top-[calc(8rem)] left-[110%] h-[167.5px] w-[2.3px] bg-secondary"></div>
              <div className="hidden xl:block absolute top-[18.4rem] left-full h-[2px] w-[10%]  bg-secondary"></div>
              <div className="hidden xl:block absolute top-[13.2rem] left-[110%]  h-[2px] w-[24%] bg-secondary"></div>
            </div>
            <div className="w-full xl:w-1/4 relative">
              {renderSection(
                'Tranh hạng 4 ',
                [[{ name: getWinner(lc2[0]).name }, { name: getWinner(lc2[1]).name }]],
                'xl:first:!mt-[98px]',
                () => (team, which) => {
                  const wA = getWinner(lc2[0]).name;
                  const wB = getWinner(lc2[1]).name;
                  if (!wA || !wB) return;
                  const winner = which === 0 ? wA : wB;
                  const loser = which === 0 ? wB : wA;
                  // Loser here takes 4th place; winner advances to 'Trang Hạng 3'
                  const newPl = { ...placements, pos_4: loser ? [loser] : [] };
                  setPlacements(newPl);
                  setThirdCandidate(winner || '');
                  // Clear any previous pos_3 to allow proper selection in Trang Hạng 3
                  if (placements.pos_3?.length) {
                    const cleared = { ...newPl, pos_3: [] };
                    setPlacements(cleared);
                    scheduleSave(cleared);
                  } else {
                    scheduleSave(newPl);
                  }
                },
                // Mark the 4th place (loser) row as the active selection for correctness coloring
                () => (team, which) =>
                  Array.isArray(placements.pos_4) &&
                  placements.pos_4.some((n) => normalize(n) === normalize(team?.name))
              )}
              <div className="hidden xl:block absolute top-[13.1rem] xl:left-[100%]  h-[2px] xl:w-[34%] bg-secondary"></div>
            </div>
            <div className="w-full xl:w-1/4 relative">
              {renderSection(
                'Trang Hạng 3 ',
                [[{ name: getLoser(ubFinal).name }, { name: thirdCandidate }]],
                'xl:first:!mt-[98px]',
                () => (team, which) => {
                  const candA = getLoser(ubFinal).name;
                  const candB = thirdCandidate;
                  if (!candA || !candB) return;
                  const selected = which === 0 ? candA : candB; // đội bạn click
                  const loser = which === 0 ? candB : candA; // đội còn lại là hạng 3
                  const newPl = { ...placements, pos_3: loser ? [loser] : [] };
                  setPlacements(newPl);
                  // Update Grand Final B-side to 3rd place winner; keep A-side as UB winner if decided
                  const ubWinner = ubFinal.winnerIndex != null ? getWinner(ubFinal).name : '';
                  setGfFinal(createMatch(ubWinner || '', selected || ''));
                  scheduleSave(newPl);
                },
                // Mark the 3rd place (loser) row as the active selection for correctness coloring
                () => (team, which) =>
                  Array.isArray(placements.pos_3) &&
                  placements.pos_3.some((n) => normalize(n) === normalize(team?.name))
              )}
            </div>
            <div className="w-full xl:hidden relative">
              {renderSection(
                'Chung kết Tổng (BO7)',
                [[gfFinal.a, gfFinal.b]],
                'xl:!mt-[500px] last:!mb-[0px]',
                () => (team, which) => {
                  setGfFinal((prev) => {
                    const next = { ...prev, winnerIndex: which };
                    const winner = which === 0 ? prev.a.name : prev.b.name;
                    const loser = which === 0 ? prev.b.name : prev.a.name;
                    const newPl = {
                      ...placements,
                      pos_1: winner ? [winner] : [],
                      pos_2: loser ? [loser] : [],
                    };
                    setPlacements(newPl);
                    scheduleSave(newPl);
                    return next;
                  });
                },
                () => (team, which) => gfFinal?.winnerIndex === which
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TournamentBracket;
