# JEE AI Service — Backend Integration Guide

Internal AI microservice for the Quezia JEE exam preparation platform.  
Generates JEE Main mock tests and analyzes student performance using LLM agents.

---

## Quick Start

### 1. Environment Setup

```bash
# Clone and enter the project
cd jee-ai-service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — add at least one API key (see Configuration below)
```

### 2. Load Question Bank (first time only)

```bash
python -m app.data.load_questions
# Loads 14,973 real JEE PYQs into ChromaDB (~3 min)
```

### 3. Run the Server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Verify

```bash
curl http://localhost:8000/health
# → {"status": "healthy", "service": "jee-ai-service", "version": "2.0.0"}
```

**Swagger UI**: `http://localhost:8000/docs`  
**ReDoc**: `http://localhost:8000/redoc`

---

## API Reference

### Base URL

```
https://<your-host>/
```

### Authentication

No authentication required (internal service). Protect via network policy / API gateway.

---

### `GET /health` — Health Check

```bash
curl http://localhost:8000/health
```

**Response** `200`:
```json
{
  "status": "healthy",
  "service": "jee-ai-service",
  "version": "2.0.0"
}
```

---

### `POST /ai/generate` — Generate Mock Test

Generates a JEE Main mock test using async batched LLM calls.

#### Request

```json
{
  "user_id": "user_abc123",
  "subjects": ["physics", "math", "chemistry"],
  "difficulty": "mixed",
  "questionCount": 90
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `user_id` | string | ✅ | — | Your user identifier |
| `subject` | string | ❌ | — | Single subject: `physics`, `math`, or `chemistry` |
| `subjects` | string[] | ❌ | — | Multiple subjects (overrides `subject`) |
| `topic` | string | ❌ | null | Specific topic (e.g., `"Thermodynamics"`) |
| `difficulty` | string | ❌ | `"mixed"` | `easy`, `medium`, `hard`, or `mixed` |
| `questionCount` | int | ❌ | 30 | Questions to generate (2–200). Use **90** for full JEE Main |
| `question_type` | string | ❌ | `"mixed"` | `mcq`, `numerical`, or `mixed` |

> **Note**: You must provide either `subject` or `subjects`. At least one is required.

#### JEE Main Test Pattern (90 questions)

When `questionCount = 90` with all 3 subjects, the service follows the official JEE Main pattern:

| Per Subject | MCQ | Numerical | Total |
|---|---|---|---|
| Physics | 20 | 10 | 30 |
| Math | 20 | 10 | 30 |
| Chemistry | 20 | 10 | 30 |
| **Total** | **60** | **30** | **90** |

#### Response

```json
{
  "user_id": "user_abc123",
  "test_questions": [
    {
      "questionId": "PHY-THERMO-000342",
      "subject": "Physics",
      "topic": "Thermodynamics",
      "subtopic": "Heat Engines and Efficiency",
      "difficulty": "medium",
      "questionType": "MCQ",
      "contentPayload": {
        "question": "A Carnot engine operates between...",
        "options": [
          {"key": "A", "text": "25%"},
          {"key": "B", "text": "40%"},
          {"key": "C", "text": "50%"},
          {"key": "D", "text": "60%"}
        ]
      },
      "correctAnswer": "B",
      "explanation": "",
      "marks": 4,
      "negativeMark": -1,
      "timeLimit": 120,
      "question_number": 1,
      "_snapshot": {
        "snapshotAt": "2026-02-24T10:51:11.282Z",
        "immutable": true
      }
    }
  ],
  "test_metadata": {
    "test_name": "JEE Main Mock Test — Physics, Math, Chemistry",
    "description": "Multi-Subject mock test with 90 questions...",
    "total_questions": 90,
    "duration_minutes": 270,
    "marking_scheme": {
      "mcq": {"correct": 4, "incorrect": -1, "unattempted": 0},
      "numerical": {"correct": 4, "incorrect": 0, "unattempted": 0}
    },
    "subject_distribution": {"Physics": 30, "Math": 30, "Chemistry": 30},
    "difficulty_distribution": {"easy": 21, "medium": 42, "hard": 27},
    "question_type_distribution": {"MCQ": 60, "numeric": 30},
    "topics_covered": ["Thermodynamics", "Calculus", "..."],
    "instructions": ["Total Questions: 90", "Duration: 270 minutes", "..."]
  }
}
```

#### Question Object Fields

| Field | Type | Description |
|---|---|---|
| `questionId` | string | Unique ID, format: `SUB-TOPIC-XXXXXX` |
| `subject` | string | `Physics`, `Math`, or `Chemistry` |
| `topic` | string | Chapter/topic name |
| `subtopic` | string | Specific concept tested |
| `difficulty` | string | `easy`, `medium`, or `hard` |
| `questionType` | string | `MCQ` or `numeric` |
| `contentPayload.question` | string | The question text |
| `contentPayload.options` | object[] | MCQ options (absent for numeric) |
| `correctAnswer` | string | `A`/`B`/`C`/`D` for MCQ, number string for numeric |
| `explanation` | string | Step-by-step solution (empty for test questions) |
| `marks` | int | Points for correct answer (always 4) |
| `negativeMark` | float | Penalty for wrong answer (MCQ: -1, numeric: 0) |
| `timeLimit` | int | Seconds per question (MCQ: 120, numeric: 180) |
| `_snapshot` | object | Immutability metadata |

#### cURL Example

```bash
# Full JEE Main mock test
curl -X POST http://localhost:8000/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "subjects": ["physics", "math", "chemistry"],
    "difficulty": "mixed",
    "questionCount": 90
  }'

