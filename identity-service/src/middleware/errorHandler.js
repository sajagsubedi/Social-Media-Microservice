import logger from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
  logger.error(err);

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    success: false,
  });
};

export default errorHandler;
