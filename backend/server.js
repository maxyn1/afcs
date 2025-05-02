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
import driverRoutes from './src/routes/driver.js';
import mpesaRoutes from './src/routes/mpesa.js';
import paymentsRoutes from './src/routes/payments.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Debug middleware - add this before other middleware
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// CORS configuration - allow Safaricom callback URL
const allowedOrigins = [
  'http://localhost:5173',
  'https://renewed-sterling-dingo.ngrok-free.app',
  'https://sandbox.safaricom.co.ke'
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log('Blocked by CORS:', origin);
      return callback(null, false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Use raw body parser for MPESA routes
app.use('/api/mpesa', express.raw({ type: 'application/json' }));

// Regular body parser for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log('📝 Request:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    ip: req.ip,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']
    }
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log('🏁 Response:', {
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/saccos', saccoRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sacco-admin', saccoAdminRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/payments', paymentsRoutes);

// Add a catch-all route handler
app.use((req, res) => {
  console.log('❌ No route found for:', req.method, req.url);
  res.status(404).json({ message: 'Not Found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await connectDB();
    console.log('Database connected successfully');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log('MPESA Callback URL:', process.env.MPESA_CALLBACK_URL);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
