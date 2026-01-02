import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyB7IO86q5uOcmKVNKSO-IcIYPYgovqjGeA";
const genAI = new GoogleGenerativeAI(API_KEY);

const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro", "gemini-pro", "gemini-2.0-flash-exp"];

async function test() {
    console.log("Starting model test...");
    for (const modelName of models) {
        console.log(`Testing ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Test");
            const response = await result.response;
            console.log(`SUCCESS: ${modelName}`);
            console.log("Response:", response.text());
            break;
        } catch (e) {
            console.log(`FAILED: ${modelName}`);
            console.log(`Error: ${e.message}`);
        }
    }
}

test();
