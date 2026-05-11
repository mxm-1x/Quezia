"""
Study Plan Generator Agent
Purpose: Generate adaptive study plan

Output:
{
    "day_1": ["Electrostatics practice"],
    "day_2": ["Mock test + analysis"]
}
"""
from app.core.state import AIState
from app.core.llm import get_llm
from app.core.logging import get_logger
from datetime import datetime, timedelta

logger = get_logger(__name__)


def study_plan_generator(state: AIState) -> AIState:
    """
    Study plan generator - creates adaptive study plan based on insights.
    
    Input: insights, performance_metrics
    Output: study_plan
    
    LLM-based. Called after insight_generator.
    """
    logger.info("study_plan_generator_started")
    
    insights = state.get("insights")
    metrics = state.get("performance_metrics")
    
    if not insights:
        raise ValueError("No insights found in state")
    
    llm = get_llm()
    
    system_prompt = """You are an expert JEE preparation strategist and study plan designer.
Your task is to create a personalized, adaptive study plan based on performance insights.

CRITICAL RULES:
1. Plan should be realistic and achievable
2. Balance weak areas with maintaining strong areas
3. Include variety (theory, practice, tests, revision)
4. Consider time management patterns from analytics
5. Progress from basics to advanced
6. Include regular mock tests
7. Account for JEE Main exam pattern

OUTPUT FORMAT (STRICT JSON):
{
    "plan_overview": {
        "duration_days": 30,
        "daily_study_hours": 6,
        "focus_areas": ["Weak topic 1", "Weak topic 2"],
        "maintenance_areas": ["Strong topic 1"]
    },
    "daily_schedule": {
        "day_1": {
            "date": "Day 1",
            "focus": "Topic name",
            "activities": [
                "Activity 1 (2 hours)",
                "Activity 2 (1.5 hours)"
            ],
            "resources": ["Resource 1", "Resource 2"],
            "target": "Specific learning objective"
        },
        "day_2": { ... }
    },
    "weekly_milestones": [
        "Week 1: Complete basic revision of weak topics",
        "Week 2: Focus on problem solving"
    ],
    "mock_test_schedule": [
        {"day": 7, "type": "Subject-wise test", "subjects": ["Physics"]},
        {"day": 14, "type": "Full mock test", "duration": "3 hours"}
    ],
    "revision_schedule": {
        "daily_revision": "30 minutes",
        "weekly_revision": "Sunday full revision"
    },
    "adaptive_triggers": [
        "If accuracy in topic X > 80%, move to next topic",
        "If mock test score < 60%, repeat week"
    ]
}

Respond ONLY with valid JSON. No markdown, no additional text."""

    user_prompt = _build_study_plan_prompt(insights, metrics)
    
    try:
        response = llm.invoke(system_prompt, user_prompt, expect_json=True)
        
        # Validate and structure the response
        if "daily_schedule" not in response:
            # Create a basic structure if LLM didn't provide it
            response = _create_fallback_plan(insights, response)
        
        state["study_plan"] = response
        
        logger.info(
            "study_plan_generator_completed",
            duration_days=response.get("plan_overview", {}).get("duration_days", "N/A"),
            daily_hours=response.get("plan_overview", {}).get("daily_study_hours", "N/A")
        )
        
        return state
        
    except Exception as e:
        logger.error("study_plan_generator_failed", error=str(e))
        raise


