"""
Batch Question Generator

Purpose: Generate multiple questions per LLM call for cost efficiency.
Cost savings: 60-80% reduction compared to sequential generation.

Instead of:
- 90 questions = 90 LLM calls = $0.81

With batching:
- 90 questions = 18 batches of 5 = $0.16 (80% cheaper)
"""
import asyncio
import json
from typing import List, Dict, Any, Optional
from app.core.state import AIState
from app.core.llm import get_llm
from app.core.logging import get_logger
from app.data.knowledge_base import get_knowledge_base
from app.data.vector_store import get_vector_store

logger = get_logger(__name__)

# Optimal batch size - balances quality with cost
BATCH_SIZE = 5  # Generate 5 questions per LLM call


def _get_batch_system_prompt(subject: str, batch_size: int, question_types: List[str]) -> str:
    """Generate system prompt for batch question generation."""
    
    subject_expertise = {
        "physics": """PHYSICS EXPERTISE:
- Use SI units (m, kg, s, A, K, mol, cd)
- Standard values: g = 10 m/s², c = 3×10⁸ m/s
- Include units in numerical answers
- Set requires_diagram=true only for specific visual setups (circuits, optics, FBD)""",
        
        "math": """MATHEMATICS EXPERTISE:
- Use standard mathematical notation (∫, Σ, lim, →, ∈, ⊂)
- Be precise with domain restrictions
- Set requires_diagram=true only for coordinate geometry/graphs/3D problems""",
        
        "chemistry": """CHEMISTRY EXPERTISE:
- Use IUPAC nomenclature for organic compounds
- Standard state: 25°C (298 K), 1 atm, 1 M
- Set requires_diagram=true only for mechanisms, structures, electrochemical cells"""
    }
    
    type_distribution = ", ".join([f"{t.upper()}" for t in question_types])
    
    return f"""You are an expert JEE {subject.upper()} teacher generating exactly {batch_size} high-quality questions.

{subject_expertise.get(subject, "")}

CRITICAL RULES:
1. Generate EXACTLY {batch_size} questions - no more, no less
2. Mix of types: {type_distribution}
3. Each question must be complete and solvable in 2-3 minutes
4. All questions must be unique - no duplicates
5. Match actual JEE Main difficulty and style

OUTPUT FORMAT - Return a JSON array with exactly {batch_size} objects:
[
  {{
    "question_text": "Complete question text...",
    "options": ["Option A", "Option B", "Option C", "Option D"],  // Only for MCQ
    "correct_answer": "A",  // "A/B/C/D" for MCQ, number for Numerical
    "difficulty": "easy|medium|hard",
    "topic": "Specific topic name",
    "subtopic": "Specific subtopic or concept tested",
    "requires_diagram": false,
    "diagram_description": "Description if requires_diagram is true",
    "question_type": "mcq|numerical"
  }},
  // ... more questions
]

Respond ONLY with valid JSON array. No markdown, no explanations."""


def _get_batch_user_prompt(
    subject: str,
    batch_size: int,
    difficulties: List[str],
    question_types: List[str],
    topics: Optional[List[str]] = None
) -> str:
    """Generate user prompt for batch question generation."""
    
    difficulty_dist = ", ".join(difficulties)
    type_dist = ", ".join([f"{t.upper()}" for t in question_types])
    topic_str = ", ".join(topics) if topics else "high-value JEE topics"
    
    return f"""Generate exactly {batch_size} JEE-Main level {subject.upper()} questions.

Requirements:
- Question count: EXACTLY {batch_size} questions
- Question types: {type_dist}
- Difficulties: {difficulty_dist}
- Topics: {topic_str}
- Exam: JEE Main 2026

Make each question unique and challenging. Return ONLY valid JSON array."""


