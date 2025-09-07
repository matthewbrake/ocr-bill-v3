# Guide 3: Backend API

This document describes the simple yet powerful Node.js backend server built with Express. The server provides persistence for the application's data.

## Core Technologies

-   **Node.js**: The JavaScript runtime environment for the server.
-   **Express**: A minimal and flexible Node.js web application framework.
-   **TypeScript**: Used for type safety in the backend code.
-   **Winston**: A robust logging library for recording server activity to files.
-   **ts-node & nodemon**: Development tools that allow running the TypeScript server directly and automatically restarting it when files change.

## Server Functionality

The primary purpose of the server is to:
1.  Serve the main `index.html` file and other static assets.
2.  Provide API endpoints for managing analysis history.
3.  Proxy requests to AI services (Gemini, Ollama) to handle them securely and avoid client-side CORS issues.
4.  Store uploaded bill images permanently.
5.  Save final, user-approved analysis data as CSV files.
6.  Log all important events and errors to files for easy debugging.
7.  Be configurable, for example, allowing the server port to be changed.

## File-Based "Database" and Storage

The server uses the local file system for storage, making it easy to set up and inspect.

-   `history.json`: A single JSON file that stores an array of all analysis records. This acts as the history database.
-   `uploads/`: A directory where the image of every analyzed bill is saved.
-   `csv/`: A directory where exported CSV files are stored.
-   `logs/`: A directory containing `server.log` and `error.log` for all server activity.

## API Endpoints

The server exposes the following RESTful API endpoints. All endpoints are prefixed with `/api`.

### 1. AI Analysis Proxies

-   **`POST /api/analyze/gemini`**: Proxies the analysis request to the Google Gemini API.
-   **`POST /api/analyze/ollama`**: Proxies the analysis request to the user-configured Ollama server.

### 2. History Management

-   **`GET /api/history`**: Retrieves the entire analysis history.
-   **`POST /api/history`**: Saves a new analysis record and its associated bill image.
-   **`DELETE /api/history`**: Deletes all history records and uploaded images.

### 3. CSV Export

-   **`POST /api/save-analysis`**: Generates and saves a CSV file from the final bill data.

### 4. Ollama Utilities

-   **`POST /api/ollama/test`**: Proxies a connection test to an Ollama server URL.
-   **`POST /api/ollama/tags`**: Proxies a request to get the list of available models from an Ollama server.

## Logging and Debugging

The server is configured with a powerful logger to help you understand what's happening.

-   **Log File Location**: All server activity is recorded in the `logs/` directory at the root of the project.
    -   `logs/server.log`: Contains all informational messages, such as which API endpoints are being hit.
    -   `logs/error.log`: Contains only error messages, making it easy to spot problems.

-   **Verbose Mode**: For more detailed troubleshooting, you can run the server in a high-verbosity "debug" mode. This will print much more information to your terminal and the log files.
    -   **Most importantly, it will log the entire JSON payload received from the AI model.** This is essential for debugging why an analysis might be failing or returning incomplete data.
    -   To use verbose mode, start the server with this command:
    ```bash
    npm run dev:verbose
    ```

## How to Run

The server is designed to be run as part of the complete development or production environment using the scripts in `package.json`.

1.  **Development**: `npm run dev`
    -   This is the **recommended command for development**.
    -   It uses `concurrently` to run three processes at once:
        -   The frontend `esbuild` compiler in watch mode.
        -   The backend `tsc` TypeScript compiler in watch mode.
        -   `nodemon`, which watches for compiled JavaScript files in the `dist/` folder and automatically restarts the server when they change.

2.  **Production**: `npm run build` followed by `npm start`
    -   This is the standard way to run in production. It compiles the server to optimized JavaScript and then runs the output file directly with Node.js.

The server runs on port 4000 by default, but this can be changed by setting a `PORT` environment variable (e.g., in a `.env` file).