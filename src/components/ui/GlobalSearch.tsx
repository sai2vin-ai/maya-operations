import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface SearchResult {
    id: string;
    type: string;
    title: string;
    subtitle: string;
    path: string;
}

interface CollectionCache {
    data: { id: string; data: Record<string, unknown> }[];
    timestamp: number;
}

const CACHE_TTL = 60_000; // 1 minute cache
const DEBOUNCE_MS = 500;
const RESULTS_PER_COLLECTION = 50;
const MAX_RESULTS = 20;

export function GlobalSearch() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const cacheRef = useRef<Map<string, CollectionCache>>(new Map());
    const abortRef = useRef(false);

    // Keyboard shortcut to open search (Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input when opening
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setSearchQuery('');
            setResults([]);
        }
    }, [isOpen]);

    // Fetch collection with cache
    const fetchCollection = useCallback(async (name: string) => {
        const cached = cacheRef.current.get(name);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data;
        }

        const snapshot = await getDocs(query(collection(db, name), limit(RESULTS_PER_COLLECTION)));
        const data = snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
        cacheRef.current.set(name, { data, timestamp: Date.now() });
        return data;
    }, []);

    // Search when query changes
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setResults([]);
            return;
        }

        abortRef.current = true; // Abort any in-flight search

        const timer = setTimeout(async () => {
            abortRef.current = false;
            setIsSearching(true);
            try {
                // Fetch all collections in parallel (with cache)
                const [gateDocs, batchDocs, userDocs, invDocs, spareDocs] = await Promise.all([
                    fetchCollection('gateEntries'),
                    fetchCollection('batches'),
                    fetchCollection('users'),
                    fetchCollection('inventoryItems'),
                    fetchCollection('spareParts'),
                ]);

                if (abortRef.current) return; // New search started, discard

                const allResults: SearchResult[] = [];
                const q = searchQuery.toLowerCase();

                // Search gate entries
                for (const { id, data: d } of gateDocs) {
                    if (
                        d.vehicleNumber?.toString().toLowerCase().includes(q) ||
                        d.driverName?.toString().toLowerCase().includes(q) ||
                        d.entryNumber?.toString().toLowerCase().includes(q)
                    ) {
                        allResults.push({
                            id,
                            type: 'Gate Entry',
                            title: (d.vehicleNumber || d.entryNumber || id) as string,
                            subtitle: `${d.driverName || ''} - ${d.material || ''} (${d.status || ''})`,
                            path: `/gate/${id}`,
                        });
                    }
                }

                // Search batches
                for (const { id, data: d } of batchDocs) {
                    if (d.batchNumber?.toString().toLowerCase().includes(q)) {
                        allResults.push({
                            id,
                            type: 'Batch',
                            title: (d.batchNumber || id) as string,
                            subtitle: `Reactor ${d.reactorId || ''} - ${d.status || ''}`,
                            path: `/batch/${id}`,
                        });
                    }
                }

                // Search users
                for (const { id, data: d } of userDocs) {
                    if (
                        d.name?.toString().toLowerCase().includes(q) ||
                        d.email?.toString().toLowerCase().includes(q) ||
                        d.employeeId?.toString().toLowerCase().includes(q)
                    ) {
                        allResults.push({
                            id,
                            type: 'User',
                            title: (d.name || d.email || id) as string,
                            subtitle: `${d.role || ''} - ${d.status || ''}`,
                            path: `/users/${id}`,
                        });
                    }
                }

                // Search inventory
                for (const { id, data: d } of invDocs) {
                    if (d.name?.toString().toLowerCase().includes(q) || d.code?.toString().toLowerCase().includes(q)) {
                        allResults.push({
                            id,
                            type: 'Inventory',
                            title: (d.code || id) as string,
                            subtitle: `${d.name || ''} - Stock: ${d.currentStock || 0}`,
                            path: `/inventory/${id}`,
                        });
                    }
                }

                // Search spare parts
                for (const { id, data: d } of spareDocs) {
                    if (
                        d.name?.toString().toLowerCase().includes(q) ||
                        d.partNumber?.toString().toLowerCase().includes(q)
                    ) {
                        allResults.push({
                            id,
                            type: 'Spare Part',
                            title: (d.partNumber || id) as string,
                            subtitle: `${d.name || ''} - Stock: ${d.currentStock || 0}`,
                            path: `/spare-parts/${id}`,
                        });
                    }
                }

                if (!abortRef.current) {
                    setResults(allResults.slice(0, MAX_RESULTS));
                }
            } catch {
                // Silently fail on search errors
            } finally {
                if (!abortRef.current) {
                    setIsSearching(false);
                }
            }
        }, DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [searchQuery, fetchCollection]);

    const handleSelect = (result: SearchResult) => {
        navigate(result.path);
        setIsOpen(false);
    };

    const typeColors: Record<string, string> = {
        'Gate Entry': 'bg-green-500/20 text-green-400',
        Batch: 'bg-orange-500/20 text-orange-400',
        User: 'bg-blue-500/20 text-blue-400',
        Inventory: 'bg-cyan-500/20 text-cyan-400',
        'Spare Part': 'bg-indigo-500/20 text-indigo-400',
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 rounded-lg text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-colors"
                title="Search (Ctrl+K)"
                aria-label="Open search (Ctrl+K)"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
            </button>
        );
    }

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsOpen(false)} />

            {/* Search Modal */}
            <div className="fixed inset-x-0 top-20 mx-auto max-w-2xl z-50 px-4">
                <div className="glass-card overflow-hidden shadow-2xl border border-border-secondary">
                    {/* Search Input */}
                    <div className="flex items-center gap-3 p-4 border-b border-border">
                        <svg
                            className="w-5 h-5 text-foreground-muted flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent text-foreground placeholder-foreground-faint outline-none"
                            placeholder="Search vehicles, batches, users, inventory..."
                        />
                        <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs text-foreground-faint bg-surface-tertiary rounded">
                            ESC
                        </kbd>
                    </div>

                    {/* Results */}
                    <div className="max-h-96 overflow-y-auto">
                        {isSearching && (
                            <div className="p-4 text-center text-foreground-muted">
                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                Searching...
                            </div>
                        )}

                        {!isSearching && searchQuery.length >= 2 && results.length === 0 && (
                            <div className="p-6 text-center text-foreground-muted">
                                No results found for "{searchQuery}"
                            </div>
                        )}

                        {results.map((result) => (
                            <button
                                key={`${result.type}-${result.id}`}
                                onClick={() => handleSelect(result)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-surface-hover transition-colors text-left"
                            >
                                <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[result.type] || 'bg-slate-500/20 text-slate-400'}`}
                                >
                                    {result.type}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-foreground text-sm font-medium truncate">{result.title}</p>
                                    <p className="text-foreground-faint text-xs truncate">{result.subtitle}</p>
                                </div>
                                <svg
                                    className="w-4 h-4 text-foreground-faint flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </button>
                        ))}
                    </div>

                    {/* Footer */}
                    {searchQuery.length < 2 && (
                        <div className="p-3 border-t border-border text-center text-foreground-faint text-xs">
                            Type at least 2 characters to search across all modules
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
