import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './src/config/database.js';
import userRoutes from './src/routes/users.js';
import saccoRoutes from './src/routes/saccos.js';
import routeRoutes from './src/routes/routes.js';
import walletRoutes from './src/routes/wallet.js';
import vehicleRoutes from './src/routes/vehicles.js';
import adminRoutes from './src/routes/adminRoutes.js';
import { errorHandler } from './src/utils/errorHandler.js';
import saccoAdminRoutes from './src/routes/saccoAdmin.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Replace with your frontend URL
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/saccos', saccoRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', adminRoutes);

app.use('/api/sacco-admin', saccoAdminRoutes);

// Error handling middleware
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
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
};

startServer();

export default app;












