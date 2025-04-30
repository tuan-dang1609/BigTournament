import React, { useEffect, useState, useRef } from 'react';
import Waiting from '../image/LogoChristmas.png';
import Raze from '../image/Raze.png';
import Wingman from '../image/wingman.png';
import $ from 'jquery';
import 'animate.css';
import Video from '../image/Hightlight.mp4';
import { useLocation, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
document.addEventListener('DOMContentLoaded', function () {
  document.body.style.overflow = 'auto'; // Re-enable scrolling
});

export default function Home() {
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [items, setItems] = useState(null); // Initialize items as null
  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -300 : 300,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch(
          'https://bigtournament-hq9n.onrender.com/api/auth/findallgame',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setItems(data);
      } catch (error) {
        console.error('Failed to fetch games:', error);
      } finally {
        setLoading(false); // Set loading to false once fetch is complete
      }
    };

    fetchGames();
  }, []);
  const imageMap = {
    valorant:
      'https://distribution.faceit-cdn.net/images/76a9cba9-e0c2-4194-8e4a-a81f0a220c5f.jpeg?width=424&height=640',
    aov: 'https://dongchuyennghiep.vercel.app/assets/aov-BJyv2PL4.png',
    tft: 'https://distribution.faceit-cdn.net/images/fc7016f2-8e8f-4e63-a697-d3e925c145ee.jpeg?width=424&height=640',
    lol: 'https://distribution.faceit-cdn.net/images/197ca97e-8d6b-4b11-bcba-10ebdaff8000.jpeg?width=424&height=640',
    chess: 'https://dongchuyennghiep.vercel.app/assets/chess-DTjapPqm.png',
  };

  // Determine the appropriate margin-top value based on the presence of the success message
  const marginTopClass = location.state?.success ? 'mt-10' : 'mt-32';

  useEffect(() => {
    const scrollToTop = () => {
      document.documentElement.scrollTop = 0;
      setLoading(false);
    };

    document.title = 'Trang chủ';

    // Scroll to top on load
    setTimeout(scrollToTop, 0);

    // Auto-hide the success alert after 5 seconds
    if (location.state?.success) {
      const timer = setTimeout(() => {
        navigate('/', { state: { success: false } }); // Reset the success state
      }, 2000);

      // Clear the timeout if the component unmounts before the timeout
      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  return (
    <>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          {location.state?.success && (
            <div role="alert" className="alert alert-success mt-20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 shrink-0 stroke-current text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-white">Cập nhật tài khoản thành công!</span>
            </div>
          )}
          <div
            className={`mx-auto lg:max-w-7xl px-2 max-w-full sm:px-6 relative z-0 ${marginTopClass}`}
          >
            <div className="welcome animate__animated animate__fadeIn flex lg:flex-row max-[1024px]:flex-col gap-8 mb-14">
              <section className="lg:w-6.5/10 max-[1024px]:w-full">
                <p className="lg:text-[40px] font-bold font-sans leading-tight max-[1024px]:text-4xl mb-7">
                  CHÀO MỪNG TỚI GIẢI{' '}
                  <span className="text-primary uppercase">Inter-Class Esport Cup 2025</span>
                </p>
                <p className="text-lg mb-4 ">
                  Mục đích tụi mình tạo ra giải này để giúp các bạn có thể giải trí sau giờ học căng
                  thẳng. Các thông tin trận đấu sẽ được cập nhật trên này và trên kênh{' '}
                  <a
                    className="font-bold text-primary hover:text-neutral"
                    href="https://discord.gg/QbtBzVDq3Z"
                  >
                    Discord của DCN
                  </a>
                  .
                </p>
                <p className="text-lg ">
                  Cám ơn các bạn đã dành thời gian để tham gia giải. Hi vọng các bạn sẽ tận hưởng và
                  ủng hộ giải đấu của page nhé !!!
                </p>
              </section>
              <div className="w-3.5/10 max-[1024px]:w-full">
                <img className="mx-auto" src={Waiting} alt="Waiting" />
              </div>
            </div>

            <div className="hightlight animate__animated animate__fadeInUp flex lg:flex-row max-[1024px]:flex-col gap-8 mb-14">
              <section className="w-3/5 max-[1024px]:w-full">
                <p className="lg:text-[40px] font-bold font-sans leading-tight max-[1024px]:text-4xl mb-4 uppercase">
                  hightlight
                </p>
                <p className="text-lg text-justify">
                  Hiện tại tụi mình chỉ có thể đăng <b style={{ color: '#f59e34' }}>Hightlight</b>{' '}
                  khi các bạn gửi VOD cho mình. Tụi mình sẽ không đăng lên page trong giải lần này
                  nhé (do chưa đến giai đoạn để đăng)
                </p>
              </section>
              <div className="lg:w-2/5 max-[1024px]:w-full">
                <video controls>
                  <source src={Video} />
                </video>
              </div>
            </div>

            <div className="tag flex lg:flex-row-reverse max-[1024px]:flex-col gap-8 mb-12">
              <section className="text w-1/2 max-[1024px]:w-full">
                <p className="lg:text-[40px] font-bold font-sans leading-tight max-[1024px]:text-4xl mb-4 uppercase">
                  Giải đang trong giai đoạn thử nghiệm.
                </p>
                <p className="text-lg mb-4 text-justify">
                  <b style={{ color: '#f59e34' }}>Đúng vậy</b>, vì chúng mình mới tổ chức các giải
                  đấu game gần đây nên vẫn còn thiếu kinh nghiệm, đồng thời thử nghiệm các thể thức
                  thi đấu và thêm chức năng mới cho website. Tụi mình sẽ tổ chức giải chính thức khi
                  mọi thứ đã được hoàn thiện.
                </p>
                <p className="text-lg text-justify">
                  Ở giải đấu lần này, tụi mình sẽ thử nghiệm thể thức Tổ chức giống với giải Esport
                  World Cup. Ngoài ra Pick'em Challenge sẽ được áp dụng vào giải đấu lần này. Các
                  bạn hãy chờ đợi nhé.
                </p>
              </section>
              <div className="w-1/2 max-[1024px]:w-full">
                <img src={Raze} alt="Raze" />
              </div>
            </div>
            <div className="relative w-full tag mb-12">
              <h2 className="text-3xl font-bold text-base-content px-6 mb-4">
                Các game sẽ tổ chức
              </h2>

              {/* Scroll Container */}
              <div
                ref={scrollRef}
                className="flex gap-x-6 px-6 h-[110%] overflow-x-auto no-scrollbar snap-x snap-mandatory"
              >
                {items &&
                  items.map((game, index) => (
                    <Link
                      key={game._id}
                      to={game.url}
                      className={`
      relative group snap-start bg-zinc-900 rounded-2xl overflow-hidden shadow transition-transform duration-300
      min-w-[70vw] sm:min-w-[250px] md:min-w-[220px] lg:min-w-[270px]
      ${index === 0 ? 'ml-0' : index === items.length - 1 ? 'mr-0' : ''}
    `}
                    >
                      <img
                        src={imageMap[game.image]}
                        alt={game.game}
                        draggable={false}
                        className="w-full h-[350px] object-cover"
                      />
                      <div className="p-3 text-white">
                        <h3 className="font-bold text-lg mb-1">{game.game}</h3>
                        <p className="text-sm whitespace-pre-line text-gray-300">
                          {game.description}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {game.badges.map((badge, i) => (
                            <span
                              key={i}
                              className="bg-orange-500 text-xs text-black font-semibold px-2 py-0.5 rounded"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>

              {/* Left Button */}
              <button
                onClick={() => scroll('left')}
                className="absolute left-1 top-[100%] -translate-y-1/2 bg-orange-600/100 hover:bg-orange-100 hover:text-orange-600 text-white rounded-full p-2 z-10"
              >
                <ChevronLeft size={20} />
              </button>

              {/* Right Button */}
              <button
                onClick={() => scroll('right')}
                className="absolute right-1 top-[100%] -translate-y-1/2 bg-orange-600/100 hover:bg-orange-100 hover:text-orange-600 text-white rounded-full p-2 z-10"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="flex lg:flex-row max-[1024px]:flex-col gap-8 mb-12 tag">
              <section className="text w-3/5 max-[1024px]:w-full">
                <p className="lg:text-[40px] font-bold font-sans leading-tight max-[1024px]:text-4xl mb-4 mt-10 uppercase">
                  Giải thưởng và Livestream
                </p>
                <p className="text-lg mb-4 ">
                  Giải đấu lần này sẽ không có phần thưởng do đang trong quá trình thử nghiệm, thay
                  vào đó Top 3 team sẽ được đăng bài chúc mừng trên page{' '}
                  <a href="https://www.facebook.com/dongchuyennghiep"> Dong Chuyen Nghiep </a> trên
                  Facebook. Xin lỗi và mong các bạn có thể thông cảm cho sự bất tiện này.
                </p>
                <p className="text-lg text-justify">
                  Về vấn đề Livestream giải đấu thì hiện nay tụi mình đang bắt đầu lên kế hoạch. Tuy
                  nhiên chúng mình cũng đang thiếu nhân lực, thiết bị lẫn thời gian để chuẩn bị, nên
                  nếu bạn muốn đóng góp hoặc tham gia vào danh mục này trong thời gian tới thì có
                  thể liên hệ với chúng mình trên{' '}
                  <a href="https://discord.gg/wkBH9DqJdT"> Discord</a>.
                </p>
              </section>
              <div className="text w-2/5 max-[1024px]:w-full flex justify-center">
                <img className="mx-auto" src={Wingman} alt="Wingman" />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Scroll event handler to manage animations for visible tags
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
