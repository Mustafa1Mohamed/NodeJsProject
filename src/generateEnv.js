// generateEnv.js
// Usage:
//   node generateEnv.js [path/to/serviceAccountKey.json] [output/.env]
// Examples:
//   node generateEnv.js                           (will try ./serviceAccountKey.json and ./src/config/serviceAccountKey.json)
//   node generateEnv.js ./src/config/serviceAccountKey.json .env

import { readFile, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fileExists(p) {
  try {
    await readFile(p, { encoding: "utf8" });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const argPath = process.argv[2];
  const outPath = process.argv[3] || ".env";

  const candidates = argPath
    ? [path.resolve(argPath)]
    : [
        path.resolve("./serviceAccountKey.json"),
        path.resolve("./src/config/serviceAccountKey.json"),
        path.resolve(__dirname, "./serviceAccountKey.json"),
        path.resolve(__dirname, "./src/config/serviceAccountKey.json"),
      ];

  let jsonPath = null;
  for (const p of candidates) {
    if (await fileExists(p)) {
      jsonPath = p;
      break;
    }
  }

  if (!jsonPath) {
    console.error(
      "❌ serviceAccountKey.json not found. Tried:\n" + candidates.join("\n")
    );
    process.exit(1);
  }

  console.log("🔎 Using service account JSON:", jsonPath);

  const raw = await readFile(jsonPath, { encoding: "utf8" });
  let obj;
  try {
    obj = JSON.parse(raw);
  } catch (err) {
    console.error("❌ Invalid JSON in service account file:", err.message);
    process.exit(1);
  }

  const {
    project_id,
    private_key_id,
    private_key,
    client_email,
    client_id,
    auth_uri,
    token_uri,
    auth_provider_x509_cert_url,
    client_x509_cert_url,
  } = obj;

  if (!project_id || !private_key || !client_email) {
    console.error(
      "❌ service account JSON is missing required fields (project_id/private_key/client_email)."
    );
    process.exit(1);
  }

  // Replace real newline characters with literal \n so .env keeps it one line
  const privateKeyOneLine = private_key.replace(/\n/g, "\\n");

  const envContent =
    [
      `FIREBASE_PROJECT_ID=${project_id}`,
      `FIREBASE_PRIVATE_KEY_ID=${private_key_id || ""}`,
      `FIREBASE_PRIVATE_KEY=${privateKeyOneLine}`,
      `FIREBASE_CLIENT_EMAIL=${client_email}`,
      `FIREBASE_CLIENT_ID=${client_id || ""}`,
      `FIREBASE_AUTH_URI=${auth_uri || ""}`,
      `FIREBASE_TOKEN_URI=${token_uri || ""}`,
      `FIREBASE_AUTH_PROVIDER_X509_CERT_URL=${
        auth_provider_x509_cert_url || ""
      }`,
      `FIREBASE_CLIENT_X509_CERT_URL=${client_x509_cert_url || ""}`,
      `FIREBASE_UNIVERSE_DOMAIN=googleapis.com`,
    ].join("\n") + "\n";

  await writeFile(outPath, envContent, { encoding: "utf8", flag: "w" });
  console.log(`✅ .env file written to ${outPath}`);
  console.log(
    "🔐 IMPORTANT: add the .env file to .gitignore to avoid leaking credentials."
  );
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
