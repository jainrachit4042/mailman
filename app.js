import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔥 FIREBASE CONFIG
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

// 🔥 GET EXTENSION ID (PUT YOUR REAL ONE HERE)
const EXTENSION_ID = "YOUR_EXTENSION_ID";

// =====================
// 🔥 AUTH STATE HANDLER (AUTO LOGIN)
// =====================
onAuthStateChanged(auth, async (user) => {

  if (user) {
    console.log("User already logged in:", user);

    // 🔥 Store locally
    localStorage.setItem("user", JSON.stringify({
      uid: user.uid,
      email: user.email,
      name: user.displayName
    }));

    // 🔥 Ensure Firestore user exists
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

    // 🔥 Send to extension
    sendUserToExtension(user);

    // 🔥 If on login page → go to dashboard
    if (window.location.pathname === "/" || window.location.pathname.includes("index")) {
      window.location.href = "/dashboard.html";
    }

  } else {
    console.log("No user logged in");

    localStorage.removeItem("user");

    // 🔥 If on dashboard → force login
    if (window.location.pathname.includes("dashboard")) {
      window.location.href = "/";
    }
  }
});

// =====================
// 🔥 LOGIN BUTTON
// =====================
const loginBtn = document.getElementById("loginBtn");

if (loginBtn) {
  loginBtn.onclick = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log("Logged in:", user);

      // 🔥 Store locally
      localStorage.setItem("user", JSON.stringify({
        uid: user.uid,
        email: user.email,
        name: user.displayName
      }));

      // 🔥 Send to extension
      sendUserToExtension(user);

      // 🔥 Redirect
      window.location.href = "/dashboard.html";

    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  };
}

// =====================
// 🔥 LOGOUT BUTTON
// =====================
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.onclick = async () => {
    await signOut(auth);

    localStorage.removeItem("user");

    // 🔥 Notify extension
    if (window.chrome && chrome.runtime) {
      chrome.runtime.sendMessage(EXTENSION_ID, {
        type: "LOGOUT"
      });
    }

    window.location.href = "/";
  };
}

// =====================
// 🔥 SHOW USER INFO (DASHBOARD)
// =====================
const userInfo = document.getElementById("userInfo");

if (userInfo) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user) {
    userInfo.innerText = "Logged in as: " + user.email;
  }
}

// =====================
// 🔥 SEND USER TO EXTENSION
// =====================
function sendUserToExtension(user) {
  try {
    if (window.chrome && chrome.runtime) {
      chrome.runtime.sendMessage(EXTENSION_ID, {
        type: "SET_USER",
        user: {
          uid: user.uid,
          email: user.email
        }
      });
    }
  } catch (e) {
    console.log("Extension not available");
  }
}
