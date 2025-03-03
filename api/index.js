import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet';
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import axios from 'axios';
import NodeCache from 'node-cache';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import compression from 'compression';
import Queue from 'bull';
import https from 'https';
import request from 'request';
import crypto from 'crypto';
import session from 'express-session';
const pLimit = require('p-limit');
const limit = pLimit(5); // Giới hạn chỉ 5 request chạy cùng lúc
dotenv.config();
const app = express();
const apiKey = process.env.TFT_KEY;
const apiKeyValorant = process.env.API_KEY_VALORANT_RIOT
const clientID = process.env.RIOT_CLIENT_ID;
const clientSecret = process.env.RIOT_CLIENT_SECRET;
const appBaseUrl      = "https://dongchuyennghiep-backend.vercel.app"
const appCallbackUrl  = appBaseUrl + "/oauth2-callback";
const  provider       = "https://auth.riotgames.com"
const authorizeUrl    = provider + "/authorize";
const tokenUrl        = provider + "/token";
const URLfrontend     = "https://dongchuyennghiep.vercel.app"
app.use(cors({}));


app.get('/sso/login-riot', function(req, res) {
  const link = authorizeUrl
  + "?redirect_uri=" + appCallbackUrl
  + "&client_id=" + clientID
  + "&response_type=code"
  + "&scope=openid";
// create a single link, send as an html document
res.redirect(link);
});


app.get('/oauth2-callback', function (req, res) {
  const accessCode = req.query.code;

  request.post(
    {
      url: tokenUrl,
      auth: {
        user: clientID,
        pass: clientSecret,
      },
      form: {
        grant_type: 'authorization_code',
        code: accessCode,
        redirect_uri: appCallbackUrl,
      },
    },
    async function (error, response, body) {
      if (!error && response.statusCode === 200) {
        const payload = JSON.parse(body);
        const accessToken = payload.access_token;

        try {
          // Gọi Riot API để lấy thông tin tài khoản
          const riotResponse = await axios.get(
            'https://asia.api.riotgames.com/riot/account/v1/accounts/me',
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const { puuid, gameName, tagLine } = riotResponse.data;

          // Redirect về frontend với access_token và thông tin tài khoản
          res.redirect(
            URLfrontend+ `/profile?&gameName=${encodeURIComponent(
              gameName
            )}&tagName=${encodeURIComponent(tagLine)}`
          );
        } catch (riotError) {
          console.error('Lỗi khi gọi Riot API:', riotError.response?.data || riotError.message);
          res.status(500).json({
            error: 'Không thể lấy thông tin tài khoản Riot.',
            details: riotError.response?.data || riotError.message,
          });
        }
      } else {
        console.error('Lỗi khi lấy access_token:', error || response.statusMessage);
        res.status(400).json({ error: 'Yêu cầu token thất bại.' });
      }
    }
  );
});




// MongoDB connection
mongoose
  .connect(process.env.MONGO, {
    maxPoolSize: 400,
    minPoolSize: 10,
    maxIdleTimeMS: 15000,
    waitQueueTimeoutMS: 10000,
    socketTimeoutMS: 60000,
  })
  .then(() => {
    console.log('Connected to MongoDB with optimized connection pooling');
  })
  .catch((err) => {
    console.log(err);
  });

// Using import.meta.url to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Helmet security configuration
app.use(helmet());
app.use(helmet.hidePoweredBy());
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.xssFilter());
app.use(helmet.noSniff());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'trusted-cdn.com'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

app.set('trust proxy', 1);

const cache = new NodeCache({ stdTTL: 300, checkperiod: 320 });

