import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv"
dotenv.config()
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const serviceAccount = JSON.parse(
    readFileSync(path.join(dirname, "servicesAccountKey.json"))
)

// const serviceAccount = {
//     type: "service_account",
//     project_id: process.env.project_id,
//     private_key_id: process.env.private_key_id,
//     private_key: process.env.private_key?.replace(/\\n/g, '\n'),
//     client_email: process.env.client_email,
//     client_id: process.env.client_id,
//     auth_uri: process.env.auth_uri,
//     token_uri: process.env.token_uri,
//     auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_ui,
//     client_x509_cert_url: process.env.client_x509_cert_url,
//     universe_domain: process.env.universe_domain
// };
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()
export default db