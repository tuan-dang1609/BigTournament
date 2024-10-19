import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet'; // Import helmet để tăng cường bảo mật
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

dotenv.config();

// Kết nối MongoDB với các cài đặt connection pooling
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

// Sử dụng import.meta.url để lấy __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Cài đặt bảo mật với Helmet
app.use(helmet()); // Kích hoạt toàn bộ các bảo mật của Helmet
app.use(helmet.hidePoweredBy()); // Ẩn header X-Powered-By để che giấu việc đang sử dụng Express
app.use(helmet.frameguard({ action: 'deny' })); // Bảo vệ chống clickjacking
app.use(helmet.xssFilter()); // Kích hoạt bộ lọc XSS
app.use(helmet.noSniff()); // Ngăn chặn MIME sniffing
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'trusted-cdn.com'], // Thay thế 'trusted-cdn.com' bằng nguồn tin cậy
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
); // Cấu hình CSP

// Tin tưởng proxy (đặc biệt là khi triển khai trên Vercel hoặc các dịch vụ tương tự)
app.set('trust proxy', 1);

const cache = new NodeCache({ stdTTL: 300, checkperiod: 320 });
const scoreQueue = new Queue('score-processing'); // Bull để xử lý tác vụ nền

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(compression()); // Gzip để giảm kích thước phản hồi

// Giới hạn số lượng yêu cầu mỗi IP để tránh quá tải
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 1000, // Giới hạn mỗi IP gửi 1000 yêu cầu
  message: 'Too many requests from this IP, please try again later',
});
app.use('/api/', limiter);

// Serve các tệp tĩnh từ thư mục 'client'
app.use(express.static(path.join(__dirname, '..', 'client')));

// API lấy dữ liệu trận đấu với NodeCache
app.get('/api/match/:region/:matchid', async (req, res) => {
  const { region, matchid } = req.params;
  const cacheKey = `${region}-${matchid}`;
  const apiKey = process.env.API_KEY_VALORANT;

  // Kiểm tra cache trước
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    // Yêu cầu đến API ngoài
    const response = await axios.get(`https://api.henrikdev.xyz/valorant/v4/match/${region}/${matchid}`, {
      headers: {
        Authorization: apiKey,
      },
    });

    // Lưu vào NodeCache với TTL là 5 phút
    cache.set(cacheKey, response.data, 300);

    // Gửi dữ liệu trả về frontend
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      success: false,
      message: err.message,
      statusCode: err.response?.status || 500,
    });
  }
});

// API lấy nhiều trận đấu với batch requests và pagination
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

// WebSocket để cập nhật dữ liệu thời gian thực
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

// Xử lý tính toán điểm trong hàng đợi Bull
scoreQueue.process(async (job) => {
  const { userId, predictions } = job.data;
  console.log(`Processing score for user ${userId}`);
  // Logic xử lý tính toán điểm
});

// Route dự phòng để phục vụ ứng dụng frontend
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

// Routes cho API user và auth
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);

// Middleware xử lý lỗi
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
  });
});

// Giám sát kết nối MongoDB
setInterval(async () => {
  try {
    await mongoose.connection.db.admin().ping();
    console.log('MongoDB is healthy');
  } catch (err) {
    console.error('MongoDB connection issue:', err);
  }
}, 60000); // Kiểm tra mỗi 60 giây
