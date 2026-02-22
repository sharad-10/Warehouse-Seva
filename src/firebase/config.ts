import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAPXJl6XKnZa-xMmMx09Y-C9VfpJHcivC8",
  authDomain: "warehouse-seva.firebaseapp.com",
  projectId: "warehouse-seva",
  storageBucket: "warehouse-seva.firebasestorage.app",
  messagingSenderId: "646405736959",
  appId: "1:646405736959:web:d29217dff6faa54cb9ffca",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
