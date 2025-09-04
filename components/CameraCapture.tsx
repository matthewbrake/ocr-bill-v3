
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { CameraIcon, XIcon } from './icons';

interface CameraCaptureProps {
    onCapture: (base64Image: string) => void;
    onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
                setStream(mediaStream);
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("Could not access camera. Please ensure permissions are granted and try again.");
            }
        };

        getCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCapture = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                onCapture(dataUrl);
            }
        }
    }, [onCapture]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-4xl h-[80vh] bg-gray-900 rounded-lg overflow-hidden shadow-2xl flex flex-col">
                <button onClick={onClose} className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/80 z-20 text-white">
                    <XIcon className="h-6 w-6" />
                </button>
                
                {error ? (
                     <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                        <p className="text-red-400 font-semibold">{error}</p>
                        <button onClick={onClose} className="mt-4 px-4 py-2 bg-cyan-600 rounded-md">Close</button>
                    </div>
                ) : (
                    <div className="relative w-full h-full flex-grow">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 pointer-events-none">
                            <div className="absolute inset-[10%] border-4 border-white border-dashed rounded-lg opacity-75"></div>
                        </div>
                        <p className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded-md text-sm">
                            Position the bill inside the frame
                        </p>
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                )}


                <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/30 flex justify-center">
                    <button 
                        onClick={handleCapture}
                        disabled={!!error}
                        className="w-20 h-20 rounded-full bg-white flex items-center justify-center ring-4 ring-white/30 hover:ring-white/60 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <CameraIcon className="w-10 h-10 text-gray-800" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CameraCapture;
