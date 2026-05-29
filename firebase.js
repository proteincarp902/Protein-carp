import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDNpvmUTe5cDQUg2Fk49NPumpIgOO-8e00",
  authDomain: "protincarps.firebaseapp.com",
  projectId: "protincarps",
  storageBucket: "protincarps.firebasestorage.app",
  messagingSenderId: "68975799324",
  appId: "1:68975799324:web:af819448ebfcaa9ffb43d9",
  measurementId: "G-SHFZR3PSCW"
};

const appFirebase = initializeApp(firebaseConfig);

const db = getFirestore(appFirebase);

window.db = db;

console.log("Firebase Connected");
