
import type { BillData, LineItem, UsageChart } from '../types/index';

const escapeCsvCell = (cell: any): string => {
    const cellStr = String(cell ?? '');
    if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
    }
    return cellStr;
};

export const exportToCsv = (data: BillData, filename: string = 'bill-data.csv') => {
    let csvContent = [];

    // Basic Info
    csvContent.push('Category,Field,Value');
    csvContent.push(`"Account Info","Account Name",${escapeCsvCell(data.accountName)}`);
    csvContent.push(`"Account Info","Account Number",${escapeCsvCell(data.accountNumber)}`);
    csvContent.push(`"Account Info","Service Address",${escapeCsvCell(data.serviceAddress)}`);
    csvContent.push(`"Account Info","Statement Date",${escapeCsvCell(data.statementDate)}`);
    csvContent.push(`"Account Info","Due Date",${escapeCsvCell(data.dueDate)}`);
    csvContent.push(`"Account Info","Total Charges",${escapeCsvCell(data.totalCurrentCharges)}`);
    csvContent.push(''); // Spacer

    // Line Items
    if (data.lineItems && data.lineItems.length > 0) {
        csvContent.push('Line Items,Description,Amount');
        data.lineItems.forEach((item: LineItem) => {
            csvContent.push(`,${escapeCsvCell(item.description)},${escapeCsvCell(item.amount)}`);
        });
        csvContent.push(''); // Spacer
    }
    
    // Usage Charts
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
            csvContent.push(''); // Spacer
        });
    }

    const csvString = csvContent.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
