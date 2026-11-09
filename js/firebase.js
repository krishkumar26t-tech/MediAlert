// Firebase App
import { initializeApp } from
"https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

// Firebase Authentication
import { getAuth } from
"https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

// Firestore Database
import { getFirestore } from
"https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDFOb6goocFM7mB5lPrS7KLi3WEpOW-VJk",
    authDomain: "medialert-india.firebaseapp.com",
    projectId: "medialert-india",
    storageBucket: "medialert-india.firebasestorage.app",
    messagingSenderId: "977064572158",
    appId: "1:977064572158:web:38667bbe8d23661cd4a1af"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

console.log("Firebase connected successfully!");
