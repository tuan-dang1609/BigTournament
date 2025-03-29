// components/MatchInterface.js
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
export default function MatchInterface() {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const { matchId, role } = useParams();
  const socketRef = useRef(null); // 🆕

  useEffect(() => {
    const socket = io(import.meta.env.DEV
      ? "http://localhost:3000"
      : "https://dongchuyennghiep-backend.vercel.app",
      {
        transports: ["websocket"],     // ✅ bắt buộc
        withCredentials: true
      }
    );
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      socket.emit('joinMatch', matchId);
    });

    socket.on('matchUpdated', (data) => {
      console.log('📡 matchUpdated RECEIVED:', data); // ✅ PHẢI THẤY LOG NÀY
      setMatch(data); // ✅ cập nhật UI ngay
    });

    return () => {
      socket.disconnect();
    };
  }, [matchId]);

  // Lần đầu load match bằng API
  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_DCN_URL}/api/auth/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matchId })
        });
        const data = await res.json();
        setMatch(data);
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [matchId]);

  // Gửi action (không cần gọi fetchMatch)
  const handleAction = async (action, data) => {
    console.log('Action Triggered:', {
      action,
      data,
      matchId,
      role,
      currentPhase: match?.currentPhase,
      currentTurn: match?.currentTurn
    });

    try {
      await fetch(`${import.meta.env.VITE_DCN_URL}/api/auth/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, action, role, ...data })
      });

      // ✅ Không cần fetchMatch vì socket sẽ update
    } catch (error) {
      console.error('Action error:', error);
    }
  };

  // Thêm log khi render

  // Thêm các components phụ ngay trên MatchInterface
  const MapPoolSection = ({ title, maps, onAction, phase, role, currentTurn, match }) => (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-bold mb-2">{title}</h3>

      {/* Thêm hướng dẫn pick cho BO3 */}
      {match.matchType === 'BO3' && match.pickPhase === 1 && (
        <div className="text-sm text-gray-500 mb-2">
          {match.maps.picked.length === 0
            ? "Team 1 pick first"
            : "Team 2 pick second"}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {maps.map((map) => (
          <div
            key={map}
            className="relative h-40 rounded-xl overflow-hidden bg-cover bg-center shadow-md cursor-pointer"
            style={{
              backgroundImage: `url(/image/${map}.jpg)`,
              cursor:
                (phase === 'ban' || phase === 'pick') && role === currentTurn
                  ? 'pointer'
                  : 'default',
            }}
            onClick={() => {
              if ((phase === 'ban' || phase === 'pick') && role === currentTurn) {
                onAction(phase === 'ban' ? 'ban' : 'pick', { map });
              }
            }}
          >
            {/* Overlay tối */}
            <div className="absolute inset-0 bg-black bg-opacity-30" />

            {/* Tên bản đồ */}
            <h2 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-lg font-bold z-10">
              {map}
            </h2>
          </div>
        ))}
      </div>
    </div>
  );

  const BanPickSection = ({ title, maps, type, sides, team1, team2 }) => (
    <div>
      <h3>{title}</h3>
      <ul className='grid grid-cols-2 gap-1'>
        {maps.map((item) => {
          const mapName = typeof item === "string" ? item : item?.name;
          const pickedBy = typeof item === "object" ? item.pickedBy : "";
          const bannedBy = typeof item === "object" ? item.bannedBy : "";

          return (
            <li
              key={mapName}
              className="relative rounded-lg h-40 overflow-hidden bg-cover bg-center text-white p-4"
              style={{
                backgroundImage: `url(/image/${mapName}.jpg)`,
              }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40 z-0 font-bold " />
              <div className="relative z-10">
                <strong className="block text-lg">{mapName}</strong>
                <div style={{ marginLeft: "1rem" }}>
                  {pickedBy && sides && (
                    <div className="mt-1 text-sm font-bold">
                      {
                        (() => {
                          const sideInfo = sides.find((s) => s.map === mapName);
                          if (!sideInfo) return "Chưa rõ";

                          const bothSidesEmpty = !sideInfo.team1 || !sideInfo.team2;

                          if (pickedBy === "Decider") {
                            if (bothSidesEmpty) return "Chưa rõ";

                            return (
                              <>
                                <div>Đội {match?.team1} đã chọn {sideInfo.team1}</div>
                                <div>Đội {match?.team2} đã chọn {sideInfo.team2}</div>
                              </>
                            );
                          }

                          if (pickedBy === team1) return `Chọn bởi đội: ${match?.team1} (${sideInfo.team1 || "Chưa rõ"})`;
                          if (pickedBy === team2) return `Chọn bởi đội: ${match?.team2} (${sideInfo.team2 || "Chưa rõ"})`;
                          return "Chưa rõ";
                        })()
                      }
                    </div>
                  )}
                  {type === "banned" && (
                    <div className='font-bold text-sm'>Cấm bởi đội: {bannedBy || "Chưa xác định"}</div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );


  const SideSelection = ({ match, role, onSelect }) => {
    const currentMapSide = match.sides.find(
      (side) => side.team1 === null || side.team2 === null
    );

    if (!currentMapSide) return null;

    const currentTeam = match.currentTurn;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white rounded-lg p-6 w-[90%] max-w-md shadow-xl">
          <h3 className="font-bold text-lg mb-4 text-center">
            {currentTeam === "team1" ? match.team1 : match.team2} đang chọn bên cho bản đồ {currentMapSide.map}
          </h3>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 text-center">{currentMapSide.map}</h4>
            <div className="flex gap-1">
              <button
                onClick={() =>
                  onSelect("side", {
                    map: currentMapSide.map,
                    side: "Attacker",
                  })
                }
                disabled={role !== currentTeam}
                className={`flex-1 bg-orange-500 text-white p-2 rounded ${role !== currentTeam
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-orange-600"
                  }`}
              >
                Tấn công
              </button>
              <button
                onClick={() =>
                  onSelect("side", {
                    map: currentMapSide.map,
                    side: "Defender",
                  })
                }
                disabled={role !== currentTeam}
                className={`flex-1 bg-blue-500 text-white p-2 rounded ${role !== currentTeam
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-blue-600"
                  }`}
              >
                Phòng thủ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading || !match || !match.maps) return (
    <div className="text-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">Đang tải dữ liệu match...</p>
    </div>
  );
  const deciderMap =
    match.matchType === 'BO3' ? match.maps.selected[2] :
      match.matchType === 'BO1' ? match.maps.selected[0] :
        match.matchType === 'BO5' ? match.maps.selected[4] :
          null;
  return (
    <div className="container mx-auto p-4 mt-16">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">
            {match?.team1 || 'Đội 1'} vs {match?.team2 || 'Đội 2'}
          </h1>
          <p className="text-gray-600">{match?.matchType} Match</p>
        </div>

        {/* Thêm optional chaining và default values */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <MapPoolSection
            title="Bản đồ khả dụng"
            maps={match.maps?.pool || []}
            onAction={handleAction}
            phase={match.currentPhase}
            role={role}
            currentTurn={match.currentTurn}
            match={match} // Thêm dòng này
          />

          {(() => {
            const deciderMap =
              match?.matchType === 'BO3' ? match.maps.selected[2] :
                match?.matchType === 'BO1' ? match.maps.selected[0] :
                  match?.matchType === 'BO5' ? match.maps.selected[4] :
                    null;

            const combinedMaps = [
              ...match.maps.picked,
              ...(deciderMap ? [{ name: deciderMap, pickedBy: 'Decider' }] : [])
            ];

            return (
              <BanPickSection
                title="Bản đồ bị cấm"
                maps={match.maps?.banned || []}
                type="banned"
                sides={match.sides}
                team1={match.team1}
                team2={match.team2}
              />
            );
          })()}


          <BanPickSection
            title="Picked Maps"
            maps={[
              ...match.maps.picked,
              ...(deciderMap ? [{ name: deciderMap, pickedBy: 'Decider' }] : [])
            ]}
            type="picked"
            sides={match.sides}
            team1={match.team1}
            team2={match.team2}
          />
        </div>

        {/* Kiểm tra sides tồn tại */}
        {match.currentPhase === 'side' && (
          <>

            <SideSelection
              match={match}
              role={role}
              onSelect={handleAction}
            />
          </>
        )}
      </div>
    </div>
  );
}