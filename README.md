# 🩺 MediAlert
### Automated Health Monitoring and Single-Tap Emergency Response Application

MediAlert is a web-based health monitoring and emergency response demonstration system designed to help users record, monitor, analyze and manage their health information through a centralized dashboard.

The application provides simulated health monitoring, manual health data entry, historical records, graphical analytics, emergency contact management, GPS location sharing and an SOS demonstration system.

> **Project Type:** Individual Academic Project  
> **Department:** Computer Science and Engineering (CSE)  
> **Institution:** Institute of Engineering and Management, Kolkata  
> **Academic Session:** 2026–2027

---

## 📌 1. Project Overview

Health information and emergency contact details are often maintained separately, making them difficult to access quickly when needed.

MediAlert aims to provide a centralized web application where users can maintain their health records, view health trends, manage emergency contacts and create an emergency demonstration event containing their latest available health information and location (if permission is granted).

The current version is entirely software-based and does not require external hardware or sensors.

---

## 🎯 2. Project Objectives

- Develop a centralized health monitoring web application.
- Display simulated health readings through an interactive dashboard.
- Allow users to manually enter health measurements.
- Store health records securely using Firebase Authentication and Cloud Firestore.
- Provide historical health records and graphical analytics.
- Maintain personal and medical profile information.
- Manage emergency contacts.
- Obtain and share the user's GPS location with permission.
- Provide an SOS demonstration that records emergency-related information.

---

## ✨ 3. Features and Functionalities

### 🔐 User Authentication
- User registration and login.
- Firebase Email/Password Authentication.
- Authenticated access to application features.

### ❤️ Health Monitoring Dashboard
- Displays simulated heart rate.
- Displays simulated blood oxygen saturation (SpO₂).
- Displays simulated body temperature.
- Shows an overall status based on demonstration thresholds.
- Provides a live graphical representation of simulated readings.

### ➕ Manual Health Data Entry
Users can manually enter:
- Heart rate.
- Blood oxygen saturation.
- Body temperature.
- Systolic and diastolic blood pressure.
- Blood sugar measurements.
- Additional notes.

### 📋 Health History
- Displays previously recorded health measurements.
- Separates manual and simulated records.
- Provides summary statistics and average readings.

### 📊 Health Analytics
- Graphical visualization of recorded health measurements.
- Time-period filters.
- Average, minimum and maximum readings.
- Historical health data analysis.

### 🧠 Intelligent Health Analysis
- Compares available measurements with general adult reference ranges.
- Provides an educational screening summary.
- Displays individual measurement analysis.
- Visualizes historical trends using graphical charts.
- Supports manual and simulated record selection.

### 📞 Emergency Contact Management
- Add emergency contacts.
- Edit and delete contact information.
- Select a primary emergency contact.
- Store contact information in Cloud Firestore.

### 📍 GPS Location Sharing
- Obtains the current location using the browser Geolocation API.
- Displays latitude, longitude and location accuracy.
- Generates a Google Maps location link.
- Supports copying or sharing the location.

### 🚨 Emergency SOS Demonstration
- Provides an SOS activation interface.
- Retrieves available emergency contact information.
- Attempts to obtain the current GPS location.
- Retrieves the latest available health readings.
- Records an emergency demonstration event in Cloud Firestore.
- Maintains emergency event history.

**Important:** The SOS functionality currently records a demonstration event only. It does not send SMS messages, emails, phone calls or notifications to emergency contacts or emergency services.

---

## 🛠️ 4. Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Website structure |
| CSS3 | Styling and responsive layouts |
| JavaScript | Application functionality |
| Firebase Authentication | User registration and login |
| Cloud Firestore | Database and health record storage |
| Chart.js | Graphical data visualization |
| Browser Geolocation API | GPS location retrieval |
| Google Maps URL | Location visualization |
| Visual Studio Code | Development environment |
| Git and GitHub | Version control and source code hosting |
| Live Server | Local development and testing |

---

## 🏗️ 5. Project Structure

```text
MediAlert/
│
├── index.html
├── login.html
├── signup.html
├── dashboard.html
├── history.html
├── analytics.html
├── contacts.html
├── location.html
├── sos.html
├── profile.html
├── add-record.html
├── health-analysis.html
│
├── css/
│   ├── style.css
│   ├── auth.css
│   ├── dashboard.css
│   ├── history.css
│   ├── analytics.css
│   ├── contacts.css
│   ├── location.css
│   ├── sos.css
│   ├── profile.css
│   ├── add-record.css
│   ├── navigation.css
│   └── health-analysis.css
│
├── js/
│   ├── firebase.js
│   ├── auth.js
│   ├── script.js
│   ├── dashboard.js
│   ├── history.js
│   ├── analytics.js
│   ├── contacts.js
│   ├── location.js
│   ├── sos.js
│   ├── profile.js
│   ├── add-record.js
│   ├── navigation.js
│   └── health-analysis.js
│
├── package.json
├── package-lock.json
└── .gitignore
```

---

## ⚙️ 6. Installation and Setup

Follow these steps to run MediAlert locally.

### Prerequisites

- Visual Studio Code.
- Node.js and npm.
- Git.
- A Firebase account.
- A modern web browser.
- Live Server extension for VS Code.

### Step 1: Clone the Repository

```bash
git clone https://github.com/krishkumar26t-tech/MediAlert.git
```

### Step 2: Open