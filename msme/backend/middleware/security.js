const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const env = require("../config/env");

function securityMiddleware(app) {
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("CORS origin not allowed"));
      },
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
}

module.exports = securityMiddleware;
