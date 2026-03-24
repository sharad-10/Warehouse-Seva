import { initializeApp } from "firebase/app";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as firebaseAuth from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

export const firebaseConfig = {
  apiKey: "AIzaSyAPXJl6XKnZa-xMmMx09Y-C9VfpJHcivC8",
  authDomain: "warehouse-seva.firebaseapp.com",
  projectId: "warehouse-seva",
  storageBucket: "warehouse-seva.firebasestorage.app",
  messagingSenderId: "646405736959",
  appId: "1:646405736959:web:d29217dff6faa54cb9ffca",
};

const app = initializeApp(firebaseConfig);
const getReactNativePersistence = (firebaseAuth as typeof firebaseAuth & {
  getReactNativePersistence?: (storage: typeof AsyncStorage) => firebaseAuth.Persistence;
}).getReactNativePersistence;

const auth =
  Platform.OS === "web"
    ? firebaseAuth.getAuth(app)
    : (() => {
        try {
          return firebaseAuth.initializeAuth(app, {
            persistence: getReactNativePersistence?.(AsyncStorage),
          });
        } catch {
          // During fast refresh or repeated initialization, Firebase may already have auth.
          return firebaseAuth.getAuth(app);
        }
      })();

export { auth };
export const db = getFirestore(app);
