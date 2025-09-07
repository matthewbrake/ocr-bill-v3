import dotenv from 'dotenv';
dotenv.config();

// FIX: Import Request and Response types directly from express to resolve type conflicts with global DOM types.
// FIX: Using aliases for Request and Response to explicitly use Express types and prevent conflicts with global DOM types.
import express, { Request as ExpressRequest, Response as ExpressResponse } from 'express';
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
// FIX: Use aliased ExpressRequest and ExpressResponse types to avoid conflict with global DOM types.
app.post('/api/analyze/gemini', async (req: ExpressRequest, res: ExpressResponse) => {
    logger.info('Received request for /api/analyze/gemini');
    const { imageData } = req.body;
    logger.debug('Gemini request body received.', { hasImageData: !!imageData });
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
        logger.debug('Gemini API Request payload:', { model: request.model, config: request.config });

        const response = await ai.models.generateContent(request);
        
        const jsonText = response.text?.trim();
        logger.debug('Raw Gemini response text received', { jsonText });
        if (!jsonText) {
             logger.error('Received empty response text from Gemini API.');
             throw new Error('Received empty response from Gemini API.');
        }
        
        const result = JSON.parse(jsonText);
        logger.info('Successfully received and parsed response from Gemini.');
        logger.debug('Full Gemini Parsed JSON Response:', { result });
        res.json(result);

    } catch (error: any) {
        logger.error('Error calling Gemini API:', { message: error.message, stack: error.stack });
        res.status(500).json({ message: error.message || 'An unknown error occurred during Gemini analysis.' });
    }
});

// Ollama analysis proxy
// FIX: Use aliased ExpressRequest and ExpressResponse types to avoid conflict with global DOM types.
app.post('/api/analyze/ollama', async (req: ExpressRequest, res: ExpressResponse) => {
    logger.info('Received request for /api/analyze/ollama (proxy)');
    const { imageData, settings } = req.body;
    logger.debug('Ollama request body received.', { hasImageData: !!imageData, settings });
    
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
            { role: "system", content: MASTER_SYSTEM_PROMPT },
            {
                role: "user",
                content: "Analyze this utility bill image and provide the specified JSON output.",
                images: [cleanBase64(imageData)]
            }
        ]
    };

    try {
        logger.info(`Proxying request to Ollama server at ${serverUrl} for model ${model}`);
        logger.debug('Ollama proxy payload', { model: payload.model, format: payload.format, stream: payload.stream, systemMessage: payload.messages[0].content });
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
        const rawContent = responseData.message?.content;
        logger.info('Successfully received response from Ollama server.');
        logger.debug('Raw Ollama response content received', { rawContent });
        
        if (!rawContent) {
            logger.error('Ollama response content is empty or missing.');
            throw new Error('The AI model returned an empty response. Please check the model and try again.');
        }

        try {
            const result = JSON.parse(rawContent);
            logger.debug('Full Ollama Parsed JSON Response:', { result });
            if (!result.accountNumber) {
                 logger.warn("Ollama response was missing 'accountNumber'. The model might not be suitable for this task or failed to extract it.");
            }
            res.json(result);
        } catch (parseError) {
             logger.error('Failed to parse JSON content from Ollama response. The model may not support JSON mode or image analysis.', { 
                message: (parseError as Error).message,
                content: rawContent
            });
            throw new Error('The AI model returned a response in an unexpected format. Please ensure you are using a multimodal model (like llava) capable of processing images and generating JSON.');
        }

    } catch (error: any) {
        logger.error('Error proxying request to Ollama:', { message: error.message, stack: error.stack });
        res.status(500).json({ message: error.message || `Failed to connect or get a valid response from Ollama server at ${serverUrl}. Please check if it's running and accessible.` });
    }
});


// History endpoints
// FIX: Use aliased ExpressRequest and ExpressResponse types to avoid conflict with global DOM types.
app.get('/api/history', async (req: ExpressRequest, res: ExpressResponse) => {
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

// FIX: Use aliased ExpressRequest and ExpressResponse types to avoid conflict with global DOM types.
app.post('/api/history', async (req: ExpressRequest, res: ExpressResponse) => {
    logger.info('POST /api/history');
    const { data, imageSrc } = req.body;
    logger.debug('POST /api/history body', { hasData: !!data, hasImage: !!imageSrc });
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

        logger.info(`Saved new history record ${newRecord.id} for account: ${data.accountNumber || 'N/A'}`);
        logger.debug('New history record data:', newRecord);
        res.status(201).json(newRecord);
    } catch (error) {
        logger.error('Error saving history:', error);
        res.status(500).json({ message: 'Failed to save history' });
    }
});

// FIX: Use aliased ExpressRequest and ExpressResponse types to avoid conflict with global DOM types.
app.delete('/api/history', async (req: ExpressRequest, res: ExpressResponse) => {
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
// FIX: Use aliased ExpressRequest and ExpressResponse types to avoid conflict with global DOM types.
app.post('/api/save-analysis', async (req: ExpressRequest, res: ExpressResponse) => {
    logger.info('POST /api/save-analysis');
    const data: BillData = req.body;
    logger.debug('POST /api/save-analysis body', { data });
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
// FIX: Use aliased ExpressRequest and ExpressResponse types to avoid conflict with global DOM types.
app.post('/api/ollama/test', async (req: ExpressRequest, res: ExpressResponse) => {
    const { url } = req.body;
    logger.info(`Proxying Ollama connection test to: ${url}`);
    if (!url) {
        return res.status(400).json({ message: 'URL is required' });
    }
    try {
        const response = await fetch(url, { method: 'GET' });
        logger.info(`Ollama test connection to ${url} returned status ${response.status}`);
        res.status(response.status).json({ success: response.ok });
    } catch (error) {
        logger.error(`Failed to connect to Ollama at ${url}`, error);
        res.json({ success: false });
    }
});

// FIX: Use aliased ExpressRequest and ExpressResponse types to avoid conflict with global DOM types.
app.post('/api/ollama/tags', async (req: ExpressRequest, res: ExpressResponse) => {
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
        logger.info(`Successfully fetched ${data.models?.length || 0} models from Ollama at ${url}`);
        logger.debug('Ollama tags response', { data });
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
