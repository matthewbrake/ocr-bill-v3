# Guide 5: Application Flow and User Journey

This guide provides a complete walkthrough of the AI Bill Analyzer's functionality from the user's perspective, explaining what happens at each step and how the different components work together.

## 1. The Welcome Screen

-   **What the user sees**: Upon launching the application, the user is greeted with a clean, welcoming interface (`Welcome.tsx`). The main call to action is a large drag-and-drop area for file uploads (`FileUpload.tsx`). Below this, there is an alternative option to use the device's camera.
-   **Logic**:
    -   The user can either click the upload area to open a file dialog or drag an image file (PNG, JPG, WEBP) directly onto it.
    -   If the "Use Camera" button is clicked, the `CameraCapture.tsx` component is displayed as a full-screen modal.
-   **Outcome**: Once an image is selected or captured, it's converted into a base64-encoded string. The main `App.tsx` component's state is updated, `imageSrc` is set, and the UI transitions to the Image Preview stage.

## 2. Image Preview & Analysis Trigger

-   **What the user sees**: The UI now shows a preview of the selected image, centered on the screen. Two buttons are presented: "Choose New Image" and "✨ Analyze Bill".
-   **Logic**:
    -   "Choose New Image" simply resets the application state, taking the user back to the Welcome Screen.
    -   Clicking "Analyze Bill" triggers the `handleAnalyze` function in `App.tsx`.
-   **Outcome**: The `isLoading` state is set to `true`, and the UI transitions to the Loader view.

## 3. The Analysis Process

-   **What the user sees**: A loading spinner is displayed along with a series of messages (`Loader.tsx`) that describe the steps the AI is taking (e.g., "Performing OCR...", "Extracting key-value pairs..."). This provides feedback and reassures the user that the application is working.
-   **Logic**:
    1.  The `analyzeBill` function in `services/aiService.ts` is called with the image data and current AI settings.
    2.  This function acts as a router, sending the request to the appropriate backend endpoint based on the selected provider (e.g., `/api/analyze/gemini` or `/api/analyze/ollama`).
    3.  The backend server receives the request, constructs the final prompt using the `MASTER_SYSTEM_PROMPT` and the image, and sends it to the actual AI service (Gemini, Ollama, etc.).
    4.  The AI processes the image and prompt, returning a structured JSON object.
    5.  The server proxies this JSON response back to the frontend.
    6.  Crucially, the frontend then passes this raw JSON through the `sanitizeAiResponse` function. This function checks for any missing fields required by the UI and adds them with safe, default values. This step prevents the app from crashing if the AI response is incomplete.
-   **Outcome**: The sanitized JSON data is stored in the `analysisResult` state. A new record is also saved to the server via a `POST` request to `/api/history`. The `isLoading` state is set to `false`, and the UI transitions to the Bill Data Display.

## 4. The Results Display

-   **What the user sees**: This is the main results screen (`BillDataDisplay.tsx`), divided into two main columns.
    -   **Left Column**: A thumbnail of the bill image and key "Account Information" and "Payment Summary" fields.
    -   **Right Column**: Visual "Usage Charts" and a table of "Line Items".
-   **Logic & Features**:
    -   **Confidence Scores**: Any field or chart bar where the AI reported a low confidence score is automatically flagged with a yellow warning icon or color. This immediately draws the user's attention to data that should be verified.
    -   **Editable Fields**: Every single data point (account number, due date, total charges) is an `EditableField` component. Clicking the pencil icon next to a value turns it into an input field, allowing the user to make corrections. Changes are saved to the component's state instantly.
    -   **Editable Charts**: An "Edit Chart" button above each usage chart toggles it into an editable table. This allows the user to correct the month labels or the usage values for each year with precision. When done, the chart re-renders with the corrected data.
    -   **Save & Export**: The "Save & Export CSV" button sends the final, user-corrected data to the `/api/save-analysis` endpoint on the server, which generates and saves a CSV file in the `csv/` directory.
    -   **Submit Form**: If a Formspree ID is configured, this button submits the final data to that endpoint, allowing for integrations like sending the results to an email address.

## 5. History and Settings

-   **What the user sees**: The header contains icons for History and Settings. Clicking them opens their respective modal windows.
-   **History (`HistoryList.tsx`)**:
    -   Displays a list of all past analyses, fetched from `/api/history`.
    -   Each item shows the account number, analysis date, and total amount.
    -   Clicking an item loads that historical data back into the main `BillDataDisplay` screen.
    -   A "Clear History" button sends a `DELETE` request to `/api/history` to wipe all records and uploaded images.
-   **Settings (`Settings.tsx`)**:
    -   Allows the user to switch between AI providers (Gemini, Ollama, OpenAI).
    -   Provides fields for entering the Ollama server URL and OpenAI API key.
    -   For Ollama, a "Test Connection" button verifies connectivity and automatically fetches a list of available models to populate the model selection dropdown.
    -   Settings are saved to the browser's `localStorage` and persist between sessions.