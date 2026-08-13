const dotenv = require('dotenv');
const path = require('path');
const { z } = require('zod');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  CORS_ORIGIN: z.string().optional(),
  JWT_SECRET: z.string().default('crm_jwt_access_secret_key_2026_super_secure'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().default('crm_jwt_refresh_secret_key_2026_super_secure'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  STORAGE_PATH: z.string().default('uploads'),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.string().default('1025'),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASSWORD: z.string().optional().default(''),
  SMTP_FROM: z.string().default('no-reply@crmplatform.com'),
  REDIS_URL: z.string().default('redis://localhost:6379')
});

let validatedEnv;
try {
  validatedEnv = envSchema.parse(process.env);
} catch (error) {
  if (process.env.NODE_ENV === 'production') {
    const missingKeys = error.errors.map(e => e.path.join('.')).join(', ');
    console.error(`[FATAL CONFIG ERROR] Missing or invalid production environment variables: ${missingKeys}`);
    process.exit(1);
  }
  // In development/test, fall back gracefully
  validatedEnv = {
    PORT: process.env.PORT || '5000',
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/crm_db',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
    JWT_SECRET: process.env.JWT_SECRET || 'crm_jwt_access_secret_key_2026_super_secure',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.REFRESH_TOKEN_SECRET || 'crm_jwt_refresh_secret_key_2026_super_secure',
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    STORAGE_PATH: process.env.STORAGE_PATH || 'uploads',
    SMTP_HOST: process.env.SMTP_HOST || 'localhost',
    SMTP_PORT: process.env.SMTP_PORT || '1025',
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
    SMTP_FROM: process.env.SMTP_FROM || 'no-reply@crmplatform.com',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379'
  };
}

module.exports = {
  port: parseInt(validatedEnv.PORT, 10),
  nodeEnv: validatedEnv.NODE_ENV,
  databaseUrl: validatedEnv.DATABASE_URL,
  frontendUrl: validatedEnv.FRONTEND_URL,
  corsOrigin: validatedEnv.CORS_ORIGIN || validatedEnv.FRONTEND_URL,
  jwtSecret: validatedEnv.JWT_SECRET,
  jwtExpiresIn: validatedEnv.JWT_EXPIRES_IN,
  jwtRefreshSecret: validatedEnv.JWT_REFRESH_SECRET,
  refreshTokenSecret: validatedEnv.JWT_REFRESH_SECRET,
  refreshTokenExpiresIn: validatedEnv.REFRESH_TOKEN_EXPIRES_IN,
  storagePath: validatedEnv.STORAGE_PATH,
  smtpHost: validatedEnv.SMTP_HOST,
  smtpPort: parseInt(validatedEnv.SMTP_PORT, 10),
  smtpUser: validatedEnv.SMTP_USER,
  smtpPassword: validatedEnv.SMTP_PASSWORD,
  smtpFrom: validatedEnv.SMTP_FROM,
  redisUrl: validatedEnv.REDIS_URL
};
