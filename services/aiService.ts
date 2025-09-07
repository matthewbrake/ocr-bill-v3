import type { AiSettings, BillData } from '../types/index';
import { AiProvider } from '../types/index';
import { MASTER_SYSTEM_PROMPT } from '../src/prompt';

const logVerbose = (message: string, data: any) => {
    try {
        const isVerbose = localStorage.getItem('isVerboseLoggingEnabled') === 'true';
        if (isVerbose) {
            console.log(message, data);
        }
    } catch (e) {
        // ignore
    }
};

function cleanBase64(base64: string): string {
    return base64.split(',')[1];
}


async function _callGemini(imageData: string, settings: AiSettings): Promise<BillData> {
    logVerbose('Calling Gemini via backend proxy...', {});
    const response = await fetch('/api/analyze/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData: imageData }),
    });

    if (!response.ok) {
        const errorBody = await response.json();
        logVerbose('Gemini Proxy Error Response:', errorBody);
        throw new Error(errorBody.message || `Gemini analysis failed: ${response.statusText}`);
    }

    const result = await response.json();
    logVerbose('Gemini Proxy Response:', result);
    return result;
}

async function _callOllama(imageData: string, settings: AiSettings): Promise<BillData> {
    const { serverUrl, model } = settings.ollama;
    if (!serverUrl || !model) {
        throw new Error("Ollama server URL or model is not configured.");
    }

    const payload = {
        model: model,
        format: "json",
        stream: false,
        messages: [
            { role: "system", content: MASTER_SYSTEM_PROMPT },
            {
                role: "user",
                content: "Analyze this utility bill.",
                images: [cleanBase64(imageData)]
            }
        ]
    };

    logVerbose('Ollama Request:', { url: `${serverUrl}/api/chat`, payload });
    const response = await fetch(`${serverUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        logVerbose('Ollama Error Response:', errorBody);
        throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    logVerbose('Ollama Response:', responseData);

    try {
        return JSON.parse(responseData.message.content);
    } catch (e) {
        console.error("Failed to parse Ollama JSON response:", responseData.message.content);
        throw new Error("AI returned an invalid JSON format.");
    }
}


async function _callOpenAI(imageData: string, settings: AiSettings): Promise<BillData> {
    if (!settings.openai.apiKey) {
        throw new Error("OpenAI API key is not set.");
    }

    const payload = {
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: MASTER_SYSTEM_PROMPT },
            {
                role: "user",
                content: [
                    { type: "text", text: "Analyze this utility bill image and provide the specified JSON output." },
                    { type: "image_url", image_url: { url: imageData } }
                ]
            }
        ]
    };
    logVerbose('OpenAI Request:', payload);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.openai.apiKey}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.json();
        logVerbose('OpenAI Error Response:', errorBody);
        throw new Error(`OpenAI request failed: ${errorBody.error?.message || response.statusText}`);
    }
    
    const responseData = await response.json();
    logVerbose('OpenAI Response:', responseData);
    
    try {
        return JSON.parse(responseData.choices[0].message.content);
    } catch (e) {
        console.error("Failed to parse OpenAI JSON response:", responseData.choices[0].message.content);
        throw new Error("AI returned an invalid JSON format.");
    }
}


export const analyzeBill = async (imageData: string, settings: AiSettings): Promise<BillData> => {
    switch (settings.provider) {
        case AiProvider.GEMINI:
            return _callGemini(imageData, settings);
        case AiProvider.OLLAMA:
            return _callOllama(imageData, settings);
        case AiProvider.OPENAI:
            return _callOpenAI(imageData, settings);
        default:
            throw new Error("Invalid AI provider selected.");
    }
};