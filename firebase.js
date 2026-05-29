
const firebaseConfig = {
  apiKey: "AIzaSyDNpvmUTe5cDQUg2Fk49NPumpIgOO-8e00",
  authDomain: "protincarps.firebaseapp.com",
  projectId: "protincarps",
  storageBucket: "protincarps.firebasestorage.app",
  messagingSenderId: "68975799324",
  appId: "1:68975799324:web:af819448ebfcaa9ffb43d9",
  measurementId: "G-SHFZR3PSCW"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
