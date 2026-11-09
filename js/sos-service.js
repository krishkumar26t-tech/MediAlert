import { auth, db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    limit,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";


// Get latest health readings

async function getLatestHealthReadings(user) {

    const readingsQuery = query(
        collection(db, "users", user.uid, "health_readings"),
        orderBy("timestamp", "desc"),
        limit(1)
    );

    const snapshot = await getDocs(readingsQuery);

    if (snapshot.empty) {
        return {
            heartRate: null,
            spo2: null,
            temperature: null
        };
    }

    const data = snapshot.docs[0].data();

    return {
        heartRate: data.heartRate ?? null,
        spo2: data.spo2 ?? null,
        temperature: data.temperature ?? null
    };
}


// Get emergency contacts

async function getEmergencyContacts(user) {

    const snapshot = await getDocs(
        collection(db, "users", user.uid, "emergency_contacts")
    );

    return snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        phone: doc.data().phone,
        relationship: doc.data().relationship,
        isPrimary: doc.data().isPrimary || false
    }));
}


// Get GPS location

function getCurrentLocation() {

    return new Promise((resolve, reject) => {

        if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported."));
            return;
        }

        navigator.geolocation.getCurrentPosition(

            position => {

                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                resolve({
                    latitude,
                    longitude,
                    accuracy: position.coords.accuracy,
                    mapLink:
                        `https://www.google.com/maps?q=${latitude},${longitude}`
                });

            },

            error => reject(error),

            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }

        );

    });

}


// Shared SOS function

export async function activateSOS(user) {

    if (!user) {
        throw new Error("Please log in before activating SOS.");
    }

    // Retrieve contacts

    const contacts = await getEmergencyContacts(user);


    // Retrieve latest readings

    const healthReadings = await getLatestHealthReadings(user);


    // Retrieve GPS location

    let locationData = null;

    try {
        locationData = await getCurrentLocation();
    }

    catch (error) {
        console.warn("Location unavailable:", error.message);
    }


    // Create emergency event

    const emergencyData = {

        userId: user.uid,

        userEmail: user.email,

        contacts,

        healthReadings,

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
            user.uid,
            "emergency_events"
        ),

        emergencyData

    );


    return {
        eventId: eventRef.id,
        contacts,
        healthReadings,
        location: locationData
    };

}