import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDHtJVXcYZElnz2npVITOND3lvw0BaKNuE",
  authDomain: "softtennis-club-app.firebaseapp.com",
  projectId: "softtennis-club-app",
  storageBucket: "softtennis-club-app.firebasestorage.app",
  messagingSenderId: "214377630701",
  appId: "1:214377630701:web:31301c1e889092ed7535e4"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);