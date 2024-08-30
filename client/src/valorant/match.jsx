import { useState, useEffect } from 'react';

export default function MatchResult({ matchInfo, numRound, kill, error }) {
    const [imageUrls, setImageUrls] = useState({});
    const images = import.meta.glob('../agent/*.{png,jpg,jpeg,gif}');

    useEffect(() => {
        const loadImageUrls = async () => {
            const urls = {};
            await Promise.all(Object.entries(images).map(async ([path, resolver]) => {
                try {
                    const module = await resolver();
                    const filename = path.split('/').pop().split('.')[0];
                    urls[filename.replace('%2F', '/')] = module.default;
                } catch (error) {
                    console.error(`Failed to load image at ${path}`, error);
                }
            }));
            setImageUrls(urls);
        };
        loadImageUrls();
    }, []);

    if (error) return <div>Error: {error}</div>;
    if (!matchInfo) return <div className="flex items-center justify-center">
        <span className="loading loading-dots loading-lg text-primary"></span>
    </div>;

    const renderTable = (team, name) => {
        const sortedTeam = team.sort((a, b) => {
            const acsA = a.stats.score / numRound;
            const acsB = b.stats.score / numRound;
            return acsB - acsA;
        });

        return (
            <div className='wrapper xl:flex xl:flex-col xl:gap-10 xl:items-center xl:w-full'>
                <table border="1" cellPadding="5" className='player-stats-table table-auto max-[1024px]:w-[120%] py-2 px-1'>
                    <thead className='all-title'>
                        <tr>
                            {['Player Name', "ACS", 'Kills', 'Deaths', 'Assists', "KD", "HS", 'ADR', "FK", "MK"].map((header, i) => (
                                <th key={i} className="text-center header text-[10px] text-white first:w-[0.1%]">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTeam.map((player, index) => (
                            <tr key={index} className="text-center">
                                <td className='all-title flex flex-row gap-x-2 bg-base-100 max-[1024px]:sticky max-[1024px]:left-0'>
                                    <img className='h-9 w-9 max-[768px]:h-8 max-[768px]:w-8' src={imageUrls[player.agent.name]} alt="Agent Icon" />
                                    <p className='flex items-center'>{player.name}#{player.tag}</p>
                                </td>
                                <td className='all-title text-[10px] bg-base-100 py-2'>{(player.stats.score / numRound).toFixed(0)}</td>
                                <td className='all-title text-[10px] py-2 px-1'>{player.stats.kills}</td>
                                <td className='all-title text-[10px] py-2 px-1'>{player.stats.deaths}</td>
                                <td className='all-title text-[10px] py-2 px-1'>{player.stats.assists}</td>
                                <td className='all-title text-[10px] py-2 px-1'>{player.stats.deaths > 0 ? (player.stats.kills / player.stats.deaths).toFixed(1) : player.stats.kills}</td>
                                <td className='all-title text-[10px] py-2 px-1'>{(player.stats.headshots * 100 / (player.stats.headshots + player.stats.bodyshots + player.stats.legshots)).toFixed(0)}%</td>
                                <td className='all-title text-[10px] py-2 px-1'>{(player.stats.damage.dealt / numRound).toFixed(1)}</td>
                                <td className='all-title text-[10px] py-2 px-1'>{player.fk || 0}</td>
                                <td className='all-title text-[10px] py-2 px-1'>{player.mk || 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="flex flex-row xl:gap-x-3 max-[1400px]:flex-col gap-y-5">
            {renderTable(matchInfo.filter(p => p.team_id === 'Red'), 'Red')}
            {renderTable(matchInfo.filter(p => p.team_id === 'Blue'), 'Blue')}
        </div>
    );
}
