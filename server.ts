import dotenv from 'dotenv';
dotenv.config();

// FIX: Use namespaced Request and Response types from the express default import
// to avoid conflicts with global DOM types.
import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Buffer } from 'buffer';
import type { BillData, LineItem, UsageChart, AnalysisRecord } from './types/index.js';
import logger from './logger.js';
import { GoogleGenAI } from '@google/genai';
import { MASTER_SYSTEM_PROMPT, RESPONSE_JSON_SCHEMA } from './src/prompt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;

// Determine project root directory to correctly serve static files in dev and prod
const projectRoot = path.resolve(__dirname, __dirname.endsWith('dist') ? '..' : '.');
const UPLOADS_DIR = path.join(projectRoot, 'uploads');
const HISTORY_FILE = path.join(projectRoot, 'history.json');
const CSV_DIR = path.join(projectRoot, 'csv');

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(projectRoot));
app.use('/uploads', express.static(UPLOADS_DIR));

const generateId = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// Ensure directories and history file exist
const initialize = async () => {
    try {
        await Promise.all([
            fs.mkdir(UPLOADS_DIR, { recursive: true }),
            fs.mkdir(CSV_DIR, { recursive: true })
        ]);
        await fs.access(HISTORY_FILE);
    } catch {
        logger.info('History file not found, creating a new one.');
        await fs.writeFile(HISTORY_FILE, JSON.stringify([]));
    }
};

// --- Utilities ---
const base64ToMime = (base64: string): string => {
    const signature = base64.substring(0, 30);
    if (signature.includes("image/jpeg")) return "image/jpeg";
    if (signature.includes("image/png")) return "image/png";
    if (signature.includes("image/webp")) return "image/webp";
    return 'image/png'; // Default
}

const cleanBase64 = (base64: string): string => {
    return base64.split(',')[1];
}

const escapeCsvCell = (cell: any): string => {
    const cellStr = String(cell ?? '');
    if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
    }
    return cellStr;
};

const generateCsvContent = (data: BillData): string => {
    let csvContent = [];
    csvContent.push('Category,Field,Value');
    csvContent.push(`"Account Info","Account Name",${escapeCsvCell(data.accountName)}`);
    csvContent.push(`"Account Info","Account Number",${escapeCsvCell(data.accountNumber)}`);
    csvContent.push(`"Account Info","Service Address",${escapeCsvCell(data.serviceAddress)}`);
    csvContent.push(`"Account Info","Statement Date",${escapeCsvCell(data.statementDate)}`);
    csvContent.push(`"Account Info","Due Date",${escapeCsvCell(data.dueDate)}`);
    csvContent.push(`"Account Info","Total Charges",${escapeCsvCell(data.totalCurrentCharges)}`);
    csvContent.push(''); 
    if (data.lineItems && data.lineItems.length > 0) {
        csvContent.push('Line Items,Description,Amount');
        data.lineItems.forEach((item: LineItem) => {
            csvContent.push(`,${escapeCsvCell(item.description)},${escapeCsvCell(item.amount)}`);
        });
        csvContent.push('');
    }
    if (data.usageCharts && data.usageCharts.length > 0) {
        data.usageCharts.forEach((chart: UsageChart) => {
            csvContent.push(`Usage Chart,Title,Unit`);
            csvContent.push(`,${escapeCsvCell(chart.title)},${escapeCsvCell(chart.unit)}`);
            csvContent.push(`,Month,Year,Value`);
            chart.data.forEach(point => {
                point.usage.forEach(usagePoint => {
                     csvContent.push(`,${escapeCsvCell(point.month)},${escapeCsvCell(usagePoint.year)},${escapeCsvCell(usagePoint.value)}`);
                });
            });
            csvContent.push('');
        });
    }
    return csvContent.join('\n');
};

// --- API Routes ---

