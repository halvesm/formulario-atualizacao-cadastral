import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  memoryLocalCache
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Ensure the config has a structurally valid Firebase API key format to prevent validation crashes.
// A valid Google API Key must start with "AIzaSy" and be sufficiently long.
const config = { ...firebaseConfig };
const isMockConfig = !config || !config.apiKey || 
                     config.apiKey.includes('placeholder') || 
                     !config.apiKey.startsWith('AIzaSy') || 
                     config.apiKey.length < 20;

if (isMockConfig && config) {
  config.apiKey = "AIzaSyMockKeyForLocalSimulationValue00";
  config.authDomain = config.authDomain || "mock-domain.firebaseapp.com";
  config.projectId = config.projectId || "mock-project-id";
  config.storageBucket = config.storageBucket || "mock-bucket.appspot.com";
  config.messagingSenderId = config.messagingSenderId || "1234567890";
  config.appId = config.appId || "1:1234567890:web:1234567890";
  console.log("SIGE: Executando em modo de simulação local. Para sincronizar em tempo real com o Firestore, configure uma chave Firebase ativa.");
}

const dbId = (config as any).firestoreDatabaseId && (config as any).firestoreDatabaseId.trim() !== ""
  ? (config as any).firestoreDatabaseId.trim()
  : "atualizacao-cadastral-escolar-2026";

let app: any;
let db: any;
let auth: any;
let googleProvider: any;

try {
  if (getApps().length === 0) {
    app = initializeApp(config);
  } else {
    app = getApp();
  }
} catch (e) {
  console.warn("Firebase App initialization failed, using mock app instance:", e);
  app = { options: config };
}

try {
  // Use persistentLocalCache to cache documents in IndexedDB, enabling instant local queries.
  // tabManager syncs operations and mutations across multiple browser tabs CMT (client-merge-table).
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  }, dbId as any);
} catch (e) {
  console.warn("Firestore persistent local cache initialization failed. Trying memory local cache:", e);
  try {
    db = initializeFirestore(app, {
      localCache: memoryLocalCache()
    }, dbId as any);
  } catch (e2) {
    console.warn("Firestore initializeFirestore failed, falling back to basic getFirestore:", e2);
    db = getFirestore(app, dbId as any);
  }
}

try {
  auth = getAuth(app);
} catch (e) {
  console.warn("Firebase Auth initialization failed, using mock auth instance:", e);
  auth = {
    currentUser: null,
    onAuthStateChanged: (cb: any) => {
      cb(null);
      return () => {};
    }
  };
}

try {
  googleProvider = new GoogleAuthProvider();
} catch (e) {
  console.warn("GoogleAuthProvider initialization failed:", e);
  googleProvider = {};
}

export { app, db, auth, googleProvider, isMockConfig };

// Connection validation
async function testConnection() {
  if (isMockConfig) return;
  try {
    const { doc, getDocFromServer } = await import('firebase/firestore');
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    console.warn("Firebase connection test warning (offline or invalid key):", error);
  }
}
testConnection();

// Standard error handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error Detailed: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
