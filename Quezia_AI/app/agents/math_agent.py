"""
Mathematics Expert Agent (LLM-Based)

Purpose: Generate EXACTLY ONE JEE-Main quality Mathematics question
Specialized for Mathematics domain with focus on:
- Algebra, Calculus, Coordinate Geometry, Trigonometry, Vectors & 3D
- Precise mathematical notation
- Step-by-step logical reasoning

Uses BaseSubjectAgent — only domain-specific config lives here.
"""
from app.agents.base_subject_agent import SubjectAgent
from app.core.logging import get_logger

logger = get_logger(__name__)

# Math-specific guidelines and expertise
MATH_EXPERTISE = """
MATHEMATICS-SPECIFIC GUIDELINES:
1. NOTATION & PRECISION:
   - Use standard mathematical notation (∫, Σ, lim, →, ∈, ⊂)
   - Be precise with domain restrictions (x > 0, x ≠ 0)
   - Specify if answer should be exact (√2, π/4) or decimal
   - Use proper function notation: f(x), f'(x), f⁻¹(x)

2. DIAGRAM GUIDANCE (set requires_diagram=true ONLY when the question genuinely needs a visual):
   - Coordinate geometry: when a specific geometric figure (circle, conic, line) must be visualized to solve
   - 3D geometry: when spatial arrangement of lines/planes is key to the problem
   - Graphs: when the question asks to interpret or sketch a function graph
   - Area/Volume: when bounded regions need visualization
   - Do NOT set requires_diagram=true for pure algebraic/calculation questions even if the topic is geometric

3. TOPIC-SPECIFIC TIPS:
   - Algebra: Polynomials, sequences, matrices, complex numbers
   - Calculus: Limits, derivatives, integrals, differential equations
   - Coordinate Geometry: Straight lines, conic sections
   - Trigonometry: Identities, equations, inverse functions
   - Probability: Conditional probability, Bayes theorem

4. COMMON JEE MATH PATTERNS:
   - Finding range/domain of composite functions
   - Optimization problems using calculus
   - Counting problems with constraints
   - Matrix properties and determinants
   - Area/Volume using integration
"""

# Singleton agent instance
_agent = SubjectAgent(
    subject="math",
    expertise=MATH_EXPERTISE,
    teacher_desc=(
        "an expert JEE MATHEMATICS teacher with 20+ years of experience in teaching "
        "Algebra, Calculus, Coordinate Geometry, Trigonometry, and Vectors & 3D Geometry"
    ),
)

# Public API — backward compatible
math_agent = _agent.as_node()
_generate_math_question = _agent.generate
_generate_math_question_async = _agent.generate_async
