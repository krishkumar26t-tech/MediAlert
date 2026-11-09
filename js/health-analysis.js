import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";


// ======================================
// GET HTML ELEMENTS
// ======================================

const recordType = document.getElementById("recordType");
const analyzeButton = document.getElementById("analyzeButton");

const overallStatus = document.getElementById("overallStatus");
const overallMessage = document.getElementById("overallMessage");

const analysisResults = document.getElementById("analysisResults");
const recommendations = document.getElementById("recommendations");

const loadingMessage = document.getElementById("loadingMessage");
const errorMessage = document.getElementById("errorMessage");

const trendSummary = document.getElementById("trendSummary");

const logoutBtn = document.getElementById("logoutBtn");

let currentUser = null;
let userAge = null;


// Store chart instances
const charts = {};


// ======================================
// AUTHENTICATION
// ======================================

onAuthStateChanged(auth, async (user) => {

    if (user) {

        currentUser = user;

        console.log("User authenticated:", user.uid);

        await checkUserAge();

    } else {

        window.location.href = "login.html";

    }

});


// ======================================
// CHECK USER AGE
// ======================================

async function checkUserAge() {

    try {

        const profileRef = doc(
            db,
            "users",
            currentUser.uid,
            "profile",
            "personal"
        );

        const snapshot = await getDoc(profileRef);

        if (!snapshot.exists()) {

            analyzeButton.disabled = true;

            overallStatus.textContent = "Profile Required";

            overallMessage.textContent =
                "Please complete your Health Profile before using adult health analysis.";

            return;

        }

        const profileData = snapshot.data();

        userAge = Number(profileData.age);

        if (!Number.isInteger(userAge) || userAge < 1 || userAge > 120) {

            analyzeButton.disabled = true;

            overallStatus.textContent = "Invalid Age";

            overallMessage.textContent =
                "Please enter a valid age in your Health Profile.";

            return;

        }

        if (userAge < 18) {

            analyzeButton.disabled = true;

            overallStatus.textContent = "Not Available";

            overallMessage.textContent =
                "This screening feature is designed for adults aged 18 and above.";

            return;

        }

        analyzeButton.disabled = false;

        overallStatus.textContent = "Ready for Analysis";

        overallMessage.textContent =
            "Your profile is eligible for adult health screening.";

    } catch (error) {

        console.error("Age verification error:", error);

        analyzeButton.disabled = true;

        errorMessage.textContent =
            "Unable to verify your profile.";

    }

}


// ======================================
// GET HEALTH RECORDS
// ======================================

async function getHealthRecords() {

    const recordsRef = collection(
        db,
        "users",
        currentUser.uid,
        "health_readings"
    );

    const recordsQuery = query(
        recordsRef,
        orderBy("timestamp", "desc"),
        limit(1000)
    );

    const snapshot = await getDocs(recordsQuery);

    return snapshot.docs.map(document => ({
        id: document.id,
        ...document.data()
    }));

}


// ======================================
// ANALYSE BUTTON
// ======================================

analyzeButton.addEventListener("click", async () => {

    if (!currentUser || userAge === null || userAge < 18) {
        return;
    }

    try {

        analyzeButton.disabled = true;
        analyzeButton.textContent = "Analysing...";

        loadingMessage.hidden = false;
        errorMessage.textContent = "";

        const records = await getHealthRecords();

        const selectedSource = recordType.value;

        const filteredRecords = records.filter(record => {

            return record.source === selectedSource;

        });

        if (filteredRecords.length === 0) {

            displayNoRecords();

            return;

        }

        // Latest record is first because Firestore query is descending.
        const latestRecord = filteredRecords[0];

        // Individual screening
        analyseHealth(latestRecord);

        // Historical trend analysis
        displayHistoricalTrends(filteredRecords);

        console.log("Health analysis and trend analysis completed.");

    } catch (error) {

        console.error("Analysis error:", error);

        errorMessage.textContent =
            "Unable to analyse health records. Please try again.";

    } finally {

        loadingMessage.hidden = true;

        analyzeButton.disabled = false;
        analyzeButton.textContent = "Analyse Health Records";

    }

});


