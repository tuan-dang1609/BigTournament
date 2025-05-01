import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useLeagueData } from '../hooks/useLeagueData';
import { useSelector } from 'react-redux';
export default function ValorantMatchCard() {
  const { game, league_id, teamnameA, teamnameB, matchid } = useParams();
  const { currentUser } = useSelector((state) => state.user);
  const [data, setData] = useState(null);
  const { league, me, allMatchData } = useLeagueData(game, league_id, currentUser);
  useEffect(() => {
    fetch(`http://localhost:3000/api/auth/valorant/matchdata/${matchid}`)
      .then((res) => res.json())
      .then((res) => setData(res))
      .catch(console.error);
  }, [matchid]);

  if (!data) return <div className="text-white">Loading...</div>;

  const players = data.matchData.players;
  const teams = data.matchData.teams;
  const teamA = teams.find((t) => t.teamId === 'Blue');
  const teamB = teams.find((t) => t.teamId === 'Red');

  const playersA = players.filter((p) => p.teamId === 'Blue');
  const playersB = players.filter((p) => p.teamId === 'Red');

  const getMVP = (players) =>
    players.reduce((prev, curr) => (curr.stats.acs > prev.stats.acs ? curr : prev), players[0]);

  const mvpA = getMVP(playersA);
  const mvpB = getMVP(playersB);

  return (
    <div
      className="relative text-white font-sans w-full h-[1080px] overflow-hidden"
      style={{
        backgroundImage: "url('/image/teamleftwin.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="grid grid-cols-2 p-4 gap-x-[234px] text-4xl font-bold relative top-[5.4rem] ">
        <div className="text-black text-right flex flex-row w-[796px] px-5 left-[2rem] justify-between relative">
          <div className="flex flex-col relative">
            <div className="text-[80px] text-black">{teamnameA}</div>
          </div>
          <div className="text-[100px]">{teamA.numPoints}</div>
        </div>
        <div className="text-green-200 text-right flex flex-row w-[796px] px-5 justify-between relative">
          <div className="text-[100px]">{teamB.numPoints}</div>
          <div className="flex flex-col relative">
            <div className="text-[80px] text-green-200">{teamnameB}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 p-4 items-start">
        <div className="">
          <div className="flex flex-col items-start ml-7 mt-[8.5rem] w-[800px] h-[320px] text-right">
            {/* Agent hình lớn */}
            <div className="w-full">
              <img
                src={mvpA.imgCharacter}
                alt="Agent"
                className="h-[250px] left-[400px] object-contain top-10 relative"
              />
            </div>
            {/* Thông tin Agent */}
            <div className="text-yellow-300 font-bold uppercase text-[40px] pl-10 bottom-[5.5rem] relative">
              {mvpA.characterName}
            </div>
            <div className="text-white font-bold uppercase text-[45px] pl-10 bottom-[5.5rem] relative">
              {mvpA.gameName}
            </div>

            {/* K/D, ACS, FK */}
            <div className="text-right space-y-1 mt-2 text-yellow-200 text-[40px] font-bold relative left-[670px] bottom-[20.2rem] flex flex-col gap-y-4">
              <div>{mvpA.stats.KD}</div>
              <div>{mvpA.stats.acs}</div>
              <div>{mvpA.stats.firstKills}</div>
            </div>
          </div>
          <div className="text-right w-[492px] text-white relative gap-y-[0.647rem] text-[28px] left-[20.7rem] flex flex-col ">
            {playersA.slice(1, 5).map((p, i) => (
              <div key={i} className="flex flex-row gap-x-5 h-[115px]">
                <div className="h-[115px] aspect-square">
                  <img src={p.imgCharacter} className="h-[115px] " />
                </div>
                <div className="w-[290px] mt-3 text-left">
                  <div className="font-black text-black">{p.characterName}</div>
                  <div className="font-black mt-2 text-black">{p.gameName}</div>
                </div>
                <div className="mr-3 mt-3">
                  <div className="font-black text-black">{p.stats.KD}</div>
                  <div className="mt-2 font-black text-black">{p.stats.acs}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex flex-col items-end mr-7 w-[800px] h-[320px] text-left relative left-[7.16rem] mt-[8.5rem]">
            {/* Agent hình lớn */}
            <div className="w-full flex justify-end">
              <img
                src={mvpB.imgCharacter}
                alt="Agent"
                className="h-[250px] right-[400px] object-contain top-10 relative"
              />
            </div>

            {/* Thông tin Agent */}
            <div className="text-yellow-300 font-bold uppercase text-[40px] pr-10 bottom-[5.5rem] relative">
              {mvpB.characterName}
            </div>
            <div className="text-white font-bold uppercase text-[45px] pr-10 bottom-[5.5rem] relative">
              {mvpB.gameName}
            </div>

            {/* K/D, ACS, FK */}
            <div className="text-left space-y-1 mt-2 text-yellow-200 text-[40px] font-bold relative right-[670px] bottom-[20.2rem] flex flex-col gap-y-4">
              <div>{mvpB.stats.KD}</div>
              <div>{mvpB.stats.acs}</div>
              <div>{mvpB.stats.firstKills}</div>
            </div>
          </div>

          <div className="text-left w-[492px] text-white relative gap-y-[0.647rem] text-[28px] left-[7.15rem] flex flex-col">
            {playersB.slice(1, 5).map((p, i) => (
              <div key={i} className="flex flex-row-reverse gap-x-5 h-[115px]">
                <div className="h-[115px] aspect-square">
                  <img src={p.imgCharacter} className="h-[115px]" />
                </div>
                <div className="w-[290px] mt-3 text-right">
                  <div className="font-black text-black">{p.characterName}</div>
                  <div className="font-black mt-2 text-black">{p.gameName}</div>
                </div>
                <div className="ml-3 mt-3 text-left">
                  <div className="font-black text-black">{p.stats.KD}</div>
                  <div className="mt-2 font-black text-black">{p.stats.acs}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
