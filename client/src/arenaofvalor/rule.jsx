import React from "react";
import { useEffect } from "react";
import Image from "../image/waiting.png"
export default function Rule() {
    useEffect(() => {
        const scrollToTop = () => {
            document.documentElement.scrollTop = 0;
            setLoading(false);
        };
        document.title = "Luật lệ Liên Quân Mobile"
        // Delay to show loading indicator and scroll to top
        setTimeout(scrollToTop, 0); // Adjust delay as needed
    }, []);
    return (
        <div className='rule animate__animated animate__fadeIn mx-auto max-w-7xl px-2 sm:px-6 mt-28'>
            <h2 className=" text-5xl font-bold text-center flex flex-col">LUẬT LỆ</h2>
            <img src={Image} className="h-40 w-40 justify-center items-center flex mx-auto my-8" />
            <p className="mt-5 text-base-content text-lg text-center">Sẽ thông báo sau 1 tuần nữa. Các bạn hãy chờ đợi nhé !!!</p>
        </div>
    )
}