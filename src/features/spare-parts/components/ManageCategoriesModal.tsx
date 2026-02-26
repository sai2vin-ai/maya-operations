// ManageCategoriesModal
// Two-pane modal for managing spare part categories and subcategories.
// Hardcoded 15 main categories are shown in grey (non-deletable).
// User-added categories/subcategories show a delete button.

import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/ui';
import {
    useSparePartCategoryDocs,
    useMainCategories,
    useAddSparePartCategory,
    useDeleteSparePartCategory,
} from '../hooks/useSparePartCategories';
import { SPARE_PART_CATEGORIES } from '../services/sparePartsService';

interface Props {
    onClose: () => void;
}

const HARDCODED_VALUES = new Set<string>(SPARE_PART_CATEGORIES.map((c) => c.value));

export default function ManageCategoriesModal({ onClose }: Props) {
    const { userData } = useAuth();
    const toast = useToast();

    const { data: categoryDocs = [] } = useSparePartCategoryDocs();
    const mainCategories = useMainCategories();

    const addMutation = useAddSparePartCategory();
    const deleteMutation = useDeleteSparePartCategory();

    // Left pane: selected main category
    const [selectedMain, setSelectedMain] = useState<string>(mainCategories[0]?.value ?? '');

    // Input states
    const [newMainLabel, setNewMainLabel] = useState('');
    const [newSubLabel, setNewSubLabel] = useState('');

    // Inline delete confirmation
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const subcategories = categoryDocs.filter((d) => d.parentValue === selectedMain);

    const handleAddMain = async () => {
        if (!newMainLabel.trim() || !userData?.id) return;
        try {
            await addMutation.mutateAsync({
                label: newMainLabel.trim(),
                parentValue: null,
                createdBy: userData.id,
                callerRole: userData.role,
            });
            setNewMainLabel('');
            toast.success('Main category added');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to add category');
        }
    };

    const handleAddSub = async () => {
        if (!newSubLabel.trim() || !selectedMain || !userData?.id) return;
        try {
            await addMutation.mutateAsync({
                label: newSubLabel.trim(),
                parentValue: selectedMain,
                createdBy: userData.id,
                callerRole: userData.role,
            });
            setNewSubLabel('');
            toast.success('Subcategory added');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to add subcategory');
        }
    };

    const handleDelete = async (id: string) => {
        if (!userData?.id) return;
        try {
            await deleteMutation.mutateAsync({ categoryId: id, callerRole: userData.role });
            setConfirmDeleteId(null);
            toast.success('Category deleted');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete category');
            setConfirmDeleteId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border-secondary">
                    <h2 className="text-lg font-semibold text-foreground">Manage Categories</h2>
                    <button
                        onClick={onClose}
                        className="text-foreground-muted hover:text-foreground text-xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Body: two panes */}
                <div className="flex flex-1 overflow-hidden divide-x divide-border-secondary">
                    {/* Left pane: main categories */}
                    <div className="w-1/2 flex flex-col overflow-hidden">
                        <div className="p-3 text-xs font-medium text-foreground-secondary uppercase tracking-wide border-b border-border-secondary">
                            Main Categories
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {mainCategories.map((cat) => {
                                const isHardcoded = HARDCODED_VALUES.has(cat.value);
                                const isSelected = selectedMain === cat.value;
                                return (
                                    <div
                                        key={cat.value}
                                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-blue-500/20 text-blue-300' : 'hover:bg-surface-hover text-foreground-secondary'}`}
                                        onClick={() => setSelectedMain(cat.value)}
                                    >
                                        <span className={`text-sm ${isHardcoded ? 'text-foreground-faint' : ''}`}>
                                            {cat.label}
                                        </span>
                                        {!isHardcoded &&
                                            'id' in cat &&
                                            cat.id &&
                                            (confirmDeleteId === cat.id ? (
                                                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => handleDelete(cat.id!)}
                                                        disabled={deleteMutation.isPending}
                                                        className="text-xs text-red-400 hover:text-red-300"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDeleteId(null)}
                                                        className="text-xs text-foreground-muted hover:text-foreground"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfirmDeleteId(cat.id!);
                                                    }}
                                                    className="text-xs text-foreground-faint hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    ✕
                                                </button>
                                            ))}
                                    </div>
                                );
                            })}
                        </div>
                        {/* Add main category */}
                        <div className="p-3 border-t border-border-secondary">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMainLabel}
                                    onChange={(e) => setNewMainLabel(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddMain()}
                                    className="input-field flex-1 text-sm py-1.5"
                                    placeholder="New main category…"
                                />
                                <button
                                    onClick={handleAddMain}
                                    disabled={!newMainLabel.trim() || addMutation.isPending}
                                    className="btn-primary text-sm px-3 py-1.5"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right pane: subcategories */}
                    <div className="w-1/2 flex flex-col overflow-hidden">
                        <div className="p-3 text-xs font-medium text-foreground-secondary uppercase tracking-wide border-b border-border-secondary">
                            Subcategories of{' '}
                            <span className="text-foreground">
                                {mainCategories.find((c) => c.value === selectedMain)?.label ?? selectedMain}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {subcategories.length === 0 ? (
                                <p className="text-foreground-faint text-sm p-2">No subcategories yet</p>
                            ) : (
                                subcategories.map((sub) => (
                                    <div
                                        key={sub.id}
                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover"
                                    >
                                        <span className="text-sm text-foreground-secondary">{sub.label}</span>
                                        {confirmDeleteId === sub.id ? (
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleDelete(sub.id)}
                                                    disabled={deleteMutation.isPending}
                                                    className="text-xs text-red-400 hover:text-red-300"
                                                >
                                                    Confirm
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeleteId(null)}
                                                    className="text-xs text-foreground-muted hover:text-foreground"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmDeleteId(sub.id)}
                                                className="text-xs text-foreground-faint hover:text-red-400"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        {/* Add subcategory */}
                        <div className="p-3 border-t border-border-secondary">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newSubLabel}
                                    onChange={(e) => setNewSubLabel(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSub()}
                                    className="input-field flex-1 text-sm py-1.5"
                                    placeholder={`Add subcategory…`}
                                    disabled={!selectedMain}
                                />
                                <button
                                    onClick={handleAddSub}
                                    disabled={!newSubLabel.trim() || !selectedMain || addMutation.isPending}
                                    className="btn-primary text-sm px-3 py-1.5"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
