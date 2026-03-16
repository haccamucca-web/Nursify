import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        const fetch = globalThis.fetch;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        console.log(data.models.map(m => m.name));
    } catch(e) {
        console.error(e);
    }
}
run();
