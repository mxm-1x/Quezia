"""
Physics Expert Agent (LLM-Based)

Purpose: Generate EXACTLY ONE JEE-Main quality Physics question
Specialized for Physics domain with focus on:
- Mechanics, Electrodynamics, Optics, Thermodynamics, Modern Physics
- Proper SI units and physical constants
- Free body diagrams and circuit diagrams

Uses BaseSubjectAgent — only domain-specific config lives here.
"""
from app.agents.base_subject_agent import SubjectAgent
from app.core.logging import get_logger

logger = get_logger(__name__)

# Physics-specific guidelines and expertise
PHYSICS_EXPERTISE = """
PHYSICS-SPECIFIC GUIDELINES:
1. UNITS & CONSTANTS:
   - Always use SI units (m, kg, s, A, K, mol, cd)
   - Standard values: g = 10 m/s² (unless specified), c = 3×10⁸ m/s
   - Include units in numerical answers and options

2. DIAGRAM GUIDANCE (set requires_diagram=true ONLY when the question genuinely needs a visual):
   - Free Body Diagrams: when forces, tensions, pulleys, inclined planes are central to solving
   - Circuit diagrams: when a specific circuit layout is described
   - Ray optics: when the question describes a specific optical setup with mirrors, lenses, prisms
   - Wave diagrams: when interference/diffraction patterns are part of the question
   - Motion diagrams: when a specific physical setup (projectile path, spring-mass system) needs visualization
   - Do NOT set requires_diagram=true for pure formula/calculation questions even if the topic is visual

3. TOPIC-SPECIFIC TIPS:
   - Mechanics: Use realistic masses (1-100 kg), velocities (1-100 m/s)
   - Electrostatics: Use charges in μC or nC range
   - Current Electricity: Use resistances in Ω to kΩ range
   - Optics: Use focal lengths in cm range
   - Modern Physics: Use eV for energy, Å for wavelength

4. COMMON JEE PHYSICS PATTERNS:
   - Two-body problems with constraints
   - Energy conservation with multiple forms
   - Superposition in waves and fields
   - Dimensional analysis as verification
"""

# Singleton agent instance
_agent = SubjectAgent(
    subject="physics",
    expertise=PHYSICS_EXPERTISE,
    teacher_desc=(
        "an expert JEE PHYSICS teacher with 20+ years of experience in teaching "
        "Mechanics, Electrodynamics, Optics, Thermodynamics, and Modern Physics"
    ),
)

# Public API — backward compatible
physics_agent = _agent.as_node()
_generate_physics_question = _agent.generate
_generate_physics_question_async = _agent.generate_async
