import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import checkRole from "../middlewares/checkRole.js";
import {
  getAllPosts,
  createPost,
  deletePost,
} from "../controllers/postController.js";

const router = express.Router();

router.get("/", verifyToken, getAllPosts);

router.post("/", verifyToken, checkRole(["admin", "user"]), createPost);

router.delete("/:id", verifyToken, checkRole(["admin"]), deletePost);

export default router;
