import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.resolve(__dirname, 'firebase-applet-config.json');

// Support loading Firebase config from environment variables (great for Vercel, Netlify, etc.)
const envConfig = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  firestoreDatabaseId: process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "sige-cadastral",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID || ""
};

const hasEnvCredentials = !!envConfig.apiKey && 
                           envConfig.apiKey !== "your-api-key-placeholder" && 
                           envConfig.apiKey.length > 10;

if (hasEnvCredentials) {
  fs.writeFileSync(configPath, JSON.stringify(envConfig, null, 2), 'utf-8');
  console.log("Prebuild: Successfully populated 'firebase-applet-config.json' from environment variables.");
} else if (!fs.existsSync(configPath)) {
  const defaultConfig = {
    "projectId": "steel-life-41f5t",
    "appId": "1:776918370297:web:3917bc8eba0060fdcc1f28",
    "apiKey": "AIzaSyDXHz8ornQIS45mijVzv3hqTXeJ7w8nk5g",
    "authDomain": "steel-life-41f5t.firebaseapp.com",
    "firestoreDatabaseId": "sige-cadastral",
    "storageBucket": "steel-life-41f5t.firebasestorage.app",
    "messagingSenderId": "776918370297",
    "measurementId": ""
  };
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
  console.log("Prebuild: Created default 'firebase-applet-config.json' with active project keys.");
} else {
  console.log("Prebuild: firebase-applet-config.json already exists.");
}
