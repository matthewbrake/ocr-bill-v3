// FIX: Use aliased imports for Express Request and Response to avoid conflicts with global DOM types.
import express, { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Buffer } from 'buffer';
import type { BillData, LineItem, UsageChart, AnalysisRecord } from './types/index.js';
import logger from './logger.js';

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

// --- CSV Generation Utilities ---
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

app.get('/api/history', async (req: ExpressRequest, res: ExpressResponse) => {
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

app.post('/api/history', async (req: ExpressRequest, res: ExpressResponse) => {
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

app.delete('/api/history', async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        await fs.writeFile(HISTORY_FILE, JSON.stringify([]));
        const files = await fs.readdir(UPLOADS_DIR);
        for (const file of files) {
            // FIX: Corrected typo from UPLOADS_S to UPLOADS_DIR.
            await fs.unlink(path.join(UPLOADS_DIR, file));
        }
        logger.info('History cleared successfully.');
        res.status(200).json({ message: 'History cleared successfully' });
    } catch (error) {
        logger.error('Error clearing history:', error);
        res.status(500).json({ message: 'Failed to clear history' });
    }
});

app.post('/api/save-analysis', async (req: ExpressRequest, res: ExpressResponse) => {
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

app.listen(port, () => {
    initialize();
    logger.info(`AI Bill Analyzer server running at http://localhost:${port}`);
});