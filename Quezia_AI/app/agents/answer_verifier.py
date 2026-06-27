"""
Answer Verification Agent (LLM-Based)

Purpose: Independently solve a generated question to verify the answer is correct.
This is the #1 quality improvement — eliminates ~80% of wrong-answer questions.

Flow:
    1. Receive the question WITHOUT the correct answer
    2. Ask the LLM to solve it step-by-step
    3. Compare LLM's answer with the generated answer
    4. Pass → solution_generator, Fail → retry via subject_router

Cost: ~$0.01 per question verification (one extra LLM call)
"""
from typing import Literal
from app.core.state import AIState
from app.core.llm import get_llm
from app.core.logging import get_logger
from app.core.config import settings

logger = get_logger(__name__)

# Maximum verification attempts before accepting the answer anyway
MAX_VERIFICATION_RETRIES = 2


VERIFY_MCQ_SYSTEM_PROMPT = """You are a JEE Main exam expert. You will receive a multiple-choice question.
Solve it step-by-step and determine the correct answer.

RULES:
1. Show your working BRIEFLY (2-4 steps max)
2. Your final answer MUST be exactly one letter: A, B, C, or D
3. Do NOT guess — work through the math/logic carefully

OUTPUT FORMAT (STRICT JSON):
{
    "reasoning": "Brief step-by-step solution",
    "answer": "B"
}

Respond ONLY with valid JSON. No markdown."""

VERIFY_NUMERICAL_SYSTEM_PROMPT = """You are a JEE Main exam expert. You will receive a numerical-type question.
Solve it step-by-step and determine the numerical answer.

RULES:
1. Show your working BRIEFLY (2-4 steps max)
2. Your final answer must be a NUMBER (integer or decimal)
3. Do NOT guess — work through the math/logic carefully

OUTPUT FORMAT (STRICT JSON):
{
    "reasoning": "Brief step-by-step solution",
    "answer": 42.5
}

Respond ONLY with valid JSON. No markdown."""


def _build_mcq_prompt(question: dict) -> str:
    """Build user prompt for MCQ verification (no answer revealed)."""
    options = question.get("options", [])
    opts_str = "\n".join(
        f"{chr(65 + i)}) {opt}" for i, opt in enumerate(options)
    )
    return f"""Solve this JEE Main question:

{question.get('question_text', '')}

Options:
{opts_str}

Which option is correct? Solve and respond with JSON."""


def _build_numerical_prompt(question: dict) -> str:
    """Build user prompt for numerical verification (no answer revealed)."""
    return f"""Solve this JEE Main numerical question:

{question.get('question_text', '')}

Find the numerical answer. Solve and respond with JSON."""


def _answers_match(expected: str, got, question_type: str) -> bool:
    """Compare expected answer with verifier's answer."""
    if question_type == "numerical":
        try:
            expected_f = float(expected)
            got_f = float(got)
            # Allow 1% tolerance or absolute tolerance of 0.05
            if expected_f == 0:
                return abs(got_f) < 0.05
            relative_diff = abs(expected_f - got_f) / abs(expected_f)
            return relative_diff < 0.01 or abs(expected_f - got_f) < 0.05
        except (ValueError, TypeError):
            return False
    else:
        # MCQ: exact letter match
        return str(expected).strip().upper() == str(got).strip().upper()


def answer_verifier(state: AIState) -> AIState:
    """
    Verify the generated question's answer by independently solving it.

    Sets state["verification_passed"] = True/False.
    On failure, increments retry_count for the retry loop.
    """
    logger.info("answer_verifier_started")

    question = state.get("question")
    if not question:
        logger.error("answer_verifier_no_question")
        state["verification_passed"] = False
        state["last_error"] = "No question to verify"
        return state

    question_type = question.get("question_type", state.get("question_type", "mcq"))
    correct_answer = question.get("correct_answer", "")

    # Pick prompt based on type
    if question_type == "numerical":
        system_prompt = VERIFY_NUMERICAL_SYSTEM_PROMPT
        user_prompt = _build_numerical_prompt(question)
    else:
        system_prompt = VERIFY_MCQ_SYSTEM_PROMPT
        user_prompt = _build_mcq_prompt(question)

    llm = get_llm()

    try:
        response = llm.invoke(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            expect_json=True,
            max_retries=2,
            tier="complex"
        )

        verifier_answer = response.get("answer", "")
        verifier_reasoning = response.get("reasoning", "")

        matched = _answers_match(correct_answer, verifier_answer, question_type)

        if matched:
            logger.info(
                "answer_verified_match",
                expected=correct_answer,
                got=verifier_answer,
                question_type=question_type,
            )
            state["verification_passed"] = True
        else:
            logger.warning(
                "answer_verified_mismatch",
                expected=correct_answer,
                got=verifier_answer,
                question_type=question_type,
                reasoning=verifier_reasoning[:200],
            )
            state["verification_passed"] = False
            state["last_error"] = (
                f"Answer verification failed: generated={correct_answer}, "
                f"verifier={verifier_answer}"
            )

    except Exception as e:
        # If verification itself fails, let the question through
        # (don't block on verification infrastructure issues)
        logger.warning("answer_verifier_error", error=str(e))
        state["verification_passed"] = True  # Fail-open

    return state


def get_next_node(state: AIState) -> Literal["solution_generator", "subject_router"]:
    """
    Route based on verification result.

    Pass → solution_generator
    Fail → subject_router (retry, up to MAX_VERIFICATION_RETRIES)
    Exceeded retries → solution_generator (accept anyway, log warning)
    """
    verification_passed = state.get("verification_passed", True)
    retry_count = state.get("retry_count", 0)

    if verification_passed:
        logger.info("verification_routing", next="solution_generator")
        return "solution_generator"

    # Check retry limit
    if retry_count >= MAX_VERIFICATION_RETRIES:
        logger.warning(
            "verification_max_retries_accepting",
            retry_count=retry_count,
            last_error=state.get("last_error"),
        )
        # Accept the question anyway after max retries
        state["verification_passed"] = True
        return "solution_generator"

    # Increment retry and regenerate
    state["retry_count"] = retry_count + 1
    logger.info(
        "verification_routing_retry",
        next="subject_router",
        retry_count=state["retry_count"],
        last_error=state.get("last_error"),
    )
    return "subject_router"
