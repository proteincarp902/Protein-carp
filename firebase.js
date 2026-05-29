import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  deleteDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp
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

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

window.firebaseDB = {
  db,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  deleteDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp
};

async function initSystemSettings(){
  const settingsRef = doc(db, "settings", "system");
  const snap = await getDoc(settingsRef);

  if(!snap.exists()){
    await setDoc(settingsRef, {
      adminPassword: "0000",
      warehousePassword: "1111",
      createdAt: Date.now()
    });
  }
}

initSystemSettings();

console.log("Firebase Connected");
