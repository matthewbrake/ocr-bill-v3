
export const testConnection = async (url: string): Promise<boolean> => {
    try {
        const response = await fetch(url);
        return response.ok;
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

export const getMultimodalModels = async (url: string): Promise<string[]> => {
    try {
        const response = await fetch(`${url}/api/tags`);
        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.statusText}`);
        }
        const data: { models: OllamaModelDetails[] } = await response.json();
        
        // Filter for models that are likely multimodal
        const multimodalModels = data.models.filter(model => {
            const family = model.details.family?.toLowerCase();
            const families = model.details.families?.map(f => f.toLowerCase()) || [];
            
            // Heuristics for identifying multimodal models like llava, moondream, etc.
            return family.includes('clip') || families.includes('clip') || model.name.includes('llava') || model.name.includes('moondream');
        });

        return multimodalModels.map(model => model.name);
    } catch (error) {
        console.error("Failed to get Ollama multimodal models:", error);
        return [];
    }
};
