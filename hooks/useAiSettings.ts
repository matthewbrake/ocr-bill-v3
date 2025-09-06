

import { useState, useEffect, useMemo } from 'react';
import type { AiSettings } from '../types/index';
import { DEFAULT_AI_SETTINGS } from '../constants';
import { AiProvider } from '../types/index';


export const useAiSettings = () => {
    const [settings, setSettings] = useState<AiSettings>(() => {
        try {
            const storedSettings = localStorage.getItem('aiBillAnalyzerSettings');
            if (storedSettings) {
                const parsed = JSON.parse(storedSettings);
                // Merge stored settings with defaults to include any new fields
                return {
                    ...DEFAULT_AI_SETTINGS,
                    ...parsed,
                    gemini: { ...DEFAULT_AI_SETTINGS.gemini, ...parsed.gemini },
                    ollama: { ...DEFAULT_AI_SETTINGS.ollama, ...parsed.ollama },
                    openai: { ...DEFAULT_AI_SETTINGS.openai, ...parsed.openai },
                };
            }
        } catch (error) {
            console.error('Failed to parse settings from localStorage', error);
        }
        return DEFAULT_AI_SETTINGS;
    });

    useEffect(() => {
        try {
            localStorage.setItem('aiBillAnalyzerSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save settings to localStorage', error);
        }
    }, [settings]);

    const isConfigured = useMemo(() => {
        switch (settings.provider) {
            case AiProvider.GEMINI:
                return !!settings.gemini.apiKey;
            case AiProvider.OLLAMA:
                return !!settings.ollama.serverUrl && !!settings.ollama.model;
            case AiProvider.OPENAI:
                return !!settings.openai.apiKey;
            default:
                return false;
        }
    }, [settings]);

    return { settings, setSettings, isConfigured };
};