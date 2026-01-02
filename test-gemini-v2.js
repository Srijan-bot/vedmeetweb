import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyB7IO86q5uOcmKVNKSO-IcIYPYgovqjGeA";
const genAI = new GoogleGenerativeAI(API_KEY);

const models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-pro",
    "gemini-1.5-pro-001",
    "gemini-1.0-pro"
];

async function test() {
    console.log("--- Starting Model Availability Test ---");
    for (const modelName of models) {
        process.stdout.write(`Testing ${modelName}... `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            // Use a minimal prompt to save tokens/time
            const result = await model.generateContent("Hi");
            const response = await result.response;
            console.log(`✅ SUCCESS!`);
            console.log(`(Response: ${response.text().slice(0, 20)}...)`);
            return; // Found a working one!
        } catch (e) {
            console.log(`❌ FAILED`);
            // Check for 404 specifically
            if (e.message.includes("404") && e.message.includes("not found")) {
                console.log(`   -> Model not found (404)`);
            } else if (e.message.includes("429") || e.message.includes("retry")) {
                console.log(`   -> Rate Limited (429) - This means the model EXISTS!`);
                // If rate limited, we count this as a success for 'existence'
                return;
            } else {
                console.log(`   -> Error: ${e.message.split('\n')[0]}`);
            }
        }
    }
    console.log("--- All models failed ---");
}

test();