// ======================================
// NO RECORDS
// ======================================

function displayNoRecords() {

    overallStatus.textContent = "No Records Found";

    overallMessage.textContent =
        "No health records were found for the selected record type.";

    analysisResults.innerHTML = `
        <div class="analysis-card unavailable">
            <h3>No Data Available</h3>
            <p class="reading">--</p>
            <p class="result">
                Please add a health record and try again.
            </p>
        </div>
    `;

    recommendations.textContent =
        "Add a health record to receive screening information.";

    trendSummary.innerHTML = `
        <div class="trend-stat">
            <h3>Total Records</h3>
            <p>0</p>
        </div>
    `;

    clearCharts();

}


// ======================================
// MAIN HEALTH ANALYSIS
// ======================================

function analyseHealth(data) {

    const guidance = [];

    const results = [

        analyseHeartRate(data.heartRate, guidance),

        analyseSpO2(data.spo2, guidance),

        analyseTemperature(data.temperature, guidance),

        analyseBloodPressure(
            data.systolic,
            data.diastolic,
            guidance
        ),

        analyseBloodSugar(
            data.bloodSugar,
            data.sugarType,
            guidance
        )

    ];

    displayResults(results);

    displayGuidance(guidance);

    displayOverallStatus(results);

}


// ======================================
// HEART RATE
// ======================================

function analyseHeartRate(value, guidance) {

    const heartRate = Number(value);

    if (!isValid(value, heartRate)) {

        return unavailableResult(
            "❤️ Heart Rate",
            "Not recorded"
        );

    }

    if (heartRate < 40 || heartRate > 120) {

        guidance.push(
            "Your heart rate is substantially outside the usual adult resting range. Recheck after resting and seek prompt medical assessment, especially if you have symptoms."
        );

        return result(
            "❤️ Heart Rate",
            `${heartRate} BPM`,
            "Critical screening flag",
            "critical"
        );

    }

    if (heartRate < 60 || heartRate > 100) {

        guidance.push(
            "Your heart rate is outside the usual adult resting range of 60–100 BPM. Activity, medication and fitness can affect heart rate."
        );

        return result(
            "❤️ Heart Rate",
            `${heartRate} BPM`,
            "Outside typical resting range",
            "warning"
        );

    }

    return result(
        "❤️ Heart Rate",
        `${heartRate} BPM`,
        "Within typical adult resting range",
        "normal"
    );

}


// ======================================
// SPO2
// ======================================

function analyseSpO2(value, guidance) {

    const spo2 = Number(value);

    if (!isValid(value, spo2) || spo2 > 100) {

        return unavailableResult(
            "🫁 Oxygen Saturation",
            "Invalid or unavailable"
        );

    }

    if (spo2 <= 92) {

        guidance.push(
            "Your oxygen saturation reading is low. Repeat the measurement promptly using a properly fitted device and seek urgent medical assessment. Severe breathing difficulty, chest pain or confusion requires emergency help."
        );

        return result(
            "🫁 Oxygen Saturation",
            `${spo2}%`,
            "Urgent assessment recommended",
            "critical"
        );

    }

    if (spo2 < 95) {

        guidance.push(
            "Your oxygen saturation is below the typical range for many healthy adults. Repeat the reading and contact a healthcare professional."
        );

        return result(
            "🫁 Oxygen Saturation",
            `${spo2}%`,
            "Below typical reference range",
            "warning"
        );

    }

    return result(
        "🫁 Oxygen Saturation",
        `${spo2}%`,
        "Within typical reference range",
        "normal"
    );

}


// ======================================
// TEMPERATURE
// ======================================

