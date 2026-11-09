import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";


// Get HTML elements

const profileForm = document.getElementById("profileForm");
const message = document.getElementById("message");
const saveButton = document.getElementById("saveProfileBtn");
const logoutBtn = document.getElementById("logoutBtn");

let currentUser = null;


// Firestore document reference

function getProfileReference() {
    return doc(db, "users", currentUser.uid, "profile", "personal");
}


// Check authentication

onAuthStateChanged(auth, async (user) => {

    if (user) {

        currentUser = user;

        console.log("User authenticated:", user.uid);

        await loadProfile();

    } else {

        window.location.href = "login.html";

    }

});


// Load existing profile

async function loadProfile() {

    try {

        const profileRef = getProfileReference();

        const snapshot = await getDoc(profileRef);

        if (snapshot.exists()) {

            const data = snapshot.data();

            document.getElementById("fullName").value = data.fullName || "";
            document.getElementById("age").value = data.age ?? "";
            document.getElementById("gender").value = data.gender || "";
            document.getElementById("bloodGroup").value = data.bloodGroup || "";

            document.getElementById("height").value = data.height ?? "";
            document.getElementById("weight").value = data.weight ?? "";

            document.getElementById("conditions").value = data.conditions || "";
            document.getElementById("allergies").value = data.allergies || "";
            document.getElementById("medications").value = data.medications || "";
            document.getElementById("medicalHistory").value = data.medicalHistory || "";

            document.getElementById("doctorName").value = data.doctorName || "";
            document.getElementById("doctorPhone").value = data.doctorPhone || "";

            message.textContent = "Your saved profile has been loaded.";
            message.style.color = "green";

        } else {

            message.textContent = "Please enter your health information.";
            message.style.color = "#087f8c";

        }

    } catch (error) {

        console.error("Error loading profile:", error);

        message.textContent = "Unable to load profile.";
        message.style.color = "red";

    }

}


// Save profile

profileForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    if (!currentUser) {
        message.textContent = "Please log in first.";
        return;
    }

    const age = Number(document.getElementById("age").value);
    const heightValue = document.getElementById("height").value;
    const weightValue = document.getElementById("weight").value;

    if (!Number.isInteger(age) || age < 1 || age > 120) {
        message.textContent = "Please enter a valid age.";
        message.style.color = "red";
        return;
    }

    const profileData = {

        fullName: document.getElementById("fullName").value.trim(),

        age: age,

        gender: document.getElementById("gender").value,

        bloodGroup: document.getElementById("bloodGroup").value,

        height: heightValue ? Number(heightValue) : null,

        weight: weightValue ? Number(weightValue) : null,

        conditions: document.getElementById("conditions").value.trim(),

        allergies: document.getElementById("allergies").value.trim(),

        medications: document.getElementById("medications").value.trim(),

        medicalHistory: document.getElementById("medicalHistory").value.trim(),

        doctorName: document.getElementById("doctorName").value.trim(),

        doctorPhone: document.getElementById("doctorPhone").value.trim(),

        updatedAt: serverTimestamp()

    };


    try {

        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        const profileRef = getProfileReference();

        await setDoc(profileRef, profileData, { merge: true });

        message.textContent = "Health profile saved successfully!";
        message.style.color = "green";

        console.log("Health profile saved successfully!");

    } catch (error) {

        console.error("Error saving profile:", error);

        message.textContent = "Error saving profile: " + error.message;
        message.style.color = "red";

    } finally {

        saveButton.disabled = false;
        saveButton.textContent = "Save Health Profile";

    }

});


// Logout

logoutBtn.addEventListener("click", async () => {

    try {

        await signOut(auth);

        window.location.href = "login.html";

    } catch (error) {

        console.error("Logout error:", error);

    }

});