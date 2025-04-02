import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './src/config/database.js';
import userRoutes from './src/routes/users.js';
import saccoRoutes from './src/routes/saccos.js';
import routeRoutes from './src/routes/routes.js';
import walletRoutes from './src/routes/wallet.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/saccos', saccoRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/users/wallet', walletRoutes);

// Initialize database and start server
try {
  await connectDB();
  console.log('Database connected successfully');
  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}

export default app;