function analyseTemperature(value, guidance) {

    const temperature = Number(value);

    if (!isValid(value, temperature)) {

        return unavailableResult(
            "🌡️ Temperature",
            "Not recorded"
        );

    }

    if (temperature < 35) {

        guidance.push(
            "Your temperature is below 35°C. Seek urgent medical assessment."
        );

        return result(
            "🌡️ Temperature",
            `${temperature}°C`,
            "Urgent assessment recommended",
            "critical"
        );

    }

    if (temperature >= 38) {

        guidance.push(
            "Your temperature is in the fever range. Monitor symptoms and seek medical advice when needed."
        );

        return result(
            "🌡️ Temperature",
            `${temperature}°C`,
            "Fever-range reading",
            "warning"
        );

    }

    if (temperature < 36) {

        guidance.push(
            "Your temperature is below the usual range. Recheck the reading and consider the measurement method."
        );

        return result(
            "🌡️ Temperature",
            `${temperature}°C`,
            "Below typical range",
            "warning"
        );

    }

    return result(
        "🌡️ Temperature",
        `${temperature}°C`,
        "No fever-range reading detected",
        "normal"
    );

}


// ======================================
// BLOOD PRESSURE
// ======================================

function analyseBloodPressure(systolicValue, diastolicValue, guidance) {

    if (
        systolicValue === undefined ||
        diastolicValue === undefined ||
        systolicValue === null ||
        diastolicValue === null ||
        systolicValue === "" ||
        diastolicValue === ""
    ) {

        return unavailableResult(
            "🩸 Blood Pressure",
            "Not recorded"
        );

    }

    const systolic = Number(systolicValue);
    const diastolic = Number(diastolicValue);

    if (
        !Number.isFinite(systolic) ||
        !Number.isFinite(diastolic) ||
        systolic <= diastolic ||
        systolic <= 0 ||
        diastolic <= 0
    ) {

        return unavailableResult(
            "🩸 Blood Pressure",
            "Invalid reading"
        );

    }

    if (systolic > 180 || diastolic > 120) {

        guidance.push(
            "Your blood pressure reading is severely elevated. Repeat it after a short rest. If it remains this high, seek immediate medical advice. If accompanied by concerning symptoms such as chest pain, breathlessness or weakness, seek emergency care."
        );

        return result(
            "🩸 Blood Pressure",
            `${systolic}/${diastolic} mmHg`,
            "Severely elevated reading",
            "critical"
        );

    }

    if (systolic < 90 || diastolic < 60) {

        guidance.push(
            "Your blood pressure is low. If you experience dizziness, fainting or weakness, seek medical advice."
        );

        return result(
            "🩸 Blood Pressure",
            `${systolic}/${diastolic} mmHg`,
            "Low blood pressure range",
            "warning"
        );

    }

    if (systolic >= 140 || diastolic >= 90) {

        guidance.push(
            "Your blood pressure is in a high range. Arrange a healthcare professional assessment. A single reading cannot diagnose hypertension."
        );

        return result(
            "🩸 Blood Pressure",
            `${systolic}/${diastolic} mmHg`,
            "High blood pressure range",
            "warning"
        );

    }

    if (systolic >= 130 || diastolic >= 80) {

        guidance.push(
            "Your blood pressure is above the normal range used in this screening. Monitor it and discuss repeated readings with a healthcare professional."
        );

        return result(
            "🩸 Blood Pressure",
            `${systolic}/${diastolic} mmHg`,
            "Above normal range",
            "warning"
        );

    }

    return result(
        "🩸 Blood Pressure",
        `${systolic}/${diastolic} mmHg`,
        "Within normal screening range",
        "normal"
    );

}


// ======================================
// BLOOD SUGAR
// ======================================

