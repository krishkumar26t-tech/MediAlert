import { auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
    activateSOS
} from "./sos-service.js";


const sosButton = document.getElementById("homeSosButton");


// Existing homepage function

window.startMonitoring = function () {
    alert("Welcome to MediAlert! Health monitoring will start soon.");
};


// SOS authentication

let currentUser = null;

onAuthStateChanged(auth, user => {
    currentUser = user;
});


// Homepage SOS button

sosButton.addEventListener("click", async () => {

    if (!currentUser) {

        alert("Please log in to activate Emergency SOS.");

        window.location.href = "login.html";

        return;

    }


    const confirmed = confirm(

        "You are about to activate the MediAlert SOS demonstration.\n\n" +

        "Your latest health readings, emergency contacts " +
        "and GPS location (if permission is granted) " +
        "will be recorded.\n\n" +

        "No emergency services or contacts will be notified.\n\n" +

        "Continue?"

    );


    if (!confirmed) return;


    sosButton.disabled = true;

    sosButton.textContent = "Processing SOS...";


    try {

        const result = await activateSOS(currentUser);


        let message =

            "SOS demonstration activated successfully!\n\n" +

            "Event ID: " + result.eventId + "\n\n" +

            "Heart Rate: " +
            (result.healthReadings.heartRate ?? "Unavailable") + " BPM\n" +

            "SpO2: " +
            (result.healthReadings.spo2 ?? "Unavailable") + "%\n" +

            "Temperature: " +
            (result.healthReadings.temperature ?? "Unavailable") + " °C\n\n" +

            "Emergency Contacts: " + result.contacts.length + "\n";


        if (result.location) {

            message +=
                "\nLocation: " + result.location.latitude +
                ", " + result.location.longitude +
                "\n\nGoogle Maps: " + result.location.mapLink;

        }

        else {

            message += "\nGPS Location: Unavailable";

        }


        message +=

            "\n\nThe emergency event has been saved to Firestore." +

            "\nNo emergency services or contacts were notified.";


        alert(message);


    }

    catch (error) {

        console.error("SOS activation error:", error);

        alert("Unable to activate SOS:\n" + error.message);

    }

    finally {

        sosButton.disabled = false;

        sosButton.textContent = "🚨 Activate SOS";

    }

});