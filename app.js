import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔥 YOUR CONFIG (already correct)
const firebaseConfig = {
  apiKey: "AIzaSyCErlw718vuOyobfHCG-hHOCkY0qO--XZg",
  authDomain: "mailman-28.firebaseapp.com",
  projectId: "mailman-28",
  storageBucket: "mailman-28.firebasestorage.app",
  messagingSenderId: "519311123194",
  appId: "1:519311123194:web:47ec7bcc397b7732225f43"
};

// 🔥 INIT
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const provider = new GoogleAuthProvider();

// =====================
// 🔥 LOGIN BUTTON
// =====================
document.getElementById("loginBtn").onclick = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    console.log("User:", user);

    // =====================
    // 🔥 STORE IN FIRESTORE
    // =====================
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        isPremium: false,
        dailyUsage: 0,
        lastReset: new Date().toDateString(),
        subscriptionEnd: null
      });
    }

    // =====================
    // 🔥 STORE LOCALLY (IMPORTANT)
    // =====================
    localStorage.setItem("user", JSON.stringify({
      uid: user.uid,
      email: user.email,
      name: user.displayName
    }));

    // =====================
    // 🔥 SEND TO EXTENSION (NEXT STEP READY)
    // =====================
    if (window.chrome && chrome.runtime) {
      chrome.runtime.sendMessage("YOUR_EXTENSION_ID", {
        type: "SET_USER",
        user: {
          uid: user.uid,
          email: user.email
        }
      });
    }

    // =====================
    // 🔥 REDIRECT
    // =====================
    window.location.href = "/dashboard.html";

  } catch (err) {
    console.error(err);
    alert("Login failed");
  }
};
