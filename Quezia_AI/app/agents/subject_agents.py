"""
Subject Expert Agents (LLM-Based)
- physics_agent
- math_agent
- chemistry_agent

Purpose: Generate EXACTLY ONE JEE-Main quality question (MCQ or Numerical)
Each subject has its own specialized agent with domain-specific prompts.

This module re-exports the agents from their individual modules for backward compatibility.
Also provides unified _generate_question and _generate_question_async helpers.
"""
from typing import Dict, Any
from app.core.state import AIState
from app.core.llm import get_llm
from app.core.logging import get_logger

# Import specialized agents from their dedicated modules
from app.agents.physics_agent import physics_agent, _generate_physics_question
from app.agents.math_agent import math_agent, _generate_math_question
from app.agents.chemistry_agent import chemistry_agent, _generate_chemistry_question

logger = get_logger(__name__)


def _generate_question(state: AIState, subject: str, question_type: str = "mcq") -> Dict[str, Any]:
    """
    Unified question generation dispatcher.
    Routes to appropriate subject-specific generator.
    
    Args:
        state: Current AIState with difficulty, topic, etc.
        subject: 'physics', 'math', or 'chemistry'
        question_type: 'mcq' or 'numerical'
    
    Returns:
        Generated question dict
    """
    subject = subject.lower().strip()
    
    if subject == "physics":
        return _generate_physics_question(state, question_type)
    elif subject in ["math", "maths", "mathematics"]:
        return _generate_math_question(state, question_type)
    elif subject == "chemistry":
        return _generate_chemistry_question(state, question_type)
    else:
        raise ValueError(f"Unknown subject: {subject}")


async def _generate_question_async(state: AIState, subject: str, question_type: str = "mcq") -> Dict[str, Any]:
    """
    Async version of unified question generation.
    Uses async LLM calls for concurrent question generation.
    
    Args:
        state: Current AIState with difficulty, topic, etc.
        subject: 'physics', 'math', or 'chemistry'
        question_type: 'mcq' or 'numerical'
    
    Returns:
        Generated question dict
    """
    subject = subject.lower().strip()
    
    # Import async generators (dynamically to avoid circular imports)
    if subject == "physics":
        from app.agents.physics_agent import _generate_physics_question_async
        return await _generate_physics_question_async(state, question_type)
    elif subject in ["math", "maths", "mathematics"]:
        from app.agents.math_agent import _generate_math_question_async
        return await _generate_math_question_async(state, question_type)
    elif subject == "chemistry":
        from app.agents.chemistry_agent import _generate_chemistry_question_async
        return await _generate_chemistry_question_async(state, question_type)
    else:
        raise ValueError(f"Unknown subject: {subject}")


# Re-export for backward compatibility
__all__ = [
    "physics_agent", 
    "math_agent", 
    "chemistry_agent",
    "_generate_question",
    "_generate_question_async"
]
