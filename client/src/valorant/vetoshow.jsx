import React, { useEffect, useState } from "react";

// Import thủ công từng ảnh
import Bind from "../image/Bind.jpg";
import Haven from "../image/Haven.jpg";
import Split from "../image/Split.jpg";
import Fracture from "../image/Fracture.png";
import Abyss from "../image/Abyss.jpg";
import Pearl from "../image/Pearl.jpg";
import Lotus from "../image/Lotus.jpg";
import Attacker from "../image/Attacker.png";
import Defender from "../image/Defender.png";
const image = {
    "Bind.jpg": Bind,
    "Haven.jpg": Haven,
    "Split.jpg": Split,
    "Fracture.png": Fracture,
    "Abyss.jpg": Abyss,
    "Pearl.jpg": Pearl,
    "Lotus.jpg": Lotus,
};

const Valoveto = ({ banpickid, teams }) => {
    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch match data
    useEffect(() => {
        const fetchMatch = async () => {
            try {
                const response = await fetch("https://bigtournament-hq9n.onrender.com/api/auth/status", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ matchId: banpickid }),
                });
                const data = await response.json();
                if (response.ok) {
                    setMatch(data);
                } else {
                    setError(data.error || "Failed to fetch match data");
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMatch();
    }, [banpickid]);



    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!match) return <div>No match found</div>;

    // Function to get image path for a map
    const getMapImage = (mapName) => {
        const normalizedMapName = mapName.toLowerCase().replace(/\s+/g, "");
        const imageKey = Object.keys(image).find((key) =>
            key.toLowerCase().startsWith(normalizedMapName)
        );
        return imageKey ? image[imageKey] : "";
    };

    // Hàm helper để hiển thị team (so sánh teamName với giá trị của pickedBy, bannedBy)
    const getTeamDisplay = (teamName) => {
        const team = teams.find((t) => t.teamName === teamName);
        if (team) {
            return (
                <img
                    src={`https://drive.google.com/thumbnail?id=${team.logoUrl}`}

                    className="lg:w-12 lg:h-12 md:w-10 md:h-10 w-9 h-9 object-contain"
                />
            );
        }
        return teamName;
    };
    const getTeamShort = (teamName) => {
        const team = teams.find((t) => t.teamName === teamName);
        if (team) {
            return (
                team.shortName
            );
        }
        return teamName;
    };
    const getSideImage = (sideValue) => {
        if (sideValue === "Attacker") {
            return <img src={Attacker} alt="Attacker" className="lg:w-10 lg:h-10 w-8 h-8 " />;
        } else if (sideValue === "Defender") {
            return <img src={Defender} alt="Defender" className="lg:w-10 lg:h-10 w-8 h-8" />;
        }
        return sideValue;
    };
    // Lọc các map có pickedBy (dành cho BO3)
    const pickedMaps = match.maps.picked ? match.maps.picked.filter((pick) => pick.pickedBy) : [];
    const selectedMaps = match.maps.selected; // Giả sử mảng này chứa tên map

    // Hàm render cho mỗi ô với background tối và nội dung sáng
    // Nếu cần thiết, bạn có thể truyền thêm lớp CSS qua tham số extraClass
    const renderTile = (background, contentElements, key, extraClass = "") => (
        <div key={key} className={`px-3 relative md:h-[150px] h-[50px] rounded overflow-hidden ${extraClass} text-white`}>
            {/* Background Image với filter darken */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: `url(${getMapImage(background)})`,
                    filter: "brightness(50%)",
                }}
            ></div>

            {/* Nội dung hiển thị sáng */}
            <div className="relative z-10 flex md:flex-col flex-row items-center md:justify-center justify-between h-full">
                {contentElements.map((el, index) => (
                    <div key={index} className="h-1/3 flex items-center text-center md:text-[14px] text-[11px]">
                        {el}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="text-base-content">
            {/* Veto Process */}
            <div className="mt-1">
                {match.matchType === "BO1" ? (
                    // Giao diện dành cho BO1
                    <div className="grid md:grid-cols-7 grid-cols-2 w-full justify-center gap-1 font-bold ">
                        {/* Render các map bị cấm */}
                        {match.maps.banned.map((ban, index) =>
                            renderTile(
                                ban.name,
                                [
                                    ban.name,
                                    // So sánh bannedBy với teamName, nếu trùng hiển thị logo team
                                    getTeamDisplay(ban.bannedBy),
                                    <span className="bg-black bg-opacity-50 p-2 rounded text-red-500 md:text-[14px] text-[10px]">
                                        BAN
                                    </span>,
                                ],
                                `ban-${index}`
                            )
                        )}
                        {/* Render Decider Map (dùng trường deciderMap từ match nếu có) */}
                        {match.deciderMap &&
                            renderTile(
                                match.deciderMap,
                                [
                                    match.deciderMap,
                                    <span className="bg-black bg-opacity-50 p-2 rounded md:text-[14px] text-[10px] text-green-500">
                                        Decider
                                    </span>,
                                ],
                                "decider",
                                "" // Có thể thêm các lớp CSS bổ sung nếu cần
                            )}
                    </div>
                ) : (
                    // Giao diện dành cho BO3
                    <div className="flex flex-col">
                        <div className="grid md:grid-cols-7 grid-cols-2 w-full justify-center gap-1 md:last:gap-1 last:!gap-x-0 font-bold">
                            {/* Sắp xếp theo thứ tự: Ban[0], Ban[1], Pick[0], Pick[1], Ban[2], Ban[3], Selected Map (Decider) */}
                            {match.maps.banned[0] &&
                                renderTile(
                                    match.maps.banned[0].name,
                                    [
                                        match.maps.banned[0].name,
                                        getTeamDisplay(match.maps.banned[0].bannedBy),
                                        <span className="bg-black bg-opacity-50 p-2 rounded text-red-500 md:text-[14px] text-[10px]">
                                            BAN
                                        </span>,
                                    ],
                                    "ban-0"
                                )}

                            {match.maps.banned[1] &&
                                renderTile(
                                    match.maps.banned[1].name,
                                    [
                                        match.maps.banned[1].name,
                                        getTeamDisplay(match.maps.banned[1].bannedBy),
                                        <span className="bg-black bg-opacity-50 p-2 rounded text-red-500 md:text-[14px] text-[10px]">
                                            BAN
                                        </span>,
                                    ],
                                    "ban-1"
                                )}

                            {pickedMaps[0] &&
                                renderTile(
                                    pickedMaps[0].name,
                                    [
                                        pickedMaps[0].name,
                                        getTeamDisplay(pickedMaps[0].pickedBy),
                                        <span className="bg-black bg-opacity-50 p-2 rounded text-green-500 md:text-[14px] text-[10px]">
                                            PICK
                                        </span>,
                                    ],
                                    "pick-0"
                                )}

                            {pickedMaps[1] &&
                                renderTile(
                                    pickedMaps[1].name,
                                    [
                                        pickedMaps[1].name,
                                        getTeamDisplay(pickedMaps[1].pickedBy),
                                        <span className="bg-black bg-opacity-50 p-2 rounded text-green-500 md:text-[14px] text-[10px]">
                                            PICK
                                        </span>,
                                    ],
                                    "pick-1"
                                )}

                            {match.maps.banned[2] &&
                                renderTile(
                                    match.maps.banned[2].name,
                                    [
                                        match.maps.banned[2].name,
                                        getTeamDisplay(match.maps.banned[2].bannedBy),
                                        <span className="bg-black bg-opacity-50 p-2 rounded text-red-500 md:text-[14px] text-[10px]">
                                            BAN
                                        </span>,
                                    ],
                                    "ban-2"
                                )}

                            {match.maps.banned[3] &&
                                renderTile(
                                    match.maps.banned[3].name,
                                    [
                                        match.maps.banned[3].name,
                                        getTeamDisplay(match.maps.banned[3].bannedBy),
                                        <span className="bg-black bg-opacity-50 p-2 rounded text-red-500 md:text-[14px] text-[10px]">
                                            BAN
                                        </span>,
                                    ],
                                    "ban-3"
                                )}

                            {selectedMaps.length > 0 &&
                                renderTile(
                                    selectedMaps[selectedMaps.length - 1],
                                    [
                                        selectedMaps[selectedMaps.length - 1],
                                        <span className="bg-black bg-opacity-50 p-2 rounded md:text-[14px] text-[10px] text-green-500">
                                            Decider
                                        </span>,
                                    ],
                                    "selected-last",
                                    "md:w-[100%] w-[201.6%]"
                                )}
                        </div>
                        <div className="mt-1">
                            <div className="grid md:grid-cols-2 grid-cols-1 gap-1 md:text-[16px] text-[14px] text-white">
                                {match.sides.map((side) => (
                                    <div
                                        key={side._id}
                                        className="p-4 rounded bg-cover bg-center"
                                        style={{ backgroundImage: `url(${getMapImage(side.map)})` }}
                                    >
                                        <div className="bg-black bg-opacity-60 p-2 rounded font-semibold">
                                            <h3 className="text-lg font-semibold">{side.map}</h3>
                                            <div className="grid grid-cols-3 items-center justify-between mx-auto h-full w-[85%]">
                                                <div className="flex items-center justify-center flex-col lg:gap-y-0 gap-y-1" >
                                                    {getTeamDisplay(side.pickedBy)} <p className="lg:text-[14px] text-[12px] ">Team Pick</p>
                                                </div>
                                                <div className="flex items-center justify-center flex-col gap-y-2"><div>
                                                    {typeof getSideImage(side.team1) === "string" ? (
                                                        <span>{getSideImage(side.team1)}</span>
                                                    ) : (
                                                        getSideImage(side.team1) // Hiển thị component SVG
                                                    )}</div>
                                                    <p className="lg:hidden block text-[11px]">{getTeamShort(match.team1)}</p><p className="lg:block hidden text-[14px]">{match.team1}</p>

                                                </div>
                                                <div className="flex items-center justify-center flex-col gap-y-2">
                                                    <div className="flex items-center justify-center">
                                                        {typeof getSideImage(side.team2) === "string" ? (
                                                            <span>{getSideImage(side.team2)}</span>
                                                        ) : (
                                                            getSideImage(side.team2) // Hiển thị component SVG
                                                        )}</div><p className="lg:hidden block text-[11px]">{getTeamShort(match.team2)}</p><p className="lg:block hidden text-[14px]">{match.team2}</p></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Sides Information */}

        </div>
    );
};

export default Valoveto;
