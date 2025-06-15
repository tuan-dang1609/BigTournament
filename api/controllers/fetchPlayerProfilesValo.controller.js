import User from "../models/user.model.js";

// Fetch Valorant player profiles by riotIDs (GET: ?players=riot1,riot2,...)
export const fetchPlayerProfilesValo = async (req, res) => {
  try {
    // Accept riotIDs as a comma-separated string in query (?players=riot1,riot2,...)
    let riotIDs = req.query.players;
    if (!riotIDs) {
      return res
        .status(400)
        .json({ message: "Missing players query parameter" });
    }
    if (typeof riotIDs === "string") {
      riotIDs = riotIDs
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
    }
    if (!Array.isArray(riotIDs) || riotIDs.length === 0) {
      return res.status(400).json({ message: "No valid riotIDs provided" });
    }

    // Find user profiles for each riotID
    const userProfiles = await User.find({ riotID: { $in: riotIDs } });

    // Map riotID to user profile for quick lookup
    const userMap = {};
    userProfiles.forEach((user) => {
      userMap[user.riotID] = user;
    });

    // Return user profile structure for each riotID (like user.model.js)
    const result = riotIDs.map((riotID) => {
      const user = userMap[riotID];
      if (user) {
        return {
          nickname: user.nickname,
          discordID: user.discordID,
          className: user.className,
          garenaaccount: user.garenaaccount,
          riotID: user.riotID,
          username: user.username,
          profilePicture: user.profilePicture,
          team: user.team,
        };
      } else {
        return { riotID, notFound: true };
      }
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
