import React, { useState, useEffect, useCallback } from 'react';
import type { AnalysisRecord, BillData } from './types/index';
import { useAiSettings } from './hooks/useAiSettings';
import Header from './components/Header';
import Welcome from './components/Welcome';
import CameraCapture from './components/CameraCapture';
import BillDataDisplay from './components/BillDataDisplay';
import Loader from './components/Loader';
import ErrorMessage from './components/ErrorMessage';
import Settings from './components/Settings';
import HistoryList from './components/HistoryList';
import ErrorBoundary from './components/ErrorBoundary';
import { analyzeBill, sanitizeAiResponse } from './services/aiService';

const App: React.FC = () => {
    const { settings, setSettings, isConfigured } = useAiSettings();
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<BillData | null>(null);
    const [rawAiResponse, setRawAiResponse] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
    const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);

    const [history, setHistory] = useState<AnalysisRecord[]>([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Assuming the server is running on the same host
                const response = await fetch('/api/history');
                if (response.ok) {
                    const data = await response.json();
                    setHistory(data);
                } else {
                     // Fallback to localStorage if server is not running
                    const storedHistory = localStorage.getItem('billAnalyzerHistory');
                    if (storedHistory) setHistory(JSON.parse(storedHistory));
                }
            } catch (e) {
                console.warn("Server not found, falling back to localStorage for history.", e);
                 const storedHistory = localStorage.getItem('billAnalyzerHistory');
                 if (storedHistory) setHistory(JSON.parse(storedHistory));
            }
        };
        fetchHistory();
    }, []);

    const saveToHistory = async (result: BillData) => {
        if (!imageSrc) return;
        
        try { // Try saving to server first
            const response = await fetch('/api/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: result, imageSrc: imageSrc }),
            });
            if (!response.ok) throw new Error('Failed to save history to server');
            const newRecord = await response.json();
            setHistory(prev => [newRecord, ...prev]);
        } catch (e) {
            console.warn("Could not save to server, falling back to localStorage.", e);
            const newRecord: AnalysisRecord = {
                id: new Date().toISOString(),
                timestamp: new Date().toLocaleString(),
                data: result,
                imagePath: imageSrc, // Save base64 image directly for localStorage
            };
            const updatedHistory = [newRecord, ...history].slice(0, 50);
            setHistory(updatedHistory);
            localStorage.setItem('billAnalyzerHistory', JSON.stringify(updatedHistory));
        }
    };
    
    const loadFromHistory = (record: AnalysisRecord) => {
        setAnalysisResult(record.data);
        // Raw response is not stored in history, so we clear it
        setRawAiResponse(record.data); 
        setImageSrc(record.imagePath || null);
        setError(null);
        setIsLoading(false);
        setIsHistoryOpen(false);
    };

    const clearHistory = async () => {
        try { // Try clearing server history
             const response = await fetch('/api/history', { method: 'DELETE' });
             if (!response.ok) throw new Error('Failed to clear history on server');
        } catch(e) {
            console.warn("Could not clear server history, clearing localStorage.", e);
            localStorage.removeItem('billAnalyzerHistory');
        }
        setHistory([]);
        setIsHistoryOpen(false);
    };

    const handleAnalyze = async () => {
        if (!imageSrc) {
            setError("No image selected for analysis.");
            return;
        }
        if (!isConfigured) {
            setError("AI Provider is not configured. Please check your settings.");
            setIsSettingsOpen(true);
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        setRawAiResponse(null);

        try {
            const rawResult = await analyzeBill(imageSrc, settings);
            setRawAiResponse(rawResult); // Store the raw result for debugging
            const sanitizedResult = sanitizeAiResponse(rawResult);
            setAnalysisResult(sanitizedResult);
            await saveToHistory(sanitizedResult);
        } catch (err: any) {
            console.error("Analysis failed:", err);
            setError(err.message || "An unknown error occurred during analysis.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageSelected = (base64Image: string) => {
        setImageSrc(base64Image);
        setAnalysisResult(null);
        setError(null);
        setRawAiResponse(null);
        setIsCameraOpen(false);
    };

    const handleNewAnalysis = () => {
        setImageSrc(null);
        setAnalysisResult(null);
        setError(null);
        setRawAiResponse(null);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8">
            <Header 
                onSettingsClick={() => setIsSettingsOpen(true)}
                onHistoryClick={() => setIsHistoryOpen(true)}
            />
            <main className="w-full max-w-7xl mx-auto mt-8 flex-grow">
                 <ErrorBoundary>
                    {isLoading ? (
                        <Loader />
                    ) : error ? (
                        <ErrorMessage message={error} onClear={() => setError(null)} />
                    ) : analysisResult ? (
                        <BillDataDisplay 
                            result={analysisResult} 
                            rawAiResponse={rawAiResponse}
                            onNewAnalysis={handleNewAnalysis} 
                            imageSrc={imageSrc} 
                        />
                    ) : imageSrc ? (
                        <div className="flex flex-col items-center gap-6 p-6 bg-gray-800 rounded-xl shadow-lg">
                            <h2 className="text-2xl font-bold text-cyan-400">Image Preview</h2>
                            <img src={imageSrc} alt="Bill preview" className="max-w-full md:max-w-lg max-h-[60vh] rounded-lg object-contain" />
                            <div className="flex gap-4">
                                <button onClick={handleNewAnalysis} className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold transition-colors">
                                    Choose New Image
                                </button>
                                <button onClick={handleAnalyze} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-md font-semibold transition-colors">
                                    ✨ Analyze Bill
                                </button>
                            </div>
                        </div>
                    ) : (
                        <Welcome onImageSelected={handleImageSelected} onCameraClick={() => setIsCameraOpen(true)} />
                    )}
                 </ErrorBoundary>
            </main>
            {isSettingsOpen && <Settings onClose={() => setIsSettingsOpen(false)} settings={settings} onSave={setSettings} />}
            {isHistoryOpen && <HistoryList records={history} onLoad={loadFromHistory} onClear={clearHistory} onClose={() => setIsHistoryOpen(false)} />}
            {isCameraOpen && <CameraCapture onCapture={handleImageSelected} onClose={() => setIsCameraOpen(false)} />}
            <footer className="text-center py-4 text-gray-500 text-sm">
                <p>AI Bill Analyzer v2.0</p>
            </footer>
        </div>
    );
};

export default App;
