"""
Knowledge Base for JEE Historical Data

Combines:
- Hardcoded 5-year chapter-wise weightage analysis
- Auto-computed weightage from 14,973 real PYQs in the vector store
- 2026 trend-based weightage signals

The PYQ data auto-updates when new questions are loaded.
"""
import random
from typing import Dict, List, Optional, Tuple
from app.core.logging import get_logger

logger = get_logger(__name__)


# =============================================================================
# MATHEMATICS DATA
# =============================================================================

MATH_CHAPTER_WEIGHTAGE = {
    # Class XI
    "Basic Mathematics and Logarithm": {"weight": 0.59, "class": 11, "category": "Algebra"},
    "Sets": {"weight": 1.00, "class": 11, "category": "Algebra"},
    "Trigonometric Ratios and Identities": {"weight": 1.02, "class": 11, "category": "Trigonometry"},
    "Trigonometric Equations": {"weight": 1.35, "class": 11, "category": "Trigonometry"},
    "Quadratic Equations": {"weight": 3.30, "class": 11, "category": "Algebra"},
    "Complex Numbers": {"weight": 4.75, "class": 11, "category": "Algebra"},
    "Sequences and Series": {"weight": 5.74, "class": 11, "category": "Algebra"},
    "Binomial Theorem": {"weight": 5.05, "class": 11, "category": "Algebra"},
    "Permutations and Combinations": {"weight": 3.60, "class": 11, "category": "Algebra"},
    "Straight Lines": {"weight": 2.71, "class": 11, "category": "2D Geometry"},
    "Circles": {"weight": 3.24, "class": 11, "category": "2D Geometry"},
    "Parabola": {"weight": 2.44, "class": 11, "category": "2D Geometry"},
    "Ellipse": {"weight": 2.11, "class": 11, "category": "2D Geometry"},
    "Hyperbola": {"weight": 1.65, "class": 11, "category": "2D Geometry"},
    "Statistics": {"weight": 3.00, "class": 11, "category": "Algebra"},
    # Class XII
    "Determinants": {"weight": 4.00, "class": 12, "category": "Algebra"},
    "Matrices": {"weight": 3.46, "class": 12, "category": "Algebra"},
    "Relations and Functions": {"weight": 1.25, "class": 12, "category": "Algebra"},
    "Inverse Trigonometric Functions": {"weight": 1.59, "class": 12, "category": "Trigonometry"},
    "Limits Continuity and Differentiability": {"weight": 5.50, "class": 12, "category": "Calculus"},
    "Applications of Derivatives": {"weight": 4.75, "class": 12, "category": "Calculus"},
    "Definite Integration": {"weight": 5.08, "class": 12, "category": "Calculus"},
    "Differential Equations": {"weight": 4.16, "class": 12, "category": "Calculus"},
    "Vector Algebra": {"weight": 4.69, "class": 12, "category": "3D Geometry"},
    "Three-Dimensional Geometry": {"weight": 7.35, "class": 12, "category": "3D Geometry"},
    "Probability": {"weight": 3.09, "class": 12, "category": "Algebra"},
}

MATH_MACRO_TRENDS_2026 = {
    "Calculus": {"weight_2024": 37.3, "weight_2025": 30.7, "trend": "decreasing"},
    "Algebra": {"weight_2024": 33.5, "weight_2025": 39.4, "trend": "increasing"},
    "3D Geometry": {"weight_2024": 13.3, "weight_2025": 12.0, "trend": "stable"},
    "2D Geometry": {"weight_2024": 12.3, "weight_2025": 15.4, "trend": "increasing"},
    "Trigonometry": {"weight_2024": 3.5, "weight_2025": 2.5, "trend": "decreasing"},
}

MATH_2025_DISTRIBUTION = {
    "Three-Dimensional Geometry": {"jan": 18, "apr": 17},
    "Matrices and Determinants": {"jan": 18, "apr": 15},
    "Differential Equations": {"jan": 15, "apr": 9},
    "Vector Algebra": {"jan": 12, "apr": 10},
    "Definite Integration": {"jan": 11, "apr": 9},
    "Sequences and Series": {"jan": 13, "apr": 13},
    "Binomial Theorem": {"jan": 11, "apr": 13},
    "Probability": {"jan": 12, "apr": 9},
    "Permutations and Combinations": {"jan": 12, "apr": 9},
    "Quadratic Equations": {"jan": 8, "apr": 8},
    "Complex Numbers": {"jan": 8, "apr": 8},
}


