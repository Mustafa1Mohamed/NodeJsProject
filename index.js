import express from "express";
import userRoutes from "./src/routes/userRoutes.js";
import profileRoutes from "./src/routes/profileRoutes.js";
import postRoutes from "./src/routes/postRoutes.js";
import cors from "cors";

const app = express();
app.port = 3000;
app.use(cors());
app.use(express.json());
app.use(userRoutes);
app.use("/uploads", express.static("uploads"));

// === [ADDED LINES] ===
app.use(express.static("src/views"));
app.use(profileRoutes);
app.use("/posts", postRoutes);
// === [END ADDED] ===

app.listen(app.port, () => console.log(`Server running on port ${app.port}`));
