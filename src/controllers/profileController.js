import { db, bucket } from "../config/firebase.js";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";

// helper: fetch user doc by id
async function getUserDoc(uid) {
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

// sanitize user data before sending to client
function publicUser(u) {
  if (!u) return null;
  const { passwordHash, ...rest } = u;
  return rest;
}

// GET /me
export async function getMe(req, res) {
  try {
    const uid = req.user?.userId;
    if (!uid) return res.status(401).json({ msg: "Unauthorized" });

    const me = await getUserDoc(uid);
    if (!me) return res.status(404).json({ msg: "User not found" });

    return res.status(200).json(publicUser(me));
  } catch (e) {
    console.error("[getMe]", e);
    return res.status(500).json({ msg: "Server error" });
  }
}

// PUT /me  (update name/email/photo)
// يدعم حالتين للصور:
// 1) req.file (يرفع على Firebase Storage)
// 2) req.body.photoURL (رابط جاهز من Supabase Storage)
export async function updateMe(req, res) {
  try {
    const uid = req.user?.userId;
    if (!uid) return res.status(401).json({ msg: "Unauthorized" });

    const ref = db.collection("users").doc(uid);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ msg: "User not found" });

    const updates = {};
    const { name, email, photoURL } = req.body || {};
    if (typeof name === "string" && name.trim()) updates.name = name.trim();
    if (typeof email === "string" && email.trim()) updates.email = email.trim();

    // (B) Supabase public URL
    if (typeof photoURL === "string" && /^https?:\/\//i.test(photoURL)) {
      updates.photoURL = photoURL;
    }

    // (A) Firebase upload (لو في ملف جايلنا من multer)
    if (req.file) {
      const ext = req.file.originalname?.split(".").pop() || "jpg";
      const filename = `avatars/${uid}/${uuid()}.${ext}`;
      const file = bucket.file(filename);
      const stream = file.createWriteStream({
        resumable: false,
        metadata: {
          contentType: req.file.mimetype || "image/jpeg",
          metadata: { firebaseStorageDownloadTokens: uuid() },
        },
      });

      await new Promise((resolve, reject) => {
        stream.on("error", reject);
        stream.on("finish", resolve);
        stream.end(req.file.buffer);
      });

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
      updates.photoURL = publicUrl;
    }

    if (Object.keys(updates).length > 0) {
      await ref.set(updates, { merge: true });
    }

    const updated = await ref.get();
    return res.status(200).json(publicUser({ id: updated.id, ...updated.data() }));
  } catch (e) {
    console.error("[updateMe]", e);
    return res.status(500).json({ msg: "Server error" });
  }
}

// (لو عايز ترجعله لاحقا، سيبناه كما هو)
// export async function changeMyPassword(...) { ... }
