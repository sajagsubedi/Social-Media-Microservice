import logger from "../utils/logger.js";
import { validateRegistration } from "../utils/validation.js";
import UserModel from "../models/User.model.js";
import generateTokens from "../utils/generateTokens.js";

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

    const { accessToken, refreshToken } = generateTokens(user);

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

export { registerUser };
