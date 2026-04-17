const admin = require('firebase-admin');

let db = null;

/**
 * Initialize Firebase Admin SDK.
 * Falls back to an in-memory store if no credentials are provided
 * (useful for local development without Firebase).
 */
function initFirebase() {
  if (admin.apps.length) return; // Already initialised

  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  const projectId = process.env.FIREBASE_PROJECT_ID || 'codearena-91844';

  try {
    if (serviceAccountEnv && serviceAccountEnv.trim().startsWith('{')) {
      // Full service account JSON provided
      const serviceAccount = JSON.parse(serviceAccountEnv);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId,
      });
      db = admin.firestore();
      console.log('✅ Firebase Admin SDK initialized with service account');
    } else {
      // No service account — fall back to in-memory store
      throw new Error('No Firebase service account — using in-memory store');
    }
  } catch (err) {
    console.warn(`⚠️  ${err.message}`);
    db = null; // Will use memoryStore
  }
}

// ─── In-Memory Fallback (for development) ────────────────────────────────────
const memoryStore = new Map();

// ─── Firestore Helpers ────────────────────────────────────────────────────────

async function createRoom(roomId, data) {
  if (db) {
    await db.collection('rooms').doc(roomId).set(data);
  } else {
    memoryStore.set(roomId, { ...data });
  }
}

async function getRoom(roomId) {
  if (db) {
    const snap = await db.collection('rooms').doc(roomId).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  }
  return memoryStore.get(roomId) || null;
}

async function updateRoom(roomId, data) {
  if (db) {
    await db.collection('rooms').doc(roomId).update(data);
  } else {
    const existing = memoryStore.get(roomId) || {};
    memoryStore.set(roomId, { ...existing, ...data });
  }
}

async function deleteRoom(roomId) {
  if (db) {
    await db.collection('rooms').doc(roomId).delete();
  } else {
    memoryStore.delete(roomId);
  }
}

async function getAllRooms() {
  if (db) {
    const snap = await db.collection('rooms').get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  return Array.from(memoryStore.values());
}

module.exports = { initFirebase, createRoom, getRoom, updateRoom, deleteRoom, getAllRooms };
