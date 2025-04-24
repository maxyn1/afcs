import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// For ES modules, you need to manually configure __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'your_database_password',
    database: process.env.DB_NAME || '',
  },
  app: {
    port: process.env.PORT || 3000,
  },
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  },
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  mpesa: {
    consumerKey: process.env.MPESA_CONSUMER_KEY || '',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
    businessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE || '',
    passkey: process.env.MPESA_PASSKEY || '',
    callbackURL: process.env.MPESA_CALLBACK_URL || '',
  },
};

export default config;
