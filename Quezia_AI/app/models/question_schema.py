"""
Rich Question Schema for JEE Question Bank

Every generated question is tagged with 30+ metadata fields enabling:
- Smart retrieval without LLM calls
- Adaptive learning paths
- Concept-specific drilling
- Bloom's taxonomy progression
- PYQ-style pattern matching
- Time-pressure practice sessions
- Weakness targeting

This is the SINGLE SOURCE OF TRUTH for question structure.
"""
from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, field_validator
import uuid
import hashlib
import re
import copy
import threading


# =============================================================================
# ENUMS — Constrained vocabularies for consistent tagging
# =============================================================================

class Subject(str, Enum):
    PHYSICS = "physics"
    MATH = "math"
    CHEMISTRY = "chemistry"


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class QuestionType(str, Enum):
    MCQ = "mcq"
    NUMERICAL = "numerical"


class QuestionStyle(str, Enum):
    """How the question is framed — affects retrieval strategy."""
    CALCULATION = "calculation"           # Plug-and-solve with formulas
    CONCEPTUAL = "conceptual"             # Tests understanding, no heavy math
    GRAPH_BASED = "graph_based"           # Requires graph interpretation
    ASSERTION_REASON = "assertion_reason"  # Statement A, Statement B format
    MULTI_CONCEPT = "multi_concept"       # Combines 2+ concepts
    DIAGRAM_BASED = "diagram_based"       # Requires reading a diagram
    APPLICATION = "application"           # Real-world scenario
    DERIVATION = "derivation"             # Step-by-step derivation


class BloomLevel(str, Enum):
    """Bloom's Taxonomy — enables progressive difficulty."""
    REMEMBER = "remember"       # Recall facts, formulas
    UNDERSTAND = "understand"   # Explain concepts
    APPLY = "apply"             # Use formula in standard problem
    ANALYZE = "analyze"         # Break down complex scenario
    EVALUATE = "evaluate"       # Judge, compare approaches
    CREATE = "create"           # Design/construct solution approach


class CognitiveType(str, Enum):
    """What kind of thinking is required."""
    FACTUAL = "factual"           # Direct recall
    CONCEPTUAL = "conceptual"     # Understanding relationships
    PROCEDURAL = "procedural"     # Step-by-step process
    APPLICATION = "application"   # Apply in new context


class JEEFrequency(str, Enum):
    """How often this question pattern appears in JEE."""
    RARE = "rare"             # Appeared 1-2 times in 10 years
    OCCASIONAL = "occasional"  # Appeared 3-5 times in 10 years
    REGULAR = "regular"        # Appears almost every year
    FREQUENT = "frequent"      # Multiple questions per exam


class ValidationStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    FLAGGED = "flagged"
    REJECTED = "rejected"


class SolutionApproach(str, Enum):
    """Primary solving strategy — helps categorize problem-solving patterns."""
    DIRECT_FORMULA = "direct_formula"
    ENERGY_CONSERVATION = "energy_conservation"
    FORCE_BALANCE = "force_balance"
    COORDINATE_GEOMETRY = "coordinate_geometry"
    DIFFERENTIATION = "differentiation"
    INTEGRATION = "integration"
    DIMENSIONAL_ANALYSIS = "dimensional_analysis"
    ELIMINATION = "elimination"
    SUBSTITUTION = "substitution"
    GRAPHICAL = "graphical"
    SYMMETRY = "symmetry"
    LIMITING_CASES = "limiting_cases"
    SUPERPOSITION = "superposition"
    CONSERVATION_LAWS = "conservation_laws"
    STOICHIOMETRY = "stoichiometry"
    ELECTROCHEMISTRY = "electrochemistry"
    ORGANIC_MECHANISM = "organic_mechanism"
    THERMODYNAMIC_CYCLE = "thermodynamic_cycle"
    MATRIX_METHOD = "matrix_method"
    VECTOR_METHOD = "vector_method"
    PROBABILITY_RULES = "probability_rules"
    INDUCTION = "induction"
    COMPARISON = "comparison"
    PATTERN_RECOGNITION = "pattern_recognition"


# =============================================================================
# SUB-MODELS — Organized groups of metadata
# =============================================================================

