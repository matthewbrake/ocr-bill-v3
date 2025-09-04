# AI Bill Analyzer v2.0

## 1. Overview

The AI Bill Analyzer is a modern web application designed to simplify understanding and managing utility bills. Users can upload an image of a bill or use their device's camera to capture one. The application then leverages a powerful multimodal AI model to perform Optical Character Recognition (OCR) and data extraction, presenting the information in a structured, editable, and visual format.

This project is built with React, TypeScript, and Tailwind CSS, and supports multiple AI backends including Google Gemini, local Ollama models, and OpenAI.

## 2. Key Features

-   **Effortless Data Entry**: "Scan" bills using file upload or your device's camera to eliminate manual data entry.
-   **Clear Information**: Understand charges, usage, and key dates at a glance with an intuitive UI.
-   **Track Consumption**: Visualize historical usage data extracted from charts on the bill.
-   **Data Portability**: Export extracted data to CSV for personal records or submit it to a webhook via Formspree.
-   **Privacy & Control**: API keys and analysis history are stored locally in the browser, never on a server.
-   **Flexible AI Backend**: Easily switch between Google Gemini, a local Ollama instance, or OpenAI.
-   **Interactive & High-Confidence Data**: All extracted fields are editable. Low-confidence extractions are automatically flagged for user review.

## 3. Technology Stack

| Category   | Technology        | Justification                                                 |
| :--------- | :---------------- | :------------------------------------------------------------ |
| Frontend   | React + TypeScript| For a robust, type-safe, and component-based UI.              |
| Styling    | Tailwind CSS      | For rapid, consistent, and responsive UI design.              |
| AI SDK     | `@google/genai`   | Official, modern SDK for the Google Gemini API.               |
| Charting   | Recharts          | Composable and easy-to-use charting library for React.        |
| Build Tool | Vite (via importmap) | App is structured for a modern, fast development experience.  |

## 4. Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### 4.1. Prerequisites

-   You need a modern web browser like Chrome, Firefox, or Safari.
-   A code editor for viewing or modifying the files.

### 4.2. Environment Configuration

The application requires API keys to communicate with AI services.

1.  **Create an environment file**: In the root of the project, create a new file named `.env`.

2.  **Copy contents**: Copy the contents from `.env.example` into your new `.env` file.

3.  **Add API Key**: You must add your Google AI Studio API key to use the application.
    -   Open the `.env` file.
    -   Find the line `VITE_GEMINI_API_KEY=""`.
    -   Paste your key between the quotes. You can get a key from [Google AI Studio](https://aistudio.google.com/app/apikey).

    Your `.env` file should look like this:
    ```env
    # Required for Gemini provider
    VITE_GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"

    # Required for OpenAI provider (optional)
    VITE_OPENAI_API_KEY=""

    # Optional: For the "Submit Form" button
    VITE_FORMSPREE_FORM_ID=""
    ```

## 5. How to Use the Application

1.  **Launch the App**: Open the `index.html` file in your browser.
2.  **Configure Settings**:
    -   Click the **gear icon** (⚙️) in the top-right corner to open Settings.
    -   The app reads the API key from your `.env` file automatically. If you need to enter it manually, you can do so here.
    -   Save your settings.
3.  **Upload a Bill**:
    -   On the welcome screen, drag and drop a bill image (PNG, JPG, WEBP) into the upload area.
    -   Alternatively, click the upload area to select a file or click "Use Camera" to scan a bill directly.
4.  **Analyze**:
    -   After selecting an image, a preview will be shown.
    -   Click the **"✨ Analyze Bill"** button to start the process.
5.  **Review and Edit**:
    -   The AI-extracted data will be displayed in an editable form.
    -   Fields with low-confidence scores will be highlighted with a yellow warning icon.
    -   You can click any field to correct or update the information.
6.  **Export or Submit**:
    -   Click **"Download CSV"** to save the data to your computer.
    -   If configured, click **"Submit Form"** to send the data to a Formspree endpoint.
7.  **View History**:
    -   Click the **clock icon** (🕒) to view a list of your past analyses. You can load or clear previous results from this panel.
