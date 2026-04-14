import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const distillContext = async (profile: any, recentInteractions: any[]) => {
    // Current distillation agent specialized for high-fidelity state extraction
    const model = ai.models.get({ model: 'gemini-2.5-flash' });

    const systemPrompt = `
    You are the "Janitor Agent" for TripNour. Your sole purpose is to maintain a perfect, structured memory of a traveler's intent. 
    You are an analytical data processor. NO flowery language, NO fluff. Use cold, hard facts.

    INPUT DATA:
    1. CURRENT PROFILE SUMMARY: ${profile.historical_summary || "None"}
    2. RECENT CHAT LOG: ${JSON.stringify(recentInteractions.slice(-4))}

    TASK:
    Analyze the new chat logs and merge them into the existing profile summary. 
    Focus on extracting structural variables: traveler_name, destinations, budget_value (GBP), vibe, duration_days, companions, deal_breakers.

    OUTPUT FORMAT (Strict JSON Only):
    {
        "updated_historical_summary": "FACTS ONLY: e.g. Traveler Ben seeking Swiss Alps. Vibe: Hilly landscape, local tavernas. No budget yet. Stage: Ready for Swiss catalog exploration.",
        "extracted_updates": { ... },
        "suggested_next_phase": "EXPLORATION" // Force promotion if destination or vibe is known
    }
    `;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: systemPrompt,
            config: { responseMimeType: "application/json" }
        });

        const text = result.text || "{}";
        const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(clean);
    } catch (e) {
        console.error('❌ Distillation Agent Failed:', e);
        return null;
    }
};