class QuestionCore(BaseModel):
    """The actual question content."""
    question_text: str = Field(..., min_length=20, description="Full question text")
    options: List[str] = Field(default_factory=list, description="4 options for MCQ, empty for numerical")
    correct_answer: str = Field(..., description="'A'/'B'/'C'/'D' for MCQ, numeric string for numerical")
    question_type: QuestionType = Field(default=QuestionType.MCQ)

    @field_validator("options")
    @classmethod
    def validate_options(cls, v, info):
        qtype = info.data.get("question_type", QuestionType.MCQ)
        if qtype == QuestionType.MCQ and len(v) != 4:
            if len(v) > 0:  # Allow empty during construction
                raise ValueError(f"MCQ must have exactly 4 options, got {len(v)}")
        return v


class AcademicClassification(BaseModel):
    """Where this question sits in the JEE syllabus tree."""
    subject: Subject
    chapter: str = Field(..., min_length=2, description="Exact chapter name matching knowledge_base.py")
    topic: str = Field(..., min_length=2, description="Specific topic within chapter")
    sub_topics: List[str] = Field(default_factory=list, description="Granular concepts tested")
    class_level: int = Field(..., ge=11, le=12, description="Class 11 or 12")
    category: str = Field(..., description="Macro category: Mechanics, Calculus, Organic, etc.")


class DifficultyInfo(BaseModel):
    """Multi-dimensional difficulty assessment."""
    difficulty: Difficulty = Field(default=Difficulty.MEDIUM)
    difficulty_score: float = Field(
        default=0.5, ge=0.0, le=1.0,
        description="Granular difficulty: 0.0=trivial, 1.0=olympiad-level"
    )


class CognitiveInfo(BaseModel):
    """How the student needs to think."""
    bloom_level: BloomLevel = Field(default=BloomLevel.APPLY)
    cognitive_type: CognitiveType = Field(default=CognitiveType.PROCEDURAL)
    question_style: QuestionStyle = Field(default=QuestionStyle.CALCULATION)


class SkillsConcepts(BaseModel):
    """What knowledge/skills are tested — POWERS ADAPTIVE LEARNING."""
    concepts_tested: List[str] = Field(
        default_factory=list,
        description="Specific concepts: ['Snell\\'s Law', 'Total Internal Reflection']"
    )
    formulas_used: List[str] = Field(
        default_factory=list,
        description="Exact formulas: ['n = sin((A+D)/2) / sin(A/2)']"
    )
    skills_required: List[str] = Field(
        default_factory=list,
        description="Skills: ['trigonometric_substitution', 'algebraic_manipulation']"
    )
    prerequisite_topics: List[str] = Field(
        default_factory=list,
        description="What the student should know before attempting"
    )
    error_prone_areas: List[str] = Field(
        default_factory=list,
        description="Where students typically make mistakes"
    )
    common_mistakes: List[str] = Field(
        default_factory=list,
        description="Specific mistakes to watch for"
    )


class ExamIntelligence(BaseModel):
    """Exam-specific metadata for test assembly."""
    estimated_time_seconds: int = Field(default=120, ge=30, le=600)
    marks: int = Field(default=4)
    negative_marks: int = Field(default=-1)
    solution_approach: Optional[SolutionApproach] = Field(default=None)
    solution_steps_count: int = Field(default=3, ge=1, le=15)
    multi_concept: bool = Field(default=False)


class JEERelevance(BaseModel):
    """How this question pattern relates to actual JEE exams."""
    years_appeared: List[int] = Field(
        default_factory=list,
        description="Years when similar pattern appeared: [2020, 2022, 2024]"
    )
    frequency: JEEFrequency = Field(default=JEEFrequency.REGULAR)
    weightage_percent: float = Field(
        default=0.0, ge=0.0, le=100.0,
        description="Chapter weightage from our 5-year analysis"
    )


class SolutionInfo(BaseModel):
    """Solution details for the question."""
    steps: List[str] = Field(default_factory=list, description="Step-by-step solution")
    final_answer: str = Field(default="", description="The final answer")
    key_insight: str = Field(default="", description="The critical insight to solve this")
    alternative_approaches: List[str] = Field(
        default_factory=list,
        description="Other valid ways to solve this"
    )


class DiagramInfo(BaseModel):
    """Diagram metadata."""
    requires_diagram: bool = Field(default=False)
    diagram_type: Optional[str] = Field(default=None, description="ray_optics, circuit, fbd, graph, etc.")
    diagram_description: str = Field(default="", description="What the diagram should show")


