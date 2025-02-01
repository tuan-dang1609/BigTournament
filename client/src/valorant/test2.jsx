// components/MatchInterface.js
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
export default function MatchInterface() {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const { matchId, role } = useParams();

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/auth/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matchId })
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        setMatch(data);
        
        // Thêm log để kiểm tra trạng thái match
        console.log('Current Phase:', data.currentPhase);
        console.log('Current Turn:', data.currentTurn);

      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
    const interval = setInterval(fetchMatch, 3000);
    return () => clearInterval(interval);
  }, [matchId]);

  const handleAction = async (action, data) => {
    // Log action trước khi gửi
    console.log('Action Triggered:', {
      action,
      data,
      matchId,
      role,
      currentPhase: match?.currentPhase,
      currentTurn: match?.currentTurn
    });

    await fetch('http://localhost:3000/api/auth/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, action, role, ...data })
    });
  };

  // Thêm log khi render
 
  // Thêm các components phụ ngay trên MatchInterface
  const MapPoolSection = ({ title, maps, onAction, phase, role, currentTurn, match }) => (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-bold mb-2">{title}</h3>
      
      {/* Thêm validation message cho BO3 */}
      {match.matchType === 'BO3' && match.pickPhase === 1 && (
        <div className="text-sm text-gray-500 mb-2">
          {match.maps.picked.length === 0 
            ? "Team 1 pick first" 
            : "Team 2 pick second"}
        </div>
      )}
  
  <div className="space-y-2">
      {maps.map((map) => (
        <div key={map} className="flex items-center justify-between bg-white p-2 rounded">
          <span>{map}</span>
          
          {(phase === 'ban' || phase === 'pick') && 
            role === currentTurn && (
              <button
                onClick={() => onAction(phase === 'ban' ? 'ban' : 'pick', { map })}
                className={`px-3 py-1 text-sm text-white rounded ${
                  phase === 'ban' 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-green-500 hover:bg-green-600'
                }`}
                // Thêm disabled ở đây 👇
                disabled={
                  phase === 'pick' && 
                  match?.matchType === 'BO3' &&
                  (
                    (match?.pickPhase === 1 && match?.maps?.picked?.length === 0 && role !== 'team1') ||
                    (match?.pickPhase === 1 && match?.maps?.picked?.length === 1 && role !== 'team2')
                  )
                }
              >
                {phase === 'ban' ? 'Ban' : 'Pick'}
              </button>
            )}
        </div>
      ))}
    </div>
    </div>
  );

  const BanPickSection = ({ title, maps, type }) => (
    <div>
      <h3>{title}</h3>
      <ul>
        {maps.map((item) => {
          // Xử lý trường hợp dữ liệu raw string (backward compatibility)
          const mapName = typeof item === "string" ? item : item?.name;
          const pickedBy = typeof item === "object" ? item.pickedBy : "";
          const bannedBy = typeof item === "object" ? item.bannedBy : "";
  
          return (
            <li key={mapName}>
              <strong>{mapName}</strong>
              <div style={{ marginLeft: "1rem" }}>
                {type === "picked" && (
                  <div>Picked by: {pickedBy || "Chưa xác định"}</div>
                )}
                {type === "banned" && (
                  <div>Banned by: {bannedBy || "Chưa xác định"}</div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );

  const SideSelection = ({ match, role, onSelect }) => {
    // Tìm map đầu tiên chưa chọn side
    const currentMapSide = match.sides.find(side => 
      side.team1 === null || side.team2 === null
    );
  
    if (!currentMapSide) return null; // Đã chọn hết
  
    // Xác định thông tin lượt chọn
    const isMapPickedByTeam1 = currentMapSide.pickedBy === "team1";
    const currentTeam = match.currentTurn;
    const pickingForTeam = isMapPickedByTeam1 ? match.team2 : match.team1;
    const pickedByTeam = isMapPickedByTeam1 ? match.team1 : match.team2;
  
    return (
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold mb-4">
          {currentTeam === "team1" ? match.team1 : match.team2} đang chọn bên cho bản đồ của {pickingForTeam}
        </h3>
  
        <div className="bg-white p-4 rounded-lg">
          <h4 className="font-semibold mb-2">{currentMapSide.map}</h4>
          <div className="flex gap-2">
            <button
              onClick={() => onSelect('side', {
                map: currentMapSide.map,
                side: 'Attacker'
              })}
              disabled={role !== currentTeam}
              className={`flex-1 bg-orange-500 text-white p-2 rounded ${
                role !== currentTeam ? "opacity-50 cursor-not-allowed" : "hover:bg-orange-600"
              }`}
            >
              Tấn công
            </button>
            <button
              onClick={() => onSelect('side', {
                map: currentMapSide.map,
                side: 'Defender'
              })}
              disabled={role !== currentTeam}
              className={`flex-1 bg-blue-500 text-white p-2 rounded ${
                role !== currentTeam ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
              }`}
            >
             Phòng thủ
            </button>
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

          <BanPickSection
            title="Bản đồ bị cấm"
            maps={match.maps?.banned  || []}
            type="banned"
          />

          <BanPickSection
            title="Bản đồ được chọn"
            maps={match?.maps.picked|| []}
            type="picked"
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