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

// GET /me
export async function getMe(req, res) {
  try {
    const uid = req.myToken?.userId;
    if (!uid) return res.status(401).json({ msg: "Unauthorized" });

    const me = await getUserDoc(uid);
    if (!me) return res.status(404).json({ msg: "User not found" });

    delete me.password;
    delete me.passwordHash;
    return res.status(200).json(me);
  } catch (e) {
    console.error("[getMe]", e);
    return res.status(500).json({ msg: "Server error" });
  }
}

// PUT /me → update name/email (+optional photo)
export async function updateMe(req, res, next) {
  try {
    const uid = req.myToken?.userId;
    if (!uid) return res.status(401).json({ msg: "Unauthorized" });

    const ref = db.collection("users").doc(uid);
    const updates = {};
    const { name, email } = req.body || {};

    if (name) updates.name = String(name).trim();
    if (email) updates.email = String(email).trim().toLowerCase();

    // optional photo
    if (req.file) {
      try {
        const ext = (req.file.mimetype?.split("/")?.[1] || "jpg").toLowerCase();
        const filename = `users/${uid}/profile_${uuid()}.${ext}`;
        const file = bucket.file(filename);

        await file.save(req.file.buffer, {
          metadata: { contentType: req.file.mimetype },
          resumable: false,
        });

        // Try to make it public; if not allowed, fall back to signed URL
        let publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

        try {
          await file.makePublic();
          updates.photoURL = publicUrl;
        } catch (permErr) {
          // makePublic failed (IAM). Generate a signed URL valid for ~7 days.
          const expires = Date.now() + 7 * 24 * 60 * 60 * 1000;
          const [signedUrl] = await file.getSignedUrl({
            action: "read",
            expires,
            version: "v4",
          });
          updates.photoURL = signedUrl;
        }
      } catch (uploadErr) {
        console.error("[updateMe] upload error:", uploadErr);
        // Let the global error handler format Multer/Storage errors
        return next(uploadErr);
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ msg: "No updates provided" });
    }

    await ref.set(updates, { merge: true });
    const updated = await ref.get();
    const data = updated.data() || {};
    delete data.password;
    delete data.passwordHash;

    return res.status(200).json({ id: uid, ...data });
  } catch (e) {
    console.error("[updateMe]", e);
    return res.status(500).json({ msg: "Server error" });
  }
}

// PUT /me/password
export async function changeMyPassword(req, res) {
  try {
    const uid = req.myToken?.userId;
    if (!uid) return res.status(401).json({ msg: "Unauthorized" });

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ msg: "Invalid payload" });
    }

    const ref = db.collection("users").doc(uid);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ msg: "User not found" });

    const user = snap.data() || {};
    const hash = user.passwordHash || user.password;
    if (!hash) return res.status(400).json({ msg: "No password set" });

    const ok = await bcrypt.compare(String(currentPassword), String(hash));
    if (!ok) return res.status(400).json({ msg: "Current password is incorrect" });

    const newHash = await bcrypt.hash(String(newPassword), 10);
    await ref.set({ passwordHash: newHash }, { merge: true });

    return res.status(200).json({ msg: "Password updated" });
  } catch (e) {
    console.error("[changeMyPassword]", e);
    return res.status(500).json({ msg: "Server error" });
  }
}
