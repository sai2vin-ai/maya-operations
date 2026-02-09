import { useState, useEffect, useRef } from 'react';
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

export function GlobalSearch() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

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

    // Search when query changes
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const allResults: SearchResult[] = [];
                const q = searchQuery.toLowerCase();

                // Search gate entries
                const gateSnap = await getDocs(query(collection(db, 'gateEntries'), limit(50)));
                gateSnap.docs.forEach(doc => {
                    const d = doc.data();
                    if (
                        d.vehicleNumber?.toLowerCase().includes(q) ||
                        d.driverName?.toLowerCase().includes(q) ||
                        d.entryNumber?.toLowerCase().includes(q)
                    ) {
                        allResults.push({
                            id: doc.id,
                            type: 'Gate Entry',
                            title: d.vehicleNumber || d.entryNumber || doc.id,
                            subtitle: `${d.driverName || ''} - ${d.material || ''} (${d.status || ''})`,
                            path: `/gate/${doc.id}`,
                        });
                    }
                });

                // Search batches
                const batchSnap = await getDocs(query(collection(db, 'batches'), limit(50)));
                batchSnap.docs.forEach(doc => {
                    const d = doc.data();
                    if (d.batchNumber?.toLowerCase().includes(q)) {
                        allResults.push({
                            id: doc.id,
                            type: 'Batch',
                            title: d.batchNumber || doc.id,
                            subtitle: `Reactor ${d.reactorId || ''} - ${d.status || ''}`,
                            path: `/batch/${doc.id}`,
                        });
                    }
                });

                // Search users
                const userSnap = await getDocs(query(collection(db, 'users'), limit(50)));
                userSnap.docs.forEach(doc => {
                    const d = doc.data();
                    if (
                        d.name?.toLowerCase().includes(q) ||
                        d.email?.toLowerCase().includes(q) ||
                        d.employeeId?.toLowerCase().includes(q)
                    ) {
                        allResults.push({
                            id: doc.id,
                            type: 'User',
                            title: d.name || d.email || doc.id,
                            subtitle: `${d.role || ''} - ${d.status || ''}`,
                            path: `/users/${doc.id}`,
                        });
                    }
                });

                // Search inventory
                const invSnap = await getDocs(query(collection(db, 'inventoryItems'), limit(50)));
                invSnap.docs.forEach(doc => {
                    const d = doc.data();
                    if (d.name?.toLowerCase().includes(q) || d.code?.toLowerCase().includes(q)) {
                        allResults.push({
                            id: doc.id,
                            type: 'Inventory',
                            title: d.code || doc.id,
                            subtitle: `${d.name || ''} - Stock: ${d.currentStock || 0}`,
                            path: `/inventory/${doc.id}`,
                        });
                    }
                });

                // Search spare parts
                const spareSnap = await getDocs(query(collection(db, 'spareParts'), limit(50)));
                spareSnap.docs.forEach(doc => {
                    const d = doc.data();
                    if (d.name?.toLowerCase().includes(q) || d.partNumber?.toLowerCase().includes(q)) {
                        allResults.push({
                            id: doc.id,
                            type: 'Spare Part',
                            title: d.partNumber || doc.id,
                            subtitle: `${d.name || ''} - Stock: ${d.currentStock || 0}`,
                            path: `/spare-parts/${doc.id}`,
                        });
                    }
                });

                setResults(allResults.slice(0, 20));
            } catch {
                // Silently fail on search errors
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSelect = (result: SearchResult) => {
        navigate(result.path);
        setIsOpen(false);
    };

    const typeColors: Record<string, string> = {
        'Gate Entry': 'bg-green-500/20 text-green-400',
        'Batch': 'bg-orange-500/20 text-orange-400',
        'User': 'bg-blue-500/20 text-blue-400',
        'Inventory': 'bg-cyan-500/20 text-cyan-400',
        'Spare Part': 'bg-indigo-500/20 text-indigo-400',
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 rounded-lg text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-colors"
                title="Search (Ctrl+K)"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                        <svg className="w-5 h-5 text-foreground-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[result.type] || 'bg-slate-500/20 text-slate-400'}`}>
                                    {result.type}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-foreground text-sm font-medium truncate">{result.title}</p>
                                    <p className="text-foreground-faint text-xs truncate">{result.subtitle}</p>
                                </div>
                                <svg className="w-4 h-4 text-foreground-faint flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
