import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

process.env.JWT_ACCESS_SECRET ||= randomUUID();
process.env.JWT_REFRESH_SECRET ||= randomUUID();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tuition_center',
  accessTokenTtl: '15m',
  refreshTokenTtl: '7d'
};
