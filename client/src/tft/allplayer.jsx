import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";;
import { useSelector } from "react-redux";
import 'animate.css';
import MyNavbar2 from "../components/Navbar2";
// Custom hook to detect screen size
import { useParams } from 'react-router-dom';
import LeagueHeader from "../components/header";


const MemberPage = () => {
    const [loading, setLoading] = useState(true);
    const [teams, setTeams] = useState([]);
    const [league, setLeague] = useState(null);
    const { currentUser } = useSelector((state) => state.user);
    const [startTime, setStartTime] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [joinCountdown, setJoinCountdown] = useState('');
    const [registerPhase, setRegisterPhase] = useState('idle');
    const { game, league_id } = useParams();

    const registered = parseInt(league?.season?.current_team_count) || 0;
    const max = parseInt(league?.season?.max_registration) || 64;

    useEffect(() => {
        if (league?.league?.starts_at) {
            setStartTime(new Date(league.season.time_start));
        }
    }, [league]);
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
        document.title = "Giải Teamfight Tactics DCN";

    }, []);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);

            try {
                const [teamResult, leagueResult] = await Promise.allSettled([
                    fetch('https://bigtournament-hq9n.onrender.com/api/auth/findallteamTFT', {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' }
                    }),
                    fetch(`https://bigtournament-hq9n.onrender.com/api/auth/${game}/${league_id}`)
                ]);

                // --- Handle league fetch ---
                if (leagueResult.status === "fulfilled" && leagueResult.value.ok) {
                    const leagueData = await leagueResult.value.json();
                    setLeague(leagueData);
                    setStartTime(new Date(leagueData.season.time_start));
                } else {
                    console.warn("❌ League API failed", leagueResult.reason || leagueResult.value?.status);
                }

                // --- Handle teams fetch ---
                if (teamResult.status === "fulfilled" && teamResult.value.ok) {
                    const teamData = await teamResult.value.json();
                    const filteredTeams = teamData.filter(
                        team => team.games && team.games.includes("Teamfight Tactics")
                    );
                    setTeams(filteredTeams);
                } else {
                    console.warn("❌ Teams API failed", teamResult.reason || teamResult.value?.status);
                }

            } catch (error) {
                console.error('Unexpected error in fetchAllData:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    const navigationAll1 = {
        aov: [
            { name: "Tổng quan", href: `/${game}/${league_id}`, current: location.pathname === `/${game}/${league_id}`},
            { name: "Người chơi", href: `/${game}/${league_id}/players`, current: location.pathname === `/${game}/${league_id}/players`},
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
            {/* Header Section */}
            <LeagueHeader
                league={league}
                startTime={startTime}
                registerPhase={registerPhase}
                joinCountdown={joinCountdown}
                currentUser={currentUser}
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
                getNavigation={getNavigation}
                MyNavbar2={MyNavbar2}
            />
            <div className="p-4 md:px-8">
  <h2 className="text-2xl font-bold mb-4">Người chơi đã đăng ký</h2>
  <div className="overflow-x-auto">
    <table className="table-auto w-full border-separate border-spacing-y-2">
      <thead>
        <tr className="text-left text-gray-400 uppercase text-sm">
          <th className="pl-2">Người chơi</th>
          <th className="text-right pr-2">Trạng thái</th>
        </tr>
      </thead>
      <tbody>
        {teams.map((team, index) => (
          <tr
            key={index}
            className="hover:bg-gray-800 transition duration-200"
          >
            <td className="flex items-center space-x-4 py-2 pl-2">
              <img
                src={`https://lh3.googleusercontent.com/d/${team.logoUrl}`}
                alt="logo"
                className="w-10 h-10 rounded-full object-cover"
              />
              <span className="text-white font-semibold">{team.gameMembers["Teamfight Tactics"]?.[0]}</span>
            </td>
            <td className="text-green-500 font-bold text-right pr-2">
              Xác nhận
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

            
        </div>
    );
};

export default MemberPage;
