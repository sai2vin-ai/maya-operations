interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    onNextPage: () => void;
    onPrevPage: () => void;
    onGoToPage?: (page: number) => void;
}

/**
 * Pagination controls for list views.
 */
export function Pagination({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    hasNextPage,
    hasPrevPage,
    onNextPage,
    onPrevPage,
}: PaginationProps) {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between py-3">
            <p className="text-sm text-slate-400">
                Showing {startItem}-{endItem} of {totalItems}
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={onPrevPage}
                    disabled={!hasPrevPage}
                    className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <span className="text-sm text-slate-400 px-2">
                    {currentPage} / {totalPages}
                </span>
                <button
                    onClick={onNextPage}
                    disabled={!hasNextPage}
                    className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
