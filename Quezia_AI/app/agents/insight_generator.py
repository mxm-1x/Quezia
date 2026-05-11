"""
Insight Generator Agent (LLM-Based)
Purpose: Convert metrics → human insights

Output:
{
    "weak_topics": ["Kinematics"],
    "patterns": ["Low accuracy in medium questions"],
    "recommendations": ["Revise basics"]
}
"""
from app.core.state import AIState
from app.core.llm import get_llm
from app.core.logging import get_logger

logger = get_logger(__name__)


def insight_generator(state: AIState) -> AIState:
    """
    Insight generator - converts performance metrics to actionable insights.
    
    Input: performance_metrics
    Output: insights
    
    LLM-based. Called after performance_analysis.
    """
    logger.info("insight_generator_started")
    
    metrics = state.get("performance_metrics")
    
    if not metrics:
        raise ValueError("No performance_metrics found in state")
    
    llm = get_llm()
    
    system_prompt = """You are an expert JEE preparation coach and educational psychologist.
Your task is to analyze performance metrics and generate actionable insights for the student.

CRITICAL RULES:
1. Be specific and actionable
2. Focus on patterns, not just numbers
3. Provide realistic, achievable recommendations
4. Balance positive reinforcement with areas for improvement
5. Consider time management, accuracy, and topic mastery

OUTPUT FORMAT (STRICT JSON):
{
    "overall_assessment": "Brief summary of overall performance",
    "weak_topics": ["Topic 1", "Topic 2"],
    "strong_topics": ["Topic 3", "Topic 4"],
    "patterns": [
        "Pattern description 1",
        "Pattern description 2"
    ],
    "time_management_insights": [
        "Time-related observation 1"
    ],
    "recommendations": [
        "Specific actionable recommendation 1",
        "Specific actionable recommendation 2"
    ],
    "priority_actions": [
        "High priority action 1",
        "High priority action 2"
    ],
    "confidence_level": "high | medium | low"
}

Respond ONLY with valid JSON. No markdown, no additional text."""

    # Build comprehensive prompt from metrics
    user_prompt = _build_metrics_prompt(metrics)
    
    try:
        response = llm.invoke(system_prompt, user_prompt, expect_json=True)
        
        # Validate required fields
        required_fields = ["overall_assessment", "weak_topics", "strong_topics", 
                          "patterns", "recommendations"]
        
        for field in required_fields:
            if field not in response:
                response[field] = []
        
        state["insights"] = response
        
        logger.info(
            "insight_generator_completed",
            weak_topics_count=len(response.get("weak_topics", [])),
            recommendations_count=len(response.get("recommendations", []))
        )
        
        return state
        
    except Exception as e:
        logger.error("insight_generator_failed", error=str(e))
        raise


def _build_metrics_prompt(metrics: dict) -> str:
    """Build a detailed prompt from performance metrics."""
    
    prompt_parts = []
    
    # Overall stats
    overall = metrics.get("overall", {})
    prompt_parts.append(f"""OVERALL STATISTICS:
- Total Attempts: {overall.get('total_attempts', 'N/A')}
- Accuracy: {overall.get('accuracy_percentage', 'N/A')}%
- Average Time per Question: {overall.get('average_time_per_question_seconds', 'N/A')} seconds
""")
    
    # Subject performance
    subject_stats = metrics.get("accuracy_by_subject", {})
    if subject_stats:
        prompt_parts.append("SUBJECT PERFORMANCE:")
        for subject, stats in subject_stats.items():
            prompt_parts.append(f"- {subject.title()}: {stats.get('accuracy_percentage', 'N/A')}% accuracy ({stats.get('total_attempts', 'N/A')} attempts)")
        prompt_parts.append("")
    
    # Difficulty performance
    difficulty_stats = metrics.get("accuracy_by_difficulty", {})
    if difficulty_stats:
        prompt_parts.append("DIFFICULTY PERFORMANCE:")
        for difficulty, stats in difficulty_stats.items():
            prompt_parts.append(f"- {difficulty.title()}: {stats.get('accuracy_percentage', 'N/A')}% accuracy, avg time {stats.get('average_time_seconds', 'N/A')}s")
        prompt_parts.append("")
    
    # Topic performance (top and bottom)
    topic_stats = metrics.get("accuracy_by_topic", {})
    if topic_stats:
        sorted_topics = sorted(
            topic_stats.items(),
            key=lambda x: x[1].get("accuracy_percentage", 0),
            reverse=True
        )
        
        prompt_parts.append("TOP PERFORMING TOPICS:")
        for topic, stats in sorted_topics[:5]:
            prompt_parts.append(f"- {topic}: {stats.get('accuracy_percentage', 'N/A')}% ({stats.get('total_attempts', 'N/A')} attempts)")
        prompt_parts.append("")
        
        prompt_parts.append("WEAKEST TOPICS:")
        for topic, stats in sorted_topics[-5:]:
            prompt_parts.append(f"- {topic}: {stats.get('accuracy_percentage', 'N/A')}% ({stats.get('total_attempts', 'N/A')} attempts)")
        prompt_parts.append("")
    
    # Time analysis
    time_analysis = metrics.get("time_analysis", {})
    if time_analysis:
        prompt_parts.append(f"""TIME ANALYSIS:
- Mean Time: {time_analysis.get('mean_seconds', 'N/A')}s
- Median Time: {time_analysis.get('median_seconds', 'N/A')}s
- Time Distribution: {time_analysis.get('time_distribution', {})}
""")
    
    # Time vs difficulty
    time_vs_diff = metrics.get("time_vs_difficulty", {})
    if time_vs_diff:
        prompt_parts.append("TIME BY DIFFICULTY:")
        for difficulty, stats in time_vs_diff.items():
            prompt_parts.append(f"- {difficulty.title()}: {stats.get('mean_seconds', 'N/A')}s average")
        prompt_parts.append("")
    
    # Error clusters
    error_clusters = metrics.get("error_clusters", {})
    if error_clusters and "message" not in error_clusters:
        prompt_parts.append(f"""ERROR ANALYSIS:
- Total Errors: {error_clusters.get('total_errors', 'N/A')}
- Most Error-Prone Topics: {list(error_clusters.get('most_error_prone_topics', {}).keys())[:3]}
- Errors by Difficulty: {error_clusters.get('errors_by_difficulty', {})}
""")
    
    # Strengths and weaknesses
    sw = metrics.get("strengths_weaknesses", {})
    if sw:
        prompt_parts.append(f"""STRENGTHS & WEAKNESSES:
- Strengths: {sw.get('strengths', [])}
- Weaknesses: {sw.get('weaknesses', [])}
""")
    
    # Trend analysis
    trend = metrics.get("trend_analysis", {})
    if trend:
        prompt_parts.append(f"""TREND ANALYSIS:
- Trend Direction: {trend.get('trend_direction', 'N/A')}
""")
    
    prompt_parts.append("""Based on these metrics, provide comprehensive insights and actionable recommendations.
Focus on specific patterns, time management issues, and concrete next steps.""")
    
    return "\n".join(prompt_parts)
