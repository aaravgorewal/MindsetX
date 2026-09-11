"""
MAS Orchestrator Agent
Coordinates all sub-agents: store → retrieve → drift → strategy pipeline.
Ported from backend/agents/orchestrator.py and adapted to the richer
Archivist / Auditor / Strategist classes in backend copy/.
"""

import logging
from typing import Dict, Any, Optional

from embedding_service import embed_text

logger = logging.getLogger(__name__)


class MASOrchestrator:
    """
    Master orchestrator that drives the full MAS pipeline for a chat turn:
      1. Archivist  – store current message embedding + retrieve similar past sessions
      2. Auditor    – compute cosine-drift between current vector and baseline
      3. Strategist – pick message + action list based on drift state
    """

    def __init__(self, qdrant_client):
        """
        Initialise orchestrator with a shared Qdrant client.
        Sub-agents are created here so they all share the same connection.
        """
        from agents.archivist import Archivist
        from agents.auditor import Auditor
        from agents.strategist import Strategist
        from agents.safebio import SafeBioAgent

        self.archivist = Archivist(qdrant_client)
        self.auditor = Auditor(qdrant_client)
        self.strategist = Strategist(qdrant_client)
        self.safebio = SafeBioAgent()
        logger.info("✅ MASOrchestrator initialised with all sub-agents")

    async def process_chat(
        self,
        user_id: str,
        message: str,
        session_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Full MAS pipeline for a single chat turn.

        Returns:
            {
                "reply":       str   – strategy message for the user,
                "drift_score": float – cosine similarity vs. baseline (0–1),
                "drift_state": str   – "stable" | "early_warning" | "high_risk" | "no_history",
                "actions":     list  – recommended action slugs,
            }
        """
        import uuid
        session_id = session_id or str(uuid.uuid4())

        # ── 1. Embed current message ───────────────────────────────────────────
        try:
            current_vec = embed_text(message)
        except Exception as e:
            logger.error(f"Embedding failed: {e}")
            return self._fallback_response(str(e))

        # ── 2. Store message in Archivist memory ───────────────────────────────
        try:
            await self.archivist.store_message(
                user_id=user_id,
                session_id=session_id,
                message=message,
                embedding=current_vec,
                metadata={"source": "chat"},
            )
        except Exception as e:
            logger.warning(f"Archivist store failed (non-fatal): {e}")

        # ── 3. Retrieve similar past messages for baseline ─────────────────────
        baseline_vecs: list = []
        try:
            similar = await self.archivist.retrieve_similar_messages(
                embedding=current_vec,
                user_id=user_id,
                limit=5,
            )
            # similar is a list of dicts; we need their raw vectors from Qdrant.
            # retrieve_similar_messages returns scored hits but not raw vectors.
            # Audit drift uses the payload text re-embedded as a proxy baseline.
            baseline_vecs = [embed_text(hit["message"]) for hit in similar if hit.get("message")]
        except Exception as e:
            logger.warning(f"Archivist retrieve failed (non-fatal): {e}")

        # ── 4. Compute drift ───────────────────────────────────────────────────
        try:
            drift_score, drift_state = self.auditor.compute_drift(current_vec, baseline_vecs)
        except Exception as e:
            logger.warning(f"Drift computation failed (non-fatal): {e}")
            drift_score, drift_state = 0.0, "no_history"

        logger.info(f"🌊 Drift — score={drift_score:.3f} state={drift_state}")

        # ── 5. Generate strategy ───────────────────────────────────────────────
        try:
            strategy = self.strategist.generate_response(drift_state)
        except Exception as e:
            logger.warning(f"Strategy generation failed: {e}")
            strategy = {
                "message": "I'm here to help. How are you feeling?",
                "actions": ["phq9_prompt"],
            }

        return {
            "reply": strategy["message"],
            "drift_score": round(drift_score, 4),
            "drift_state": drift_state,
            "actions": strategy.get("actions", []),
        }

    def _fallback_response(self, error: str) -> Dict[str, Any]:
        """Return a safe response when the pipeline fails."""
        return {
            "reply": "I'm here for you. Could you tell me more about how you're feeling?",
            "drift_score": 0.0,
            "drift_state": "no_history",
            "actions": ["phq9_prompt"],
            "error": error,
        }
