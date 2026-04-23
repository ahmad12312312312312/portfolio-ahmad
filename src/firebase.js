import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAFBrhuCYkCf_XG4POFFmwE9cjI_wQ8hLM",
  authDomain: "portfolio-verzkhan.firebaseapp.com",
  databaseURL:
    "https://portfolio-verzkhan-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "portfolio-verzkhan",
  storageBucket: "portfolio-verzkhan.firebasestorage.app",
  messagingSenderId: "132121827951",
  appId: "1:132121827951:web:788babbd30ff0d8fc98b9a",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export { app };
