import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// For ES modules, you need to manually configure __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export default {
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'transport_management',
  },
  app: {
    port: process.env.PORT || 3000,
  },
};