// src/routes/postRoutes.js
import { Router } from "express";
import verifyToken from "../middlewares/verifyToken.js";
import { upload } from "../middlewares/upload.js";
import {
  getAllPosts,
  createPost,
  updatePost,
  deletePost,
} from "../controllers/postController.js";
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";

const router = Router();

// Posts
router.post("/", verifyToken, upload.single("media"), createPost);
router.get("/", verifyToken, getAllPosts);
router.put("/:id", verifyToken, upload.single("media"), updatePost);
router.delete("/:id", verifyToken, deletePost);

// Comments (nested under post)
router.get("/:postId/comments", verifyToken, getComments);
router.post("/:postId/comments", verifyToken, createComment);
router.put("/:postId/comments/:commentId", verifyToken, updateComment);
router.delete("/:postId/comments/:commentId", verifyToken, deleteComment);

export default router;
