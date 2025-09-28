import usersCollection from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const JWT_EXPIRES = "7d";

// ========== Helpers ==========
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

// ========== Users (CRUD) ==========
export const getAllUsers = async (req, res) => {
  try {
    const snap = await usersCollection.get();
    const usersList = snap.docs.map((doc) => {
      const data = doc.data();
      delete data.password;
      delete data.passwordHash;
      return { id: doc.id, ...data };
    });
    return res.status(200).json(usersList);
  } catch (error) {
    console.error("[getAllUsers]", error);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const docRef = await usersCollection.doc(req.params.id).get();
    if (!docRef.exists) return res.status(404).json({ msg: "User not found" });
    const data = docRef.data();
    delete data.password;
    delete data.passwordHash;
    return res.status(200).json({ id: docRef.id, ...data });
  } catch (error) {
    console.error("[getUserById]", error);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const createUser = async (req, res) => {
  try {
    const docRef = await usersCollection.add(req.body);
    return res.status(201).json({ id: docRef.id });
  } catch (error) {
    console.error("[createUser]", error);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    await usersCollection.doc(req.params.id).update(req.body);
    return res.status(200).json({ msg: "Updated" });
  } catch (error) {
    console.error("[updateUser]", error);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await usersCollection.doc(req.params.id).delete();
    return res.status(200).json({ msg: "Deleted" });
  } catch (error) {
    console.error("[deleteUser]", error);
    return res.status(500).json({ msg: "Server error" });
  }
};

// ========== Auth ==========
const signup = async (req, res) => {
  try {
    let { name, email, password } = req.body;
    name = String(name || "").trim();
    email = normalizeEmail(email);
    password = String(password || "");

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "name, email, password required" });
    }

    const found = await usersCollection.where("email", "==", email).limit(1).get();
    if (!found.empty) {
      return res.status(409).json({ msg: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);

    const userDoc = {
      name,
      email,
      role: "user",
      emailVerified: false,
      photoURL: null,
      passwordHash: hash,
      createdAt: new Date().toISOString(),
    };

    const ref = await usersCollection.add(userDoc);

    const token = signToken({ userId: ref.id, role: "user", email });
    return res.status(201).json({
      msg: "Signup Success",
      token,
      user: { id: ref.id, name, email, role: "user", photoURL: null },
    });
  } catch (error) {
    console.error("[signup]", error);
    return res.status(500).json({ msg: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = normalizeEmail(email);
    password = String(password || "");

    if (!email || !password) {
      return res.status(400).json({ msg: "email and password required" });
    }

    const found = await usersCollection.where("email", "==", email).limit(1).get();
    if (found.empty) {
      return res.status(404).json({ msg: "User Not Found" });
    }

    const doc = found.docs[0];
    const user = doc.data();
    const hash = user.passwordHash || user.password;
    if (!hash) return res.status(400).json({ msg: "User has no password set" });

    const ok = await bcrypt.compare(password, hash);
    if (!ok) {
      return res.status(400).json({ msg: "Incorrect Password" });
    }

    const role = user.role || "user";
    const token = signToken({ userId: doc.id, role, email });

    return res.status(200).json({
      msg: "Login Success",
      token,
      user: { id: doc.id, name: user.name, email: user.email, role, photoURL: user.photoURL || null },
    });
  } catch (error) {
    console.error("[login]", error);
    return res.status(500).json({ msg: "Server error" });
  }
};

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  signup,
  login,
};