// Gemini analysis proxy
app.post('/api/analyze/gemini', async (req: express.Request, res: express.Response) => {
    logger.info('Received request for /api/analyze/gemini');
    const { imageData } = req.body;
    if (!imageData) {
        logger.warn('Gemini request missing image data');
        return res.status(400).json({ message: 'Missing image data' });
    }
    
    if (!process.env.API_KEY) {
        logger.error('Gemini API key is not configured on the server.');
        return res.status(500).json({ message: 'Google Gemini API key is not configured on the server. Please set the API_KEY environment variable.' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const imagePart = {
            inlineData: {
                mimeType: base64ToMime(imageData),
                data: cleanBase64(imageData),
            },
        };

        const request = {
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart] },
            config: {
                systemInstruction: MASTER_SYSTEM_PROMPT,
                responseMimeType: "application/json",
                responseSchema: RESPONSE_JSON_SCHEMA,
            },
        };

        logger.info('Sending request to Gemini API...');
        const response = await ai.models.generateContent(request);
        
        const jsonText = response.text?.trim();
        if (!jsonText) {
             logger.error('Received empty response text from Gemini API.');
             throw new Error('Received empty response from Gemini API.');
        }

        const result = JSON.parse(jsonText);
        logger.info('Successfully received and parsed response from Gemini.');
        res.json(result);

    } catch (error: any) {
        logger.error('Error calling Gemini API:', { message: error.message, stack: error.stack });
        res.status(500).json({ message: error.message || 'An unknown error occurred during Gemini analysis.' });
    }
});