def _build_study_plan_prompt(insights: dict, metrics: dict) -> str:
    """Build prompt for study plan generation."""
    
    prompt_parts = []
    
    prompt_parts.append("STUDENT INSIGHTS:")
    prompt_parts.append(f"Overall Assessment: {insights.get('overall_assessment', 'N/A')}")
    prompt_parts.append("")
    
    # Weak topics (priority)
    weak_topics = insights.get("weak_topics", [])
    if weak_topics:
        prompt_parts.append(f"Priority Weak Topics: {weak_topics}")
        prompt_parts.append("")
    
    # Strong topics (maintenance)
    strong_topics = insights.get("strong_topics", [])
    if strong_topics:
        prompt_parts.append(f"Strong Topics (maintenance): {strong_topics}")
        prompt_parts.append("")
    
    # Patterns
    patterns = insights.get("patterns", [])
    if patterns:
        prompt_parts.append("Observed Patterns:")
        for pattern in patterns:
            prompt_parts.append(f"- {pattern}")
        prompt_parts.append("")
    
    # Time management
    time_insights = insights.get("time_management_insights", [])
    if time_insights:
        prompt_parts.append("Time Management Issues:")
        for insight in time_insights:
            prompt_parts.append(f"- {insight}")
        prompt_parts.append("")
    
    # Previous recommendations
    recommendations = insights.get("recommendations", [])
    if recommendations:
        prompt_parts.append("Previous Recommendations:")
        for rec in recommendations:
            prompt_parts.append(f"- {rec}")
        prompt_parts.append("")
    
    # Priority actions
    priority_actions = insights.get("priority_actions", [])
    if priority_actions:
        prompt_parts.append(f"High Priority Actions: {priority_actions}")
        prompt_parts.append("")
    
    # Performance metrics summary
    if metrics:
        overall = metrics.get("overall", {})
        prompt_parts.append(f"""PERFORMANCE SUMMARY:
- Current Accuracy: {overall.get('accuracy_percentage', 'N/A')}%
- Average Time per Question: {overall.get('average_time_per_question_seconds', 'N/A')}s
""")
    
    prompt_parts.append("""Create a detailed, personalized 30-day study plan.
The plan should address weak topics first while maintaining strong areas.
Include specific daily activities, resources, and measurable targets.""")
    
    return "\n".join(prompt_parts)


def _create_fallback_plan(insights: dict, partial_response: dict) -> dict:
    """Create a fallback study plan if LLM response is incomplete."""
    
    weak_topics = insights.get("weak_topics", ["General Revision"])
    strong_topics = insights.get("strong_topics", [])
    
    daily_schedule = {}
    
    # Create a 14-day basic plan
    for day in range(1, 15):
        day_key = f"day_{day}"
        
        if day % 7 == 0:
            # Weekly mock test
            daily_schedule[day_key] = {
                "date": f"Day {day}",
                "focus": "Mock Test & Analysis",
                "activities": [
                    "Full mock test (3 hours)",
                    "Detailed analysis of mistakes",
                    "Revision of weak areas identified"
                ],
                "resources": ["JEE Main previous year papers", "Analysis sheet"],
                "target": "Assess progress and identify gaps"
            }
        elif day % 3 == 0 and weak_topics:
            # Focus on weak topic
            topic = weak_topics[(day // 3 - 1) % len(weak_topics)]
            daily_schedule[day_key] = {
                "date": f"Day {day}",
                "focus": topic,
                "activities": [
                    f"Theory revision: {topic} (2 hours)",
                    f"Practice problems: {topic} (3 hours)",
                    "Doubt solving (1 hour)"
                ],
                "resources": ["NCERT", "Reference book", "Previous year questions"],
                "target": f"Master basic to medium level questions in {topic}"
            }
        elif strong_topics:
            # Maintain strong topic
            topic = strong_topics[day % len(strong_topics)]
            daily_schedule[day_key] = {
                "date": f"Day {day}",
                "focus": f"{topic} - Advanced Practice",
                "activities": [
                    f"Advanced problems: {topic} (2 hours)",
                    "Mixed practice (2 hours)",
                    "Revision (2 hours)"
                ],
                "resources": ["Advanced problem book", "Online test series"],
                "target": f"Maintain excellence in {topic}"
            }
        else:
            # General practice
            daily_schedule[day_key] = {
                "date": f"Day {day}",
                "focus": "Mixed Practice",
                "activities": [
                    "Mixed topic practice (3 hours)",
                    "Formula revision (1 hour)",
                    "Previous year questions (2 hours)"
                ],
                "resources": ["Question bank", "Formula sheet"],
                "target": "Improve speed and accuracy"
            }
    
    return {
        "plan_overview": {
            "duration_days": 14,
            "daily_study_hours": 6,
            "focus_areas": weak_topics[:3],
            "maintenance_areas": strong_topics[:2]
        },
        "daily_schedule": daily_schedule,
        "weekly_milestones": [
            "Week 1: Complete revision of top 3 weak topics",
            "Week 2: Advanced practice and full mock tests"
        ],
        "mock_test_schedule": [
            {"day": 7, "type": "Full mock test", "duration": "3 hours"},
            {"day": 14, "type": "Full mock test", "duration": "3 hours"}
        ],
        "revision_schedule": {
            "daily_revision": "1 hour before sleep",
            "weekly_revision": "Sunday - full formula revision"
        },
        "adaptive_triggers": [
            "If topic accuracy > 80%, move to next priority topic",
            "If mock score < 50%, extend current week focus"
        ]
    }
