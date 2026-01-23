import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// IMPORTANT: For production applications, you should secure these keys.
// Consider using environment variables and Firebase App Check.
// See: https://firebase.google.com/docs/app-check
const firebaseConfig = {
  apiKey: "AIzaSyDMswGY1AAL7k6bGaTq8pjZ-NAx3Ii22VQ",
  authDomain: "newnarayanaschool-2022.firebaseapp.com",
  projectId: "newnarayanaschool-2022",
  storageBucket: "newnarayanaschool-2022.firebasestorage.app",
  messagingSenderId: "1022443065552",
  appId: "1:1022443065552:web:70cdd78f7f1b3dcff5ced5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
