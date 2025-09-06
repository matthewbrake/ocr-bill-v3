// FIX: Import express as a namespace to resolve type conflicts with global Request/Response.
import express from 'express';
import cors from 'cors';
// FIX: Removed deprecated body-parser to prevent type conflicts.
// import bodyParser from 'body-parser';
import fs from 'fs/promises';
import path from 'path';
import type { BillData, LineItem, UsageChart } from './types';
// FIX: Add support for __dirname in ES modules and import Buffer to resolve TypeScript errors.
import { fileURLToPath } from 'url';
import { Buffer } from 'buffer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Allow configuring the port via environment variables, defaulting to 4000
const port = process.env.PORT || 4000;

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const HISTORY_FILE = path.join(__dirname, 'history.json');
const CSV_DIR = path.join(__dirname, 'csv');

// Middlewares
app.use(cors());
// Increase payload size limit for base64 images
// FIX: Replaced deprecated bodyParser.json() with built-in express.json() to fix type errors.
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));
app.use('/uploads', express.static(UPLOADS_DIR));

const generateId = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// Ensure directories and history file exist
const initialize = async () => {
    try {
        await fs.access(UPLOADS_DIR);
    } catch {
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
    }
     try {
        await fs.access(CSV_DIR);
    } catch {
        await fs.mkdir(CSV_DIR, { recursive: true });
    }
    try {
        await fs.access(HISTORY_FILE);
    } catch {
        await fs.writeFile(HISTORY_FILE, JSON.stringify([]));
    }
};

// --- CSV Generation Utilities (Server-Side) ---
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

// FIX: Use express.Request and express.Response to prevent global type conflicts.
app.get('/api/history', async (req: express.Request, res: express.Response) => {
    try {
        const historyData = await fs.readFile(HISTORY_FILE, 'utf-8');
        res.json(JSON.parse(historyData).sort((a, b) => new Date(b.rawTimestamp).getTime() - new Date(a.rawTimestamp).getTime()));
    } catch (error) {
        console.error('Error reading history:', error);
        res.status(500).json({ message: 'Failed to retrieve history' });
    }
});

// FIX: Use express.Request and express.Response to prevent global type conflicts.
app.post('/api/history', async (req: express.Request, res: express.Response) => {
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

        const historyData = await fs.readFile(HISTORY_FILE, 'utf-8');
        const history = JSON.parse(historyData);

        const now = new Date();
        const newRecord = {
            id: generateId(),
            rawTimestamp: now.toISOString(),
            timestamp: now.toLocaleString(),
            data: data,
            imagePath: `/uploads/${imageFileName}`
        };

        const updatedHistory = [newRecord, ...history].slice(0, 50);
        await fs.writeFile(HISTORY_FILE, JSON.stringify(updatedHistory, null, 2));

        res.status(201).json(newRecord);
    } catch (error) {
        console.error('Error saving history:', error);
        res.status(500).json({ message: 'Failed to save history' });
    }
});

// FIX: Use express.Request and express.Response to prevent global type conflicts.
app.delete('/api/history', async (req: express.Request, res: express.Response) => {
    try {
        await fs.writeFile(HISTORY_FILE, JSON.stringify([]));
        const files = await fs.readdir(UPLOADS_DIR);
        for (const file of files) {
            await fs.unlink(path.join(UPLOADS_DIR, file));
        }
        res.status(200).json({ message: 'History cleared successfully' });
    } catch (error) {
        console.error('Error clearing history:', error);
        res.status(500).json({ message: 'Failed to clear history' });
    }
});

// FIX: Use express.Request and express.Response to prevent global type conflicts.
app.post('/api/save-analysis', async (req: express.Request, res: express.Response) => {
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

        res.status(200).json({ message: `CSV saved on server as ${filename}` });
    } catch (error) {
        console.error('Error saving CSV:', error);
        res.status(500).json({ message: 'Failed to save CSV to server' });
    }
});


app.listen(port, () => {
    initialize();
    console.log(`AI Bill Analyzer server running at http://localhost:${port}`);
});
