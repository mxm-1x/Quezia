"""
Chemistry Expert Agent (LLM-Based)

Purpose: Generate EXACTLY ONE JEE-Main quality Chemistry question
Specialized for Chemistry domain with focus on:
- Physical Chemistry (Thermodynamics, Kinetics, Electrochemistry)
- Organic Chemistry (Reactions, Mechanisms, Named Reactions)
- Inorganic Chemistry (Periodic Trends, Coordination, Metallurgy)

Uses BaseSubjectAgent — only domain-specific config lives here.
"""
from app.agents.base_subject_agent import SubjectAgent
from app.core.logging import get_logger

logger = get_logger(__name__)

# Chemistry-specific guidelines and expertise
CHEMISTRY_EXPERTISE = """
CHEMISTRY-SPECIFIC GUIDELINES:
1. NOMENCLATURE & CONVENTIONS:
   - Use IUPAC nomenclature for organic compounds
   - Standard state conditions: 25°C (298 K), 1 atm, 1 M
   - Use proper oxidation states: Fe³⁺, Mn⁷⁺, Cr⁶⁺
   - Thermodynamic sign convention: ΔH < 0 (exothermic)

2. DIAGRAM GUIDANCE (set requires_diagram=true ONLY when the question genuinely needs a visual):
   - Reaction mechanisms: when arrow-pushing or intermediate steps need to be shown
   - Molecular structures: when 3D geometry, Lewis structures, or spatial arrangement is central to the question
   - Electrochemical cells: when a specific cell setup needs to be visualized
   - Crystal structures: when unit cell or crystal field splitting must be shown
   - Do NOT set requires_diagram=true for pure calculation questions (pH, molarity, Kp) or factual recall

3. TOPIC-SPECIFIC TIPS:
   - Physical Chemistry: Use realistic values (ΔH in kJ/mol, K in appropriate ranges)
   - Organic Chemistry: Focus on named reactions (Aldol, Cannizzaro, Friedel-Crafts)
   - Inorganic Chemistry: Periodic trends, d-block and f-block properties
   - Equilibrium: Use ICE tables concept, Le Chatelier's principle

4. COMMON JEE CHEMISTRY PATTERNS:
   - Reaction prediction and product identification
   - Numerical problems in Physical Chemistry (Kp, Kc, pH, EMF)
   - Isomerism and stereochemistry
   - Coordination compound properties (CFSE, magnetic moment)
   - Periodic table trends and exceptions
"""

# Singleton agent instance
_agent = SubjectAgent(
    subject="chemistry",
    expertise=CHEMISTRY_EXPERTISE,
    teacher_desc=(
        "an expert JEE CHEMISTRY teacher with 20+ years of experience in teaching "
        "Physical Chemistry, Organic Chemistry, and Inorganic Chemistry"
    ),
)

# Public API — backward compatible
chemistry_agent = _agent.as_node()
_generate_chemistry_question = _agent.generate
_generate_chemistry_question_async = _agent.generate_async
