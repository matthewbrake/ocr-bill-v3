
import React from 'react';
import type { AnalysisRecord } from '../types/index';
import { XIcon, TrashIcon } from './icons';

interface HistoryListProps {
    records: AnalysisRecord[];
    onLoad: (record: AnalysisRecord) => void;
    onClear: () => void;
    onClose: () => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ records, onLoad, onClear, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md border border-gray-700 max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-semibold">Analysis History</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="h-6 w-6" /></button>
                </div>

                <div className="flex-grow overflow-y-auto p-4">
                    {records.length > 0 ? (
                        <ul className="space-y-3">
                            {records.map(record => (
                                <li key={record.id} onClick={() => onLoad(record)} className="p-4 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                                    <p className="font-semibold">Account: {record.data.accountNumber}</p>
                                    <p className="text-sm text-gray-400">Analyzed on {record.timestamp}</p>
                                    <p className="text-lg font-bold mt-1 text-cyan-400">${record.data.totalCurrentCharges.toFixed(2)}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            <p>No history yet.</p>
                            <p className="text-sm">Your completed analyses will appear here.</p>
                        </div>
                    )}
                </div>

                {records.length > 0 && (
                    <div className="p-4 border-t border-gray-700">
                        <button onClick={onClear} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-800/80 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors">
                            <TrashIcon className="h-5 w-5" />
                            Clear History
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryList;