function analyseBloodSugar(value, sugarType, guidance) {

    const sugar = Number(value);

    if (!isValid(value, sugar)) {

        return unavailableResult(
            "🧪 Blood Sugar",
            "Not recorded"
        );

    }

    if (sugar < 70) {

        guidance.push(
            "Your blood sugar reading is below 70 mg/dL. Follow your healthcare professional's hypoglycaemia plan. If you are confused, unconscious or unable to swallow safely, seek emergency help."
        );

        return result(
            "🧪 Blood Sugar",
            `${sugar} mg/dL`,
            "Low blood sugar reading",
            "critical"
        );

    }

    if (sugarType === "Fasting") {

        if (sugar >= 126) {

            guidance.push(
                "Your fasting blood sugar is in a range that can be associated with diabetes. Appropriate confirmatory testing by a healthcare professional is necessary."
            );

            return result(
                "🧪 Blood Sugar",
                `${sugar} mg/dL`,
                "High fasting reading",
                "warning"
            );

        }

        if (sugar >= 100) {

            guidance.push(
                "Your fasting blood sugar is above the typical normal fasting range. Discuss repeat testing with a healthcare professional."
            );

            return result(
                "🧪 Blood Sugar",
                `${sugar} mg/dL`,
                "Above typical fasting range",
                "warning"
            );

        }

        return result(
            "🧪 Blood Sugar",
            `${sugar} mg/dL`,
            "Within typical fasting range",
            "normal"
        );

    }

    return result(
        "🧪 Blood Sugar",
        `${sugar} mg/dL`,
        "Context-specific interpretation needed",
        "unavailable"
    );

}


// ======================================
// VALIDATION HELPER
// ======================================

function isValid(value, number) {

    return (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        Number.isFinite(number) &&
        number > 0
    );

}


// ======================================
// RESULT OBJECTS
// ======================================

function result(title, reading, message, status) {

    return {
        title,
        reading,
        message,
        status
    };

}


function unavailableResult(title, reading) {

    return result(
        title,
        reading,
        "Insufficient information for screening",
        "unavailable"
    );

}


// ======================================
// DISPLAY INDIVIDUAL RESULTS
// ======================================

function displayResults(results) {

    analysisResults.innerHTML = "";

    results.forEach(item => {

        const card = document.createElement("div");

        card.className = `analysis-card ${item.status}`;

        const title = document.createElement("h3");
        title.textContent = item.title;

        const reading = document.createElement("p");
        reading.className = "reading";
        reading.textContent = item.reading;

        const message = document.createElement("p");
        message.className = "result";
        message.textContent = item.message;

        card.appendChild(title);
        card.appendChild(reading);
        card.appendChild(message);

        analysisResults.appendChild(card);

    });

}


// ======================================
// DISPLAY GUIDANCE
// ======================================

function displayGuidance(guidance) {

    recommendations.innerHTML = "";

    if (guidance.length === 0) {

        recommendations.textContent =
            "No flags were detected among the available measurements. This does not guarantee that your health is normal.";

        return;

    }

    guidance.forEach(item => {

        const div = document.createElement("div");

        div.className = "recommendation-item";

        div.textContent = "• " + item;

        recommendations.appendChild(div);

    });

}


// ======================================
// OVERALL STATUS
// ======================================

function displayOverallStatus(results) {

    const availableResults = results.filter(
        item => item.status !== "unavailable"
    );

    if (availableResults.length === 0) {

        overallStatus.textContent = "Insufficient Data";

        overallMessage.textContent =
            "There are not enough valid measurements for a screening summary.";

        return;

    }

    const hasCritical = availableResults.some(
        item => item.status === "critical"
    );

    const hasWarning = availableResults.some(
        item => item.status === "warning"
    );

    if (hasCritical) {

        overallStatus.textContent = "Attention Required";

        overallStatus.style.background = "#fee2e2";
        overallStatus.style.color = "#991b1b";

        overallMessage.textContent =
            "One or more measurements require prompt attention. Follow the guidance provided and seek medical assessment as appropriate.";

    } else if (hasWarning) {

        overallStatus.textContent = "Review Recommended";

        overallStatus.style.background = "#fef3c7";
        overallStatus.style.color = "#92400e";

        overallMessage.textContent =
            "Some measurements are outside configured reference ranges. Consider rechecking them and consulting a healthcare professional.";

    } else {

        overallStatus.textContent = "No Flags Detected";

        overallStatus.style.background = "#dcfce7";
        overallStatus.style.color = "#166534";

        overallMessage.textContent =
            "No flags were detected among the available measurements. This is not a medical clearance or diagnosis.";

    }

}


