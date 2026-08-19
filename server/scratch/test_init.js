const admin = require("firebase-admin");
const { getMessaging } = require("firebase-admin/messaging");
const serviceAccount = require("../config/firebase-service-account.json");

try {
  const app = admin.initializeApp({
    credential: admin.cert(serviceAccount)
  });
  console.log("Initialization successful!");
  const messaging = getMessaging(app);
  console.log("Messaging instance obtained successfully:", typeof messaging);
} catch (err) {
  console.error("Initialization failed:", err);
}
