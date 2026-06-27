"""
Diagram Generator Agent
Called ONLY if state["requires_diagram"] == True

Responsibilities:
1. Generate structured diagram spec
2. Call image generation API (Pollinations.ai)
"""
import base64
import requests
import urllib.parse
from app.core.state import AIState
from app.core.llm import get_llm
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


def _generate_diagram_spec(state: AIState) -> dict:
    """Generate diagram specification using LLM."""
    try:
        llm = get_llm()
        question = state.get("question", {})
        
        system_prompt = """You are a Diagram Specification Generator for a JEE exam preparation system.

Your sole purpose: Generate precise, minimal diagram specifications that help students 
visualize problems WITHOUT revealing solutions.

═══════════════════════════════════════════════════════════════════════════════
PRIMARY OBJECTIVES
═══════════════════════════════════════════════════════════════════════════════

1. Determine if a diagram adds value to problem comprehension
2. Classify the diagram type (physics/mathematics/chemistry)
3. Produce unambiguous, renderable specifications
4. Maintain strict JEE exam conventions and notation

═══════════════════════════════════════════════════════════════════════════════
ABSOLUTE CONSTRAINTS
═══════════════════════════════════════════════════════════════════════════════

CORRECTNESS
├─ Diagram must be scientifically/mathematically accurate
├─ All angles, proportions, and relationships must be realistic
└─ Physical laws must be respected (e.g., force directions, wave properties)

FIDELITY TO QUESTION
├─ Include ONLY information explicitly stated in the question
├─ Do NOT add implied values, measurements, or assumptions
├─ Do NOT include intermediate steps or solution elements
└─ Do NOT show calculated results or answer hints

EXAM AUTHENTICITY
├─ Use standard JEE/NCERT notation (∠ABC not "angle ABC", θ not "theta")
├─ Follow SI units and conventional symbol usage
├─ Match typical exam diagram style (clean, minimal, functional)
└─ Use proper mathematical/scientific conventions (right-hand rule, etc.)

VISUAL CLARITY
├─ Minimize visual complexity—clarity trumps completeness
├─ Use geometric primitives (lines, circles, arcs) over complex shapes
├─ Position labels to avoid ambiguity or overlap
├─ Maintain consistent scale relationships within the diagram
└─ Ensure diagram is renderable in SVG or via AI image generation

═══════════════════════════════════════════════════════════════════════════════
STYLE SPECIFICATIONS
═══════════════════════════════════════════════════════════════════════════════

Visual Aesthetic:
- Monochrome or maximum 2-3 colors for categorization only
- Line weight: 1-2px for primary elements, 0.5px for construction lines
- No shadows, gradients, or 3D effects
- No decorative elements or artistic embellishments
- White/transparent background only
- Exam textbook aesthetic (utilitarian, not illustrative)

Perspective:
- Strictly 2D orthographic projection
- Use standard view conventions (top/side/front as appropriate)
- For 3D concepts, use established 2D representations (e.g., isometric for circuits)

Typography:
- Sans-serif font for all labels
- Variable names italicized (as per mathematical convention)
- Units in roman (non-italic) font
- Font size hierarchy: title > primary labels > secondary annotations

═══════════════════════════════════════════════════════════════════════════════
SUPPORTED DIAGRAM CATEGORIES
═══════════════════════════════════════════════════════════════════════════════

PHYSICS
├─ Mechanics: FBDs, motion paths, pulley systems, inclined planes
├─ Optics: Ray diagrams, lens/mirror setups, interference patterns
├─ Electricity: Circuit diagrams, field lines, equipotential surfaces
├─ Waves: Standing waves, wave interference, oscillation graphs
└─ Modern: Energy level diagrams, particle trajectories

MATHEMATICS
├─ Geometry: Triangles, circles, polygons with marked properties
├─ Coordinate Systems: 2D/3D graphs, parametric plots
├─ Calculus: Function curves, area representations, tangent/normal lines
├─ Vectors: Vector diagrams, geometric transformations
└─ Trigonometry: Unit circle, angle representations

CHEMISTRY
├─ Structures: Molecular geometry (Lewis, skeletal, 3D projections)
├─ Reactions: Mechanism arrows, energy profiles, equilibrium diagrams
├─ Laboratory: Simplified apparatus (avoid photorealistic detail)
└─ Physical: Phase diagrams, orbital diagrams, lattice structures

═══════════════════════════════════════════════════════════════════════════════
OUTPUT SCHEMA (STRICT JSON)
═══════════════════════════════════════════════════════════════════════════════

Return ONLY valid JSON. No preamble, explanation, or markdown.

For diagrams:
{
  "diagramRequired": true,
  "diagramType": "physics" | "mathematics" | "chemistry",
  "diagramTitle": "Brief descriptive title (max 8 words)",
  "viewType": "top" | "side" | "front" | "isometric" | "coordinate_plane",
  "elements": [
    {
      "type": "line" | "arrow" | "circle" | "rectangle" | "polygon" | "curve" | "arc" | "point" | "text" | "angle_marker" | "spring" | "resistor" | "lens" | "mirror",
      "id": "unique_element_identifier",
      "label": "Display text (use proper notation: θ, α, F₁, etc.)",
      "description": "What this represents in the problem context",
      "position": "Spatial relationship to other elements or origin",
      "attributes": {
        // Type-specific properties
        // Examples: "radius": "r", "length": "L", "direction": "northeast"
      }
    }
  ],
  "constraints": [
    "Geometric or physical constraint (e.g., 'AB ⊥ CD', 'θ₁ = θ₂')"
  ],
  "renderingNotes": [
    "Critical instructions for visual accuracy (e.g., 'Ensure vectors originate from point O', 'Rays must converge at focus F')"
  ]
}

For questions not requiring diagrams:
{
  "diagramRequired": false,
  "reason": "Brief explanation (e.g., 'Purely algebraic problem', 'Diagram provided in question')"
}

═══════════════════════════════════════════════════════════════════════════════
PRE-OUTPUT VALIDATION CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

Before returning your response, verify:

□ Scientific/mathematical accuracy confirmed
□ All elements correspond to information in the question
□ No solution steps, hints, or answers visible
□ Notation matches JEE/NCERT standards
□ Labels are unambiguous and properly positioned
□ Diagram is minimally complex yet complete
□ Specification is renderable without ambiguity
□ JSON syntax is valid and schema-compliant

═══════════════════════════════════════════════════════════════════════════════
EXAMPLE DECISION TREE
═══════════════════════════════════════════════════════════════════════════════

Question mentions geometry/spatial setup → likely needs diagram
Question is purely algebraic/formulaic → likely no diagram
Question describes physical scenario → assess if visualization aids comprehension
Diagram already provided in question → return diagramRequired: false
Question requires graph interpretation → generate coordinate system

═══════════════════════════════════════════════════════════════════════════════
"""

        user_prompt = f"""Question: {question.get('question_text', '')}
Subject: {state.get('subject')}
Topic: {question.get('topic', '')}

Create a diagram specification that will help visualize this problem."""
        
        response = llm.invoke(system_prompt, user_prompt, expect_json=True, tier="medium")
        
        required_fields = ["diagram_type", "description", "elements"]
        for field in required_fields:
            if field not in response:
                response[field] = "unknown" if field == "diagram_type" else []
        
        return response
        
    except Exception as e:
        logger.error("diagram_spec_generation_failed", error=str(e))
        # Return a fallback spec
        return {
            "diagram_type": "generic",
            "description": "Educational diagram",
            "elements": ["diagram"],
            "labels": [],
            "style": "clean technical illustration",
            "error": str(e)
        }


