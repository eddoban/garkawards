// Configuración de Firebase
// IMPORTANTE: Reemplaza estos valores con los de tu proyecto de Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCZxz-uucULfmhn20yE9TLpB-GutCxWiyM",
  authDomain: "garkawards-fifa.firebaseapp.com",
  projectId: "garkawards-fifa",
  storageBucket: "garkawards-fifa.firebasestorage.app",
  messagingSenderId: "514941607458",
  appId: "1:514941607458:web:69ab5b44ec2fc8fd60747b",
  measurementId: "G-9Z6VPY1K0T"
};

// Inicializar Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

console.log("Firebase inicializado correctamente");