class QualityInfo(BaseModel):
    """Quality tracking — enables continuous improvement."""
    quality_score: float = Field(default=0.0, ge=0.0, le=1.0)
    validation_status: ValidationStatus = Field(default=ValidationStatus.PENDING)
    flags: List[str] = Field(default_factory=list, description="Any quality flags")


class GenerationMetadata(BaseModel):
    """How and when this question was created."""
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    model: str = Field(default="gemini-2.0-flash")
    batch_id: str = Field(default="")
    version: int = Field(default=1)
    enriched_by: str = Field(default="metadata_agent_v1")


# =============================================================================
# MAIN MODEL — The complete question bank item
# =============================================================================

class QuestionBankItem(BaseModel):
    """
    Complete question with rich metadata.
    This is the JSON structure that the metadata agent should produce.
    
    Every question in the bank follows this exact schema.
    """
    # Identity
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique question ID"
    )
    
    # Core question content
    core: QuestionCore
    
    # Academic classification (THE KEY TO SMART QUERIES)
    classification: AcademicClassification
    
    # Difficulty assessment
    difficulty_info: DifficultyInfo = Field(default_factory=DifficultyInfo)
    
    # Cognitive requirements
    cognitive: CognitiveInfo = Field(default_factory=CognitiveInfo)
    
    # Skills and concepts (POWERS ADAPTIVE LEARNING)
    skills: SkillsConcepts = Field(default_factory=SkillsConcepts)
    
    # Exam intelligence
    exam_info: ExamIntelligence = Field(default_factory=ExamIntelligence)
    
    # JEE relevance
    jee_relevance: JEERelevance = Field(default_factory=JEERelevance)
    
    # Solution
    solution: SolutionInfo = Field(default_factory=SolutionInfo)
    
    # Diagram
    diagram: DiagramInfo = Field(default_factory=DiagramInfo)
    
    # Quality
    quality: QualityInfo = Field(default_factory=QualityInfo)
    
    # Generation metadata
    generation: GenerationMetadata = Field(default_factory=GenerationMetadata)
    
    # Free-form tags for flexible filtering
    tags: List[str] = Field(
        default_factory=list,
        description="Flexible tags: ['prism', 'refraction', 'pyq_style', 'tricky_options']"
    )

    def to_flat_metadata(self) -> Dict[str, Any]:
        """
        Flatten metadata for ChromaDB storage.
        ChromaDB metadata must be flat key-value (str, int, float, bool).
        """
        return {
            "id": self.id,
            "subject": self.classification.subject.value,
            "chapter": self.classification.chapter,
            "topic": self.classification.topic,
            "sub_topics": "|".join(self.skills.concepts_tested),  # Pipe-separated for search
            "class_level": self.classification.class_level,
            "category": self.classification.category,
            "difficulty": self.difficulty_info.difficulty.value,
            "difficulty_score": self.difficulty_info.difficulty_score,
            "question_type": self.core.question_type.value,
            "question_style": self.cognitive.question_style.value,
            "bloom_level": self.cognitive.bloom_level.value,
            "cognitive_type": self.cognitive.cognitive_type.value,
            "estimated_time_seconds": self.exam_info.estimated_time_seconds,
            "marks": self.exam_info.marks,
            "negative_marks": self.exam_info.negative_marks,
            "multi_concept": self.exam_info.multi_concept,
            "solution_steps_count": self.exam_info.solution_steps_count,
            "solution_approach": self.exam_info.solution_approach.value if self.exam_info.solution_approach else "",
            "frequency": self.jee_relevance.frequency.value,
            "weightage_percent": self.jee_relevance.weightage_percent,
            "requires_diagram": self.diagram.requires_diagram,
            "quality_score": self.quality.quality_score,
            "validation_status": self.quality.validation_status.value,
            "tags": "|".join(self.tags),
            "concepts": "|".join(self.skills.concepts_tested),
            "formulas": "|".join(self.skills.formulas_used),
            "skills": "|".join(self.skills.required if hasattr(self.skills, 'required') else self.skills.skills_required),
            "error_areas": "|".join(self.skills.error_prone_areas),
            "batch_id": self.generation.batch_id,
        }

    def to_search_text(self) -> str:
        """
        Generate the text used for embedding/semantic search.
        Combines question text with key metadata for better retrieval.
        """
        parts = [
            self.classification.chapter,
            self.classification.topic,
            self.core.question_text,
            " ".join(self.skills.concepts_tested),
            " ".join(self.tags),
        ]
        return " | ".join(filter(None, parts))

    def to_api_response(self) -> Dict[str, Any]:
        """
        Convert to the backend contract format (BackendQuestionResponse).
        Returns the structured format expected by the main backend service.
        """
        # Build explanation from solution steps
        explanation = ""
        if self.solution.steps:
            explanation = " ".join(self.solution.steps)
        elif self.solution.key_insight:
            explanation = self.solution.key_insight
        
        # Build internal question dict and transform
        internal_q = {
            "question_text": self.core.question_text,
            "options": self.core.options,
            "correct_answer": self.core.correct_answer,
            "question_type": self.core.question_type.value,
            "difficulty": self.difficulty_info.difficulty.value,
            "topic": self.classification.topic,
            "subtopic": self.classification.sub_topics[0] if self.classification.sub_topics else self.classification.topic,
            "requires_diagram": self.diagram.requires_diagram,
        }
        
        return to_backend_question(
            question=internal_q,
            subject=self.classification.subject.value,
            explanation=explanation,
            marks=self.exam_info.marks,
            time_limit=self.exam_info.estimated_time_seconds,
        )

    class Config:
        json_schema_extra = {
            "example": {
                "id": "PHY_RAY_OPTICS_001_MCQ_M",
                "core": {
                    "question_text": "A ray of light passes through a prism of refracting angle 60° and is found to be deviated through an angle of 30°. What is the refractive index of the material of the prism?",
                    "options": ["1.5", "1.73", "2.0", "1.0"],
                    "correct_answer": "B",
                    "question_type": "mcq"
                },
                "classification": {
                    "subject": "physics",
                    "chapter": "Ray Optics and Optical Instruments",
                    "topic": "Refraction Through Prism",
                    "sub_topics": ["Snell's Law", "Minimum Deviation"],
                    "class_level": 12,
                    "category": "Optics"
                },
                "difficulty_info": {
                    "difficulty": "medium",
                    "difficulty_score": 0.55
                },
                "cognitive": {
                    "bloom_level": "apply",
                    "cognitive_type": "procedural",
                    "question_style": "calculation"
                },
                "skills": {
                    "concepts_tested": ["Snell's Law at prism surfaces", "Minimum deviation formula"],
                    "formulas_used": ["n = sin((A+D)/2) / sin(A/2)"],
                    "skills_required": ["trigonometric_substitution", "algebraic_manipulation"],
                    "prerequisite_topics": ["Refraction of Light", "Snell's Law Basics"],
                    "error_prone_areas": ["Forgetting minimum deviation condition", "Angle unit errors"],
                    "common_mistakes": ["Using wrong formula for non-minimum deviation"]
                },
                "exam_info": {
                    "estimated_time_seconds": 120,
                    "marks": 4,
                    "negative_marks": -1,
                    "solution_approach": "direct_formula",
                    "solution_steps_count": 3,
                    "multi_concept": False
                },
                "jee_relevance": {
                    "years_appeared": [2020, 2022, 2024],
                    "frequency": "regular",
                    "weightage_percent": 4.49
                },
                "tags": ["prism", "refraction", "ray_optics", "class12", "moderate_calculation"]
            }
        }


