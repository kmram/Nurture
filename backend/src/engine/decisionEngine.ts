import { redis } from '../db/redis';
import { TripProfile } from '../db/mongo';
import { triggerNurturingAI } from '../ai/geminiOrchestrator';

export const processEvent = async (event: any) => {
    const { actor, action, object } = event;
    const userId = actor.user_id;

    // 1. Rapid State Retrieval (Redis -> Mongo fallback)
    let profileCache = await redis.get(`profile:${userId}`);
    let profile;

    if (profileCache) {
        profile = JSON.parse(profileCache);
    } else {
        profile = await TripProfile.findOne({ external_user_id: userId }) || new TripProfile({ external_user_id: userId });
    }

    // 2. Base Scoring & Logic Engine
    if (action === 'VIEW_PACKAGE') {
        profile.derived_scores.intent_score += 10;
        if (!profile.trip_context) profile.trip_context = { destinations_considered: [] };
        if (!profile.trip_context.destinations_considered) profile.trip_context.destinations_considered = [];
        if (object.metadata?.destination && !profile.trip_context.destinations_considered.includes(object.metadata?.destination)) {
            profile.trip_context.destinations_considered.push(object.metadata?.destination);
        }
    } else if (action === 'COMPARE_PACKAGES') {
        profile.derived_scores.readiness_score += 20;
        profile.state_machine.current_stage = 'COMPARISON';
        profile.state_machine.nurturing_pattern_active = 'VALIDATION';
    }

    // 3. Save User message to history
    if (action === 'TRIGGER_AI' && object?.content) {
        profile.recent_interactions.push({
            channel: 'WEB_CHAT',
            timestamp: new Date(),
            summary: `USER: ${object.content}`
        });
    }

    // 4. Check for Human Handoff Threshold
    let responseText = null;

    // Hand over to highly rated agents if readiness>50 or intent>80
    if ((profile.derived_scores.readiness_score >= 50 || profile.derived_scores.intent_score >= 80) && !profile.agent_intervention.requires_intervention) {
        profile.agent_intervention.requires_intervention = true;
        profile.agent_intervention.trigger_reason = 'High Readiness / Intent Score Reached';
        profile.state_machine.current_stage = 'CLOSURE';
        profile.state_machine.nurturing_pattern_active = 'AGENT_HANDOFF';

        responseText = "I have everything we need! I'm bringing in one of our luxury travel consultants right now to finalize the perfect package for you.";

        profile.recent_interactions.push({
            channel: 'SYSTEM_AGENT',
            timestamp: new Date(),
            summary: `SYSTEM: Triggered human handoff. Reason: ${profile.agent_intervention.trigger_reason}`
        });
    } else if (!profile.agent_intervention.requires_intervention) {
        // 5. Trigger AI if appropriate constraints are met and no human intervention is needed
        if (profile.state_machine.nurturing_pattern_active === 'VALIDATION' || action === 'TRIGGER_AI') {
            responseText = await triggerNurturingAI(profile, event);
            if (responseText) {
                profile.recent_interactions.push({
                    channel: 'AI_AGENT',
                    timestamp: new Date(),
                    summary: `AI: ${responseText}`
                });
            }
        }
    }

    // 5. Save State (After AI executes so history is captured)
    await redis.set(`profile:${userId}`, JSON.stringify(profile), 'EX', 86400); // 1 day expiry cache

    const updatePayload = typeof profile.toObject === 'function' ? profile.toObject() : profile;
    delete updatePayload._id;
    delete updatePayload.__v;

    TripProfile.updateOne(
        { external_user_id: userId },
        { $set: updatePayload },
        { upsert: true }
    ).exec().catch(err => console.error("Mongo persistence error:", err));

    return responseText;
};
