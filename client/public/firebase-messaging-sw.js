// Scripts for firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyCHz0uiGsOcj1BDFHDLwE5Q4Y1C_te2jzU",
  authDomain: "softlms-7fb35.firebaseapp.com",
  projectId: "softlms-7fb35",
  storageBucket: "softlms-7fb35.firebasestorage.app",
  messagingSenderId: "220952434771",
  appId: "1:220952434771:web:b7987b3a015a0cbab38ea6"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || "New Notification";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: '/firebase-logo.png' // fallback icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
