import { Type as GenAiType } from "@google/genai";

export const MASTER_SYSTEM_PROMPT = `You are an expert OCR system specializing in utility bills from ANY provider. Your primary goal is to analyze the provided image, even if it is of low quality or at an angle, and extract the required information with high accuracy.

**Instructions:**
- Analyze the provided utility bill image and extract the information below.
- Format your response strictly as a JSON object that adheres to the provided schema. Do not include any introductory text, explanations, or markdown formatting. Your entire output must be the raw JSON object.
- **Data in Charts**: Carefully estimate the values from the bar heights relative to the y-axis if exact numbers aren't present.
- **Confidence Score**: For each field, provide a confidence score between 0.0 (not confident) and 1.0 (very confident) based on the clarity and unambiguity of the information in the image.
- **Final Check**: Ensure every required field in the schema is present. If an optional field is not found, omit it from the final JSON.`;

export const RESPONSE_JSON_SCHEMA = {
  type: GenAiType.OBJECT,
  properties: {
    "accountName": { "type": GenAiType.STRING, "description": "The name of the account holder." },
    "accountNumber": { "type": GenAiType.STRING, "description": "The unique account identifier." },
    "serviceAddress": { "type": GenAiType.STRING, "description": "The address where services are rendered." },
    "statementDate": { "type": GenAiType.STRING, "description": "The date the bill was issued (YYYY-MM-DD)." },
    "servicePeriodStart": { "type": GenAiType.STRING, "description": "Start date of the service period (YYYY-MM-DD)." },
    "servicePeriodEnd": { "type": GenAiType.STRING, "description": "End date of the service period (YYYY-MM-DD)." },
    "totalCurrentCharges": { "type": GenAiType.NUMBER, "description": "The total amount due for the current period." },
    "dueDate": { "type": GenAiType.STRING, "description": "The date the payment is due (YYYY-MM-DD)." },
    "confidenceScores": {
      "type": GenAiType.OBJECT,
      "description": "Confidence scores from 0.0 to 1.0 for each extracted field.",
      "properties": {
        "overall": { "type": GenAiType.NUMBER },
        "accountName": { "type": GenAiType.NUMBER },
        "accountNumber": { "type": GenAiType.NUMBER },
        "serviceAddress": { "type": GenAiType.NUMBER },
        "statementDate": { "type": GenAiType.NUMBER },
        "totalCurrentCharges": { "type": GenAiType.NUMBER },
        "dueDate": { "type": GenAiType.NUMBER }
      },
      "required": ["overall", "accountNumber", "totalCurrentCharges", "dueDate"]
    },
    "usageCharts": {
      "type": GenAiType.ARRAY,
      "items": {
        "type": GenAiType.OBJECT,
        "properties": {
          "title": { "type": GenAiType.STRING, "description": "The title of the usage chart (e.g., 'Electricity Usage')." },
          "unit": { "type": GenAiType.STRING, "description": "The unit of measurement (e.g., 'kWh', 'Therms')." },
          "data": {
            "type": GenAiType.ARRAY,
            "items": {
              "type": GenAiType.OBJECT,
              "properties": {
                "month": { "type": GenAiType.STRING, "description": "The month for the data point (e.g., 'Jan', 'Feb')." },
                "usage": {
                  "type": GenAiType.ARRAY,
                  "items": {
                    "type": GenAiType.OBJECT,
                    "properties": {
                      "year": { "type": GenAiType.STRING, "description": "The year of the usage, e.g., '2023'." },
                      "value": { "type": GenAiType.NUMBER, "description": "The usage value for that year." }
                    },
                    "required": ["year", "value"]
                  }
                }
              },
              "required": ["month", "usage"]
            }
          }
        },
        "required": ["title", "unit", "data"]
      }
    },
    "lineItems": {
      "type": GenAiType.ARRAY,
      "items": {
        "type": GenAiType.OBJECT,
        "properties": {
          "description": { "type": GenAiType.STRING, "description": "Description of the charge or credit." },
          "amount": { "type": GenAiType.NUMBER, "description": "The amount for the line item." }
        },
        "required": ["description", "amount"]
      }
    }
  },
  "required": ["accountNumber", "totalCurrentCharges", "dueDate", "confidenceScores", "usageCharts", "lineItems"]
};
