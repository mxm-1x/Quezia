"""
FastAPI Application - Main Entry Point
JEE AI Microservice — called by the main Quezia backend.

Two endpoints:
  POST /ai/generate  — question & test generation (async by default)
  POST /ai/analyze   — performance analysis + AI insights
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import time
import traceback

from app.core.state import AIState
from app.core.config import settings
from app.core.logging import configure_logging, get_logger
from app.graph import get_graph
from app.models.api_schemas import (
    GenerateRequest,
    GenerateResponse,
    AnalyzeRequest,
    AnalyzeResponse,
)
from app.core.llm import get_llm

# Configure logging
configure_logging(settings.LOG_LEVEL)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info("application_starting", environment=settings.ENVIRONMENT)
    
    # Validate configuration
    try:
        settings.validate()
        logger.info("configuration_validated")
    except ValueError as e:
        logger.error("configuration_validation_failed", error=str(e))
        raise
    
    # Initialize graph
    try:
        graph = get_graph()
        logger.info("graph_initialized")
    except Exception as e:
        logger.error("graph_initialization_failed", error=str(e))
        raise

    # Pre-load Vector Store (loads embedding model ~400MB)
    try:
        from app.data.vector_store import get_vector_store
        # We wrap this in a thread to avoid blocking the event loop if it's slow,
        # though lifespan is async anyway.
        await asyncio.to_thread(get_vector_store)
        logger.info("vector_store_preloaded")
    except Exception as e:
        # We don't necessarily want to kill the app if vector store fails,
        # but we should log it. Actually, if it's OOM, it will kill itself.
        logger.warning("vector_store_preload_failed", error=str(e))
    
    yield
    
    logger.info("application_shutting_down")


# OpenAPI tag metadata
tags_metadata = [
    {
        "name": "Generation",
        "description": "Generate JEE mock tests with async batched LLM calls.",
    },
    {
        "name": "Analysis",
        "description": "Analyze completed test attempts — returns performance metrics, "
                       "AI-generated insights, and a personalized study plan.",
    },
    {
        "name": "Health",
        "description": "Service health check.",
    },
]

# Create FastAPI app
app = FastAPI(
    title="JEE AI Service",
    description=(
        "Internal AI microservice for the Quezia JEE exam preparation platform.\n\n"
        "## Endpoints\n\n"
        "| Route | Purpose |\n"
        "|---|---|\n"
        "| `POST /ai/generate` | Test generation (batch) |\n"
        "| `POST /ai/analyze` | Performance analysis + AI insights |\n\n"
        "## Integration\n\n"
        "This service is called **only** by the Quezia core backend — "
        "it is not exposed directly to end users.\n\n"
        "All generation is **async by default** using concurrent LLM calls "
        "(Gemini 2.0 Flash)."
    ),
    version="2.0.0",
    lifespan=lifespan,
    openapi_tags=tags_metadata,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Middleware to log all requests."""
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    
    logger.info(
        "request_completed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration_ms=round(duration * 1000, 2)
    )
    
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(
        "unhandled_exception",
        path=request.url.path,
        error=str(exc),
        traceback=traceback.format_exc()
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.ENVIRONMENT == "development" else "An error occurred"
        }
    )


@app.get("/health", tags=["Health"], summary="Service health check")
async def health_check():
    """Returns service health status, name, and version."""
    return {
        "status": "healthy",
        "service": "jee-ai-service",
        "version": "2.0.0"
    }


# =============================================================================
# PRIMARY ENDPOINTS
# =============================================================================

@app.post(
    "/ai/generate",
    response_model=GenerateResponse,
    response_model_exclude_none=True,
    tags=["Generation"],
    summary="Generate a JEE mock test",
)
async def generate(request: GenerateRequest) -> GenerateResponse:
    """
    Generate a JEE mock test.
    
    Supports two modes:
    - **Structured**: Pass `subject`/`subjects`, `topic`, `difficulty`, `questionCount` directly
    - **Natural Language**: Pass a `prompt` string and the AI auto-parses everything
    
    Examples:
        Structured: {"user_id": "u1", "subjects": ["physics","math","chemistry"], "questionCount": 90}
        NL Prompt:  {"user_id": "u1", "prompt": "give me a hard physics test on thermodynamics"}
    """
    # ── If prompt is provided, auto-parse intent first ──
    if request.prompt:
        logger.info("auto_parsing_intent", user_id=request.user_id, prompt=request.prompt)
        parsed = await _parse_intent(request.prompt)
        
        # Apply parsed values only if not explicitly set in the request
        if not request.subjects and not request.subject:
            request.subjects = parsed.get("subjects", ["physics", "math", "chemistry"])
        if not request.topic:
            request.topic = parsed.get("topic")
        if request.difficulty == "mixed":  # default wasn't overridden
            request.difficulty = parsed.get("difficulty", "mixed")
        if request.question_count == 30:  # default wasn't overridden
            request.question_count = parsed.get("questionCount", 30)
    
    # Require at least one subject
    if not request.subjects and not request.subject:
        raise HTTPException(
            status_code=400,
            detail="subject, subjects, or prompt is required"
        )
    
    state = request.to_state()
    request_id = f"{request.user_id}_{int(time.time())}"
    
    logger.info(
        "generate_request_received",
        request_id=request_id,
        user_id=request.user_id,
        subjects=request.subjects or [request.subject],
        question_count=request.question_count,
    )
    
    try:
        start_time = time.time()
        
        from app.agents.test_assembler import test_assembler as test_assembler_fn
        result = await test_assembler_fn(state)
        
        duration = time.time() - start_time
        
        logger.info(
            "generate_request_completed",
            request_id=request_id,
            duration_seconds=round(duration, 2),
            questions_generated=len(result.get("test_questions", [])),
        )
        
        return GenerateResponse.from_state(result)
        
    except ValueError as e:
        logger.error("generate_validation_error", request_id=request_id, error=str(e))
        raise HTTPException(status_code=400, detail=str(e))
        
    except Exception as e:
        logger.error(
            "generate_request_failed",
            request_id=request_id,
            error=str(e),
            traceback=traceback.format_exc(),
        )
        raise HTTPException(
            status_code=500,
            detail=str(e) if settings.ENVIRONMENT == "development" else "Internal server error",
        )


