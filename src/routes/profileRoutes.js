import { Router } from "express";
import verifyToken from "../middlewares/verifyToken.js";
import { upload } from "../middlewares/upload.js";
import { getMe, updateMe, changeMyPassword } from "../controllers/profileController.js";

const router = Router();

router.get("/me", verifyToken, getMe);
router.put("/me", verifyToken, upload.single("photo"), updateMe);
router.put("/me/password", verifyToken, changeMyPassword);

export default router;