# 10 easy physics questions on Kinematics
curl -X POST http://localhost:8000/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "subject": "physics",
    "topic": "Kinematics",
    "difficulty": "easy",
    "questionCount": 10
  }'
```

#### Timing

| Questions | Approximate Time | LLM Calls |
|---|---|---|
| 10 | ~15s | 2 batches |
| 30 | ~30s | 6 batches |
| 90 | ~60-90s | 18 batches |

---

### `POST /ai/analyze` — Performance Analysis

Analyzes a completed test attempt and returns AI-generated insights + study plan.

#### Request

```json
{
  "user_id": "user_abc123",
  "raw_attempt_data": {
    "attempts": [
      {
        "question_id": "PHY-THERMO-000342",
        "subject": "physics",
        "topic": "Thermodynamics",
        "difficulty": "medium",
        "is_correct": true,
        "time_taken_seconds": 95,
        "question_type": "mcq"
      },
      {
        "question_id": "MAT-CALC-001247",
        "subject": "math",
        "topic": "Calculus",
        "difficulty": "hard",
        "is_correct": false,
        "time_taken_seconds": 210,
        "question_type": "mcq"
      }
    ]
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `user_id` | string | ✅ | Your user identifier |
| `raw_attempt_data.attempts` | object[] | ✅ | Array of attempt objects |
| `attempts[].question_id` | string | ✅ | Question ID from generation |
| `attempts[].subject` | string | ✅ | `physics`, `math`, `chemistry` |
| `attempts[].topic` | string | ✅ | Topic name |
| `attempts[].difficulty` | string | ✅ | `easy`, `medium`, `hard` |
| `attempts[].is_correct` | bool | ✅ | Whether the answer was correct |
| `attempts[].time_taken_seconds` | int | ✅ | Time spent on this question |
| `attempts[].question_type` | string | ❌ | `mcq` or `numeric` |

#### Response

```json
{
  "user_id": "user_abc123",
  "performance_metrics": {
    "overall_accuracy": 0.65,
    "accuracy_by_subject": {"physics": 0.7, "math": 0.5, "chemistry": 0.75},
    "accuracy_by_topic": {"Thermodynamics": 0.8, "Calculus": 0.3},
    "time_analysis": {
      "avg_time_per_question": 125,
      "time_by_difficulty": {"easy": 60, "medium": 120, "hard": 200}
    },
    "strengths_weaknesses": {
      "strengths": ["Thermodynamics", "Organic Chemistry"],
      "weaknesses": ["Calculus", "Electromagnetism"]
    }
  },
  "insights": {
    "overall_assessment": "Good performance in Physics, needs improvement in Math...",
    "weak_topics": [{"topic": "Calculus", "accuracy": 0.3, "recommendation": "..."}],
    "strong_topics": [{"topic": "Thermodynamics", "accuracy": 0.8}],
    "patterns": ["Struggles with multi-step problems", "..."],
    "recommendations": ["Focus on integration techniques", "..."],
    "priority_actions": ["Practice 5 Calculus problems daily", "..."]
  },
  "study_plan": {
    "weekly_plan": [
      {"day": "Monday", "focus": "Calculus - Integration", "duration_minutes": 60},
      {"day": "Tuesday", "focus": "Electromagnetism", "duration_minutes": 45}
    ],
    "focus_areas": ["Calculus", "Electromagnetism"],
    "recommended_practice": {"daily_questions": 10, "weekly_mock_tests": 1}
  }
}
```

---

### `POST /ai/parse-intent` — Natural Language Parser

Converts a student's natural language prompt into structured test generation parameters.

#### Request

```json
{
  "user_id": "user_abc123",
  "prompt": "give me a hard physics test on thermodynamics with 20 questions"
}
```

#### Response

```json
{
  "subjects": ["physics"],
  "topic": "thermodynamics",
  "difficulty": "hard",
  "questionCount": 20
}
```

#### Usage Pattern

Call `parse-intent` first, then pass the parsed result to `/ai/generate`:

```javascript
// Step 1: Parse user intent
const intent = await fetch('/ai/parse-intent', {
  method: 'POST',
  body: JSON.stringify({ user_id: 'u1', prompt: userInput })
});
const parsed = await intent.json();

// Step 2: Generate test with parsed parameters
const test = await fetch('/ai/generate', {
  method: 'POST',
  body: JSON.stringify({ user_id: 'u1', ...parsed })
});
```

---

## Error Handling

All errors return standard HTTP status codes with JSON bodies:

| Status | Meaning |
|---|---|
| `200` | Success |
| `400` | Validation error (bad input) |
| `422` | Pydantic validation failure |
| `500` | Internal server error |

```json
{
  "error": "Internal server error",
  "detail": "subject or subjects is required"
}
```

> In `development` mode, `detail` includes the full error message. In `production`, it's generic.

---

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Default | Description |
|---|---|---|---|
| **API Keys** | | | |
| `GROQ_API_KEY` | ✅* | — | Groq API key |
| `OPENAI_API_KEY` | ✅* | — | OpenAI API key |
| `OPENROUTER_API_KEY` | ✅* | — | OpenRouter API key |
| `PINECONE_API_KEY` | Required for RAG | — | Pinecone API key |
| **LLM Config** | | | |
| `LLM_PROVIDER` | ❌ | `openrouter` | `openrouter`, `groq`, or `openai` |
| `LLM_MODEL` | ❌ | `openai/gpt-4o-mini` | Model identifier |
| `LLM_TEMPERATURE` | ❌ | `0.3` | 0.0–1.0 |
| `LLM_MAX_TOKENS` | ❌ | `8192` | Max tokens per response |
| `LLM_MAX_CONCURRENT` | ❌ | `5` | Max concurrent LLM calls |
| **Embeddings** | | | |
| `EMBEDDING_PROVIDER` | ❌ | `openrouter` | Embedding API provider |
| `EMBEDDING_MODEL` | ❌ | `openai/text-embedding-3-large` | Embedding model used for Pinecone |
| `EMBEDDING_DIMENSION` | ❌ | `3072` | Pinecone vector dimension for the embedding model |
| **Service** | | | |
| `LOG_LEVEL` | ❌ | `INFO` | `DEBUG`, `INFO`, `WARNING`, `ERROR` |
| `ENVIRONMENT` | ❌ | `development` | `development` or `production` |
| `MAX_RETRIES` | ❌ | `3` | LLM retry attempts |

> *At least **one** API key is required. Choose the provider matching your key.

### Recommended Providers

| Provider | Model | Speed | Cost | Best For |
|---|---|---|---|---|
| **OpenRouter** | `openai/gpt-4o-mini` | Medium | Low | Default routing and model flexibility |
| **Groq** | `llama-3.3-70b-versatile` | Fast | Free tier | Development |
| **OpenAI** | `gpt-4o-mini` | Medium | Low | Direct OpenAI fallback |

---

## Deployment

### Docker

```bash
# Build
docker build -t jee-ai-service .

# Run
docker run -d \
  --name jee-ai \
  -p 8000:8000 \
  --env-file .env \
  jee-ai-service
```

### Docker Compose

```yaml
version: "3.8"
services:
  jee-ai:
    build: .
    ports:
      - "8000:8000"
    env_file: .env
    volumes:
      - ./app/data/chroma_db:/app/app/data/chroma_db  # Persist vector store
    healthcheck:
      test: ["CMD", "python", "-c", "from urllib.request import urlopen; urlopen('http://localhost:8000/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
```

### Cloud Deployment Notes

| Platform | Config |
|---|---|
| **Railway** | Set env vars in dashboard, expose port 8000 |
| **Render** | Web service, Docker or Python runtime, port 8000 |
| **AWS ECS** | Use Dockerfile, 2GB+ RAM recommended |
| **Google Cloud Run** | Dockerfile, min 1 instance for cold start |

> **Important**: The ChromaDB vector store (~50MB) is stored locally at `app/data/chroma_db/`. Mount this as a persistent volume in production, or run `python -m app.data.load_questions` on first deploy.

> **Memory**: Requires ~2GB RAM (embedding model ~400MB + ChromaDB + LLM client).

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    FastAPI Server                     │
│                                                       │
│  POST /ai/generate ──→ Test Assembler                │
│                          ├─ Batch Generator (5/call)  │
│                          ├─ Knowledge Base (PYQ data) │
│                          └─ Diagram Generator         │
│                                                       │
│  POST /ai/analyze ──→ LangGraph Pipeline             │
│                        ├─ Performance Analysis        │
│                        ├─ Insight Generator           │
│                        └─ Study Plan Generator        │
│                                                       │
│  POST /ai/parse-intent ──→ LLM (single call)        │
│                                                       │
│  Data Layer:                                          │
│  ├─ ChromaDB (14,973 PYQs, vector search)            │
│  ├─ Knowledge Base (weightage + trends)              │
│  └─ Sentence Transformers (embeddings)               │
└─────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Component | Technology |
|---|---|
| Framework | FastAPI 0.128 |
| LLM Orchestration | LangGraph 1.0 |
| Vector Store | ChromaDB 1.4 |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| LLM Providers | HuggingFace / Groq / OpenAI / OpenRouter |
| Validation | Pydantic v2 |
| Logging | structlog |
