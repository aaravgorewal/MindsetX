"""
Strategist Agent
Plans and strategizes responses, determines best approach
"""

import logging
from typing import Dict, Any, List, Optional
from enum import Enum

from crisis_keywords import has_crisis_language

logger = logging.getLogger(__name__)


class Strategy(str, Enum):
    """Available strategies"""
    SUPPORTIVE = "supportive"
    EDUCATIONAL = "educational"
    ACTIONABLE = "actionable"
    PREVENTIVE = "preventive"
    CRISIS = "crisis"


class Strategist:
    """
    Agent responsible for:
    - Determining optimal response strategy
    - Planning multi-step interventions
    - Selecting best approach for situation
    - Managing complex scenarios
    - Prioritizing wellness goals
    """
    
    def __init__(self, qdrant_client):
        """
        Initialize Strategist agent
        
        Args:
            qdrant_client: QdrantClient instance
        """
        self.client = qdrant_client
        self.strategies_collection = "strategies"

        # Strategy selection rules (keyed by drift state from Auditor)
        self.strategy_rules = {
            "high_risk":     Strategy.CRISIS,
            "early_warning": Strategy.SUPPORTIVE,
            "stable":        Strategy.PREVENTIVE,
            "improving":     Strategy.PREVENTIVE,  # positive drift, reinforce good momentum
            "no_history":    Strategy.SUPPORTIVE,
            "low_mood":      Strategy.SUPPORTIVE,
            "knowledge_gap": Strategy.EDUCATIONAL,
            "goal_setting":  Strategy.ACTIONABLE,
            "maintenance":   Strategy.PREVENTIVE,
        }

    # ── Synchronous response generation (used by MASOrchestrator) ──────────

    def generate_response(
        self,
        drift_state: str,
        memory_hits: list = None,
        user_message: Optional[str] = None,
        sentiment: float = 0.0,
        drift_score: float = 0.0,
    ) -> dict:
        """
        Generate a user-facing reply and action list that dynamically reflects
        the user's message content, emotional tone, and psychological drift.

        Args:
            drift_state:  "stable" | "early_warning" | "high_risk" | "no_history"
            memory_hits:  (optional) list of past similar messages for context.
            user_message: (optional) text of the user's current message.
            sentiment:    (optional) polarity score (-1.0 to 1.0).
            drift_score:  (optional) numerical drift score.

        Returns:
            {"message": str, "actions": List[str]}
        """
        text = (user_message or "").lower().strip()

        # 1. IMMEDIATE CRISIS CHECK (word-boundary regex via shared crisis_keywords module)
        if has_crisis_language(user_message or ""):
            return {
                "message": (
                    "I am deeply concerned about you and want to ensure you are safe. "
                    "You do not have to carry this alone. Please reach out right now to India's official 24/7 free national crisis helplines:\n\n"
                    "• Tele-MANAS: Call 14416 or 1800-891-4416 (24/7, Toll-Free, Multi-lingual)\n"
                    "• KIRAN Mental Health Helpline: Call 1800-599-0019 (24/7, Toll-Free)\n"
                    "• Emergency Services: Dial 112\n\n"
                    "Please contact a trusted loved one or your campus counselor immediately. Help is available right now."
                ),
                "actions": ["tele_manas", "kiran_helpline", "urgent_counselor", "emergency_services"],
                "is_crisis": True,
            }

        # 2. TOPIC DETECTION FOR MESSAGE-AWARE REFLECTION
        has_sleep = any(w in text for w in ["sleep", "cant sleep", "can't sleep", "insomnia", "tired", "awake", "exhausted", "sleepless"])
        has_anxiety = any(w in text for w in ["anxious", "anxiety", "panic", "worried", "worry", "racing thoughts", "scared", "fear", "nervous"])
        has_overwhelm = any(w in text for w in ["overwhelmed", "overwhelming", "too much", "breaking down", "awful", "terrible", "burnout", "drowning"])
        has_stress = any(w in text for w in ["stressed", "stress", "pressure", "deadline", "exam", "test", "assignment", "grades", "college", "failing"])
        has_depression = any(w in text for w in ["depressed", "depression", "sad", "hopeless", "worthless", "empty", "lonely", "alone", "crying", "miserable"])
        has_positive = any(w in text for w in ["better", "good", "happy", "relieved", "calm", "grateful", "improving", "fine"])

        # 3. CRAFT DYNAMIC CONTENT-REFLECTIVE MESSAGE
        reply_message = ""
        actions = []

        if has_sleep and (has_stress or has_anxiety):
            reply_message = (
                "I hear how draining it is when stress and anxiety keep you from sleeping. "
                "When your mind won't quiet down at night, the next day feels so much heavier. "
                "Let's focus on calming your nervous system tonight—would you like to try a 4-7-8 breathing exercise "
                "or look at a gentle wind-down routine?"
            )
            actions = ["sleep_hygiene", "mindfulness_nudge", "soft_counselor_prompt"]

        elif has_overwhelm or ("awful" in text):
            reply_message = (
                "I'm so sorry you're feeling this awful and completely overwhelmed. "
                "When everything piles up all at once, your body and mind go into survival overdrive. "
                "You don't have to resolve everything today. Let's take just one slow breath together. "
                "What feels like the heaviest thing on your mind right now?"
            )
            actions = ["journaling_prompt", "soft_counselor_prompt"]

        elif has_anxiety:
            reply_message = (
                "It sounds like anxiety is running really high right now. "
                "Remember that what you're feeling in your body is an alarm response, not a sign that you are broken. "
                "Can you feel your feet flat on the floor right now? Let's take 30 seconds to ground ourselves."
            )
            actions = ["mindfulness_nudge", "journaling_prompt"]

        elif has_stress:
            reply_message = (
                "That sounds like a tremendous amount of stress you're carrying. "
                "Juggling heavy demands can make you feel stretched to your limit. "
                "Let's pause the pressure for a moment—is there one small thing we can set aside for today?"
            )
            actions = ["mindfulness_nudge", "studio_recommendation"]

        elif has_depression:
            reply_message = (
                "Thank you for trusting me with how low you're feeling. "
                "Feeling this way can make you feel completely isolated, but your feelings are valid and you are not alone. "
                "I'm here to listen without judgment whenever you're ready to share."
            )
            actions = ["soft_counselor_prompt", "phq9_prompt"]

        elif has_positive:
            reply_message = (
                "It's really wonderful to hear that things are feeling a bit lighter! "
                "Acknowledging these positive moments—even small ones—builds your resilience. "
                "What helped you feel more at ease today?"
            )
            actions = ["mindfulness_nudge", "studio_recommendation"]

        else:
            # Fallback based on sentiment and drift
            if sentiment < -0.3:
                reply_message = (
                    f"I can sense how much weight is behind what you're saying. "
                    "I'm right here with you—could you tell me a little more about what's been going on?"
                )
                actions = ["soft_counselor_prompt"]
            elif sentiment > 0.3:
                reply_message = (
                    "Thank you for sharing that with me! It sounds like things are going in a constructive direction. "
                    "How can I best support you today?"
                )
                actions = ["mindfulness_nudge"]
            else:
                reply_message = (
                    "Thank you for opening up. I'm here to support your mental wellness every step of the way. "
                    "How has this been impacting your daily energy?"
                )
                actions = ["phq9_prompt" if drift_state == "no_history" else "mindfulness_nudge"]

        # 4. TAILOR ACTIONS TO DRIFT STATE
        if drift_state == "high_risk":
            actions = ["tele_manas", "urgent_counselor", "human_alert"]
        elif drift_state == "early_warning":
            if "soft_counselor_prompt" not in actions:
                actions.append("soft_counselor_prompt")
        elif drift_state == "no_history" and "phq9_prompt" not in actions:
            actions.append("phq9_prompt")

        logger.info(f"🎯 Dynamic Strategy generated for drift='{drift_state}': actions={actions}")
        return {
            "message": reply_message,
            "actions": actions,
        }

    # ── Async planning methods ─────────────────────────────────────────────────────

    async def determine_strategy(
        self,
        context: Dict[str, Any],
        user_state: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Determine optimal strategy based on context and drift state.

        Uses drift_state from Auditor as the primary signal, falling back to
        wellness_score and risk_level for richer contextual decisions.

        Args:
            context:    Current interaction context (may include "drift_state").
            user_state: User's current state and history.

        Returns:
            Strategy recommendation with reasoning, steps, and alternatives.
        """
        try:
            # Primary: honour drift state produced by Auditor
            drift_state = context.get("drift_state", "")
            risk_level   = user_state.get("risk_level", "low")
            wellness_score = user_state.get("wellness_score", 0.5)

            # Map drift_state → Strategy enum via strategy_rules
            if drift_state in self.strategy_rules:
                selected_strategy = self.strategy_rules[drift_state]
                reasoning = [f"Drift state '{drift_state}' mapped to {selected_strategy}"]
            elif risk_level == "high":
                selected_strategy = Strategy.CRISIS
                reasoning = ["High-risk situation detected – crisis intervention"]
            elif wellness_score < 0.3:
                selected_strategy = Strategy.SUPPORTIVE
                reasoning = ["Low wellness score – supportive approach needed"]
            elif "knowledge_gap" in context.get("issues", []):
                selected_strategy = Strategy.EDUCATIONAL
                reasoning = ["Knowledge gap identified – educational strategy"]
            elif "goal_setting" in context.get("intent", ""):
                selected_strategy = Strategy.ACTIONABLE
                reasoning = ["Goal-setting context – actionable strategy"]
            else:
                selected_strategy = Strategy.PREVENTIVE
                reasoning = ["Maintenance mode – preventive strategy"]

            recommendation = {
                "strategy": selected_strategy,
                "reasoning": reasoning,
                "confidence": 0.85,
                "next_steps": self._get_strategy_steps(selected_strategy, user_state),
                "alternatives": self._get_alternative_strategies(selected_strategy),
                # Include simple response for callers that need message + actions
                "response": self.generate_response(
                    drift_state or ("high_risk" if risk_level == "high" else "stable")
                ),
            }

            logger.info(f"🎯 Strategy determined: {selected_strategy}")
            return recommendation

        except Exception as e:
            logger.error(f"❌ Error determining strategy: {e}")
            return {
                "strategy": Strategy.SUPPORTIVE,
                "error": str(e),
                "confidence": 0.0,
                "response": self.generate_response("no_history"),
            }

    def _get_strategy_steps(
        self,
        strategy: Strategy,
        user_state: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Get execution steps for a strategy"""
        steps = {
            Strategy.SUPPORTIVE: [
                {"order": 1, "action": "Acknowledge feelings", "duration": "5 min"},
                {"order": 2, "action": "Build rapport", "duration": "10 min"},
                {"order": 3, "action": "Provide encouragement", "duration": "5 min"},
                {"order": 4, "action": "Offer resources", "duration": "10 min"}
            ],
            Strategy.EDUCATIONAL: [
                {"order": 1, "action": "Assess knowledge level", "duration": "5 min"},
                {"order": 2, "action": "Present information", "duration": "20 min"},
                {"order": 3, "action": "Check understanding", "duration": "5 min"},
                {"order": 4, "action": "Provide practice", "duration": "15 min"}
            ],
            Strategy.ACTIONABLE: [
                {"order": 1, "action": "Define goals", "duration": "10 min"},
                {"order": 2, "action": "Create plan", "duration": "20 min"},
                {"order": 3, "action": "Set milestones", "duration": "10 min"},
                {"order": 4, "action": "Schedule check-ins", "duration": "5 min"}
            ],
            Strategy.PREVENTIVE: [
                {"order": 1, "action": "Review progress", "duration": "10 min"},
                {"order": 2, "action": "Identify risks", "duration": "10 min"},
                {"order": 3, "action": "Strengthen skills", "duration": "15 min"},
                {"order": 4, "action": "Plan maintenance", "duration": "10 min"}
            ],
            Strategy.CRISIS: [
                {"order": 1, "action": "Ensure safety", "duration": "IMMEDIATE"},
                {"order": 2, "action": "De-escalate", "duration": "5 min"},
                {"order": 3, "action": "Connect to resources", "duration": "10 min"},
                {"order": 4, "action": "Follow-up plan", "duration": "ongoing"}
            ]
        }
        return steps.get(strategy, [])
    
    def _get_alternative_strategies(self, primary: Strategy) -> List[Strategy]:
        """Get alternative strategies to primary"""
        alternatives = {
            Strategy.SUPPORTIVE: [Strategy.PREVENTIVE, Strategy.EDUCATIONAL],
            Strategy.EDUCATIONAL: [Strategy.ACTIONABLE, Strategy.SUPPORTIVE],
            Strategy.ACTIONABLE: [Strategy.EDUCATIONAL, Strategy.PREVENTIVE],
            Strategy.PREVENTIVE: [Strategy.SUPPORTIVE, Strategy.ACTIONABLE],
            Strategy.CRISIS: [Strategy.SUPPORTIVE]
        }
        return alternatives.get(primary, [Strategy.SUPPORTIVE])
    
    async def plan_intervention(
        self,
        user_id: str,
        goal: str,
        constraints: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Plan a multi-step intervention
        
        Args:
            user_id: User identifier
            goal: Intervention goal
            constraints: Time/resource constraints
            
        Returns:
            Detailed intervention plan
        """
        try:
            plan = {
                "goal": goal,
                "phases": [],
                "timeline": constraints.get("timeline", "2 weeks"),
                "resources_needed": []
            }
            
            # Phase 1: Assessment
            plan["phases"].append({
                "phase": 1,
                "name": "Assessment",
                "duration": "1 week",
                "tasks": [
                    "Gather baseline data",
                    "Identify barriers",
                    "Set measurable objectives"
                ]
            })
            
            # Phase 2: Implementation
            plan["phases"].append({
                "phase": 2,
                "name": "Implementation",
                "duration": "1-2 weeks",
                "tasks": [
                    "Execute plan steps",
                    "Track progress",
                    "Adjust as needed"
                ]
            })
            
            # Phase 3: Review & Adjustment
            plan["phases"].append({
                "phase": 3,
                "name": "Review",
                "duration": "ongoing",
                "tasks": [
                    "Measure outcomes",
                    "Get feedback",
                    "Plan next steps"
                ]
            })
            
            plan["resources_needed"] = [
                "Assessment tools",
                "Educational materials",
                "Support resources"
            ]
            
            logger.info(f"📋 Intervention plan created for user {user_id}: {goal}")
            return plan
            
        except Exception as e:
            logger.error(f"❌ Error planning intervention: {e}")
            return {"error": str(e)}
    
    async def prioritize_actions(
        self,
        actions: List[Dict[str, Any]],
        user_state: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Prioritize actions based on impact and urgency
        
        Args:
            actions: List of possible actions
            user_state: Current user state
            
        Returns:
            Prioritized action list
        """
        try:
            # Score each action
            scored_actions = []
            for action in actions:
                urgency = action.get("urgency", 0.5)
                impact = action.get("impact", 0.5)
                feasibility = action.get("feasibility", 0.5)
                
                # Calculate priority score (0-1)
                score = (urgency * 0.4 + impact * 0.4 + feasibility * 0.2)
                
                scored_actions.append({
                    **action,
                    "priority_score": score
                })
            
            # Sort by priority
            prioritized = sorted(
                scored_actions,
                key=lambda x: x["priority_score"],
                reverse=True
            )
            
            logger.info(f"📊 Prioritized {len(prioritized)} actions")
            return prioritized
            
        except Exception as e:
            logger.error(f"❌ Error prioritizing actions: {e}")
            return actions