# =============================================================================
# PHYSICS DATA
# =============================================================================

PHYSICS_CHAPTER_WEIGHTAGE = {
    # High-Impact Chapters
    "Units and Measurements": {"weight": 4.24, "class": 11, "category": "Mechanics"},
    "Motion in a Straight Line": {"weight": 3.00, "class": 11, "category": "Mechanics"},
    "Motion in a Plane": {"weight": 3.00, "class": 11, "category": "Mechanics"},
    "Laws of Motion": {"weight": 3.50, "class": 11, "category": "Mechanics"},
    "Work Energy and Power": {"weight": 3.50, "class": 11, "category": "Mechanics"},
    "Rotational Motion": {"weight": 4.31, "class": 11, "category": "Mechanics"},
    "Gravitation": {"weight": 4.49, "class": 11, "category": "Mechanics"},
    "Mechanical Properties of Solids": {"weight": 2.50, "class": 11, "category": "Mechanics"},
    "Mechanical Properties of Fluids": {"weight": 2.50, "class": 11, "category": "Mechanics"},
    "Thermal Properties of Matter": {"weight": 2.50, "class": 11, "category": "Thermodynamics"},
    "Thermodynamics": {"weight": 3.06, "class": 11, "category": "Thermodynamics"},
    "Kinetic Theory": {"weight": 2.50, "class": 11, "category": "Thermodynamics"},
    "Oscillations": {"weight": 3.25, "class": 11, "category": "Waves"},
    "Waves": {"weight": 3.00, "class": 11, "category": "Waves"},
    # Class XII
    "Electric Charges and Fields": {"weight": 3.50, "class": 12, "category": "Electromagnetism"},
    "Electrostatic Potential and Capacitance": {"weight": 4.49, "class": 12, "category": "Electromagnetism"},
    "Current Electricity": {"weight": 6.57, "class": 12, "category": "Electromagnetism"},
    "Moving Charges and Magnetism": {"weight": 3.50, "class": 12, "category": "Electromagnetism"},
    "Magnetism and Matter": {"weight": 2.50, "class": 12, "category": "Electromagnetism"},
    "Electromagnetic Induction": {"weight": 3.50, "class": 12, "category": "Electromagnetism"},
    "Alternating Current": {"weight": 3.00, "class": 12, "category": "Electromagnetism"},
    "Electromagnetic Waves": {"weight": 2.00, "class": 12, "category": "Electromagnetism"},
    "Ray Optics and Optical Instruments": {"weight": 5.04, "class": 12, "category": "Optics"},
    "Wave Optics": {"weight": 3.50, "class": 12, "category": "Optics"},
    "Dual Nature of Radiation and Matter": {"weight": 4.05, "class": 12, "category": "Modern Physics"},
    "Atoms": {"weight": 3.00, "class": 12, "category": "Modern Physics"},
    "Nuclei": {"weight": 3.00, "class": 12, "category": "Modern Physics"},
    "Semiconductor Electronics": {"weight": 4.75, "class": 12, "category": "Modern Physics"},
}

PHYSICS_SUBDISCIPLINE_TRENDS = {
    "Mechanics": {"weight_2024": 36.3, "weight_2025": 35.0, "trend": "stable"},
    "Electromagnetism": {"weight_2024": 31.0, "weight_2025": 26.9, "trend": "decreasing"},
    "Modern Physics": {"weight_2024": 14.7, "weight_2025": 17.1, "trend": "increasing"},
    "Optics": {"weight_2024": 8.5, "weight_2025": 10.0, "trend": "increasing"},
    "Thermodynamics": {"weight_2024": 5.0, "weight_2025": 6.0, "trend": "stable"},
    "Waves": {"weight_2024": 4.5, "weight_2025": 5.0, "trend": "stable"},
}


