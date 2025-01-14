import { useState, useEffect } from 'react';

export default function MatchStatLOL() {
    const [rawData, setRawData] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const matchId = "VN2_637421825";

    useEffect(() => {
        fetch(`https://dongchuyennghiep-backend.vercel.app/api/lol/match/${matchId}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to fetch data");
                }
                return res.json();
            })
            .then(data => {
                setRawData(data);
                setIsLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setIsLoading(false);
            });
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="loading loading-dots loading-lg text-primary"></span>
            </div>
        );
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="matchstat">
            <div className="title bg-[#362431] text-white p-4">
                <h2 className="text-xl">Valorant DCN Split 2</h2>
                <p>Nhánh 0-0 ● BO1</p>
            </div>
            <div className="raw-data p-4">
                <h3 className="text-lg font-bold">Raw JSON Data</h3>
                <pre className="bg-gray-800 text-white p-4 rounded" style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
                    {JSON.stringify(rawData, null, 2)}
                </pre>
            </div>
        </div>
    );
}
