import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { signOut } from '../../redux/user/userSlice.js';
const LeagueHeader = ({
  me,
  league,
  league_id,
  startTime,
  endTime,
  currentUser,
  isMenuOpen,
  setIsMenuOpen,
  getNavigation,
  MyNavbar2,
  game,
  // Optional: show pick'em stats (only provided by pickem.jsx pages)
  pickemStats,
}) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const hidePickemCTAs = pathname.includes('/pickem');
  // If user navigates to a /bootcamp page but this league is not a bootcamp,
  // we'll render an informative message instead of redirecting.
  const [registerPhase, setRegisterPhase] = useState('idle');
  const [joinCountdown, setJoinCountdown] = useState('');
  const [isCheckinPhase, setIsCheckinPhase] = useState(false);
  const [myAnswerMissing, setMyAnswerMissing] = useState(false);
  const dispatch = useDispatch();
  const [showBootcampModal, setShowBootcampModal] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [useOther, setUseOther] = useState(false);
  const [otherGameName, setOtherGameName] = useState('');
  const [otherTagLine, setOtherTagLine] = useState('');
  const [selectedRiot, setSelectedRiot] = useState('');

  // If user is on a bootcamp path but this league is not a bootcamp, show a message.
  // Only show after `league` is defined to avoid flashing during async load.
  if (pathname.includes('/bootcamp/') && league && !league.isBootcamp) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg text-center bg-white shadow-md rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-2">Trang Bootcamp không khả dụng</h2>
          <p className="text-gray-700 mb-4">Giải này không có chế độ Bootcamp.</p>
          <Link
            to={`/${game}/${league_id}`}
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded"
          >
            Quay lại trang giải đấu
          </Link>
        </div>
      </div>
    );
  }

  const handleValidateRiot = async (gameName, tagLine) => {
    setValidationResult({ loading: true });
    try {
      const url = `https://bigtournament-1.onrender.com/api/auth/tft/${encodeURIComponent(
        gameName
      )}/${encodeURIComponent(tagLine)}`;
      const res = await axios.get(url, { validateStatus: () => true });
      const data = res.data || {};
      // If API returned structured 404 error, treat as invalid
      let result;
      if (data?.error?.status?.status_code === 404) {
        result = { ok: false, error: data.error.status.message };
      } else {
        // Consider valid when response does NOT have tier and rank
        const isValid = !data.tier && !data.rank;
        result = { ok: isValid, data, error: isValid ? undefined : 'Riot ID không hợp lệ' };
      }
      setValidationResult(result);
      return result;
    } catch (err) {
      const result = { ok: false, error: err.message };
      setValidationResult(result);
      return result;
    } finally {
      setValidating(false);
    }
  };

  const handleAutoRegister = async (riotIdParam) => {
    try {
      // If this handler was called as an event handler (onClick={handleAutoRegister}),
      // the first arg will be the click event — ignore it.
      if (
        riotIdParam &&
        typeof riotIdParam === 'object' &&
        (riotIdParam.nativeEvent || (riotIdParam.target && riotIdParam.target.nodeType))
      ) {
        riotIdParam = undefined;
      }
      const riotToUse = riotIdParam || me.riotID || '';
      const formData = {
        shortName: '',
        logoUrl: me.profilePicture || '', // Avatar cá nhân
        color: '',
        classTeam: me.className || '',
        games: ['Teamfight Tactics'],
        gameMembers: {
          'Teamfight Tactics': [riotToUse],
        },
        usernameregister: me._id,
        discordID: me.discordID || '',
        teamName: me.team?.name || '', // 👈 thêm vào đây cho chuẩn
        shortName: me.team?.shortName || '', // 👈 thêm nếu có
        // Không cần "team: { name, logoTeam }" nữa
      };

      // Nếu muốn tự chọn logo team riêng (khác avatar cá nhân):
      if (me.team?.logoTeam) {
        formData.teamLogo = me.team.logoTeam; // 👈 thêm trường mới nếu cần
      }

      const response = await axios.post(
        `https://bigtournament-1.onrender.com/api/auth/register/${league_id}`,
        formData
      );
      console.log('✅ Server phản hồi:', response.data);

      window.location.reload(); // Reload lại nếu cần
    } catch (err) {
      console.error('❌ Error auto registering:', err);
      alert('❌ Đăng ký thất bại!');
    }
  };
  const handleUnregister = async () => {
    try {
      const res = await axios.delete(
        `https://bigtournament-1.onrender.com/api/auth/unregister/${league?.league?.league_id}`,
        {
          data: {
            usernameregister: currentUser._id,
          },
        }
      );

      window.location.reload();
    } catch (err) {
      console.error('❌ Lỗi khi hủy đăng ký:', err);
      alert('Có lỗi xảy ra khi hủy đăng ký.');
    }
  };

  useEffect(() => {
    if (!league?.season?.checkin_start || !league?.season?.checkin_end) return;

    const checkinStart = new Date(league.season.checkin_start);
    const checkinEnd = new Date(league.season.checkin_end);
    const now = new Date();

    if (now >= checkinStart && now <= checkinEnd) {
      setIsCheckinPhase(true);
    } else {
      setIsCheckinPhase(false);
    }
  }, [league]);
  useEffect(() => {
    if (!league || !startTime) return;

    const regStart = new Date(league.season.registration_start);
    const regEnd = new Date(league.season.registration_end);

    const updateCountdown = () => {
      const now = new Date();
      let diff;

      if (now < regStart) {
        diff = regStart - now;
        setRegisterPhase('before');
      } else if (now >= regStart && now <= regEnd) {
        diff = regEnd - now;
        setRegisterPhase('during');
      } else {
        setRegisterPhase('after');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setJoinCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [league, startTime]);

  // Check if the current user has answers for this league to influence Top display
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        // Only check on Pick'em pages where pickemStats is shown
        if (!pickemStats || !league_id || !currentUser?._id) {
          if (!cancelled) setMyAnswerMissing(false);
          return;
        }
        const base = 'https://bigtournament-1.onrender.com/api/auth';
        const url = `${base}/${league_id}/myanswer`;
        const res = await axios.get(url, {
          params: { userId: currentUser._id },
          validateStatus: () => true, // we handle 404 manually
          withCredentials: true,
        });
        if (!cancelled) setMyAnswerMissing(res.status === 404);
      } catch (e) {
        if (!cancelled) setMyAnswerMissing(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [pickemStats, league_id, currentUser?._id]);
  const currentPlayer = league?.players?.find(
    (p) => String(p.usernameregister) === String(currentUser?._id)
  );

  const isCheckedin = currentPlayer?.isCheckedin === true;

  const handleCheckin = async () => {
    try {
      const res = await fetch(`https://bigtournament-1.onrender.com/api/auth/league/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          league_id: league.league.league_id,
          game_short: league.league.game_short,
          userId: currentUser._id,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        window.location.reload(); // hoặc gọi lại API lấy league mới
      } else {
        alert('❌ Check-in thất bại: ' + result.message);
      }
    } catch (err) {
      console.error('❌ Check-in error:', err);
      alert('Lỗi khi check-in.');
    }
  };

  // Clear validation state while user is editing or switching options.
  React.useEffect(() => {
    setValidationResult(null);
  }, [useOther, otherGameName, otherTagLine]);

  return (
    <>
      <header>
        <div
          className="inset-0 bg-cover bg-center xl:aspect-[4/1] md:aspect-[3/1] sm:aspect-[2.4/1] aspect-[1.2/1]"
          style={{
            backgroundImage: `linear-gradient(0deg, rgb(6, 6, 6) 0%, rgba(6, 6, 6, 0.6) 50%, rgba(6, 6, 6, 0.4) 100%), url(${league.season.header_image_url})`,
          }}
          aria-label="Competition background"
        >
          <div className="sm:relative z-10 h-full items-center flex sm:flex-row flex-col justify-center px-2 sm:text-left  text-center">
            <div className="sm:mb-0 mb-4 sm:absolute relative md:left-5 left-0 sm:bottom-10 text-sm md:text-base text-white font-semibold pl-2 xl:pl-8">
              {!currentUser ? (
                <div className="text-white mb-9">
                  <p>
                    Ấn vào đây để{' '}
                    <a href="/signin" className="hover:underline text-green-400">
                      đăng nhập
                    </a>
                  </p>
                </div>
              ) : (
                <div className="flex flex-row items-center sm:justify-start justify-center mb-9">
                  <span>Chào mừng quay lại, {currentUser.riotID}</span>
                  <button
                    onClick={async () => {
                      try {
                        await fetch('https://bigtournament-1.onrender.com/api/auth/signout', {
                          credentials: 'include',
                        });
                        dispatch(signOut()); // xóa currentUser trong Redux
                      } catch (err) {
                        console.error('Sign out error:', err);
                        alert('Lỗi khi đăng xuất.');
                      }
                    }}
                    className=" text-red-400 hover:underline px-3 py-1 rounded-md"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
              <div className="text-sm font-bold mb-2 uppercase">
                <p className="text-left">
                  <span className="text-[#00ff5c]">
                    {(() => {
                      const now = new Date();
                      const start = new Date(startTime);
                      const end = new Date(endTime);

                      if (now < start) {
                        return <span className="text-[#00ff5c]">SẮP TỚI</span>;
                      } else if (now >= start && now <= end) {
                        return <span className="text-yellow-400">ĐANG DIỄN RA</span>;
                      } else {
                        return <span className="text-red-500 font-bold">KẾT THÚC</span>;
                      }
                    })()}
                  </span>{' '}
                  •{' '}
                  {new Date(startTime).toLocaleString('en-GB', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    timeZoneName: 'short',
                  })}
                </p>
              </div>

              <h1 className="md:text-[24px] text-[24px] xl:text-[40px] md:text-5xl text-left font-extrabold text-white sm:mb-4">
                {league.league.name}
              </h1>

              <div className="text-sm text-gray-300">
                Tổ chức bởi{' '}
                <span className="text-white font-semibold">{league.league.organizer_id}</span>
              </div>
            </div>

            {/* Header right stats: only show on Pick'em pages when pickemStats is provided */}
            {pickemStats && (
              <div className="sm:absolute relative sm:right-0 sm:bottom-10 sm:mr-4 xl:mr-8 text-white font-semibold">
                {pickemStats?.userName && (
                  <div className="mb-2 xl:text-right text-left">
                    <span className="uppercase text-[14px] tracking-wide text-gray-300">
                      Đang xem:
                    </span>
                    <span className="ml-2 text-base font-extrabold">{pickemStats.userName}</span>
                  </div>
                )}
                <div className="flex flex-row divide-x divide-gray-700 rounded-lg overflow-hidden bg-black/30 border border-gray-700">
                  {/* Score box */}
                  <div className="px-6 py-4 flex flex-col items-center justify-center min-w-[140px]">
                    <div className="text-3xl md:text-4xl font-extrabold leading-none">
                      {Number(pickemStats.score || 0)}{' '}
                      <span className="text-gray-300 text-xl">đ</span>
                    </div>
                    <div className="uppercase text-xs tracking-wide text-gray-300 mt-1">
                      Điểm số
                    </div>
                  </div>
                  {/* Top/Rank box */}
                  <div className="px-6 py-4 flex flex-col items-center justify-center min-w-[160px]">
                    <div className="text-3xl md:text-4xl font-extrabold leading-none">
                      {(() => {
                        // If we detected no answers for this user (404), show unknown rank
                        if (myAnswerMissing) {
                          return 'Top ?';
                        }
                        const rank = Number(pickemStats?.rank);
                        if (Number.isFinite(rank) && rank > 0) {
                          return `Top ${Math.floor(rank)}`; // Show exact rank
                        }
                        // Fallback to percent if rank not provided
                        const raw = pickemStats?.topPercent;
                        const valid = Number.isFinite(raw) && raw > 0;
                        if (!valid) return 'Top —';
                        const bounded = Math.max(1, Math.min(100, Math.round(raw)));
                        return `Top ${bounded}%`;
                      })()}
                    </div>
                    <div className="uppercase text-xs tracking-wide text-gray-300 mt-1">
                      Xếp hạng
                    </div>
                  </div>
                </div>
              </div>
            )}

            {registerPhase === 'before' && !hidePickemCTAs && (
              <div className="sm:absolute relative px-4 md:px-8 sm:right-0 sm:bottom-10 text-sm md:text-base text-white font-semibold text-center sm:text-right">
                <div className="mb-2">
                  Mở form sau: <span className="text-orange-500">{joinCountdown}</span>
                </div>

                {!currentUser ? (
                  <Link to="/signin">
                    <button className="bg-gradient-to-r from-[#f9febc] to-[#a8eabb] text-black font-bold px-4 py-2 rounded-md hover:opacity-90 transition duration-200">
                      Đăng nhập để tham gia
                    </button>
                  </Link>
                ) : (
                  <Link to="https://discord.gg/crP48bD7" target="_blank" rel="noopener noreferrer">
                    <button className="bg-gradient-to-r from-[#f9febc] to-[#a8eabb] text-black font-bold px-4 py-2 rounded-md hover:opacity-90 transition duration-200">
                      Discord THPT Phú Nhuận
                    </button>
                  </Link>
                )}
              </div>
            )}

            {registerPhase === 'during' && !hidePickemCTAs && (
              <div className="sm:absolute relative px-4 md:px-8 right-0 bottom-10 text-sm md:text-base text-white font-semibold text-right">
                <div className="mb-2 sm:mt-0 mt-12">
                  Thời gian còn lại: <span className="text-orange-500">{joinCountdown}</span>
                </div>

                {!currentUser ? (
                  <Link to="/signin">
                    <button className="bg-gradient-to-r from-[#f9febc] to-[#a8eabb] text-black font-bold px-4 py-2 rounded-md hover:opacity-90 transition duration-200">
                      Đăng nhập để tham gia
                    </button>
                  </Link>
                ) : league?.isBootcamp && pathname.includes('/bootcamp/') ? (
                  <div
                    className={`flex ${
                      currentPlayer
                        ? 'sm:justify-end justify-center gap-2'
                        : 'sm:justify-end justify-center'
                    }`}
                  >
                    {currentPlayer && (
                      <button
                        onClick={handleUnregister}
                        className="bg-red-500 text-white font-bold px-4 py-2 rounded-md hover:bg-red-600 transition duration-200"
                      >
                        Hủy đăng ký
                      </button>
                    )}
                    <button
                      onClick={() => {
                        // Open bootcamp modal and prefill selection based on previous registration
                        const linked = me?.riotID || '';
                        setValidationResult(null);
                        // If user already registered in this league, prefill from their registration
                        if (
                          currentPlayer &&
                          Array.isArray(currentPlayer.ign) &&
                          currentPlayer.ign.length > 0
                        ) {
                          const regIgn = currentPlayer.ign[0] || '';
                          if (regIgn === linked) {
                            // Registered IGN matches linked RiotID -> keep linked selected
                            setSelectedRiot(linked);
                            setUseOther(false);
                            setShowBootcampModal(true);
                            // do not auto-validate when opening modal; validation runs only on Confirm
                          } else {
                            // Registered IGN differs -> prefill "other" inputs with registered IGN
                            const parts = regIgn.split('#');
                            setUseOther(true);
                            setOtherGameName(parts[0] || '');
                            setOtherTagLine(parts[1] || '');
                            setSelectedRiot(regIgn);
                            setShowBootcampModal(true);
                            // do not auto-validate when opening modal; validation runs only on Confirm
                          }
                        } else {
                          // No previous registration: default to linked RiotID
                          setSelectedRiot(linked);
                          setUseOther(false);
                          setShowBootcampModal(true);
                          // do not auto-validate when opening modal; validation runs only on Confirm
                        }
                      }}
                      className="bg-gradient-to-r from-[#f9febc] to-[#a8eabb] text-black font-bold px-4 py-2 rounded-md hover:opacity-90 transition duration-200"
                    >
                      {currentPlayer ? 'Cập nhật' : 'Đăng ký'}
                    </button>
                  </div>
                ) : game === 'tft' ? (
                  me?.riotID === '' || me?.riotID === 'Đăng nhập bằng Riot Games' ? (
                    <Link to="/profile">
                      <button className="bg-yellow-400 text-black font-bold px-4 py-2 rounded-md hover:bg-yellow-500 transition duration-200">
                        Cập nhật Riot ID
                      </button>
                    </Link>
                  ) : (
                    <div
                      className={`flex ${
                        currentPlayer
                          ? 'sm:justify-end justify-center gap-2'
                          : 'sm:justify-end justify-center'
                      }`}
                    >
                      {currentPlayer && (
                        <button
                          onClick={handleUnregister}
                          className="bg-red-500 text-white font-bold px-4 py-2 rounded-md hover:bg-red-600 transition duration-200"
                        >
                          Hủy đăng ký
                        </button>
                      )}
                      <button
                        onClick={() => handleAutoRegister()}
                        className="bg-gradient-to-r from-[#f9febc] to-[#a8eabb] text-black font-bold px-4 py-2 rounded-md hover:opacity-90 transition duration-200"
                      >
                        {currentPlayer ? 'Cập nhật' : 'Đăng ký'}
                      </button>
                    </div>
                  )
                ) : (
                  <Link to={`/${game}/${league_id}/register`}>
                    <button className="bg-gradient-to-r from-[#f9febc] to-[#a8eabb] text-black font-bold px-4 py-2 rounded-md hover:opacity-90 transition duration-200">
                      Đăng ký tham gia
                    </button>
                  </Link>
                )}
              </div>
            )}

            {isCheckinPhase && currentUser && currentPlayer && (
              <div className="sm:absolute relative px-4 md:px-8 right-0 bottom-10 text-sm md:text-base text-white font-semibold text-right">
                <div className="mb-2">Đang trong thời gian check-in!</div>

                {currentPlayer.isCheckedin ? (
                  <button
                    disabled
                    className="bg-gray-400 text-white font-bold px-4 py-2 rounded-md cursor-not-allowed"
                  >
                    ✅ Đã check-in
                  </button>
                ) : (
                  <button
                    className="bg-gradient-to-r from-[#f9febc] to-[#a8eabb] text-black font-bold px-4 py-2 rounded-md hover:opacity-90 transition duration-200"
                    onClick={handleCheckin}
                  >
                    Check-in
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {showBootcampModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowBootcampModal(false)}
          />
          <div className="relative bg-base-100 rounded-lg max-w-xl w-full mx-4 p-6 z-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Chọn Riot ID để đăng ký Bootcamp</h2>
              <button onClick={() => setShowBootcampModal(false)} className="text-gray-500">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Linked RiotID option (use me.riotID if present) */}
              {me?.riotID && (
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="bootcampRiot"
                        checked={selectedRiot === me.riotID}
                        onChange={() => {
                          setSelectedRiot(me.riotID);
                          setUseOther(false);
                          setValidationResult(null);
                        }}
                      />
                      <span className="font-medium">{me.riotID}</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="p-3 border rounded">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="bootcampRiot"
                    checked={useOther}
                    onChange={() => {
                      // When user switches to "use other", prefill with previous registration if present
                      setUseOther(true);
                      setSelectedRiot('');
                      if (
                        currentPlayer &&
                        Array.isArray(currentPlayer.ign) &&
                        currentPlayer.ign.length > 0
                      ) {
                        const regIgn = currentPlayer.ign[0] || '';
                        // If registered IGN differs from linked RiotID, prefill inputs
                        if (regIgn && regIgn !== (me?.riotID || '')) {
                          const parts = regIgn.split('#');
                          setOtherGameName(parts[0] || '');
                          setOtherTagLine(parts[1] || '');
                          setSelectedRiot(regIgn);
                          // validation will run when user confirms
                          // if parts are present, prefill selectedRiot
                          // but do not auto-validate here
                        }
                      }
                    }}
                  />
                  <span className="font-medium">Dùng Riot ID khác</span>
                </label>

                {useOther && (
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-2">
                      <input
                        placeholder="Game Name"
                        value={otherGameName}
                        onChange={(e) => setOtherGameName(e.target.value)}
                        className="flex-1 p-2 border rounded"
                      />
                      <input
                        placeholder="Tag Line"
                        value={otherTagLine}
                        onChange={(e) => setOtherTagLine(e.target.value)}
                        className="flex-1 p-2 border rounded"
                      />
                    </div>
                  </div>
                )}
              </div>

              {validationResult && validationResult.loading ? (
                <div className="rounded text-sm text-gray-500" role="status">
                  Đang kiểm tra...
                </div>
              ) : validationResult && validationResult.ok ? (
                <div className="rounded text-sm" role="status">
                  <div className="text-green-700 font-semibold flex items-center">✅ Hợp lệ</div>
                </div>
              ) : validationResult && validationResult.ok === false ? (
                <div className="rounded text-sm" role="status">
                  {validationResult.data &&
                  (validationResult.data.tier || validationResult.data.rank) ? (
                    <div className="text-red-600 font-semibold">
                      ❌ Tài khoản đã đấu rank: {validationResult.data.tier || ''}{' '}
                      {validationResult.data.rank ? `(${validationResult.data.rank})` : ''}
                    </div>
                  ) : validationResult.error ? (
                    /404|not found|Không tìm|không tồn tại/i.test(
                      String(validationResult.error)
                    ) ? (
                      <div className="text-red-600 font-semibold">❌ Tài khoản không tồn tại</div>
                    ) : (
                      <div className="text-red-500 font-semibold">
                        ❌ Tài khoản không hợp lệ
                        {validationResult.error ? ` - ${validationResult.error}` : ''}
                      </div>
                    )
                  ) : (
                    <div className="text-red-600">❌ Tài khoản không hợp lệ</div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowBootcampModal(false)}
                className="px-4 py-2 border rounded"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  // When user clicks Confirm, run validation first; if valid, submit registration.
                  // Determine riot to check
                  const riotToUse =
                    (useOther ? `${otherGameName || ''}#${otherTagLine || ''}` : selectedRiot) ||
                    me?.riotID ||
                    '';
                  const parts = (riotToUse || '').split('#');
                  if (!parts[0] || !parts[1]) {
                    setValidationResult({
                      ok: false,
                      error: 'Vui lòng nhập đầy đủ Game Name và Tag Line',
                    });
                    return;
                  }
                  setValidating(true);
                  const result = await handleValidateRiot(parts[0], parts[1]);
                  setValidating(false);
                  if (result?.ok) {
                    // check for IGN conflict: someone else in this league already registered this IGN
                    const normalized = riotToUse.trim();
                    const conflict = (league?.players || []).some(
                      (p) =>
                        Array.isArray(p.ign) &&
                        p.ign.includes(normalized) &&
                        String(p.usernameregister) !== String(currentUser?._id)
                    );
                    if (conflict) {
                      setValidationResult({
                        ok: false,
                        error: 'IGN này đã được người khác đăng ký. Vui lòng dùng tài khoản khác.',
                        conflict: true,
                      });
                      return;
                    }
                    // proceed to register
                    await handleAutoRegister(riotToUse);
                    setShowBootcampModal(false);
                  } else {
                    // keep modal open and show error (handled by validationResult)
                  }
                }}
                className={`bg-gradient-to-r from-[#f9febc] to-[#a8eabb] text-black font-bold px-4 py-2 rounded-md hover:opacity-90 transition duration-200 ${
                  validating ? 'opacity-60 cursor-wait' : ''
                }`}
                disabled={validating}
              >
                {validating ? 'Đang kiểm tra...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <MyNavbar2
          navigation={getNavigation()}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
        />
      </div>
    </>
  );
};

export default LeagueHeader;
