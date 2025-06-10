import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";

import {
  createPost,
  getAllPosts,
  getPostById,
} from "../controllers/post-controller.js";

const router = express.Router();

router.use(authenticateUser);

router.get("/get-all", getAllPosts);
router.get("/:id", getPostById);
router.post("/create", createPost);

export default router;
