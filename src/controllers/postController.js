import db from "../config/firebase.js";

const postsCollection = db.collection("posts");

export const getAllPosts = async (req, res) => {
  try {
    const snapshot = await postsCollection.get();
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content)
      return res.status(400).json({ message: "Content is required" });

    const newPost = {
      content,
      authorId: req.user.uid, // استخدم uid من التوكن
      createdAt: new Date(),
    };

    const docRef = await postsCollection.add(newPost);
    res.status(201).json({ id: docRef.id, ...newPost });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const postDoc = postsCollection.doc(id);
    const doc = await postDoc.get();

    if (!doc.exists) return res.status(404).json({ message: "Post not found" });

    await postDoc.delete();
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
