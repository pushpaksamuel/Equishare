import { GoogleGenAI } from '@google/genai';

interface ConversionResult {
  rate: number;
}

// Simple in-memory cache for the session
const ratesCache = new Map<string, number>();

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

async function fetchConversionRate(from: string, to: string): Promise<number> {
    const prompt = `Using real-time financial data from Google Search, what is the exchange rate from 1 ${from} to ${to}? Return *only* a valid JSON object with a single key: "rate" (number). Do not include any other text, explanations, or markdown formatting.`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        let jsonString = response.text.trim();
        if (jsonString.startsWith('```json')) {
            jsonString = jsonString.substring(7);
        }
        if (jsonString.endsWith('```')) {
            jsonString = jsonString.substring(0, jsonString.length - 3);
        }
        
        const parsedResult = JSON.parse(jsonString) as ConversionResult;
        if (typeof parsedResult.rate === 'number') {
            return parsedResult.rate;
        }
        throw new Error('Invalid rate format in API response');

    } catch (error) {
        console.error(`Failed to fetch conversion rate for ${from} to ${to}:`, error);
        throw error;
    }
}


export const getRate = async (from: string, to: string): Promise<number> => {
    if (from === to) {
        return 1;
    }
    const cacheKey = `${from}_${to}`;
    if (ratesCache.has(cacheKey)) {
        return ratesCache.get(cacheKey)!;
    }

    const rate = await fetchConversionRate(from, to);
    ratesCache.set(cacheKey, rate);
    return rate;
};
