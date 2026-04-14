import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const matchInventory = async (profile: any, catalog: any) => {
    // Specialized agent for inventory matching and ranking
    const systemPrompt = `
    You are the "Inventory Matching Agent" for TripNour. 
    Your job is to mathematically rank the best 5 luxury packages for a traveler based on their intent.

    TRAVELER PROFILE:
    Summary: ${profile.historical_summary || "None"}
    Vibe: ${profile.intent_profile?.primary_motivation || "Unknown"}
    Budget: ${profile.trip_context?.budget?.value || "Unknown"} GBP

    LIVE CATALOG (100+ items):
    ${JSON.stringify(catalog.sample_packages.slice(0, 50))}

    TASK:
    1. Select the Top 5 most relevant packages.
    2. Respect budget constraints + vibe.
    3. Return ONLY the IDs and names of the matched items.

    OUTPUT FORMAT (JSON):
    {
        "matched_packages": [
            { "id": "...", "name": "...", "reason": "Short logic why" }
        ]
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
        console.error('❌ Matching Agent Failed:', e);
        return { matched_packages: [] };
    }
};
