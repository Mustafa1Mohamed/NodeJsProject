import express from "express";
import userRoutes from "./src/routes/userRoutes.js";
import cors from "cors";
const app = express();
app.port = 3000
app.use(cors());
app.use(express.json());
app.use(userRoutes)
app.listen(app.port, () => console.log(`Server running on port ${app.port}`));