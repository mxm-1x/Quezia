"""
Metadata Enrichment Agent

Purpose: Take a raw generated question and enrich it with 30+ metadata fields.
This runs ONCE per question during the bank generation phase.

The agent uses LLM to intelligently tag:
- Bloom's taxonomy level
- Cognitive type
- Concepts tested
- Formulas used
- Skills required
- Error-prone areas
- Common mistakes
- Solution approach
- Estimated time
- Difficulty score (granular 0-1)
- JEE relevance
- Tags

Cost: ~$0.001 per question enrichment (cheap, one-time)
"""
import json
from typing import Dict, Any, Optional, List
from datetime import datetime

from app.core.llm import get_llm
from app.core.logging import get_logger
from app.data.knowledge_base import get_knowledge_base
from app.models.question_schema import (
    QuestionBankItem,
    QuestionCore,
    AcademicClassification,
    DifficultyInfo,
    CognitiveInfo,
    SkillsConcepts,
    ExamIntelligence,
    JEERelevance,
    SolutionInfo,
    DiagramInfo,
    QualityInfo,
    GenerationMetadata,
    Subject,
    Difficulty,
    QuestionType,
    QuestionStyle,
    BloomLevel,
    CognitiveType,
    SolutionApproach,
    JEEFrequency,
    ValidationStatus,
)

logger = get_logger(__name__)


# =============================================================================
# SYSTEM PROMPT — Instructs the LLM to be a metadata tagging expert
# =============================================================================

METADATA_SYSTEM_PROMPT = """You are an expert JEE exam analyst and metadata tagger. Your job is to analyze a JEE question and produce RICH, ACCURATE metadata tags.

You will receive a question with basic info (subject, topic, difficulty, question_type). You must return a JSON object with comprehensive metadata.

RULES:
1. Be PRECISE with concepts_tested — list the exact physics/math/chemistry concepts
2. Be PRECISE with formulas_used — write actual formulas, not vague descriptions
3. skills_required should be specific: "trigonometric_substitution", "integration_by_parts", not "math"
4. error_prone_areas should describe WHERE students go wrong: "sign convention in lens formula"
5. common_mistakes should be SPECIFIC: "Using f=R instead of f=R/2 for mirrors"
6. difficulty_score should be calibrated:
   - 0.0-0.2: Direct formula substitution
   - 0.2-0.4: Simple multi-step
   - 0.4-0.6: Standard JEE level
   - 0.6-0.8: Above average JEE
   - 0.8-1.0: Very challenging, olympiad-adjacent
7. bloom_level mapping:
   - remember: Direct recall of formula/fact
   - understand: Explain a concept
   - apply: Use formula in standard problem
   - analyze: Break down complex multi-step problem
   - evaluate: Compare/judge multiple approaches
   - create: Design novel solution path
8. estimated_time_seconds should be realistic:
   - Easy MCQ: 60-90s
   - Medium MCQ: 90-150s
   - Hard MCQ: 150-240s
   - Numerical: 120-300s
9. solution_approach must be ONE of: direct_formula, energy_conservation, force_balance, coordinate_geometry, differentiation, integration, dimensional_analysis, elimination, substitution, graphical, symmetry, limiting_cases, superposition, conservation_laws, stoichiometry, electrochemistry, organic_mechanism, thermodynamic_cycle, matrix_method, vector_method, probability_rules, induction, comparison, pattern_recognition
10. question_style must be ONE of: calculation, conceptual, graph_based, assertion_reason, multi_concept, diagram_based, application, derivation

OUTPUT FORMAT (STRICT JSON — no markdown, no explanation):
{
    "sub_topics": ["Specific Sub-Topic 1", "Sub-Topic 2"],
    "category": "Macro Category (e.g., Mechanics, Calculus, Organic)",
    "difficulty_score": 0.55,
    "bloom_level": "apply",
    "cognitive_type": "procedural",
    "question_style": "calculation",
    "concepts_tested": ["Concept 1", "Concept 2"],
    "formulas_used": ["formula1 = expression", "formula2 = expression"],
    "skills_required": ["skill_1", "skill_2"],
    "prerequisite_topics": ["Topic A", "Topic B"],
    "error_prone_areas": ["Area where students mess up"],
    "common_mistakes": ["Specific mistake description"],
    "estimated_time_seconds": 120,
    "solution_approach": "direct_formula",
    "solution_steps_count": 3,
    "multi_concept": false,
    "jee_frequency": "regular",
    "tags": ["tag1", "tag2", "tag3"],
    "key_insight": "The critical realization needed to solve this",
    "quality_score": 0.85
}"""