# =============================================================================
# QUERY MODEL — For smart retrieval from the bank
# =============================================================================

class QuestionBankQuery(BaseModel):
    """
    Query specification for retrieving questions from the bank.
    Every field is optional — combine any filters.
    """
    # What subject/chapter/topic
    subjects: Optional[List[Subject]] = None
    chapters: Optional[List[str]] = None
    topics: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    class_levels: Optional[List[int]] = None

    # Difficulty
    difficulties: Optional[List[Difficulty]] = None
    min_difficulty_score: Optional[float] = None
    max_difficulty_score: Optional[float] = None

    # Question type
    question_types: Optional[List[QuestionType]] = None
    question_styles: Optional[List[QuestionStyle]] = None

    # Cognitive
    bloom_levels: Optional[List[BloomLevel]] = None
    cognitive_types: Optional[List[CognitiveType]] = None

    # Skills/concepts filter
    concepts_include: Optional[List[str]] = None  # Must test these concepts
    concepts_exclude: Optional[List[str]] = None  # Must NOT test these concepts
    skills_include: Optional[List[str]] = None
    
    # Exam constraints
    max_time_seconds: Optional[int] = None
    solution_approaches: Optional[List[SolutionApproach]] = None
    multi_concept_only: Optional[bool] = None

    # Tags
    tags_include: Optional[List[str]] = None
    tags_exclude: Optional[List[str]] = None
    
    # Targeting weaknesses
    error_areas_include: Optional[List[str]] = None  # Questions where students make specific errors
    
    # JEE relevance
    min_frequency: Optional[JEEFrequency] = None
    jee_years: Optional[List[int]] = None  # Question patterns from these JEE years

    # Quality
    min_quality_score: Optional[float] = None
    validation_statuses: Optional[List[ValidationStatus]] = None

    # Semantic search (combine with metadata filters)
    semantic_query: Optional[str] = None

    # Pagination & limits
    count: int = Field(default=10, ge=1, le=100, description="Number of questions to retrieve")
    offset: int = Field(default=0, ge=0)
    
    # Exclude already-served questions (prevents repetition)
    exclude_ids: Optional[List[str]] = None
    
    # Randomize order (for variety)
    randomize: bool = Field(default=True)


