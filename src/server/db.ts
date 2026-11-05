import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Load config from firebase-applet-config.json
let firebaseConfig: any = {};
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.error('[Server DB] Failed to read firebase-applet-config.json:', e);
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const serverDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Admin SDK
import { initializeApp as initAdminApp, getApps as getAdminApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth, Auth as AdminAuthType } from 'firebase-admin/auth';

let adminAuthInstance: AdminAuthType | null = null;
try {
  const adminApp = getAdminApps().length === 0
    ? initAdminApp({ projectId: firebaseConfig.projectId || 'caramel-vault-pl37k' })
    : getAdminApps()[0];
  adminAuthInstance = getAdminAuth(adminApp);
  console.log('[Server DB] Firebase Admin SDK initialized for project:', firebaseConfig.projectId);
} catch (adminErr) {
  console.warn('[Server DB] Firebase Admin SDK init note:', adminErr);
}

export const adminAuth = adminAuthInstance;

export {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
};
