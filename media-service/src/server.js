import dotenv from "dotenv";
import express from "express";
import logger from "./utils/logger.js";
import helmet from "helmet";
import routes from "./routes/media-routes.js";
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

//middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body}`);
  next();
});

//routes
app.use("/api/media", routes);

app.listen(PORT, () => {
  logger.info(`App listening http://localhost:${PORT}`);
});

app.use(errorHandler);

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at", promise, "reason:", reason);
});
