// Firebase Imports
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


// DOM Elements

const heartRateElement = document.getElementById("heartRate");
const spo2Element = document.getElementById("spo2");
const temperatureElement = document.getElementById("temperature");
const overallStatusElement = document.getElementById("overallStatus");
const userNameElement = document.getElementById("userName");


// Current authenticated user

let currentUser = null;
let saveInterval = null;


// Authentication

onAuthStateChanged(auth, (user) => {

    if (user) {

        currentUser = user;

        userNameElement.textContent =
            user.displayName || user.email;

        // Save the first reading after authentication
        saveHealthReading();

        // Save readings every 30 seconds
        if (!saveInterval) {
            saveInterval = setInterval(saveHealthReading, 30000);
        }

    }

    else {

        currentUser = null;

        window.location.href = "login.html";

    }

});


// Logout

document.getElementById("logoutBtn").addEventListener("click", async () => {

    try {

        await signOut(auth);

        window.location.href = "login.html";

    }

    catch (error) {

        alert("Logout failed: " + error.message);

    }

});


// Simulated Health Readings

let heartRate = 78;
let spo2 = 98;
let temperature = 36.8;


// Generate random values

function generateHealthReadings() {

    heartRate = Math.floor(Math.random() * 21) + 70;

    spo2 = Math.floor(Math.random() * 4) + 96;

    temperature =
        Number((36.5 + Math.random() * 0.7).toFixed(1));

}


// Update Dashboard

function updateDashboard() {

    generateHealthReadings();

    heartRateElement.textContent = heartRate;

    spo2Element.textContent = spo2;

    temperatureElement.textContent = temperature;

    updateHealthStatus();

    updateChart();

}


// Demonstration thresholds only.
// These are not medically validated diagnostic rules.

function updateHealthStatus() {

    const heartStatus = document.getElementById("heartStatus");

    const spo2Status = document.getElementById("spo2Status");

    const temperatureStatus =
        document.getElementById("temperatureStatus");

    const overallMessage =
        document.getElementById("overallMessage");


    const heartAbnormal =
        heartRate < 60 || heartRate > 100;

    const spo2Abnormal = spo2 < 95;

    const temperatureAbnormal =
        temperature < 36 || temperature > 37.5;


    heartStatus.textContent =
        heartAbnormal ? "Outside demo range" : "Within demo range";

    spo2Status.textContent =
        spo2Abnormal ? "Outside demo range" : "Within demo range";

    temperatureStatus.textContent =
        temperatureAbnormal ? "Outside demo range" : "Within demo range";


    const abnormal =
        heartAbnormal || spo2Abnormal || temperatureAbnormal;


    if (abnormal) {

        overallStatusElement.textContent = "Attention";

        overallStatusElement.style.color = "#dc2626";

        overallMessage.textContent =
            "One or more readings are outside demo ranges.";

    }

    else {

        overallStatusElement.textContent = "Normal";

        overallStatusElement.style.color = "#16a34a";

        overallMessage.textContent =
            "All readings are within demo ranges.";

    }

}


// Save Health Readings to Firestore

async function saveHealthReading() {

    if (!currentUser) {
        return;
    }

    try {

        const status = overallStatusElement.textContent;

        await addDoc(
            collection(db, "users", currentUser.uid, "health_readings"),

            {

                heartRate: heartRate,

                spo2: spo2,

                temperature: temperature,

                status: status,

                source: "simulated",

                timestamp: serverTimestamp()

            }

        );

        console.log("Health reading saved successfully!");

    }

    catch (error) {

        console.error("Error saving health reading:", error);

    }

}


// Chart.js

const ctx = document.getElementById("healthChart");

const healthChart = new Chart(ctx, {

    type: "line",

    data: {

        labels: [],

        datasets: [

            {

                label: "Heart Rate (BPM)",

                data: [],

                borderColor: "#087ea4",

                backgroundColor: "rgba(8,126,164,0.1)",

                tension: 0.4

            },

            {

                label: "SpO2 (%)",

                data: [],

                borderColor: "#16a34a",

                backgroundColor: "rgba(22,163,74,0.1)",

                tension: 0.4

            }

        ]

    },

    options: {

        responsive: true,

        maintainAspectRatio: false,

        animation: false,

        scales: {

            y: {

                beginAtZero: false

            }

        }

    }

});


// Update Chart

function updateChart() {

    const time = new Date().toLocaleTimeString();

    healthChart.data.labels.push(time);

    healthChart.data.datasets[0].data.push(heartRate);

    healthChart.data.datasets[1].data.push(spo2);


    // Keep only the latest 10 readings

    if (healthChart.data.labels.length > 10) {

        healthChart.data.labels.shift();

        healthChart.data.datasets.forEach(dataset => {

            dataset.data.shift();

        });

    }

    healthChart.update();

}


// Start Monitoring

updateDashboard();

setInterval(updateDashboard, 5000);


// SOS Button

document.getElementById("sosButton").addEventListener("click", () => {

    const confirmed = confirm(
        "Do you want to initiate an emergency SOS demonstration?"
    );

    if (confirmed) {

        alert(
            "SOS demonstration activated!\n\n" +
            "Heart Rate: " + heartRate + " BPM\n" +
            "SpO2: " + spo2 + "%\n" +
            "Temperature: " + temperature + "°C\n\n" +
            "Actual emergency notifications are not configured yet."
        );

    }

});