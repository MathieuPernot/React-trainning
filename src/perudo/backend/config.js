// src/services/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAwQ7P72aeLzyr9Q6frBiolOxHvNPQjglo",
  authDomain: "perudo-9b0e7.firebaseapp.com",
  projectId: "perudo-9b0e7",
  storageBucket: "perudo-9b0e7.firebasestorage.app",
  messagingSenderId: "254121531273",
  appId: "1:254121531273:web:be76e011742b3c62367358",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const db = getFirestore(app);

export default db;
