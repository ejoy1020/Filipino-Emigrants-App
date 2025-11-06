import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCoGBooOlouVzWSklhredvQ-MVMcq0iHHQ",
  authDomain: "filipinoemigrantsdb-115d3.firebaseapp.com",
  projectId: "filipinoemigrantsdb-115d3",
  storageBucket: "filipinoemigrantsdb-115d3.firebasestorage.app",
  messagingSenderId: "60943050819",
  appId: "1:60943050819:web:e23ddd3aafafd43d2e4cf6",
  measurementId: "G-W9Z0RZQYQ9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
