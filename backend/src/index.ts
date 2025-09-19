import cors from 'cors';
import express from 'express';
import { auth } from './auth';

const app = express();
const PORT = process.env['PORT'] || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:8081', 'paycrypt://'],
  credentials: true,
}));
app.use(express.json());

// Better Auth routes
app.use('/api/auth', auth.handler);

// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Auth server running on http://localhost:${PORT}`);
  console.log(`📱 Mobile app should connect to http://localhost:${PORT}/api/auth`);
});
