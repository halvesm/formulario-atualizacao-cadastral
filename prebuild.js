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
  firestoreDatabaseId: process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "(default)",
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
    "projectId": "ficha-cadastral-an",
    "appId": "1:511589405179:web:46ed32c7738fccaaa63b5e",
    "apiKey": "AIzaSyCy1P1P7M-6h5mJ9FLpPIz1Jqau3guXOkI",
    "authDomain": "ficha-cadastral-an.firebaseapp.com",
    "firestoreDatabaseId": "(default)",
    "storageBucket": "ficha-cadastral-an.firebasestorage.app",
    "messagingSenderId": "511589405179",
    "measurementId": ""
  };
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
  console.log("Prebuild: Created default 'firebase-applet-config.json' with active project keys.");
} else {
  // Overwrite local config database ID to apply the new ID immediately for developer testing
  try {
    const existing = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    existing.firestoreDatabaseId = "(default)";
    fs.writeFileSync(configPath, JSON.stringify(existing, null, 2), 'utf-8');
    console.log("Prebuild: Updated existing config database ID to '(default)'.");
  } catch (e) {
    console.error("Failed to update config ID in existing file:", e);
  }
}
