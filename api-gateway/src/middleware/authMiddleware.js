import jwt, { decode } from "jsonwebtoken";

export const validateToken = (req, res, next) => {
  const token = req.header("authorization")?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized", success: false });
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (!decoded) {
    return res.status(401).json({ message: "Invalid token", success: false });
  }
  req.user = decoded;
  next();
};
