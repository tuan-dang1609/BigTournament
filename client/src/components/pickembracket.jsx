import React, { useEffect, useState, useRef } from 'react';

const TournamentBracketAOV = ({
  bracket_id,
  league_id,
  questionId,
  userId,
  preloadedAnswers,
  correctAnswers = [],
  options = [],
  apiBase = 'https://bigtournament-hq9n.onrender.com',
  onDraftChange,
  readOnly = false,
}) => {
  const [teams, setTeams] = useState([[], [], [], []]);
  const [loading, setLoading] = useState(true);
  const [finalWinnerIndex, setFinalWinnerIndex] = useState(-1);
  document.title = 'Solo Yasuo cuối tuần';
  // Anti-spam: debounce saves and avoid duplicates
  const saveDebounceRef = useRef(null);
  const inFlightRef = useRef(false);
  const lastSavedRef = useRef(''); // JSON string of last saved selectedOptions
  const hydratedRef = useRef(false); // prevent re-hydration

  // --- Correctness helpers (normalize + constrained fuzzy + prefix map) ---
  const normalize = (s) => (typeof s === 'string' ? s.trim().toLowerCase() : s);
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

  // Build a map of prefix -> Set of normalized acceptable names (with alias expansion via options)
  const correctPrefixMapRef = useRef({});
  useEffect(() => {
    const map = {};
    const addToMap = (prefix, value) => {
      const p = String(prefix || '').trim();
      const v = normalize(value);
      if (!p || !v) return;
      if (!map[p]) map[p] = new Set();
      map[p].add(v);
    };
    const answerList = Array.isArray(correctAnswers) ? correctAnswers : [];
    // Parse each answer like 'QF:Team Name' or '1ST:Team Name'
    answerList.forEach((ans) => {
      if (typeof ans !== 'string') return;
      const idx = ans.indexOf(':');
      if (idx === -1) return;
      const prefix = ans.slice(0, idx).trim();
      const rawName = ans.slice(idx + 1).trim();
      if (!prefix || !rawName) return;
      // Add the raw name
      addToMap(prefix, rawName);
      // Alias expansion via options (name <-> shortName)
      const opt = (options || []).find(
        (o) =>
          normalize(o?.name) === normalize(rawName) ||
          normalize(o?.shortName) === normalize(rawName)
      );
      if (opt) {
        if (opt.name) addToMap(prefix, opt.name);
        if (opt.shortName) addToMap(prefix, opt.shortName);
      }
    });
    correctPrefixMapRef.current = map;
  }, [correctAnswers, options]);

  const getCorrectness = (prefix, teamName, isSelected) => {
    if (!isSelected) return 'unknown';
    if (!prefix || !teamName) return 'unknown';
    const map = correctPrefixMapRef.current || {};
    const set = map[String(prefix).trim()] || new Set();
    if (!set || set.size === 0) return 'unknown';
    const nm = normalize(teamName);
    if (nm && set.has(nm)) return 'correct';
    // Fuzzy only for long names within same prefix
    if (nm && isLongName(nm)) {
      const arr = Array.from(set);
      if (arr.some((v) => isLongName(v) && closeMatch(v, nm))) return 'correct';
    }
    return 'wrong';
  };

  // Serialize current bracket state to prefixed array: QF:/SF:/1ST:/2ND:
  const computeSelectedOptions = (teamsState, winnerIndex) => {
    const out = [];
    const pushStage = (prefix, arr) => {
      (arr || []).forEach((t) => {
        const name = t && t.name ? String(t.name).trim() : '';
        if (name) out.push(`${prefix}:${name}`);
      });
    };
    // QF picks are those advanced to semifinals (teams[1])
    pushStage('QF', teamsState?.[1] || []);
    // SF picks are those advanced to final (teams[2])
    pushStage('SF', teamsState?.[2] || []);
    // Final picks: winner and runner-up if determinable
    const f0 = teamsState?.[2]?.[0];
    const f1 = teamsState?.[2]?.[1];
    if (winnerIndex === 0 && f0?.name) {
      out.push(`1ST:${String(f0.name).trim()}`);
      if (f1?.name) out.push(`2ND:${String(f1.name).trim()}`);
    } else if (winnerIndex === 1 && f1?.name) {
      out.push(`1ST:${String(f1.name).trim()}`);
      if (f0?.name) out.push(`2ND:${String(f0.name).trim()}`);
    }
    // Dedupe to avoid duplicates on repeated clicks
    return Array.from(new Set(out));
  };

  const scheduleSave = (nextTeams, nextWinnerIndex) => {
    if (readOnly) return; // disable autosave in read-only mode
    if (!league_id || typeof questionId === 'undefined' || !userId) return;
    const selectedOptions = computeSelectedOptions(nextTeams, nextWinnerIndex);
    // Immediately sync FE draft to shared cache if provided
    try {
      if (typeof onDraftChange === 'function') {
        onDraftChange(questionId, selectedOptions);
      }
    } catch {}
    const nextKey = JSON.stringify(selectedOptions || []);
    // Skip if payload unchanged (avoid duplicate saves on same click)
    if (nextKey === lastSavedRef.current) return;
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(async () => {
      if (inFlightRef.current) return; // simple throttle: one in flight at a time
      inFlightRef.current = true;
      try {
        const payload = {
          userId,
          answers: [
            {
              questionId,
              selectedOptions,
            },
          ],
        };
        const res = await fetch(`${apiBase}/api/auth/${league_id}/submitPrediction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          lastSavedRef.current = nextKey;
          // console.info('Bracket auto-saved');
        } else {
          // keep lastSavedRef unchanged so we can retry on next change
        }
      } catch (e) {
        // Fail silently; allow retry on next change
      } finally {
        inFlightRef.current = false;
      }
    }, 400); // debounce window
  };
  // Click a team in Quarterfinals to advance it to the corresponding Semifinal slot
  const handleQuarterfinalSelection = (pairIndex, whichInPair, team) => {
    if (readOnly) return;
    if (!team || !team.name) return; // ignore empty cells
    setTeams((prev) => {
      // If no change, skip state update and API
      if (prev?.[1]?.[pairIndex]?.name === team.name) return prev;
      const next = prev.map((group) => group.slice());
      // Semifinals list is teams[1] with 4 slots: [SF1-top, SF1-bottom, SF2-top, SF2-bottom]
      // QF pairs are ordered as [0..3] -> map directly to SF indices [0..3]
      next[1][pairIndex] = { ...team, score: 0 };
      // Auto-save with updated state
      scheduleSave(next, finalWinnerIndex);
      return next;
    });
  };
  // Click a team in Semifinals to advance it to the corresponding Final slot
  const handleSemifinalSelection = (pairIndex, whichInPair, team) => {
    if (readOnly) return;
    if (!team || !team.name) return;
    setTeams((prev) => {
      if (prev?.[2]?.[pairIndex]?.name === team.name) return prev;
      const next = prev.map((group) => group.slice());
      // Finals list is teams[2] with 2 slots: [Final-top, Final-bottom]
      // SF pairs are [0,1] -> map directly to Final indices [0,1]
      next[2][pairIndex] = { ...team, score: 0 };
      scheduleSave(next, finalWinnerIndex);
      return next;
    });
  };
  // Click a team in Final to set champion (winner) visually
  const handleFinalSelection = (_pairIndex, whichInPair, team) => {
    if (readOnly) return;
    if (!team || !team.name) return;
    if (finalWinnerIndex === whichInPair) return; // no change
    setFinalWinnerIndex(whichInPair);
    // Save using current teams with new winner index
    scheduleSave(teams, whichInPair);
  };
  const fetchTeams = async () => {
    try {
      if (!bracket_id) throw new Error('Missing bracket_id');
      const response = await fetch(
        `https://docs.google.com/spreadsheets/d/${bracket_id}/gviz/tq?sheet=Play-off&range=A1:J8`
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      const json = JSON.parse(text.substring(47, text.length - 2));

      // Sheet layout uses 3-column groups per stage: [logoId, name, score]
      // QF: B,C (group starting at A index 0), SF: E,F (start 3), Final: H,I (start 6)
      const columns = [0, 3, 6];
      const updatedTeams = columns.map((col) =>
        json.table.rows.map((row) => {
          const logoId = row.c[col]?.v;
          return {
            name: (row.c[col + 1]?.v ?? '').toString().trim(),
            icon: logoId ? `https://drive.google.com/thumbnail?id=${logoId}` : '',
            score: row.c[col + 2]?.v || 0,
          };
        })
      );
      setTeams(updatedTeams);
    } catch (error) {
      // swallow fetch errors to keep console clean
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [bracket_id]);

  // Hydrate from saved answers when possible (one-time)
  useHydrateFromAnswers(
    loading,
    league_id,
    questionId,
    userId,
    apiBase,
    preloadedAnswers,
    teams,
    setTeams,
    setFinalWinnerIndex,
    hydratedRef,
    lastSavedRef
  );

  // If IDs become available after initial render and there is a selection made, ensure we auto-save once.
  useEffect(() => {
    if (!league_id || typeof questionId === 'undefined' || !userId) return;
    // If any SF/Final selection exists, push a save so backend is updated
    const hasProgress =
      (teams?.[1] && teams[1].some((t) => t && t.name)) ||
      (teams?.[2] && teams[2].some((t) => t && t.name)) ||
      finalWinnerIndex > -1;
    if (hasProgress) {
      scheduleSave(teams, finalWinnerIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league_id, questionId, userId]);

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
            onClick={() => {
              if (onTeamClick) onTeamClick(team, index);
            }}
            className={`2xl:pl-[6px] h-14 pl-[4px] pr-3 py-2 flex items-center justify-start border ${
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
            <div className="flex items-center">
              {team?.icon ? (
                <img src={team.icon} alt={team?.name || 'Team Logo'} className="w-8 h-8 mr-2" />
              ) : null}
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
    // Map section title to correctness prefix
    const prefix = title.includes('Tứ kết')
      ? 'QF'
      : title.includes('Bán kết')
      ? 'SF'
      : title.includes('Chung kết')
      ? '1ST'
      : '';

    return (
      <div
        className={`flex flex-col  ${styles.border} overflow-hidden ${
          title === '1W-1L' ? 'lg:mt-32' : ''
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
                prefix
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
        <div className="flex flex-col lg:flex-row justify-between space-y-8 lg:space-y-0 lg:space-x-16 relative">
          <div className="w-full lg:w-1/4 relative">
            <div>
              {renderSection(
                'Tứ kết',
                [
                  [teams[0]?.[0], teams[0]?.[1]],
                  [teams[0]?.[2], teams[0]?.[3]],
                  [teams[0]?.[4], teams[0]?.[5]],
                  [teams[0]?.[6], teams[0]?.[7]],
                ],
                'lg:!mb-[148px] lg:last:!mb-[0px] lg:first:!mt-[80px]',
                (pairIndex) => (team, whichInPair) =>
                  handleQuarterfinalSelection(pairIndex, whichInPair, team),
                (pairIndex) => (team) =>
                  !!team?.name && team?.name === (teams[1]?.[pairIndex]?.name || '')
              )}
              <div className="hidden lg:block absolute top-[11.8rem] left-full h-[2px] w-[25%]  bg-secondary"></div>
              <div className="hidden lg:block absolute top-[calc(11.8rem)] left-[125%] h-[268px] w-[2.5px] bg-secondary"></div>
              <div className="hidden lg:block absolute top-[28.4rem] left-full h-[2px] w-[25%]  bg-secondary"></div>
              <div className="hidden lg:block absolute top-[20.1rem] left-[125%] h-[2px] w-[25%] bg-secondary"></div>

              <div className="hidden lg:block absolute top-[44.7rem] left-full h-[2px] w-[25%] bg-secondary"></div>
              <div className="hidden lg:block absolute top-[calc(44.7rem)] left-[125%]  h-[265px] w-[2.5px] bg-secondary"></div>
              <div className="hidden lg:block absolute top-[61.1rem] left-full h-[2px] w-[25%] bg-secondary"></div>
              <div className="hidden lg:block absolute top-[52.9rem] left-[125%] h-[2px] w-[25%] bg-secondary"></div>
            </div>
          </div>
          <div className="w-full lg:w-1/4 relative">
            {renderSection(
              'Bán kết',
              [
                [teams[1]?.[0], teams[1]?.[1]],
                [teams[1]?.[2], teams[1]?.[3]],
              ],
              'lg:!mt-[212px] last:!mb-[0px] lg:!mb-[410px]',
              (pairIndex) => (team, whichInPair) =>
                handleSemifinalSelection(pairIndex, whichInPair, team),
              (pairIndex) => (team) =>
                !!team?.name && team?.name === (teams[2]?.[pairIndex]?.name || '')
            )}
            <div className="hidden lg:block absolute top-[20.1rem] left-full h-[2px] w-[25%]  bg-secondary"></div>
            <div className="hidden lg:block absolute top-[calc(20.1rem)] left-[125%]  h-[527px] w-[2.5px] bg-secondary"></div>
            <div className="hidden lg:block absolute top-[52.9rem] left-full h-[2px] w-[25%] bg-secondary"></div>
            <div className="hidden lg:block absolute top-[36.5rem] left-[125%]  h-[2px] w-[25%] bg-secondary"></div>
          </div>
          <div className="w-full lg:w-1/4 relative">
            {renderSection(
              'Chung kết',
              [[teams[2]?.[0], teams[2]?.[1]]],
              'lg:!my-[475px]',
              () => (team, whichInPair) => handleFinalSelection(0, whichInPair, team),
              () => (team, whichInPair) => finalWinnerIndex === whichInPair && !!team?.name
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper: find a team object by name from available arrays
const findTeamByNameIn = (arrays, name) => {
  const target = String(name || '').trim();
  for (const arr of arrays) {
    for (const t of arr || []) {
      if (t && String(t.name || '').trim() === target) return t;
    }
  }
  return { name: target, icon: '', score: 0 };
};

// After teams load and IDs are available, hydrate bracket from saved answers
const useHydrateFromAnswers = (
  loading,
  league_id,
  questionId,
  userId,
  apiBase,
  preloadedAnswers,
  teams,
  setTeams,
  setFinalWinnerIndex,
  hydratedRef,
  lastSavedRef
) => {
  useEffect(() => {
    const hydrate = async () => {
      try {
        // If parent provided preloadedAnswers, use them and skip network
        let selected = undefined;
        if (typeof preloadedAnswers !== 'undefined') {
          selected = Array.isArray(preloadedAnswers) ? preloadedAnswers : [];
        } else {
          const res = await fetch(`${apiBase}/api/auth/${league_id}/myanswer`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': userId,
            },
          });
          if (!res.ok) return;
          const data = await res.json();
          const answers = (data?.data?.answers || data?.answers || []).filter(
            (a) => (a?.questionId ?? a?.question_id ?? a?.qid) === questionId
          );
          if (!answers.length) return;
          selected = answers[0]?.selectedOptions || [];
        }
        if (!selected) return;
        const qf = new Set();
        const sf = new Set();
        let champion = '';
        let runnerUp = '';
        for (const s of selected) {
          if (typeof s !== 'string') continue;
          const trimmed = s.trim();
          if (trimmed.startsWith('QF:')) qf.add(trimmed.slice(3).trim());
          else if (trimmed.startsWith('SF:')) sf.add(trimmed.slice(3).trim());
          else if (trimmed.startsWith('1ST:')) champion = trimmed.slice(4).trim();
          else if (trimmed.startsWith('2ND:')) runnerUp = trimmed.slice(4).trim();
        }

        // Build next state based on saved answers
        const next = teams.map((g) => g.slice());
        // QF -> set semifinals slots by pair
        const qfPairs = [
          [teams[0]?.[0], teams[0]?.[1]],
          [teams[0]?.[2], teams[0]?.[3]],
          [teams[0]?.[4], teams[0]?.[5]],
          [teams[0]?.[6], teams[0]?.[7]],
        ];
        qfPairs.forEach((pair, pairIndex) => {
          const a = pair?.[0];
          const b = pair?.[1];
          if (a && qf.has(a.name)) next[1][pairIndex] = { ...a };
          else if (b && qf.has(b.name)) next[1][pairIndex] = { ...b };
        });

        // SF -> set final slots by semifinal pair
        const sfPairs = [
          [next[1]?.[0], next[1]?.[1]],
          [next[1]?.[2], next[1]?.[3]],
        ];
        sfPairs.forEach((pair, pairIndex) => {
          const a = pair?.[0];
          const b = pair?.[1];
          if (a && sf.has(a.name)) next[2][pairIndex] = { ...a };
          else if (b && sf.has(b.name)) next[2][pairIndex] = { ...b };
        });

        // If finals still empty but we have names, try to fill from name search
        const allSearchPools = [teams[0], teams[1]];
        if (!next[2]?.[0] && sf.size) {
          const first = Array.from(sf)[0];
          next[2][0] = { ...findTeamByNameIn(allSearchPools, first) };
        }
        if (!next[2]?.[1] && sf.size > 1) {
          const second = Array.from(sf)[1];
          next[2][1] = { ...findTeamByNameIn(allSearchPools, second) };
        }

        // Determine champion position and set winner index
        let nextWinner = -1;
        if (champion) {
          if (next[2]?.[0]?.name === champion) nextWinner = 0;
          else if (next[2]?.[1]?.name === champion) nextWinner = 1;
          // If champion not placed yet, place champion in finals slot 0 and runnerUp in 1 if available
          else {
            next[2][0] = { ...findTeamByNameIn(allSearchPools, champion) };
            if (runnerUp) next[2][1] = { ...findTeamByNameIn(allSearchPools, runnerUp) };
            nextWinner = 0;
          }
        }

        // Apply state
        setTeams(next);
        if (nextWinner > -1) setFinalWinnerIndex(nextWinner);

        // Mark lastSaved with current computed options to avoid immediate resave
        const currentKey = JSON.stringify(
          (function () {
            const sel = [];
            const push = (p, arr) =>
              (arr || []).forEach((t) => t?.name && sel.push(`${p}:${t.name.trim()}`));
            push('QF', next?.[1]);
            push('SF', next?.[2]);
            if (nextWinner === 0 && next?.[2]?.[0]?.name) {
              sel.push(`1ST:${next[2][0].name.trim()}`);
              if (next?.[2]?.[1]?.name) sel.push(`2ND:${next[2][1].name.trim()}`);
            } else if (nextWinner === 1 && next?.[2]?.[1]?.name) {
              sel.push(`1ST:${next[2][1].name.trim()}`);
              if (next?.[2]?.[0]?.name) sel.push(`2ND:${next[2][0].name.trim()}`);
            }
            return sel;
          })()
        );
        lastSavedRef.current = currentKey;
        hydratedRef.current = true;
      } catch (e) {
        // ignore
      }
    };
    if (
      !loading &&
      league_id &&
      typeof questionId !== 'undefined' &&
      userId &&
      !hydratedRef.current
    ) {
      hydrate();
    }
  }, [
    loading,
    league_id,
    questionId,
    userId,
    apiBase,
    teams,
    setTeams,
    setFinalWinnerIndex,
    hydratedRef,
    lastSavedRef,
  ]);
};

export default TournamentBracketAOV;