def _get_enrichment_user_prompt(question: Dict[str, Any], subject: str) -> str:
    """Build the user prompt with the question to enrich."""
    return f"""Analyze this JEE {subject.upper()} question and provide comprehensive metadata:

QUESTION: {question.get('question_text', '')}

OPTIONS: {json.dumps(question.get('options', []))}

CORRECT ANSWER: {question.get('correct_answer', '')}

BASIC INFO:
- Subject: {subject}
- Topic: {question.get('topic', '')}
- Difficulty: {question.get('difficulty', 'medium')}
- Question Type: {question.get('question_type', 'mcq')}

Provide the enrichment metadata as JSON."""


# =============================================================================
# ENRICHMENT FUNCTIONS
# =============================================================================

async def enrich_question_async(
    raw_question: Dict[str, Any],
    subject: str,
    chapter: str,
    batch_id: str = "",
    class_level: int = 12,
) -> Optional[QuestionBankItem]:
    """
    Enrich a raw question with comprehensive metadata using LLM.
    
    Args:
        raw_question: Raw question dict from generation (question_text, options, correct_answer, etc.)
        subject: physics / math / chemistry
        chapter: Exact chapter name
        batch_id: Batch identifier for tracking
        class_level: 11 or 12
    
    Returns:
        QuestionBankItem with full metadata, or None if enrichment fails
    """
    llm = get_llm()
    kb = get_knowledge_base()
    
    # Get chapter weightage from knowledge base
    chapter_data = kb.get_chapter_weightage(subject, chapter)
    weightage = chapter_data.get("weight", 0.0) if chapter_data else 0.0
    category = chapter_data.get("category", "") if chapter_data else ""
    
    user_prompt = _get_enrichment_user_prompt(raw_question, subject)
    
    try:
        response = await llm.ainvoke(
            system_prompt=METADATA_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            expect_json=True,
            max_retries=2,
            tier="fast"
        )
        
        if not isinstance(response, dict):
            logger.error("metadata_enrichment_invalid_response", type=type(response).__name__)
            return None
        
        # Build the complete QuestionBankItem
        item = _build_question_bank_item(
            raw_question=raw_question,
            metadata=response,
            subject=subject,
            chapter=chapter,
            class_level=class_level,
            weightage=weightage,
            category_fallback=category,
            batch_id=batch_id,
        )
        
        logger.info(
            "question_enriched",
            subject=subject,
            chapter=chapter,
            topic=raw_question.get("topic", ""),
            quality_score=item.quality.quality_score,
        )
        
        return item
        
    except Exception as e:
        logger.error("metadata_enrichment_failed", error=str(e), subject=subject)
        # Return a minimally-enriched item rather than losing the question
        return _build_minimal_item(raw_question, subject, chapter, class_level, weightage, category, batch_id)


def enrich_question_sync(
    raw_question: Dict[str, Any],
    subject: str,
    chapter: str,
    batch_id: str = "",
    class_level: int = 12,
) -> Optional[QuestionBankItem]:
    """Synchronous version of enrich_question_async."""
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # We're in an async context, create a new task
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                result = pool.submit(
                    asyncio.run,
                    enrich_question_async(raw_question, subject, chapter, batch_id, class_level)
                ).result()
            return result
        else:
            return loop.run_until_complete(
                enrich_question_async(raw_question, subject, chapter, batch_id, class_level)
            )
    except RuntimeError:
        return asyncio.run(
            enrich_question_async(raw_question, subject, chapter, batch_id, class_level)
        )


