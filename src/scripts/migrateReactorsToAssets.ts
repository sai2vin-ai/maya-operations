/**
 * Migration Script — Migrate Reactors Collection to Assets Collection
 *
 * Uses Firebase Admin SDK with service account key for direct Firestore access.
 * Reads all docs from `reactors` and creates corresponding docs in `assets`
 * with reactor-specific fields mapped.
 *
 * Safety: Checks each record exists before writing. Skips already-migrated docs.
 *
 * Run with: npx tsx src/scripts/migrateReactorsToAssets.ts
 *
 * IMPORTANT: Run this BEFORE deploying the new code to production.
 * After verifying, you can use clearReactorData.ts to remove the old collection.
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Initialize with service account
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serviceAccountPath = resolve(__dirname, '../../service-account/firebase-service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Reactor status → reactorStatus mapping
function mapReactorStatus(status: string): string {
    const validStatuses = ['IDLE', 'IN_BATCH', 'MAINTENANCE', 'OFFLINE'];
    return validStatuses.includes(status) ? status : 'IDLE';
}

// Location mapping from reactor name/number
function inferLocation(reactorNumber: string): string {
    const num = parseInt(reactorNumber.replace(/\D/g, ''));
    if (num <= 2) return 'Reactor Bay 1';
    if (num <= 4) return 'Reactor Bay 2';
    return 'Reactor Bay 3';
}

// Generate asset code
let assetCodeCounter = 0;
function nextAssetCode(): string {
    assetCodeCounter++;
    return `AST-${String(assetCodeCounter).padStart(4, '0')}`;
}

async function getHighestAssetCode(): Promise<number> {
    const assetsSnapshot = await db.collection('assets').get();

    let highest = 0;
    for (const doc of assetsSnapshot.docs) {
        const data = doc.data();
        if (data.assetCode && typeof data.assetCode === 'string') {
            const num = parseInt(data.assetCode.split('-')[1]) || 0;
            if (num > highest) highest = num;
        }
    }
    return highest;
}

async function main() {
    console.log('=== MIGRATE REACTORS → ASSETS ===\n');

    // Step 1: Read existing assets to avoid collisions
    assetCodeCounter = await getHighestAssetCode();
    console.log(`Highest existing asset code: AST-${String(assetCodeCounter).padStart(4, '0')}`);

    // Step 2: Read all reactors
    const reactorSnapshot = await db.collection('reactors').get();

    if (reactorSnapshot.empty) {
        console.log('No reactors found in the reactors collection. Nothing to migrate.');
        return;
    }

    console.log(`Found ${reactorSnapshot.size} reactor(s) to migrate.\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const reactorDoc of reactorSnapshot.docs) {
        const reactorId = reactorDoc.id;
        const data = reactorDoc.data();

        // Step 3: Check if already migrated — ALWAYS check before writing
        const existingAsset = await db.collection('assets').doc(reactorId).get();
        if (existingAsset.exists) {
            const existingData = existingAsset.data();
            console.log(`  SKIP: ${reactorId} — already exists in assets (${existingData?.assetCode || 'no code'})`);
            skipped++;
            continue;
        }

        const reactorNumber = data.reactorNumber || reactorId.replace('reactor_', '');
        const assetCode = nextAssetCode();

        const assetData: Record<string, unknown> = {
            // Asset fields
            assetCode,
            name: data.name || `Reactor ${reactorNumber}`,
            category: 'REACTOR',
            location: inferLocation(reactorNumber),
            criticality: 'HIGH',
            status: 'OPERATIONAL',

            // Reactor-specific fields
            reactorNumber,
            reactorStatus: mapReactorStatus(data.status || 'IDLE'),
            currentBatchId: data.currentBatchId || null,
            totalBatches: data.totalBatches || 0,

            // Audit fields — preserve originals or set migration defaults
            createdAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp(),
            createdBy: data.createdBy || 'migration-script',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: 'migration-script',
        };

        if (data.lastMaintenanceDate) {
            assetData.lastMaintenanceDate = data.lastMaintenanceDate;
        }

        try {
            await db.collection('assets').doc(reactorId).set(assetData);
            migrated++;
            console.log(
                `  OK: ${reactorId} → assets/${reactorId} (${assetCode}, ${reactorNumber}, status: ${assetData.reactorStatus})`,
            );
        } catch (err) {
            errors++;
            console.error(`  ERROR: ${reactorId} — ${err instanceof Error ? err.message : err}`);
        }
    }

    // Step 4: Verify batch references still work
    console.log('\n--- Verifying batch references ---');
    const batchSnapshot = await db.collection('batches').limit(10).get();
    let batchesChecked = 0;
    let batchesValid = 0;

    for (const batchDoc of batchSnapshot.docs) {
        const batchData = batchDoc.data();
        if (batchData.reactorId) {
            batchesChecked++;
            const assetDoc = await db.collection('assets').doc(batchData.reactorId).get();
            if (assetDoc.exists) {
                batchesValid++;
            } else {
                console.log(`  WARNING: Batch ${batchDoc.id} references ${batchData.reactorId} which is NOT in assets`);
            }
        }
    }

    if (batchesChecked > 0) {
        console.log(
            `  Checked ${batchesChecked} batches: ${batchesValid}/${batchesChecked} have valid asset references`,
        );
    } else {
        console.log('  No batches found to verify');
    }

    console.log(`\n=== MIGRATION COMPLETE ===`);
    console.log(`  Migrated: ${migrated}`);
    console.log(`  Skipped (already exist): ${skipped}`);
    console.log(`  Errors: ${errors}`);
    console.log(`  Total reactors: ${reactorSnapshot.size}`);
    console.log(`\nNote: Existing batch documents reference reactors by doc ID, which is preserved.`);
    console.log(`After verifying, you may delete the old 'reactors' collection using clearReactorData.ts`);
}

main().catch(console.error);