// ======================================
// HISTORICAL TREND ANALYSIS
// ======================================

function displayHistoricalTrends(records) {

    // Convert records into chronological order.
    const chronologicalRecords = [...records].reverse();

    displayTrendStatistics(chronologicalRecords);

    createHeartRateChart(chronologicalRecords);

    createSpO2Chart(chronologicalRecords);

    createTemperatureChart(chronologicalRecords);

    createBloodPressureChart(chronologicalRecords);

    createBloodSugarChart(chronologicalRecords);

}


// ======================================
// DATE LABELS
// ======================================

function getDateLabel(record) {

    if (!record.timestamp) {
        return "Unknown date";
    }

    const date = record.timestamp.toDate
        ? record.timestamp.toDate()
        : new Date(record.timestamp);

    if (Number.isNaN(date.getTime())) {
        return "Unknown date";
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    });

}


// ======================================
// NUMERIC VALUE HELPER
// ======================================

function getNumericValue(value) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number) ? number : null;

}


// ======================================
// TREND STATISTICS
// ======================================

function displayTrendStatistics(records) {

    const heartRates = records
        .map(r => getNumericValue(r.heartRate))
        .filter(v => v !== null);

    const spo2Values = records
        .map(r => getNumericValue(r.spo2))
        .filter(v => v !== null);

    const temperatures = records
        .map(r => getNumericValue(r.temperature))
        .filter(v => v !== null);

    const bloodPressures = records.filter(r =>
        getNumericValue(r.systolic) !== null &&
        getNumericValue(r.diastolic) !== null
    );

    const average = values => {

        if (values.length === 0) return "--";

        return (
            values.reduce((sum, value) => sum + value, 0) /
            values.length
        ).toFixed(1);

    };

    trendSummary.innerHTML = `
        <div class="trend-stat">
            <h3>Total Records</h3>
            <p>${records.length}</p>
        </div>

        <div class="trend-stat">
            <h3>Average Heart Rate</h3>
            <p>${average(heartRates)} BPM</p>
        </div>

        <div class="trend-stat">
            <h3>Average SpO₂</h3>
            <p>${average(spo2Values)}%</p>
        </div>

        <div class="trend-stat">
            <h3>Average Temperature</h3>
            <p>${average(temperatures)}°C</p>
        </div>
    `;

}


// ======================================
// CLEAR OLD CHARTS
// ======================================

function clearCharts() {

    Object.values(charts).forEach(chart => {

        chart.destroy();

    });

    Object.keys(charts).forEach(key => {

        delete charts[key];

    });

    document.querySelectorAll(".trend-card canvas").forEach(canvas => {

        canvas.hidden = false;

    });

}


// ======================================
// CREATE LINE CHART
// ======================================

