import { useState, useEffect, useRef, forwardRef } from 'react';
import { PageHeader } from '../components/ui';
import { workflowSections, type WorkflowSection } from '../data/workflowContent';

export default function WorkflowsPage() {
    const [search, setSearch] = useState('');
    const [activeSection, setActiveSection] = useState('');
    const [tocOpen, setTocOpen] = useState(false);
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

    const filteredSections = search
        ? workflowSections.filter(s =>
            s.title.toLowerCase().includes(search.toLowerCase()) ||
            s.description.toLowerCase().includes(search.toLowerCase())
        )
        : workflowSections;

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                        break;
                    }
                }
            },
            { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 },
        );

        Object.values(sectionRefs.current).forEach(el => {
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [filteredSections]);

    const scrollToSection = (id: string) => {
        sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTocOpen(false);
    };

    return (
        <div className="">
            <PageHeader
                title="Operational Workflows"
                subtitle={`${workflowSections.length} workflows documented`}
                backTo="/dashboard"
            />

            <div className="px-4 py-4">
                {/* Search */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <span className="text-sm text-foreground-muted">
                            Showing {filteredSections.length} of {workflowSections.length} workflows
                        </span>
                    </div>
                    <div className="flex-1" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search workflows..."
                        className="input-field max-w-xs"
                    />
                </div>

                <div className="flex gap-6">
                    {/* Mobile TOC Toggle */}
                    <div className="lg:hidden fixed bottom-4 right-4 z-50">
                        <button
                            onClick={() => setTocOpen(!tocOpen)}
                            className="btn-primary shadow-lg rounded-full w-12 h-12 flex items-center justify-center"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                        </button>
                    </div>

                    {/* Mobile TOC Overlay */}
                    {tocOpen && (
                        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setTocOpen(false)}>
                            <div
                                className="absolute bottom-20 right-4 w-72 max-h-96 overflow-y-auto glass-card p-4"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h3 className="text-sm font-semibold text-foreground mb-3">Workflows</h3>
                                <nav className="space-y-1">
                                    {filteredSections.map(section => (
                                        <button
                                            key={section.id}
                                            onClick={() => scrollToSection(section.id)}
                                            className={`block w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${
                                                activeSection === section.id
                                                    ? 'bg-blue-500/20 text-blue-400'
                                                    : 'text-foreground-muted hover:text-foreground hover:bg-surface-hover'
                                            }`}
                                        >
                                            {section.title}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </div>
                    )}

                    {/* Desktop Sidebar TOC */}
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <div className="sticky top-4">
                            <div className="glass-card p-4">
                                <h3 className="text-sm font-semibold text-foreground mb-3">Workflows</h3>
                                <nav className="space-y-1">
                                    {filteredSections.map(section => (
                                        <button
                                            key={section.id}
                                            onClick={() => scrollToSection(section.id)}
                                            className={`block w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${
                                                activeSection === section.id
                                                    ? 'bg-blue-500/20 text-blue-400'
                                                    : 'text-foreground-muted hover:text-foreground hover:bg-surface-hover'
                                            }`}
                                        >
                                            {section.title}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </div>
                    </aside>

                    {/* Content */}
                    <main className="flex-1 min-w-0 space-y-6">
                        {filteredSections.length === 0 ? (
                            <div className="glass-card p-8 text-center">
                                <p className="text-foreground-muted">No workflows match your search.</p>
                            </div>
                        ) : (
                            filteredSections.map((section) => (
                                <WorkflowSectionCard
                                    key={section.id}
                                    section={section}
                                    ref={(el) => { sectionRefs.current[section.id] = el; }}
                                />
                            ))
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

// ─── Section Card ────────────────────────────────────────────

const WorkflowSectionCard = forwardRef<HTMLElement, { section: WorkflowSection }>(
    ({ section }, ref) => (
        <section id={section.id} ref={ref} className="glass-card overflow-hidden scroll-mt-4">
            {/* Header */}
            <div className="p-6 pb-4">
                <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${section.gradient} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={section.icon} />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-foreground mb-1">{section.title}</h2>
                        <p className="text-foreground-secondary text-sm leading-relaxed">{section.description}</p>
                    </div>
                </div>

                {/* Module Pills */}
                <div className="flex flex-wrap items-center gap-2 mb-1">
                    {section.modules.map((mod, i) => (
                        <span key={mod.label} className="flex items-center gap-1.5">
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${mod.color}`}>
                                {mod.label}
                            </span>
                            {i < section.modules.length - 1 && (
                                <svg className="w-3.5 h-3.5 text-foreground-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                        </span>
                    ))}
                </div>
            </div>

            {/* Status Flow Pipeline */}
            <div className="px-6 py-4 bg-surface-secondary/50 border-y border-border">
                <h3 className="text-xs font-semibold text-foreground-faint uppercase tracking-wider mb-3">
                    Status Flow
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                    {section.statusFlow.map((status, i) => (
                        <span key={status.label} className="flex items-center gap-2">
                            <span className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg border ${status.color}`}>
                                {status.label}
                            </span>
                            {i < section.statusFlow.length - 1 && (
                                <svg className="w-4 h-4 text-foreground-faint flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            )}
                        </span>
                    ))}
                </div>
            </div>

            {/* Steps Timeline */}
            <div className="p-6 pb-4">
                <h3 className="text-xs font-semibold text-foreground-faint uppercase tracking-wider mb-4">
                    Workflow Steps
                </h3>
                <div className="space-y-0">
                    {section.steps.map((step, i) => (
                        <div key={i} className="flex gap-4">
                            {/* Timeline connector */}
                            <div className="flex flex-col items-center">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                    step.actor === 'System'
                                        ? 'bg-purple-500/20 text-purple-400 ring-2 ring-purple-500/30'
                                        : 'bg-blue-500/20 text-blue-400 ring-2 ring-blue-500/30'
                                }`}>
                                    {i + 1}
                                </div>
                                {i < section.steps.length - 1 && (
                                    <div className="w-px h-full min-h-[16px] bg-border my-1" />
                                )}
                            </div>
                            {/* Step content */}
                            <div className="pb-4 flex-1 min-w-0">
                                <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded mb-1 ${
                                    step.actor === 'System'
                                        ? 'bg-purple-500/15 text-purple-400'
                                        : 'bg-blue-500/15 text-blue-400'
                                }`}>
                                    {step.actor}
                                </span>
                                <p className="text-sm text-foreground-secondary leading-relaxed">{step.action}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Data Effects */}
            <div className="px-6 py-4 bg-surface-secondary/50 border-t border-border">
                <h3 className="text-xs font-semibold text-foreground-faint uppercase tracking-wider mb-3">
                    Data Effects
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                    {section.dataEffects.map((effect, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                            <EffectIcon type={effect.type} />
                            <span className="text-xs text-foreground-secondary leading-relaxed">{effect.description}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    ),
);

WorkflowSectionCard.displayName = 'WorkflowSectionCard';

// ─── Effect Icon ─────────────────────────────────────────────

function EffectIcon({ type }: { type: 'create' | 'update' | 'event' }) {
    if (type === 'create') {
        return (
            <div className="w-5 h-5 rounded flex items-center justify-center bg-green-500/15 flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
            </div>
        );
    }
    if (type === 'update') {
        return (
            <div className="w-5 h-5 rounded flex items-center justify-center bg-blue-500/15 flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            </div>
        );
    }
    return (
        <div className="w-5 h-5 rounded flex items-center justify-center bg-purple-500/15 flex-shrink-0 mt-0.5">
            <svg className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
        </div>
    );
}
