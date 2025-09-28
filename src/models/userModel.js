import db from "../config/firebase.js";

const usersCollection = db.collection("users");
export default usersCollection;
