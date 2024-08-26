import { useState, useEffect } from 'react';

export default function Test() {
    const [matchInfo, setMatchInfo] = useState(null);
    const [error, setError] = useState(null);
    const [rateLimit, setRateLimit] = useState(null);
    const [round, setRound] = useState(null);
    const matchid = '6699cbf5-ff64-4d4d-b619-0f055fb3079a';
    const apiKey = 'HDEV-c25fa07b-2794-4096-8e4b-e452d228302c';
    const region = 'ap';
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${proxyUrl}https://api.henrikdev.xyz/valorant/v4/match/${region}/${matchid}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `${apiKey}`
                    }
                });

                // Check if the response is okay
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // Extract rate limit info from headers
                const remaining = response.headers.get('X-RateLimit-Remaining');
                const limit = response.headers.get('X-RateLimit-Limit');
                const resetTime = response.headers.get('X-RateLimit-Reset');

                setRateLimit({
                    remaining: remaining,
                    limit: limit,
                    resetTime: resetTime
                });

                const data = await response.json();
                
                // Filter rounds that have ceremony: "CeremonyAce"
                const filteredRounds = data.data.rounds.filter(round => round.ceremony === "CeremonyAce")[0].stats;
                const playerWithAce = filteredRounds.filter(player => player.stats.kills === 5)[0];
                setMatchInfo(data.data.players);
                setRound(playerWithAce);
            } catch (error) {
                setError(error.message);
            }
        };

        fetchData();
    }, [matchid]);

    // Logging rate limit information inside useEffect
    useEffect(() => {
        if (rateLimit) {
            console.log('Rate Limit Remaining:', rateLimit.remaining);
            console.log('Rate Limit Reset Time:', rateLimit.resetTime);
        }
    }, [rateLimit]);

    // Render the data or error as needed
    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!matchInfo) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Match Information</h1>
            <p style={{ marginTop: '50px' }}>{round.player.name}#{round.player.tag}: </p>
            <pre style={{ marginTop: '50px' }}>{JSON.stringify(matchInfo, null, 2)}</pre>
        </div>
    );
}
