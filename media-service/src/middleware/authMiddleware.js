export const authenticateUser = (req, res, next) => {
  const userId = req.headers["x-user-id"];
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized", success: false });
  }
  req.user = { _id: userId };
  next();
};
