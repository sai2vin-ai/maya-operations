import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getSparePartCategoryDocs,
    addSparePartCategory,
    deleteSparePartCategory,
} from '../services/sparePartCategoryService';
import { SPARE_PART_CATEGORIES } from '../services/sparePartsService';
import type { UserRole } from '../../../types';

// Query keys
export const sparePartCategoryKeys = {
    all: ['sparePartCategories'] as const,
};

/** Fetch all user-defined category docs from Firestore. */
export function useSparePartCategoryDocs() {
    return useQuery({
        queryKey: sparePartCategoryKeys.all,
        queryFn: getSparePartCategoryDocs,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/** All subcategories for a given main category parentValue. */
export function useSubCategories(parentValue: string | null) {
    const { data: docs = [] } = useSparePartCategoryDocs();
    return docs.filter((d) => d.parentValue === parentValue);
}

/**
 * Merged main categories: hardcoded 15 + user-added docs where parentValue === null.
 * Returns objects with shape { value: string; label: string; isUserDefined: boolean; id?: string }.
 */
export function useMainCategories() {
    const { data: docs = [] } = useSparePartCategoryDocs();
    const hardcoded = SPARE_PART_CATEGORIES.map((c) => ({ ...c, isUserDefined: false as const }));
    const userDefined = docs
        .filter((d) => d.parentValue === null)
        .map((d) => ({ value: d.value, label: d.label, isUserDefined: true as const, id: d.id }));
    return [...hardcoded, ...userDefined];
}

/** Mutation to add a new category or subcategory. */
export function useAddSparePartCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            label,
            parentValue,
            createdBy,
            callerRole,
        }: {
            label: string;
            parentValue: string | null;
            createdBy: string;
            callerRole?: UserRole;
        }) => addSparePartCategory({ label, parentValue }, createdBy, callerRole),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: sparePartCategoryKeys.all });
        },
    });
}

/** Mutation to delete a user-defined category or subcategory. */
export function useDeleteSparePartCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ categoryId, callerRole }: { categoryId: string; callerRole?: UserRole }) =>
            deleteSparePartCategory(categoryId, callerRole),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: sparePartCategoryKeys.all });
        },
    });
}