class QueryResult(BaseModel):
    """Result from a question bank query."""
    questions: List[QuestionBankItem]
    total_matching: int = Field(description="Total questions matching the filters (before pagination)")
    query_time_ms: float = Field(description="How long the query took")
    filters_applied: Dict[str, Any] = Field(
        default_factory=dict,
        description="Summary of which filters were active"
    )


# =============================================================================
# BACKEND CONTRACT — Structured response format for the main backend service
# =============================================================================

# Global counter for question ID generation (thread-safe)
_question_counter: int = 0
_counter_lock = threading.Lock()
_issued_ids: set = set()  # Registry of all issued IDs — guarantees uniqueness


def _abbreviate_topic(topic: str) -> str:
    """Create a short uppercase abbreviation from a topic name.
    
    Examples:
        'Thermodynamics' -> 'THERMO'
        'Ray Optics and Optical Instruments' -> 'RAYOPT'
        'Coordinate Geometry' -> 'COORDG'
        'First Law' -> 'FIRST'
    """
    # Common abbreviation map
    abbreviations = {
        "thermodynamics": "THERMO",
        "mechanics": "MECH",
        "kinematics": "KINEM",
        "electrostatics": "ELSTAT",
        "electromagnetic": "ELMAG",
        "electromagnetic induction": "EMIND",
        "magnetism": "MAGNT",
        "optics": "OPTIC",
        "ray optics": "RAYOPT",
        "wave optics": "WAVOPT",
        "modern physics": "MODPH",
        "nuclear physics": "NUCLR",
        "gravitation": "GRAVT",
        "rotational motion": "ROTMN",
        "fluid mechanics": "FLUID",
        "waves": "WAVES",
        "oscillations": "OSCIL",
        "current electricity": "CUREL",
        "semiconductors": "SEMCN",
        "calculus": "CALC",
        "algebra": "ALGBR",
        "coordinate geometry": "COORDG",
        "trigonometry": "TRIGO",
        "probability": "PROBL",
        "statistics": "STATS",
        "matrices": "MATRX",
        "determinants": "DETRM",
        "vectors": "VECTR",
        "complex numbers": "CMPXN",
        "differential equations": "DIFEQ",
        "integration": "INTGR",
        "differentiation": "DIFFN",
        "limits": "LIMIT",
        "sequences and series": "SEQSR",
        "permutations and combinations": "PERMCOMB",
        "binomial theorem": "BINOM",
        "sets and relations": "SETRL",
        "functions": "FUNCN",
        "conic sections": "CONIC",
        "3d geometry": "3DGEOM",
        "organic chemistry": "ORGCH",
        "inorganic chemistry": "INORG",
        "physical chemistry": "PHYCH",
        "chemical bonding": "CHBND",
        "chemical kinetics": "CHKIN",
        "electrochemistry": "ELCHM",
        "solutions": "SOLTN",
        "solid state": "SOLID",
        "surface chemistry": "SURFCH",
        "polymers": "POLYM",
        "biomolecules": "BIOMOL",
        "environmental chemistry": "ENVCH",
        "atomic structure": "ATMST",
        "periodic table": "PERTB",
        "equilibrium": "EQUIL",
        "redox reactions": "REDOX",
        "hydrocarbons": "HYDCB",
        "aldehydes and ketones": "ALDKT",
        "alcohols and ethers": "ALETH",
        "amines": "AMINE",
        "carboxylic acids": "CARBA",
        "coordination compounds": "COORD",
        "p-block elements": "PBLCK",
        "d-block elements": "DBLCK",
        "s-block elements": "SBLCK",
        "metallurgy": "METLG",
        "hydrogen": "HYDGN",
        "chemical thermodynamics": "CHTHM",
        "ionic equilibrium": "IONEQ",
        "gaseous state": "GASES",
        "mole concept": "MOLEC",
        "stoichiometry": "STOIC",
    }
    
    topic_lower = topic.lower().strip()
    if topic_lower in abbreviations:
        return abbreviations[topic_lower]
    
    # Fallback: take first 5 uppercase consonants/chars
    cleaned = re.sub(r'[^a-zA-Z]', '', topic)
    if len(cleaned) <= 6:
        return cleaned.upper()
    # Take first 3 + last 2 chars
    return (cleaned[:4] + cleaned[-2:]).upper()


