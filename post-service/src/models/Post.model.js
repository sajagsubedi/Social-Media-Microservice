import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
  },
  mediaIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
      required: false,
    },
  ],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const PostModel = mongoose.model("Post", postSchema);

export default PostModel;