async def enrich_batch_async(
    questions: List[Dict[str, Any]],
    subject: str,
    chapter: str,
    batch_id: str = "",
    class_level: int = 12,
    concurrency: int = 5,
) -> List[QuestionBankItem]:
    """
    Enrich a batch of questions concurrently.
    
    Args:
        questions: List of raw question dicts
        subject: Subject name
        chapter: Chapter name
        batch_id: Batch ID for tracking
        class_level: 11 or 12
        concurrency: Max concurrent enrichments (respect rate limits)
    
    Returns:
        List of enriched QuestionBankItems
    """
    import asyncio
    
    semaphore = asyncio.Semaphore(concurrency)
    results = []
    
    async def _enrich_with_semaphore(q: Dict[str, Any], idx: int) -> Optional[QuestionBankItem]:
        async with semaphore:
            return await enrich_question_async(q, subject, chapter, batch_id, class_level)
    
    tasks = [_enrich_with_semaphore(q, i) for i, q in enumerate(questions)]
    raw_results = await asyncio.gather(*tasks, return_exceptions=True)
    
    for i, result in enumerate(raw_results):
        if isinstance(result, Exception):
            logger.error("batch_enrichment_error", index=i, error=str(result))
        elif result is not None:
            results.append(result)
    
    logger.info(
        "batch_enrichment_completed",
        subject=subject,
        chapter=chapter,
        total=len(questions),
        enriched=len(results),
    )
    
    return results


# =============================================================================
# HELPER: Build QuestionBankItem from raw + metadata
# =============================================================================

