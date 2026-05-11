"""
Tests for the backend question contract format.
Validates that questions match the structured contract expected by the main backend.
"""
import json
import threading
import pytest
from app.models.question_schema import (
    to_backend_question,
    generate_question_id,
    is_question_id_unique,
    register_question_id,
    snapshot_for_test,
    BackendQuestionResponse,
    ContentPayload,
    ContentPayloadOption,
)


class TestGenerateQuestionId:
    """Test question ID generation."""

    def test_physics_id_format(self):
        qid = generate_question_id("physics", "Thermodynamics")
        assert qid.startswith("PHY-THERMO-")
        parts = qid.split("-")
        assert len(parts) == 3
        assert len(parts[2]) == 6  # 6-digit number

    def test_math_id_format(self):
        qid = generate_question_id("math", "Calculus")
        assert qid.startswith("MAT-CALC-")

    def test_chemistry_id_format(self):
        qid = generate_question_id("chemistry", "Organic Chemistry")
        assert qid.startswith("CHE-ORGCH-")

    def test_ids_are_unique(self):
        ids = set()
        for _ in range(100):
            qid = generate_question_id("physics", "Mechanics")
            ids.add(qid)
        assert len(ids) == 100  # All unique


class TestToBackendQuestion:
    """Test the internal-to-contract transformation."""

    def test_mcq_transformation(self):
        mcq = {
            "question_text": "A gas expands at constant pressure of 2 atm from 2 L to 5 L. Calculate the work done.",
            "options": ["2e5 J", "6e5 J", "600 J", "300 J"],
            "correct_answer": "D",
            "difficulty": "medium",
            "topic": "Thermodynamics",
            "subtopic": "First Law",
            "question_type": "mcq",
        }

        result = to_backend_question(
            question=mcq,
            subject="physics",
            explanation="Work = PDV = 300 J",
        )

        assert result["questionId"].startswith("PHY-THERMO-")
        assert result["subject"] == "Physics"
        assert result["topic"] == "Thermodynamics"
        assert result["subtopic"] == "First Law"
        assert result["difficulty"] == "medium"
        assert result["questionType"] == "MCQ"
        assert result["correctAnswer"] == "D"
        assert result["explanation"] == "Work = PDV = 300 J"
        assert result["marks"] == 4
        assert result["timeLimit"] == 120

        # Verify contentPayload structure
        payload = result["contentPayload"]
        assert "question" in payload
        assert "options" in payload
        assert len(payload["options"]) == 4
        assert payload["options"][0]["key"] == "A"
        assert payload["options"][0]["text"] == "2e5 J"
        assert payload["options"][3]["key"] == "D"
        assert payload["options"][3]["text"] == "300 J"

    def test_numerical_transformation(self):
        numerical = {
            "question_text": "Calculate the de Broglie wavelength in nm.",
            "correct_answer": "0.73",
            "difficulty": "hard",
            "topic": "Modern Physics",
            "subtopic": "Wave-Particle Duality",
            "question_type": "numerical",
        }

        result = to_backend_question(
            question=numerical,
            subject="physics",
            explanation="lambda = h/mv = 0.73 nm",
        )

        assert result["questionType"] == "numeric"
        assert result["correctAnswer"] == "0.73"

        # Numeric: contentPayload has only question, no options
        payload = result["contentPayload"]
        assert "question" in payload
        assert payload.get("options") is None

    def test_default_marks_and_time(self):
        q = {
            "question_text": "Simple test question for validation purposes.",
            "options": ["A", "B", "C", "D"],
            "correct_answer": "A",
            "difficulty": "easy",
            "topic": "General",
            "question_type": "mcq",
        }
        result = to_backend_question(question=q, subject="math")
        assert result["marks"] == 4
        assert result["timeLimit"] == 120

    def test_custom_marks_and_time(self):
        q = {
            "question_text": "Custom marks question for testing override.",
            "correct_answer": "42",
            "difficulty": "hard",
            "topic": "Integration",
            "question_type": "numerical",
        }
        result = to_backend_question(question=q, subject="math", marks=5, time_limit=180)
        assert result["marks"] == 5
        assert result["timeLimit"] == 180

    def test_subject_capitalization(self):
        q = {
            "question_text": "Test question for subject capitalization check.",
            "options": ["A", "B", "C", "D"],
            "correct_answer": "A",
            "difficulty": "easy",
            "topic": "General",
            "question_type": "mcq",
        }
        assert to_backend_question(question=q, subject="physics")["subject"] == "Physics"
        assert to_backend_question(question=q, subject="math")["subject"] == "Math"
        assert to_backend_question(question=q, subject="chemistry")["subject"] == "Chemistry"


