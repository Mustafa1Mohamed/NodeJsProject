import getCommentsCollection from "../models/commentModel.js";
import usersCollection from "../models/userModel.js";

// ✅ إضافة كومنت
export const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const { postId } = req.params;
    const authorId = req.myToken.userId;

    if (!content) return res.status(400).send("Content is required");

    const commentsCollection = getCommentsCollection(postId);

    const newComment = {
      content,
      authorId,
      createdAt: new Date().toISOString(),
    };

    const docRef = await commentsCollection.add(newComment);

    res.send({ id: docRef.id, ...newComment });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// ✅ جلب كل الكومنتات الخاصة ببوسط
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const commentsCollection = getCommentsCollection(postId);

    const snapshot = await commentsCollection.get();

    const comments = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const comment = { id: doc.id, ...doc.data() };

        // نجيب بيانات الكاتب
        const userDoc = await usersCollection.doc(comment.authorId).get();
        if (userDoc.exists) {
          const { name, email } = userDoc.data();
          comment.author = { name, email };
        }

        return comment;
      })
    );

    res.send(comments);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// ✅ تحديث كومنت
export const updateComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { content } = req.body;
    const userId = req.myToken.userId;

    const commentsCollection = getCommentsCollection(postId);
    const commentDoc = await commentsCollection.doc(commentId).get();

    if (!commentDoc.exists) return res.status(404).send("Comment not found");
    if (commentDoc.data().authorId !== userId)
      return res.status(403).send("Not allowed");

    await commentsCollection.doc(commentId).update({ content });
    res.send("Comment updated");
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// ✅ حذف كومنت
export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.myToken.userId;

    const commentsCollection = getCommentsCollection(postId);
    const commentDoc = await commentsCollection.doc(commentId).get();

    if (!commentDoc.exists) return res.status(404).send("Comment not found");
    if (commentDoc.data().authorId !== userId)
      return res.status(403).send("Not allowed");

    await commentsCollection.doc(commentId).delete();
    res.send("Comment deleted");
  } catch (error) {
    res.status(500).send(error.message);
  }
};
