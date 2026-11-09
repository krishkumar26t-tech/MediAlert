import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";


const form = document.getElementById("healthRecordForm");
const message = document.getElementById("message");
const saveButton = document.getElementById("saveRecordBtn");
const logoutBtn = document.getElementById("logoutBtn");

let currentUser = null;


// Check login status

onAuthStateChanged(auth, (user) => {

    if (user) {
        currentUser = user;
        console.log("User authenticated:", user.uid);
    } else {
        window.location.href = "login.html";
    }

});


// Save health record

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    if (!currentUser) {
        message.textContent = "Please log in first.";
        message.style.color = "red";
        return;
    }

    const heartRate = Number(
        document.getElementById("heartRate").value
    );

    const spo2 = Number(
        document.getElementById("spo2").value
    );

    const temperature = Number(
        document.getElementById("temperature").value
    );

    const systolicValue = document.getElementById("systolic").value;
    const diastolicValue = document.getElementById("diastolic").value;
    const bloodSugarValue = document.getElementById("bloodSugar").value;

    const systolic = systolicValue ? Number(systolicValue) : null;
    const diastolic = diastolicValue ? Number(diastolicValue) : null;
    const bloodSugar = bloodSugarValue ? Number(bloodSugarValue) : null;

    // Validate blood pressure

    if ((systolic === null) !== (diastolic === null)) {
        message.textContent =
            "Please enter both systolic and diastolic pressure.";
        message.style.color = "red";
        return;
    }

    if (systolic !== null &&
        (systolic < 1 || systolic > 300 ||
         diastolic < 1 || diastolic > 200)) {

        message.textContent = "Please enter valid blood pressure values.";
        message.style.color = "red";
        return;
    }

    const recordData = {

        heartRate: heartRate,

        spo2: spo2,

        temperature: temperature,

        systolic: systolic,

        diastolic: diastolic,

        bloodPressure: systolic !== null
            ? `${systolic}/${diastolic}`
            : null,

        bloodSugar: bloodSugar,

        sugarType: document.getElementById("sugarType").value || null,

        notes: document.getElementById("notes").value.trim(),

        source: "manual",

        timestamp: serverTimestamp()

    };


    try {

        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        await addDoc(
            collection(db, "users", currentUser.uid, "health_readings"),
            recordData
        );

        message.textContent = "Health record saved successfully!";
        message.style.color = "green";

        console.log("Manual health record saved successfully!");

        form.reset();

    } catch (error) {

        console.error("Error saving health record:", error);

        message.textContent = "Error saving record: " + error.message;
        message.style.color = "red";

    } finally {

        saveButton.disabled = false;
        saveButton.textContent = "Save Health Record";

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