// src/lib/mongoAuthService.ts
// ─── Frontend Client API for Option B: MongoDB + Node/Express Backend ───
// Connects React frontend to local/cloud MongoDB API (http://localhost:5000)

const MONGODB_API_BASE = import.meta.env.VITE_MONGODB_API_URL || 'http://localhost:5000/api';

/** Check if Option B MongoDB backend is online */
export async function checkMongoDBHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${MONGODB_API_BASE}/health`, { method: 'GET' });
    if (!res.ok) return false;
    const data = await res.json();
    return data.database === 'Connected';
  } catch {
    return false;
  }
}

/** Register account with MongoDB API */
export async function registerWithMongoDB(userData: any): Promise<any> {
  const res = await fetch(`${MONGODB_API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed via MongoDB');
  }
  return data.user;
}

/** Login account with MongoDB API */
export async function loginWithMongoDB(email: string, password: string): Promise<any> {
  const res = await fetch(`${MONGODB_API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Invalid email or password.');
  }
  return data.user;
}

/** Display profile data from MongoDB API */
export async function fetchProfileFromMongoDB(identifier: string): Promise<any | null> {
  try {
    const res = await fetch(`${MONGODB_API_BASE}/users/profile/${encodeURIComponent(identifier)}`, {
      method: 'GET',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch (err) {
    console.error('Error fetching MongoDB profile:', err);
    return null;
  }
}
