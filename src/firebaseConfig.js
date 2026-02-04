// Firebase Configuration and Services
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    enableIndexedDbPersistence,
    onSnapshot,
    query,
    where,
    serverTimestamp
} from 'firebase/firestore';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDqof4J3yzooIgxod5yahKI0ubLOAeChtI",
    authDomain: "fir-trader-ceb20.firebaseapp.com",
    projectId: "fir-trader-ceb20",
    storageBucket: "fir-trader-ceb20.firebasestorage.app",
    messagingSenderId: "1035753527951",
    appId: "1:1035753527951:web:a93c6c8259910b0dd2eefa",
    measurementId: "G-1ETXWEZCW7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable Offline Persistence
try {
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('⚠️ Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
            console.warn('⚠️ The current browser does not support offline persistence.');
        }
    });
} catch (error) {
    console.error('Error enabling persistence:', error);
}

/**
 * =========================
 * HYBRID STORAGE SYSTEM
 * =========================
 * This system saves data BOTH locally (LocalStorage) and remotely (Firestore)
 * - LocalStorage = Fast, works offline
 * - Firestore = Cloud backup, syncs across devices
 */

// Get or create anonymous user
export const initializeAuth = async () => {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe();
            if (user) {
                resolve(user);
            } else {
                try {
                    const result = await signInAnonymously(auth);
                    resolve(result.user);
                } catch (error) {
                    console.error('Error signing in anonymously:', error);
                    reject(error);
                }
            }
        });
    });
};

/**
 * =========================
 * CROSS-DEVICE SYNC LOGIC
 * =========================
 * To ensure PC and iPhone sync, we use the username as the primary key.
 */
export const getFirebaseUidForUser = async (username) => {
    // Ensure the user is signed in anonymously before proceeding
    await initializeAuth();
    // We use the normalized username as the key in Firestore.
    return username.toLowerCase().trim();
};

/**
 * =========================
 * HYBRID SAVE FUNCTION
 * =========================
 * Saves to LocalStorage (immediate) + Firestore (background)
 */
export const saveUserData = async (username, journalType, data) => {
    const uid = username.toLowerCase();
    const localKey = `s_trader:${uid}:${journalType}:data`;

    try {
        // 1. Save to LocalStorage (IMMEDIATE - for speed)
        localStorage.setItem(localKey, JSON.stringify(data));

        // 2. Save to Firestore (BACKGROUND - for cloud backup)
        const firebaseUid = await getFirebaseUidForUser(username);
        const docRef = doc(db, 'users', firebaseUid, journalType, 'data');

        await setDoc(docRef, {
            ...data,
            lastUpdated: serverTimestamp(),
            username: username
        }, { merge: true });

        console.log(`✅ Data saved: LocalStorage + Firestore (${journalType})`);
        return { success: true };
    } catch (error) {
        console.error('❌ Error saving to Firestore:', error);
        // Data is still saved locally, so app continues to work
        return { success: false, error: error.message };
    }
};

/**
 * =========================
 * HYBRID LOAD FUNCTION
 * =========================
 * Loads from LocalStorage (fast) + syncs from Firestore (if online)
 */
export const loadUserData = async (username, journalType) => {
    const uid = username.toLowerCase();
    const localKey = `s_trader:${uid}:${journalType}:data`;

    try {
        // 1. Load from LocalStorage (IMMEDIATE)
        const localData = localStorage.getItem(localKey);
        let data = localData ? JSON.parse(localData) : null;

        // 2. Try to sync from Firestore (BACKGROUND)
        try {
            const firebaseUid = await getFirebaseUidForUser(username);
            const docRef = doc(db, 'users', firebaseUid, journalType, 'data');
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const firestoreData = docSnap.data();

                // Compare timestamps to get the most recent data
                const localTimestamp = data?.lastUpdated?.seconds || 0;
                const firestoreTimestamp = firestoreData?.lastUpdated?.seconds || 0;

                if (firestoreTimestamp > localTimestamp) {
                    // Firestore has newer data - use it
                    data = firestoreData;
                    localStorage.setItem(localKey, JSON.stringify(data));
                    console.log(`🔄 Synced from Firestore (${journalType})`);
                } else {
                    console.log(`✅ LocalStorage is up to date (${journalType})`);
                }
            } else {
                // No Firestore data yet - save local data to cloud
                if (data) {
                    await saveUserData(username, journalType, data);
                    console.log(`☁️ Uploaded local data to Firestore (${journalType})`);
                }
            }
        } catch (syncError) {
            console.warn('⚠️ Firestore sync failed, using local data:', syncError.message);
        }

        return data;
    } catch (error) {
        console.error('❌ Error loading data:', error);
        return null;
    }
};

/**
 * =========================
 * REAL-TIME SYNC
 * =========================
 * Listen to Firestore changes in real-time
 */
export const subscribeToUserData = (username, journalType, callback) => {
    let unsubscribe = () => { };

    getFirebaseUidForUser(username).then(firebaseUid => {
        const docRef = doc(db, 'users', firebaseUid, journalType, 'data');

        unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Check if cloud data is newer than what we have
                const uid = username.toLowerCase();
                const localKey = `s_trader:${uid}:${journalType}:data`;
                const localData = localStorage.getItem(localKey);
                const localTimestamp = localData ? JSON.parse(localData)?.lastUpdated?.seconds || 0 : 0;
                const firestoreTimestamp = data?.lastUpdated?.seconds || 0;

                if (firestoreTimestamp > localTimestamp) {
                    localStorage.setItem(localKey, JSON.stringify(data));
                    callback(data);
                    console.log(`🔔 Real-time sync updated (${journalType})`);
                }
            }
        }, (error) => {
            console.error('Real-time sync error:', error);
        });
    });

    return () => unsubscribe();
};

/**
 * =========================
 * USER ACCOUNT SYNC
 * =========================
 * Saves / Loads the account itself (username, password, email)
 */
export const saveUserAccount = async (username, accountData) => {
    try {
        const firebaseUid = await getFirebaseUidForUser(username);
        const docRef = doc(db, 'users', firebaseUid); // Root user document

        await setDoc(docRef, {
            ...accountData,
            lastUpdated: serverTimestamp()
        }, { merge: true });

        console.log(`👤 User account synced to cloud: ${username}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Error syncing account to cloud:', error);
        return { success: false, error: error.message };
    }
};

export const loadUserAccount = async (username) => {
    try {
        const firebaseUid = await getFirebaseUidForUser(username);
        const docRef = doc(db, 'users', firebaseUid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        console.error('❌ Error loading account from cloud:', error);
        return null;
    }
};

export { auth, db };
