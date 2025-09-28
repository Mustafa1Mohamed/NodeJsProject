import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const serviceAccount = JSON.parse(
  readFileSync(path.join(dirname, "servicesAccountKey.json"), "utf-8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_BUCKET || "buy-it-68dd3.appspot.com",
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

export { db, bucket };
export default db;
