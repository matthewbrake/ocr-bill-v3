# Guide 4: AI Integration

The core of the AI Bill Analyzer is its ability to use multimodal AI models to understand and extract data from images. This guide explains how that integration works.

## The Master Prompt (`src/prompt.ts`)

The entire AI interaction is governed by a master prompt and a response schema.

### `MASTER_SYSTEM_PROMPT`

This is a detailed set of instructions given to the AI model. It defines its persona ("an expert OCR system"), its task, and key constraints. Crucially, it instructs the AI to:
-   Analyze the bill image, even if it's low quality.
-   Return the output *only* as a raw JSON object, with no extra text.
-   Estimate values from charts if exact numbers aren't available.
-   Provide a confidence score for each extracted piece of data. This is a key instruction, as these scores are used by the frontend to highlight potentially incorrect data for the user to review and correct.

### `RESPONSE_JSON_SCHEMA`

This is a critical part of the prompt, primarily for the Gemini provider. It defines the exact structure of the JSON object that the AI *must* return. Modern AI models like Google Gemini can be forced to adhere to a specific JSON schema. This provides several benefits:
-   **Reliability**: The application receives data in a predictable format, preventing crashes due to unexpected AI responses.
-   **Type Safety**: The structure matches the TypeScript types defined in `types/index.ts`, ensuring consistency between the AI and the frontend code.
-   **Data Completeness**: By marking fields as `required`, we ensure the AI provides all critical information.

## Supported AI Providers (`services/aiService.ts`)

The application is designed to be flexible, supporting multiple AI providers. The `analyzeBill` function in `aiService.ts` acts as a central hub, delegating the request to the appropriate backend based on user settings.

### 1. Google Gemini

-   **Model**: `gemini-2.5-flash`
-   **SDK**: Uses the official `@google/genai` SDK.
-   **Method**: It sends the image data and the `systemInstruction` (our master prompt) and `responseSchema` directly to the API via the backend proxy. Gemini's native support for JSON schema mode makes it highly reliable for this task.

### 2. Ollama (Local Models)

-   **Model**: User-configurable (e.g., `llava`, `moondream`).
-   **SDK**: Uses direct `fetch` calls to the Ollama server's REST API (proxied through the backend).
-   **Method**: It sends the master prompt as a system message and the image as part of the user message. It requests JSON output by setting `format: "json"`.
-   **Discovery**: The `ollamaService.ts` module includes functions to test the connection to the user's Ollama server and fetch a list of available models, which are then shown in the settings panel.

### 3. OpenAI

-   **Model**: `gpt-4o`
-   **SDK**: Uses direct `fetch` calls to the OpenAI REST API.
-   **Method**: Similar to Ollama, it sends the master prompt as a system message. It leverages OpenAI's "JSON Mode" by setting `response_format: { type: "json_object" }` to ensure a valid JSON response.

## Handling Inconsistent AI Responses

A major challenge with AI is that models, especially local ones, may not always perfectly follow instructions. They might omit a field (like `lineItems`) or return a value in the wrong format.

The application is now built to be **highly resilient** to this:
-   **Backend Validation**: The server includes `try-catch` blocks to ensure that if an AI model fails to return valid JSON, it sends a clean error message to the frontend instead of crashing.
-   **Frontend Sanitization**: As described in the Frontend Architecture guide, the `sanitizeAiResponse` function acts as a final line of defense. It guarantees that the data structure is always complete before it reaches the UI components, preventing rendering errors and blank screens.