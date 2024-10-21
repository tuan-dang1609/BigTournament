import React, { useState, useEffect } from "react";
import ImageDCN from '../image/waiting.png';
import LQ from '../image/FinalPE.jpg';
import { Link } from "react-router-dom";
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

const WelcomePage = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const scrollToTop = () => {
            document.documentElement.scrollTop = 0;
            setLoading(false);
        };
        setTimeout(scrollToTop, 0);
        document.title = "Pick'em Challenge Liên Quân Mobile DCN";

    }, []);

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
                    <h1 className="italic text-6xl md:text-7xl animate__animated animate__fadeIn font-extrabold mb-6 animate-fade-in-down bg-clip-text text-transparent bg-gradient-to-r from-secondary to-accent">
                        PICK'EM CHALLENGE: BETA
                    </h1>
                    <p className="animate__animated animate__fadeIn text-xl md:text-xl mb-8 animate-fade-in-up">
                       Được vận hành bởi Dong Chuyen Nghiep
                    </p>
                    <Link to="/arenaofvalor/pickemmatch">
                        <button className="animate__animated animate__fadeInUp bg-gradient-to-r from-primary to-accent hover:from-primary hover:to-accent text-white font-bold py-4 px-10 rounded-full text-xl transform hover:scale-105 shadow-lg">
                            Chơi ngay
                        </button>
                    </Link>
                </div>

            </header>
            { /* Timeline Section */}
        </div>
    );
};

$(document).on("scroll", function () {
    var pageTop = $(document).scrollTop();
    var pageBottom = pageTop + $(window).height();
    var tags = $(".tag");

    for (var i = 0; i < tags.length; i++) {
        var tag = tags[i];
        if ($(tag).position().top < pageBottom) {
            $(tag).addClass("visible");
        } else {
            $(tag).removeClass("visible");
        }
    }
});
export default WelcomePage;
