import { GoogleGenerativeAI } from "@google/generative-ai";
// using node --env-file=.env

const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("Error: VITE_GEMINI_API_KEY not found in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    try {
        console.log("Listing models...");
        // Note: listModels is on the GoogleGenerativeAI instance or via a different method depending on SDK version.
        // Actually, for @google/generative-ai, we might need to use the model manager if available, 
        // but typically it's not directly exposed in the high-level client in the same way.
        // Let's try to just use a known older model 'gemini-pro' to see if ANYTHING works.
        // Wait, the error message literally says "Call ListModels".

        // Use the API directly if SDK doesn't support it easily, or check SDK docs.
        // Since I can't check docs on the web easily, I will try a simple curl command or similar if I could, 
        // but I will stick to node. The SDK usually doesn't have listModels on the main client.

        // Let's try 'gemini-pro' (1.0) as a fallback in this script.
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Test");
        console.log("gemini-pro works!");

    } catch (error) {
        console.error("Error with gemini-pro:", error.message);
    }
}

listModels();
