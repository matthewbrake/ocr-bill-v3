# Guide 3: Backend API

This document describes the simple yet powerful Node.js backend server built with Express. The server provides persistence for the application's data.

## Core Technologies

-   **Node.js**: The JavaScript runtime environment for the server.
-   **Express**: A minimal and flexible Node.js web application framework.
-   **TypeScript**: Used for type safety in the backend code.
-   **ts-node & nodemon**: Development tools that allow running the TypeScript server directly and automatically restarting it when files change.

## Server Functionality

The primary purpose of the server is to:
1.  Serve the main `index.html` file and other static assets.
2.  Provide API endpoints for managing analysis history.
3.  Store uploaded bill images permanently.
4.  Save final, user-approved analysis data as CSV files.

## File-Based "Database"

The server uses the local file system for storage, making it easy to set up and inspect.

-   `history.json`: A single JSON file that stores an array of all analysis records. This acts as the history database.
-   `uploads/`: A directory where the image of every analyzed bill is saved.
-   `csv/`: A directory where exported CSV files are stored.

## API Endpoints

The server exposes the following RESTful API endpoints. All endpoints are prefixed with `/api`.

### 1. History Management

-   **`GET /api/history`**
    -   **Description**: Retrieves the entire analysis history.
    -   **Response**: A JSON array of `AnalysisRecord` objects, sorted with the most recent first.

-   **`POST /api/history`**
    -   **Description**: Saves a new analysis record. It also saves the associated bill image to the `uploads/` folder.
    -   **Request Body**: A JSON object containing `data` (the `BillData` object) and `imageSrc` (the base64-encoded image string).
    -   **Response**: The newly created `AnalysisRecord` object, including the server path to the saved image.

-   **`DELETE /api/history`**
    -   **Description**: Deletes all history records from `history.json` and all images from the `uploads/` folder.
    -   **Response**: A success message.

### 2. CSV Export

-   **`POST /api/save-analysis`**
    -   **Description**: Receives the final, potentially user-edited `BillData`, generates a CSV file from it, and saves it to the `csv/` folder.
    -   **Request Body**: A JSON object representing the `BillData`.
    -   **Filename**: The CSV is automatically named using the format `YYYY-MM-DD-HH-MM-SS_account-name_bill-data.csv`.
    -   **Response**: A success message indicating the filename of the saved CSV.

## How to Run

The server is started using the `npm run server` command, which is defined in `package.json`. This command uses `nodemon` to watch for file changes and `ts-node` to execute the `server.ts` TypeScript file directly.
