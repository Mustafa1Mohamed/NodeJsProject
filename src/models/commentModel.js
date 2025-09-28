import db from "../config/firebase.js";

const getCommentsCollection = (postId) =>
  db.collection("posts").doc(postId).collection("comments");

export default getCommentsCollection;
