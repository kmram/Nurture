# TripNour - API Design

The API strategy follows a multi-tier approach:
1. **High-Throughput Ingestion** (`/ingest`): Receives signals asynchronously.
2. **Dashboard / Operations** (`/api/v1`): GraphQL/REST endpoints for the React agent dashboard.
3. **Communication Webhooks**: Webhooks receiving replies from Twilio/SendGrid.

## 1. Ingestion Layer Core APIs (REST)

### `POST /v1/events/ingest`
- **Purpose**: Unified endpoint for tracking scripts, CRMs, and OTAs to send raw events.
- **Latency Target**: < 30ms (Publishes directly to Kafka and returns 202 Accepted).
- **Request Body**:
  ```json
  {
    "client_id": "tenant_001",
    "events": [
      {
         // Standard Event Envelope (See 02_data_models.md)
      }
    ]
  }
  ```
- **Response**: `202 Accepted`


## 2. Core Service API (For Agent Dashboard & Integrations)

### `GET /v1/profiles`
- **Purpose**: Fetch a paginated, filterable list of active Trip Profiles. Used by the Agent Dashboard for the "Hot Leads" view.
- **Query Params**:
  - `min_readiness` (e.g., 80)
  - `requires_intervention` (boolean)
  - `stage` (e.g., "COMPARISON")
- **Response**:
  ```json
  {
    "data": [
      {
        "profile_id": "tp_89f3a9a2bc",
        "state_machine": { "current_stage": "COMPARISON" },
        "derived_scores": { "readiness": 90, "deal_value": 7500 },
        "agent_intervention": { "requires_intervention": true }
      }
    ],
    "pagination": { "next_cursor": "..." }
  }
  ```

### `GET /v1/profiles/{profile_id}`
- **Purpose**: Deep dive into a specific user's trip state, intent, and conversational history.

### `POST /v1/profiles/{profile_id}/intervene`
- **Purpose**: Agent manually claims a trip profile to prevent the AI from auto-responding (Human-in-the-loop).
- **Request Body**:
  ```json
  {
    "agent_id": "ag_991823",
    "action": "CLAIM",  // Or RELEASE (to hand back to AI)
    "reason": "High-value custom itinerary request"
  }
  ```
- **Response**: `200 OK`

### `POST /v1/profiles/{profile_id}/nba` (Next Best Action)
- **Purpose**: Agent requests the Intelligence Engine & Nurturing AI to generate a recommended talk track on the fly.
- **Response**:
  ```json
  {
    "recommended_action": "Send Validation message emphasizing September weather patterns in Bali.",
    "suggested_copy": "Hi! I noticed you were looking at Bali and the Maldives for September...",
    "confidence": 0.92
  }
  ```


## 3. Webhook Integration Endpoints

### `POST /webhooks/twilio/message`
- **Purpose**: Receives inbound WhatsApp/SMS messages.
- **Behavior**: 
  - Standardizes to an `Event Envelope` (action: `MESSAGE_RECEIVED`).
  - Writes to Kafka.
  - Decision Engine processes the intent; Nurturing AI generates the reply if the profile is not locked by an Agent.

### `POST /webhooks/crm/update`
- **Purpose**: Syncs offline changes from Salesforce/Hubspot back into the Trip Profile.


## 4. Real-Time Dashboard (WebSocket)

### `WSS /v1/stream/agent/{agent_id}`
- **Purpose**: Pushes live updates to the React Dashboard.
- **Events Triggers**:
  - `PROFILE_SCORE_CHANGE`: Sent when readiness jumps significantly.
  - `INTERVENTION_REQUIRED`: Sent when a profile enters a high-risk/high-value state requiring human touch.
  - `USER_MESSAGE_RECEIVED`: Live chat mapping.
