# TripNour - Deployment & Scalability Architecture

To meet the strict `< 500ms` decision latency constraint while ensuring the platform remains modular enough for multi-tenant SaaS adoption (multiple travel agencies/OTAs), the infrastructure is designed around Google Cloud Platform (GCP).

## 1. Infrastructure Overview (GCP & Kubernetes)

The system deploys entirely via **Google Kubernetes Engine (GCP GKE)**, scaling dynamically based on Kafka consumer lag and CPU/Memory usage.

*   **Ingestion Gateway**: Node.js / Go microservices behind **Cloud Load Balancing**.
*   **Event Broker**: **Confluent Kafka on GCP** or **Google Cloud Pub/Sub**. Kafka is preferred for strict sequential topic ordering per user session.
*   **Decision Engine**: Auto-scaling Python (FastAPI) or Node.js workers. Memory footprint is minimal since state is fetched per event.
*   **Database Cluster**:
    *   **Cloud SQL for PostgreSQL**: Highly available primary data node.
    *   **MongoDB Atlas (GCP Region)**: Horizontally sharded document store for flexible Trip Profiles.
    *   **Google Cloud Memorystore (Redis)**: Ultra-low latency cache node holding active session flags and rate limiters.
    *   **Pinecone (Serverless) / Weaviate**: Specially optimized vector databases outside the immediate VPC, connected via Private Service Connect.
*   **AI Orchestrator Layer**: LangChain/LlamaIndex Python workers making parallel calls to the **Google Gemini API** (Vertex AI for compliance and latency guarantees).

## 2. Latency & Performance Strategy (< 500ms Constraint)

Achieving sub-500 millisecond response times on complex AI decision routing requires eliminating DB roundtrips and optimizing the LLM critical path.

### The 500ms Breakdown Guarantee:
1. **Event Ingestion & Routing (10ms - 30ms)**:
   - Request hits Gateway, is immediately written to Kafka, and an HTTP `202 Accepted` is returned to the client. The rest is asynchronous.
2. **Decision Intelligence Processing (30ms - 70ms)**:
   - The Engine consumer picks up the event. 
   - Instead of querying Mongo/Postgres every time, the active `TripProfileState` operates out of **Redis**. Only changed state fields are written back to Mongo asynchronously using a write-behind pattern.
   - The Rule-Engine calculates scores in memory.
3. **Condition Check (Hit vs. Miss) (5ms)**:
   - Does this require Gemini response generation, or just a state update? If state update only, execution ends here (< 105ms total).
4. **AI Generation (200ms - 350ms)**:
   - *Bottleneck*: LLM generation. 
   - *Solution*: Use **Gemini 1.5 Flash** for high-speed deterministic JSON generation, pre-warmed via Vertex AI endpoints.
   - Pinecone Vector lookup runs concurrently with standard user-context fetching.
5. **Message Dispatch (20ms)**:
   - Send payload out via Webhooks (Twilio/SendGrid/Sockets).

## 3. Scalability & Multi-Tenancy

*   **Data Isolation**: PostgreSQL uses a schema-per-tenant or tenant-id column. MongoDB uses tenant-specific collections or strict indexing on `tenant_id`. 
*   **Event Partitioning**: Kafka topics are partitioned by `user_id` or `trip_profile_id` to guarantee that concurrent events for the same profile are processed sequentially by the exact same worker, preventing race conditions on profile scores.
*   **Autoscaling Metrics**: Normal web APIs scale on CPU. The Decision Engine and AI Orchestrators scale up dynamically based on **Kafka Consumer Lag** (Horizontal Pod Autoscaler via Prometheus metrics).

## 4. Multi-Region Deployment Architecture

```mermaid
graph TD
  User((Users/Travelers))
  
  subgraph GCP - Edge
    CDN[Cloud CDN]
    LB[Global HTTPS Load Balancer]
  end

  subgraph GCP - Application VPC (GKE)
    Gateway[Ingestion API Gateway]
    RulesEngine[Decision Intelligence Workers]
    AIWorkers[Gemini Orchestration Workers]
    Dashboard[React Dashboard Node]
  end

  subgraph Managed Services & DBs
    Kafka[Kafka Event Bus]
    Redis[Memorystore Redis]
    Mongo[(MongoDB Atlas)]
    PgSQL[(Cloud SQL Postgres)]
    Vector[(Pinecone Vector DB)]
  end

  subgraph External AI
    Vertex[Vertex AI - Gemini API]
  end

  User -->|Event Tracking / Chat| LB
  LB --> Gateway
  LB --> Dashboard
  
  Gateway -->|Produce Event| Kafka
  Kafka -->|Consume Event| RulesEngine
  RulesEngine <-->|Read/Write Session| Redis
  RulesEngine -.->|Async Backup| Mongo
  RulesEngine -.->|Async Update| PgSQL
  
  RulesEngine -->|Trigger Payload| AIWorkers
  AIWorkers <-->|Fetch Semantic History| Vector
  AIWorkers <--> Vertex
  
  Dashboard <--> PgSQL
```
