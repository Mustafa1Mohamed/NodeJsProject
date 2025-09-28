import { Router } from "express";
import userController from "../controllers/userController.js";
import verifyToken from "../middlewares/verifyToken.js";
import checkRole from "../middlewares/checkRole.js";

const userRoutes = Router();

// Admin فقط يقدر يشوف كل اليوزرز
userRoutes.get(
  "/users",
  verifyToken,
  checkRole(["admin"]),
  userController.getAllUsers
);

// Admin أو صاحب الحساب يقدر يشوف بيانات يوزر معين
userRoutes.get("/users/:id", verifyToken, userController.getUserById);

// Signup/Login مفتوح للجميع
userRoutes.post("/signup", userController.signup);
userRoutes.post("/login", userController.login);

// Admin فقط يقدر يعدل أو يمسح أي يوزر
userRoutes.put(
  "/users/:id",
  verifyToken,
  checkRole(["admin"]),
  userController.updateUser
);
userRoutes.delete(
  "/users/:id",
  verifyToken,
  checkRole(["admin"]),
  userController.deleteUser
);

export default userRoutes;