function createLineChart(canvasId, chartKey, label, records, getValue, unit) {

    const canvas = document.getElementById(canvasId);

    if (!canvas) return;

    const points = records
        .map(record => ({
            label: getDateLabel(record),
            value: getValue(record)
        }))
        .filter(point => point.value !== null);

    if (charts[chartKey]) {

        charts[chartKey].destroy();

        delete charts[chartKey];

    }

    const existingMessage = canvas.parentElement.querySelector(".trend-empty");

    if (existingMessage) {
        existingMessage.remove();
    }

    if (points.length === 0) {

        canvas.hidden = true;

        const message = document.createElement("p");

        message.className = "trend-empty";

        message.textContent =
            "No recorded data available for this measurement.";

        canvas.parentElement.appendChild(message);

        return;

    }

    canvas.hidden = false;

    charts[chartKey] = new Chart(canvas, {

        type: "line",

        data: {

            labels: points.map(point => point.label),

            datasets: [{

                label: label,

                data: points.map(point => point.value),

                borderWidth: 2,

                tension: 0.3,

                fill: false,

                pointRadius: 4,

                pointHoverRadius: 6

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: true,

            interaction: {
                intersect: false,
                mode: "index"
            },

            plugins: {

                legend: {
                    display: true
                },

                tooltip: {
                    callbacks: {
                        label: context =>
                            `${context.dataset.label}: ${context.parsed.y} ${unit}`
                    }
                }

            },

            scales: {

                x: {
                    title: {
                        display: true,
                        text: "Date and Time"
                    }
                },

                y: {
                    beginAtZero: false,

                    title: {
                        display: true,
                        text: unit
                    }
                }

            }

        }

    });

}


// ======================================
// HEART RATE CHART
// ======================================

function createHeartRateChart(records) {

    createLineChart(
        "heartTrendChart",
        "heart",
        "Heart Rate",
        records,
        record => getNumericValue(record.heartRate),
        "BPM"
    );

}


// ======================================
// SPO2 CHART
// ======================================

function createSpO2Chart(records) {

    createLineChart(
        "spo2TrendChart",
        "spo2",
        "Oxygen Saturation",
        records,
        record => getNumericValue(record.spo2),
        "%"
    );

}


// ======================================
// TEMPERATURE CHART
// ======================================

function createTemperatureChart(records) {

    createLineChart(
        "temperatureTrendChart",
        "temperature",
        "Temperature",
        records,
        record => getNumericValue(record.temperature),
        "°C"
    );

}


// ======================================
// BLOOD PRESSURE CHART
// ======================================

function createBloodPressureChart(records) {

    const canvas = document.getElementById("bpTrendChart");

    if (!canvas) return;

    const points = records.filter(record =>

        getNumericValue(record.systolic) !== null &&
        getNumericValue(record.diastolic) !== null

    );

    if (charts.bp) {

        charts.bp.destroy();

        delete charts.bp;

    }

    const existingMessage = canvas.parentElement.querySelector(".trend-empty");

    if (existingMessage) {
        existingMessage.remove();
    }

    if (points.length === 0) {

        canvas.hidden = true;

        const message = document.createElement("p");

        message.className = "trend-empty";

        message.textContent =
            "No blood pressure records available.";

        canvas.parentElement.appendChild(message);

        return;

    }

    canvas.hidden = false;

    charts.bp = new Chart(canvas, {

        type: "line",

        data: {

            labels: points.map(getDateLabel),

            datasets: [

                {
                    label: "Systolic",
                    data: points.map(r => Number(r.systolic)),
                    borderWidth: 2,
                    tension: 0.3
                },

                {
                    label: "Diastolic",
                    data: points.map(r => Number(r.diastolic)),
                    borderWidth: 2,
                    tension: 0.3
                }

            ]

        },

        options: {

            responsive: true,

            plugins: {
                legend: {
                    display: true
                }
            },

            scales: {

                x: {
                    title: {
                        display: true,
                        text: "Date and Time"
                    }
                },

                y: {
                    title: {
                        display: true,
                        text: "Pressure (mmHg)"
                    }
                }

            }

        }

    });

}


// ======================================
// BLOOD SUGAR CHART
// ======================================

function createBloodSugarChart(records) {

    createLineChart(
        "sugarTrendChart",
        "sugar",
        "Blood Sugar",
        records,
        record => getNumericValue(record.bloodSugar),
        "mg/dL"
    );

}


// ======================================
// LOGOUT
// ======================================

logoutBtn.addEventListener("click", async () => {

    try {

        await signOut(auth);

        window.location.href = "login.html";

    } catch (error) {

        console.error("Logout error:", error);

    }

});