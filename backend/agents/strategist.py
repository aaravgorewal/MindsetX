"""
Strategist Agent
Plans and strategizes responses, determines best approach
"""

import logging
from typing import Dict, Any, List, Optional
from enum import Enum

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
    ) -> dict:
        """
        Generate a user-facing reply and action list based on the drift state
        produced by Auditor.compute_drift().

        Args:
            drift_state:  "stable" | "early_warning" | "high_risk" | "no_history"
            memory_hits:  (optional) list of past similar messages for context.

        Returns:
            {"message": str, "actions": List[str]}
        """
        responses = {
            "stable": {
                "message": "You're doing well. Here are some light wellness tips.",
                "actions": ["mindfulness_nudge", "studio_recommendation"],
            },
            "early_warning": {
                "message": "It looks like stress is increasing. Try these steps.",
                "actions": ["journaling_prompt", "sleep_hygiene", "soft_counselor_prompt"],
            },
            "high_risk": {
                "message": "You're not alone. Immediate help is available.",
                "actions": ["tele_manas", "urgent_counselor", "human_alert"],
            },
            "no_history": {
                "message": "Welcome. Let's start with a mental health check.",
                "actions": ["phq9_prompt"],
            },
        }
        result = responses.get(
            drift_state,
            {"message": "I'm here to support you.", "actions": ["phq9_prompt"]},
        )
        logger.info(f"🎯 Strategy for drift_state='{drift_state}': {result['actions']}")
        return result

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
