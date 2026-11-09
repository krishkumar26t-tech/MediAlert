// Firebase Imports

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";


// HTML Elements

const dateFilter = document.getElementById("dateFilter");

const loadingMessage = document.getElementById("loadingMessage");

const errorMessage = document.getElementById("errorMessage");

const emptyMessage = document.getElementById("emptyMessage");


// Store all readings

let allReadings = [];


// Chart variables

let heartChart;
let spo2Chart;
let tempChart;


// Authentication

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    await loadAnalytics(user.uid);

});


// Load Firestore Data

async function loadAnalytics(userId) {

    loadingMessage.hidden = false;

    try {

        const readingsRef = collection(
            db,
            "users",
            userId,
            "health_readings"
        );

        const readingsQuery = query(
            readingsRef,
            orderBy("timestamp", "desc"),
            limit(1000)
        );

        const snapshot = await getDocs(readingsQuery);

        allReadings = [];

        snapshot.forEach((doc) => {

            const data = doc.data();

            if (data.timestamp) {

                allReadings.push({
                    ...data,
                    date: data.timestamp.toDate()
                });

            }

        });

        loadingMessage.hidden = true;

        updateAnalytics();

    }

    catch (error) {

        loadingMessage.hidden = true;

        console.error("Analytics error:", error);

        errorMessage.textContent =
            "Unable to load analytics. Please try again.";

    }

}


// Filter Readings

dateFilter.addEventListener("change", updateAnalytics);


function getFilteredReadings() {

    const selected = dateFilter.value;

    if (selected === "all") {

        return allReadings;

    }

    const days = Number(selected);

    const cutoff = new Date();

    cutoff.setDate(cutoff.getDate() - days);

    return allReadings.filter(
        reading => reading.date >= cutoff
    );

}


// Update Analytics

function updateAnalytics() {

    const readings = getFilteredReadings();

    if (readings.length === 0) {

        emptyMessage.hidden = false;

        document.getElementById("totalRecords").textContent = 0;

        document.getElementById("avgHeart").textContent = "--";

        document.getElementById("avgSpo2").textContent = "--";

        document.getElementById("avgTemp").textContent = "--";

        resetRanges();

        destroyCharts();

        return;

    }

    emptyMessage.hidden = true;

    errorMessage.textContent = "";

    calculateStatistics(readings);

    createCharts(readings);

}


// Calculate Statistics

function calculateStatistics(readings) {

    const heart = readings.map(r => Number(r.heartRate));

    const spo2 = readings.map(r => Number(r.spo2));

    const temp = readings.map(r => Number(r.temperature));


    function average(values) {

        return (
            values.reduce((sum, value) => sum + value, 0)
            / values.length
        );

    }


    document.getElementById("totalRecords").textContent =
        readings.length;


    document.getElementById("avgHeart").textContent =
        average(heart).toFixed(1) + " bpm";


    document.getElementById("avgSpo2").textContent =
        average(spo2).toFixed(1) + "%";


    document.getElementById("avgTemp").textContent =
        average(temp).toFixed(1) + " °C";


    // Minimum and Maximum

    document.getElementById("heartMin").textContent =
        "Minimum: " + Math.min(...heart) + " bpm";

    document.getElementById("heartMax").textContent =
        "Maximum: " + Math.max(...heart) + " bpm";


    document.getElementById("spo2Min").textContent =
        "Minimum: " + Math.min(...spo2) + "%";

    document.getElementById("spo2Max").textContent =
        "Maximum: " + Math.max(...spo2) + "%";


    document.getElementById("tempMin").textContent =
        "Minimum: " + Math.min(...temp) + " °C";

    document.getElementById("tempMax").textContent =
        "Maximum: " + Math.max(...temp) + " °C";

}


// Reset Statistics

function resetRanges() {

    const ids = [
        "heartMin", "heartMax",
        "spo2Min", "spo2Max",
        "tempMin", "tempMax"
    ];

    ids.forEach(id => {

        document.getElementById(id).textContent =
            id.endsWith("Min") ? "Minimum: --" : "Maximum: --";

    });

}


// Destroy Previous Charts

function destroyCharts() {

    if (heartChart) heartChart.destroy();

    if (spo2Chart) spo2Chart.destroy();

    if (tempChart) tempChart.destroy();

    heartChart = null;
    spo2Chart = null;
    tempChart = null;

}


// Create Charts

function createCharts(readings) {

    destroyCharts();

    // Display oldest to newest

    const sorted = [...readings].sort(
        (a, b) => a.date - b.date
    );

    const labels = sorted.map(
        r => r.date.toLocaleString()
    );


    const heartValues = sorted.map(
        r => r.heartRate
    );

    const spo2Values = sorted.map(
        r => r.spo2
    );

    const tempValues = sorted.map(
        r => r.temperature
    );


    // Heart Rate Chart

    heartChart = new Chart(
        document.getElementById("heartChart"),
        {

            type: "line",

            data: {

                labels: labels,

                datasets: [{

                    label: "Heart Rate (BPM)",

                    data: heartValues,

                    borderColor: "#087ea4",

                    backgroundColor: "rgba(8,126,164,0.1)",

                    fill: true,

                    tension: 0.3

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                scales: {

                    y: {
                        title: {
                            display: true,
                            text: "BPM"
                        }
                    }

                }

            }

        }

    );


    // SpO2 Chart

    spo2Chart = new Chart(
        document.getElementById("spo2Chart"),
        {

            type: "line",

            data: {

                labels: labels,

                datasets: [{

                    label: "SpO2 (%)",

                    data: spo2Values,

                    borderColor: "#16a34a",

                    backgroundColor: "rgba(22,163,74,0.1)",

                    fill: true,

                    tension: 0.3

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false

            }

        }

    );


    // Temperature Chart

    tempChart = new Chart(
        document.getElementById("tempChart"),
        {

            type: "line",

            data: {

                labels: labels,

                datasets: [{

                    label: "Temperature (°C)",

                    data: tempValues,

                    borderColor: "#ea580c",

                    backgroundColor: "rgba(234,88,12,0.1)",

                    fill: true,

                    tension: 0.3

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false

            }

        }

    );

}


// Logout

document.getElementById("logoutBtn").addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

            window.location.href = "login.html";

        }

        catch (error) {

            alert("Logout failed: " + error.message);

        }

    }
);