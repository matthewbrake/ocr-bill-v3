import type { AiSettings } from './types/index';
import { AiProvider } from './types/index';

// FIX: Cast `import.meta` to `any` to access `env` and prevent TypeScript error.
const getEnvVar = (key: string) => (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env[key] : '';

export const DEFAULT_AI_SETTINGS: AiSettings = {
    provider: AiProvider.GEMINI,
    gemini: {
        apiKey: getEnvVar('VITE_GEMINI_API_KEY') || '',
    },
    ollama: {
        serverUrl: 'http://localhost:11434',
        model: '',
    },
    openai: {
        apiKey: getEnvVar('VITE_OPENAI_API_KEY') || '',
    },
    verboseLogging: false,
};
