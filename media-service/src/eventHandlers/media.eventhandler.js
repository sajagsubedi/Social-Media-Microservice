import MediaModel from "../models/Media.model.js";
import logger from "../utils/logger.js";
import { deleteMediaFromCloudinary } from "../utils/cloudinary.js";

export const handlePostDelete = async (event) => {
  const { postId, mediaIds } = event;
  console.log(mediaIds, "mediaIds in post delete event handler");
  try {
    const mediaToDelete = await MediaModel.find({ _id: { $in: mediaIds } });

    mediaToDelete.forEach(async (media) => {
      console.log(media);
      await deleteMediaFromCloudinary(media.publicId);
      await MediaModel.findByIdAndDelete(media._id);

      logger.info(
        `Deleted media ${media._id} associated with this deleted post ${postId}`
      );
    });

    logger.info(`Processed deletion of media for post id ${postId}`);
  } catch (e) {
    logger.error("Error processing post delete event:", e);
  }
};
