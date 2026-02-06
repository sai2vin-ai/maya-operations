import { useState, useRef, useEffect, memo } from 'react';

interface LazyImageProps {
    src: string;
    alt: string;
    className?: string;
    placeholder?: string;
    fallback?: string;
    onLoad?: () => void;
    onError?: () => void;
}

/**
 * Lazy loading image component with placeholder and error handling.
 * Uses IntersectionObserver for efficient lazy loading.
 */
function LazyImageInner({
    src,
    alt,
    className = '',
    placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23334155" width="100" height="100"/%3E%3C/svg%3E',
    fallback = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23475569" width="100" height="100"/%3E%3Ctext x="50" y="55" text-anchor="middle" fill="%2394a3b8" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E',
    onLoad,
    onError,
}: LazyImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
        if (!imgRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: '50px 0px',
                threshold: 0.01,
            }
        );

        observer.observe(imgRef.current);

        return () => observer.disconnect();
    }, []);

    const handleLoad = () => {
        setIsLoaded(true);
        onLoad?.();
    };

    const handleError = () => {
        setHasError(true);
        onError?.();
    };

    const currentSrc = hasError ? fallback : isInView ? src : placeholder;

    return (
        <img
            ref={imgRef}
            src={currentSrc}
            alt={alt}
            className={`transition-opacity duration-300 ${
                isLoaded ? 'opacity-100' : 'opacity-50'
            } ${className}`}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
            decoding="async"
        />
    );
}

export const LazyImage = memo(LazyImageInner);

/**
 * Background image with lazy loading
 */
interface LazyBackgroundProps {
    src: string;
    className?: string;
    children?: React.ReactNode;
}

function LazyBackgroundInner({ src, className = '', children }: LazyBackgroundProps) {
    const [isInView, setIsInView] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: '50px 0px',
                threshold: 0.01,
            }
        );

        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, []);

    // Preload image when in view
    useEffect(() => {
        if (!isInView) return;

        const img = new Image();
        img.onload = () => setIsLoaded(true);
        img.src = src;
    }, [isInView, src]);

    return (
        <div
            ref={containerRef}
            className={`transition-opacity duration-300 ${
                isLoaded ? 'opacity-100' : 'opacity-50'
            } ${className}`}
            style={isLoaded ? { backgroundImage: `url(${src})` } : undefined}
        >
            {children}
        </div>
    );
}

export const LazyBackground = memo(LazyBackgroundInner);
