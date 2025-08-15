import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBZqzDoNT5FILS1PHA98_DlZERgbN5Qrf0",
  authDomain: "safety-alert-app-3aa05.firebaseapp.com",
  projectId: "safety-alert-app-3aa05",
  storageBucket: "safety-alert-app-3aa05.appspot.com",
  messagingSenderId: "619085971303",
  appId: "1:619085971303:web:9063a751b9deefb7cc39c2",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
