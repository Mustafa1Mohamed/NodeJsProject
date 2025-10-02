import db, { bucket } from "../config/firebase.js";

// Firestore collection reference
const postsCollection = db.collection("posts");

//  Get All Posts
export const getAllPosts = async (req, res) => {
  try {
    const snapshot = await postsCollection.orderBy("createdAt", "desc").get();
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: error.message });
  }
};

//  Create Post
export const createPost = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content && !req.file) {
      return res.status(400).json({ msg: "Content or file is required" });
    }

    let imageUrl = null;

    // Upload file to Firebase Storage if provided
    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const file = bucket.file(fileName);

      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
        public: true, // Make file accessible publicly
      });

      // Direct download link
      imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
        fileName
      )}?alt=media`;
    }

    const newPost = {
      content,
      imageUrl,
      authorId: req.user.userId, // ثابتة كما هي
      createdAt: new Date().toISOString(),
    };

    const docRef = await postsCollection.add(newPost);

    res.status(201).json({ id: docRef.id, ...newPost });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: error.message });
  }
};

//  Update Post
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const docRef = postsCollection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) return res.status(404).json({ msg: "Post not found" });

    // ===== Allow owner OR admin =====
    const post = doc.data();
    const authorId = post.authorId;
    const jwtUserId = req.user.userId;
    const role = String(req.user?.role || "").toLowerCase();

    if (authorId !== jwtUserId && role !== "admin") {
      return res
        .status(403)
        .json({ msg: "You are not allowed to edit this post" });
    }
    // =================================

    let updateData = { updatedAt: new Date().toISOString() };

    if (content) updateData.content = content;

    // If new file uploaded, replace the old one
    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const file = bucket.file(fileName);

      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
        public: true,
      });

      updateData.imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
        fileName
      )}?alt=media`;
    }

    await docRef.update(updateData);

    res.status(200).json({ msg: "Post updated successfully" });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ error: error.message });
  }
};

//  Delete Post
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = postsCollection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) return res.status(404).json({ msg: "Post not found" });

    // ===== Allow owner OR admin =====
    const post = doc.data();
    const authorId = post.authorId;
    const jwtUserId = req.user.userId;
    const role = String(req.user?.role || "").toLowerCase();

    if (authorId !== jwtUserId && role !== "admin") {
      return res
        .status(403)
        .json({ msg: "You are not allowed to delete this post" });
    }
    // =================================

    await docRef.delete();

    res.status(200).json({ msg: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: error.message });
  }
};
