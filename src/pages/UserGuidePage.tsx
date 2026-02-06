import { useState, useEffect, useRef } from 'react';
import { PageHeader, StatusBadge } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { getFilteredGuideContent, type GuideSection } from '../data/guideContent';

export default function UserGuidePage() {
    const { userData } = useAuth();
    const [search, setSearch] = useState('');
    const [activeSection, setActiveSection] = useState('');
    const [tocOpen, setTocOpen] = useState(false);
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

    const sections = userData?.role
        ? getFilteredGuideContent(userData.role)
        : [];

    const filteredSections = search
        ? sections.filter(s =>
            s.title.toLowerCase().includes(search.toLowerCase()) ||
            s.description.toLowerCase().includes(search.toLowerCase())
        )
        : sections;

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
        <div className="min-h-screen page-bg">
            <PageHeader
                title="User Guide"
                subtitle={`Guide for ${userData?.role?.replace(/_/g, ' ') || 'your role'}`}
                backTo="/dashboard"
            />

            <div className="px-4 py-4">
                {/* Role Badge + Search */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <StatusBadge status={userData?.role || ''} variant="role" />
                    <span className="text-sm text-foreground-muted">
                        Showing {filteredSections.length} of {sections.length} sections for your role
                    </span>
                    <div className="flex-1" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search guide..."
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
                                <h3 className="text-sm font-semibold text-foreground mb-3">Table of Contents</h3>
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
                                <h3 className="text-sm font-semibold text-foreground mb-3">Table of Contents</h3>
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
                                <p className="text-foreground-muted">No sections match your search.</p>
                            </div>
                        ) : (
                            filteredSections.map((section) => (
                                <GuideSectionCard
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

import { forwardRef } from 'react';

const GuideSectionCard = forwardRef<HTMLElement, { section: GuideSection }>(
    ({ section }, ref) => (
        <section
            id={section.id}
            ref={ref}
            className="glass-card p-6 scroll-mt-4"
        >
            <h2 className="text-xl font-bold text-foreground mb-2">{section.title}</h2>
            <p className="text-foreground-secondary mb-4">{section.description}</p>

            <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-2">
                    How to Use
                </h3>
                <ol className="space-y-2">
                    {section.steps.map((step, i) => (
                        <li key={i} className="flex gap-3 text-sm">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">
                                {i + 1}
                            </span>
                            <span className="text-foreground-secondary pt-0.5">{step}</span>
                        </li>
                    ))}
                </ol>
            </div>

            {section.tips.length > 0 && (
                <div className="bg-surface-secondary rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-2">
                        Tips
                    </h3>
                    <ul className="space-y-1">
                        {section.tips.map((tip, i) => (
                            <li key={i} className="flex gap-2 text-sm text-foreground-secondary">
                                <span className="text-yellow-400 flex-shrink-0">*</span>
                                {tip}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    ),
);

GuideSectionCard.displayName = 'GuideSectionCard';
