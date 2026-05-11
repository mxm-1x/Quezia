"""Models package - Pydantic schemas for the JEE AI Service."""

from app.models.question_schema import (
    QuestionBankItem,
    QuestionCore,
    AcademicClassification,
    DifficultyInfo,
    CognitiveInfo,
    SkillsConcepts,
    ExamIntelligence,
    JEERelevance,
    QualityInfo,
    GenerationMetadata,
    SolutionInfo,
    DiagramInfo,
    QuestionBankQuery,
    QueryResult,
)

__all__ = [
    "QuestionBankItem",
    "QuestionCore",
    "AcademicClassification",
    "DifficultyInfo",
    "CognitiveInfo",
    "SkillsConcepts",
    "ExamIntelligence",
    "JEERelevance",
    "QualityInfo",
    "GenerationMetadata",
    "SolutionInfo",
    "DiagramInfo",
    "QuestionBankQuery",
    "QueryResult",
]
