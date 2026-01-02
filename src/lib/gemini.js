import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Helper for delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper
const retryOperation = async (operation, maxRetries = 3, initialDelay = 1000) => {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            // Retry on 503 (Service Unavailable) or 429 (Too Many Requests)
            if (error.response?.status === 503 || error.response?.status === 429 || error.message?.includes('503') || error.message?.includes('429')) {
                const waitTime = initialDelay * Math.pow(2, i);
                console.warn(`Attempt ${i + 1} failed. Retrying in ${waitTime}ms...`);
                await delay(waitTime);
                continue;
            }
            throw error;
        }
    }
    throw lastError;
};

export const generateProductContent = async (baseInfo) => {
    if (!API_KEY) {
        throw new Error("Gemini API Key is missing");
    }

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        // Using the experimental model as requested
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const prompt = `
            You are an expert copywriter for a premium Ayurvedic e-commerce brand.
            Generate detailed product content for a product with the following details:
            Name: ${baseInfo.name}
            Category: ${baseInfo.categoryName || 'Ayurvedic Wellness'}
            Health Concern: ${baseInfo.concernName || 'General Health'}
            Keywords: ${baseInfo.keywords || ''}

            Please output ONLY a valid JSON object with the following fields:
            - description: A compelling, 2-3 sentence marketing description suitable for a premium product.
            - features: A string with 3-4 key features, separated by newlines.
            - ingredients: A string listing 3-5 key ayurvedic ingredients, separated by commas.
            - benefits: A string with 3-4 clear health benefits, separated by newlines.
            - usage: A concise instruction on how to use the product.

            Do not wrap the JSON in markdown code blocks. Just return the raw JSON string.
        `;

        return await retryOperation(async () => {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean up markdown if present just in case
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

            return JSON.parse(cleanText);
        });

    } catch (error) {
        console.error("Error generating content:", error);
        throw error;
    }
};
