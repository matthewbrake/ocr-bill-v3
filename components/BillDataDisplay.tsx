import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import type { BillData, LineItem, UsageChart } from '../types/index';
import { DownloadIcon, SubmitIcon, WarningIcon, EditIcon, CheckIcon, RefreshIcon, PencilIcon } from './icons';

interface EditableFieldProps {
    label: string;
    value: string | number;
    confidenceScore?: number;
    onChange: (value: string | number) => void;
    type?: 'text' | 'number' | 'date';
}

const EditableField: React.FC<EditableFieldProps> = ({ label, value, confidenceScore, onChange, type = 'text' }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const isLowConfidence = confidenceScore !== undefined && confidenceScore < 0.75;

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    const handleSave = () => {
        onChange(type === 'number' ? parseFloat(currentValue as string) : currentValue);
        setIsEditing(false);
    };

    return (
        <div className="mb-4">
            <label className="text-sm font-medium text-gray-400 flex items-center">
                {label}
                {isLowConfidence && (
                    <span className="ml-2" title={`Low confidence (${(confidenceScore * 100).toFixed(0)}%). Please verify.`}>
                        <WarningIcon className="h-4 w-4 text-yellow-400" />
                    </span>
                )}
            </label>
            <div className="flex items-center gap-2 mt-1">
                {isEditing ? (
                    <input
                        type={type}
                        value={currentValue}
                        onChange={(e) => setCurrentValue(e.target.value)}
                        className="w-full bg-gray-900 border border-cyan-500 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        autoFocus
                        onBlur={handleSave}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    />
                ) : (
                    <p className={`w-full px-3 py-2 rounded-md bg-gray-700/50 ${isLowConfidence ? 'border border-yellow-500/50' : ''}`}>
                        {type === 'number' ? `$${Number(value).toFixed(2)}` : value}
                    </p>
                )}
                {isEditing ? (
                    <button onClick={handleSave} className="p-2 text-green-400 hover:text-green-300"><CheckIcon className="h-5 w-5"/></button>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="p-2 text-gray-400 hover:text-white"><EditIcon className="h-5 w-5" /></button>
                )}
            </div>
        </div>
    );
};


