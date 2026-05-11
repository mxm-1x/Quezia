"""
Pydantic Request/Response Models for the AI Service API.

Two endpoints:
- POST /ai/generate  → question + test generation (async by default)
- POST /ai/analyze   → performance analysis + insights

Provides:
- Input validation with clear error messages
- OpenAPI schema generation for documentation
- Separation of internal state from API contract
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator
from app.models.question_schema import to_backend_question, BackendQuestionResponse


# =============================================================================
# SHARED VALIDATORS
# =============================================================================

_VALID_SUBJECTS = {"physics", "math", "chemistry"}
_VALID_DIFFICULTIES = {"easy", "medium", "hard", "mixed"}
_VALID_QUESTION_TYPES = {"mcq", "numerical", "mixed"}


def _normalize_subjects_list(v):
    if v is None:
        return v
    normalized = [s.lower().strip() for s in v]
    invalid = [s for s in normalized if s not in _VALID_SUBJECTS]
    if invalid:
        raise ValueError(f"Invalid subjects: {', '.join(invalid)}. Must be one of: {', '.join(_VALID_SUBJECTS)}")
    return normalized


def _normalize_subject_str(v):
    if v is None:
        return v
    v = v.lower().strip()
    if v not in _VALID_SUBJECTS:
        raise ValueError(f"Invalid subject: {v}. Must be one of: {', '.join(_VALID_SUBJECTS)}")
    return v


# =============================================================================
# REQUEST MODELS
# =============================================================================

class GenerateRequest(BaseModel):
    """Generate a JEE mock test (batch of questions).

    Uses async batched LLM calls for concurrent generation.
    Minimum 2 questions, maximum 200.
    """
    user_id: str = Field(
        ..., min_length=1,
        description="Caller-provided user identifier",
        json_schema_extra={"examples": ["user_abc123"]},
    )
    exam: str = Field(default="JEE_MAIN", description="Target exam identifier")

    subject: Optional[str] = Field(
        None,
        description="Single subject: physics, math, or chemistry",
        json_schema_extra={"examples": ["physics"]},
    )
    subjects: Optional[List[str]] = Field(
        None,
        description="Multiple subjects for a multi-subject test",
        json_schema_extra={"examples": [["physics", "math", "chemistry"]]},
    )

    prompt: Optional[str] = Field(
        None,
        description="Natural language prompt (e.g. 'give me a hard physics test on thermodynamics'). "
                    "If provided, the AI auto-parses subjects/topic/difficulty/count from this.",
        json_schema_extra={"examples": ["give me a hard physics test on thermodynamics"]},
    )

    topic: Optional[str] = Field(
        None,
        description="Specific topic to focus on (e.g. Thermodynamics)",
        json_schema_extra={"examples": ["Thermodynamics"]},
    )
    difficulty: Optional[str] = Field(
        default="mixed",
        description="Difficulty level: easy, medium, hard, or mixed",
    )
    question_type: Optional[str] = Field(
        default="mixed",
        description="Question type: mcq, numerical, or mixed",
    )
    question_count: int = Field(
        default=30, alias="questionCount", ge=2, le=200,
        description="Number of questions to generate (min 2, default 30; use 90 for full JEE Main)",
    )

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "examples": [
                {
                    "user_id": "user_abc123",
                    "prompt": "give me a full JEE mock test",
                },
                {
                    "user_id": "user_abc123",
                    "subjects": ["physics", "math", "chemistry"],
                    "difficulty": "mixed",
                    "questionCount": 90,
                },
                {
                    "user_id": "user_abc123",
                    "subject": "physics",
                    "topic": "Thermodynamics",
                    "difficulty": "medium",
                    "questionCount": 30,
                },
            ]
        },
    }

    @field_validator("subjects", mode="before")
    @classmethod
    def normalize_subjects(cls, v):
        return _normalize_subjects_list(v)

    @field_validator("subject", mode="before")
    @classmethod
    def normalize_subject(cls, v):
        return _normalize_subject_str(v)

    @field_validator("difficulty", mode="before")
    @classmethod
    def normalize_difficulty(cls, v):
        if v is None:
            return v
        v = v.lower().strip()
        if v not in _VALID_DIFFICULTIES:
            raise ValueError(f"Invalid difficulty: {v}. Must be one of: {', '.join(_VALID_DIFFICULTIES)}")
        return v

    @field_validator("question_type", mode="before")
    @classmethod
    def normalize_question_type(cls, v):
        if v is None:
            return v
        v = v.lower().strip()
        if v not in _VALID_QUESTION_TYPES:
            raise ValueError(f"Invalid question_type: {v}. Must be mcq, numerical, or mixed")
        return v

    def to_state(self) -> dict:
        """Convert validated request to AIState dict for graph execution."""
        state: dict = {
            "user_id": self.user_id,
            "task": "generate_test",
            "exam": self.exam,
        }

        if self.subject and not self.subjects:
            state["subjects"] = [self.subject]
            state["subject"] = self.subject
        elif self.subjects:
            state["subjects"] = self.subjects
            state["subject"] = self.subjects[0] if len(self.subjects) == 1 else None

        if self.topic:
            state["topic"] = self.topic
        if self.difficulty:
            state["difficulty"] = self.difficulty
        if self.question_type:
            state["question_type"] = self.question_type

        state["questionCount"] = self.question_count
        state["testMode"] = "test"

        return state


class AnalyzeRequest(BaseModel):
    """Analyze a completed test attempt and generate AI insights.

    Send the full attempt data and receive:
    - Detailed performance metrics (accuracy, time analysis, error clusters)
    - AI-generated insights (weak topics, patterns, recommendations)
    - Personalized study plan
    """
    user_id: str = Field(
        ..., min_length=1,
        description="Caller-provided user identifier",
        json_schema_extra={"examples": ["user_abc123"]},
    )
    exam: str = Field(default="JEE_MAIN", description="Target exam identifier")

    raw_attempt_data: Dict[str, Any] = Field(
        ...,
        description="Student attempt data containing an 'attempts' array",
        json_schema_extra={
            "examples": [
                {
                    "attempts": [
                        {
                            "question_id": "PHY-THERMO-000342",
                            "subject": "physics",
                            "topic": "Thermodynamics",
                            "difficulty": "medium",
                            "is_correct": True,
                            "time_taken_seconds": 95,
                            "question_type": "mcq",
                        },
                        {
                            "question_id": "MAT-CALC-001247",
                            "subject": "math",
                            "topic": "Calculus",
                            "difficulty": "hard",
                            "is_correct": False,
                            "time_taken_seconds": 210,
                            "question_type": "mcq",
                        },
                    ]
                }
            ]
        },
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "user_id": "user_abc123",
                    "raw_attempt_data": {
                        "attempts": [
                            {
                                "question_id": "PHY-THERMO-000342",
                                "subject": "physics",
                                "topic": "Thermodynamics",
                                "difficulty": "medium",
                                "is_correct": True,
                                "time_taken_seconds": 95,
                                "question_type": "mcq",
                            }
                        ]
                    },
                }
            ]
        }
    }

    @field_validator("raw_attempt_data")
    @classmethod
    def validate_attempt_data(cls, v):
        if "attempts" not in v or not v["attempts"]:
            raise ValueError("raw_attempt_data must contain a non-empty 'attempts' list")
        return v

    def to_state(self) -> dict:
        """Convert validated request to AIState dict for graph execution."""
        return {
            "user_id": self.user_id,
            "task": "analyze_performance",
            "exam": self.exam,
            "raw_attempt_data": self.raw_attempt_data,
        }

# =============================================================================
# RESPONSE MODELS
# =============================================================================

class GenerateResponse(BaseModel):
    """Response from test generation.

    Contains an array of questions in `BackendQuestionResponse` format
    plus test metadata (marking scheme, duration, distribution).
    """
    user_id: str = Field(description="Echo of the caller's user_id")

    test_questions: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Generated test questions — each in BackendQuestionResponse format "
                    "with immutable _snapshot block",
    )
    test_metadata: Optional[Dict[str, Any]] = Field(
        None,
        description="Test metadata: test_name, total_questions, duration_minutes, "
                    "marking_scheme, subject_distribution, difficulty_distribution",
    )

    @classmethod
    def from_state(cls, state: dict) -> "GenerateResponse":
        """Build generation response from graph state."""
        return cls(
            user_id=state.get("user_id", ""),
            test_questions=state.get("test_questions"),
            test_metadata=state.get("test_metadata"),
        )


class AnalyzeResponse(BaseModel):
    """Response from performance analysis.

    Contains three sections produced by the analysis pipeline:
    1. **performance_metrics** — deterministic stats (no LLM)
    2. **insights** — AI-generated observations and recommendations
    3. **study_plan** — personalized study schedule
    """
    user_id: str = Field(description="Echo of the caller's user_id")

    performance_metrics: Optional[Dict[str, Any]] = Field(
        None,
        description="Detailed analytics: overall accuracy, accuracy_by_subject, "
                    "accuracy_by_topic, time_analysis, error_clusters, strengths_weaknesses",
    )
    insights: Optional[Dict[str, Any]] = Field(
        None,
        description="AI insights: overall_assessment, weak_topics, strong_topics, "
                    "patterns, recommendations, priority_actions",
    )
    study_plan: Optional[Dict[str, Any]] = Field(
        None,
        description="Personalized study plan: weekly_plan, focus_areas, recommended_practice",
    )

    @classmethod
    def from_state(cls, state: dict) -> "AnalyzeResponse":
        """Build analysis response from graph state."""
        return cls(
            user_id=state.get("user_id", ""),
            performance_metrics=state.get("performance_metrics"),
            insights=state.get("insights"),
            study_plan=state.get("study_plan"),
        )
