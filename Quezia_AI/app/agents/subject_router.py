"""
Subject Router Node
Routes to appropriate subject agent based on subject field.
No LLM usage here.
"""
from typing import Literal
from app.core.state import AIState
from app.core.logging import get_logger

logger = get_logger(__name__)


def subject_router(state: AIState) -> AIState:
    """
    Subject router - determines which subject agent to call.
    
    Routes:
    - physics → physics_agent
    - math → math_agent
    - chemistry → chemistry_agent
    
    NO LLM calls. Pure routing logic.
    """
    subject = state.get("subject")
    
    logger.info("subject_router_received", subject=subject)
    
    if not subject:
        raise ValueError("'subject' is required for generate_question task")
    
    subject = subject.lower().strip()
    valid_subjects = ["physics", "math", "chemistry"]
    
    if subject not in valid_subjects:
        raise ValueError(f"Invalid subject: {subject}. Must be one of: {valid_subjects}")
    
    # Subject is valid - the actual routing happens via get_next_node
    logger.info("subject_router_validated", subject=subject)
    
    return state


def get_next_node(state: AIState) -> Literal["physics_agent", "math_agent", "chemistry_agent"]:
    """
    Determine the next subject agent based on subject field.
    Used for conditional edge routing.
    """
    subject = state.get("subject", "").lower().strip()
    
    if subject == "physics":
        return "physics_agent"
    elif subject == "math":
        return "math_agent"
    elif subject == "chemistry":
        return "chemistry_agent"
    else:
        raise ValueError(f"Unexpected subject: {subject}")
