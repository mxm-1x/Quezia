"""
Test Assembler Agent
Purpose: Assemble full mock tests following JEE Main exam pattern

JEE MAIN TEST PATTERN (per subject):
- 20 MCQ (compulsory, all must be solved)
- 10 Numerical (choose any 5 to solve)
- Total: 30 questions per subject

Rules:
- Reuse subject agents
- Follows official JEE Main test structure
- Support single/multi-subject tests
- LLM only for formatting

Uses async batched generation for ~80% cost savings over sequential calls.
"""
import random
import uuid
import asyncio
from typing import List, Dict, Any, Optional
from app.core.state import AIState
from app.core.logging import get_logger
from app.core.config import settings
from app.agents.diagram_generator import _generate_diagram_spec, _generate_image
from app.agents.batch_generator import generate_batch_async, BATCH_SIZE
from app.utils.helpers import distribute_questions
from app.data.knowledge_base import get_knowledge_base
from app.models.question_schema import to_backend_question, snapshot_for_test

logger = get_logger(__name__)

DEFAULT_SUBJECTS = ["physics", "math", "chemistry"]
DEFAULT_QUESTION_COUNT = 30  # Default for topic-specific tests; 90 for full mock


def _distribute_jee_pattern(subjects: List[str], total_count: int, difficulty_mode: str) -> Dict[str, Dict[str, Dict[str, int]]]:
    """
    Distribute questions following JEE Main exam pattern.
    
    JEE MAIN PATTERN (per subject):
    - 20 MCQ (all compulsory)
    - 10 Numerical (choose 5 to solve)
    - Total: 30 questions per subject
    - Ratio: 2:1 (MCQ:Numerical)
    
    Args:
        subjects: List of subjects
        total_count: Total questions requested
        difficulty_mode: 'easy', 'medium', 'hard', or 'mixed'
    
    Returns:
        {
            "physics": {
                "mcq": {"easy": 7, "medium": 8, "hard": 5},
                "numerical": {"easy": 3, "medium": 4, "hard": 3}
            },
            ...
        }
    """
    distribution = {}
    
    for subject in subjects:
        # Calculate questions per subject
        questions_per_subject = total_count // len(subjects)
        
        if questions_per_subject >= 30:
            # Standard JEE pattern: 20 MCQ + 10 Numerical
            mcq_count = 20
            numerical_count = 10
        else:
            # Scale proportionally maintaining 2:1 ratio (MCQ:Numerical)
            # For ratio 2:1, MCQ = 2/3 of total, Numerical = 1/3 of total
            numerical_count = max(questions_per_subject // 3, 1)  # At least 1 numerical
            mcq_count = questions_per_subject - numerical_count
        
        # Distribute by difficulty
        if difficulty_mode == "mixed":
            # Realistic distribution: ~35% easy, 35% medium, 30% hard
            mcq_difficulties = {
                "easy": max(int(mcq_count * 0.35), 1) if mcq_count >= 3 else 0,
                "medium": max(int(mcq_count * 0.35), 1) if mcq_count >= 2 else mcq_count,
                "hard": max(mcq_count - int(mcq_count * 0.35) - int(mcq_count * 0.35), 0)
            }
            # Adjust to ensure total matches
            mcq_total = sum(mcq_difficulties.values())
            if mcq_total < mcq_count:
                mcq_difficulties["medium"] += mcq_count - mcq_total
            elif mcq_total > mcq_count:
                mcq_difficulties["hard"] = max(0, mcq_difficulties["hard"] - (mcq_total - mcq_count))
            
            numerical_difficulties = {
                "easy": max(int(numerical_count * 0.35), 1) if numerical_count >= 3 else 0,
                "medium": max(int(numerical_count * 0.35), 1) if numerical_count >= 2 else numerical_count,
                "hard": max(numerical_count - int(numerical_count * 0.35) - int(numerical_count * 0.35), 0)
            }
            # Adjust to ensure total matches
            num_total = sum(numerical_difficulties.values())
            if num_total < numerical_count:
                numerical_difficulties["medium"] += numerical_count - num_total
            elif num_total > numerical_count:
                numerical_difficulties["hard"] = max(0, numerical_difficulties["hard"] - (num_total - numerical_count))
        else:
            # Single difficulty mode
            mcq_difficulties = {difficulty_mode: mcq_count}
            numerical_difficulties = {difficulty_mode: numerical_count}
        
        distribution[subject] = {
            "mcq": mcq_difficulties,
            "numerical": numerical_difficulties
        }
    
    return distribution


async def test_assembler(state: AIState) -> AIState:
    """
    Test assembler - uses BATCHED async generation for 80% cost savings.
    
    Instead of 90 individual LLM calls, uses ~18 batched calls (5 questions each).
    Cost reduction: $0.81 → $0.16 for 90 questions.
    
    Pattern per subject:
    - 20 MCQ (Multiple Choice - compulsory)
    - 10 Numerical (students choose 5 to solve)
    """
    logger.info("test_assembler_started")
    
    # Extract configuration from state
    subjects = state.get("subjects") or (
        [state["subject"]] if state.get("subject") else DEFAULT_SUBJECTS
    )
    question_count = state.get("questionCount") or (len(subjects) * 30)
    difficulty_mode = state.get("difficulty") or "mixed"
    
    logger.info(
        "async_batched_test_configuration",
        subjects=subjects,
        question_count=question_count,
        difficulty_mode=difficulty_mode,
        batch_size=BATCH_SIZE
    )
    
    # Calculate distribution
    distribution = _distribute_jee_pattern(subjects, question_count, difficulty_mode)
    
    # Build batch tasks per subject
    # Group questions by subject to create fewer, larger batch calls
    batch_tasks = []
    batch_metadata = []  # Track which batch belongs to which subject
    
    for subject, question_types_dist in distribution.items():
        # Get weightage-based topic distribution for this subject if no specific topic
        requested_topic = state.get("topic")
        kb = get_knowledge_base()
        subject_total = sum(
            sum(diffs.values()) for diffs in question_types_dist.values()
        )
        topic_distribution = None
        if not requested_topic:
            topic_distribution = kb.get_topic_distribution(subject, subject_total)
            logger.info(
                "weightage_topic_distribution",
                subject=subject,
                topics=list(topic_distribution.keys())[:5],
            )
        
        # Collect all MCQ requirements for this subject
        mcq_difficulties = []
        for difficulty, count in question_types_dist.get("mcq", {}).items():
            mcq_difficulties.extend([difficulty] * count)
        
        # Collect all Numerical requirements for this subject
        num_difficulties = []
        for difficulty, count in question_types_dist.get("numerical", {}).items():
            num_difficulties.extend([difficulty] * count)
        
        # Select topics for batches from the weighted distribution
        def _pick_topics_for_batch(batch_size: int) -> Optional[List[str]]:
            if requested_topic:
                return [requested_topic]
            if topic_distribution:
                # Pick topics proportionally, adding variety
                available = list(topic_distribution.keys())
                if available:
                    return random.sample(available, min(batch_size, len(available)))
            return None
        
        # Create MCQ batches
        for i in range(0, len(mcq_difficulties), BATCH_SIZE):
            batch_difficulties = mcq_difficulties[i:i + BATCH_SIZE]
            batch_size = len(batch_difficulties)
            batch_topics = _pick_topics_for_batch(batch_size)
            task = generate_batch_async(
                subject=subject,
                batch_size=batch_size,
                difficulties=list(set(batch_difficulties)),
                question_types=["mcq"],
                topics=batch_topics
            )
            batch_tasks.append(task)
            batch_metadata.append((subject, "mcq", batch_size))
        
        # Create Numerical batches
        for i in range(0, len(num_difficulties), BATCH_SIZE):
            batch_difficulties = num_difficulties[i:i + BATCH_SIZE]
            batch_size = len(batch_difficulties)
            batch_topics = _pick_topics_for_batch(batch_size)
            task = generate_batch_async(
                subject=subject,
                batch_size=batch_size,
                difficulties=list(set(batch_difficulties)),
                question_types=["numerical"],
                topics=batch_topics
            )
            batch_tasks.append(task)
            batch_metadata.append((subject, "numerical", batch_size))
    
    total_batches = len(batch_tasks)
    logger.info(
        "batched_generation_starting",
        total_batches=total_batches,
        batch_size=BATCH_SIZE,
        expected_llm_calls=total_batches
    )
    
    # Run all batch tasks concurrently
    batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
    
    # Collect all questions
    all_questions = []
    errors = []
    
    for i, result in enumerate(batch_results):
        subject, q_type, expected_count = batch_metadata[i]
        
        if isinstance(result, Exception):
            errors.append({
                "subject": subject,
                "type": q_type,
                "expected": expected_count,
                "error": str(result)
            })
            continue
        
        if isinstance(result, list):
            for q in result:
                q["subject"] = subject
                q["question_type"] = q_type
                all_questions.append(q)
            
            if len(result) < expected_count:
                logger.warning(
                    "batch_returned_fewer_questions",
                    subject=subject,
                    type=q_type,
                    expected=expected_count,
                    received=len(result)
                )
    
    logger.info(
        "batch_generation_completed",
        total_questions=len(all_questions),
        total_batches=total_batches
    )
    
    # Generate diagrams for questions that need them (MVP: disabled to save costs)
    if settings.ENABLE_IMAGE_GENERATION:
        diagram_tasks = []
        diagram_indices = []
        
        for i, question in enumerate(all_questions):
            if question.get("requires_diagram", False):
                diagram_tasks.append(_generate_diagram_for_question_async(question))
                diagram_indices.append(i)
        
        if diagram_tasks:
            logger.info("generating_diagrams", count=len(diagram_tasks))
            diagram_results = await asyncio.gather(*diagram_tasks, return_exceptions=True)
            
            for idx, result in zip(diagram_indices, diagram_results):
                if not isinstance(result, Exception) and result:
                    all_questions[idx]["diagram_spec"] = result.get("diagram_spec")
                    all_questions[idx]["diagram_image"] = result.get("diagram_image")
    else:
        logger.info("image_generation_disabled_mvp", reason="cost_saving")
    
    # Normalize and prepare final questions (with deduplication and immutable snapshots)
    test_questions = []
    seen_ids: set = set()
    duplicates_skipped = 0
    
    for i, question in enumerate(all_questions):
        normalized = _normalize_question_format(question, question["subject"], i + 1)
        
        # Enforce question uniqueness by questionId
        qid = normalized.get("questionId", "")
        if qid in seen_ids:
            duplicates_skipped += 1
            logger.warning("duplicate_question_skipped", questionId=qid)
            continue
        seen_ids.add(qid)
        
        # Snapshot for immutability — metadata is frozen at generation time
        # so historical tests remain unaffected by future question edits
        snapshotted = snapshot_for_test(normalized)
        test_questions.append(snapshotted)
    
    if duplicates_skipped:
        logger.info("deduplication_complete", skipped=duplicates_skipped, kept=len(test_questions))
    
    # ── RETRY / BACKFILL LOOP ──────────────────────────────────────────
    # If we fell short due to LLM under-generation, validation drops, or
    # deduplication, fire targeted retry batches to fill the gap.
    MAX_RETRIES = 2
    for retry_round in range(MAX_RETRIES):
        deficit = question_count - len(test_questions)
        if deficit <= 0:
            break
        
        logger.info(
            "backfill_retry_starting",
            retry_round=retry_round + 1,
            deficit=deficit,
            current_total=len(test_questions)
        )
        
        # Spread the deficit across subjects evenly
        deficit_per_subject = max(deficit // len(subjects), 1)
        retry_tasks = []
        retry_meta = []
        
        for subject in subjects:
            count_needed = min(deficit_per_subject, deficit)
            if count_needed <= 0:
                break
            task = generate_batch_async(
                subject=subject,
                batch_size=count_needed,
                difficulties=["easy", "medium", "hard"] if difficulty_mode == "mixed" else [difficulty_mode],
                question_types=["mcq"],
                topics=[state.get("topic")] if state.get("topic") else None
            )
            retry_tasks.append(task)
            retry_meta.append((subject, "mcq", count_needed))
        
        retry_results = await asyncio.gather(*retry_tasks, return_exceptions=True)
        
        for j, result in enumerate(retry_results):
            subject, q_type, _ = retry_meta[j]
            if isinstance(result, Exception) or not isinstance(result, list):
                continue
            for q in result:
                q["subject"] = subject
                q["question_type"] = q_type
                idx = len(all_questions) + 1
                normalized = _normalize_question_format(q, subject, idx)
                qid = normalized.get("questionId", "")
                if qid in seen_ids:
                    continue
                seen_ids.add(qid)
                snapshotted = snapshot_for_test(normalized)
                test_questions.append(snapshotted)
                all_questions.append(q)
                if len(test_questions) >= question_count:
                    break
            if len(test_questions) >= question_count:
                break
        
        logger.info(
            "backfill_retry_completed",
            retry_round=retry_round + 1,
            total_after_retry=len(test_questions)
        )
    
    # Trim to exact count if we overshot
    if len(test_questions) > question_count:
        test_questions = test_questions[:question_count]
    
    # Shuffle questions to mix subjects
    random.shuffle(test_questions)
    
    # Renumber after shuffling
    for i, q in enumerate(test_questions):
        q["question_number"] = i + 1
    
    # Store results
    state["test_questions"] = test_questions
    
    # Generate test metadata
    if test_questions:
        try:
            metadata = _generate_test_metadata(test_questions, subjects, question_count)
            state["test_metadata"] = metadata
            # Add cost savings info
            sequential_calls = question_count
            batched_calls = total_batches
            state["test_metadata"]["cost_optimization"] = {
                "sequential_llm_calls": sequential_calls,
                "batched_llm_calls": batched_calls,
                "cost_reduction_percent": round((1 - batched_calls / max(sequential_calls, 1)) * 100)
            }
        except Exception as e:
            logger.error("test_metadata_generation_failed", error=str(e))
            state["test_metadata"] = {
                "total_questions": len(test_questions),
                "duration_minutes": _calculate_duration(len(test_questions)),
                "errors": errors
            }
    
    logger.info(
        "test_assembler_completed",
        total_questions=len(test_questions),
        llm_calls_saved=question_count - total_batches,
        errors_count=len(errors)
    )
    
    return state


async def _generate_diagram_for_question_async(question: Dict[str, Any]) -> Dict[str, Any]:
    """Generate diagram for a single question asynchronously."""
    try:
        diagram_state = {
            "subject": question.get("subject", "physics"),
            "question": {
                "question_text": question.get("question_text", ""),
                "topic": question.get("topic", "")
            },
            "requires_diagram": True,
            "diagram_description": question.get("diagram_description", "")
        }
        diagram_spec = _generate_diagram_spec(diagram_state)
        
        result = {"diagram_spec": diagram_spec}
        
        if "error" not in diagram_spec:
            image_b64 = _generate_image(diagram_spec)
            result["diagram_image"] = image_b64
        else:
            result["diagram_image"] = None
            
        return result
    except Exception as e:
        logger.warning("diagram_generation_failed", error=str(e))
        return {"diagram_spec": None, "diagram_image": None}


def _normalize_question_format(question: Dict[str, Any], subject: str, number: int) -> Dict[str, Any]:
    """Normalize question to the backend contract format (BackendQuestionResponse)."""
    question_type_raw = question.get("question_type", "mcq")
    
    # Determine marks based on question type (JEE Main marking scheme)
    marks = 4  # All questions are +4 for correct
    
    # Time limit: MCQ ~2min, Numerical ~3min
    time_limit = 120 if question_type_raw == "mcq" else 180
    
    # Convert to backend contract format
    normalized = to_backend_question(
        question=question,
        subject=subject,
        explanation="",  # Explanation not generated for test questions (cost saving)
        marks=marks,
        time_limit=time_limit,
    )
    
    # Add test-specific fields
    normalized["question_number"] = number
    
    # Include diagram data if present
    if question.get("requires_diagram", False):
        if question.get("diagram_spec"):
            normalized["diagramSpec"] = question["diagram_spec"]
        if question.get("diagram_image"):
            normalized["diagramImage"] = question["diagram_image"]
    
    return normalized


def _calculate_duration(question_count: int) -> int:
    """Calculate test duration based on question count.
    Standard: 3 minutes per question.
    """
    return question_count * 3


def _generate_test_metadata(
    test_questions: List[Dict[str, Any]],
    subjects: List[str],
    total_count: int
) -> Dict[str, Any]:
    """Generate test metadata following JEE Main exam pattern. Deterministic — no LLM call."""
    
    # Calculate statistics
    subject_counts = {}
    difficulty_counts = {"easy": 0, "medium": 0, "hard": 0}
    type_counts = {"MCQ": 0, "numeric": 0}
    topic_list = []
    
    for q in test_questions:
        subject = q.get("subject", "unknown")
        subject_counts[subject] = subject_counts.get(subject, 0) + 1
        
        difficulty = q.get("difficulty", "unknown")
        if difficulty in difficulty_counts:
            difficulty_counts[difficulty] += 1
        
        q_type = q.get("questionType", q.get("question_type", "MCQ"))
        if q_type in type_counts:
            type_counts[q_type] += 1
        
        topic = q.get("topic", "unknown")
        topic_list.append(topic)
    
    test_type = "Single Subject" if len(subjects) == 1 else "Multi-Subject"
    subject_list = ", ".join([s.capitalize() for s in subjects])
    unique_topics = list(set(topic_list))[:15]
    duration = _calculate_duration(len(test_questions))
    
    return {
        "test_name": f"JEE Main Mock Test — {subject_list}",
        "description": f"{test_type} mock test with {total_count} questions covering {subject_list}. "
                       f"Duration: {duration} minutes. Follows official JEE Main exam pattern.",
        "total_questions": len(test_questions),
        "duration_minutes": duration,
        "marking_scheme": {
            "mcq": {"correct": 4, "incorrect": -1, "unattempted": 0},
            "numerical": {"correct": 4, "incorrect": 0, "unattempted": 0}
        },
        "subject_distribution": subject_counts,
        "difficulty_distribution": difficulty_counts,
        "question_type_distribution": type_counts,
        "topics_covered": unique_topics,
        "instructions": [
            f"Total Questions: {len(test_questions)}",
            f"Duration: {duration} minutes",
            "MCQ: +4 for correct, -1 for incorrect, 0 for unattempted",
            "Numerical: +4 for correct, 0 for incorrect, 0 for unattempted",
            "Numerical section: Attempt any 5 out of 10 questions per subject",
            "No calculator allowed",
        ]
    }