const BillDataDisplay: React.FC<{ result: BillData, onNewAnalysis: () => void, imageSrc: string | null }> = ({ result, onNewAnalysis, imageSrc }) => {
    const [editedResult, setEditedResult] = useState<BillData>(result);
    const [editingChartIndex, setEditingChartIndex] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    const formspreeId = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env.VITE_FORMSPREE_FORM_ID : '';
    const barColors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#00C49F"];
    const LOW_CONFIDENCE_THRESHOLD = 0.75;
    const lowConfidenceColor = "#facc15"; // tailwind yellow-400

    useEffect(() => {
        setEditedResult(result);
    }, [result]);

    const handleFieldChange = (field: keyof BillData, value: any) => {
        setEditedResult(prev => ({ ...prev, [field]: value }));
    };

     const handleChartDataChange = (chartIndex: number, dataIndex: number, yearIndex: number | 'month', value: string) => {
        setEditedResult(prev => {
            const newCharts = JSON.parse(JSON.stringify(prev.usageCharts)); // Deep copy
            const chartData = newCharts[chartIndex].data;
            if (yearIndex === 'month') {
                chartData[dataIndex].month = value;
            } else {
                // Ensure usage array and object exist
                if (!chartData[dataIndex].usage[yearIndex]) {
                    chartData[dataIndex].usage[yearIndex] = { year: 'New', value: 0, confidence: 1.0 };
                }
                chartData[dataIndex].usage[yearIndex].value = parseFloat(value) || 0;
                chartData[dataIndex].usage[yearIndex].confidence = 1.0; // Assume user correction is 100% confident
            }
            return { ...prev, usageCharts: newCharts };
        });
    };
    
     const handleSaveAndExport = async () => {
        setIsSaving(true);
        setSaveMessage('');
        try {
            const response = await fetch('/api/save-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editedResult),
            });
            const resData = await response.json();
            if (!response.ok) {
                throw new Error(resData.message || 'Failed to save CSV on server.');
            }
            setSaveMessage(resData.message);
        } catch (err: any) {
            setSaveMessage(err.message);
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveMessage(''), 6000);
        }
    };


    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-cyan-400">Analysis Complete</h2>
                <button 
                    onClick={onNewAnalysis}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors"
                >
                    <RefreshIcon className="h-5 w-5"/>
                    Start New Analysis
                </button>
            </div>
            
            <form action={formspreeId ? `https://formspree.io/f/${formspreeId}` : undefined} method="POST">
                <input type="hidden" name="_billData" value={JSON.stringify(editedResult)} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Account Info & Summary */}
                    <div className="lg:col-span-1 space-y-6 bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h3 className="text-xl font-semibold border-b border-gray-600 pb-2">Analyzed Bill</h3>
                        {imageSrc && (
                            <div className="mb-4">
                                <img src={imageSrc} alt="Bill thumbnail" className="rounded-lg max-h-48 w-full object-contain bg-gray-900/50" />
                            </div>
                        )}
                        <h3 className="text-xl font-semibold border-b border-gray-600 pb-2">Account Information</h3>
                        <EditableField label="Account Name" value={editedResult.accountName || ''} confidenceScore={editedResult.confidenceScores?.accountName} onChange={(val) => handleFieldChange('accountName', val)} />
                        <EditableField label="Account Number" value={editedResult.accountNumber} confidenceScore={editedResult.confidenceScores?.accountNumber} onChange={(val) => handleFieldChange('accountNumber', val)} />
                        <EditableField label="Service Address" value={editedResult.serviceAddress || ''} confidenceScore={editedResult.confidenceScores?.serviceAddress} onChange={(val) => handleFieldChange('serviceAddress', val)} />
                        <EditableField label="Statement Date" type="date" value={editedResult.statementDate || ''} confidenceScore={editedResult.confidenceScores?.statementDate} onChange={(val) => handleFieldChange('statementDate', val)} />
                        
                        <h3 className="text-xl font-semibold border-b border-gray-600 pb-2 pt-4">Payment Summary</h3>
                        <EditableField label="Total Current Charges" type="number" value={editedResult.totalCurrentCharges} confidenceScore={editedResult.confidenceScores?.totalCurrentCharges} onChange={(val) => handleFieldChange('totalCurrentCharges', val)} />
                        <EditableField label="Due Date" type="date" value={editedResult.dueDate} confidenceScore={editedResult.confidenceScores?.dueDate} onChange={(val) => handleFieldChange('dueDate', val)} />
                    </div>

                    {/* Right Column: Usage & Line Items */}
                    <div className="lg:col-span-2 space-y-6">
                         {/* Usage Charts */}
                        {editedResult.usageCharts?.map((chart: UsageChart, index: number) => (
                             <div key={index} className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-semibold">{chart.title} ({chart.unit})</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-xs text-gray-400" title="Bars in this color have a low confidence score and should be verified.">
                                            <div className="w-3 h-3 rounded-sm bg-yellow-400"></div>
                                            <span>Needs Review</span>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setEditingChartIndex(editingChartIndex === index ? null : index)}
                                            className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 rounded-md font-semibold"
                                        >
                                            {editingChartIndex === index ? <CheckIcon className="h-4 w-4" /> : <PencilIcon className="h-4 w-4" />}
                                            {editingChartIndex === index ? 'Done' : 'Edit Chart'}
                                        </button>
                                    </div>
                                </div>
                                {editingChartIndex === index ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-gray-600">
                                                    <th className="px-2 py-2 text-left text-gray-400 font-medium">Month</th>
                                                    {chart.data[0]?.usage.map(u => (
                                                        <th key={u.year} className="px-2 py-2 text-right text-gray-400 font-medium">{u.year}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {chart.data.map((point, dataIndex) => (
                                                    <tr key={dataIndex} className="border-b border-gray-700 last:border-b-0">
                                                        <td className="px-1 py-1">
                                                            <input 
                                                                type="text" 
                                                                value={point.month}
                                                                onChange={(e) => handleChartDataChange(index, dataIndex, 'month', e.target.value)}
                                                                className="w-20 bg-gray-700 rounded-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                                            />
                                                        </td>
                                                        {point.usage.map((u, yearIndex) => (
                                                            <td key={u.year} className="px-1 py-1">
                                                                <input
                                                                    type="number"
                                                                    value={u.value}
                                                                    onChange={(e) => handleChartDataChange(index, dataIndex, yearIndex, e.target.value)}
                                                                    className="w-full bg-gray-700 rounded-sm px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                                                />
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={chart.data}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                                            <XAxis dataKey="month" stroke="#A0AEC0" />
                                            <YAxis stroke="#A0AEC0" />
                                            <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} />
                                            <Legend />
                                            {chart.data[0]?.usage.map((u, i) => (
                                            <Bar key={u.year} dataKey={`usage[${i}].value`} name={u.year} fill={barColors[i % barColors.length]}>
                                                {chart.data.map((entry, index) => (
                                                    <Cell 
                                                        key={`cell-${index}`} 
                                                        fill={
                                                            (entry.usage[i]?.confidence ?? 1.0) < LOW_CONFIDENCE_THRESHOLD 
                                                            ? lowConfidenceColor 
                                                            : barColors[i % barColors.length]
                                                        } 
                                                    />
                                                ))}
                                            </Bar>
                                            ))}
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        ))}

                        {/* Line Items Table */}
                         <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                            <h3 className="text-xl font-semibold mb-4">Line Items</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="border-b border-gray-600 text-sm text-gray-400">
                                        <tr>
                                            <th className="py-2 px-4">Description</th>
                                            <th className="py-2 px-4 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {editedResult.lineItems?.map((item: LineItem, index: number) => (
                                            <tr key={index} className="border-b border-gray-700">
                                                <td className="py-3 px-4">{item.description}</td>
                                                <td className="py-3 px-4 text-right font-mono">${item.amount.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-8 flex flex-wrap gap-4 justify-end items-center">
                    {saveMessage && <p className="text-sm text-cyan-400 mr-4">{saveMessage}</p>}
                    <button type="button" onClick={handleSaveAndExport} disabled={isSaving} className="flex items-center gap-2 px-5 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-500">
                        <DownloadIcon className="h-5 w-5" />
                        {isSaving ? 'Saving...' : 'Save & Export CSV'}
                    </button>
                    <button type="submit" disabled={!formspreeId} className="flex items-center gap-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed" title={!formspreeId ? "Formspree ID not configured" : "Submit via Formspree"}>
                        <SubmitIcon className="h-5 w-5" />
                        Submit Form
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BillDataDisplay;