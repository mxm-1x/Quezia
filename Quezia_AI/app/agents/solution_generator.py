"""
Solution Generator Agent (LLM-Based)
Purpose: Generate step-by-step explanation
Called ONLY after validation_passed == true

Supports both MCQ and Numerical question types.
"""
from app.core.state import AIState
from app.core.llm import get_llm
from app.core.logging import get_logger

logger = get_logger(__name__)


def solution_generator(state: AIState) -> AIState:
    """
    Solution generator - creates step-by-step explanation.
    
    Output format:
    {
        "steps": ["Step 1 explanation", "Step 2 explanation", ...],
        "final_answer": "B" (for MCQ) or 42.5 (for numerical)
    }
    
    Rules:
    - Only explanation, no new logic
    - Called ONLY after validation_passed == true
    - Must match the correct answer from question
    
    Supports both MCQ and Numerical question types.
    """
    logger.info("solution_generator_started")
    
    question = state.get("question")
    if not question:
        raise ValueError("No question found in state")
    
    # Verify validation passed
    if not state.get("validation_passed", False):
        raise ValueError("Solution generator called before validation passed")
    
    # Determine question type
    question_type = question.get("question_type", state.get("question_type", "mcq"))
    
    llm = get_llm()
    
    # Build prompts based on question type
    if question_type == "numerical":
        system_prompt = """You are a JEE solution expert. Generate CONCISE solutions focused on FORMULAS and CALCULATIONS ONLY.

DO NOT write lengthy explanations or conceptual discussions.
DO write: formula → substitution → calculation → answer

OUTPUT FORMAT (STRICT JSON):
{
    "steps": [
        "Given: [values from question]",
        "Formula/Concept: [name the specific formula or principle]",
        "[Formula written mathematically]",
        "Substitute: [plug in values]",
        "Calculate: [show arithmetic]",
        "Answer: [final result]"
    ],
    "final_answer": 42.5
}

Keep steps SHORT and calculation-focused. Each step ONE line maximum."""

        user_prompt = f"""Question: {question['question_text']}

Correct Answer: {question['correct_answer']}
Topic: {question.get('topic')}

Solution with ONLY formulas, concepts, and calculations. NO explanations."""
    
    else:  # MCQ
        system_prompt = """You are a JEE solution expert. Generate CONCISE solutions focused on FORMULAS and CALCULATIONS ONLY.

DO NOT write lengthy explanations or conceptual discussions.
DO write: formula → substitution → calculation → why this option is correct

OUTPUT FORMAT (STRICT JSON):
{
    "steps": [
        "Given: [values from question]",
        "Formula/Concept: [name the specific formula or principle]",
        "[Formula written mathematically]",
        "Substitute: [plug in values]",
        "Calculate: [show arithmetic]",
        "Result: [matches option X because...]"
    ],
    "final_answer": "A"
}

Keep steps SHORT and calculation-focused. Each step ONE line maximum."""

        options = question.get('options', ['', '', '', ''])
        user_prompt = f"""Question: {question['question_text']}

Options:
A) {options[0] if len(options) > 0 else 'N/A'}
B) {options[1] if len(options) > 1 else 'N/A'}
C) {options[2] if len(options) > 2 else 'N/A'}
D) {options[3] if len(options) > 3 else 'N/A'}

Correct Answer: {question['correct_answer']}
Topic: {question.get('topic')}

Solution with ONLY formulas, concepts, and calculations. NO explanations."""
    
    try:
        response = llm.invoke(system_prompt, user_prompt, expect_json=True, tier="complex")
        
        # Validate response structure
        if "steps" not in response:
            raise ValueError("Missing 'steps' in solution response")
        if "final_answer" not in response:
            raise ValueError("Missing 'final_answer' in solution response")
        
        # Verify final_answer matches question's correct_answer
        if question_type == "numerical":
            # For numerical, compare as floats
            try:
                expected = float(question["correct_answer"])
                got = float(response["final_answer"])
                if abs(expected - got) > 0.01:  # Allow small tolerance
                    logger.warning(
                        "solution_answer_mismatch",
                        expected=question["correct_answer"],
                        got=response["final_answer"]
                    )
                    response["final_answer"] = question["correct_answer"]
            except (ValueError, TypeError):
                response["final_answer"] = question["correct_answer"]
        else:
            # For MCQ, compare strings
            if str(response["final_answer"]) != str(question["correct_answer"]):
                logger.warning(
                    "solution_answer_mismatch",
                    expected=question["correct_answer"],
                    got=response["final_answer"]
                )
                response["final_answer"] = question["correct_answer"]
        
        # Build a single explanation string from steps for the backend contract
        explanation_parts = response.get("steps", [])
        response["explanation"] = " ".join(explanation_parts) if explanation_parts else ""
        
        state["solution"] = response
        
        logger.info(
            "solution_generator_completed",
            steps_count=len(response["steps"]),
            final_answer=response["final_answer"]
        )
        
        return state
        
    except Exception as e:
        logger.error("solution_generator_failed", error=str(e))
        raise
