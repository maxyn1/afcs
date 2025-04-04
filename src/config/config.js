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
    password: process.env.DB_PASSWORD || 'your_database_password',
    database: process.env.DB_NAME || '',//This is one is not needed since it is being handledin the env file that is what the database.js script will make when it runs but for testing you can add your through here
  },
  app: {
    port: process.env.PORT || 3000,
  },
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
};