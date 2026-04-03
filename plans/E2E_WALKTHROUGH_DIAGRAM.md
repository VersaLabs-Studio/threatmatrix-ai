# E2E Real Traffic Walkthrough — Architecture & Data Flow

## System Architecture for Demo Walkthrough

```mermaid
flowchart TB
    subgraph Local Machine
        A[Browser - Frontend]
        B[Attack Scripts]
    end
    
    subgraph VPS - 187.124.45.161
        C[FastAPI Backend :8000]
        D[PostgreSQL]
        E[Redis]
        F[ML Worker]
        G[Capture Engine]
        H[PCAP Processor]
    end
    
    subgraph External Services
        I[OpenRouter - LLM]
        J[Threat Intel Feeds]
    end
    
    B -- SYN packets --> C
    B -- PCAP upload --> H
    H --> C
    C --> D
    C --> E
    E -- flows:live --> F
    F -- ml:scored --> C
    C -- async --> I
    I -- AI narrative --> C
    C -- IOC check --> J
    A -- REST API --> C
    A -- WebSocket --> C
```

## Data Flow for Each Demo Step

```mermaid
sequenceDiagram
    participant U as User/Browser
    participant FE as Frontend
    participant BE as Backend API
    participant DB as PostgreSQL
    participant ML as ML Worker
    participant LLM as OpenRouter
    
    Note over U,LLM: Step 1: War Room
    U->>FE: Open /war-room
    FE->>BE: GET /flows/stats, /alerts/
    BE->>DB: Query data
    DB-->>BE: Results
    BE-->>FE: JSON response
    FE-->>U: Display metrics + map
    
    Note over U,LLM: Step 2: Attack
    U->>BE: nmap SYN packets
    BE->>DB: Store flows
    BE->>ML: Score via Redis
    ML-->>BE: anomaly_score
    BE->>DB: Create alert
    BE-->>FE: WebSocket new_alert
    FE-->>U: Alert appears in feed
    
    Note over U,LLM: Step 3: Alert Console
    U->>FE: Open /alerts
    FE->>BE: GET /alerts/id
    BE-->>FE: Alert + AI narrative
    FE-->>U: Display detail
    
    Note over U,LLM: Step 4: AI Analyst
    U->>FE: Send query
    FE->>BE: POST /llm/chat
    BE->>LLM: Stream request
    LLM-->>BE: Streaming tokens
    BE-->>FE: SSE stream
    FE-->>U: Typing effect
```

## Component Status Assessment

| Component | Expected | Current Status | Action Needed |
|-----------|----------|----------------|---------------|
| Frontend | Running | Unknown | Verify localhost:3000 or Vercel |
| Backend API | Healthy | ✅ Healthy | None |
| PostgreSQL | Connected | ⚠️ Pending | May need restart |
| Redis | Connected | ✅ Healthy | None |
| ML Worker | Active | ⚠️ Idle | May need restart for live scoring |
| Capture Engine | Active | ⚠️ Idle | Expected - use PCAP upload |
| LLM Gateway | Available | Unknown | Test with chat query |
| Threat Intel | Synced | Unknown | Check IOC count |

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Database connection fails | Medium | High | Restart backend container |
| ML Worker not scoring | Medium | High | Use PCAP upload (pre-scored) |
| LLM API timeout | Low | Medium | Use cached narratives |
| Frontend build errors | Low | Medium | Use dev server instead |
| WebSocket disconnect | Low | Low | Page still shows data via REST |

## Recommended Approach

Given the current VPS state (ML Worker idle, Capture Engine idle), the **most reliable approach** is:

1. **Use PCAP upload for attack simulation** — bypasses capture engine, uses pre-processed heuristic scoring
2. **Verify existing alerts** — Tasks 1-2 already generated 590 alerts; use these for Steps 3-4
3. **Test live components only** — AI Analyst, Reports, Intel, Admin don't depend on live ML

This minimizes risk while still demonstrating the full E2E pipeline.
