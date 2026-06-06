import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  projectId: "nexusdfi",
  appId: "1:741401327113:web:1ff7eeac44dee7cc5daad8",
  storageBucket: "nexusdfi.firebasestorage.app",
  apiKey: "AIzaSyAIMQ25zVRpCfpymWCsibvGHbDq3fi1Nj8",
  authDomain: "nexusdfi.firebaseapp.com",
  messagingSenderId: "741401327113",
  measurementId: "G-WTXSJ4KPBY",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
