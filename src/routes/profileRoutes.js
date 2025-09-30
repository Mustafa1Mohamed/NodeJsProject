import { Router } from "express";
import verifyToken from "../middlewares/verifyToken.js";
import { upload } from "../middlewares/upload.js";
import { getMe, updateMe } from "../controllers/profileController.js"; // شلنا changeMyPassword

const router = Router();

router.get("/me", verifyToken, getMe);
router.put("/me", verifyToken, upload.single("photo"), updateMe);
// شلنا راوت تغيير الباسورد:
// router.put("/me/password", verifyToken, changeMyPassword);

export default router;
