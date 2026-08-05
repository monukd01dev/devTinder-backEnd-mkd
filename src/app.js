const express = require('express')
const app = express()
const cookieParser = require('cookie-parser')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

const v1Router = require('./routes/v1')
const { globalLogger } = require('./middlewares/logger')
const { notFoundHandler, globalErrorHandler } = require('./middlewares/errorHandler')

// ==========================================
// 1. SECURITY & PROXY CONFIGURATION
// ==========================================

// 🚨 MANDATORY FOR NGINX REVERSE PROXY:
// Express ko bata raha hai ki Nginx ke pechhe asli user ka IP trust kare
app.set('trust proxy', 1);

// 🛡️ HELMET: Hide server footprint & set secure HTTP headers
app.use(helmet());

// 🚦 RATE LIMITER: DOS Attack & Brute-force protection
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minutes ka time window
  max: 100, // Ek IP address se 15 min me max 100 requests allowed hain
  standardHeaders: true, // `RateLimit-*` headers return karega (Modern browsers ke liye)
  legacyHeaders: false, // Purane `X-RateLimit-*` headers ko disable karega
  message: {
    status: 429,
    error: "Too many requests from this IP, please try again after 15 minutes."
  }
});

// Yahan hum limiter ko saare '/api/' wale routes par apply kar rahe hain
app.use('/api', apiLimiter);

// ==========================================
// 2. CORS (VIP GUEST LIST)
// ==========================================
const envOrigins = process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',') : [];
const allowedOrigins = [
  ...envOrigins, // Tera Azure IP ya production domain ya jitni bhi jagha tera ui hai unka origin
  "http://localhost:5173",  // Local development
  "http://127.0.0.1:5173"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

// ==========================================
// 3. STANDARD MIDDLEWARES
// ==========================================
app.use(express.json({ limit: "10kb" })) // 🚨 Payload Limit: Koi huge JSON bhej ke server crash na kare
app.use(cookieParser())
app.use(globalLogger)

// ==========================================
// 4. ROUTES
// ==========================================
app.use('/api/v1/', v1Router)

// ==========================================
// 5. ERROR HANDLING
// ==========================================
app.use(notFoundHandler)
app.use(globalErrorHandler)

module.exports = app;