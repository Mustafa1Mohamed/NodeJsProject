import { Router } from "express";
import userController from "../controllers/userController.js";
import verifyToken from "../middlewares/verifyToken.js";
const userRoutes = Router();

userRoutes.get("/users", verifyToken, userController.getAllUsers);
userRoutes.get("/users/:id", verifyToken, userController.getUserById);
userRoutes.post("/users", userController.createUser);
userRoutes.put("/users/:id", verifyToken, userController.updateUser);
userRoutes.delete("/users/:id", verifyToken, userController.deleteUser);
userRoutes.post("/signup", userController.signup);
userRoutes.post("/login", userController.login);

export default userRoutes;