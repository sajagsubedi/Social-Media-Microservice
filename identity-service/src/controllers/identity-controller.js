import logger from "../utils/logger.js";
import { validateRegistration, validatelogin } from "../utils/validation.js";
import UserModel from "../models/User.model.js";
import generateTokens from "../utils/generateTokens.js";
import RefreshTokenModel from "../models/RefreshToken.model.js";

const registerUser = async (req, res) => {
  logger.info("Registration user hit...");

  try {
    const { error } = validateRegistration(req.body);

    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res
        .status(400)
        .json({ message: error.details[0].message, success: false });
    }

    const { email, username, password } = req.body;

    const existingUser = await UserModel.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      logger.warn("User already exists with email or username");

      return res.status(400).json({
        message: "User already exists with the given email or username",
        success: false,
      });
    }

    const user = await UserModel.create({ email, username, password });

    const { accessToken, refreshToken } = await generateTokens(user);

    //store refresh token in the database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshTokenModel.create({
      token: refreshToken,
      user: user._id,
      expiresAt,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully!",
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.log(err);
    logger.error("Registration error occured!", err);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

const loginUser = async (req, res) => {
  logger.info("Login user hit...");
  try {
    const { error } = validatelogin(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email }).select("+password");
    if (!user) {
      logger.warn("User not found");
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn("Invalid password");
      return res.status(401).json({
        message: "Invalid password",
        success: false,
      });
    }
    const { accessToken, refreshToken } = await generateTokens(user);

    //store refresh token in the database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshTokenModel.create({
      token: refreshToken,
      user: user._id,
      expiresAt,
    });

    res.status(200).json({
      success: true,
      message: "User logged in successfully!",
      accessToken,
      refreshToken,
    });
  } catch (err) {
    logger.error("Login error occurred!", err);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

const refreshToken = async (req, res) => {
  logger.info("Refresh token hit");
  try {
    const { token } = req.body;

    if (!token) {
      logger.warn("Refresh token is required");
      return res.status(400).json({
        message: "Refresh token is required",
        success: false,
      });
    }

    const storedToken = await RefreshTokenModel.findOne({ token });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn("Invalid refresh token");
      return res.status(401).json({
        message: "Invalid refresh token",
        success: false,
      });
    }

    const user = await UserModel.findById(storedToken.user);

    if (!user) {
      logger.warn("User not found for the provided refresh token");
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }
    const { accessToken } = await generateTokens(user);

    res.status(200).json({
      success: true,
      message: "Tokens refreshed successfully!",
      accessToken,
      refreshToken,
    });
  } catch (err) {
    logger.error("Refresh token error occurred!", err);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

const logoutUser = async (req, res) => {
  logger.info("Logout user hit...");
  try {
    const { token } = req.body;

    if (!token) {
      logger.warn("Refresh token is required for logout");
      return res.status(400).json({
        message: "Refresh token is required",
        success: false,
      });
    }

    const storedToken = await RefreshTokenModel.findOne({ token });

    if (!storedToken) {
      logger.warn("Invalid refresh token for logout");
      return res.status(401).json({
        message: "Invalid refresh token",
        success: false,
      });
    }

    await RefreshTokenModel.deleteOne({ token });

    res.status(200).json({
      success: true,
      message: "User logged out successfully!",
    });
  } catch (err) {
    logger.error("Logout error occurred!", err);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

export { registerUser, loginUser, refreshToken, logoutUser };