// Redis configuration for Bull queue
const redisOptions = {
  maxRetriesPerRequest: null,
  connectTimeout: 10000,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

// Pass redisOptions to Bull queue
const scoreQueue = new Queue('score-processing', {
  redis: redisOptions,
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(compression());

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again later',
});
app.use('/api/', limiter);

app.get('/api/livegame', async (req, res) => {  // Thay đổi để lấy riotId từ URL


  try {
      // Gọi API với riotId trong URL
      const response = await axios.get(`https://127.0.0.1:2999/liveclientdata/playerlist`, {
          httpsAgent: new https.Agent({ rejectUnauthorized: false })
      });
      res.json(response.data);  // Trả dữ liệu về cho frontend
  } catch (error) {
      console.error('Error fetching live game data:', error.message);
      console.error('Error response data:', error.response?.data);
      res.status(error.response?.status || 500).json({ error: 'Failed to fetch live game data' });
  }
});
// Serve static files
app.use(express.static(path.join(__dirname, '..', 'client')));
app.get('/api/valorant/match/:matchId', async (req, res) => {
  const { matchId } = req.params;

  try {
    const response = await axios.get(`https://ap.api.riotgames.com/val/match/v1/matches/${matchId}`, {
      headers: { 'X-Riot-Token': apiKeyValorant }
    });

    // Thêm Access-Control-Allow-Origin vào header
    res.setHeader('Access-Control-Allow-Origin', '*'); // Hoặc chỉ định domain cụ thể thay vì '*'
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching match data:', error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch match data' });
  }
});
// API to get match data with NodeCache
app.get('/api/match/:region/:matchid', async (req, res) => {
  const { region, matchid } = req.params;
  const cacheKey = `${region}-${matchid}`;
  const apiKey = process.env.API_KEY_VALORANT;

  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const response = await axios.get(`https://api.henrikdev.xyz/valorant/v4/match/${region}/${matchid}`, {
      headers: {
        Authorization: apiKey,
      },
    });

    cache.set(cacheKey, response.data, 300);
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      success: false,
      message: err.message,
      statusCode: err.response?.status || 500,
    });
  }
});
app.get('/api/valorant/dictionary', async (req, res) => {
  try {
    const response = await axios.get(`https://ap.api.riotgames.com/val/content/v1/contents?locale=vi-VN`, {
      headers: { 'X-Riot-Token': process.env.API_KEY_VALORANT_RIOT }
    });

    // Lọc dữ liệu chỉ giữ lại "characters" và "maps"
    const filteredData = {
      characters: response.data.characters || [],
      maps: response.data.maps || []
    };

    // Thêm Access-Control-Allow-Origin vào header
    res.setHeader('Access-Control-Allow-Origin', '*'); // Hoặc chỉ định domain cụ thể thay vì '*'
    res.json(filteredData);
  } catch (error) {
    console.error('Error fetching dictionary data:', error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch dictionary data' });
  }
});


app.get('/api/matches', async (req, res) => {
  const { page = 1, limit = 10, matchids } = req.query;

  try {
    const matches = await MatchModel.find({ matchid: { $in: matchids.split(',') } })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean()
      .exec();

    const count = await MatchModel.countDocuments();

    res.json({
      matches,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/tft/match/:matchId', async (req, res) => {
  const { matchId } = req.params;

  try {
    const response = await axios.get(`https://sea.api.riotgames.com/tft/match/v1/matches/${matchId}`, {
      headers: { 'X-Riot-Token': apiKey }
    });

    // Thêm Access-Control-Allow-Origin vào header
    res.setHeader('Access-Control-Allow-Origin', '*'); // Hoặc chỉ định domain cụ thể thay vì '*'
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching match data:', error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch match data' });
  }
});
app.get('/api/lol/match/:matchId', async (req, res) => {
  const { matchId } = req.params;

  try {
    const response = await axios.get(`https://sea.api.riotgames.com/lol/match/v5/matches/${matchId}`, {
      headers: { 'X-Riot-Token':process.env.LOL_RIOT_API_KEY }
    });

    // Thêm Access-Control-Allow-Origin vào header
    res.setHeader('Access-Control-Allow-Origin', '*'); // Hoặc chỉ định domain cụ thể thay vì '*'
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching match data:', error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch match data' });
  }
});
app.get('/api/lol/match/timeline/:matchId', async (req, res) => {
  const { matchId } = req.params;

  try {
    const response = await axios.get(`https://sea.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`, {
      headers: { 'X-Riot-Token':process.env.LOL_RIOT_API_KEY }
    });

    // Thêm Access-Control-Allow-Origin vào header
    res.setHeader('Access-Control-Allow-Origin', '*'); // Hoặc chỉ định domain cụ thể thay vì '*'
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching match data:', error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch match data' });
  }
});
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.post('/api/accounts', async (req, res) => {
  const { puuids } = req.body;

  try {
    // Gửi 1 request test để lấy rate limit hiện tại
    const testResponse = await axios.get(`https://asia.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuids[0]}`, {
      headers: { 'X-Riot-Token': apiKey }
    });

    const rateLimit = testResponse.headers['x-app-rate-limit']; 
    const rateLimitCount = testResponse.headers['x-app-rate-limit-count'];

    const [shortTermLimit, longTermLimit] = rateLimit.split(',').map((limit) => limit.split(':').map(Number));
    const [shortTermCount, longTermCount] = rateLimitCount.split(',').map((count) => count.split(':').map(Number));

    const remainingShort = shortTermLimit[0] - shortTermCount[0];
    const remainingLong = longTermLimit[0] - longTermCount[0];

    console.log(`Requests còn lại: ${remainingShort} trong ${shortTermLimit[1]}s, ${remainingLong} trong ${longTermLimit[1]}s`);

    if (remainingShort <= 5 || remainingLong <= 10) {
      return res.status(429).json({ error: 'Rate limit exceeded soon, please try again later' });
    }

    // Tạo danh sách request nhưng giới hạn số lượng chạy cùng lúc (5 request/lượt)
    const accountPromises = puuids.map((puuid) =>
      limit(async () => {
        try {
          const response = await axios.get(`https://asia.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`, {
            headers: { 'X-Riot-Token': apiKey }
          });
          const { puuid: _, ...accountData } = response.data;
          return accountData;
        } catch (error) {
          console.error(`Error fetching account for puuid ${puuid}:`, error.message);
          return null; // Trả về null nếu lỗi, tránh ảnh hưởng toàn bộ danh sách
        }
      })
    );

    // Chạy tất cả request nhưng giới hạn số lượng chạy song song
    const accountDataArray = await Promise.allSettled(accountPromises);

    res.json(accountDataArray.filter(result => result.status === 'fulfilled').map(result => result.value));
  } catch (error) {
    console.error('Error fetching account data:', error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch account data' });
  }
});

app.post('/api/auth/tft_double_rank', async (req, res) => {
  try {
    // Lấy danh sách gameMembers từ request body
    const { gameMembers } = req.body;

    if (!gameMembers || !gameMembers["Teamfight Tactics Double Up"]) {
      return res.status(400).json({ error: "Missing or invalid Teamfight Tactics members" });
    }

    const accounts = gameMembers["Teamfight Tactics Double Up"]; // Lấy danh sách Riot IDs từ gameMembers

    // Xử lý dữ liệu như trước, với accounts được lấy từ gameMembers
    const accountPromises = accounts.map(async (accountString) => {
      try {
        const [gameName, tagLine] = accountString.split('#');
        if (!gameName || !tagLine) throw new Error('Invalid account format');

        // Step 1: Get PUUID from Riot ID
        const accountResponse = await axios.get(
          `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?api_key=${process.env.TFT_KEY}`
        );
        const { puuid } = accountResponse.data;

        // Step 2: Get Summoner ID using PUUID
        const summonerResponse = await axios.get(
          `https://vn2.api.riotgames.com/tft/summoner/v1/summoners/by-puuid/${puuid}?api_key=${process.env.TFT_KEY}`
        );
        const { id: summonerId } = summonerResponse.data;

        // Step 3: Get League Data using Summoner ID
        const leagueResponse = await axios.get(
          `https://vn2.api.riotgames.com/tft/league/v1/entries/by-summoner/${summonerId}?api_key=${process.env.TFT_KEY}`
        );

        // Step 4: Filter for queueType: RANKED_TFT_DOUBLE_UP
        const doubleUpData = leagueResponse.data.find(
          (entry) => entry.queueType === 'RANKED_TFT_DOUBLE_UP'
        );

        return doubleUpData
          ? { puuid, ...doubleUpData }
          : {
              puuid,
              leagueId: null,
              queueType: 'RANKED_TFT_DOUBLE_UP',
              tier: 'UNRANKED',
              rank: '',
              leaguePoints: null,
              wins: 0,
              losses: 0,
              veteran: false,
              inactive: false,
              freshBlood: false,
              hotStreak: false,
            };
      } catch (innerError) {
        console.error(`Error processing account ${accountString}:`, innerError.message);
        return {
          error: `Failed to process account ${accountString}`,
        };
      }
    });

    // Wait for all promises to resolve
    const results = await Promise.all(accountPromises);

    // Tính toán kết quả trung bình (như đoạn code trước đây)
    const tiers = {
      UNRANKED: 0,
      "IRON IV": 1, "IRON III": 2, "IRON II": 3, "IRON I": 4,
      "BRONZE IV": 5, "BRONZE III": 6, "BRONZE II": 7, "BRONZE I": 8,
      "SILVER IV": 9, "SILVER III": 10, "SILVER II": 11, "SILVER I": 12,
      "GOLD IV": 13, "GOLD III": 14, "GOLD II": 15, "GOLD I": 16,
      "PLATINUM IV": 17, "PLATINUM III": 18, "PLATINUM II": 19, "PLATINUM I": 20,
      "EMERALD IV": 21, "EMERALD III": 22, "EMERALD II": 23, "EMERALD I": 24,
      "DIAMOND IV": 25, "DIAMOND III": 26, "DIAMOND II": 27, "DIAMOND I": 28,
      "MASTER I": 29, "GRANDMASTER I": 30, "CHALLENGER I": 31,
    };
    

    const reverseTiers = Object.fromEntries(Object.entries(tiers).map(([key, value]) => [value, key]));

    const tierValues = results.map(({ tier, rank }) => {
      const numericRank = tiers[`${tier} ${rank}`] || 0;
      return numericRank;
    });

    const averageTierValue = Math.round(tierValues.reduce((a, b) => a + b, 0) / results.length);
    const averageTier = reverseTiers[averageTierValue] || "UNRANKED";
    const averageLeaguePoints = Math.ceil(
      results.reduce((sum, { leaguePoints }) => sum + leaguePoints, 0) / results.length
    );
    const averageWins = Math.round(
      results.reduce((sum, { wins }) => sum + wins, 0) / results.length
    );
    const averageLosses = Math.round(
      results.reduce((sum, { losses }) => sum + losses, 0) / results.length
    );

    const veteran = results.some(({ veteran }) => veteran);
    const inactive = results.every(({ inactive }) => inactive);
    const freshBlood = results.some(({ freshBlood }) => freshBlood);
    const hotStreak = results.every(({ hotStreak }) => hotStreak);

    const averageResult = {
      queueType: "RANKED_TFT_DOUBLE_UP_AVERAGE",
      tier: averageTier.split(" ")[0],
      rank: averageTier.split(" ")[1] || "",
      leaguePoints: averageLeaguePoints,
      wins: averageWins,
      losses: averageLosses,
      veteran,
      inactive,
      freshBlood,
      hotStreak,
    };

    res.json([...results, averageResult]);
  } catch (error) {
    console.error('Error processing accounts:', error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to process accounts' });
  }
});



const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`Server listening on port ${process.env.PORT || 3000}`);
});

const io = new Server(server);
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.emit('match update', { matchId: '1234', status: 'ongoing' });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// Bull queue for background score processing with limited concurrency
scoreQueue.process(5, async (job) => {
  const { userId, predictions } = job.data;
  console.log(`Processing score for user ${userId}`);
  // Score calculation logic
});

// Serve frontend
app.get('*', (req, res) => {
  const filePath = path.join(__dirname, '..', 'client', 'index.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(500).send({
        success: false,
        message: `Error serving file: ${err.message}`,
        statusCode: 500,
      });
    }
  });
});

app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
  });
});

setInterval(async () => {
  try {
    // Kiểm tra kết nối MongoDB
    if (mongoose.connection.readyState === 1) {  // 1 có nghĩa là kết nối thành công
      await mongoose.connection.db.admin().ping();
      console.log('MongoDB is healthy');
    } else {
      console.log('MongoDB connection is not established');
    }
  } catch (err) {
    console.error('MongoDB connection issue:', err);
  }
}, 60000);
