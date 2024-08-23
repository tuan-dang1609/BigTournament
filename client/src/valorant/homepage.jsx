import React, { useEffect, useState } from 'react';
import Waiting from '../image/waiting.png';
import Raze from '../image/Raze.png';
import Wingman from '../image/wingman.png';
import $ from 'jquery';
import 'animate.css';
import Video from '../image/Loong.mp4'

document.addEventListener('DOMContentLoaded', function() {
    document.body.style.overflow = 'auto'; // Re-enable scrolling
});

export default function Home() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const scrollToTop = () => {
            document.documentElement.scrollTop = 0;
            setLoading(false);
        };
        document.title = "Trang chủ"
        // Delay to show loading indicator and scroll to top
        setTimeout(scrollToTop, 0); // Adjust delay as needed
    }, []);

    return (
        <>
            {loading ? (
                <div className="loading">Loading...</div>
            ) : (
                <div className='mx-auto max-w-7xl px-2 sm:px-6 relative z-0 mt-32'>
                    <div className="welcome animate__animated animate__fadeIn flex lg:flex-row max-[1024px]:flex-col gap-8 mb-14 lg:px-8">
                        <section className="lg: w-6.5/10 max-[1024px]:w-full">
                            <p className='lg:text-[40px] font-bold font-sans leading-tight max-[1024px]:text-4xl mb-7'>CHÀO MỪNG TỚI GIẢI <span className='text-primary'>VALORANT</span> DCN SPLIT 3</p>
                            <p className='text-lg mb-4 '>Mục đích tụi mình tạo ra giải này để giúp các bạn có thể giải trí sau giờ học căng thẳng. Các thông tin
                                trận đấu sẽ được cập nhật trên này và trên kênh <a className='font-bold text-primary hover:text-neutral' href="https://discord.gg/QbtBzVDq3Z">Discord của
                                    DCN</a>.</p>
                            <p className='text-lg '>Cám ơn các bạn đã dành thời gian để tham gia giải. Hi vọng các bạn sẽ tận hưởng và ủng hộ giải đấu của
                                page nhé !!!</p>
                        </section>
                        <div className="w-3.5/10 max-[1024px]:w-full"><img className='mx-auto' src={Waiting} alt="Waiting" /></div>
                    </div>


                    <div className='hightlight animate__animated animate__fadeInUp flex lg:flex-row max-[1024px]:flex-col gap-8 mb-14'>
                        <section className='w-3/5 max-[1024px]:w-full'>
                            <p className='lg:text-[40px] font-bold font-sans leading-tight max-[1024px]:text-4xl mb-4 uppercase'>hightlight</p>
                            <p className='text-lg text-justify'>Hiện tại tụi mình chỉ có thể đăng <b style={{ color: '#f59e34' }}>Hightlight</b> khi các bạn gửi VOD cho mình. Tụi mình sẽ không đăng lên page trong giải lần này nhé (do chưa đến giai đoạn để đăng)</p>
                        </section>
                        <div className='lg: w-2/5 max-[1024px]:w-full'><video controls><source src={Video}/></video></div>
                    </div>


                    <div className='tag flex lg:flex-row-reverse max-[1024px]:flex-col gap-8 mb-12'>
                        <section className='text w-1/2 max-[1024px]:w-full'>
                            <p className='lg:text-[40px] font-bold font-sans leading-tight max-[1024px]:text-4xl mb-4 uppercase'>Giải đang trong giai đoạn thử nghiệm.</p>
                            <p className='text-lg mb-4 text-justify'><b style={{ color: '#f59e34' }}>Đúng vậy</b>, vì chúng mình mới tổ chức các giải đấu game gần đây nên vẫn còn thiếu kinh nghiệm, đồng thời
                                thử nghiệm các thể thức thi đấu và thêm chức năng mới cho website.
                                Tụi mình sẽ tổ chức giải chính thức khi mọi thứ đã được hoàn thiện.</p>
                            <p className='text-lg text-justify'>Ở giải đấu lần này, tụi mình sẽ thử nghiệm thể thức Swiss System,
                                hệ thống Pick'em Challenge, hiện thông số giải đấu và CÓ THỂ thêm phần Đăng kí/ Đăng nhập tài khoản.
                                Khung thời gian thi đấu cũng sẽ được chỉnh sửa lại để phù hợp với các đội. </p>
                        </section>
                        <div className='w-1/2 max-[1024px]:w-full'><img src={Raze} alt="Raze" /></div>
                    </div>
                    <div className='flex lg:flex-row max-[1024px]:flex-col gap-8 mb-12 tag'>
                        <section className='text w-3/5 max-[1024px]:w-full'>
                            <p className='lg:text-[40px] font-bold font-sans leading-tight max-[1024px]:text-4xl mb-4 mt-10 uppercase'>Giải thưởng và Livestream</p>
                            <p className='text-lg mb-4 '>Giải đấu lần này sẽ không có phần thưởng do đang trong quá trình thử nghiệm, thay vào đó
                            Top 3 team sẽ được đăng bài chúc mừng trên page <a href='https://www.facebook.com/dongchuyennghiep'> Dong Chuyen Nghiep </a> trên Facebook. Xin lỗi và mong các 
                                bạn có thể thông cảm cho sự bất tiện này.</p>
                            <p className='text-lg text-justify'>Về vấn đề Livestream giải đấu thì ngoài việc page chưa lên kế hoạch, chúng mình cũng đang thiếu nhân lực, thiết bị lẫn thời gian để chuẩn bị, nên nếu bạn muốn đóng góp hoặc 
                                tham gia vào danh mục này trong thời gian tới thì có thể liên hệ với chúng mình trên <a href='https://discord.gg/wkBH9DqJdT'> Discord</a>.
                            </p>
                        </section>
                        <div className='text w-2/5 max-[1024px]:w-full flex justify-center'><img className='mx-auto' src={Wingman} alt="Wingman" /></div>
                    </div>

                </div>
            )}
        </>
    );
}

$(document).on("scroll", function () {
    // Get the current scroll position of the page.
    var pageTop = $(document).scrollTop();

    // Calculate the bottom of the visible part of the page.
    var pageBottom = pageTop + $(window).height();

    // Select all elements with class "tag".
    var tags = $(".tag");

    // Loop through each tag and check if it's visible on the screen.
    for (var i = 0; i < tags.length; i++) {
        var tag = tags[i];

        // If the tag is visible, add class "visible" to it.
        if ($(tag).position().top < pageBottom) {
            $(tag).addClass("visible");
        }
        // If the tag is not visible, remove class "visible" from it.
        else {
            $(tag).removeClass("visible");
        }
    }
});
