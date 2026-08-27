import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    getFirestore,
    collection
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyDbCj8pgqIWe7JUbO4GtsukpU3NQkoov_A",
    authDomain: "terminal-medica-v2.firebaseapp.com",
    projectId: "terminal-medica-v2",
    storageBucket: "terminal-medica-v2.firebasestorage.app",
    messagingSenderId: "824127751792",
    appId: "1:824127751792:web:9ff049d8de8d8b42d196b5",
    measurementId: "G-55YDL29WG2"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const pacientesRef = collection(db, "pacientes");


export {
    app,
    auth,
    db,
    pacientesRef
};