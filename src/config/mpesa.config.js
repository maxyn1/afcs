export const mpesaConfig = {
    consumerKey: process.env.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
    passkey: process.env.MPESA_PASSKEY,
    shortcode: process.env.MPESA_SHORTCODE,
    environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
    CallBackURL: process.env.MPESA_CALLBACK_URL || 'https://your-domain.com/api/mpesa/callback',
    businessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE
};