async def generate_batch_async(
    subject: str,
    batch_size: int,
    difficulties: List[str],
    question_types: List[str],
    topics: Optional[List[str]] = None,
    few_shot_examples: str = ""
) -> List[Dict[str, Any]]:
    """
    Generate a batch of questions in a single LLM call.
    
    Args:
        subject: 'physics', 'math', or 'chemistry'
        batch_size: Number of questions to generate (default 5)
        difficulties: List of difficulties to include ['easy', 'medium', 'hard']
        question_types: List of types ['mcq', 'numerical']
        topics: Optional specific topics
        few_shot_examples: Optional examples for context
    
    Returns:
        List of generated question dicts
    """
    llm = get_llm()
    
    system_prompt = _get_batch_system_prompt(subject, batch_size, question_types)
    
    # Add knowledge base context (weightage + PYQ stats)
    kb = get_knowledge_base()
    kb_context = kb.get_context_for_prompt(subject)
    if kb_context:
        system_prompt += f"\n\n{kb_context}"
    
    # Add few-shot examples if provided
    if few_shot_examples:
        system_prompt += f"\n\n## REFERENCE EXAMPLES:\n{few_shot_examples}"
    
    user_prompt = _get_batch_user_prompt(
        subject, batch_size, difficulties, question_types, topics
    )
    
    logger.info(
        "batch_generation_started",
        subject=subject,
        batch_size=batch_size,
        types=question_types
    )
    
    try:
        response = await llm.ainvoke(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            expect_json=True,
            max_retries=3,
            tier="fast"
        )
        
        # Handle response - could be array or single object
        if isinstance(response, list):
            questions = response
        elif isinstance(response, dict):
            # Single question returned, wrap in list
            questions = [response]
        else:
            logger.error("batch_generation_invalid_response", response_type=type(response).__name__)
            return []
        
        # Validate and normalize each question
        validated = []
        for i, q in enumerate(questions):
            if _validate_question(q, subject):
                q["subject"] = subject
                validated.append(q)
            else:
                logger.warning(
                    "batch_question_validation_failed",
                    subject=subject,
                    index=i
                )
        
        logger.info(
            "batch_generation_completed",
            subject=subject,
            requested=batch_size,
            generated=len(validated)
        )
        
        return validated
        
    except Exception as e:
        logger.error("batch_generation_failed", subject=subject, error=str(e))
        # Propagate the error — callers use gather(return_exceptions=True)
        raise


def _validate_question(question: Dict[str, Any], subject: str) -> bool:
    """Validate question structure without LLM (fast, free)."""
    required_fields = ["question_text", "correct_answer", "difficulty", "topic"]
    
    # Check required fields
    if not all(field in question for field in required_fields):
        return False
    
    # Check question_text is non-empty
    if not question.get("question_text", "").strip():
        return False
    
    # Validate based on question type
    q_type = question.get("question_type", "mcq")
    
    if q_type == "mcq":
        # MCQ must have 4 options
        options = question.get("options", [])
        if not isinstance(options, list) or len(options) != 4:
            return False
        # Answer must be A, B, C, or D
        if question["correct_answer"] not in ["A", "B", "C", "D"]:
            return False
    else:
        # Numerical must have numeric answer
        try:
            float(question["correct_answer"])
        except (ValueError, TypeError):
            return False
    
    # Validate difficulty
    if question.get("difficulty") not in ["easy", "medium", "hard"]:
        question["difficulty"] = "medium"  # Default
    
    return True


