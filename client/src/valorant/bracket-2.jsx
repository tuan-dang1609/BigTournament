import React, { useEffect, useState } from 'react';

const SingleEliminationBracket = ({ bracketData }) => {
  if (!bracketData) {
    return (
      <div className="flex justify-center items-center min-h-screen text-white">Loading...</div>
    );
  }

  const getRoundName = (number) => {
    if (number === 1) return 'Quarter Finals';
    if (number === 2) return 'Semi Finals';
    if (number === 3) return 'Finals';
    if (number === 4) return 'Third Place';
    return `Round ${number}`;
  };

  return (
    <div className="bg-[#141111] min-h-screen text-white p-6">
      <h1 className="text-center text-2xl font-bold mb-8">Single Elimination Bracket</h1>
      <div className="flex flex-nowrap overflow-x-auto space-x-16 justify-center">
        {bracketData.rounds.map((round, roundIdx) => (
          <div key={round._id} className="flex flex-col items-center">
            <h2 className="mb-6 text-lg font-bold">{getRoundName(round.number)}</h2>
            <div className="flex flex-col space-y-10">
              {round.matches.map((match, idx) => (
                <div
                  key={match._id}
                  className="flex flex-col space-y-1 bg-[#1e293b] rounded-lg p-3 w-56 relative"
                >
                  {match.factions && match.factions.length > 0 ? (
                    match.factions.map((faction, fIdx) => (
                      <div
                        key={faction._id}
                        className={`flex items-center justify-between px-2 py-1 ${faction.winner ? 'bg-[#22c55e]/30 border-2 border-[#22c55e]' : ''} rounded`}
                      >
                        <span className="truncate w-36 text-sm">{faction.teamName || 'TBD'}</span>
                        <span className="text-sm">{faction.score}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-center justify-between px-2 py-1 bg-[#0f172a]/70 rounded">
                        <span className="italic text-gray-400">Team A</span>
                        <span className="text-gray-400">0</span>
                      </div>
                      <div className="flex items-center justify-between px-2 py-1 bg-[#0f172a]/70 rounded">
                        <span className="italic text-gray-400">Team B</span>
                        <span className="text-gray-400">0</span>
                      </div>
                    </>
                  )}

                  {/* Draw Line except for Third Place round */}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SingleEliminationBracket;
