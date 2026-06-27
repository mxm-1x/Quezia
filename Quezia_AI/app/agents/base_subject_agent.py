"""
Base Subject Agent — Parameterized question generator.

All subject-specific agents (physics, math, chemistry) share identical logic.
Only the expertise string and subject name differ.
This class eliminates ~800 lines of duplication.
"""
from typing import Dict, Any, Optional, List
import random

from app.core.state import AIState
from app.core.llm import get_llm
from app.core.logging import get_logger
from app.data.knowledge_base import get_knowledge_base
from app.data.vector_store import get_vector_store

logger = get_logger(__name__)


class SubjectAgent:
    """
    Parameterized JEE question generator for any subject.

    Usage:
        physics = SubjectAgent(
            subject="physics",
            expertise=PHYSICS_EXPERTISE,
            teacher_desc="expert JEE PHYSICS teacher with 20+ years ...",
        )
        # As a LangGraph node:
        workflow.add_node("physics_agent", physics.as_node())
    """

    def __init__(
        self,
        subject: str,
        expertise: str,
        teacher_desc: str,
    ):
        self.subject = subject
        self.expertise = expertise
        self.teacher_desc = teacher_desc

    # ── System prompt builder ──────────────────────────────────────────

    def _build_system_prompt(
        self,
        topic: Optional[str] = None,
        few_shot_examples: str = "",
        question_type: str = "mcq",
    ) -> str:
        kb = get_knowledge_base()
        context = kb.get_context_for_prompt(self.subject, topic)

        examples_section = ""
        if few_shot_examples:
            examples_section = (
                f"\n## REFERENCE: PAST JEE {self.subject.upper()} QUESTIONS "
                f"(Study these for style and difficulty)\n"
                f"{few_shot_examples}\n\n"
                "Use the above examples as reference for question style, "
                "complexity, and format.\n"
            )

        if question_type == "mcq":
            type_rules = (
                "1. Generate ONLY ONE MCQ with exactly 4 options (A, B, C, D)\n"
                "2. Exactly ONE option must be correct"
            )
            output_format = (
                'OUTPUT FORMAT (STRICT JSON):\n{\n'
                '    "question_text": "The question...",\n'
                '    "options": ["Option A", "Option B", "Option C", "Option D"],\n'
                '    "correct_answer": "A",\n'
                '    "difficulty": "medium",\n'
                '    "topic": "Specific topic",\n'
                '    "subtopic": "Specific subtopic or concept tested",\n'
                '    "requires_diagram": false,\n'
                '    "diagram_description": "Brief description (only if requires_diagram is true)",\n'
                '    "question_type": "mcq"\n}\n\n'
                "Note: Set requires_diagram=true only when a diagram is essential. "
                "Include diagram_description when true."
            )
        else:
            type_rules = (
                "1. Generate ONLY ONE numerical question requiring specific numerical answer\n"
                "2. Provide the exact numerical answer (integer or decimal)"
            )
            output_format = (
                'OUTPUT FORMAT (STRICT JSON):\n{\n'
                '    "question_text": "The question with numerical values...",\n'
                '    "correct_answer": 42.5,\n'
                '    "difficulty": "medium",\n'
                '    "topic": "Specific topic",\n'
                '    "subtopic": "Specific subtopic or concept tested",\n'
                '    "requires_diagram": false,\n'
                '    "diagram_description": "Brief description (only if requires_diagram is true)",\n'
                '    "question_type": "numerical",\n'
                '    "answer_tolerance": 0.01\n}\n\n'
                "Note: Set requires_diagram=true only when a diagram is essential. "
                "Include diagram_description when true."
            )

        return (
            f"You are {self.teacher_desc}.\n"
            f"Your task is to generate EXACTLY ONE high-quality JEE-Main level "
            f"{question_type.upper()} question.\n\n"
            f"{self.expertise}\n\n"
            f"{context}\n"
            f"{examples_section}"
            f"CRITICAL RULES:\n{type_rules}\n"
            "3. Question must be solvable in 2-3 minutes\n"
            f"4. Match the difficulty and style of actual JEE Main {self.subject.capitalize()} questions\n"
            "5. Set requires_diagram=true only when the question describes a setup that genuinely "
            "needs a visual to be understood\n"
            '6. When requires_diagram=true, include a "diagram_description" field\n'
            "7. Focus on concepts that appear frequently in JEE\n\n"
            f"{output_format}\n\n"
            "DIFFICULTY GUIDELINES:\n"
            "- easy: Direct formula/concept application\n"
            "- medium: 2-3 concepts combined\n"
            "- hard: Multi-step reasoning, complex problem solving\n\n"
            "Respond ONLY with valid JSON. No markdown, no explanations."
        )

    # ── User prompt builder ────────────────────────────────────────────

    def _build_user_prompt(
        self, difficulty: str, topic: str, question_type: str
    ) -> str:
        return (
            f"Generate a JEE-Main level {self.subject.upper()} question.\n\n"
            f"Parameters:\n"
            f"- Question Type: {question_type.upper()}\n"
            f"- Difficulty: {difficulty}\n"
            f"- Topic: {topic}\n"
            f"- Exam: JEE Main 2026\n\n"
            "Generate the question following the exact JSON format specified."
        )

    # ── Shared generation logic ────────────────────────────────────────

    def _resolve_topic_and_difficulty(self, state: AIState):
        """Pick topic and difficulty from state or knowledge base."""
        kb = get_knowledge_base()
        difficulty = state.get("difficulty") or "medium"
        topic = state.get("topic")

        if not topic or topic == "any":
            if random.random() < 0.7:
                topic = kb.get_high_priority_topic(self.subject)
            else:
                topic = kb.get_weighted_topic(self.subject)
            logger.info(f"{self.subject}_topic_selected_by_weightage", topic=topic)

        if difficulty == "mixed":
            difficulty = kb.get_difficulty_for_topic(self.subject, topic)

        return topic, difficulty

    def _fetch_few_shot(self, topic: str) -> str:
        vs = get_vector_store()
        try:
            examples = vs.get_few_shot_examples(
                subject=self.subject, topic=topic, n_examples=2
            )
            if examples:
                formatted = vs.format_examples_for_prompt(examples)
                logger.info(
                    f"{self.subject}_few_shot_examples_loaded",
                    count=len(examples),
                    topic=topic,
                )
                return formatted
        except Exception as e:
            logger.warning(f"{self.subject}_few_shot_examples_failed", error=str(e))
        return ""

    def _validate_response(
        self, response: Dict[str, Any], question_type: str
    ) -> Dict[str, Any]:
        """Validate LLM response structure (no LLM call)."""
        required_fields = [
            "question_text", "correct_answer", "difficulty",
            "topic", "requires_diagram",
        ]
        missing = [f for f in required_fields if f not in response]
        if missing:
            raise ValueError(
                f"Missing required fields in {self.subject} response: {', '.join(missing)}"
            )

        if question_type == "mcq":
            if "options" not in response or len(response.get("options", [])) != 4:
                raise ValueError(
                    f"MCQ must have 4 options, got {len(response.get('options', []))}"
                )
            if response["correct_answer"] not in ["A", "B", "C", "D"]:
                raise ValueError(
                    f"Invalid correct_answer for MCQ: {response['correct_answer']}"
                )
        else:
            try:
                float(response["correct_answer"])
            except (ValueError, TypeError):
                raise ValueError(
                    f"Numerical question must have numeric answer, "
                    f"got: {response['correct_answer']}"
                )

        response["question_type"] = question_type
        return response

    # ── Sync generation ────────────────────────────────────────────────

    def generate(self, state: AIState, question_type: str = "mcq") -> Dict[str, Any]:
        """Generate a single question (sync)."""
        llm = get_llm()
        topic, difficulty = self._resolve_topic_and_difficulty(state)
        few_shot = self._fetch_few_shot(topic)

        system_prompt = self._build_system_prompt(topic, few_shot, question_type)
        user_prompt = self._build_user_prompt(difficulty, topic, question_type)

        logger.info(f"{self.subject}_agent_generating", difficulty=difficulty, topic=topic)

        try:
            response = llm.invoke(system_prompt, user_prompt, expect_json=True, tier="complex")
        except Exception as e:
            logger.error(f"{self.subject}_agent_llm_invocation_failed", error=str(e))
            raise ValueError(f"Failed to generate {self.subject} question: {e}")

        response = self._validate_response(response, question_type)

        logger.info(
            f"{self.subject}_agent_generated",
            topic=response.get("topic"),
            difficulty=response.get("difficulty"),
            requires_diagram=response.get("requires_diagram"),
        )
        return response

    # ── Async generation ───────────────────────────────────────────────

    async def generate_async(
        self, state: AIState, question_type: str = "mcq"
    ) -> Dict[str, Any]:
        """Generate a single question (async)."""
        llm = get_llm()
        topic, difficulty = self._resolve_topic_and_difficulty(state)
        few_shot = self._fetch_few_shot(topic)

        system_prompt = self._build_system_prompt(topic, few_shot, question_type)
        user_prompt = self._build_user_prompt(difficulty, topic, question_type)

        logger.info(f"{self.subject}_async_generating", difficulty=difficulty, topic=topic)

        try:
            response = await llm.ainvoke(system_prompt, user_prompt, expect_json=True, tier="complex")
        except Exception as e:
            logger.error(f"{self.subject}_async_llm_failed", error=str(e))
            raise ValueError(f"Failed to generate {self.subject} question: {e}")

        response = self._validate_response(response, question_type)
        return response

    # ── LangGraph node adapter ─────────────────────────────────────────

    def as_node(self):
        """Return a function compatible with LangGraph's add_node()."""
        subject = self.subject

        def _node(state: AIState) -> AIState:
            logger.info(f"{subject}_agent_started")
            try:
                question_type = state.get("question_type", "mcq")
                question = self.generate(state, question_type)
                return {
                    **state,
                    "question": question,
                    "requires_diagram": question.get("requires_diagram", False),
                    "subject": subject,
                }
            except Exception as e:
                logger.error(f"{subject}_agent_failed", error=str(e))
                raise

        _node.__name__ = f"{subject}_agent"
        return _node
