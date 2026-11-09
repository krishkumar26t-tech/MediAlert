// Firebase imports

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


// HTML elements

const historyTableBody =
    document.getElementById("historyTableBody");

const totalRecords =
    document.getElementById("totalRecords");

const avgHeartRate =
    document.getElementById("avgHeartRate");

const avgSpo2 =
    document.getElementById("avgSpo2");

const avgTemperature =
    document.getElementById("avgTemperature");

const loadingMessage =
    document.getElementById("loadingMessage");

const emptyMessage =
    document.getElementById("emptyMessage");

const errorMessage =
    document.getElementById("errorMessage");

const historyFilter =
    document.getElementById("historyFilter");

let allReadings = [];


// Authentication

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    await loadHealthHistory(user.uid);

});


// Load Health History

async function loadHealthHistory(userId) {

    loadingMessage.hidden = false;
    errorMessage.textContent = "";

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
            limit(100)
        );

        const snapshot = await getDocs(readingsQuery);

        loadingMessage.hidden = true;

        allReadings = [];

        snapshot.forEach((document) => {

            allReadings.push(document.data());

        });

        if (allReadings.length === 0) {

            emptyMessage.hidden = false;
            historyTableBody.innerHTML = "";

            calculateAverages([]);

            return;

        }

        emptyMessage.hidden = true;

        displayHistory(allReadings);

        calculateAverages(allReadings);

    }

    catch (error) {

        loadingMessage.hidden = true;

        console.error("History loading error:", error);

        errorMessage.textContent =
            "Unable to load health history. Please try again.";

    }

}


// Display readings in table

function displayHistory(readings) {

    historyTableBody.innerHTML = "";

    readings.forEach((reading) => {

        const row = document.createElement("tr");

        const date = reading.timestamp?.toDate();

        const formattedDate = date
            ? date.toLocaleString()
            : "Pending";

        const bloodPressure = reading.bloodPressure ||
            (reading.systolic != null &&
             reading.diastolic != null
                ? `${reading.systolic}/${reading.diastolic}`
                : "--");

        const bloodSugar = reading.bloodSugar != null
            ? `${reading.bloodSugar} mg/dL`
            : "--";

        const source = reading.source || "Unknown";

        const notes = reading.notes || "--";

        const values = [

            formattedDate,

            reading.heartRate != null
                ? `${reading.heartRate} bpm`
                : "--",

            reading.spo2 != null
                ? `${reading.spo2}%`
                : "--",

            reading.temperature != null
                ? `${reading.temperature} °C`
                : "--",

            bloodPressure,

            bloodSugar,

            source,

            reading.status || "Not evaluated",

            notes

        ];

        values.forEach((value) => {

            const cell = document.createElement("td");

            cell.textContent = value;

            row.appendChild(cell);

        });

        historyTableBody.appendChild(row);

    });

}


// Calculate averages

function calculateAverages(readings) {

    const count = readings.length;

    totalRecords.textContent = count;

    function calculateAverage(key, unit) {

        const values = readings
            .map(item => Number(item[key]))
            .filter(value => Number.isFinite(value));

        if (values.length === 0) {
            return "--";
        }

        const total = values.reduce(
            (sum, value) => sum + value, 0
        );

        return (total / values.length).toFixed(1) + unit;

    }

    avgHeartRate.textContent =
        calculateAverage("heartRate", " bpm");

    avgSpo2.textContent =
        calculateAverage("spo2", "%");

    avgTemperature.textContent =
        calculateAverage("temperature", " °C");

}


// Filter records

if (historyFilter) {

    historyFilter.addEventListener("change", () => {

        const selectedFilter = historyFilter.value;

        let filteredReadings = allReadings;

        if (selectedFilter !== "all") {

            filteredReadings = allReadings.filter(
                reading => reading.source === selectedFilter
            );

        }

        displayHistory(filteredReadings);

        calculateAverages(filteredReadings);

        emptyMessage.hidden = filteredReadings.length !== 0;

    });

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