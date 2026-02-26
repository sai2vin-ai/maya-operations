// Spare Part Category Service
// Manages user-defined spare part categories and subcategories in Firestore.
// The 15 hardcoded main categories live in sparePartsService.ts and are never stored here.

import { collection, getDocs, addDoc, deleteDoc, doc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { assertAuthorized } from '../../../lib/authorization';
import type { UserRole } from '../../../types';
import type { SparePartCategoryDoc } from '../types';

const CATEGORY_COLLECTION = 'sparePartCategories';
const SPARE_PARTS_COLLECTION = 'spareParts';

/** Convert a human label to a UPPER_SNAKE_CASE value. e.g. "Ball Bearing" → "BALL_BEARING" */
export function deriveCategoryValue(label: string): string {
    return label
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

/** Fetch all user-defined category docs from Firestore. */
export async function getSparePartCategoryDocs(): Promise<SparePartCategoryDoc[]> {
    const ref = collection(db, CATEGORY_COLLECTION);
    const snapshot = await getDocs(ref);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as SparePartCategoryDoc);
}

/** Add a new category or subcategory. Enforces unique `value` across the collection. */
export async function addSparePartCategory(
    data: { label: string; parentValue: string | null },
    createdBy: string,
    callerRole?: UserRole,
): Promise<string> {
    assertAuthorized(callerRole, 'spare_parts:manage_categories');

    const value = deriveCategoryValue(data.label);
    if (!value) {
        throw new Error('Category label is invalid');
    }

    // Check for duplicate value
    const ref = collection(db, CATEGORY_COLLECTION);
    const existing = await getDocs(query(ref, where('value', '==', value)));
    if (!existing.empty) {
        throw new Error(`A category with value "${value}" already exists`);
    }

    const docData = {
        label: data.label.trim(),
        value,
        parentValue: data.parentValue,
        createdAt: Timestamp.now(),
        createdBy,
    };

    const docRef = await addDoc(ref, docData);
    return docRef.id;
}

/**
 * Delete a user-defined category doc.
 * Refuses if any SparePart currently uses this value as its subCategory (or category for main).
 */
export async function deleteSparePartCategory(categoryId: string, callerRole?: UserRole): Promise<void> {
    assertAuthorized(callerRole, 'spare_parts:manage_categories');

    // Fetch the category to know its value
    const ref = collection(db, CATEGORY_COLLECTION);
    const allDocs = await getDocs(ref);
    const catDoc = allDocs.docs.find((d) => d.id === categoryId);

    if (!catDoc) {
        throw new Error('Category not found');
    }

    const catData = catDoc.data() as Omit<SparePartCategoryDoc, 'id'>;

    // Check if any spare part uses this subcategory
    const partsRef = collection(db, SPARE_PARTS_COLLECTION);
    const field = catData.parentValue !== null ? 'subCategory' : 'category';
    const inUse = await getDocs(query(partsRef, where(field, '==', catData.value)));

    if (!inUse.empty) {
        const count = inUse.size;
        const noun = catData.parentValue !== null ? 'subcategory' : 'category';
        throw new Error(`Cannot delete: ${count} spare part${count !== 1 ? 's' : ''} still use this ${noun}`);
    }

    await deleteDoc(doc(db, CATEGORY_COLLECTION, categoryId));
}
