import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import MyNavbar2 from '../components/Navbar2';
import LeagueHeader from '../components/header';
import { useLeagueData } from '../hooks/useLeagueData';
import Bracket from '../valorant/bracket-2'; // Giả sử bạn để file Bracket.jsx riêng

const BracketPage = () => {
  const [loading, setLoading] = useState(true);
  const [bracketData, setBracketData] = useState(null);

  const { currentUser } = useSelector((state) => state.user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [joinCountdown, setJoinCountdown] = useState('');
  const [registerPhase, setRegisterPhase] = useState('idle');
  const { game, league_id } = useParams();
  const { league, startTime, me } = useLeagueData(game, league_id, currentUser);

  const max = parseInt(league?.season?.max_registration) || 64;
  const currentPlayer = league?.players?.find(
    (p) => String(p.usernameregister) === String(currentUser?._id)
  );

  const isCheckedin = currentPlayer?.isCheckedin === true;

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

  // Fetch bracket
  useEffect(() => {
    const fetchBracket = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/auth/${game}/${league_id}/bracket`);
        const result = await response.json();
        if (response.ok) {
          setBracketData(result.payload);
        } else {
          console.error('Failed to fetch bracket:', result.message);
        }
      } catch (error) {
        console.error('Error fetching bracket:', error);
      }
    };

    fetchBracket();
  }, [game, league_id]);

  const navigationAll1 = {
    aov: [
      {
        name: 'Tổng quan',
        href: `/${game}/${league_id}`,
        current: location.pathname === `/${game}/${league_id}`,
      },
      {
        name: 'Người chơi',
        href: `/${game}/${league_id}/players`,
        current: location.pathname === `/${game}/${league_id}/players`,
      },
      {
        name: 'Luật',
        href: `/${game}/${league_id}/rule`,
        current: location.pathname === `/${game}/${league_id}/rule`,
      },
      {
        name: 'BXH',
        href: `/${game}/${league_id}/leaderboard`,
        current: location.pathname === `/${game}/${league_id}/leaderboard`,
      },
    ],
  };

  const getNavigation = () => navigationAll1.aov;

  if (!league) {
    return (
      <div className="min-h-screen flex justify-center items-center text-white">
        <span className="loading loading-dots loading-lg text-primary">Loading league...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-white">
      {/* Header Section */}
      <LeagueHeader
        league={league}
        startTime={league.season.time_start}
        currentUser={currentUser}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        getNavigation={getNavigation}
        MyNavbar2={MyNavbar2}
        league_id={league_id}
        me={me}
        game={game}
      />

      {/* Bracket Section */}
      <div className="flex justify-center items-start p-8">
        {bracketData ? (
          <Bracket bracketData={bracketData} />
        ) : (
          <div className="text-center text-gray-400 mt-10">Đang tải Bracket...</div>
        )}
      </div>
    </div>
  );
};

export default BracketPage;
