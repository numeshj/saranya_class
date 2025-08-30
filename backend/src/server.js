import './config/env.js';
import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import xss from 'xss-clean';
import { errorHandler, notFound } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import academicRoutes from './routes/academics.js';
import reportRoutes from './routes/reports.js';
import metricsRoutes from './routes/metrics.js';
import notificationRoutes from './routes/notifications.js';
import academicRoutes from './routes/academics.js';

const app = express();

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',') || '*', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(xss());
app.use(compression());
app.use(morgan('dev'));
app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/academic', academicRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`API listening on ${PORT}`));
}).catch(err => {
  console.error('DB connection error', err);
  process.exit(1);
});
