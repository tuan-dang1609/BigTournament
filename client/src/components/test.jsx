import React, { useState } from 'react';

// Khởi tạo mẫu cho từng schema
const initialLeague = {
  league_id: '',
  organizer_id: '',
  name: '',
  device: [],
  season_number: '',
  game_name: '',
  game_short: '',
  banner_image_url: '',
  players_per_team: 1,
  description: '',
  skill_levels: [],
  school_allowed: [],
  rules: [],
};

const initialSeason = {
  season_number: '',
  time_start: '',
  bracket_id: '',
  time_end: '',
  registration_start: '',
  registration_end: '',
  current_team_count: 0,
  total_prize_pool: 0,
  max_registration: 0,
  created_at: '',
  updated_at: '',
  header_image_url: '',
  thumbnail_url: '',
  season_name: '',
  checkin_start: '',
  checkin_end: '',
};

const initialMilestone = {
  id: '',
  season_id: '',
  title: '',
  date: '',
  subtitle: '',
  content: '',
};

const initialRule = {
  title: '',
  content: '',
};

const initialPrizepool = {
  place: '',
  prize: '',
};

const initialNavigation = {
  name: '',
  href: '',
};

const initialPlayer = {
  discordID: '',
  ign: [],
  classTeam: '',
  team: {
    name: '',
    logoTeam: '',
    shortName: '',
  },
  usernameregister: '',
  logoUrl: '',
  game: '',
  isCheckedin: false,
};

const initialMatchGroup = {
  id: '',
  matchIds: [],
};