// Ollama analysis proxy
app.post('/api/analyze/ollama', async (req: express.Request, res: express.Response) => {
    logger.info('Received request for /api/analyze/ollama (proxy)');
    const { imageData, settings } = req.body;
    if (!imageData || !settings) {
        logger.warn('Ollama proxy request missing image or settings');
        return res.status(400).json({ message: 'Missing image data or AI settings' });
    }
    
    const { serverUrl, model } = settings.ollama;
     if (!serverUrl || !model) {
        logger.warn('Ollama proxy request missing server URL or model in settings');
        return res.status(400).json({ message: "Ollama server URL or model is not configured." });
    }
    
    const payload = {
        model: model,
        format: "json",
        stream: false,
        messages: [
            { role: "system", content: "You are an expert OCR system for utility bills. Analyze the image and return a JSON object based on the user's request. Do not include any markdown formatting." },
            {
                role: "user",
                content: "Analyze this utility bill.",
                images: [cleanBase64(imageData)]
            }
        ]
    };

    try {
        logger.info(`Proxying request to Ollama server at ${serverUrl} for model ${model}`);
        const response = await fetch(`${serverUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            logger.error(`Ollama server returned an error: ${response.status}`, { errorBody });
            throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
        }
        
        const responseData = await response.json();
        logger.info('Successfully received response from Ollama server.');
        
        // The actual JSON is nested inside the response, parse and return it
        const result = JSON.parse(responseData.message.content);
        res.json(result);

    } catch (error: any) {
        logger.error('Error proxying request to Ollama:', { message: error.message, stack: error.stack });
        res.status(500).json({ message: `Failed to connect or get a valid response from Ollama server at ${serverUrl}. Please check if it's running and accessible.` });
    }
});


// History endpoints
app.get('/api/history', async (req: express.Request, res: express.Response) => {
    logger.info('GET /api/history');
    try {
        const historyData = await fs.readFile(HISTORY_FILE, 'utf-8');
        const history: AnalysisRecord[] = JSON.parse(historyData);
        const sortedHistory = history.sort((a, b) => {
             const dateA = a.rawTimestamp ? new Date(a.rawTimestamp).getTime() : 0;
             const dateB = b.rawTimestamp ? new Date(b.rawTimestamp).getTime() : 0;
             return dateB - dateA;
        });
        res.json(sortedHistory);
    } catch (error) {
        logger.error('Error reading history:', error);
        res.status(500).json({ message: 'Failed to retrieve history' });
    }
});

app.post('/api/history', async (req: express.Request, res: express.Response) => {
    logger.info('POST /api/history');
    const { data, imageSrc } = req.body;
    if (!data || !imageSrc) {
        return res.status(400).json({ message: 'Missing data or imageSrc' });
    }

    try {
        const imageMimeType = imageSrc.match(/data:(image\/\w+);base64,/);
        const imageExtension = imageMimeType ? imageMimeType[1].split('/')[1] : 'png';
        const imageFileName = `${generateId()}.${imageExtension}`;
        const imagePath = path.join(UPLOADS_DIR, imageFileName);
        const base64Data = imageSrc.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');
        await fs.writeFile(imagePath, imageBuffer);
        logger.info(`Saved bill image to ${imagePath}`);

        const historyData = await fs.readFile(HISTORY_FILE, 'utf-8');
        const history = JSON.parse(historyData);

        const now = new Date();
        const newRecord: AnalysisRecord = {
            id: generateId(),
            rawTimestamp: now.toISOString(),
            timestamp: now.toLocaleString(),
            data: data,
            imagePath: `/uploads/${imageFileName}`
        };

        const updatedHistory = [newRecord, ...history].slice(0, 50);
        await fs.writeFile(HISTORY_FILE, JSON.stringify(updatedHistory, null, 2));

        logger.info(`Saved new history record ${newRecord.id} for account ${data.accountNumber}`);
        res.status(201).json(newRecord);
    } catch (error) {
        logger.error('Error saving history:', error);
        res.status(500).json({ message: 'Failed to save history' });
    }
});

app.delete('/api/history', async (req: express.Request, res: express.Response) => {
    logger.info('DELETE /api/history');
    try {
        await fs.writeFile(HISTORY_FILE, JSON.stringify([]));
        const files = await fs.readdir(UPLOADS_DIR);
        for (const file of files) {
            await fs.unlink(path.join(UPLOADS_DIR, file));
        }
        logger.info('History cleared successfully.');
        res.status(200).json({ message: 'History cleared successfully' });
    } catch (error) {
        logger.error('Error clearing history:', error);
        res.status(500).json({ message: 'Failed to clear history' });
    }
});

// CSV Export endpoint
app.post('/api/save-analysis', async (req: express.Request, res: express.Response) => {
    logger.info('POST /api/save-analysis');
    const data: BillData = req.body;
    if (!data) {
        return res.status(400).json({ message: 'Missing bill data' });
    }
    try {
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/[:T]/g, '-');
        const sanitizedName = data.accountName?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'account';
        const filename = `${timestamp}_${sanitizedName}_bill-data.csv`;
        const filePath = path.join(CSV_DIR, filename);

        const csvContent = generateCsvContent(data);
        await fs.writeFile(filePath, csvContent);

        logger.info(`CSV saved successfully to ${filePath}`);
        res.status(200).json({ message: `CSV saved on server as ${filename}` });
    } catch (error) {
        logger.error('Error saving CSV:', error);
        res.status(500).json({ message: 'Failed to save CSV to server' });
    }
});

// Ollama Service Proxy Endpoints
app.post('/api/ollama/test', async (req: express.Request, res: express.Response) => {
    const { url } = req.body;
    logger.info(`Proxying Ollama connection test to: ${url}`);
    if (!url) {
        return res.status(400).json({ message: 'URL is required' });
    }
    try {
        const response = await fetch(url, { method: 'GET' });
        res.status(response.status).json({ success: response.ok });
    } catch (error) {
        logger.error(`Failed to connect to Ollama at ${url}`, error);
        res.json({ success: false });
    }
});

app.post('/api/ollama/tags', async (req: express.Request, res: express.Response) => {
    const { url } = req.body;
    logger.info(`Proxying Ollama tags request to: ${url}`);
    if (!url) {
        return res.status(400).json({ message: 'URL is required' });
    }
    try {
        const response = await fetch(`${url}/api/tags`);
        if (!response.ok) {
            throw new Error(`Ollama server returned status ${response.status}`);
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        logger.error(`Failed to fetch tags from Ollama at ${url}`, error);
        res.status(500).json({ message: 'Failed to fetch tags from Ollama server.' });
    }
});


app.listen(port, () => {
    initialize();
    logger.info(`AI Bill Analyzer server running at http://localhost:${port}`);
});