def _generate_image(diagram_spec: dict) -> str:
    """Generate image using Pollinations.ai."""
    try:
        description = diagram_spec.get("description", "Educational diagram")
        if isinstance(description, list):
            description = ", ".join(str(d) for d in description) if description else "Educational diagram"
        
        # Handle elements - can be list of strings or list of dicts
        raw_elements = diagram_spec.get("elements", [])
        if raw_elements and isinstance(raw_elements[0], dict):
            # Extract labels/descriptions from dict elements
            elements = ", ".join(
                e.get("label", e.get("description", str(e.get("type", "element"))))
                for e in raw_elements
            )
        else:
            elements = ", ".join(str(e) for e in raw_elements)
        
        # Handle labels - can be list of strings or None
        raw_labels = diagram_spec.get("labels", [])
        if raw_labels:
            labels = ", ".join(str(l) for l in raw_labels)
        else:
            labels = ""
        
        style = diagram_spec.get("style", "clean technical illustration")
        
        # Build the prompt for educational diagram
        prompt = f"""Educational physics diagram: {description}. 
Elements: {elements}. 
Labels: {labels}. 
Style: {style}, clean white background, clear bold lines, professional educational style, simple and uncluttered, vector art style"""
        
        if getattr(settings, "IMAGE_PROVIDER", "pollinations") == "openrouter":
            return _generate_image_openrouter(prompt)
        return _generate_image_pollinations(prompt)
            
    except Exception as e:
        logger.error("image_generation_failed", error=str(e))
        return None

import re
import os