def _build_question_bank_item(
    raw_question: Dict[str, Any],
    metadata: Dict[str, Any],
    subject: str,
    chapter: str,
    class_level: int,
    weightage: float,
    category_fallback: str,
    batch_id: str,
) -> QuestionBankItem:
    """Construct a complete QuestionBankItem from raw question + LLM metadata."""
    
    # Parse enums safely
    def _safe_enum(enum_cls, value, default):
        try:
            return enum_cls(value)
        except (ValueError, KeyError):
            return default
    
    question_type = _safe_enum(QuestionType, raw_question.get("question_type", "mcq"), QuestionType.MCQ)
    
    return QuestionBankItem(
        core=QuestionCore(
            question_text=raw_question.get("question_text", ""),
            options=raw_question.get("options", []),
            correct_answer=str(raw_question.get("correct_answer", "")),
            question_type=question_type,
        ),
        classification=AcademicClassification(
            subject=_safe_enum(Subject, subject.lower(), Subject.PHYSICS),
            chapter=chapter,
            topic=raw_question.get("topic", ""),
            sub_topics=metadata.get("sub_topics", []),
            class_level=class_level,
            category=metadata.get("category", category_fallback),
        ),
        difficulty_info=DifficultyInfo(
            difficulty=_safe_enum(Difficulty, raw_question.get("difficulty", "medium"), Difficulty.MEDIUM),
            difficulty_score=float(metadata.get("difficulty_score", 0.5)),
        ),
        cognitive=CognitiveInfo(
            bloom_level=_safe_enum(BloomLevel, metadata.get("bloom_level", "apply"), BloomLevel.APPLY),
            cognitive_type=_safe_enum(CognitiveType, metadata.get("cognitive_type", "procedural"), CognitiveType.PROCEDURAL),
            question_style=_safe_enum(QuestionStyle, metadata.get("question_style", "calculation"), QuestionStyle.CALCULATION),
        ),
        skills=SkillsConcepts(
            concepts_tested=metadata.get("concepts_tested", []),
            formulas_used=metadata.get("formulas_used", []),
            skills_required=metadata.get("skills_required", []),
            prerequisite_topics=metadata.get("prerequisite_topics", []),
            error_prone_areas=metadata.get("error_prone_areas", []),
            common_mistakes=metadata.get("common_mistakes", []),
        ),
        exam_info=ExamIntelligence(
            estimated_time_seconds=int(metadata.get("estimated_time_seconds", 120)),
            marks=4,
            negative_marks=-1 if question_type == QuestionType.MCQ else 0,
            solution_approach=_safe_enum(SolutionApproach, metadata.get("solution_approach", ""), None),
            solution_steps_count=int(metadata.get("solution_steps_count", 3)),
            multi_concept=bool(metadata.get("multi_concept", False)),
        ),
        jee_relevance=JEERelevance(
            years_appeared=metadata.get("years_appeared", []),
            frequency=_safe_enum(JEEFrequency, metadata.get("jee_frequency", "regular"), JEEFrequency.REGULAR),
            weightage_percent=weightage,
        ),
        solution=SolutionInfo(
            steps=raw_question.get("solution", {}).get("steps", []) if isinstance(raw_question.get("solution"), dict) else [],
            final_answer=str(raw_question.get("correct_answer", "")),
            key_insight=metadata.get("key_insight", ""),
        ),
        diagram=DiagramInfo(
            requires_diagram=raw_question.get("requires_diagram", False),
            diagram_type=raw_question.get("diagram_type", metadata.get("diagram_type")),
            diagram_description=raw_question.get("diagram_description", ""),
        ),
        quality=QualityInfo(
            quality_score=float(metadata.get("quality_score", 0.7)),
            validation_status=ValidationStatus.PENDING,
        ),
        generation=GenerationMetadata(
            generated_at=datetime.utcnow(),
            model="gemini-2.0-flash",
            batch_id=batch_id,
            version=1,
            enriched_by="metadata_agent_v1",
        ),
        tags=metadata.get("tags", []),
    )


def _build_minimal_item(
    raw_question: Dict[str, Any],
    subject: str,
    chapter: str,
    class_level: int,
    weightage: float,
    category: str,
    batch_id: str,
) -> QuestionBankItem:
    """Build a minimally-enriched item when LLM enrichment fails."""
    question_type_str = raw_question.get("question_type", "mcq")
    question_type = QuestionType.MCQ if question_type_str == "mcq" else QuestionType.NUMERICAL
    difficulty_str = raw_question.get("difficulty", "medium")
    
    # Map difficulty to score
    diff_score_map = {"easy": 0.3, "medium": 0.5, "hard": 0.75}
    
    return QuestionBankItem(
        core=QuestionCore(
            question_text=raw_question.get("question_text", ""),
            options=raw_question.get("options", []),
            correct_answer=str(raw_question.get("correct_answer", "")),
            question_type=question_type,
        ),
        classification=AcademicClassification(
            subject=Subject(subject.lower()) if subject.lower() in [s.value for s in Subject] else Subject.PHYSICS,
            chapter=chapter,
            topic=raw_question.get("topic", ""),
            sub_topics=[],
            class_level=class_level,
            category=category,
        ),
        difficulty_info=DifficultyInfo(
            difficulty=Difficulty(difficulty_str) if difficulty_str in [d.value for d in Difficulty] else Difficulty.MEDIUM,
            difficulty_score=diff_score_map.get(difficulty_str, 0.5),
        ),
        quality=QualityInfo(
            quality_score=0.5,  # Lower quality since enrichment failed
            validation_status=ValidationStatus.FLAGGED,
            flags=["enrichment_failed"],
        ),
        generation=GenerationMetadata(
            batch_id=batch_id,
            enriched_by="minimal_fallback",
        ),
        tags=[subject.lower(), chapter.lower().replace(" ", "_"), difficulty_str],
    )
