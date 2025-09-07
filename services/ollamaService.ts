
export const testConnection = async (url: string): Promise<boolean> => {
    try {
        const response = await fetch('/api/ollama/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        });
        if (!response.ok) return false;
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error("Ollama connection test failed:", error);
        return false;
    }
};

interface OllamaModelDetails {
    name: string;
    details: {
        family: string;
        families: string[] | null;
    };
}

export const getMultimodalModels = async (url:string): Promise<string[]> => {
    try {
        const response = await fetch('/api/ollama/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch models via proxy: ${response.statusText}`);
        }
        
        const data: { models: OllamaModelDetails[] } = await response.json();
        
        // Return all models. It's better to let the user choose from a full list
        // than to risk filtering out a valid new multimodal model.
        if (!data.models) return [];
        return data.models.map(model => model.name);

    } catch (error) {
        console.error("Failed to get Ollama models:", error);
        return [];
    }
};