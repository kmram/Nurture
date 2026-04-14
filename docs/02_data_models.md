# TripNour - Data Models & Schemas

The TripNour system handles extremely high verbosity data (behavioral clicks, views) alongside complex, slow-changing structural data (Trip Needs, Constraints, Scores). Our polyglot strategy enables parsing these effectively.

## 1. Trip Profile (MongoDB Document Schema)

The core entity. Instead of a rigid relational format, we use a document structure, allowing nested components, rapid schema evolution, and embedded arrays for temporary context tracking.

### Schema: `trip_profiles`
```json
{
  "_id": "tp_89f3a9a2bc",
  "external_user_id": "crm_usr_1029",       // Link to underlying CRM/OTA identity
  "created_at": "2026-03-24T10:00:00Z",
  "updated_at": "2026-03-24T12:05:00Z",
  
  "state_machine": {
    "current_stage": "COMPARISON",          // CURIOSITY | EXPLORATION | NARROWING | COMPARISON | DECISION | CLOSURE
    "last_transition_at": "2026-03-24T12:00:00Z",
    "nurturing_pattern_active": "VALIDATION"// Inspiration, Shortlisting, Validation, Confidence Building, Conversion
  },

  "personal_profile": {
    "demographics": "Millennial",
    "dietary_needs": ["Vegan", "Gluten-Free"],
    "historical_luxury_tier": "Four Seasons / Aman",
    "travel_companions": "Partner"
  },

  "trip_context": {
    "origin": "JFK",
    "destinations_considered": ["DPS", "MLE"],
    "date_range": {
      "start": "2026-09-10",
      "end": "2026-09-24",
      "is_fixed": false
    },
    "budget": {
      "value": 8500,
      "currency": "USD"
    },
    "pax": {
      "adults": 2,
      "children": 0
    }
  },

  "intent_profile": {
    "primary_motivation": "Honeymoon (Burnout Recovery)",
    "emotional_driver": "Deep Relaxation & Serenity",
    "deal_breakers": ["Crowded family resorts", "Long transfer times"]
  },

  "behavior_profile": {
    "price_sensitivity": "LOW",
    "decision_speed": "FAST",
    "research_depth": "SURFACE_LEVEL",
    "nurturing_preference": "CONCIERGE_HAND_HOLDING"
  },

  "derived_scores": {
    "intent_score": 85,          // 0-100 (How serious are they?)
    "readiness_score": 90,       // 0-100 (How close to booking?)
    "confidence_score": 45,      // 0-100 (How sure are they about the current option?)
    "deal_value": 7500           // Estimated cart size
  },

  "recent_interactions": [
    {
      "channel": "WEB_CHAT",
      "timestamp": "2026-03-24T12:03:00Z",
      "summary": "User asked about weather in Bali vs Maldives in September."
    }
  ],

  "agent_intervention": {
    "requires_intervention": true,
    "assigned_agent_id": null,
    "trigger_reason": "High Readiness + High Value + Low Confidence Drop-off Risk"
  }
}
```

## 2. Ingestion Events (Kafka Standardized Schema)

All signals entering the system must be normalized to standard event JSON before being digested by the Decision Engine.

### Event Envelope
```json
{
  "event_id": "evt_091823719823",
  "timestamp": "2026-03-24T12:05:00Z",
  "actor": {
    "user_id": "crm_usr_1029",
    "session_id": "sess_891238912",
    "device": "MOBILE_WEB"
  },
  "action": "FAVORITE_ITEM", // SEARCH, VIEW, CLICK, FAVORITE, MESSAGE_SENT, CART_ABANDON
  "object": {
    "type": "HOTEL_PACKAGE",
    "id": "pkg_bali_ritz_01",
    "metadata": {
      "name": "Ritz-Carlton Bali 7-Night",
      "price": 3500
    }
  },
  "context": {
    "referrer": "google_search",
    "campaign_id": "sep_honeymoon_promo"
  }
}
```

## 3. Semantic Memory (Pinecone Vector DB)

To give the Nurturing AI (Gemini) a deep understanding of the user without blowing up context windows, conversational turns and significant behavior patterns are embedded as vectors.

### Vector Schema
- **Vector ID**: Hash of the interaction log
- **Vector Embeddings**: Dense vector from `text-embedding-gecko` or related.
- **Metadata**:
  - `trip_profile_id`: "tp_89f3a9a2bc"
  - `timestamp`: "2026-03-24T12:03:00Z"
  - `content_type`: "USER_MESSAGE" | "OBJECTION" | "PREFERENCE_STATED"
  - `raw_text`: "I'm worried it might rain too much in Maldives in September."
