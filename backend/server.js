import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './connection.js';

import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import albumRoutes from './routes/albumRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
// import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/activity', activityRoutes);
// app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'TipTap server is active' });
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`TipTap backend running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Server failed to start:', error);
  });