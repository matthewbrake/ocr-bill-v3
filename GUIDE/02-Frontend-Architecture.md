# Guide 2: Frontend Architecture

This document outlines the structure and key components of the AI Bill Analyzer's frontend, built with React and TypeScript.

## Core Technologies

-   **React**: A component-based library for building user interfaces.
-   **TypeScript**: Adds static typing to JavaScript for improved code quality and maintainability.
-   **Tailwind CSS**: A utility-first CSS framework for rapid and responsive styling.
-   **Recharts**: A charting library for creating the data visualizations.

## Directory Structure

The frontend source code is organized into several key directories:

-   `components/`: Contains all reusable React components.
-   `hooks/`: Custom React hooks for managing state and logic (e.g., `useAiSettings`).
-   `services/`: Modules for handling external API calls (e.g., `aiService`, `ollamaService`).
-   `types/`: TypeScript type definitions and interfaces.
-   `src/`: Contains the master AI prompt and JSON schema.

## Key Components

-   **`App.tsx`**: The main application component. It manages the overall application state, including the current image, analysis results, errors, loading state, and history. It orchestrates the rendering of all other components.

-   **`Welcome.tsx`**: The initial screen the user sees. It provides options to upload a file (`FileUpload.tsx`) or use the camera (`CameraCapture.tsx`).

-   **`BillDataDisplay.tsx`**: This is the most complex component. It renders the results of the AI analysis.
    -   It displays all extracted data points (account name, due date, etc.).
    -   It uses the `EditableField` sub-component to allow users to click and edit any value. Any field with a low confidence score from the AI is automatically flagged with a yellow warning icon.
    -   It renders historical usage data using `Recharts` bar charts. Chart bars corresponding to data points with low confidence scores are colored yellow to prompt user review.
    -   It includes an "Edit Chart" button, which transforms the chart into an editable table, allowing for precise corrections.
    -   It handles exporting data to a CSV file (via the backend) and submitting the data to a web service like Formspree (if a `VITE_FORMSPREE_FORM_ID` is provided).

-   **`Settings.tsx`**: A modal component that allows the user to configure the AI provider (Gemini, Ollama, OpenAI) and enter their API keys. It handles testing the connection to an Ollama server and discovering available models.

-   **`HistoryList.tsx`**: A modal that displays a list of past analyses saved on the server. Users can load a previous result or clear the entire history.

## State Management

-   **Component State (`useState`)**: The primary method for managing state within components. `App.tsx` holds the global state and passes it down to child components as props.
-   **Local Storage**: The `useAiSettings` hook uses `localStorage` to persist the user's AI settings between browser sessions. If the server is not running, history also falls back to using `localStorage`.

## Error Handling & Data Sanitization

The application is designed to be resilient against inconsistent AI responses.

-   **`services/aiService.ts`**: Contains a `sanitizeAiResponse` function. This is a critical step that runs after an AI response is received. It checks the raw JSON data for any missing required fields and populates them with safe, default values (e.g., an empty string or an empty array). This prevents the UI from crashing if an AI model forgets to include a field like `lineItems`.

-   **`components/ErrorBoundary.tsx`**: The entire application is wrapped in a React Error Boundary. This is a failsafe component that catches any unhandled JavaScript errors that occur during rendering. Instead of showing a blank white screen, it displays a user-friendly error message, preserving the application's state and allowing for easier debugging.

## AI Interaction

-   **`aiService.ts`**: This module contains the core logic for communicating with the different AI backends.
    -   The `analyzeBill` function acts as a router, calling the appropriate function (`_callGemini`, `_callOllama`, `_callOpenAI`) based on the user's settings.
    -   Each function formats the image data and the prompt according to the specific API's requirements and handles the response.

-   **`src/prompt.ts`**: This file is crucial. It contains the `MASTER_SYSTEM_PROMPT` that instructs the AI on how to behave and the `RESPONSE_JSON_SCHEMA` which forces the AI to return data in a predictable, structured JSON format. This is key to the application's reliability.