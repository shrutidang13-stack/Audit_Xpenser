import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBfzWF2pGNSv_462vANWt2dDpyBcVrND9I",
  authDomain: "msme-guard.firebaseapp.com",
  projectId: "msme-guard",
  storageBucket: "msme-guard.firebasestorage.app",
  messagingSenderId: "117354626080",
  appId: "1:117354626080:web:1a95d90a6a29ee21645045"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);