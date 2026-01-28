// Cleanup Script - Clear Reactor and Batch Data
// Run with: npx ts-node --esm src/scripts/clearReactorData.ts

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Firebase config - same as your app
const firebaseConfig = {
    apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    authDomain: "maya-recyclage-519e0.firebaseapp.com",
    projectId: "maya-recyclage-519e0",
    storageBucket: "maya-recyclage-519e0.appspot.com",
    messagingSenderId: "xxxxxxxxxxxx",
    appId: "1:xxxxxxxxxxxx:web:xxxxxxxxxxxx"
};

async function clearCollection(db: any, collectionName: string) {
    console.log(`Clearing collection: ${collectionName}...`);
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);

    let count = 0;
    for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, collectionName, docSnap.id));
        count++;
    }
    console.log(`  Deleted ${count} documents from ${collectionName}`);
    return count;
}

async function main() {
    console.log('=== CLEARING REACTOR DATA ===\n');

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Collections to clear
    const collections = [
        'reactors',
        'batches',
    ];

    let totalDeleted = 0;
    for (const col of collections) {
        totalDeleted += await clearCollection(db, col);
    }

    console.log(`\n=== COMPLETE ===`);
    console.log(`Total documents deleted: ${totalDeleted}`);
}

main().catch(console.error);
