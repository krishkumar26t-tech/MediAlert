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


// HTML Elements

const getLocationBtn =
    document.getElementById("getLocationBtn");

const locationStatus =
    document.getElementById("locationStatus");

const locationDetails =
    document.getElementById("locationDetails");

const latitudeElement =
    document.getElementById("latitude");

const longitudeElement =
    document.getElementById("longitude");

const accuracyElement =
    document.getElementById("accuracy");

const mapLink =
    document.getElementById("mapLink");

const errorMessage =
    document.getElementById("errorMessage");

const copyLocationBtn =
    document.getElementById("copyLocationBtn");

const shareLocationBtn =
    document.getElementById("shareLocationBtn");


// Current User

let currentUser = null;

let currentMapUrl = "";


// Authentication

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    currentUser = user;

});


// Get Current Location

getLocationBtn.addEventListener("click", () => {

    errorMessage.textContent = "";

    if (!navigator.geolocation) {

        errorMessage.textContent =
            "Geolocation is not supported by this browser.";

        return;

    }

    getLocationBtn.disabled = true;

    locationStatus.textContent =
        "Getting your location... Please wait.";

    navigator.geolocation.getCurrentPosition(

        async (position) => {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;

            const accuracy =
                position.coords.accuracy;


            latitudeElement.textContent =
                latitude.toFixed(6);

            longitudeElement.textContent =
                longitude.toFixed(6);

            accuracyElement.textContent =
                accuracy.toFixed(1) + " metres";


            currentMapUrl =
                `https://www.google.com/maps?q=${latitude},${longitude}`;


            mapLink.href = currentMapUrl;


            locationDetails.hidden = false;

            locationStatus.textContent =
                "Location obtained successfully!";


            // Save location in Firestore

            try {

                if (currentUser) {

                    await addDoc(

                        collection(
                            db,
                            "users",
                            currentUser.uid,
                            "locations"
                        ),

                        {

                            latitude: latitude,

                            longitude: longitude,

                            accuracy: accuracy,

                            timestamp: serverTimestamp()

                        }

                    );

                    console.log(
                        "Location saved successfully!"
                    );

                }

            }

            catch (error) {

                console.error(
                    "Location saving failed:",
                    error
                );

                errorMessage.textContent =
                    "Location obtained, but could not be saved.";

            }

            finally {

                getLocationBtn.disabled = false;

            }

        },

        (error) => {

            getLocationBtn.disabled = false;

            switch (error.code) {

                case error.PERMISSION_DENIED:

                    errorMessage.textContent =
                        "Location permission was denied. Allow location access in your browser settings.";

                    break;

                case error.POSITION_UNAVAILABLE:

                    errorMessage.textContent =
                        "Your current location is unavailable.";

                    break;

                case error.TIMEOUT:

                    errorMessage.textContent =
                        "Location request timed out. Please try again.";

                    break;

                default:

                    errorMessage.textContent =
                        "Unable to obtain your location.";

            }

            locationStatus.textContent =
                "Unable to get location.";

        },

        {

            enableHighAccuracy: true,

            timeout: 15000,

            maximumAge: 0

        }

    );

});


// Copy Location Link

copyLocationBtn.addEventListener("click", async () => {

    if (!currentMapUrl) return;

    try {

        await navigator.clipboard.writeText(currentMapUrl);

        alert("Google Maps location link copied!");

    }

    catch (error) {

        alert("Unable to copy location link.");

    }

});


// Share Location

shareLocationBtn.addEventListener("click", async () => {

    if (!currentMapUrl) return;

    if (navigator.share) {

        try {

            await navigator.share({

                title: "My MediAlert Location",

                text: "Here is my current location.",

                url: currentMapUrl

            });

        }

        catch (error) {

            if (error.name !== "AbortError") {

                alert("Unable to share location.");

            }

        }

    }

    else {

        try {

            await navigator.clipboard.writeText(currentMapUrl);

            alert(
                "Sharing is not supported on this browser. Location link copied instead."
            );

        }

        catch (error) {

            alert("Unable to share or copy the location.");

        }

    }

});


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