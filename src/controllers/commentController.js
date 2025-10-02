// src/controllers/commentController.js
import db from "../config/firebase.js";

const postsCollection = db.collection("posts");

// GET /posts/:postId/comments
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const postRef = postsCollection.doc(postId);
    const postSnap = await postRef.get();
    if (!postSnap.exists) return res.status(404).json({ msg: "Post not found" });

    const snap = await postRef.collection("comments").orderBy("createdAt", "asc").get();
    const comments = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    res.status(200).json(comments);
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({ error: err.message });
  }
};

// POST /posts/:postId/comments
export const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ msg: "Content is required" });
    }

    const postRef = postsCollection.doc(postId);
    const postSnap = await postRef.get();
    if (!postSnap.exists) return res.status(404).json({ msg: "Post not found" });

    const newComment = {
      content: content.trim(),
      authorId: req.user.userId,   // نفس أسلوب البوستات
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };

    const docRef = await postRef.collection("comments").add(newComment);
    res.status(201).json({ id: docRef.id, ...newComment });
  } catch (err) {
    console.error("Error creating comment:", err);
    res.status(500).json({ error: err.message });
  }
};

// PUT /posts/:postId/comments/:commentId
export const updateComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { content } = req.body;

    const postRef = postsCollection.doc(postId);
    const postSnap = await postRef.get();
    if (!postSnap.exists) return res.status(404).json({ msg: "Post not found" });

    const cRef = postRef.collection("comments").doc(commentId);
    const cSnap = await cRef.get();
    if (!cSnap.exists) return res.status(404).json({ msg: "Comment not found" });

    const comment = cSnap.data();

    // صلاحيات: صاحب الكومنت أو أدمِن
    const jwtUserId = req.user.userId;
    const role = String(req.user?.role || "").toLowerCase();
    if (String(comment.authorId) !== String(jwtUserId) && role !== "admin") {
      return res.status(403).json({ msg: "You are not allowed to edit this comment" });
    }

    const updateData = {
      updatedAt: new Date().toISOString(),
    };
    if (typeof content === "string" && content.trim()) {
      updateData.content = content.trim();
    }

    await cRef.update(updateData);
    res.status(200).json({ msg: "Comment updated successfully" });
  } catch (err) {
    console.error("Error updating comment:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE /posts/:postId/comments/:commentId
export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    const postRef = postsCollection.doc(postId);
    const postSnap = await postRef.get();
    if (!postSnap.exists) return res.status(404).json({ msg: "Post not found" });

    const cRef = postRef.collection("comments").doc(commentId);
    const cSnap = await cRef.get();
    if (!cSnap.exists) return res.status(404).json({ msg: "Comment not found" });

    const comment = cSnap.data();

    // صلاحيات: صاحب الكومنت أو أدمِن
    const jwtUserId = req.user.userId;
    const role = String(req.user?.role || "").toLowerCase();
    if (String(comment.authorId) !== String(jwtUserId) && role !== "admin") {
      return res.status(403).json({ msg: "You are not allowed to delete this comment" });
    }

    await cRef.delete();
    res.status(200).json({ msg: "Comment deleted successfully" });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ error: err.message });
  }
};
