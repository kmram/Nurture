/**
 * TripNour Deterministic Rules Engine
 * This layer enforces absolute business constraints and state transitions.
 * It does NOT use LLM logic. It uses hard-coded TypeScript rules.
 */

export const executeRules = (profile: any, extractedUpdates: any) => {
    console.log('⚖️ Executing Deterministic Rules Engine...');

    let nextState = profile.state_machine.nurturing_pattern_active;
    let autoHandoff = false;
    let reason = '';

    // 1. DATA COMPLETENESS CHECK (Budget & Vibe Gating)
    const hasBudget = profile.trip_context?.budget?.value > 0 || extractedUpdates?.budget_value > 0;
    const hasVibe = profile.intent_profile?.primary_motivation || extractedUpdates?.vibe;
    const hasDest = profile.trip_context?.destinations_considered?.length > 0 || extractedUpdates?.destinations?.length > 0;

    // Promotion Logic: Discovery -> Exploration
    // We only move to EXPLORATION once we have established a clear intent (Vibe + Destination).
    // Budget is a gate for VALIDATION, but should NOT trigger discovery-to-exploration on its own.
    const contextScore = (hasDest ? 1 : 0) + (hasVibe ? 1 : 0);

    if (nextState === 'INTENT_DISCOVERY' && contextScore >= 2) {
        nextState = 'EXPLORATION';
        console.log('📈 RULE: Context established (Dest + Vibe). Moving to EXPLORATION.');
    }

    // 2. HIGH-VALUE LEAD GATING (The Patentable Moat)
    // If budget is massive or explicit "book now" keywords detected
    const budgetThreshold = 25000; // GBP
    const currentBudget = extractedUpdates?.budget_value || profile.trip_context?.budget?.value || 0;

    if (currentBudget >= budgetThreshold) {
        autoHandoff = true;
        reason = `High-value lead detected (£${currentBudget}). Immediate concierge intervention required.`;
    }

    // 3. HARD REJECTION CHECK (Regal/Spiritual Pivot Safeguard)
    // If the user has a "deal breaker" that conflicts with inventory, we can force a special state.
    const dealBreakers = extractedUpdates?.deal_breakers || profile.intent_profile?.deal_breakers || [];
    if (dealBreakers.includes('Not in Asia') && nextState === 'VALIDATION') {
        // Force back to Exploration to find non-Asian properties if they are in Validation
        // This prevents the AI from "hard selling" the wrong inventory.
        // nextState = 'EXPLORATION';
    }

    return {
        nextState,
        autoHandoff,
        reason,
        finalGatedUpdates: {
            ...extractedUpdates,
            // We can sanitize updates here (e.g. capping budget, normalizing names)
            budget_value: extractedUpdates?.budget_value || profile.trip_context?.budget?.value || 0
        }
    };
};