# =============================================================================
# CHEMISTRY DATA
# =============================================================================

CHEMISTRY_CHAPTER_WEIGHTAGE = {
    # Physical Chemistry
    "Some Basic Concepts of Chemistry": {"weight": 2.50, "class": 11, "category": "Physical"},
    "Structure of Atom": {"weight": 3.00, "class": 11, "category": "Physical"},
    "States of Matter": {"weight": 2.50, "class": 11, "category": "Physical"},
    "Chemical Thermodynamics": {"weight": 3.65, "class": 11, "category": "Physical"},
    "Equilibrium": {"weight": 3.00, "class": 11, "category": "Physical"},
    "Redox Reactions": {"weight": 2.00, "class": 11, "category": "Physical"},
    "Solutions": {"weight": 4.54, "class": 12, "category": "Physical"},
    "Electrochemistry": {"weight": 3.30, "class": 12, "category": "Physical"},
    "Chemical Kinetics": {"weight": 3.61, "class": 12, "category": "Physical"},
    "Surface Chemistry": {"weight": 2.00, "class": 12, "category": "Physical"},
    # Organic Chemistry
    "Organic Chemistry Basic Principles": {"weight": 3.50, "class": 11, "category": "Organic"},
    "Hydrocarbons": {"weight": 3.00, "class": 11, "category": "Organic"},
    "Haloalkanes and Haloarenes": {"weight": 3.00, "class": 12, "category": "Organic"},
    "Alcohols Phenols and Ethers": {"weight": 3.50, "class": 12, "category": "Organic"},
    "Aldehydes Ketones and Carboxylic Acids": {"weight": 5.95, "class": 12, "category": "Organic"},
    "Amines": {"weight": 4.40, "class": 12, "category": "Organic"},
    "Biomolecules": {"weight": 3.99, "class": 12, "category": "Organic"},
    "Polymers": {"weight": 2.00, "class": 12, "category": "Organic"},
    "Chemistry in Everyday Life": {"weight": 1.50, "class": 12, "category": "Organic"},
    # Inorganic Chemistry
    "Classification of Elements": {"weight": 2.50, "class": 11, "category": "Inorganic"},
    "Chemical Bonding and Molecular Structure": {"weight": 3.50, "class": 11, "category": "Inorganic"},
    "Hydrogen": {"weight": 2.00, "class": 11, "category": "Inorganic"},
    "s-Block Elements": {"weight": 2.50, "class": 11, "category": "Inorganic"},
    "p-Block Elements": {"weight": 4.00, "class": 12, "category": "Inorganic"},
    "d and f Block Elements": {"weight": 4.69, "class": 12, "category": "Inorganic"},
    "Coordination Compounds": {"weight": 5.33, "class": 12, "category": "Inorganic"},
}

CHEMISTRY_SUBDISCIPLINE_TRENDS = {
    "Physical": {"weight": 35.0, "trend": "stable"},
    "Organic": {"weight": 35.0, "trend": "stable"},
    "Inorganic": {"weight": 30.0, "trend": "stable"},
}


# =============================================================================
# HIGH PRIORITY CHAPTERS FOR 2026
# =============================================================================

HIGH_PRIORITY_2026 = {
    "math": [
        "Three-Dimensional Geometry",
        "Matrices",
        "Determinants",
        "Sequences and Series",
        "Binomial Theorem",
        "Definite Integration",
        "Applications of Derivatives",
        "Complex Numbers",
        "Probability",
    ],
    "physics": [
        "Ray Optics and Optical Instruments",
        "Units and Measurements",
        "Electrostatic Potential and Capacitance",
        "Current Electricity",
        "Rotational Motion",
        "Gravitation",
        "Semiconductor Electronics",
        "Dual Nature of Radiation and Matter",
    ],
    "chemistry": [
        "Chemical Thermodynamics",
        "Coordination Compounds",
        "Aldehydes Ketones and Carboxylic Acids",
        "Electrochemistry",
        "Solutions",
        "Amines",
        "d and f Block Elements",
    ],
}


