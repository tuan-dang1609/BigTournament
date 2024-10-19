import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import axios from 'axios';
import NodeCache from 'node-cache'; // Caching in memory
import rateLimit from 'express-rate-limit'; // Rate limiting to avoid overload
import { Server } from 'socket.io'; // WebSocket for real-time data
import compression from 'compression'; // Gzip compression
import Queue from 'bull'; // Bull for background processing

dotenv.config();

// Connection Pooling với MongoDB cùng tối ưu hóa
mongoose
  .connect(process.env.MONGO, {
    maxPoolSize: 400,       // Tối đa 400 kết nối để tránh quá tải
    minPoolSize: 10,        // Tối thiểu 10 kết nối luôn sẵn sàng
    maxIdleTimeMS: 15000,   // Đóng các kết nối không sử dụng sau 15 giây
    waitQueueTimeoutMS: 10000, // Thời gian chờ tối đa cho kết nối là 10 giây
    socketTimeoutMS: 60000,    // Thời gian tối đa giữ kết nối mở, nếu không có phản hồi thì đóng
  })
  .then(() => {
    console.log('Connected to MongoDB with optimized connection pooling');
  })
  .catch((err) => {
    console.log(err);
  });

// Use import.meta.url to get the __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const cache = new NodeCache({ stdTTL: 300, checkperiod: 320 }); // Cache TTL = 5 phút

const scoreQueue = new Queue('score-processing'); // Bull for background processing

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(compression()); // Bật gzip compression để giảm kích thước phản hồi

// Giới hạn số lượng yêu cầu mỗi IP để tránh quá tải
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 phút
  max: 1000,                 // Giới hạn mỗi IP gửi 1000 yêu cầu
  message: "Too many requests from this IP, please try again later"
});
app.use('/api/', limiter);

// Serve static files from the 'client' directory
app.use(express.static(path.join(__dirname, '..', 'client')));

// API lấy dữ liệu trận đấu với NodeCache và tối ưu hóa truy vấn lean()
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
    // Make the request to the external API using axios
    const response = await axios.get(`https://api.henrikdev.xyz/valorant/v4/match/${region}/${matchid}`, {
      headers: {
        'Authorization': apiKey
      }
    });

    // Lưu vào NodeCache với TTL là 5 phút
    cache.set(cacheKey, response.data, 300);

    // Send the data back to the frontend
    res.json(response.data);
  } catch (err) {
    // Handle any errors from the API request
    res.status(err.response?.status || 500).json({
      success: false,
      message: err.message,
      statusCode: err.response?.status || 500,
    });
  }
});

// API lấy nhiều trận đấu với batch requests và pagination
app.get('/api/matches', async (req, res) => {
  const { page = 1, limit = 10, matchids } = req.query;  // Mặc định là trang 1, 10 kết quả mỗi trang

  try {
    const matches = await MatchModel.find({ matchid: { $in: matchids.split(',') } })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean() // Tối ưu hóa với lean để trả về đối tượng nhẹ hơn
      .exec();

    const count = await MatchModel.countDocuments();

    res.json({
      matches,
      totalPages: Math.ceil(count / limit),
      currentPage: page
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

  // Gửi dữ liệu thời gian thực cho client
  socket.emit('match update', { matchId: '1234', status: 'ongoing' });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});



// Xử lý tính toán điểm trong hàng đợi Bull
scoreQueue.process(async (job) => {
  const { userId, predictions } = job.data;
  // Xử lý tính toán điểm cho dự đoán
  console.log(`Processing score for user ${userId}`);
  // ... Xử lý logic tính điểm ...
});

// Fallback route to serve the frontend application
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

// Routes for user and auth APIs
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
  });
});

// Giám sát sức khỏe kết nối MongoDB
setInterval(async () => {
  try {
    await mongoose.connection.db.admin().ping();
    console.log('MongoDB is healthy');
  } catch (err) {
    console.error('MongoDB connection issue:', err);
  }
}, 60000); // Kiểm tra mỗi 60 giây
