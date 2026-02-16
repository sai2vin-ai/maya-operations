import { Link } from 'react-router-dom';

export default function NotFoundPage() {
    return (
        <div className="min-h-screen page-bg flex items-center justify-center">
            <div className="glass-card p-8 text-center max-w-md">
                <div className="text-6xl font-bold text-foreground-faint mb-4">404</div>
                <h2 className="text-xl font-bold text-foreground mb-2">Page Not Found</h2>
                <p className="text-foreground-muted mb-4">The page you're looking for doesn't exist.</p>
                <Link to="/dashboard" className="btn-primary inline-block">
                    Go to Dashboard
                </Link>
            </div>
        </div>
    );
}