async def generate_questions_batched(
    subject: str,
    count: int,
    difficulty: str = "medium",
    topic: Optional[str] = None,
    question_type: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Generate N questions using efficient batching.
    
    Cost comparison for 90 questions:
    - Sequential: 90 calls = $0.81
    - Batched: 18 calls = $0.16 (80% savings)
    
    Args:
        subject: 'physics', 'math', or 'chemistry'
        count: Total number of questions to generate
        difficulty: 'easy', 'medium', 'hard', or 'mixed'
        topic: Optional specific topic
        question_type: Optional 'mcq' or 'numerical', or None for mixed
    
    Returns:
        List of generated questions
    """
    # Determine difficulties
    if difficulty == "mixed":
        difficulties = ["easy", "medium", "hard"]
    else:
        difficulties = [difficulty]
    
    # Determine question types
    if question_type:
        question_types = [question_type]
    else:
        # JEE pattern: 2:1 ratio MCQ to Numerical
        question_types = ["mcq", "numerical"]
    
    # Get topics from knowledge base if not specified
    topics = None
    if topic:
        topics = [topic]
    else:
        try:
            kb = get_knowledge_base()
            # Get a few high-priority topics
            topics = [kb.get_high_priority_topic(subject) for _ in range(3)]
            topics = list(set(topics))  # Remove duplicates
        except Exception:
            pass
    
    # Get few-shot examples from vector store
    few_shot_examples = ""
    try:
        vs = get_vector_store()
        if topic:
            examples = vs.get_few_shot_examples(subject=subject, topic=topic, n_examples=2)
            if examples:
                few_shot_examples = vs.format_examples_for_prompt(examples)
    except Exception as e:
        logger.warning("batch_few_shot_failed", error=str(e))
    
    # Calculate batches needed
    num_batches = (count + BATCH_SIZE - 1) // BATCH_SIZE
    
    logger.info(
        "batched_generation_starting",
        subject=subject,
        total_count=count,
        batch_size=BATCH_SIZE,
        num_batches=num_batches
    )
    
    # Generate all batches concurrently
    batch_tasks = []
    for batch_num in range(num_batches):
        remaining = count - (batch_num * BATCH_SIZE)
        current_batch_size = min(BATCH_SIZE, remaining)
        
        task = generate_batch_async(
            subject=subject,
            batch_size=current_batch_size,
            difficulties=difficulties,
            question_types=question_types,
            topics=topics,
            few_shot_examples=few_shot_examples if batch_num == 0 else ""  # Only first batch gets examples
        )
        batch_tasks.append(task)
    
    # Run batches concurrently (respects LLM rate limiting via semaphore)
    batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
    
    # Collect all questions
    all_questions = []
    failures = 0
    for i, result in enumerate(batch_results):
        if isinstance(result, Exception):
            logger.error("batch_failed", batch_num=i, error=str(result))
            failures += 1
            continue
        if isinstance(result, list):
            all_questions.extend(result)
    
    if failures and not all_questions:
        raise RuntimeError(
            f"All {failures} batch(es) failed for {subject}. "
            f"Last error: {batch_results[-1] if batch_results else 'unknown'}"
        )

    logger.info(
        "batched_generation_completed",
        subject=subject,
        requested=count,
        generated=len(all_questions),
        failed_batches=failures,
    )
    
    return all_questions


async def generate_test_batched(
    subjects: List[str],
    questions_per_subject: int,
    difficulty: str = "medium"
) -> List[Dict[str, Any]]:
    """
    Generate a complete test using batched generation across subjects.
    
    Args:
        subjects: List of subjects ['physics', 'math', 'chemistry']
        questions_per_subject: Questions per subject
        difficulty: 'easy', 'medium', 'hard', or 'mixed'
    
    Returns:
        List of all questions across subjects
    """
    # Generate for each subject concurrently
    subject_tasks = [
        generate_questions_batched(
            subject=subject,
            count=questions_per_subject,
            difficulty=difficulty
        )
        for subject in subjects
    ]
    
    subject_results = await asyncio.gather(*subject_tasks, return_exceptions=True)
    
    all_questions = []
    for i, result in enumerate(subject_results):
        subject = subjects[i]
        if isinstance(result, Exception):
            logger.error("subject_batch_failed", subject=subject, error=str(result))
            continue
        if isinstance(result, list):
            # Add subject tag to each question
            for q in result:
                q["subject"] = subject
            all_questions.extend(result)
    
    return all_questions
