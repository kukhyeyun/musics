// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCaud0Vm4Hj-D8OV0KVdy4w3ZJKEg0nxg",
  authDomain: "composer-app-e617d.firebaseapp.com",
  projectId: "composer-app-e617d",
  storageBucket: "composer-app-e617d.appspot.com",   // 🔥 여기 수정됨
  messagingSenderId: "475792602222",
  appId: "1:475792602222:web:629b0c5956d1f275",
  measurementId: "G-7QLTBMKQ2"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
