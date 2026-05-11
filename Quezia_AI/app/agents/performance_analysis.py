"""
Performance Analysis Agent (NO LLM)
Purpose: Extreme-detail analytics

Computes:
- Accuracy per topic
- Time vs difficulty
- Error clusters
- Strengths / weaknesses

Uses pandas + numpy only.
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from app.core.state import AIState
from app.core.logging import get_logger

logger = get_logger(__name__)


def performance_analysis(state: AIState) -> AIState:
    """
    Performance analysis - computes detailed analytics.
    
    Input: raw_attempt_data with attempt history
    Output: performance_metrics with comprehensive analysis
    
    NO LLM calls. Pure pandas/numpy computation.
    """
    logger.info("performance_analysis_started")
    
    raw_data = state.get("raw_attempt_data")
    
    if not raw_data:
        raise ValueError("No raw_attempt_data found in state")
    
    attempts = raw_data.get("attempts", [])
    
    if not attempts:
        raise ValueError("No attempts found in raw_attempt_data")
    
    try:
        # Convert to DataFrame for analysis
        df = pd.DataFrame(attempts)
        
        # Ensure required columns
        required_cols = ["question_id", "subject", "topic", "difficulty", 
                        "is_correct", "time_taken_seconds"]
        
        for col in required_cols:
            if col not in df.columns:
                raise ValueError(f"Missing required column: {col}")
        
        metrics = {}
        
        # 1. Overall Statistics
        metrics["overall"] = _compute_overall_stats(df)
        
        # 2. Accuracy per Topic
        metrics["accuracy_by_topic"] = _compute_accuracy_by_topic(df)
        
        # 3. Accuracy by Subject
        metrics["accuracy_by_subject"] = _compute_accuracy_by_subject(df)
        
        # 4. Accuracy by Difficulty
        metrics["accuracy_by_difficulty"] = _compute_accuracy_by_difficulty(df)
        
        # 5. Time Analysis
        metrics["time_analysis"] = _compute_time_analysis(df)
        
        # 6. Time vs Difficulty
        metrics["time_vs_difficulty"] = _compute_time_vs_difficulty(df)
        
        # 7. Error Clusters
        metrics["error_clusters"] = _compute_error_clusters(df)
        
        # 8. Strengths and Weaknesses
        metrics["strengths_weaknesses"] = _compute_strengths_weaknesses(df)
        
        # 9. Trend Analysis (if date/time available)
        if "attempt_date" in df.columns:
            metrics["trend_analysis"] = _compute_trend_analysis(df)
        
        # 10. Question-wise Analysis
        metrics["question_performance"] = _compute_question_performance(df)
        
        state["performance_metrics"] = metrics
        
        logger.info(
            "performance_analysis_completed",
            total_attempts=len(df),
            overall_accuracy=metrics["overall"]["accuracy_percentage"]
        )
        
        return state
        
    except Exception as e:
        logger.error("performance_analysis_failed", error=str(e))
        raise


def _compute_overall_stats(df: pd.DataFrame) -> Dict[str, Any]:
    """Compute overall performance statistics."""
    total = len(df)
    correct = df["is_correct"].sum()
    incorrect = total - correct
    
    total_time = df["time_taken_seconds"].sum()
    avg_time = df["time_taken_seconds"].mean()
    
    return {
        "total_attempts": int(total),
        "correct_attempts": int(correct),
        "incorrect_attempts": int(incorrect),
        "accuracy_percentage": round((correct / total) * 100, 2) if total > 0 else 0,
        "total_time_seconds": int(total_time),
        "total_time_minutes": round(total_time / 60, 2),
        "average_time_per_question_seconds": round(avg_time, 2),
        "questions_attempted": df["question_id"].nunique()
    }


def _compute_accuracy_by_topic(df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
    """Compute accuracy statistics for each topic."""
    topic_stats = df.groupby("topic").agg({
        "is_correct": ["sum", "count", "mean"],
        "time_taken_seconds": "mean"
    }).reset_index()
    
    topic_stats.columns = ["topic", "correct", "total", "accuracy", "avg_time"]
    
    result = {}
    for _, row in topic_stats.iterrows():
        result[row["topic"]] = {
            "total_attempts": int(row["total"]),
            "correct": int(row["correct"]),
            "incorrect": int(row["total"] - row["correct"]),
            "accuracy_percentage": round(row["accuracy"] * 100, 2),
            "average_time_seconds": round(row["avg_time"], 2)
        }
    
    return result


def _compute_accuracy_by_subject(df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
    """Compute accuracy statistics for each subject."""
    subject_stats = df.groupby("subject").agg({
        "is_correct": ["sum", "count", "mean"],
        "time_taken_seconds": "mean"
    }).reset_index()
    
    subject_stats.columns = ["subject", "correct", "total", "accuracy", "avg_time"]
    
    result = {}
    for _, row in subject_stats.iterrows():
        result[row["subject"]] = {
            "total_attempts": int(row["total"]),
            "correct": int(row["correct"]),
            "incorrect": int(row["total"] - row["correct"]),
            "accuracy_percentage": round(row["accuracy"] * 100, 2),
            "average_time_seconds": round(row["avg_time"], 2)
        }
    
    return result


def _compute_accuracy_by_difficulty(df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
    """Compute accuracy statistics by difficulty level."""
    difficulty_stats = df.groupby("difficulty").agg({
        "is_correct": ["sum", "count", "mean"],
        "time_taken_seconds": "mean"
    }).reset_index()
    
    difficulty_stats.columns = ["difficulty", "correct", "total", "accuracy", "avg_time"]
    
    result = {}
    for _, row in difficulty_stats.iterrows():
        result[row["difficulty"]] = {
            "total_attempts": int(row["total"]),
            "correct": int(row["correct"]),
            "incorrect": int(row["total"] - row["correct"]),
            "accuracy_percentage": round(row["accuracy"] * 100, 2),
            "average_time_seconds": round(row["avg_time"], 2)
        }
    
    return result


def _compute_time_analysis(df: pd.DataFrame) -> Dict[str, Any]:
    """Compute detailed time analysis."""
    time_data = df["time_taken_seconds"]
    
    # Categorize time spent
    time_categories = pd.cut(
        time_data,
        bins=[0, 30, 60, 120, 300, float("inf")],
        labels=["very_fast", "fast", "normal", "slow", "very_slow"]
    )
    
    time_dist = time_categories.value_counts().to_dict()
    
    return {
        "mean_seconds": round(time_data.mean(), 2),
        "median_seconds": round(time_data.median(), 2),
        "std_seconds": round(time_data.std(), 2),
        "min_seconds": int(time_data.min()),
        "max_seconds": int(time_data.max()),
        "time_distribution": {str(k): int(v) for k, v in time_dist.items()},
        "percentile_25": round(time_data.quantile(0.25), 2),
        "percentile_75": round(time_data.quantile(0.75), 2),
        "percentile_90": round(time_data.quantile(0.90), 2)
    }


def _compute_time_vs_difficulty(df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
    """Analyze time taken vs difficulty level."""
    time_difficulty = df.groupby("difficulty")["time_taken_seconds"].agg([
        "mean", "median", "std", "min", "max"
    ]).to_dict("index")
    
    result = {}
    for difficulty, stats in time_difficulty.items():
        result[difficulty] = {
            "mean_seconds": round(stats["mean"], 2),
            "median_seconds": round(stats["median"], 2),
            "std_seconds": round(stats["std"], 2) if not np.isnan(stats["std"]) else 0,
            "min_seconds": int(stats["min"]),
            "max_seconds": int(stats["max"])
        }
    
    return result


def _compute_error_clusters(df: pd.DataFrame) -> Dict[str, Any]:
    """Identify error clusters and patterns."""
    incorrect_df = df[df["is_correct"] == False]
    
    if len(incorrect_df) == 0:
        return {"message": "No errors found"}
    
    # Error clusters by topic
    error_by_topic = incorrect_df["topic"].value_counts().head(5).to_dict()
    
    # Error clusters by difficulty
    error_by_difficulty = incorrect_df["difficulty"].value_counts().to_dict()
    
    # Error clusters by subject
    error_by_subject = incorrect_df["subject"].value_counts().to_dict()
    
    # Time spent on incorrect answers
    error_time_stats = incorrect_df["time_taken_seconds"].agg(["mean", "median"]).to_dict()
    
    return {
        "total_errors": len(incorrect_df),
        "most_error_prone_topics": {k: int(v) for k, v in error_by_topic.items()},
        "errors_by_difficulty": {k: int(v) for k, v in error_by_difficulty.items()},
        "errors_by_subject": {k: int(v) for k, v in error_by_subject.items()},
        "average_time_on_errors_seconds": round(error_time_stats["mean"], 2),
        "median_time_on_errors_seconds": round(error_time_stats["median"], 2)
    }


def _compute_strengths_weaknesses(df: pd.DataFrame) -> Dict[str, List[str]]:
    """Identify strengths and weaknesses based on performance."""
    topic_accuracy = _compute_accuracy_by_topic(df)
    
    # Sort topics by accuracy
    sorted_topics = sorted(
        topic_accuracy.items(),
        key=lambda x: x[1]["accuracy_percentage"],
        reverse=True
    )
    
    # Topics with at least 5 attempts for reliability
    reliable_topics = [(t, s) for t, s in sorted_topics if s["total_attempts"] >= 5]
    
    if not reliable_topics:
        # Fall back to all topics if not enough data
        reliable_topics = sorted_topics
    
    # Top 3 strengths (highest accuracy)
    strengths = [topic for topic, stats in reliable_topics[:3]]
    
    # Top 3 weaknesses (lowest accuracy)
    weaknesses = [topic for topic, stats in reliable_topics[-3:]]
    
    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "strongest_topic": strengths[0] if strengths else None,
        "weakest_topic": weaknesses[-1] if weaknesses else None
    }


def _compute_trend_analysis(df: pd.DataFrame) -> Dict[str, Any]:
    """Analyze performance trends over time."""
    df["attempt_date"] = pd.to_datetime(df["attempt_date"])
    df = df.sort_values("attempt_date")
    
    # Daily accuracy trend
    daily_accuracy = df.groupby(df["attempt_date"].dt.date).agg({
        "is_correct": "mean",
        "question_id": "count"
    }).reset_index()
    
    daily_accuracy.columns = ["date", "accuracy", "questions"]
    
    # Calculate rolling average
    if len(daily_accuracy) >= 3:
        daily_accuracy["rolling_accuracy"] = daily_accuracy["accuracy"].rolling(window=3).mean()
    
    trend_data = daily_accuracy.to_dict("records")
    
    # Determine trend direction
    if len(daily_accuracy) >= 2:
        first_half = daily_accuracy.iloc[:len(daily_accuracy)//2]["accuracy"].mean()
        second_half = daily_accuracy.iloc[len(daily_accuracy)//2:]["accuracy"].mean()
        
        if second_half > first_half * 1.05:
            trend_direction = "improving"
        elif second_half < first_half * 0.95:
            trend_direction = "declining"
        else:
            trend_direction = "stable"
    else:
        trend_direction = "insufficient_data"
    
    return {
        "trend_direction": trend_direction,
        "daily_data": [
            {
                "date": str(d["date"]),
                "accuracy_percentage": round(d["accuracy"] * 100, 2),
                "questions_attempted": int(d["questions"])
            }
            for d in trend_data
        ]
    }


def _compute_question_performance(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Compute performance metrics for individual questions."""
    question_stats = df.groupby("question_id").agg({
        "is_correct": ["sum", "count", "mean"],
        "time_taken_seconds": "mean",
        "subject": "first",
        "topic": "first",
        "difficulty": "first"
    }).reset_index()
    
    question_stats.columns = [
        "question_id", "correct", "total_attempts", "accuracy",
        "avg_time", "subject", "topic", "difficulty"
    ]
    
    result = []
    for _, row in question_stats.iterrows():
        result.append({
            "question_id": row["question_id"],
            "subject": row["subject"],
            "topic": row["topic"],
            "difficulty": row["difficulty"],
            "total_attempts": int(row["total_attempts"]),
            "correct_attempts": int(row["correct"]),
            "accuracy_percentage": round(row["accuracy"] * 100, 2),
            "average_time_seconds": round(row["avg_time"], 2)
        })
    
    # Sort by accuracy (ascending) to identify problematic questions
    result.sort(key=lambda x: x["accuracy_percentage"])
    
    return result[:20]  # Return top 20 problematic questions
