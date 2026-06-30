// src/config/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { browserLocalPersistence } from 'firebase/auth';

//From the firebaseAuth
const firebaseConfig = {
  apiKey: "AIzaSyBu2f5ucemN0W4xHm26PAYM9MJcccWfV7I",
  authDomain: "project-2e3e4af6-faee-4041-8f4.firebaseapp.com",
  projectId: "project-2e3e4af6-faee-4041-8f4",
  storageBucket: "project-2e3e4af6-faee-4041-8f4.firebasestorage.app",
  messagingSenderId: "968824547493",
  appId: "1:968824547493:web:18c7c7c10127fc1a29054c"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const authPersistence = Platform.OS === 'web'
  ? browserLocalPersistence
  : getReactNativePersistence(AsyncStorage);

const auth = initializeAuth(app, {
  persistence: authPersistence
});

const db = getFirestore(app);

export { auth, db };