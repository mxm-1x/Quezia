"""
Validation Node (PURE LOGIC)
Purpose: Ensure correctness BEFORE explanation
Rules:
- No LLM calls
- Re-solve deterministically where possible
- Heuristically check difficulty

Supports both MCQ and Numerical question types.
"""
from typing import Literal
from app.core.state import AIState
from app.core.logging import get_logger
from app.core.config import settings

logger = get_logger(__name__)


def validation_node(state: AIState) -> AIState:
    """
    Validation node - validates generated question.
    
    Supports:
    - MCQ: 4 options, correct_answer in A/B/C/D
    - Numerical: numeric answer, no options required
    
    NO LLM calls. Pure deterministic logic.
    """
    logger.info("validation_started")
    
    question = state.get("question")
    
    if not question:
        logger.error("validation_failed", reason="no_question")
        state["validation_passed"] = False
        state["last_error"] = "No question found in state"
        return state
    
    validation_errors = []
    
    # Determine question type (default to mcq for backward compatibility)
    question_type = question.get("question_type", state.get("question_type", "mcq"))
    
    # Check 1: Required fields present (different for MCQ vs Numerical)
    if question_type == "numerical":
        required_fields = ["question_text", "correct_answer", "difficulty", "topic"]
    else:  # mcq
        required_fields = ["question_text", "options", "correct_answer", "difficulty", "topic"]
    
    for field in required_fields:
        if field not in question or question[field] is None:
            validation_errors.append(f"Missing field: {field}")
    
    if validation_errors:
        logger.error("validation_failed", errors=validation_errors)
        state["validation_passed"] = False
        state["last_error"] = "; ".join(validation_errors)
        return state
    
    # Type-specific validation
    if question_type == "numerical":
        # Numerical validation
        correct = question.get("correct_answer")
        try:
            float(str(correct))
        except (ValueError, TypeError):
            validation_errors.append(f"Numerical answer must be a number, got: {correct}")
    else:
        # MCQ validation
        options = question.get("options", [])
        if len(options) != 4:
            validation_errors.append(f"Expected 4 options, got {len(options)}")
        
        correct = question.get("correct_answer")
        if correct not in ["A", "B", "C", "D"]:
            validation_errors.append(f"Invalid correct_answer: {correct}")
        
        # Check options uniqueness
        if len(options) == 4:
            if len(options) != len(set(options)):
                validation_errors.append("Duplicate options found")
            
            # Check options quality - ensure they're not empty
            for i, opt in enumerate(options):
                if not opt or len(str(opt).strip()) < 1:
                    validation_errors.append(f"Option {chr(65+i)} is empty or invalid")
    
    # Common validation for both types
    difficulty = question.get("difficulty")
    if difficulty not in ["easy", "medium", "hard"]:
        validation_errors.append(f"Invalid difficulty: {difficulty}")
    
    # Topic validation (basic)
    topic = question.get("topic", "")
    if not topic or len(topic) < 3:
        validation_errors.append("Invalid topic")
    
    # Question text quality
    question_text = question.get("question_text", "")
    if len(question_text) < 20:
        validation_errors.append("Question text too short")
    
    # Heuristic difficulty check
    word_count = len(question_text.split())
    if difficulty == "easy" and word_count > 100:
        logger.warning("validation_warning", reason="easy_question_too_long", word_count=word_count)
    elif difficulty == "hard" and word_count < 30:
        logger.warning("validation_warning", reason="hard_question_too_short", word_count=word_count)
    
    # Requires diagram field
    if "requires_diagram" not in question:
        logger.warning("validation_warning", reason="requires_diagram_field_missing")
        question["requires_diagram"] = False
    
    if validation_errors:
        logger.error("validation_failed", errors=validation_errors, retry_count=state.get("retry_count", 0))
        state["validation_passed"] = False
        state["last_error"] = "; ".join(validation_errors)
    else:
        logger.info("validation_passed", question_type=question_type)
        state["validation_passed"] = True
        state["last_error"] = None
    
    return state


def get_next_node(state: AIState) -> Literal["solution_generator", "subject_router"]:
    """
    Determine next node based on validation result.
    Used for conditional edge routing.
    
    If validation fails → retry subject_router (max 3 retries)
    If validation passes → solution_generator
    """
    validation_passed = state.get("validation_passed", False)
    retry_count = state.get("retry_count", 0)
    
    if validation_passed:
        # Reset retry count on success
        state["retry_count"] = 0
        logger.info("validation_routing", next="solution_generator")
        return "solution_generator"
    
    # Check retry limit (use >= to be defensive)
    if retry_count >= settings.MAX_RETRIES:
        error_msg = f"Validation failed after {settings.MAX_RETRIES} attempts. Last error: {state.get('last_error', 'Unknown')}"
        logger.error("max_retries_exceeded", retry_count=retry_count, last_error=state.get('last_error'))
        raise ValueError(error_msg)
    
    # Increment retry count and retry
    state["retry_count"] = retry_count + 1
    logger.info(
        "validation_routing_retry",
        next="subject_router",
        retry_count=state["retry_count"],
        last_error=state.get("last_error")
    )
    return "subject_router"
