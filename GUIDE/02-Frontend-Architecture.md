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
    -   It uses the `EditableField` sub-component to allow users to click and edit any value.
    -   It renders historical usage data using `Recharts` bar charts.
    -   It includes the "Edit Chart" functionality, which transforms charts into editable tables.
    -   It handles exporting data to CSV via the backend and submitting it via Formspree.

-   **`Settings.tsx`**: A modal component that allows the user to configure the AI provider (Gemini, Ollama, OpenAI) and enter their API keys. It handles testing the connection to an Ollama server and discovering available models.

-   **`HistoryList.tsx`**: A modal that displays a list of past analyses saved on the server. Users can load a previous result or clear the entire history.

## State Management

-   **Component State (`useState`)**: The primary method for managing state within components. `App.tsx` holds the global state and passes it down to child components as props.
-   **Local Storage**: The `useAiSettings` hook uses `localStorage` to persist the user's AI settings between browser sessions. If the server is not running, history also falls back to using `localStorage`.

## AI Interaction

-   **`aiService.ts`**: This module contains the core logic for communicating with the different AI backends.
    -   The `analyzeBill` function acts as a router, calling the appropriate function (`_callGemini`, `_callOllama`, `_callOpenAI`) based on the user's settings.
    -   Each function formats the image data and the prompt according to the specific API's requirements and handles the response.

-   **`src/prompt.ts`**: This file is crucial. It contains the `MASTER_SYSTEM_PROMPT` that instructs the AI on how to behave and the `RESPONSE_JSON_SCHEMA` which forces the AI to return data in a predictable, structured JSON format. This is key to the application's reliability.
