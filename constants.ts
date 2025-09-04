import type { AiSettings } from './types/index';
import { AiProvider } from './types/index';

export const DEFAULT_AI_SETTINGS: AiSettings = {
    provider: AiProvider.GEMINI,
    gemini: {
        // FIX: Add type assertion to work around TypeScript error with `import.meta.env`.
        apiKey: (import.meta as any).env?.VITE_GEMINI_API_KEY || '',
    },
    ollama: {
        serverUrl: 'http://localhost:11434',
        model: '',
    },
    openai: {
        // FIX: Add type assertion to work around TypeScript error with `import.meta.env`.
        apiKey: (import.meta as any).env?.VITE_OPENAI_API_KEY || '',
    },
    verboseLogging: false,
};
