// Firebase initialization + Analytics for the Adtomate Solutions site.
//
// NOTE: these config values are the Firebase *web* config and are safe to be
// public — they ship in client code by design (access is controlled by
// Firebase Security Rules / API-key restrictions, not by hiding this object).
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyAxG0ssX3gyWByLcdm9riUcGSO3nSBtLkE",
  authDomain: "sociovia-c9473.firebaseapp.com",
  projectId: "sociovia-c9473",
  storageBucket: "sociovia-c9473.firebasestorage.app",
  messagingSenderId: "664561410914",
  appId: "1:664561410914:web:1c81704b1fdb10a4c0c23b",
  measurementId: "G-6K7Q3WD797"
};

const app = initializeApp(firebaseConfig);

// Analytics only runs in supported, browser contexts (needs cookies, https,
// an authorized domain). Guard it so it never breaks the page elsewhere.
isSupported()
  .then((ok) => { if (ok) getAnalytics(app); })
  .catch(() => { /* analytics unavailable — ignore */ });

export { app };
