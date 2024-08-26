import { useState, useEffect } from 'react';

export default function MatchResult() {
    const [matchInfo, setMatchInfo] = useState(null);

    const [error, setError] = useState(null);
    const matchid = '6699cbf5-ff64-4d4d-b619-0f055fb3079a';
    const apiKey = 'HDEV-c25fa07b-2794-4096-8e4b-e452d228302c';
    const region = 'na';
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';

    useEffect(() => {
        fetch(`https://api.henrikdev.xyz/valorant/v4/match/${region}/${matchid}`, {
            headers: { 'Authorization': apiKey }
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => setMatchInfo(data.data.players))
        .catch(err => setError(err.message)); // Extract the error message as a string
    }, []);

    if (error) return <div>Error: {error}</div>;
    if (!matchInfo) return <div>Loading...</div>;

    const renderTable = (team, name) => (
        <div>
            <h2>Team {name}</h2>
            <table border="1" cellPadding="5" style={{ marginTop: '20px', width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        {['Player Name', 'Agent', 'Kills', 'Deaths', 'Assists', 'Damage Dealt', 'Damage Received'].map((header, i) => (
                            <th key={i}>{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {team.map((player, index) => (
                        <tr key={index}>
                            <td>{player.name}#{player.tag}</td>
                            <td>{player.agent.name}</td>
                            <td>{player.stats.kills}</td>
                            <td>{player.stats.deaths}</td>
                            <td>{player.stats.assists}</td>
                            <td>{player.stats.damage.dealt}</td>
                            <td>{player.stats.damage.received}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div>
            <h1>Match Information</h1>
            {renderTable(matchInfo.filter(p => p.team_id === 'Red'), 'Red')}
            {renderTable(matchInfo.filter(p => p.team_id === 'Blue'), 'Blue')}
        </div>
    );
}
