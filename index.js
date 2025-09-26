import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userRoutes from "./src/routes/userRoutes.js";

const app = express();
app.port = 3000
app.use(express.json());
app.use(userRoutes)
app.listen(app.port, () => console.log(`Server running on port ${app.port}`));