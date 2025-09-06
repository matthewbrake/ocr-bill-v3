import type { AiSettings } from './types/index';
import { AiProvider } from './types/index';

export const DEFAULT_AI_SETTINGS: AiSettings = {
    provider: AiProvider.GEMINI,
    gemini: {
        apiKey: '',
    },
    ollama: {
        serverUrl: 'http://localhost:11434',
        model: '',
    },
    openai: {
        apiKey: '',
    },
    verboseLogging: false,
};