"""
Common utility functions used across the application.
"""
from typing import Any, Dict, List, Optional
import re


def sanitize_string(text: str, max_length: Optional[int] = None) -> str:
    """
    Sanitize a string by removing excessive whitespace and optionally truncating.
    
    Args:
        text: Input string
        max_length: Maximum length (None for no limit)
        
    Returns:
        Sanitized string
    """
    if not text:
        return ""
    
    # Remove excessive whitespace
    text = " ".join(text.split())
    
    # Truncate if needed
    if max_length and len(text) > max_length:
        text = text[:max_length].rstrip() + "..."
    
    return text


def validate_json_structure(data: Dict[str, Any], required_fields: List[str]) -> Dict[str, Any]:
    """
    Validate that a dictionary contains all required fields.
    
    Args:
        data: Dictionary to validate
        required_fields: List of required field names
        
    Returns:
        Validation result with 'valid' bool and 'missing_fields' list
    """
    missing = [field for field in required_fields if field not in data or data[field] is None]
    
    return {
        "valid": len(missing) == 0,
        "missing_fields": missing
    }


def extract_numbers(text: str) -> List[float]:
    """
    Extract all numbers from a text string.
    
    Args:
        text: Input text
        
    Returns:
        List of numbers found
    """
    # Match integers and floats (including scientific notation)
    pattern = r'-?\d+\.?\d*(?:[eE][+-]?\d+)?'
    matches = re.findall(pattern, text)
    
    return [float(m) for m in matches]


def truncate_dict(data: Dict[str, Any], max_str_length: int = 100) -> Dict[str, Any]:
    """
    Truncate string values in a dictionary for logging purposes.
    
    Args:
        data: Dictionary to truncate
        max_str_length: Maximum length for string values
        
    Returns:
        Dictionary with truncated strings
    """
    result = {}
    
    for key, value in data.items():
        if isinstance(value, str) and len(value) > max_str_length:
            result[key] = value[:max_str_length] + "..."
        elif isinstance(value, dict):
            result[key] = truncate_dict(value, max_str_length)
        elif isinstance(value, list) and value and isinstance(value[0], str):
            result[key] = [
                v[:max_str_length] + "..." if len(v) > max_str_length else v
                for v in value
            ]
        else:
            result[key] = value
    
    return result


def format_error_message(error: Exception, context: Optional[str] = None) -> str:
    """
    Format an exception into a user-friendly error message.
    
    Args:
        error: Exception object
        context: Optional context string
        
    Returns:
        Formatted error message
    """
    error_type = type(error).__name__
    error_msg = str(error)
    
    if context:
        return f"{context}: {error_type} - {error_msg}"
    
    return f"{error_type}: {error_msg}"


def safe_get(data: Dict[str, Any], *keys: str, default: Any = None) -> Any:
    """
    Safely get a nested value from a dictionary.
    
    Args:
        data: Dictionary to search
        *keys: Sequence of keys to traverse
        default: Default value if key path doesn't exist
        
    Returns:
        Value at key path or default
        
    Example:
        safe_get({"a": {"b": {"c": 1}}}, "a", "b", "c")  # Returns 1
        safe_get({"a": {"b": {}}}, "a", "b", "c", default=0)  # Returns 0
    """
    current = data
    
    for key in keys:
        if not isinstance(current, dict) or key not in current:
            return default
        current = current[key]
    
    return current


def batch_items(items: List[Any], batch_size: int) -> List[List[Any]]:
    """
    Split a list into batches of specified size.
    
    Args:
        items: List to batch
        batch_size: Size of each batch
        
    Returns:
        List of batches
    """
    if batch_size < 1:
        raise ValueError("batch_size must be at least 1")
    
    batches = []
    for i in range(0, len(items), batch_size):
        batches.append(items[i:i + batch_size])
    
    return batches


def distribute_questions(
    total_count: int,
    subjects: List[str],
    difficulty: str = "mixed"
) -> Dict[str, Dict[str, int]]:
    """
    Distribute questions across subjects and difficulties.
    
    Args:
        total_count: Total number of questions
        subjects: List of subjects
        difficulty: "easy", "medium", "hard", or "mixed"
        
    Returns:
        Distribution dict: {subject: {difficulty: count}}
    """
    if total_count < 1:
        raise ValueError("total_count must be at least 1")
    if not subjects:
        raise ValueError("subjects list cannot be empty")
    
    num_subjects = len(subjects)
    base_per_subject = total_count // num_subjects
    remainder = total_count % num_subjects
    
    distribution = {}
    
    for i, subject in enumerate(subjects):
        subject_count = base_per_subject + (1 if i < remainder else 0)
        
        if difficulty == "mixed":
            # JEE-realistic distribution: 30% easy, 45% medium, 25% hard
            # (Based on actual JEE paper analysis)
            easy = max(1, int(subject_count * 0.30))
            hard = max(1, int(subject_count * 0.25))
            medium = subject_count - easy - hard
            
            # Ensure medium is at least 1 if we have questions
            if medium < 1 and subject_count >= 3:
                medium = 1
                easy = max(1, subject_count - medium - hard)
            
            distribution[subject] = {
                "easy": easy,
                "medium": medium,
                "hard": hard
            }
        else:
            # All questions at specified difficulty
            distribution[subject] = {
                difficulty: subject_count
            }
    
    return distribution


def distribute_questions_by_topic(
    total_count: int,
    subject: str,
    difficulty: str = "mixed"
) -> Dict[str, Dict[str, int]]:
    """
    Distribute questions across topics based on JEE weightage data.
    
    Args:
        total_count: Total number of questions
        subject: Subject name
        difficulty: "easy", "medium", "hard", or "mixed"
        
    Returns:
        Distribution dict: {topic: {difficulty: count}}
    """
    from app.data.knowledge_base import get_knowledge_base
    
    kb = get_knowledge_base()
    topic_distribution = kb.get_topic_distribution(subject, total_count)
    
    result = {}
    
    for topic, count in topic_distribution.items():
        if difficulty == "mixed":
            # Use topic-specific difficulty from knowledge base
            topic_difficulty = kb.get_difficulty_for_topic(subject, topic)
            
            # Distribute around the suggested difficulty
            if topic_difficulty == "hard":
                easy = max(1, int(count * 0.15))
                hard = max(1, int(count * 0.50))
                medium = count - easy - hard
            elif topic_difficulty == "easy":
                easy = max(1, int(count * 0.50))
                hard = max(1, int(count * 0.15))
                medium = count - easy - hard
            else:  # medium
                easy = max(1, int(count * 0.30))
                hard = max(1, int(count * 0.25))
                medium = count - easy - hard
            
            result[topic] = {
                "easy": max(0, easy),
                "medium": max(0, medium),
                "hard": max(0, hard)
            }
        else:
            result[topic] = {difficulty: count}
    
    return result
