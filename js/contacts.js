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
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";


// DOM Elements

const contactForm = document.getElementById("contactForm");

const contactName = document.getElementById("contactName");

const contactPhone = document.getElementById("contactPhone");

const relationship = document.getElementById("relationship");

const isPrimary = document.getElementById("isPrimary");

const editContactId = document.getElementById("editContactId");

const contactsList = document.getElementById("contactsList");

const formTitle = document.getElementById("formTitle");

const saveButton = document.getElementById("saveButton");

const cancelButton = document.getElementById("cancelButton");

const formMessage = document.getElementById("formMessage");

const loadingMessage = document.getElementById("loadingMessage");

const emptyMessage = document.getElementById("emptyMessage");

const errorMessage = document.getElementById("errorMessage");


// Current User

let currentUser = null;


// Authentication

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    currentUser = user;

    await loadContacts();

});


// Firestore Collection Reference

function getContactsCollection() {

    return collection(
        db,
        "users",
        currentUser.uid,
        "emergency_contacts"
    );

}


// Load Contacts

async function loadContacts() {

    loadingMessage.hidden = false;
    errorMessage.textContent = "";

    try {

        const snapshot = await getDocs(
            getContactsCollection()
        );

        contactsList.innerHTML = "";

        loadingMessage.hidden = true;

        if (snapshot.empty) {

            emptyMessage.hidden = false;
            return;

        }

        emptyMessage.hidden = true;

        snapshot.forEach((contactDoc) => {

            displayContact(
                contactDoc.id,
                contactDoc.data()
            );

        });

    }

    catch (error) {

        loadingMessage.hidden = true;

        console.error(error);

        errorMessage.textContent =
            "Unable to load contacts. Please try again.";

    }

}


// Display Contact

function displayContact(id, contact) {

    const card = document.createElement("div");

    card.className = "contact-card";


    const name = document.createElement("h3");
    name.textContent = contact.name;

    const phone = document.createElement("p");
    phone.textContent = "Phone: " + contact.phone;

    const relation = document.createElement("p");
    relation.textContent = "Relationship: " + contact.relationship;

    card.appendChild(name);
    card.appendChild(phone);
    card.appendChild(relation);


    if (contact.isPrimary) {

        const badge = document.createElement("span");

        badge.className = "primary-badge";

        badge.textContent = "Primary Contact";

        card.appendChild(badge);

    }


    const actions = document.createElement("div");

    actions.className = "contact-actions";


    const editButton = document.createElement("button");

    editButton.className = "edit-btn";

    editButton.textContent = "Edit";

    editButton.addEventListener("click", () => {

        editContact(id, contact);

    });


    const deleteButton = document.createElement("button");

    deleteButton.className = "delete-btn";

    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", () => {

        removeContact(id);

    });


    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    card.appendChild(actions);

    contactsList.appendChild(card);

}


// Make Other Contacts Non-Primary

async function clearPrimaryContacts() {

    const snapshot = await getDocs(
        getContactsCollection()
    );

    const updates = [];

    snapshot.forEach((contactDoc) => {

        if (contactDoc.data().isPrimary) {

            updates.push(
                updateDoc(
                    doc(getContactsCollection(), contactDoc.id),
                    { isPrimary: false }
                )
            );

        }

    });

    await Promise.all(updates);

}


// Add or Update Contact

contactForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    if (!currentUser) return;

    const name = contactName.value.trim();

    const phone = contactPhone.value.trim();

    const relation = relationship.value;

    const primary = isPrimary.checked;


    if (!/^[0-9+\-\s()]{7,15}$/.test(phone)) {

        formMessage.textContent =
            "Please enter a valid phone number.";

        return;

    }


    try {

        saveButton.disabled = true;

        saveButton.textContent = "Saving...";


        if (primary) {

            await clearPrimaryContacts();

        }


        const contactData = {

            name: name,

            phone: phone,

            relationship: relation,

            isPrimary: primary

        };


        const existingId = editContactId.value;


        if (existingId) {

            await updateDoc(

                doc(
                    getContactsCollection(),
                    existingId
                ),

                contactData

            );

            formMessage.textContent =
                "Contact updated successfully!";

        }

        else {

            await addDoc(

                getContactsCollection(),

                {

                    ...contactData,

                    createdAt: serverTimestamp()

                }

            );

            formMessage.textContent =
                "Contact added successfully!";

        }


        resetForm();

        await loadContacts();

    }

    catch (error) {

        console.error(error);

        formMessage.textContent =
            "Error saving contact: " + error.message;

    }

    finally {

        saveButton.disabled = false;

        saveButton.textContent =
            editContactId.value ? "Update Contact" : "Add Contact";

    }

});


// Edit Contact

function editContact(id, contact) {

    editContactId.value = id;

    contactName.value = contact.name;

    contactPhone.value = contact.phone;

    relationship.value = contact.relationship;

    isPrimary.checked = contact.isPrimary || false;


    formTitle.textContent = "Edit Emergency Contact";

    saveButton.textContent = "Update Contact";

    cancelButton.hidden = false;

    formMessage.textContent = "";


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


// Delete Contact

async function removeContact(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this contact?"
    );

    if (!confirmed) return;


    try {

        await deleteDoc(

            doc(
                getContactsCollection(),
                id
            )

        );

        await loadContacts();

    }

    catch (error) {

        console.error(error);

        errorMessage.textContent =
            "Unable to delete contact.";

    }

}


// Reset Form

function resetForm() {

    contactForm.reset();

    editContactId.value = "";

    formTitle.textContent = "Add Emergency Contact";

    saveButton.textContent = "Add Contact";

    cancelButton.hidden = true;

}


// Cancel Editing

cancelButton.addEventListener("click", () => {

    resetForm();

    formMessage.textContent = "";

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