class TestBackendQuestionResponseModel:
    """Test Pydantic validation of the contract model."""

    def test_valid_mcq(self):
        data = {
            "questionId": "PHY-THERMO-000342",
            "subject": "Physics",
            "topic": "Thermodynamics",
            "subtopic": "First Law",
            "difficulty": "medium",
            "questionType": "MCQ",
            "contentPayload": {
                "question": "A gas expands at constant pressure...",
                "options": [
                    {"key": "A", "text": "2e5 J"},
                    {"key": "B", "text": "6e5 J"},
                    {"key": "C", "text": "600 J"},
                    {"key": "D", "text": "300 J"},
                ],
            },
            "correctAnswer": "D",
            "explanation": "Work = PDV = 300 J",
            "marks": 4,
            "timeLimit": 120,
        }
        model = BackendQuestionResponse(**data)
        assert model.questionId == "PHY-THERMO-000342"
        assert model.questionType == "MCQ"
        assert len(model.contentPayload.options) == 4

    def test_valid_numeric(self):
        data = {
            "questionId": "PHY-MODPH-000001",
            "subject": "Physics",
            "topic": "Modern Physics",
            "subtopic": "Wave-Particle Duality",
            "difficulty": "hard",
            "questionType": "numeric",
            "contentPayload": {
                "question": "Calculate the wavelength...",
            },
            "correctAnswer": "0.73",
            "explanation": "lambda = h/mv",
        }
        model = BackendQuestionResponse(**data)
        assert model.questionType == "numeric"
        assert model.contentPayload.options is None


class TestEndToEndContract:
    """Integration test: generate -> transform -> validate."""

    def test_mcq_roundtrip(self):
        """Internal question -> to_backend_question -> BackendQuestionResponse validation."""
        internal = {
            "question_text": "What is Newton's second law in terms of momentum?",
            "options": ["F = ma", "F = dp/dt", "F = mv", "F = mv^2"],
            "correct_answer": "B",
            "difficulty": "easy",
            "topic": "Mechanics",
            "subtopic": "Newton's Laws",
            "question_type": "mcq",
        }

        contract = to_backend_question(
            question=internal,
            subject="physics",
            explanation="Newton's second law: F = dp/dt",
        )

        # Validate through Pydantic
        model = BackendQuestionResponse(**contract)
        assert model.questionId.startswith("PHY-MECH-")
        assert model.subject == "Physics"
        assert model.questionType == "MCQ"
        assert model.correctAnswer == "B"

    def test_numerical_roundtrip(self):
        internal = {
            "question_text": "Find the value of integral from 0 to pi of sin(x) dx.",
            "correct_answer": "2",
            "difficulty": "easy",
            "topic": "Integration",
            "question_type": "numerical",
        }

        contract = to_backend_question(
            question=internal,
            subject="math",
            explanation="Integral of sin(x) = -cos(x). Evaluate from 0 to pi = 2",
        )

        model = BackendQuestionResponse(**contract)
        assert model.questionType == "numeric"
        assert model.correctAnswer == "2"
        assert model.contentPayload.options is None