class KnowledgeBase:
    """
    Knowledge base for JEE exam data.
    Combines hardcoded data with real PYQ-derived weightage.
    """
    
    def __init__(self):
        self.chapter_data = {
            "math": MATH_CHAPTER_WEIGHTAGE.copy(),
            "physics": PHYSICS_CHAPTER_WEIGHTAGE.copy(),
            "chemistry": CHEMISTRY_CHAPTER_WEIGHTAGE.copy(),
        }
        self.macro_trends = {
            "math": MATH_MACRO_TRENDS_2026,
            "physics": PHYSICS_SUBDISCIPLINE_TRENDS,
            "chemistry": CHEMISTRY_SUBDISCIPLINE_TRENDS,
        }
        self.high_priority = HIGH_PRIORITY_2026
        
        # Auto-computed PYQ stats (populated lazily)
        self._pyq_stats: Optional[Dict] = None
        
        logger.info("knowledge_base_initialized")
    
    def _get_pyq_stats(self) -> Dict:
        """Lazily compute and cache PYQ statistics from the vector store."""
        if self._pyq_stats is not None:
            return self._pyq_stats
        
        try:
            from app.data.vector_store import get_vector_store
            vs = get_vector_store()
            count = vs.get_collection_count()
            
            if count == 0:
                self._pyq_stats = {}
                return self._pyq_stats
            
            stats = vs.get_collection_stats()
            
            # Build per-subject chapter stats with real counts
            pyq_data: Dict = {}
            total_by_subject: Dict[str, int] = {}
            
            for subject_key, subject_count in stats.get("subjects", {}).items():
                total_by_subject[subject_key] = subject_count
            
            # Get all metadata to compute per-subject chapter distributions
            all_data = vs.collection.get(include=["metadatas"], limit=count)
            
            subject_chapters: Dict[str, Dict[str, Dict]] = {
                "mathematics": {}, "physics": {}, "chemistry": {}
            }
            subject_years: Dict[str, set] = {
                "mathematics": set(), "physics": set(), "chemistry": set()
            }
            
            for meta in all_data.get("metadatas", []):
                if not meta:
                    continue
                s = meta.get("subject", "")
                ch = meta.get("chapter", "")
                yr = meta.get("year", 0)
                
                if s in subject_chapters and ch:
                    if ch not in subject_chapters[s]:
                        subject_chapters[s][ch] = {"count": 0, "years": set()}
                    subject_chapters[s][ch]["count"] += 1
                    if yr:
                        subject_chapters[s][ch]["years"].add(yr)
                        subject_years[s].add(yr)
            
            # Convert to weightage percentages
            for subject, chapters in subject_chapters.items():
                total = sum(c["count"] for c in chapters.values())
                if total == 0:
                    continue
                
                # Normalize subject key (mathematics -> math)
                norm_key = "math" if subject == "mathematics" else subject
                pyq_data[norm_key] = {}
                
                for ch, data in chapters.items():
                    weight = (data["count"] / total) * 100
                    year_list = sorted(data["years"])
                    pyq_data[norm_key][ch] = {
                        "pyq_count": data["count"],
                        "pyq_weight": round(weight, 2),
                        "year_range": f"{year_list[0]}-{year_list[-1]}" if year_list else "",
                        "years_count": len(year_list),
                    }
            
            self._pyq_stats = {
                "total_questions": count,
                "subjects": total_by_subject,
                "subject_years": {k: sorted(v) for k, v in subject_years.items()},
                "chapters": pyq_data,
            }
            
            logger.info(
                "pyq_stats_computed",
                total=count,
                subjects=list(total_by_subject.keys()),
            )
            
        except Exception as e:
            logger.warning("pyq_stats_computation_failed", error=str(e))
            self._pyq_stats = {}
        
        return self._pyq_stats
    
    def get_all_chapters(self, subject: str) -> Dict:
        """Get all chapters with weightage for a subject."""
        return self.chapter_data.get(subject.lower(), {})
    
    def get_chapter_weightage(self, subject: str, chapter: str) -> Optional[Dict]:
        """Get weightage info for a specific chapter."""
        subject_data = self.chapter_data.get(subject.lower(), {})
        return subject_data.get(chapter)
    
    def get_weighted_topic(self, subject: str, class_filter: Optional[int] = None) -> str:
        """
        Select a topic based on JEE weightage (probability-based selection).
        
        Args:
            subject: The subject (math, physics, chemistry)
            class_filter: Optional filter for class 11 or 12 topics
            
        Returns:
            Selected topic name
        """
        subject_data = self.chapter_data.get(subject.lower(), {})
        if not subject_data:
            return "General"
        
        # Filter by class if specified
        if class_filter:
            subject_data = {
                k: v for k, v in subject_data.items() 
                if v.get("class") == class_filter
            }
        
        if not subject_data:
            return "General"
        
        topics = list(subject_data.keys())
        weights = [subject_data[t]["weight"] for t in topics]
        
        selected = random.choices(topics, weights=weights, k=1)[0]
        
        logger.debug(
            "weighted_topic_selected",
            subject=subject,
            topic=selected,
            weight=subject_data[selected]["weight"]
        )
        
        return selected
    
    def get_high_priority_topic(self, subject: str) -> str:
        """Get a high-priority topic for 2026 based on trends."""
        priority_topics = self.high_priority.get(subject.lower(), [])
        if priority_topics:
            return random.choice(priority_topics)
        return self.get_weighted_topic(subject)
    
    def get_macro_trends(self, subject: str) -> Dict:
        """Get macro-level trends for a subject."""
        return self.macro_trends.get(subject.lower(), {})
    
    def get_topic_distribution(
        self, 
        subject: str, 
        question_count: int,
        prioritize_high_weight: bool = True
    ) -> Dict[str, int]:
        """
        Get topic distribution for a given number of questions.
        
        Args:
            subject: The subject
            question_count: Total questions needed
            prioritize_high_weight: Whether to favor high-weight topics
            
        Returns:
            Dict mapping topic to question count
        """
        subject_data = self.chapter_data.get(subject.lower(), {})
        if not subject_data:
            return {}
        
        total_weight = sum(d["weight"] for d in subject_data.values())
        distribution = {}
        remaining = question_count
        
        # Sort by weight (highest first) if prioritizing
        sorted_topics = sorted(
            subject_data.items(),
            key=lambda x: x[1]["weight"],
            reverse=prioritize_high_weight
        )
        
        for topic, data in sorted_topics:
            if remaining <= 0:
                break
            
            # Calculate proportional questions
            topic_questions = max(1, round((data["weight"] / total_weight) * question_count))
            topic_questions = min(topic_questions, remaining)
            
            if topic_questions > 0:
                distribution[topic] = topic_questions
                remaining -= topic_questions
        
        # Distribute any remaining questions to high-weight topics
        if remaining > 0 and distribution:
            top_topic = list(distribution.keys())[0]
            distribution[top_topic] += remaining
        
        logger.info(
            "topic_distribution_calculated",
            subject=subject,
            total_questions=question_count,
            topics_selected=len(distribution)
        )
        
        return distribution
    
    def get_difficulty_for_topic(self, subject: str, topic: str) -> str:
        """
        Suggest difficulty based on topic complexity and trends.
        High-weight topics often have more medium-hard questions.
        """
        subject_data = self.chapter_data.get(subject.lower(), {})
        topic_data = subject_data.get(topic, {})
        
        weight = topic_data.get("weight", 3.0)
        
        # Higher weight topics tend to have harder questions
        if weight >= 5.0:
            return random.choices(["medium", "hard"], weights=[0.4, 0.6])[0]
        elif weight >= 3.0:
            return random.choices(["easy", "medium", "hard"], weights=[0.2, 0.5, 0.3])[0]
        else:
            return random.choices(["easy", "medium"], weights=[0.6, 0.4])[0]
    
    def get_context_for_prompt(self, subject: str, topic: Optional[str] = None) -> str:
        """
        Generate context string for LLM prompts.
        Combines hardcoded weightage + real PYQ statistics.
        """
        subject_data = self.chapter_data.get(subject.lower(), {})
        trends = self.macro_trends.get(subject.lower(), {})
        priority = self.high_priority.get(subject.lower(), [])
        pyq_stats = self._get_pyq_stats()
        pyq_chapters = pyq_stats.get("chapters", {}).get(subject.lower(), {})
        
        # Build weightage summary (top 10 topics) with PYQ counts
        sorted_topics = sorted(
            subject_data.items(),
            key=lambda x: x[1]["weight"],
            reverse=True
        )[:10]
        
        weightage_lines = []
        for t_name, data in sorted_topics:
            line = f"- {t_name}: {data['weight']:.1f}% (Class {data['class']})"
            # Try to find matching PYQ data
            for pyq_ch, pyq_data in pyq_chapters.items():
                if pyq_ch.replace('-', ' ').lower() in t_name.lower() or t_name.lower() in pyq_ch.replace('-', ' ').lower():
                    line += f" [{pyq_data['pyq_count']} PYQs, {pyq_data['year_range']}]"
                    break
            weightage_lines.append(line)
        
        # Build trends summary
        trend_lines = [
            f"- {category}: {data.get('weight_2025', data.get('weight', 0)):.1f}% ({data.get('trend', 'stable')})"
            for category, data in trends.items()
        ]
        
        # PYQ info
        total_pyqs = pyq_stats.get("total_questions", 0)
        subject_pyqs = pyq_stats.get("subjects", {}).get(
            "mathematics" if subject.lower() == "math" else subject.lower(), 0
        )
        
        # Top PYQ chapters (by real question count)
        top_pyq_chapters = sorted(
            pyq_chapters.items(),
            key=lambda x: x[1]["pyq_count"],
            reverse=True
        )[:5]
        pyq_lines = [
            f"- {ch.replace('-', ' ').title()}: {d['pyq_count']} questions ({d['pyq_weight']:.1f}%, {d['year_range']})"
            for ch, d in top_pyq_chapters
        ]
        
        context = f"""## JEE MAIN {subject.upper()} — EXAM INTELLIGENCE

### Chapter Weightage (5-Year Analysis):
{chr(10).join(weightage_lines)}

### Real PYQ Data ({subject_pyqs:,} past questions from {total_pyqs:,} total):
{chr(10).join(pyq_lines) if pyq_lines else '- No PYQ data available'}

### Category Trends for 2026:
{chr(10).join(trend_lines)}

### High-Priority Topics for 2026:
{', '.join(priority[:5])}

### INSTRUCTIONS:
- Generate questions matching REAL JEE Main style, difficulty, and complexity
- High-weightage chapters should have harder, multi-concept questions
- Match the question patterns from actual PYQs (Past Year Questions)"""

        if topic:
            # Add topic-specific context
            topic_info = subject_data.get(topic, {})
            # Try fuzzy match in PYQ data
            pyq_topic_info = None
            for pyq_ch, pyq_data in pyq_chapters.items():
                if pyq_ch.replace('-', ' ').lower() in topic.lower() or topic.lower() in pyq_ch.replace('-', ' ').lower():
                    pyq_topic_info = pyq_data
                    break
            
            context += f"\n\n### Selected Topic: {topic}"
            if topic_info:
                context += f"\n- Weightage: {topic_info['weight']:.1f}%"
                context += f"\n- Class: {topic_info['class']}"
                context += f"\n- Category: {topic_info['category']}"
            if pyq_topic_info:
                context += f"\n- PYQ Count: {pyq_topic_info['pyq_count']} real past questions"
                context += f"\n- Years Active: {pyq_topic_info['year_range']}"
                context += f"\n- This is a {'HIGH' if pyq_topic_info['pyq_weight'] > 5 else 'MEDIUM' if pyq_topic_info['pyq_weight'] > 2 else 'LOW'}-frequency topic in JEE"
        
        return context


# =============================================================================
# SINGLETON
# =============================================================================

_kb: Optional[KnowledgeBase] = None
_kb_lock = __import__('threading').Lock()


def get_knowledge_base() -> KnowledgeBase:
    """Get the singleton knowledge base instance (thread-safe)."""
    global _kb
    if _kb is None:
        with _kb_lock:
            if _kb is None:
                _kb = KnowledgeBase()
    return _kb
