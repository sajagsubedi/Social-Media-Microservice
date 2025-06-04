import dotenv from "dotenv";
import express from "express";
import logger from "./utils/logger.js";
import helmet from "helmet";
import Redis from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { rateLimit } from "express-rate-limit";
import routes from "./routes/identity-routes.js";
import { RedisStore } from "rate-limit-redis";
import mongoose from "mongoose";
import cors from "cors";
import errorHandler from "./middleware/errorHandler.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    logger.info("Connected to mongodb");
  })
  .catch((err) => {
    logger.error("Mongodb connection error:", err);
  });
  
const redisClient = new Redis(process.env.REDIS_URL);

redisClient.on("error", (err) => {
  logger.error("Redis connection error:", err);
  throw new Error("Redis connection error");
});

redisClient.on("ready", () => {
  logger.info("Connected to Redis");
});

//middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body}`);
  next();
});

//DDos protection and rate limiting
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10,
  duration: 1,
});

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({ success: false, message: "Too many requests" });
    });
});

//Ip based rate limiting for sensitive endpoints
const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ success: false, message: "Too many requests" });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

app.use("/api/auth/register", sensitiveEndpointsLimiter);

//routes
app.use("/api/auth", routes);

app.listen(PORT, () => {
  logger.info(`App listening http://localhost:${PORT}`);
});

app.use(errorHandler);

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at", promise, "reason:", reason);
});
