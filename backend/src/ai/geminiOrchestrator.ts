import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { redis } from '../db/redis';
import { distillContext } from './agents/distillationAgent';
import { matchInventory } from './agents/matchingAgent';
import { executeRules } from './agents/rulesEngine';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

let catalogCache: any = null;
const getKnowledgeBase = () => {
    if (catalogCache) return catalogCache;
    try {
        const filePath = path.join(__dirname, '../../../docs/products.json');
        catalogCache = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e: any) {
        console.warn('⚠️ Could not load products.json. Defaulting to empty catalog.', e.message);
        catalogCache = { sample_packages: [] };
    }
    return catalogCache;
};

export const triggerNurturingAI = async (profile: any, recentEvent: any) => {
    // 1. PHASE ONE: DISTILLATION (The Janitor Agent)
    // Decouple memory extraction from chat response
    const interactions = profile.recent_interactions || [];
    const distillationResult = await distillContext(profile, interactions);

    // 2. PHASE TWO: THE RULES ENGINE (The Safety Gate)
    // Deterministically enforce business logic before synthesis
    const ruleOutput = executeRules(profile, distillationResult?.extracted_updates);

    if (ruleOutput) {
        profile.state_machine.nurturing_pattern_active = ruleOutput.nextState;

        if (ruleOutput.autoHandoff) {
            profile.agent_intervention = {
                requires_intervention: true,
                trigger_reason: ruleOutput.reason
            };
            profile.state_machine.current_stage = 'CLOSURE';
        }

        // Apply sanitized updates from the rules engine
        const updates = ruleOutput.finalGatedUpdates;
        if (updates) {
            if (!profile.trip_context) profile.trip_context = {};
            if (!profile.intent_profile) profile.intent_profile = {};
            if (!profile.personal_profile) profile.personal_profile = {};

            if (updates.traveler_name && updates.traveler_name !== 'Unknown') profile.personal_profile.demographics = updates.traveler_name;
            if (updates.destinations && updates.destinations.length > 0) profile.trip_context.destinations_considered = updates.destinations;
            if (updates.budget_value) profile.trip_context.budget = { value: updates.budget_value, currency: 'GBP' };
            if (updates.vibe) profile.intent_profile.primary_motivation = updates.vibe;
            if (updates.duration_days) profile.trip_context.duration_days = updates.duration_days;
            if (updates.companions) profile.personal_profile.travel_companions = updates.companions;
            if (updates.deal_breakers) profile.intent_profile.deal_breakers = updates.deal_breakers;
        }

        if (distillationResult?.updated_historical_summary) {
            profile.historical_summary = distillationResult.updated_historical_summary;
        }
    }

    const pattern = profile.state_machine.nurturing_pattern_active;
    const catalog = getKnowledgeBase();

    // 2. PHASE TWO: MATCHING (The Matchmaker Agent)
    // Decouple inventory selection from synthesis
    let matches = { matched_packages: [] };
    if (pattern !== 'INTENT_DISCOVERY') {
        matches = await matchInventory(profile, catalog);
        console.log('💍 Inventory Matched:', matches.matched_packages.length, 'items');
    }

    // 3. PHASE THREE: SYNTHESIS (The Concierge Persona Agent)
    const configStr = await redis.get('global_settings');
    const globalConfig = configStr ? JSON.parse(configStr) : {};

    const languageStr = profile.agent_config?.language || globalConfig.language || 'English';
    const toneStr = profile.agent_config?.tone || globalConfig.agent_tone || 'warm, deeply empathetic, and highly personalized';

    // Calculate missing critical context for targeted nurturing
    // Priority: Vibe (Why) > Destination (Where) > Budget (How Much)
    const missingContext = [];
    if (!profile.intent_profile?.primary_motivation) missingContext.push("vibe/motivation (why they are traveling)");
    if (!profile.trip_context?.destinations_considered || profile.trip_context.destinations_considered.length === 0) missingContext.push("destination");
    if (!profile.trip_context?.budget?.value) missingContext.push("budget (investment level)");

    const synthesisPrompt = `
    ROLE: You are TripNour's elite, consultative luxury travel concierge. 
    TONE: Consultative, professional, and deeply empathetic. Maximum 2-3 short sentences. 

    CONTEXT:
    State: ${pattern}
    Knowledge Base Matches: ${JSON.stringify(matches.matched_packages)}
    Traveler Profile: ${profile.historical_summary}
    Missing Profile Data: ${missingContext.join(', ') || 'None'}

    INSTRUCTIONS:
    1. Discovery Phase (INTENT_DISCOVERY state): Your ONLY goal is to understand the traveler's heart and reason for travel. NEVER ask for budget in this state. If the "vibe/motivation" is missing, ask ONE beautiful question to uncover why they are seeking this trip. 
    2. Exploration Phase (EXPLORATION state): Once you have the vibe and destination, you can naturally introduce ONE matching idea. Pitch it as a "vision" to see if it resonates. IF AND ONLY IF the user reacts positively to the vision, you may then ask for their investment level (budget) to finalize the plan.
    3. ABSOLUTE Rule: Do not overload the user. Ask exactly ONE targeted question or provide ONE recommendation.
    4. Maintain a high-end, consultative posture. You are a partner in their journey, not an interrogator.

    PAST HISTORY: ${interactions.slice(-3).map((m: any) => m.summary).join(' | ')}
    USER: "${recentEvent.object?.content || 'Continue'}"
    `;

    try {
        const targetModel = globalConfig.default_llm || 'gemini-2.5-flash';
        const response = await ai.models.generateContent({
            model: targetModel,
            contents: synthesisPrompt
        });

        const outputText = response.text || "...";

        // Handle metadata updates for HITL
        if (pattern === 'AGENT_HANDOFF') {
            profile.derived_scores = profile.derived_scores || { readiness_score: 0, intent_score: 0 };
            profile.derived_scores.readiness_score += 50;
            profile.agent_intervention = { requires_intervention: true, trigger_reason: 'Synthesis Agent triggered handoff' };
        }

        return outputText;
    } catch (e) {
        console.error('❌ Synthesis Agent Failed:', e);
        return "I'm analyzing the perfect itinerary options for you. What else can I assist with?";
    }
};