def generate_question_id(subject: str, topic: str) -> str:
    """Generate a globally unique, human-readable question ID.
    
    Format: {SUBJECT_PREFIX}-{TOPIC_ABBREV}-{6_DIGIT_HASH}
    Thread-safe. Each ID is checked against a registry to guarantee uniqueness.
    
    Examples:
        PHY-THERMO-000342
        MAT-CALC-001247
        CHE-ORGCH-000891
    """
    global _question_counter
    
    subject_prefix = {
        "physics": "PHY",
        "math": "MAT",
        "chemistry": "CHE",
    }.get(subject.lower(), "GEN")
    
    topic_abbrev = _abbreviate_topic(topic)
    
    # Retry loop to guarantee uniqueness
    for _ in range(100):
        with _counter_lock:
            _question_counter += 1
            unique_seed = f"{_question_counter}-{uuid.uuid4().hex[:8]}"
        
        hash_num = int(hashlib.md5(unique_seed.encode()).hexdigest()[:6], 16) % 1000000
        candidate = f"{subject_prefix}-{topic_abbrev}-{hash_num:06d}"
        
        with _counter_lock:
            if candidate not in _issued_ids:
                _issued_ids.add(candidate)
                return candidate
    
    # Fallback: use full uuid suffix if hash collisions persist
    fallback = f"{subject_prefix}-{topic_abbrev}-{uuid.uuid4().hex[:6].upper()}"
    with _counter_lock:
        _issued_ids.add(fallback)
    return fallback


def is_question_id_unique(question_id: str) -> bool:
    """Check whether a questionId has already been issued."""
    with _counter_lock:
        return question_id not in _issued_ids


def register_question_id(question_id: str) -> bool:
    """Register an external questionId in the uniqueness registry.
    
    Returns True if the ID was new and successfully registered,
    False if it was already taken (duplicate).
    """
    with _counter_lock:
        if question_id in _issued_ids:
            return False
        _issued_ids.add(question_id)
        return True


class ContentPayloadOption(BaseModel):
    """A single MCQ option with key and text."""
    key: str = Field(..., description="Option key: A, B, C, or D")
    text: str = Field(..., description="Option text")


class ContentPayload(BaseModel):
    """Content payload for a question. Structure depends on questionType."""
    question: str = Field(..., description="The question text")
    options: Optional[List[ContentPayloadOption]] = Field(
        None, description="MCQ options (absent for numeric questions)"
    )


