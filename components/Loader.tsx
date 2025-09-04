
import React, { useState, useEffect } from 'react';

const messages = [
    "Initializing AI model...",
    "Analyzing image layout...",
    "Performing Optical Character Recognition (OCR)...",
    "Extracting key-value pairs...",
    "Parsing table and chart data...",
    "Cross-referencing values...",
    "Finalizing JSON output...",
    "Almost there..."
];

const Loader: React.FC = () => {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex(prevIndex => (prevIndex + 1) % messages.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center text-center p-8 space-y-6 bg-gray-800/50 rounded-xl">
            <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <h2 className="text-2xl font-bold text-white">Analyzing Your Bill...</h2>
            <p className="text-lg text-gray-300 min-h-[2.5em]">{messages[messageIndex]}</p>
        </div>
    );
};

export default Loader;
