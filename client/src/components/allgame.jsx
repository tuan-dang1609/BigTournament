import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Importing images using import.meta.glob
const images = import.meta.glob('../image/*.{png,jpg,jpeg,gif}');

const Card = ({ url, game, image, description, badges }) => {
    const [imageUrls, setImageUrls] = useState({});

    useEffect(() => {
        const loadImageUrls = async () => {
            const urls = {};
            await Promise.all(Object.entries(images).map(async ([path, resolver]) => {
                try {
                    const module = await resolver();
                    urls[path.split('/').pop().split('.')[0]] = module.default;
                } catch (error) {
                    console.error(`Failed to load image at ${path}`, error);
                }
            }));
            setImageUrls(urls);
        };
        loadImageUrls();
    }, []);

    // Split the description by newline characters
    const descriptionLines = description.split('\n');

    return (
        <Link to={url}>
            <div className="card bg-base-100 w-96 shadow-xl mb-5 border-accent border-[1px]">
                <figure>
                    <img className="w-96 h-[13.2rem]"
                        src={imageUrls[image]}
                        alt={game} />
                </figure>
                <div className="card-body">
                    <h2 className="card-title">
                        {game}
                    </h2>
                    <div className="h-[7.4rem]">
                        {descriptionLines.map((line, index) => (
                            <p key={index}>{line}</p>
                        ))}
                    </div>
                    <div className="card-actions justify-end mt-2">
                        {badges.map((badge, index) => (
                            <div key={index} className="badge badge-outline badge-md">
                                {badge}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default function AllGame() {
    const [items, setItems] = useState(null);  // Initialize items as null
    const [loading, setLoading] = useState(true);  // Add loading state

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const response = await fetch('https://big-tournament-backend.vercel.app/api/auth/findallgame', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setItems(data);
            } catch (error) {
                console.error("Failed to fetch games:", error);
            } finally {
                setLoading(false);  // Set loading to false once fetch is complete
            }
        };

        fetchGames();
    }, []);

    if (loading) {
        return <div className="h-full w-full flex items-center justify-center"><span className="loading loading-dots loading-lg text-primary mt-70"></span></div>;  // Show loading spinner while loading
    }

    return (
        <>
        <p className="mx-auto max-w-7xl px-2 sm:px-6 mt-20 max-lg:mt-24 text-center font-bold text-4xl uppercase">Game và các giải đấu</p>
        <div className="mx-auto max-w-7xl px-2 sm:px-6 relative z-0 mt-10 mb-10 grid gap-x-20 gap-y-5 max-lg:gap-y-4 grid-cols-2 max-lg:grid-cols-1">
            
            {items.map((item, index) => (
                <Card key={index} {...item} />
            ))}
        </div>
        </>
    );
}