class BackendQuestionResponse(BaseModel):
    """
    Structured question contract for the main backend service.
    
    This is the OFFICIAL response format that the backend expects.
    All question generation endpoints MUST return questions in this shape.
    
    Immutability: When inserted into TestQuestion, the backend snapshots
    all fields so historical tests are unaffected by future edits.
    """
    questionId: str = Field(..., description="Globally unique, immutable ID (e.g. PHY-THERMO-000342)")
    subject: str = Field(..., description="Subject name: Physics, Math, Chemistry")
    topic: str = Field(..., description="Topic within the subject")
    subtopic: str = Field(default="General", description="Specific subtopic tested")
    difficulty: str = Field(..., description="easy, medium, or hard")
    questionType: str = Field(..., description="MCQ or numeric")
    contentPayload: ContentPayload = Field(..., description="Question content with text and options")
    correctAnswer: str = Field(..., description="Correct answer: A/B/C/D for MCQ, numeric string for numeric")
    explanation: str = Field(default="", description="Step-by-step explanation of the solution")
    marks: int = Field(default=4, description="Marks awarded for correct answer")
    negativeMark: float = Field(default=0, description="Marks deducted for wrong answer (MCQ: -1, numeric: 0)")
    timeLimit: int = Field(default=120, description="Time limit in seconds")

    model_config = {"populate_by_name": True}


def to_backend_question(
    question: Dict[str, Any],
    subject: str,
    explanation: str = "",
    marks: int = 4,
    time_limit: int = 120,
) -> Dict[str, Any]:
    """
    Transform an internal question dict into the backend contract format.
    
    This is the boundary transformation — internal agents produce their
    natural format, and this function converts to the backend contract.
    
    Args:
        question: Internal question dict with question_text, options, correct_answer, etc.
        subject: Subject name (physics, math, chemistry)
        explanation: Solution explanation string
        marks: Marks for the question (default 4)
        time_limit: Time limit in seconds (default 120)
    
    Returns:
        Dict matching BackendQuestionResponse schema
    """
    topic = question.get("topic", "General")
    subtopic = question.get("subtopic", question.get("sub_topic", "General"))
    question_type_raw = question.get("question_type", "mcq")
    
    # Map internal types to backend contract types
    question_type = "MCQ" if question_type_raw == "mcq" else "numeric"
    
    # Capitalize subject for display
    subject_display = {
        "physics": "Physics",
        "math": "Math",
        "chemistry": "Chemistry",
    }.get(subject.lower(), subject.capitalize())
    
    # Generate unique ID
    question_id = question.get("questionId") or generate_question_id(subject, topic)
    
    # Build content payload
    question_text = question.get("question_text", question.get("question", ""))
    
    if question_type == "MCQ":
        raw_options = question.get("options", [])
        keys = ["A", "B", "C", "D"]
        options = []
        for i, opt in enumerate(raw_options):
            if isinstance(opt, dict):
                # Already in {key, text} format
                options.append(opt)
            else:
                key = keys[i] if i < len(keys) else chr(65 + i)
                options.append({"key": key, "text": str(opt)})
        
        content_payload = {
            "question": question_text,
            "options": options,
        }
    else:
        # Numeric: contentPayload is just the question
        content_payload = {
            "question": question_text,
        }
    
    correct_answer = str(question.get("correct_answer", question.get("correctAnswer", "")))
    
    # Build explanation from solution if available
    if not explanation:
        solution = question.get("solution", {})
        if isinstance(solution, dict):
            steps = solution.get("steps", [])
            if steps:
                explanation = " ".join(steps)
            elif solution.get("key_insight"):
                explanation = solution["key_insight"]
        elif isinstance(solution, str):
            explanation = solution
    
    return {
        "questionId": question_id,
        "subject": subject_display,
        "topic": topic,
        "subtopic": subtopic,
        "difficulty": question.get("difficulty", "medium"),
        "questionType": question_type,
        "contentPayload": content_payload,
        "correctAnswer": correct_answer,
        "explanation": explanation,
        "marks": marks,
        "negativeMark": -1 if question_type == "MCQ" else 0,
        "timeLimit": time_limit,
    }


def snapshot_for_test(question: Dict[str, Any]) -> Dict[str, Any]:
    """Create an immutable snapshot of a question for test insertion.
    
    When a question is inserted into a TestQuestion, all metadata must be
    frozen at the point-in-time so that historical tests remain unaffected
    by future question edits. This is mandatory for analytics correctness.
    
    Args:
        question: A dict in BackendQuestionResponse format.
    
    Returns:
        A deep-copied dict with an added `_snapshot` block containing
        the snapshot timestamp and frozen flag.
    """
    frozen = copy.deepcopy(question)
    frozen["_snapshot"] = {
        "snapshotAt": datetime.now(timezone.utc).isoformat(),
        "immutable": True,
    }
    return frozen
