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
dotenv.config();
const app = express();
const apiKey = process.env.TFT_KEY;

const riotClientId = process.env.RIOT_CLIENT_ID;
const riotClientSecret = process.env.RIOT_CLIENT_SECRET;
const riotRedirectUri = 'https://dongchuyennghiep.vercel.app/tft'; // Sử dụng giá trị mới từ .env
const riotAuthorizeUrl = 'https://auth.riotgames.com/authorize';
const riotTokenUrl = 'https://auth.riotgames.com/token';


app.use(
  cors({
    origin: ['http://localhost:5173','https://28e7-88-86-155-193.ngrok-free.app', 'https://dongchuyennghiep-backend.vercel.app','https://dongchuyennghiep.vercel.app'], // Allow both local and deployed origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);


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

// Redirect user to Riot Sign-On
app.get('/rso-login', (req, res) => {
  const authUrl = `${riotAuthorizeUrl}?response_type=code&client_id=${riotClientId}&redirect_uri=${riotRedirectUri}&scope=openid`;
  res.redirect(authUrl);
});

app.post('/oauth2-callback', async (req, res) => {
  const { code } = req.body;

  if (!code) {
      return res.status(400).send('Authorization code is missing');
  }

  try {
      const response = await axios.post(
          riotTokenUrl,
          new URLSearchParams({
              grant_type: 'authorization_code',
              code,
              redirect_uri: riotRedirectUri,
              client_id: riotClientId,
              client_secret: riotClientSecret,
          }),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const tokens = response.data;
      res.json({
          message: 'Tokens retrieved successfully',
          tokens,
      });
  } catch (error) {
      console.error('Error exchanging code for tokens:', error.response?.data || error.message);
      res.status(500).send('Failed to exchange code for tokens');
  }
});
app.post('/oauth2-refresh', async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
      return res.status(400).send('Refresh token is missing');
  }

  try {
      const response = await axios.post(
          riotTokenUrl,
          new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token,
              client_id: riotClientId,
              client_secret: riotClientSecret,
          }),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const newTokens = response.data;
      res.json({
          message: 'Tokens refreshed successfully',
          newTokens,
      });
  } catch (error) {
      console.error('Error refreshing tokens:', error.response?.data || error.message);
      res.status(500).send('Failed to refresh tokens');
  }
});
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

app.post('/api/accounts', async (req, res) => {
  const { puuids } = req.body;

  try {
    // Tạo một mảng các promises để fetch dữ liệu cho từng puuid
    const accountPromises = puuids.map(async (puuid) => {
      const response = await axios.get(`https://asia.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`, {
        headers: { 'X-Riot-Token': apiKey }
      });

      // Trả về dữ liệu mà không chứa `puuid`
      const { puuid: _, ...accountData } = response.data;
      return accountData;
    });

    // Chờ tất cả các requests hoàn tất
    const accountDataArray = await Promise.all(accountPromises);

    // Trả về dữ liệu đã xử lý cho client
    res.json(accountDataArray);
  } catch (error) {
    console.error('Error fetching account data:', error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch account data' });
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
