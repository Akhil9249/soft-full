const admin = require("firebase-admin");
const { getMessaging } = require("firebase-admin/messaging");
const path = require("path");
const fs = require("fs");

let firebaseApp = null;
let messaging = null;

try {
  let credential = null;

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey
    });
    console.log("🔒 Loaded Firebase credentials from Environment Variables.");
  } else {
    const defaultPath = path.join(__dirname, "firebase-service-account.json");
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || defaultPath;

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      credential = admin.credential.cert(serviceAccount);
      console.log(`🔒 Loaded Firebase credentials from file: ${serviceAccountPath}`);
    }
  }

  if (credential) {
    firebaseApp = admin.initializeApp({
      credential
    });
    messaging = getMessaging(firebaseApp);
    console.log("🔥 Firebase Admin SDK initialized successfully.");
  } else {
    console.warn(
      "⚠️  Firebase configuration (env variables or JSON file) not found. Push notifications will be logged but not sent."
    );
  }
} catch (error) {
  console.error("❌ Failed to initialize Firebase Admin SDK:", error);
}

/**
 * Sends a multicast push notification to the specified tokens.
 * @param {string[]} tokens - Array of FCM device tokens.
 * @param {string} title - Notification title.
 * @param {string} body - Notification body.
 * @param {object} [data] - Optional metadata payload.
 */
const sendMulticastNotification = async (tokens, title, body, data = {}) => {
  if (!messaging) {
    console.log(`[Push Notification Mock] Title: "${title}", Body: "${body}" (Firebase Admin not initialized)`);
    return null;
  }

  if (!tokens || tokens.length === 0) {
    console.log("[Push Notification] No tokens provided, skipping send.");
    return null;
  }

  // Filter out any empty/falsy tokens
  const activeTokens = tokens.filter(Boolean);
  if (activeTokens.length === 0) return null;

  const message = {
    notification: {
      title,
      body
    },
    data: data || {},
    tokens: activeTokens
  };

  try {
    const response = await messaging.sendEachForMulticast(message);
    console.log(`Successfully sent message to ${response.successCount} devices.`);
    if (response.failureCount > 0) {
      console.log(`Failed to send to ${response.failureCount} devices.`);
    }
    return response;
  } catch (error) {
    console.error("Error sending multicast message:", error);
    throw error;
  }
};

module.exports = {
  admin,
  messaging,
  sendMulticastNotification
};