class TestNegativeMarks:
    """Test negative marking is applied correctly per question type."""

    def test_mcq_has_negative_mark(self):
        q = {
            "question_text": "MCQ question for negative mark test assertion.",
            "options": ["A", "B", "C", "D"],
            "correct_answer": "A",
            "difficulty": "easy",
            "topic": "General",
            "question_type": "mcq",
        }
        result = to_backend_question(question=q, subject="physics")
        assert result["negativeMark"] == -1

    def test_numeric_has_zero_negative_mark(self):
        q = {
            "question_text": "Numeric question for negative mark test assertion.",
            "correct_answer": "42",
            "difficulty": "medium",
            "topic": "General",
            "question_type": "numerical",
        }
        result = to_backend_question(question=q, subject="math")
        assert result["negativeMark"] == 0

    def test_pydantic_model_has_negative_mark(self):
        data = {
            "questionId": "PHY-GEN-000001",
            "subject": "Physics",
            "topic": "General",
            "difficulty": "easy",
            "questionType": "MCQ",
            "contentPayload": {"question": "Test?", "options": [{"key": "A", "text": "x"}]},
            "correctAnswer": "A",
            "negativeMark": -1,
        }
        model = BackendQuestionResponse(**data)
        assert model.negativeMark == -1


class TestQuestionUniqueness:
    """Test question uniqueness enforcement."""

    def test_thread_safe_id_generation(self):
        """IDs generated from multiple threads are all unique."""
        ids = []
        errors = []

        def gen_ids(results_list):
            try:
                for _ in range(50):
                    results_list.append(generate_question_id("physics", "Mechanics"))
            except Exception as e:
                errors.append(e)

        threads = [threading.Thread(target=gen_ids, args=(ids,)) for _ in range(4)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert not errors, f"Errors in threads: {errors}"
        assert len(ids) == 200
        assert len(set(ids)) == 200  # All unique

    def test_register_external_id(self):
        unique_id = f"EXT-TEST-{id(self)}"
        assert register_question_id(unique_id) is True
        assert register_question_id(unique_id) is False  # Duplicate

    def test_is_question_id_unique(self):
        fresh_id = f"CHK-TEST-{id(self)}"
        assert is_question_id_unique(fresh_id) is True
        register_question_id(fresh_id)
        assert is_question_id_unique(fresh_id) is False


class TestSnapshotForTest:
    """Test immutable snapshot for TestQuestion insertion."""

    def test_snapshot_adds_metadata(self):
        q = to_backend_question(
            question={
                "question_text": "Snapshot test question for immutability check.",
                "options": ["A", "B", "C", "D"],
                "correct_answer": "A",
                "difficulty": "easy",
                "topic": "General",
                "question_type": "mcq",
            },
            subject="physics",
        )
        snap = snapshot_for_test(q)

        assert "_snapshot" in snap
        assert snap["_snapshot"]["immutable"] is True
        assert "snapshotAt" in snap["_snapshot"]
        # timezone-aware UTC format includes +00:00
        assert "+00:00" in snap["_snapshot"]["snapshotAt"] or snap["_snapshot"]["snapshotAt"].endswith("Z")

    def test_snapshot_is_deep_copy(self):
        """Modifying original must NOT affect snapshot."""
        q = to_backend_question(
            question={
                "question_text": "Deep copy isolation test question for snapshot.",
                "options": ["A", "B", "C", "D"],
                "correct_answer": "B",
                "difficulty": "medium",
                "topic": "Optics",
                "question_type": "mcq",
            },
            subject="physics",
        )
        snap = snapshot_for_test(q)

        # Mutate original
        q["topic"] = "MODIFIED"
        q["contentPayload"]["question"] = "MODIFIED"

        # Snapshot must be untouched
        assert snap["topic"] == "Optics"
        assert "MODIFIED" not in snap["contentPayload"]["question"]

    def test_snapshot_preserves_all_contract_fields(self):
        q = to_backend_question(
            question={
                "question_text": "Preservation test for all contract fields.",
                "options": ["A", "B", "C", "D"],
                "correct_answer": "C",
                "difficulty": "hard",
                "topic": "Thermodynamics",
                "subtopic": "Second Law",
                "question_type": "mcq",
            },
            subject="physics",
            explanation="Test explanation",
            marks=4,
            time_limit=120,
        )
        snap = snapshot_for_test(q)

        # Every contract field survives snapshotting
        for key in ["questionId", "subject", "topic", "subtopic", "difficulty",
                     "questionType", "contentPayload", "correctAnswer",
                     "explanation", "marks", "negativeMark", "timeLimit"]:
            assert key in snap, f"Missing key: {key}"
