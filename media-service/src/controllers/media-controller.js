import logger from "../utils/logger.js";
import MediaModel from "../models/Media.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const uploadMedia = async (req, res) => {
  console.log("uploadMedia called");
  logger.info("Starting media upload");
  try {
    console.log(req.file, "req.filereq.file");

    if (!req.file) {
      logger.error("No file found. Please add a file and try again!");
      return res.status(400).json({
        success: false,
        message: "No file found. Please add a file and try again!",
      });
    }

    const { originalname, mimetype, buffer } = req.file;
    const userId = req.user._id;

    logger.info(`File details: name=${originalname}, type=${mimetype}`);
    logger.info("Uploading to cloudinary starting...");

    const cloudinaryUploadResult = await uploadToCloudinary(req.file);
    logger.info(
      `Cloudinary upload successfully. Public Id: - ${cloudinaryUploadResult.public_id}`
    );

    const newlyCreatedMedia = new MediaModel({
      publicId: cloudinaryUploadResult.public_id,
      originalName: originalname,
      mimeType: mimetype,
      url: cloudinaryUploadResult.secure_url,
      userId,
    });

    await newlyCreatedMedia.save();

    res.status(201).json({
      success: true,
      mediaId: newlyCreatedMedia._id,
      url: newlyCreatedMedia.url,
      message: "Media upload is successfully",
    });
  } catch (error) {
    logger.error("Error creating media", error);
    res.status(500).json({
      success: false,
      message: "Error creating media",
    });
  }
};

export { uploadMedia };
