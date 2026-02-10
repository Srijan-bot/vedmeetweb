import { GoogleGenerativeAI } from "@google/generative-ai";
// using node --env-file=.env

const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("Error: VITE_GEMINI_API_KEY not found in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

async function test() {
    console.log(`Testing gemini-1.5-flash with key from env...`);
    try {
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log("SUCCESS: Response received.");
        console.log("Response:", response.text());
    } catch (error) {
        console.error("FAILED:", error.message);
    }
}

test();
