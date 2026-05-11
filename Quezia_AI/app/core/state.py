"""
Shared Graph State - SINGLE SOURCE OF TRUTH
All agents communicate through this state structure.
NO agent may add new keys. NO agent may mutate unrelated keys.
"""
from typing import TypedDict, Optional, List, Dict, Any, Literal


class AIState(TypedDict, total=False):
    # Request metadata (Required)
    user_id: str
    task: str  # generate_question | generate_test | analyze_performance
    exam: str  # JEE_MAIN
    
    # LEGACY: For backward compatibility
    subject: Optional[str]  # physics | math | chemistry
    topic: Optional[str]
    difficulty: Optional[str]  # easy | medium | hard | mixed
    question_type: Optional[str]  # mcq | numerical (for single question generation)
    
    # NEW: Flexible question generation
    subjects: Optional[List[str]]  # ["physics", "math", "chemistry"]
    questionCount: Optional[int]  # Total number of questions to generate
    testMode: Optional[str]  # single_question | test

    # Generation outputs
    question: Optional[Dict[str, Any]]  # LEGACY: single question
    questions: Optional[List[Dict[str, Any]]]  # NEW: multiple questions
    solution: Optional[Dict[str, Any]]
    diagram_spec: Optional[Dict[str, Any]]
    diagram_image: Optional[str]  # base64 encoded image

    # Test-related
    test_questions: Optional[List[Dict[str, Any]]]

    # Performance
    raw_attempt_data: Optional[Dict[str, Any]]
    performance_metrics: Optional[Dict[str, Any]]
    insights: Optional[Dict[str, Any]]
    study_plan: Optional[Dict[str, Any]]

    # Control flags
    validation_passed: bool
    verification_passed: bool
    requires_diagram: bool

    # Internal retry tracking (not part of API contract)
    retry_count: Optional[int]
    last_error: Optional[str]
