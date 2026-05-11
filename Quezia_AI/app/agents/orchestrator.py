"""
Orchestrator Node - ENTRY POINT
Purpose: Decide execution path
Forbidden: content generation, LLM calls
"""
from typing import Literal
from app.core.state import AIState
from app.core.logging import get_logger, log_agent_io

logger = get_logger(__name__)


def orchestrator(state: AIState) -> AIState:
    """
    Orchestrator node - routes to appropriate agent based on task.
    
    Routing logic:
    - generate_question → subject_router
    - generate_test → test_assembler
    - analyze_performance → performance_analysis
    - else → raise error
    
    NO LLM calls. NO content generation.
    """
    task = state.get("task")
    user_id = state.get("user_id")
    
    logger.info(
        "orchestrator_received_request",
        task=task,
        user_id=user_id,
        subject=state.get("subject"),
        exam=state.get("exam")
    )
    
    # Validate required fields
    if not task:
        error_msg = "'task' is required in state"
        logger.error("orchestrator_validation_failed", error=error_msg)
        raise ValueError(error_msg)
    
    if not user_id:
        error_msg = "'user_id' is required in state"
        logger.error("orchestrator_validation_failed", error=error_msg)
        raise ValueError(error_msg)
    
    # Valid tasks
    valid_tasks = ["generate_question", "generate_test", "analyze_performance"]
    if task not in valid_tasks:
        error_msg = f"Invalid task: {task}. Must be one of: {valid_tasks}"
        logger.error("orchestrator_validation_failed", error=error_msg, task=task)
        raise ValueError(error_msg)
    
    # Initialize retry count if not present
    if state.get("retry_count") is None:
        state["retry_count"] = 0
    
    # Reset validation flag for new requests
    state["validation_passed"] = False
    state["requires_diagram"] = False
    
    # Initialize error tracking
    if "last_error" not in state:
        state["last_error"] = None
    
    logger.info("orchestrator_routing", task=task)
    
    return state


def get_next_node(state: AIState) -> Literal["subject_router", "test_assembler", "performance_analysis"]:
    """
    Determine the next node based on task type.
    Used for conditional edge routing.
    """
    task = state.get("task")
    
    if task == "generate_question":
        return "subject_router"
    elif task == "generate_test":
        return "test_assembler"
    elif task == "analyze_performance":
        return "performance_analysis"
    else:
        # This should never happen due to validation in orchestrator
        raise ValueError(f"Unexpected task: {task}")
