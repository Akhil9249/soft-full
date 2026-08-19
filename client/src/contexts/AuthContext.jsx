import { createContext, useState, useEffect } from "react";
import { requestForToken, registerOnMessageListener } from "../firebase";

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {

    const [auth, setAuth] = useState({});

    const accessToken = localStorage.getItem("accessToken");
    // const username = localStorage.getItem("username");
    const image = localStorage.getItem("profileImage");
    const name = localStorage.getItem("name")
    const role = localStorage.getItem("role");
    const id = localStorage.getItem("userId");

    if (accessToken && role && !auth.accessToken) {
        setAuth({ accessToken, role, image, name, id });
    };

    useEffect(() => {
        if (auth.accessToken) {
            const registerToken = async () => {
                try {
                    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
                    if (!vapidKey) {
                        console.warn("VITE_FIREBASE_VAPID_KEY not configured in env.");
                        return;
                    }
                    const token = await requestForToken(vapidKey);
                    if (token) {
                        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
                        const response = await fetch(`${backendUrl}/api/notifications/register-token`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': auth.accessToken
                            },
                            body: JSON.stringify({ token })
                        });
                        const data = await response.json();
                        console.log("FCM Token registration response:", data);
                    }
                } catch (error) {
                    console.error("Failed to register FCM token:", error);
                }
            };
            registerToken();
        }
    }, [auth.accessToken]);

    useEffect(() => {
        let unsubscribe;
        if (auth.accessToken) {
            unsubscribe = registerOnMessageListener((payload) => {
                console.log("Global live notification payload received:", payload);

                // Show native browser notification in foreground
                if (Notification.permission === "granted") {
                    navigator.serviceWorker.ready.then((registration) => {
                        registration.showNotification(payload.notification?.title || "New Notification", {
                            body: payload.notification?.body || "",
                            icon: "/soft-fev-DlI_daCd.png", // app logo
                            tag: payload.data?.notificationId || "lms-notification"
                        });
                    }).catch(err => {
                        console.error("Service worker not ready for foreground notification:", err);
                    });
                }

                // Dispatch custom event to notify components like Notification list to refresh
                window.dispatchEvent(new CustomEvent("new-fcm-notification", { detail: payload }));
            });
        }
        return () => {
            if (typeof unsubscribe === "function") unsubscribe();
        };
    }, [auth.accessToken]);

    return (
        <AuthContext.Provider value={{ auth, setAuth }}>
            {children}
        </AuthContext.Provider>
    )

}