def _generate_image_openrouter(prompt: str) -> str:
    """Generate image using OpenRouter models (like sourceful/riverflow-v2.5-fast)."""
    try:
        api_key = getattr(settings, "OPENROUTER_API_KEY", os.getenv("OPENROUTER_API_KEY"))
        if not api_key:
            logger.error("openrouter_api_key_missing")
            return None
            
        model = getattr(settings, "IMAGE_MODEL", "sourceful/riverflow-v2.5-fast")
        logger.info("generating_image", provider="openrouter", model=model)
        
        # OpenRouter chat completions endpoint
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model,
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }
        
        # May take a while for image generation
        response = requests.post(url, headers=headers, json=payload, timeout=120)
        
        if response.status_code == 200:
            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            # Extract URL from markdown or raw text
            # E.g. ![image](https://...) or just https://...
            url_match = re.search(r'(https?://[^\s\)]+)', content)
            if not url_match:
                logger.error("openrouter_no_url_found", content=content)
                return None
                
            image_url = url_match.group(1)
            logger.info("downloading_generated_image", url=image_url)
            
            # Download the actual image
            img_response = requests.get(image_url, timeout=60)
            if img_response.status_code == 200:
                image_b64 = base64.b64encode(img_response.content).decode('utf-8')
                logger.info("image_generated", provider="openrouter", size=len(image_b64))
                return f"data:image/png;base64,{image_b64}"
            else:
                logger.error("image_download_failed", status_code=img_response.status_code)
                return None
        else:
            error_detail = response.text[:300] if hasattr(response, 'text') else str(response.content[:300])
            logger.error("openrouter_image_error", status_code=response.status_code, response=error_detail)
            return None
            
    except Exception as e:
        logger.error("openrouter_image_exception", error=str(e))
        return None




def _generate_image_pollinations(prompt: str) -> str:
    """Generate image using Pollinations.ai free API (URL-based, no key required)."""
    try:
        # Pollinations.ai free endpoint - no API key required
        # Uses URL encoding for prompts
        encoded_prompt = urllib.parse.quote(prompt)
        
        # Direct image URL - Pollinations generates and returns image directly
        image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true"
        
        logger.info("generating_image", provider="pollinations_free")
        
        # Add browser headers to avoid Cloudflare blocking
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        
        # Download the generated image
        response = requests.get(image_url, headers=headers, timeout=60)
        
        if response.status_code == 200:
            # Encode as base64
            image_b64 = base64.b64encode(response.content).decode('utf-8')
            logger.info("image_generated", provider="pollinations", size=len(image_b64))
            return f"data:image/png;base64,{image_b64}"
        else:
            error_detail = response.text[:300] if hasattr(response, 'text') else str(response.content[:300])
            logger.error("pollinations_api_error", status_code=response.status_code, response=error_detail)
            return None
            
    except requests.Timeout:
        logger.error("image_generation_timeout", provider="pollinations")
        return None
    except Exception as e:
        logger.error("image_generation_failed", provider="pollinations", error=str(e))
        return None


def diagram_generator(state: AIState) -> AIState:
    """
    Diagram generator - creates diagram spec and image.
    
    Called ONLY if requires_diagram == True.
    """
    logger.info("diagram_generator_started")
    
    # MVP: Skip image generation to save costs (enable via ENABLE_IMAGE_GENERATION=true)
    if not settings.ENABLE_IMAGE_GENERATION:
        logger.info("image_generation_disabled_mvp", reason="cost_saving")
        state["diagram_spec"] = None
        state["diagram_image"] = None
        return state
    
    # Check if diagram is required
    if not state.get("requires_diagram", False):
        logger.info("diagram_not_required")
        return state
    
    try:
        # Step 1: Generate diagram specification
        diagram_spec = _generate_diagram_spec(state)
        state["diagram_spec"] = diagram_spec
        
        logger.info(
            "diagram_spec_generated",
            diagram_type=diagram_spec.get("diagram_type"),
            elements_count=len(diagram_spec.get("elements", [])),
            has_error="error" in diagram_spec
        )
        
        # Step 2: Generate image (only if spec was successful)
        if "error" not in diagram_spec:
            image_b64 = _generate_image(diagram_spec)
            state["diagram_image"] = image_b64
            
            if image_b64:
                logger.info("diagram_image_generated", image_size=len(image_b64))
            else:
                logger.warning("diagram_image_generation_skipped", reason="generation_failed")
        else:
            logger.warning("diagram_image_generation_skipped", reason="spec_generation_failed")
            state["diagram_image"] = None
        
        return state
        
    except Exception as e:
        logger.error("diagram_generator_failed", error=str(e))
        # Don't fail the whole request if diagram generation fails
        state["diagram_spec"] = {"error": str(e)}
        state["diagram_image"] = None
        return state
