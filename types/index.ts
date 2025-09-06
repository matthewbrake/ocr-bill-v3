export enum AiProvider {
  GEMINI = 'gemini',
  OLLAMA = 'ollama',
  OPENAI = 'openai',
}

export interface AiSettings {
  provider: AiProvider;
  gemini: {
    apiKey: string;
  };
  ollama: {
    serverUrl: string;
    model: string;
  };
  openai: {
    apiKey: string;
  };
  verboseLogging: boolean;
}

export interface ConfidenceScores {
  overall: number;
  accountName?: number;
  accountNumber: number;
  serviceAddress?: number;
  statementDate?: number;
  totalCurrentCharges: number;
  dueDate: number;
}

export interface UsageChartDataPointValue {
  year: string;
  value: number;
  confidence: number;
}
export interface UsageChartDataPoint {
  month: string;
  usage: UsageChartDataPointValue[];
}

export interface UsageChart {
  title: string;
  unit: string;
  data: UsageChartDataPoint[];
}

export interface LineItem {
  description: string;
  amount: number;
}

export interface BillData {
  accountName?: string;
  accountNumber: string;
  serviceAddress?: string;
  statementDate?: string;
  servicePeriodStart?: string;
  servicePeriodEnd?: string;
  totalCurrentCharges: number;
  dueDate: string;
  confidenceScores: ConfidenceScores;
  usageCharts: UsageChart[];
  lineItems: LineItem[];
}

export interface AnalysisRecord {
  id: string;
  timestamp: string;
  data: BillData;
  imagePath?: string;
  rawTimestamp?: string;
}