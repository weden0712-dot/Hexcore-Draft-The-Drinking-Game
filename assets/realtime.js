import { firebaseSettings } from "./firebase-config.js";

console.log("[realtime.js] loaded, firebaseSettings.enabled:", firebaseSettings.enabled);

const ROOM_PATH = "rooms";
const LOCAL_STORAGE_KEY = "drink-tactics-local-rooms";

let firebase = null;
let localRooms = {};

function loadLocalRooms() {
  try {
    localRooms = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "{}");
  } catch {
    localRooms = {};
  }
}

function saveLocalRooms() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localRooms));
}

function createLocalClient() {
  console.log("[realtime.js] createLocalClient called");
  loadLocalRooms();
  const localUid = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return {
    configured: true,
    uid: localUid,
    createRoom: async (room) => {
      loadLocalRooms();
      if (localRooms[room.code]) {
        throw new Error("房号已存在，请再试一次。");
      }
      localRooms[room.code] = JSON.parse(JSON.stringify(room));
      saveLocalRooms();
    },
    getRoom: async (code) => {
      loadLocalRooms();
      return localRooms[code] ? JSON.parse(JSON.stringify(localRooms[code])) : null;
    },
    joinRoom: async (code, player) => {
      loadLocalRooms();
      if (!localRooms[code]) {
        throw new Error("没有找到这个房间。");
      }
      localRooms[code].players[player.id] = player;
      localRooms[code].updatedAt = Date.now();
      saveLocalRooms();
      return JSON.parse(JSON.stringify(localRooms[code]));
    },
    subscribeRoom: (code, callback) => {
      const interval = setInterval(() => {
        loadLocalRooms();
        callback(localRooms[code] ? JSON.parse(JSON.stringify(localRooms[code])) : null);
      }, 1000);
      return () => clearInterval(interval);
    },
    updateRoom: async (code, patch) => {
      loadLocalRooms();
      if (!localRooms[code]) return;
      if (patch.settings) localRooms[code].settings = patch.settings;
      if (patch.phase !== undefined) localRooms[code].phase = patch.phase;
      if (patch.game !== undefined) localRooms[code].game = patch.game;
      localRooms[code].updatedAt = Date.now();
      saveLocalRooms();
    },
    setPlayerOnline: async (code, playerId, online) => {
      loadLocalRooms();
      if (!localRooms[code] || !localRooms[code].players[playerId]) return;
      localRooms[code].players[playerId].online = online;
      localRooms[code].players[playerId].lastSeen = Date.now();
      saveLocalRooms();
    },
  };
}

export async function createRealtimeClient() {
  console.log("[realtime.js] createRealtimeClient called, enabled:", firebaseSettings.enabled);
  if (!firebaseSettings.enabled) {
    return createLocalClient();
  }

  const version = firebaseSettings.sdkVersion || "12.7.0";
  const [{ initializeApp }, authModule, dbModule] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${version}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${version}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${version}/firebase-database.js`),
  ]);

  const app = initializeApp(firebaseSettings.config);
  const auth = authModule.getAuth(app);
  const database = dbModule.getDatabase(app);
  const credential = await authModule.signInAnonymously(auth);
  firebase = { auth, authModule, database, dbModule };

  return {
    configured: true,
    uid: credential.user.uid,
    createRoom,
    getRoom,
    joinRoom,
    subscribeRoom,
    updateRoom,
    setPlayerOnline,
  };
}

async function getRoom(code) {
  const snapshot = await firebase.dbModule.get(refFor(code));
  return snapshot.exists() ? snapshot.val() : null;
}

async function createRoom(room) {
  const roomRef = refFor(room.code);
  const snapshot = await firebase.dbModule.get(roomRef);
  if (snapshot.exists()) {
    throw new Error("房号已存在，请再试一次。");
  }
  await firebase.dbModule.set(roomRef, room);
}

async function joinRoom(code, player) {
  const roomRef = refFor(code);
  const snapshot = await firebase.dbModule.get(roomRef);
  if (!snapshot.exists()) {
    throw new Error("没有找到这个房间。");
  }
  const room = snapshot.val();
  await firebase.dbModule.update(roomRef, {
    [`players/${player.id}`]: player,
    updatedAt: firebase.dbModule.serverTimestamp(),
  });
  markDisconnect(code, player.id);
  return room;
}

function subscribeRoom(code, callback) {
  const roomRef = refFor(code);
  return firebase.dbModule.onValue(roomRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
}

async function updateRoom(code, patch) {
  await firebase.dbModule.update(refFor(code), {
    ...patch,
    updatedAt: firebase.dbModule.serverTimestamp(),
  });
}

async function setPlayerOnline(code, playerId, online) {
  await firebase.dbModule.update(refFor(code), {
    [`players/${playerId}/online`]: online,
    [`players/${playerId}/lastSeen`]: firebase.dbModule.serverTimestamp(),
  });
  if (online) markDisconnect(code, playerId);
}

function markDisconnect(code, playerId) {
  const presenceRef = firebase.dbModule.ref(
    firebase.database,
    `${ROOM_PATH}/${code}/players/${playerId}`,
  );
  firebase.dbModule.onDisconnect(presenceRef).update({
    online: false,
    lastSeen: firebase.dbModule.serverTimestamp(),
  });
}

function refFor(code) {
  return firebase.dbModule.ref(firebase.database, `${ROOM_PATH}/${code}`);
}
