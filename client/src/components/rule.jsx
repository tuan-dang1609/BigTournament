import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { Link as ScrollLink, Element } from 'react-scroll';
import { useParams } from 'react-router-dom';
import { useLeagueData } from '../hooks/useLeagueData';
import { useSelector } from 'react-redux';
import LeagueHeader from './header';
import MyNavbar2 from '../components/Navbar2';
export default function Rulebook() {
  const [loading, setLoading] = useState(true);
  const sectionRefs = useRef({});
  const { game, league_id } = useParams(); // Lấy tham số từ URL

  const { currentUser } = useSelector((state) => state.user);
  const { league, startTime, me } = useLeagueData(game, league_id, currentUser);
  const [joinCountdown, setJoinCountdown] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [registerPhase, setRegisterPhase] = useState('idle');
  const registered = parseInt(league?.season?.current_team_count) || 0;
  const max = parseInt(league?.season?.max_registration) || 64;
  const currentPlayer = league?.players?.find(
    (p) => String(p.usernameregister) === String(currentUser?._id)
  );

  const isCheckedin = currentPlayer?.isCheckedin === true;

  // GMT+0 => GMT+3 = 15:00
  useEffect(() => {
    if (!startTime) return;
    if (!league?.season?.registration_start || !league?.season?.registration_end) return;

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

      if (diff <= 0) return;

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setJoinCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [league]);

  useEffect(() => {
    const scrollToTop = () => {
      document.documentElement.scrollTop = 0;
      setLoading(false);
    };
    setTimeout(scrollToTop, 0);
    if (league) {
      document.title = `${league.league.name}`;
    }
  }, [league]);

  const bootcampSegment = location.pathname.includes('/bootcamp/') ? '/bootcamp' : '';
  const navigationAll1 = {
    aov: [
      {
        name: 'Tổng quan',
        href: `/${game}${bootcampSegment}/${league_id}`,
        current: location.pathname === `/${game}${bootcampSegment}/${league_id}`,
      },
      // Ẩn tab người chơi khi là bootcamp
      ...(!bootcampSegment
        ? [
            {
              name: 'Người chơi',
              href: `/${game}/${league_id}/players`,
              current: location.pathname === `/${game}/${league_id}/players`,
            },
          ]
        : []),
      {
        name: 'BXH',
        href: `/${game}${bootcampSegment}/${league_id}/leaderboard`,
        current: location.pathname === `/${game}${bootcampSegment}/${league_id}/leaderboard`,
      },
      {
        name: 'Luật',
        href: `/${game}${bootcampSegment}/${league_id}/rule`,
        current: location.pathname === `/${game}${bootcampSegment}/${league_id}/rule`,
      },
    ],
  };
  const getNavigation = () => navigationAll1.aov;
  if (!league) {
    return (
      <div className="min-h-screen flex justify-center items-center text-white ">
        <span className="loading loading-dots loading-lg text-primary">Loading league...</span>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col text-white">
      <LeagueHeader
        league={league}
        startTime={league.season.time_start}
        endTime={league.season.time_end}
        currentUser={currentUser}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        getNavigation={getNavigation}
        MyNavbar2={MyNavbar2}
        league_id={league_id}
        me={me}
        game={game}
      />
      <div className="flex flex-col md:flex-row w-full  text-white p-4">
        {/* Sidebar */}
        <div className="md:w-1/4 md:block hidden w-full md:pr-6 mb-4 md:mb-0 text-sm space-y-2">
          {league.league.rules.map((rule, idx) => (
            <ScrollLink
              key={idx}
              to={`section-${idx}`}
              smooth={true}
              duration={300}
              containerId="rule-content-container" // 👈 thêm containerId
              className="block cursor-pointer text-base-content hover:text-white transition"
            >
              {rule.title}
            </ScrollLink>
          ))}
        </div>

        {/* Content */}
        <div
          className="md:w-3/4 w-full space-y-8 md:max-h-[80vh] md:overflow-y-auto pr-2"
          id="rule-content-container"
        >
          {league.league.rules.map((rule, idx) => (
            <Element name={`section-${idx}`} key={idx}>
              <div className="text-white">
                <h2 className="text-xl font-bold mb-2 border-b border-gray-600 pb-1">
                  {rule.title}
                </h2>
                <div className="prose prose-invert prose-sm max-w-none text-white">
                  <ReactMarkdown remarkPlugins={[remarkBreaks]}>{rule.content}</ReactMarkdown>
                </div>
              </div>
            </Element>
          ))}
        </div>
      </div>
    </div>
  );
}
