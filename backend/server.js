import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'TipTap server is active' });
});

app.listen(PORT, () => {
  console.log(`TipTap backend running at http://localhost:${PORT}`);
});