import { createMpesaService } from '../services/mpesaService.js';

// Create a single instance of the mpesa service
const mpesaService = createMpesaService();

export const mpesaAuthMiddleware = async (req, res, next) => {
    try {
        // For M-Pesa callback route, skip token verification
        if (req.path === '/callback') {
            return next();
        }

        const token = await mpesaService.getAuthToken();
        if (!token) {
            throw new Error('Failed to get M-Pesa auth token');
        }

        next();
    } catch (error) {
        console.error('M-Pesa auth middleware error:', error);
        res.status(401).json({
            success: false,
            message: 'M-Pesa authentication failed'
        });
    }
};
