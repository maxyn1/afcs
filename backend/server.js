import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { createServer } from 'http';
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
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;


const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Enhanced request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  // Log request details
  console.log(`\n🔍 [${requestId}] Incoming Request:`, {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    params: req.params,
    body: req.body,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'authorization': req.headers.authorization ? '********' : undefined
    },
    ip: req.ip
  });

  // Log response details
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 400 ? '❌' : '✨';
    console.log(`${level} [${requestId}] Response Sent:`, {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      status: res.statusCode,
      statusMessage: res.statusMessage,
      headers: res.getHeaders()
    });
  });

  next();
});

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'https://renewed-sterling-dingo.ngrok-free.app',
  'https://sandbox.safaricom.co.ke'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Use raw body parser for MPESA routes
app.use('/api/mpesa/callback', express.raw({ 
  type: 'application/json',
  limit: '10mb'
}));

// Regular body parser for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Add a catch-all route handler for unmatched routes
app.use((req, res, next) => {
  const error = new Error('Route not found');
  error.statusCode = 404;
  next(error);
});

// Error handling middleware
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('authenticate', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} authenticated on socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available to our routes
app.set('io', io);

// Initialize database and start server
const startServer = async () => {
  try {
    await connectDB();
    console.log('✅ Database connected successfully');
    

    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log('MPESA Callback URL:', process.env.MPESA_CALLBACK_URL);

    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
