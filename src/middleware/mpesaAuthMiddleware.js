import mpesaService from '../services/mpesaService.js';

let cachedToken = null;
let tokenExpiry = null;

export async function mpesaAuthMiddleware(req, res, next) {
  try {
    const now = new Date();

    if (!cachedToken || !tokenExpiry || now >= tokenExpiry) {
      const token = await mpesaService.getAuthToken();
      cachedToken = token;

      // Token expiry set to 55 minutes from now (assuming 1 hour token validity)
      tokenExpiry = new Date(now.getTime() + 55 * 60 * 1000);
    }

    req.mpesaToken = cachedToken;
    next();
  } catch (error) {
    console.error('Error fetching M-Pesa auth token:', error);
    res.status(500).json({ message: 'Failed to authenticate with M-Pesa' });
  }
}
