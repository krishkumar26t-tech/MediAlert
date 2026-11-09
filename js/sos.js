// Firebase Imports

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    limit,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";


// DOM Elements

const sosButton = document.getElementById("sosButton");

const statusMessage = document.getElementById("statusMessage");

const emergencyDetails =
    document.getElementById("emergencyDetails");

const emergencyHistory =
    document.getElementById("emergencyHistory");

const loadingMessage =
    document.getElementById("loadingMessage");

const emptyMessage =
    document.getElementById("emptyMessage");

const errorMessage =
    document.getElementById("errorMessage");


// Current User

let currentUser = null;


// Latest simulated health readings

let healthReadings = {
    heartRate: null,
    spo2: null,
    temperature: null
};


// Authentication

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    currentUser = user;

    await loadLatestHealthReadings();

    await loadEmergencyHistory();

});


// Retrieve Latest Health Readings

async function loadLatestHealthReadings() {

    try {

        const readingsQuery = query(

            collection(
                db,
                "users",
                currentUser.uid,
                "health_readings"
            ),

            orderBy("timestamp", "desc"),

            limit(1)

        );

        const snapshot = await getDocs(readingsQuery);

        if (!snapshot.empty) {

            const data = snapshot.docs[0].data();

            healthReadings = {

                heartRate: data.heartRate,

                spo2: data.spo2,

                temperature: data.temperature

            };

        }

    }

    catch (error) {

        console.error("Health readings error:", error);

    }

}


// Get Emergency Contacts

async function getEmergencyContacts() {

    const snapshot = await getDocs(

        collection(
            db,
            "users",
            currentUser.uid,
            "emergency_contacts"
        )

    );

    return snapshot.docs.map(doc => ({

        id: doc.id,

        name: doc.data().name,

        phone: doc.data().phone,

        relationship: doc.data().relationship,

        isPrimary: doc.data().isPrimary || false

    }));

}


// Get GPS Location

function getCurrentLocation() {

    return new Promise((resolve, reject) => {

        if (!navigator.geolocation) {

            reject(new Error("Geolocation is not supported."));

            return;

        }

        navigator.geolocation.getCurrentPosition(

            (position) => {

                resolve({

                    latitude: position.coords.latitude,

                    longitude: position.coords.longitude,

                    accuracy: position.coords.accuracy,

                    mapLink:
                        `https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`

                });

            },

            (error) => {

                reject(error);

            },

            {

                enableHighAccuracy: true,

                timeout: 15000,

                maximumAge: 0

            }

        );

    });

}


// Activate SOS

sosButton.addEventListener("click", async () => {

    if (!currentUser) {

        alert("Please log in first.");

        return;

    }


    const confirmed = confirm(

        "You are about to create an SOS demonstration event.\n\n" +

        "This will record your simulated health readings, " +
        "emergency contacts and location if permission is granted.\n\n" +

        "No emergency services or contacts will be notified.\n\n" +

        "Continue?"

    );


    if (!confirmed) return;


    sosButton.disabled = true;

    statusMessage.textContent =
        "Creating emergency event...";


    try {

        // Retrieve contacts

        const contacts = await getEmergencyContacts();


        // Request location

        let locationData = null;

        try {

            locationData = await getCurrentLocation();

        }

        catch (locationError) {

            console.warn(
                "Location unavailable:",
                locationError.message
            );

        }


        // Refresh latest readings

        await loadLatestHealthReadings();


        // Emergency Event Data

        const emergencyData = {

            userId: currentUser.uid,

            userEmail: currentUser.email,

            contacts: contacts,

            healthReadings: healthReadings,

            location: locationData,

            status: "Pending",

            source: "MediAlert SOS Demonstration",

            createdAt: serverTimestamp()

        };


        // Save to Firestore

        const eventRef = await addDoc(

            collection(
                db,
                "users",
                currentUser.uid,
                "emergency_events"
            ),

            emergencyData

        );


        statusMessage.textContent =
            "SOS demonstration event created successfully!";


        // Display latest event

        displayLatestEvent(

            eventRef.id,

            emergencyData,

            new Date()

        );


        // Reload history

        await loadEmergencyHistory();


    }

    catch (error) {

        console.error("SOS error:", error);

        statusMessage.textContent =
            "Unable to create SOS event.";

        errorMessage.textContent = error.message;

    }

    finally {

        sosButton.disabled = false;

    }

});


// Display Latest Event

function displayLatestEvent(id, event, date) {

    emergencyDetails.innerHTML = "";

    const card = document.createElement("div");

    card.className = "event-card";


    const heading = document.createElement("h3");

    heading.textContent = "SOS Event Created";


    const idText = document.createElement("p");

    idText.textContent = "Event ID: " + id;


    const dateText = document.createElement("p");

    dateText.textContent =
        "Date: " + date.toLocaleString();


    const contactText = document.createElement("p");

    contactText.textContent =
        "Emergency Contacts: " + event.contacts.length;


    const status = document.createElement("span");

    status.className = "event-status";

    status.textContent = event.status;


    card.append(
        heading,
        idText,
        dateText,
        contactText,
        status
    );


    if (event.location) {

        const map = document.createElement("a");

        map.href = event.location.mapLink;

        map.target = "_blank";

        map.rel = "noopener noreferrer";

        map.textContent = "View Location on Google Maps";

        card.appendChild(map);

    }

    else {

        const noLocation = document.createElement("p");

        noLocation.textContent = "Location unavailable.";

        card.appendChild(noLocation);

    }


    emergencyDetails.appendChild(card);

}


// Load Emergency History

async function loadEmergencyHistory() {

    loadingMessage.hidden = false;

    errorMessage.textContent = "";

    try {

        const historyQuery = query(

            collection(
                db,
                "users",
                currentUser.uid,
                "emergency_events"
            ),

            orderBy("createdAt", "desc"),

            limit(50)

        );


        const snapshot = await getDocs(historyQuery);


        emergencyHistory.innerHTML = "";

        loadingMessage.hidden = true;


        if (snapshot.empty) {

            emptyMessage.hidden = false;

            return;

        }


        emptyMessage.hidden = true;


        snapshot.forEach((eventDoc) => {

            const event = eventDoc.data();

            const card = document.createElement("div");

            card.className = "event-card";


            const heading = document.createElement("h3");

            heading.textContent = "Emergency Event";


            const date = document.createElement("p");

            date.textContent = event.createdAt
                ? "Date: " + event.createdAt.toDate().toLocaleString()
                : "Date: Processing";


            const contact = document.createElement("p");

            contact.textContent =
                "Contacts: " + (event.contacts?.length || 0);


            const status = document.createElement("span");

            status.className = "event-status";

            status.textContent = event.status || "Pending";


            card.append(
                heading,
                date,
                contact,
                status
            );


            if (event.location?.mapLink) {

                const map = document.createElement("a");

                map.href = event.location.mapLink;

                map.target = "_blank";

                map.rel = "noopener noreferrer";

                map.textContent = "View Location";

                card.appendChild(map);

            }


            emergencyHistory.appendChild(card);

        });

    }

    catch (error) {

        loadingMessage.hidden = true;

        console.error(error);

        errorMessage.textContent =
            "Unable to load emergency history.";

    }

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