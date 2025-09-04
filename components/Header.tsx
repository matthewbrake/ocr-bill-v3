
import React from 'react';
import { CogIcon, HistoryIcon, DocumentScanIcon } from './icons';

interface HeaderProps {
    onSettingsClick: () => void;
    onHistoryClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSettingsClick, onHistoryClick }) => {
    return (
        <header className="w-full max-w-7xl mx-auto flex justify-between items-center py-4 px-2">
            <div className="flex items-center gap-3">
                <DocumentScanIcon className="h-8 w-8 text-cyan-400" />
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    AI Bill Analyzer
                </h1>
            </div>
            <nav className="flex items-center gap-2 sm:gap-4">
                <button
                    onClick={onHistoryClick}
                    className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                    aria-label="View history"
                >
                    <HistoryIcon className="h-6 w-6" />
                </button>
                <button
                    onClick={onSettingsClick}
                    className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                    aria-label="Open settings"
                >
                    <CogIcon className="h-6 w-6" />
                </button>
            </nav>
        </header>
    );
};

export default Header;
