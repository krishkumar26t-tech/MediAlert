import { auth } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";


// Registration

const signupForm = document.getElementById("signupForm");

if (signupForm) {

    signupForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const name = document.getElementById("name").value.trim();

        const email = document.getElementById("email").value.trim();

        const password = document.getElementById("password").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        const message = document.getElementById("message");

        if (password !== confirmPassword) {

            message.textContent = "Passwords do not match!";
            return;

        }

        try {

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            await updateProfile(userCredential.user, {
                displayName: name
            });

            message.textContent = "Registration successful!";

            window.location.href = "dashboard.html";

        }

        catch (error) {

            message.textContent = error.message;

        }

    });

}


// Login

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email = document.getElementById("email").value.trim();

        const password = document.getElementById("password").value;

        const message = document.getElementById("message");

        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            message.textContent = "Login successful!";

            window.location.href = "dashboard.html";

        }

        catch (error) {

            message.textContent = error.message;

        }

    });

}


// Forgot Password

const forgotPassword =
    document.getElementById("forgotPassword");

if (forgotPassword) {

    forgotPassword.addEventListener("click", async () => {

        const email = document.getElementById("email").value.trim();

        const message = document.getElementById("message");

        if (!email) {

            message.textContent = "Enter your email address first.";
            return;

        }

        try {

            await sendPasswordResetEmail(auth, email);

            message.textContent =
                "Password reset email sent. Check your inbox.";

        }

        catch (error) {

            message.textContent = error.message;

        }

    });

}


// Authentication State

onAuthStateChanged(auth, (user) => {

    const currentPage = window.location.pathname;

    if (user && (
        currentPage.endsWith("/login.html") ||
        currentPage.endsWith("/signup.html")
    )) {

        window.location.href = "dashboard.html";

    }

    if (!user && currentPage.endsWith("/dashboard.html")) {

        window.location.href = "login.html";

    }

});