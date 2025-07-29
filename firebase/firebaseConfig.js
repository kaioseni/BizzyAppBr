import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDs02X0xHxoE5ZI3VzIBN0FFh2rzE68-G0",
  authDomain: "bizzyappbr.firebaseapp.com",
  projectId: "bizzyappbr",
  storageBucket: "bizzyappbr.appspot.com",
  //storageBucket: "bizzyappbr.firebasestorage.app"
  messagingSenderId: "992136817098",
  appId: "1:992136817098:web:f7c616519e12d1b7bb4733",
  measurementId: "G-3X76Q7P74P"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
