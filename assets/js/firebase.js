// Firebase: Analytics + Firestore lead capture for the Adtomate site.
//
// NOTE: these config values are the Firebase *web* config and are safe to be
// public — they ship in client code by design (access is controlled by
// Firebase Security Rules / API-key restrictions, not by hiding this object).
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

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
const db = getFirestore(app);

// Analytics only runs in supported browser contexts; guard it.
isSupported()
  .then((ok) => { if (ok) getAnalytics(app); })
  .catch(() => {});

// Best-effort lead capture — the booking form (in main.js) calls this if present.
// If Firestore isn't enabled yet, the write throws and is caught by the caller;
// the WhatsApp handoff still delivers the lead, so nothing is lost.
window.AdtomateSaveLead = async function (lead) {
  await addDoc(collection(db, "leads"), {
    ...lead,
    createdAt: serverTimestamp(),
    source: "adtomate-website",
    page: location.href,
    userAgent: navigator.userAgent
  });
};

// Best-effort capture for the AI Transformation Assessment (assessment.js
// calls this if present). Same never-block guarantee: WhatsApp handoff
// still delivers the lead if this write fails or Firestore isn't ready.
window.AdtomateSaveAssessment = async function (lead) {
  await addDoc(collection(db, "assessment_leads"), {
    ...lead,
    createdAt: serverTimestamp(),
    source: "adtomate-website-assessment",
    page: location.href,
    userAgent: navigator.userAgent
  });
};

export { app, db };
