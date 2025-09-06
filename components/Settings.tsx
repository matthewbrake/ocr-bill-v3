import React, { useState, useEffect } from 'react';
import type { AiSettings } from '../types/index';
import { AiProvider } from '../types/index';
import { XIcon, CheckCircleIcon, ExclamationCircleIcon } from './icons';
import { testConnection, getMultimodalModels } from '../services/ollamaService';

interface SettingsProps {
    onClose: () => void;
    settings: AiSettings;
    onSave: (newSettings: AiSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose, settings, onSave }) => {
    const [currentSettings, setCurrentSettings] = useState<AiSettings>(settings);
    const [activeTab, setActiveTab] = useState<AiProvider>(settings.provider);
    
    const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [ollamaModels, setOllamaModels] = useState<string[]>([]);

    useEffect(() => {
        setCurrentSettings(prev => ({...prev, provider: activeTab}));
    }, [activeTab]);

    const handleOllamaTest = async () => {
        setOllamaStatus('testing');
        setOllamaModels([]);
        const isConnected = await testConnection(currentSettings.ollama.serverUrl);
        if (isConnected) {
            setOllamaStatus('success');
            const models = await getMultimodalModels(currentSettings.ollama.serverUrl);
            setOllamaModels(models);
            if (models.length > 0 && !currentSettings.ollama.model) {
                 handleSettingChange(AiProvider.OLLAMA, 'model', models[0]);
            }
        } else {
            setOllamaStatus('error');
        }
    };
    
    const handleSave = () => {
        onSave(currentSettings);
        localStorage.setItem('isVerboseLoggingEnabled', String(currentSettings.verboseLogging));
        onClose();
    };

    const handleSettingChange = <T extends AiProvider, K extends keyof AiSettings[T]>(provider: T, key: K, value: AiSettings[T][K]) => {
        setCurrentSettings(prev => ({
            ...prev,
            [provider]: {
                ...prev[provider],
                [key]: value
            }
        }));
    };
    
    const TabButton: React.FC<{ provider: AiProvider; children: React.ReactNode }> = ({ provider, children }) => (
        <button
            onClick={() => setActiveTab(provider)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === provider ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
        >
            {children}
        </button>
    );

    return (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl border border-gray-700 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-semibold">AI Provider Settings</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="h-6 w-6" /></button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Select AI Provider</label>
                        <div className="flex space-x-2 bg-gray-900 p-1 rounded-lg">
                            <TabButton provider={AiProvider.GEMINI}>Google Gemini</TabButton>
                            <TabButton provider={AiProvider.OLLAMA}>Ollama</TabButton>
                            <TabButton provider={AiProvider.OPENAI}>OpenAI</TabButton>
                        </div>
                    </div>
                    
                    {activeTab === AiProvider.GEMINI && (
                        <div>
                            <label htmlFor="gemini-key" className="block text-sm font-medium text-gray-300 mb-1">Google AI Studio API Key</label>
                            <input id="gemini-key" type="password" value={currentSettings.gemini.apiKey} onChange={(e) => handleSettingChange(AiProvider.GEMINI, 'apiKey', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Enter your Gemini API Key"/>
                        </div>
                    )}

                    {activeTab === AiProvider.OLLAMA && (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="ollama-url" className="block text-sm font-medium text-gray-300 mb-1">Ollama Server URL</label>
                                <div className="flex gap-2">
                                    <input id="ollama-url" type="text" value={currentSettings.ollama.serverUrl} onChange={(e) => handleSettingChange(AiProvider.OLLAMA, 'serverUrl', e.target.value)} className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="http://localhost:11434"/>
                                    <button onClick={handleOllamaTest} disabled={ollamaStatus === 'testing'} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md text-sm font-semibold disabled:bg-indigo-400">
                                        {ollamaStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                                    </button>
                                </div>
                                {ollamaStatus === 'success' && <p className="mt-2 text-sm text-green-400 flex items-center gap-1"><CheckCircleIcon className="h-4 w-4"/>Connection successful!</p>}
                                {ollamaStatus === 'error' && <p className="mt-2 text-sm text-red-400 flex items-center gap-1"><ExclamationCircleIcon className="h-4 w-4"/>Connection failed. Is Ollama running?</p>}
                            </div>
                            {ollamaStatus === 'success' && (
                                <div>
                                    <label htmlFor="ollama-model" className="block text-sm font-medium text-gray-300 mb-1">Select or Enter Multimodal Model</label>
                                    {ollamaModels.length > 0 ? (
                                        <>
                                            <input
                                                id="ollama-model"
                                                type="text"
                                                list="ollama-models-list"
                                                value={currentSettings.ollama.model}
                                                onChange={(e) => handleSettingChange(AiProvider.OLLAMA, 'model', e.target.value)}
                                                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                placeholder="e.g., llava"
                                            />
                                            <datalist id="ollama-models-list">
                                                {ollamaModels.map(model => <option key={model} value={model} />)}
                                            </datalist>
                                        </>
                                    ) : (
                                        <>
                                            <input id="ollama-model" type="text" value={currentSettings.ollama.model} onChange={(e) => handleSettingChange(AiProvider.OLLAMA, 'model', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Type model name, e.g. llava"/>
                                            <p className="mt-2 text-sm text-yellow-400">No multimodal models detected automatically. Try pulling one (e.g., `ollama pull llava`) and type its name above.</p>
                                        </>
                                    )}
                                </div>
                            )}
                             {ollamaStatus !== 'success' && <p className="text-sm text-gray-400 mt-2">Click "Test Connection" to discover available models.</p>}
                        </div>
                    )}
                    
                    {activeTab === AiProvider.OPENAI && (
                         <div>
                            <label htmlFor="openai-key" className="block text-sm font-medium text-gray-300 mb-1">OpenAI API Key</label>
                            <input id="openai-key" type="password" value={currentSettings.openai.apiKey} onChange={(e) => handleSettingChange(AiProvider.OPENAI, 'apiKey', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Enter your OpenAI API Key (sk-...)"/>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-700 mt-auto">
                     <label className="flex items-center">
                        <input type="checkbox" checked={currentSettings.verboseLogging} onChange={(e) => setCurrentSettings(p => ({...p, verboseLogging: e.target.checked}))} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-cyan-600 focus:ring-cyan-500"/>
                        <span className="ml-2 text-sm text-gray-300">Enable verbose logging</span>
                    </label>
                </div>

                <div className="flex justify-end p-4 bg-gray-900/50">
                    <button onClick={handleSave} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg">Save Settings</button>
                </div>
            </div>
        </div>
    );
};

export default Settings;