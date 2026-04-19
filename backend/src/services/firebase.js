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

async function addNotification(notification) {
  if (db) {
    const docRef = db.collection('settings').doc('notifications');
    await docRef.set({
      list: admin.firestore.FieldValue.arrayUnion(notification)
    }, { merge: true });
  } else {
    const list = memoryStore.get('global_notifications') || [];
    list.push(notification);
    memoryStore.set('global_notifications', list);
  }
}

async function getAllRooms() {
  if (db) {
    const snap = await db.collection('rooms').get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  return Array.from(memoryStore.values());
}

// ─── User Profile / Battle History ───────────────────────────────────────────

/**
 * Save a single battle result for a user after a game ends.
 * uid        – Firebase Auth UID of the player
 * battleData – { roomId, rank, totalPlayers, score, status, problemTitle, language, timeTaken, date }
 */
async function saveUserBattle(uid, battleData) {
  if (!db || !uid) return; // Skip in memory-only mode or for anon players
  try {
    const userRef   = db.collection('users').doc(uid);
    const battleRef = userRef.collection('battles').doc();

    // Write individual battle record
    await battleRef.set({
      ...battleData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update aggregate stats atomically
    const isWin = battleData.rank === 1;
    const dateKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Build update object — only include displayName if we actually have a name
    const userUpdate = {
      stats: {
        totalBattles:  admin.firestore.FieldValue.increment(1),
        wins:          admin.firestore.FieldValue.increment(isWin ? 1 : 0),
        totalScore:    admin.firestore.FieldValue.increment(battleData.score || 0),
        lastPlayed:    dateKey,
      },
      activity: {
        [dateKey]: admin.firestore.FieldValue.increment(1)
      }
    };
    if (battleData.playerName) {
      userUpdate.displayName = battleData.playerName;
    }

    await userRef.set(userUpdate, { merge: true });

    console.log(`📊 Battle saved for user ${uid} (+${battleData.score || 0} pts)`);
  } catch (err) {
    console.error('saveUserBattle error:', err.message);
  }
}

/**
 * Get a user's profile: stats + recent battles + activity heatmap.
 */
async function getUserProfile(uid) {
  if (!db || !uid) return null;
  const userRef = db.collection('users').doc(uid);
  const [docSnap, battlesSnap] = await Promise.all([
    userRef.get(),
    userRef.collection('battles').orderBy('createdAt', 'desc').limit(20).get(),
  ]);

  const data    = docSnap.exists ? docSnap.data() : {};
  const stats   = data.stats   || {};
  const activity = data.activity || {};

  const battles = battlesSnap.docs.map((d) => {
    const b = d.data();
    return {
      id:           d.id,
      roomId:       b.roomId,
      rank:         b.rank,
      totalPlayers: b.totalPlayers,
      score:        b.score,
      status:       b.status,
      problemTitle: b.problemTitle,
      language:     b.language,
      timeTaken:    b.timeTaken,
      date:         b.date,
    };
  });

  return { stats, activity, battles };
}

/**
 * Get global leaderboard — top players sorted by totalScore.
 */
async function getGlobalLeaderboard(limit = 100) {
  if (!db) return [];
  try {
    const snap = await db.collection('users')
      .orderBy('stats.totalScore', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map((d, i) => ({
      uid:          d.id,
      rank:         i + 1,
      ...( d.data().stats || {} ),
      displayName:  d.data().displayName || d.data().stats?.displayName || 'Anonymous',
    }));
  } catch (err) {
    console.error('getGlobalLeaderboard error:', err.message);
    return [];
  }
}

module.exports = { initFirebase, createRoom, getRoom, updateRoom, deleteRoom, getAllRooms, saveUserBattle, getUserProfile, addNotification, getGlobalLeaderboard };
