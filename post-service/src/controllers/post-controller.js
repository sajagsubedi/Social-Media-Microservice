import logger from "../utils/logger.js";
import PostModel from "../models/Post.model.js";
import { validateCreatePost } from "../utils/validation.js";
import { consumeEvent, publishEvent } from "../utils/rabbitmq.js";

const invalidatePostCache = async (req, input) => {
  const cachedKey = `post:${input}`;
  await req.redisClient.del(cachedKey);

  const keys = await req.redisClient.keys("posts:*");
  if (keys.length > 0) {
    await req.redisClient.del(keys);
  }
};

const createPost = async (req, res) => {
  logger.info("Create post hit...");

  try {
    const { error } = validateCreatePost(req.body);

    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        message: error.details[0].message,
        success: false,
      });
    }

    const { content, mediaIds } = req.body;

    const post = await PostModel.create({
      content,
      mediaIds,
      user: req.user._id,
    });

    //invalidate post cache for posts:*
    await invalidatePostCache(req, post._id);

    res.status(201).json({
      success: true,
      message: "Post created successfully!",
      post,
    });
  } catch (err) {
    logger.error("Error creating post", err);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

const getAllPosts = async (req, res) => {
  logger.info("Get posts hit...");

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const cacheKey = `posts:${page}:${limit}`;
    const cachedPosts = await req.redisClient.get(cacheKey);

    if (cachedPosts) {
      logger.info("Returning cached posts");
      return res.status(200).json(JSON.parse(cachedPosts));
    }

    const posts = await PostModel.find({})
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalPosts = await PostModel.countDocuments({});

    const result = {
      posts,
      totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
      currentPage: page,
    };

    await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));

    res.status(200).json(posts);
  } catch (err) {
    logger.error("Error fetching posts", err);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

const getPostById = async (req, res) => {
  logger.info("Get post by id hit...");
  const postId = req.params.id;
  try {
    const cacheKey = `post:${postId}`;
    const cachedPost = await req.redisClient.get(cacheKey);

    if (cachedPost) {
      logger.info("Returning cached post");
      return res.status(200).json(JSON.parse(cachedPost));
    }

    const post = await PostModel.findById(postId);

    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }

    await req.redisClient.setex(cacheKey, 500, JSON.stringify(post));

    res.status(200).json(post);
  } catch (err) {
    logger.error("Error fetching post by id", err);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

const deletePostById = async (req, res) => {
  logger.info("Delete post by id hit...");
  const postId = req.params.id;

  try {
    const post = await PostModel.findOneAndDelete({
      _id: postId,
      user: req.user._id,
    });
    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }

    await publishEvent("post.deleted", {
      postId,
      mediaIds: post.mediaIds,
    });

    await invalidatePostCache(req, postId);
    res.status(200).json({
      message: "Post deleted successfully",
      success: true,
    });
  } catch (err) {
    logger.error("Error deleting post by id", err);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

export { createPost, getAllPosts, getPostById, deletePostById };
