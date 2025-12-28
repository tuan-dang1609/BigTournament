import React, { useState, useEffect } from 'react';
import { IoMdArrowDown } from 'react-icons/io';
import ImageDCN from '../image/waiting.png';
import LQ from '../image/LienQuan.jpg';
import { Link } from 'react-router-dom';
import { FaMedal } from 'react-icons/fa';
import 'animate.css';
import $ from 'jquery';
// Custom hook to detect screen size
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = () => setMatches(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
};

const CompetitionPage = () => {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [showPlayers, setShowPlayers] = useState(false);

  const prizePool = [
    { place: '1st', prize: '500 000 VND', color: '#FFD700' }, // Gold
    { place: '2nd', prize: '300 000 VND', color: '#C0C0C0' }, // Silver
    { place: '3rd', prize: '200 000 VND', color: '#CD7F32' }, // Bronze
  ];
  const timeline = [
    { stage: 'Registration', date: 'June 1 - June 15', completed: true },
    { stage: 'Preliminary Rounds', date: 'June 20 - July 5', completed: true },
    { stage: 'Finals', date: 'July 10', completed: false },
  ];
  useEffect(() => {
    const scrollToTop = () => {
      document.documentElement.scrollTop = 0;
      setLoading(false);
    };
    setTimeout(scrollToTop, 0);
    document.title = 'Giải Liên Quân Mobile DCN';
  }, []);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch(
          'https://bigtournament-1.onrender.com/api/auth/findallteamAOV',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Lọc dữ liệu để chỉ giữ lại các đội có "Liên Quân Mobile" trong games
        const filteredTeams = data.filter(
          (team) => team.games && team.games.includes('Liên Quân Mobile')
        );

        setTeams(filteredTeams); // Lưu lại các đội đã lọc vào state
      } catch (error) {
        console.error('Error fetching teams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const scrollToContent = () => {
    const contentSection = document.getElementById('participant');
    contentSection.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col text-white">
      {/* Header Section */}
      <header className="relative h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${LQ})` }}
          aria-label="Competition arena with spotlights"
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4">
          <div className="text-6xl animate__animated animate__fadeIn mb-6 text-red-500 flex items-center justify-center">
            <img src={ImageDCN} alt="DCN logo" className="h-32 w-32" />
          </div>
          <h1 className="text-6xl md:text-7xl animate__animated animate__fadeIn font-extrabold mb-6 animate-fade-in-down bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Giải Liên Quân Mobile DCN: Season 2
          </h1>
          <p className="animate__animated animate__fadeIn text-xl md:text-xl mb-8 animate-fade-in-up">
            Thắng bại tại kĩ năng !!!
          </p>
          <Link to="/arenaofvalor/playoff">
            <button className="animate__animated animate__fadeInUp bg-gradient-to-r from-primary to-accent hover:from-primary hover:to-accent text-white font-bold py-4 px-10 rounded-full text-xl transform hover:scale-105 shadow-lg">
              Xem ngay bảng đấu
            </button>
          </Link>
        </div>
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <button
            onClick={scrollToContent}
            className="absolute bottom-8 text-secondary hover:text-secondary transform -translate-x-1/2 text-4xl animate-bounce z-20 flex justify-center items-center"
          >
            <IoMdArrowDown />
          </button>
        </div>
      </header>
      {/* Timeline Section */}

      {/* Content Section */}
      <section id="participant" className="py-12 lg:py-16 px-4 md:px-8 bg-gradient-to-b text-white">
        <div className="mx-auto">
          <h2 className="animate__animated animate__fadeInUp text-4xl md:text-5xl font-bold mb-6 text-center text-primary">
            Các đội tham dự giải đấu
          </h2>

          {loading ? (
            <div className="flex items-center justify-center mt-24">
              <span className="loading loading-dots loading-lg text-primary"></span>
            </div>
          ) : (
            <>
              <div className="tag flex items-center text-base-content space-x-2 gap-x-3 justify-end my-5 lg:text-[17px] text-[14px]">
                Hiện toàn bộ thành viên{' '}
                <div className="flex items-center">
                  <label className="relative inline-block w-14 h-8">
                    <input
                      type="checkbox"
                      checked={showPlayers}
                      onChange={() => setShowPlayers(!showPlayers)} // Toggle the state
                      className="sr-only" // Visually hide the checkbox
                    />
                    <div
                      className={`block bg-gray-300 w-14 h-8 rounded-full ${
                        showPlayers ? 'bg-green-500' : 'bg-gray-300'
                      } transition duration-300 ease-in-out`}
                    ></div>
                    <div
                      className={`dot absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ease-in-out ${
                        showPlayers ? 'transform translate-x-6' : ''
                      }`}
                    ></div>
                  </label>
                </div>
              </div>
              <div className="tag grid grid-cols-2 lg:grid-cols-4 lg:gap-8 gap-1">
                {teams.map((team, index) => (
                  <TeamCard key={index} team={team} showPlayers={showPlayers} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Prize Pool Section */}
      <div className="lg:my-12 px-4 my-10 tag">
        <h2 className="max-w-xl mx-auto text-4xl md:text-5xl font-bold mb-10 text-center text-primary">
          Giải thưởng
        </h2>
        <div className="mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {prizePool.map((prize, index) => (
              <div
                key={index}
                className="text-center bg-gray-800 rounded-lg p-6 shadow-xl transform hover:scale-105 transition duration-300 ease-in-out"
              >
                <div className="text-6xl mb-4 flex justify-center" style={{ color: prize.color }}>
                  <FaMedal />
                </div>
                <h3 className="text-2xl font-bold mb-2">{prize.place}</h3>
                <p className="text-3xl font-semibold text-green-400">{prize.prize}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const TeamCard = ({ team, showPlayers }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Check if the screen size is smaller than `lg`
  const isSmallScreen = useMediaQuery('(max-width: 1024px)');

  // Build the Google Drive image URL
  const logoUrl = `https://drive.google.com/thumbnail?id=${team.logoUrl}`;

  // Limit players based on screen size
  const playersToShow = isSmallScreen
    ? team.gameMembers['Liên Quân Mobile'].slice(0, 5)
    : team.gameMembers['Liên Quân Mobile'];

  return (
    <div
      className="bg-gray-700 py-1 lg:p-5 rounded-lg shadow-lg text-center transition duration-300 ease-in-out"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="w-full lg:h-48 h-24 lg:p-0 p-2 overflow-hidden relative">
        <img
          src={logoUrl}
          alt={`${team.teamName} logo`}
          className={`h-full flex w-full justify-center items-center lg:block object-contain transition-opacity duration-300 ${
            isHovered || showPlayers ? 'opacity-[.19]' : 'opacity-100'
          }`}
        />
        <div
          className={`absolute inset-0 flex flex-col justify-center items-center transition-opacity duration-300 ${
            isHovered || showPlayers ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {playersToShow.map((player, playerIndex) => (
            <div
              key={playerIndex}
              className="h-1/3 flex items-center font-semibold justify-center text-[10px] lg:text-[15px]"
            >
              {player}
            </div>
          ))}
        </div>
      </div>
      <p className="font-bold animate-fade-in-down bg-clip-text text-transparent bg-gradient-to-r from-secondary to-accent text-[12.5px] lg:text-[18px] lg:pt-4 lg:pb-2">
        {team.teamName} ({team.classTeam})
      </p>
    </div>
  );
};
$(document).on('scroll', function () {
  var pageTop = $(document).scrollTop();
  var pageBottom = pageTop + $(window).height();
  var tags = $('.tag');

  for (var i = 0; i < tags.length; i++) {
    var tag = tags[i];
    if ($(tag).position().top < pageBottom) {
      $(tag).addClass('visible');
    } else {
      $(tag).removeClass('visible');
    }
  }
});
export default CompetitionPage;
