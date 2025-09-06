# Guide 1: Project Setup

This guide provides step-by-step instructions to set up and run the AI Bill Analyzer application on your local machine.

## Prerequisites

-   **Node.js**: You must have Node.js installed. Version 18 or newer is recommended. You can download it from [nodejs.org](https://nodejs.org/). Node.js comes with `npm` (Node Package Manager), which is required to install dependencies.
-   **Web Browser**: A modern web browser like Google Chrome, Firefox, or Safari.
-   **Code Editor**: An editor like Visual Studio Code is recommended for viewing and editing the code.

## Setup Steps

### Step 1: Install Dependencies

The project relies on several Node.js packages for both the backend server and the frontend build process. These are listed in the `package.json` file.

1.  Open your terminal or command prompt.
2.  Navigate to the root directory of the project (the folder containing `package.json`).
3.  Run the following command. This will download all the necessary packages into a `node_modules` folder. You only need to do this once.

    ```bash
    npm install
    ```

### Step 2: Configure Environment Variables (Optional but Recommended)

The application can be configured with API keys and other settings.

1.  In the root of the project, create a new file named `.env`.
2.  Add your API keys and desired port to this file. You can get a free key for testing from [Google AI Studio](https://aistudio.google.com/app/apikey).

    ```env
    # Required for the Google Gemini provider
    VITE_GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"

    # Required for the OpenAI provider (optional)
    VITE_OPENAI_API_KEY="YOUR_OPENAI_API_KEY_HERE"

    # Optional: For using the "Submit Form" button feature
    VITE_FORMSPREE_FORM_ID="YOUR_FORMSPREE_ID_HERE"
    
    # Optional: To change the server port from the default of 4000
    PORT=4000
    ```
    **Note**: The server only reads the `PORT` variable. The `VITE_` variables are intended for frontend build tools. Since this project uses a simple esbuild script, you will need to enter API keys in the settings UI unless you modify the build process further.

### Step 3: Run the Application

The application is now managed by a set of simple npm scripts.

**Option A: Development Mode (Recommended)**

This mode is best for testing and making code changes. It starts a file watcher for the frontend that automatically rebuilds the app when you save a file, and it starts the backend server with `nodemon`, which automatically restarts it when you change server code.

1.  In your terminal, from the project's root directory, run:
    ```bash
    npm run dev
    ```
2.  You will see confirmation messages from both the frontend bundler and the backend server. The server will be running at `http://localhost:4000` by default.

**Option B: Production Mode**

This is the recommended way to run the app for stable, long-term use.

1.  First, build the application. This compiles the frontend and backend TypeScript into optimized JavaScript in a `dist/` folder.
    ```bash
    npm run build
    ```
2.  Now, start the application:
    ```bash
    npm start
    ```
3.  You will see a `server running...` message.

### Step 4: Access the Application

After starting the server with either method, open your web browser and navigate to the URL provided: **http://localhost:4000**.

The application is now running. You can start uploading bills for analysis. Your history, uploaded images, exported CSVs, and server logs will be saved in the project folder.