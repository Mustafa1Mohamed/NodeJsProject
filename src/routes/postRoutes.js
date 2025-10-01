import express from "express";
import multer from "multer";
import verifyToken from "../middlewares/verifyToken.js";
import {
  getAllPosts,
  createPost,
  updatePost,
  deletePost,
} from "../controllers/postController.js";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// Routes

// Create a new post
router.post("/", verifyToken, upload.single("media"), createPost);

// Get all posts
router.get("/", verifyToken, getAllPosts);

// Update a post
router.put("/:id", verifyToken, upload.single("media"), updatePost);

// Delete a post
router.delete("/:id", verifyToken, deletePost);

export default router;
