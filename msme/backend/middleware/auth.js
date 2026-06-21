const fs = require("fs");
const admin = require("firebase-admin");
const env = require("../config/env");

function initializeFirebaseAdmin() {
  if (admin.apps.length) return;
  if (process.env.NODE_ENV === "production" && !env.authDisabled && !env.firebaseServiceAccountPath) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_PATH is required in production when backend auth is enabled.");
  }
  if (env.firebaseServiceAccountPath && !fs.existsSync(env.firebaseServiceAccountPath)) {
    throw new Error(`Firebase service account file not found: ${env.firebaseServiceAccountPath}`);
  }
  if (env.firebaseServiceAccountPath && fs.existsSync(env.firebaseServiceAccountPath)) {
    const serviceAccount = require(env.firebaseServiceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: env.firebaseProjectId,
    });
    return;
  }
  admin.initializeApp({ projectId: env.firebaseProjectId });
}

initializeFirebaseAdmin();

async function requireAuth(req, res, next) {
  if (env.authDisabled) {
    req.user = {
      uid: "dev-user",
      email: "dev@local",
      name: "Local Dev",
    };
    return next();
  }

  const header = req.header("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    return res.status(401).json({ success: false, error: "Missing Firebase Bearer token" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email || decoded.uid,
      name: decoded.name || decoded.email || decoded.uid,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, error: "Invalid Firebase token" });
  }
}

function actorFromUser(req) {
  return req.user?.email || req.user?.uid || "unknown";
}

function firebaseConfigStatus() {
  const fileConfigured = Boolean(env.firebaseServiceAccountPath);
  return {
    authDisabled: env.authDisabled,
    projectId: env.firebaseProjectId,
    serviceAccountConfigured: fileConfigured,
    serviceAccountPath: fileConfigured ? env.firebaseServiceAccountPath : "",
    serviceAccountExists: fileConfigured ? fs.existsSync(env.firebaseServiceAccountPath) : false,
    productionReady: env.authDisabled ? false : fileConfigured && fs.existsSync(env.firebaseServiceAccountPath),
  };
}

module.exports = { requireAuth, actorFromUser, firebaseConfigStatus };