@app.post(
    "/ai/analyze",
    response_model=AnalyzeResponse,
    response_model_exclude_none=True,
    tags=["Analysis"],
    summary="Analyze performance and generate insights",
)
async def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    """
    Analyze test attempt performance and generate AI insights.
    
    Accepts completed attempt data, returns:
    - Detailed performance metrics (accuracy, time analysis, error clusters)
    - AI-generated insights (weak topics, patterns, recommendations)
    - Personalized study plan
    
    Example:
        {
            "user_id": "u1",
            "raw_attempt_data": {
                "attempts": [
                    {"question_id": "PHY-THERMO-000342", "subject": "physics",
                     "topic": "Thermodynamics", "difficulty": "medium",
                     "is_correct": true, "time_taken_seconds": 95}
                ]
            }
        }
    """
    state = request.to_state()
    request_id = f"{request.user_id}_{int(time.time())}"
    
    logger.info(
        "analyze_request_received",
        request_id=request_id,
        user_id=request.user_id,
        attempt_count=len(request.raw_attempt_data.get("attempts", [])),
    )
    
    try:
        graph = get_graph()
        
        start_time = time.time()
        result = await asyncio.to_thread(graph.invoke, state)
        duration = time.time() - start_time
        
        logger.info(
            "analyze_request_completed",
            request_id=request_id,
            duration_seconds=round(duration, 2),
        )
        
        return AnalyzeResponse.from_state(result)
        
    except ValueError as e:
        logger.error("analyze_validation_error", request_id=request_id, error=str(e))
        raise HTTPException(status_code=400, detail=str(e))
        
    except Exception as e:
        logger.error(
            "analyze_request_failed",
            request_id=request_id,
            error=str(e),
            traceback=traceback.format_exc(),
        )
        raise HTTPException(
            status_code=500,
            detail=str(e) if settings.ENVIRONMENT == "development" else "Internal server error",
        )



# =============================================================================
# INTERNAL HELPERS
# =============================================================================

async def _parse_intent(prompt: str) -> dict:
    """Internal NLP intent parser — extracts structured params from natural language."""
    system_prompt = """You are an expert NLP intent parser for a JEE Main mock test generator.
Your job is to extract structured parameters from a student's natural language request.

Return a JSON object with EXACTLY these fields:
- `subjects`: List of subjects. Valid: "physics", "math", "chemistry". Default to ALL THREE if unspecified.
- `topic`: Specific topic mentioned (e.g., "kinematics", "calculus", "organic chemistry"). Return null if none.
- `difficulty`: "easy", "medium", "hard", or "mixed". Default "mixed".
- `questionCount`: Integer (2-200).

QUESTION COUNT RULES (very important):
- If the user specifies a number, use that number.
- If the user says "full test", "mock test", "complete test", "JEE pattern test", "full mock", or anything similar implying an official-length exam → set questionCount to 90 (30 per subject: 20 MCQ + 10 numerical).
- If the user does NOT specify any count and does NOT ask for a full/mock test → default to 30.

EXAMPLES:
Input: "generate a 15 question physics test on kinematics"
Output: {"subjects": ["physics"], "topic": "kinematics", "difficulty": "mixed", "questionCount": 15}

Input: "I want a full mock test"
Output: {"subjects": ["physics", "math", "chemistry"], "topic": null, "difficulty": "mixed", "questionCount": 90}

Input: "test me on thermodynamics"
Output: {"subjects": ["physics"], "topic": "thermodynamics", "difficulty": "mixed", "questionCount": 30}

Input: "give me a hard math test on calculus with 20 questions"
Output: {"subjects": ["math"], "topic": "calculus", "difficulty": "hard", "questionCount": 20}

Input: "JEE mock test physics and chemistry"
Output: {"subjects": ["physics", "chemistry"], "topic": null, "difficulty": "mixed", "questionCount": 90}

Respond ONLY with valid JSON. No explanations."""
    try:
        llm = get_llm()
        result = await llm.ainvoke(
            system_prompt=system_prompt,
            user_prompt=prompt,
            expect_json=True
        )
        
        # Normalize subjects
        subjects = result.get("subjects")
        if not subjects or not isinstance(subjects, list):
            subjects = ["physics", "math", "chemistry"]
        subjects = [s.lower().strip() for s in subjects if isinstance(s, str)]
        valid = {"physics", "math", "chemistry"}
        subjects = [s for s in subjects if s in valid] or ["physics", "math", "chemistry"]
            
        topic = result.get("topic")
        if isinstance(topic, str):
            topic = topic.strip() or None
            
        diff = result.get("difficulty", "mixed")
        if diff not in ["easy", "medium", "hard", "mixed"]:
            diff = "mixed"
            
        count = result.get("questionCount", 30)
        try:
            count = int(count)
            count = max(2, min(count, 200))
        except (ValueError, TypeError):
            count = 30
            
        return {
            "subjects": subjects,
            "topic": topic,
            "difficulty": diff,
            "questionCount": count,
        }
    except Exception as e:
        logger.error("parse_intent_failed", error=str(e))
        return {
            "subjects": ["physics", "math", "chemistry"],
            "topic": None,
            "difficulty": "mixed",
            "questionCount": 30,
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
