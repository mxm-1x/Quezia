"""
LangGraph State Machine - Main Workflow Definition
Builds the complete agent orchestration graph with retry loops.
"""
from langgraph.graph import StateGraph, END
from typing import Literal

from app.core.state import AIState
from app.core.logging import get_logger
from app.core.config import settings

# Import all agents
from app.agents.orchestrator import orchestrator, get_next_node as orchestrator_router
from app.agents.subject_router import subject_router, get_next_node as subject_router_fn
from app.agents.subject_agents import physics_agent, math_agent, chemistry_agent
from app.agents.validation_node import validation_node, get_next_node as validation_router
from app.agents.answer_verifier import answer_verifier, get_next_node as verifier_router
from app.agents.solution_generator import solution_generator
from app.agents.diagram_generator import diagram_generator
from app.agents.test_assembler import test_assembler
from app.agents.performance_analysis import performance_analysis
from app.agents.insight_generator import insight_generator
from app.agents.study_plan_generator import study_plan_generator

logger = get_logger(__name__)


def build_graph() -> StateGraph:
    """
    Build the complete LangGraph state machine.
    
    Graph structure:
    
    For generate_question:
        orchestrator -> subject_router -> [physics_agent | math_agent | chemistry_agent] 
        -> validation_node -> [solution_generator (pass) | subject_router (fail, retry)]
        -> diagram_generator (if required) -> END
    
    For generate_test:
        orchestrator -> test_assembler -> END
    
    For analyze_performance:
        orchestrator -> performance_analysis -> insight_generator -> study_plan_generator -> END
    """
    
    # Initialize the graph
    workflow = StateGraph(AIState)
    
    # Add all nodes
    workflow.add_node("orchestrator", orchestrator)
    workflow.add_node("subject_router", subject_router)
    workflow.add_node("physics_agent", physics_agent)
    workflow.add_node("math_agent", math_agent)
    workflow.add_node("chemistry_agent", chemistry_agent)
    workflow.add_node("validation_node", validation_node)
    workflow.add_node("answer_verifier", answer_verifier)
    workflow.add_node("solution_generator", solution_generator)
    workflow.add_node("diagram_generator", diagram_generator)
    workflow.add_node("test_assembler", test_assembler)
    workflow.add_node("performance_analysis", performance_analysis)
    workflow.add_node("insight_generator", insight_generator)
    workflow.add_node("study_plan_generator", study_plan_generator)
    
    # Set entry point
    workflow.set_entry_point("orchestrator")
    
    # Add conditional edges from orchestrator
    workflow.add_conditional_edges(
        "orchestrator",
        orchestrator_router,
        {
            "subject_router": "subject_router",
            "test_assembler": "test_assembler",
            "performance_analysis": "performance_analysis"
        }
    )
    
    # Add conditional edges from subject_router
    workflow.add_conditional_edges(
        "subject_router",
        subject_router_fn,
        {
            "physics_agent": "physics_agent",
            "math_agent": "math_agent",
            "chemistry_agent": "chemistry_agent"
        }
    )
    
    # All subject agents go to validation
    workflow.add_edge("physics_agent", "validation_node")
    workflow.add_edge("math_agent", "validation_node")
    workflow.add_edge("chemistry_agent", "validation_node")
    
    # Add conditional edges from validation_node (with retry loop)
    workflow.add_conditional_edges(
        "validation_node",
        validation_router,
        {
            "solution_generator": "answer_verifier",  # Pass → verify answer
            "subject_router": "subject_router"  # Retry path (structural failure)
        }
    )
    
    # Add conditional edges from answer_verifier
    workflow.add_conditional_edges(
        "answer_verifier",
        verifier_router,
        {
            "solution_generator": "solution_generator",  # Answer verified
            "subject_router": "subject_router"  # Answer mismatch → regenerate
        }
    )
    
    # Solution generator goes to diagram generator (which handles conditional logic internally)
    workflow.add_edge("solution_generator", "diagram_generator")
    
    # Diagram generator ends the question generation flow
    workflow.add_edge("diagram_generator", END)
    
    # Test assembler ends directly
    workflow.add_edge("test_assembler", END)
    
    # Performance analysis flow
    workflow.add_edge("performance_analysis", "insight_generator")
    workflow.add_edge("insight_generator", "study_plan_generator")
    workflow.add_edge("study_plan_generator", END)
    
    logger.info("graph_built", nodes=list(workflow.nodes.keys()))
    
    return workflow.compile()


# Singleton graph instance
_graph = None


def get_graph():
    """Get the compiled graph instance."""
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph
