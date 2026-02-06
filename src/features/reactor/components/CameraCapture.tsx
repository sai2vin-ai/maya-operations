import { useState, useRef, useCallback } from 'react';

interface CameraCaptureProps {
    onPhotoCaptured: (blob: Blob, dataUrl: string) => void;
    capturedPhotos: string[];
    onClear: () => void;
}

export function CameraCapture({ onPhotoCaptured, capturedPhotos, onClear }: CameraCaptureProps) {
    const [cameraActive, setCameraActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startCamera = useCallback(async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: 1280, height: 720 }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setCameraActive(true);
        } catch (err) {
            setError('Could not access camera: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    }, []);

    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
            if (blob) {
                onPhotoCaptured(blob, canvas.toDataURL('image/jpeg'));
            }
        }, 'image/jpeg', 0.8);

        stopCamera();
    }, [onPhotoCaptured, stopCamera]);

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
                Photo Required {capturedPhotos.length > 0 && `(${capturedPhotos.length} captured)`}
            </label>

            {error && (
                <div className="text-sm text-red-400 mb-2">{error}</div>
            )}

            <div className="aspect-video bg-surface-secondary rounded-xl overflow-hidden max-w-md relative">
                {cameraActive && (
                    <>
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                            <button onClick={capturePhoto} className="w-12 h-12 bg-white rounded-full shadow-lg">
                                <div className="w-8 h-8 bg-red-500 rounded-full mx-auto"></div>
                            </button>
                        </div>
                    </>
                )}
                {capturedPhotos.length > 0 && !cameraActive && (
                    <img src={capturedPhotos[capturedPhotos.length - 1]} alt="Captured" className="w-full h-full object-cover" />
                )}
                {!cameraActive && capturedPhotos.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                        <button onClick={startCamera} className="btn-secondary">Open Camera</button>
                    </div>
                )}
            </div>

            {capturedPhotos.length > 0 && (
                <div className="flex gap-2 mt-2">
                    <button onClick={startCamera} className="btn-secondary text-sm">Add Another</button>
                    <button onClick={onClear} className="text-sm text-red-400 hover:text-red-300">Clear All</button>
                </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
