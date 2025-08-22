import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCZMHEmzJpRGzg0J4I7LibILei9bJxcE_A",
  authDomain: "crossword-battle-arena-af6db.firebaseapp.com",
  projectId: "crossword-battle-arena-af6db",
  storageBucket: "crossword-battle-arena-af6db.firebasestorage.app",
  messagingSenderId: "352495252146",
  appId: "1:352495252146:web:5fcb5824a977e3fabe4fab"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;