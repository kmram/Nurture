import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tripnour_db';

export const connectMongo = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};

const TripProfileSchema = new mongoose.Schema({
    external_user_id: { type: String, required: true, index: true },
    state_machine: {
        current_stage: { type: String, default: 'CURIOSITY' },
        last_transition_at: { type: Date, default: Date.now },
        nurturing_pattern_active: { type: String, default: 'INTENT_DISCOVERY' }
    },
    personal_profile: {
        demographics: String,
        dietary_needs: [String],
        historical_luxury_tier: String,
        travel_companions: String
    },
    trip_context: {
        origin: String,
        destinations_considered: [String],
        date_range: { start: Date, end: Date, is_fixed: Boolean },
        budget: { value: Number, currency: String },
        pax: { adults: Number, children: Number }
    },
    intent_profile: {
        primary_motivation: String,
        emotional_driver: String,
        deal_breakers: [String]
    },
    behavior_profile: {
        price_sensitivity: String,
        decision_speed: String,
        research_depth: String,
        nurturing_preference: String
    },
    derived_scores: {
        intent_score: { type: Number, default: 0 },
        readiness_score: { type: Number, default: 0 },
        confidence_score: { type: Number, default: 0 },
        deal_value: { type: Number, default: 0 }
    },
    historical_summary: { type: String, default: '' },
    recent_interactions: [{ channel: String, timestamp: Date, summary: String }],
    agent_config: {
        language: { type: String, default: 'English' },
        tone: { type: String, default: 'warm, deeply empathetic, and highly personalized' }
    },
    agent_intervention: {
        requires_intervention: { type: Boolean, default: false },
        claimed_by_agent: { type: Boolean, default: false },
        assigned_agent_id: String,
        trigger_reason: String
    }
}, { timestamps: true });

export const TripProfile = mongoose.model('TripProfile', TripProfileSchema);
