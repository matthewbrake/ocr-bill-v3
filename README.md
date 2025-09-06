# AI Bill Analyzer v2.0

## 1. Overview

The AI Bill Analyzer is a modern web application designed to simplify understanding and managing utility bills. Users can upload an image of a bill or use their device's camera to capture one. The application then leverages a powerful multimodal AI model to perform Optical Character Recognition (OCR) and data extraction, presenting the information in a structured, editable, and visual format.

This project is built with React, TypeScript, and Tailwind CSS, and supports multiple AI backends including Google Gemini, local Ollama models, and OpenAI.

## 2. Key Features

-   **Effortless Data Entry**: "Scan" bills using file upload or your device's camera to eliminate manual data entry.
-   **Clear Information**: Understand charges, usage, and key dates at a glance with an intuitive UI.
-   **Track Consumption**: Visualize historical usage data extracted from charts on the bill.
-   **Editable Charts & Low-Confidence Flags**: Correct any AI extraction errors directly. The app automatically highlights individual fields and chart bars the AI was uncertain about, prompting you to verify them.
-   **Persistent History & Logging**: A robust Node.js server saves all analysis results, bill images, and exported CSVs. All server actions and errors are recorded in log files for easy debugging.
-   **Data Portability**: Export extracted data to a server-side CSV folder for permanent records or submit it to a webhook via Formspree.
-   **Privacy & Control**: When not using the server, API keys and analysis history are stored locally in the browser.
-   **Flexible AI Backend**: Easily switch between Google Gemini, a local Ollama instance, or OpenAI.

## 3. Technology Stack

| Category   | Technology        | Justification                                                 |
| :--------- | :---------------- | :------------------------------------------------------------ |
| Frontend   | React + TypeScript| For a robust, type-safe, and component-based UI.              |
| Backend    | Node.js + Express | For an optional, simple, and effective persistent storage solution. |
| Styling    | Tailwind CSS      | For rapid, consistent, and responsive UI design.              |
| Logging    | Winston           | For robust, file-based server-side logging.                   |
| AI SDK     | `@google/genai`   | Official, modern SDK for the Google Gemini API.               |
| Charting   | Recharts          | Composable and easy-to-use charting library for React.        |

## 4. Getting Started

### 4.1. Prerequisites

-   You need a modern web browser like Chrome, Firefox, or Safari.
-   A code editor for viewing or modifying the files.
-   For the persistent history feature, you will need [Node.js](https://nodejs.org/) (v18 or newer).

### 4.2. Environment Configuration (Optional)

If you are using a development server like Vite or running the Node.js server, the application can automatically load configuration from an environment file.

1.  **Create an environment file**: In the root of the project, create a new file named `.env`.

2.  **Add Configuration**: You must add at least one AI provider API key to use the application.
    -   Open the `.env` file and add your keys. You can get a key from [Google AI Studio](https://aistudio.google.com/app/apikey).
    ```env
    # Required for Gemini provider
    VITE_GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"

    # Required for OpenAI provider (optional)
    VITE_OPENAI_API_KEY=""

    # Optional: For the "Submit Form" button (sends data to an email via Formspree)
    VITE_FORMSPREE_FORM_ID=""
    
    # Optional: To change the backend server port from the default of 4000
    PORT=4000
    ```

## 5. How to Run the Application

You can run the app in multiple ways, from a simple static page to a full production-ready server.

### 5.1. Method 1: Simple Static App (Browser-Only Mode)

1.  **Launch**: Open the `index.html` file directly in your browser from your file system.
2.  **Configure**: Click the **gear icon** (⚙️) in the top-right corner. You **must** enter your AI provider API keys manually in the settings panel.
3.  **Use**: Your analysis history will be stored in your browser's local storage and will be cleared if you clear your browser data.

### 5.2. Method 2: With Node.js Server (Recommended)

This method provides the complete experience, including server-side storage for your analysis history, uploaded bill images, exported CSVs, and server logs.

**Step 1: Install Dependencies (One-Time Setup)**
Open a terminal in the project's root directory and run this command.

```bash
npm install
```

**Step 2: Choose Your Mode**

**A) For Development (Easy & Recommended for testing)**
This mode uses `nodemon` to automatically restart the server when you make code changes.

```bash
npm run server
```

The server will start, and you will see a message like `AI Bill Analyzer server running at http://localhost:4000`. Keep this terminal open while you use the app. To run on a different port, either set the `PORT` variable in your `.env` file (see section 4.2) or run the command like this: `PORT=8080 npm run server`.

**B) For Production (Stable & Performant)**
This two-step process first compiles the server code into optimized JavaScript and then runs it.

```bash
# 1. Build the server code (only needed once, or after making changes)
npm run build

# 2. Start the production server
npm start
```
The same `server running...` message will appear. You can also specify the port here: `PORT=8080 npm start`.

**Step 3: Launch the App**
Open your web browser and navigate to the URL from the terminal (e.g., `http://localhost:4000` or the custom port you set).
    
**Step 4: Use the App**: Your analysis history will now be saved on the server in `history.json`. Images will be stored in the `uploads/` folder, exported CSVs in the `csv/` folder, and all server logs will be in the `logs/` folder.

## 6. How to Use the Application

1.  **Upload a Bill**: On the welcome screen, drag and drop a bill image (PNG, JPG, WEBP) into the upload area. Alternatively, click to select a file or use the camera.
2.  **Analyze**: After selecting an image, a preview is shown. Click **"✨ Analyze Bill"** to start.
3.  **Review and Edit**: The AI-extracted data is displayed. Fields with low-confidence scores are highlighted with a yellow icon. Any chart bars the AI was uncertain about are colored yellow. You can click any field to edit it, including the data in the usage charts via the "Edit Chart" button.
4.  **Export or Submit**: Click **"Save & Export CSV"** to save the data as a CSV file on the server. Or, click **"Submit Form"** to send it to a Formspree endpoint (if configured).
5.  **View History**: Click the **clock icon** (🕒) to view past analyses. You can load or clear results from this panel.