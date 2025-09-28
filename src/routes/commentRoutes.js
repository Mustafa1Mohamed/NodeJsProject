import { Router } from "express";
import verifyToken from "../middlewares/verifyToken.js";
import {
  addComment,
  getComments,
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";

const commentRoutes = Router({ mergeParams: true });

// POST /posts/:postId/comments
commentRoutes.post("/", verifyToken, addComment);

// GET /posts/:postId/comments
commentRoutes.get("/", getComments);

// PUT /posts/:postId/comments/:commentId
commentRoutes.put("/:commentId", verifyToken, updateComment);

// DELETE /posts/:postId/comments/:commentId
commentRoutes.delete("/:commentId", verifyToken, deleteComment);

export default commentRoutes;
