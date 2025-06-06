import jwt from "jsonwebtoken";
import RefreshTokenModel from "../models/RefreshToken.model.js";
import crypto from "crypto";

const generateTokens = async (user) => {
  const accessToken = jwt.sign(
    {
      userId: user._id,
      username: user.username,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "60m",
    }
  );
  const refreshToken = crypto.randomBytes(40).toString("hex");

  return { accessToken, refreshToken };
};

export default generateTokens;
