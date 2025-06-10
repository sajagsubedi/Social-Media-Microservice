import jwt from "jsonwebtoken";

export const validateToken = (req, res, next) => {
  const token = req.header("authorization")?.split(" ")[1];
  if (!token) {
    logger.warn("No token provided in request headers");
    return res.status(401).json({ message: "Unauthorized", success: false });
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (!decoded) {
    return res.status(401).json({ message: "Invalid token", success: false });
  }
  req.user = decoded;
  next();
};
