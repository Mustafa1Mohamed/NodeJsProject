import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static for HTML/CSS/JS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/views", express.static(path.join(__dirname, "src", "views")));
app.use("/public", express.static(path.join(__dirname, "src", "public")));

// Routes
import userRoutes from "./src/routes/userRoutes.js";
import profileRoutes from "./src/routes/profileRoutes.js";
app.use(userRoutes);      // /signup, /login, /users...
app.use(profileRoutes);   // /me, /me/password ...

// Root redirect
app.get("/", (req, res) => {
  res.redirect("/views/auth/login/login.html");
});

// (Optional) Health checks
import { db } from "./src/config/firebase.js";
app.get("/health", (req, res) => res.json({ ok: true }));
app.get("/health/db", async (req, res) => {
  try {
    const snap = await db.collection("users").limit(1).get();
    res.json({ ok: true, count: snap.size });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// ===== Global error handler (handles Multer + other runtime errors) =====
app.use((err, req, res, next) => {
  // Multer file-size/type errors commonly populate these:
  if (err) {
    const isSizeError = err.code === "LIMIT_FILE_SIZE";
    const hasField = !!err.field; // multer sets .field for invalid file
    const status = isSizeError || hasField ? 400 : 500;
    const message =
      err.message ||
      (isSizeError ? "File too large" : "Unexpected server error");
    return res.status(status).json({ msg: message });
  }
  return res.status(500).json({ msg: "Server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
