import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Read .env manually
const envPath = path.join(process.cwd(), '.env');
const envStr = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envStr.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length > 0) env[key.trim()] = vals.join('=').trim().replace(/['"]/g, '');
});

const firebaseConfig = {
  apiKey:            env.VITE_FIREBASE_API_KEY,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             env.VITE_FIREBASE_APP_ID,
  measurementId:     env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addManualUser() {
  const uid = 'koinexa-manual-' + Date.now();
  const email = 'koinexa63@gmail.com';
  const password = 'advdsa';

  const userDoc = {
    uid,
    name: 'Koinexa Admin',
    email,
    password, 
    avatarUrl: 'https://ui-avatars.com/api/?name=Koinexa+Admin&background=6C63FF&color=fff',
    college: 'Koinexa HQ',
    department: 'Admin',
    year: '1',
    bio: 'Official Koinexa Account',
    skills: ['Admin'],
    joinedAt: new Date().toISOString(),
    phone: '',
  };

  try {
    await setDoc(doc(db, 'users', uid), userDoc);
    console.log('Successfully created manual user:', email);
    process.exit(0);
  } catch (error) {
    console.error('Error creating user:', error);
    process.exit(1);
  }
}

addManualUser();