function TournamentForm() {
  const [form, setForm] = useState({
    league: { ...initialLeague },
    season: { ...initialSeason },
    milestones: [],
    prizepool: [],
    navigation: [],
    players: [],
    matches: {}, // Map dạng { day1: [matchGroup, ...] }
  });

  // Xử lý input cho object
  const handleChange = (section, field, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // Xử lý input cho array trong object
  const handleArrayChange = (section, field, index, value) => {
    setForm((prev) => {
      const arr = [...prev[section][field]];
      arr[index] = value;
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: arr,
        },
      };
    });
  };

  // Thêm phần tử cho array
  const handleAddArrayItem = (section, field, initial) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: [...prev[section][field], initial],
      },
    }));
  };

  // Xóa phần tử khỏi array
  const handleRemoveArrayItem = (section, field, index) => {
    setForm((prev) => {
      const arr = [...prev[section][field]];
      arr.splice(index, 1);
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: arr,
        },
      };
    });
  };

  // Xử lý array ngoài object (milestones, prizepool, navigation, players)
  const handleArrayChangeRoot = (field, index, value) => {
    setForm((prev) => {
      const arr = [...prev[field]];
      arr[index] = value;
      return {
        ...prev,
        [field]: arr,
      };
    });
  };

  const handleAddArrayItemRoot = (field, initial) => {
    setForm((prev) => ({
      ...prev,
      [field]: [...prev[field], initial],
    }));
  };

  const handleRemoveArrayItemRoot = (field, index) => {
    setForm((prev) => {
      const arr = [...prev[field]];
      arr.splice(index, 1);
      return {
        ...prev,
        [field]: arr,
      };
    });
  };

  // Xử lý matches (Map dạng { day1: [matchGroup, ...] })
  const handleAddMatchDay = (day) => {
    setForm((prev) => ({
      ...prev,
      matches: {
        ...prev.matches,
        [day]: [],
      },
    }));
  };

  const handleAddMatchGroup = (day) => {
    setForm((prev) => ({
      ...prev,
      matches: {
        ...prev.matches,
        [day]: [...(prev.matches[day] || []), { ...initialMatchGroup }],
      },
    }));
  };

  const handleMatchGroupChange = (day, idx, value) => {
    setForm((prev) => {
      const arr = [...(prev.matches[day] || [])];
      arr[idx] = value;
      return {
        ...prev,
        matches: {
          ...prev.matches,
          [day]: arr,
        },
      };
    });
  };

  const handleRemoveMatchGroup = (day, idx) => {
    setForm((prev) => {
      const arr = [...(prev.matches[day] || [])];
      arr.splice(idx, 1);
      return {
        ...prev,
        matches: {
          ...prev.matches,
          [day]: arr,
        },
      };
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Nhập thông tin giải đấu</h2>
      <h3 className="text-xl font-semibold mb-4">League</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-1 font-medium">League ID (String)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="text"
            value={form.league.league_id}
            onChange={(e) => handleChange('league', 'league_id', e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Organizer ID (String)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="text"
            value={form.league.organizer_id}
            onChange={(e) => handleChange('league', 'organizer_id', e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Name (String)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="text"
            value={form.league.name}
            onChange={(e) => handleChange('league', 'name', e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Season Number (String)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="text"
            value={form.league.season_number}
            onChange={(e) => handleChange('league', 'season_number', e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Game Name (String)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="text"
            value={form.league.game_name}
            onChange={(e) => handleChange('league', 'game_name', e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Game Short (String)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="text"
            value={form.league.game_short}
            onChange={(e) => handleChange('league', 'game_short', e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Banner Image URL (String)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="text"
            value={form.league.banner_image_url}
            onChange={(e) => handleChange('league', 'banner_image_url', e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Header Image URL (String)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="text"
            value={form.league.header_image_url}
            onChange={(e) => handleChange('league', 'header_image_url', e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Players Per Team (Number)</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={form.league.players_per_team}
            onChange={(e) => handleChange('league', 'players_per_team', Number(e.target.value))}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block mb-1 font-medium">Description (String)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="text"
            value={form.league.description}
            onChange={(e) => handleChange('league', 'description', e.target.value)}
          />
        </div>
      </div>
      {/* Array: device */}
      <div className="mb-4">
        <label className="block mb-1 font-medium">Device:</label>
        <div className="flex flex-wrap gap-2">
          {form.league.device.map((d, i) => (
            <span key={i} className="flex items-center gap-1">
              <input
                className="border rounded px-2 py-1"
                value={d}
                onChange={(e) => handleArrayChange('league', 'device', i, e.target.value)}
              />
              <button
                type="button"
                className="text-red-500 px-2"
                onClick={() => handleRemoveArrayItem('league', 'device', i)}
              >
                X
              </button>
            </span>
          ))}
          <button
            type="button"
            className="bg-blue-500 text-white px-2 rounded"
            onClick={() => handleAddArrayItem('league', 'device', '')}
          >
            Thêm Device
          </button>
        </div>
      </div>
      {/* Array: skill_levels */}
      <div className="mb-4">
        <label className="block mb-1 font-medium">Skill Levels:</label>
        <div className="flex flex-wrap gap-2">
          {form.league.skill_levels.map((d, i) => (
            <span key={i} className="flex items-center gap-1">
              <input
                className="border rounded px-2 py-1"
                value={d}
                onChange={(e) => handleArrayChange('league', 'skill_levels', i, e.target.value)}
              />
              <button
                type="button"
                className="text-red-500 px-2"
                onClick={() => handleRemoveArrayItem('league', 'skill_levels', i)}
              >
                X
              </button>
            </span>
          ))}
          <button
            type="button"
            className="bg-blue-500 text-white px-2 rounded"
            onClick={() => handleAddArrayItem('league', 'skill_levels', '')}
          >
            Thêm Skill Level
          </button>
        </div>
      </div>
      {/* Array: school_allowed */}
      <div className="mb-4">
        <label className="block mb-1 font-medium">School Allowed:</label>
        <div className="flex flex-wrap gap-2">
          {form.league.school_allowed.map((d, i) => (
            <span key={i} className="flex items-center gap-1">
              <input
                className="border rounded px-2 py-1"
                value={d}
                onChange={(e) => handleArrayChange('league', 'school_allowed', i, e.target.value)}
              />
              <button
                type="button"
                className="text-red-500 px-2"
                onClick={() => handleRemoveArrayItem('league', 'school_allowed', i)}
              >
                X
              </button>
            </span>
          ))}
          <button
            type="button"
            className="bg-blue-500 text-white px-2 rounded"
            onClick={() => handleAddArrayItem('league', 'school_allowed', '')}
          >
            Thêm School
          </button>
        </div>
      </div>
      {/* Array: rules */}
      <div className="mb-4">
        <label className="block mb-1 font-medium">Rules:</label>
        <div className="space-y-2">
          {form.league.rules.map((rule, i) => (
            <div key={i} className="border rounded p-2 ">
              <label className="block mb-1">Title</label>
              <input
                className="w-full border rounded px-2 py-1 mb-2"
                value={rule.title}
                onChange={(e) => {
                  const newRule = { ...rule, title: e.target.value };
                  handleArrayChange('league', 'rules', i, newRule);
                }}
              />
              <label className="block mb-1">Content</label>
              <textarea
                className="w-full border rounded px-2 py-1"
                value={rule.content}
                onChange={(e) => {
                  const newRule = { ...rule, content: e.target.value };
                  handleArrayChange('league', 'rules', i, newRule);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Prevent form submission, allow newline
                    e.stopPropagation();
                  }
                }}
              />
              <button
                type="button"
                className="text-red-500 px-2 mt-1"
                onClick={() => handleRemoveArrayItem('league', 'rules', i)}
              >
                X
              </button>
            </div>
          ))}
          <button
            type="button"
            className="bg-blue-500 text-white px-2 rounded"
            onClick={() => handleAddArrayItem('league', 'rules', { ...initialRule })}
          >
            Thêm Rule
          </button>
        </div>
      </div>

      <h3>Season</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-1 font-medium">Season Number (String)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="text"
            value={form.season.season_number}
            onChange={(e) => handleChange('season', 'season_number', e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Time Start (Date)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="datetime-local"
            value={form.season.time_start}
            onChange={(e) => handleChange('season', 'time_start', e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Bracket ID (String)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="text"
            value={form.season.bracket_id}
            onChange={(e) => handleChange('season', 'bracket_id', e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Time End (Date)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="datetime-local"
            value={form.season.time_end}
            onChange={(e) => handleChange('season', 'time_end', e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Registration Start (Date)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="datetime-local"
            value={form.season.registration_start}
            onChange={(e) => handleChange('season', 'registration_start', e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Registration End (Date)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="datetime-local"
            value={form.season.registration_end}
            onChange={(e) => handleChange('season', 'registration_end', e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Current Team Count (Number)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="number"
            value={form.season.current_team_count}
            onChange={(e) => handleChange('season', 'current_team_count', Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Total Prize Pool (Number)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="number"
            value={form.season.total_prize_pool}
            onChange={(e) => handleChange('season', 'total_prize_pool', Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Max Registration (Number)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="number"
            value={form.season.max_registration}
            onChange={(e) => handleChange('season', 'max_registration', Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Created At (Date)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="datetime-local"
            value={form.season.created_at}
            onChange={(e) => handleChange('season', 'created_at', e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Updated At (Date)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="datetime-local"
            value={form.season.updated_at}
            onChange={(e) => handleChange('season', 'updated_at', e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Header Image URL (String)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="text"
            value={form.season.header_image_url}
            onChange={(e) => handleChange('season', 'header_image_url', e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Thumbnail URL (String)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="text"
            value={form.season.thumbnail_url}
            onChange={(e) => handleChange('season', 'thumbnail_url', e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Season Name (String)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="text"
            value={form.season.season_name}
            onChange={(e) => handleChange('season', 'season_name', e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Checkin Start (Date)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="datetime-local"
            value={form.season.checkin_start}
            onChange={(e) => handleChange('season', 'checkin_start', e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Checkin End (Date)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="datetime-local"
            value={form.season.checkin_end}
            onChange={(e) => handleChange('season', 'checkin_end', e.target.value)}
          />
        </div>
      </div>

      <h3>Milestones</h3>
      {form.milestones.map((m, i) => (
        <div key={i} className="border rounded p-2 mb-2 bg-gray-50">
          <label className="block mb-1">ID (String)</label>
          <input
            className="w-full border rounded px-2 py-1 mb-2"
            type="text"
            value={m.id}
            onChange={(e) => {
              const newMilestone = { ...m, id: e.target.value };
              handleArrayChangeRoot('milestones', i, newMilestone);
            }}
          />
          <label className="block mb-1">Season ID (String)</label>
          <input
            className="w-full border rounded px-2 py-1 mb-2"
            type="text"
            value={m.season_id}
            onChange={(e) => {
              const newMilestone = { ...m, season_id: e.target.value };
              handleArrayChangeRoot('milestones', i, newMilestone);
            }}
          />
          <label className="block mb-1">Title (String)</label>
          <input
            className="w-full border rounded px-2 py-1 mb-2"
            type="text"
            value={m.title}
            onChange={(e) => {
              const newMilestone = { ...m, title: e.target.value };
              handleArrayChangeRoot('milestones', i, newMilestone);
            }}
          />
          <label className="block mb-1">Date (Date)</label>
          <input
            className="w-full border rounded px-2 py-1 mb-2"
            type="datetime-local"
            value={m.date}
            onChange={(e) => {
              const newMilestone = { ...m, date: e.target.value };
              handleArrayChangeRoot('milestones', i, newMilestone);
            }}
          />
          <label className="block mb-1">Subtitle (String)</label>
          <input
            className="w-full border rounded px-2 py-1 mb-2"
            type="text"
            value={m.subtitle}
            onChange={(e) => {
              const newMilestone = { ...m, subtitle: e.target.value };
              handleArrayChangeRoot('milestones', i, newMilestone);
            }}
          />
          <label className="block mb-1">Content (String)</label>
          <textarea
            className="w-full border rounded px-2 py-1 mb-2"
            value={m.content}
            onChange={(e) => {
              const newMilestone = { ...m, content: e.target.value };
              handleArrayChangeRoot('milestones', i, newMilestone);
            }}
          />
          <button
            type="button"
            className="text-red-500 px-2"
            onClick={() => handleRemoveArrayItemRoot('milestones', i)}
          >
            X
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => handleAddArrayItemRoot('milestones', { ...initialMilestone })}
      >
        Thêm Milestone
      </button>

      <h3>Prizepool</h3>
      {form.prizepool.map((p, i) => (
        <div key={i} className="border rounded p-2 mb-2 bg-gray-50">
          <label className="block mb-1">Place (String)</label>
          <input
            className="w-full border rounded px-2 py-1 mb-2"
            type="text"
            value={p.place}
            onChange={(e) => {
              const newPrize = { ...p, place: e.target.value };
              handleArrayChangeRoot('prizepool', i, newPrize);
            }}
          />
          <label className="block mb-1">Prize (Mixed: String/Number)</label>
          <input
            className="w-full border rounded px-2 py-1 mb-2"
            type="text"
            value={p.prize}
            onChange={(e) => {
              const newPrize = { ...p, prize: e.target.value };
              handleArrayChangeRoot('prizepool', i, newPrize);
            }}
          />
          <button
            type="button"
            className="text-red-500 px-2"
            onClick={() => handleRemoveArrayItemRoot('prizepool', i)}
          >
            X
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => handleAddArrayItemRoot('prizepool', { ...initialPrizepool })}
      >
        Thêm Prize
      </button>

      <h3>Navigation</h3>
      {form.navigation.map((n, i) => (
        <div key={i}>
          <input
            placeholder="Name"
            value={n.name}
            onChange={(e) => {
              const newNav = { ...n, name: e.target.value };
              handleArrayChangeRoot('navigation', i, newNav);
            }}
          />
          <input
            placeholder="Href"
            value={n.href}
            onChange={(e) => {
              const newNav = { ...n, href: e.target.value };
              handleArrayChangeRoot('navigation', i, newNav);
            }}
          />
          <button type="button" onClick={() => handleRemoveArrayItemRoot('navigation', i)}>
            X
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => handleAddArrayItemRoot('navigation', { ...initialNavigation })}
      >
        Thêm Navigation
      </button>

      <h3>Players</h3>
      {form.players.map((p, i) => (
        <div key={i} className="border rounded p-2 mb-2 bg-gray-50">
          <label className="block mb-1">DiscordID (String)</label>
          <input
            className="w-full border rounded px-2 py-1 mb-2"
            type="text"
            value={p.discordID}
            onChange={(e) => {
              const newPlayer = { ...p, discordID: e.target.value };
              handleArrayChangeRoot('players', i, newPlayer);
            }}
          />
          <label className="block mb-1">IGN (Array[String])</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {p.ign.map((ign, idx) => (
              <span key={idx} className="flex items-center gap-1">
                <input
                  className="border rounded px-2 py-1"
                  type="text"
                  value={ign}
                  onChange={(e) => {
                    const newIgn = [...p.ign];
                    newIgn[idx] = e.target.value;
                    const newPlayer = { ...p, ign: newIgn };
                    handleArrayChangeRoot('players', i, newPlayer);
                  }}
                />
                <button
                  type="button"
                  className="text-red-500 px-2"
                  onClick={() => {
                    const newIgn = [...p.ign];
                    newIgn.splice(idx, 1);
                    const newPlayer = { ...p, ign: newIgn };
                    handleArrayChangeRoot('players', i, newPlayer);
                  }}
                >
                  X
                </button>
              </span>
            ))}
            <button
              type="button"
              className="bg-blue-500 text-white px-2 rounded"
              onClick={() => {
                const newIgn = [...p.ign, ''];
                const newPlayer = { ...p, ign: newIgn };
                handleArrayChangeRoot('players', i, newPlayer);
              }}
            >
              Thêm IGN
            </button>
          </div>
          <label className="block mb-1">ClassTeam (String)</label>
          <input
            className="w-full border rounded px-2 py-1 mb-2"
            type="text"
            value={p.classTeam}
            onChange={(e) => {
              const newPlayer = { ...p, classTeam: e.target.value };
              handleArrayChangeRoot('players', i, newPlayer);
            }}
          />
          <label className="block mb-1">Team Name (String)</label>
          <input
            className="w-full border rounded px-2 py-1 mb-2"
            type="text"
            value={p.team.name}
            onChange={(e) => {
              const newTeam = { ...p.team, name: e.target.value };
              const newPlayer = { ...p, team: newTeam };
              handleArrayChangeRoot('players', i, newPlayer);
            }}
          />
          <label className="block mb-1">Team Logo (String)</label>
          <input
            className="w-full border rounded px-2 py-1 mb-2"
            type="text"
            value={p.team.logoTeam}
            onChange={(e) => {
              const newTeam = { ...p.team, logoTeam: e.target.value };
              const newPlayer = { ...p, team: newTeam };
              handleArrayChangeRoot('players', i, newPlayer);
            }}
          />
          <label className="block mb-1">Team ShortName (String)</label>
          <input
            className="w-full border rounded px-2 py-1 mb-2"
            type="text"
            value={p.team.shortName}
            onChange={(e) => {
              const newTeam = { ...p.team, shortName: e.target.value };
              const newPlayer = { ...p, team: newTeam };
              handleArrayChangeRoot('players', i, newPlayer);
            }}
          />
          <label className="block mb-1">Username Register (String)</label>
          <input
            className="w-full border rounded px-2 py-1 mb-2"
            type="text"
            value={p.usernameregister}
            onChange={(e) => {
              const newPlayer = { ...p, usernameregister: e.target.value };
              handleArrayChangeRoot('players', i, newPlayer);
            }}
          />
          <label className="block mb-1">Logo URL (String)</label>
          <input
            className="w-full border rounded px-2 py-1 mb-2"
            type="text"
            value={p.logoUrl}
            onChange={(e) => {
              const newPlayer = { ...p, logoUrl: e.target.value };
              handleArrayChangeRoot('players', i, newPlayer);
            }}
          />
          <label className="block mb-1">Game (String)</label>
          <input
            className="w-full border rounded px-2 py-1 mb-2"
            type="text"
            value={p.game}
            onChange={(e) => {
              const newPlayer = { ...p, game: e.target.value };
              handleArrayChangeRoot('players', i, newPlayer);
            }}
          />
          <label className="block mb-1">Checked In (Boolean)</label>
          <input
            type="checkbox"
            checked={p.isCheckedin}
            onChange={(e) => {
              const newPlayer = { ...p, isCheckedin: e.target.checked };
              handleArrayChangeRoot('players', i, newPlayer);
            }}
          />
          <button
            type="button"
            className="text-red-500 px-2 mt-2"
            onClick={() => handleRemoveArrayItemRoot('players', i)}
          >
            X
          </button>
        </div>
      ))}
      <button type="button" onClick={() => handleAddArrayItemRoot('players', { ...initialPlayer })}>
        Thêm Player
      </button>

      <h3>Matches</h3>
      {/* Thêm ngày thi đấu */}
      <div>
        <input placeholder="Tên ngày (ví dụ: day1)" id="matchDayInput" />
        <button
          type="button"
          onClick={() => {
            const day = document.getElementById('matchDayInput').value;
            if (day && !form.matches[day]) handleAddMatchDay(day);
          }}
        >
          Thêm Ngày
        </button>
      </div>
      {/* Hiển thị từng ngày */}
      {Object.keys(form.matches).map((day) => (
        <div key={day} style={{ border: '1px solid #ccc', margin: 8, padding: 8 }}>
          <h4>{day}</h4>
          {form.matches[day].map((mg, i) => (
            <div key={i}>
              <input
                placeholder="MatchGroup ID"
                value={mg.id}
                onChange={(e) => {
                  const newMG = { ...mg, id: e.target.value };
                  handleMatchGroupChange(day, i, newMG);
                }}
              />
              {/* matchIds array */}
              <div>
                <label>Match IDs:</label>
                {mg.matchIds.map((mid, idx) => (
                  <span key={idx}>
                    <input
                      value={mid}
                      onChange={(e) => {
                        const newMatchIds = [...mg.matchIds];
                        newMatchIds[idx] = e.target.value;
                        const newMG = { ...mg, matchIds: newMatchIds };
                        handleMatchGroupChange(day, i, newMG);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newMatchIds = [...mg.matchIds];
                        newMatchIds.splice(idx, 1);
                        const newMG = { ...mg, matchIds: newMatchIds };
                        handleMatchGroupChange(day, i, newMG);
                      }}
                    >
                      X
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newMatchIds = [...mg.matchIds, ''];
                    const newMG = { ...mg, matchIds: newMatchIds };
                    handleMatchGroupChange(day, i, newMG);
                  }}
                >
                  Thêm MatchID
                </button>
              </div>
              <button type="button" onClick={() => handleRemoveMatchGroup(day, i)}>
                X MatchGroup
              </button>
            </div>
          ))}
          <button type="button" onClick={() => handleAddMatchGroup(day)}>
            Thêm MatchGroup
          </button>
        </div>
      ))}

      <h3>Xem trước JSON</h3>
      <pre
        style={{
          background: '#eee',
          padding: 12,
          maxHeight: 400,
          overflow: 'auto',
          whiteSpace: 'pre-line',
        }}
      >
        {JSON.stringify(form, null, 2)}
      </pre>
      <div className="text-sm text-gray-600 mb-4">
        * Khi hiển thị nội dung rule, hãy dùng CSS <code>white-space: pre-line</code> để xuống dòng
        đúng như bạn nhập.
      </div>

      {/* Hiển thị trực tiếp rule.content để kiểm tra xuống dòng */}
      <h4 className="mt-4 font-semibold">Preview Rule Content (xuống dòng thực tế):</h4>
      {form.league.rules.map((rule, i) => (
        <div
          key={i}
          style={{ background: '#f9f9f9', padding: 8, marginBottom: 8, borderRadius: 4 }}
        >
          <div className="font-bold mb-1">{rule.title}</div>
          <div style={{ whiteSpace: 'pre-line', color: '#333' }}>{rule.content}</div>
        </div>
      ))}
      <button
        style={{
          marginTop: 16,
          padding: '8px 16px',
          background: '#1976d2',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
        }}
        onClick={async () => {
          try {
            const res = await fetch('https://bigtournament-1.onrender.com/api/auth/dcn-league', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error('Server trả về lỗi: ' + res.status);
            const data = await res.json();
            alert('Gửi thành công!\n' + JSON.stringify(data, null, 2));
          } catch (err) {
            alert('Gửi thất bại: ' + err.message);
          }
        }}
      >
        Gửi lên server
      </button>
    </div>
  );
}

export default TournamentForm;
