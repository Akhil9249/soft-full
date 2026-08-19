const admin = require("firebase-admin");
console.log("Firebase Admin type:", typeof admin);
console.log("Firebase Admin keys:", Object.keys(admin));
if (admin.default) {
  console.log("Firebase Admin default keys:", Object.keys(admin.default));
}
