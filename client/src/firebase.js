import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCHz0uiGsOcj1BDFHDLwE5Q4Y1C_te2jzU",
  authDomain: "softlms-7fb35.firebaseapp.com",
  projectId: "softlms-7fb35",
  storageBucket: "softlms-7fb35.firebasestorage.app",
  messagingSenderId: "220952434771",
  appId: "1:220952434771:web:b7987b3a015a0cbab38ea6",
  measurementId: "G-7TW9XZB8D1"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestForToken = async (vapidKey) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const currentToken = await getToken(messaging, {
        vapidKey: vapidKey
      });
      if (currentToken) {
        return currentToken;
      } else {
        console.warn("No registration token available. Request permission to generate one.");
      }
    } else {
      console.warn("Notification permission was denied.");
    }
  } catch (err) {
    console.error("An error occurred while retrieving token. ", err);
  }
  return null;
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export const registerOnMessageListener = (callback) => {
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};
