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
        sentiment: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Full MAS pipeline for a single chat turn:
          1. Embed incoming message
          2. Retrieve past messages for baseline (BEFORE storing current turn)
          3. Store current turn into Archivist memory
          4. Compute cosine drift against baseline history
          5. Strategist produces a contextual, message-aware response + actions
        """
        import uuid
        session_id = session_id or str(uuid.uuid4())

        # ── 1. Embed current message ───────────────────────────────────────────
        try:
            current_vec = embed_text(message)
        except Exception as e:
            logger.error(f"Embedding failed: {e}")
            return self._fallback_response(str(e), user_message=message)

        # ── 2. Retrieve past messages for baseline (BEFORE storing current message) ─
        baseline_vecs: list = []
        similar: list = []
        try:
            similar = await self.archivist.retrieve_similar_messages(
                embedding=current_vec,
                user_id=user_id,
                limit=5,
            )
            print(f"🔍 [Archivist.retrieve] session_id='{session_id}' found {len(similar)} past records")
            logger.info(f"🔍 [Archivist.retrieve] session_id='{session_id}' found {len(similar)} past records")
            for idx, hit in enumerate(similar):
                print(f"   [{idx}] score={hit.get('score', 0):.4f} msg='{hit.get('message', '')}'")
            # Audit drift uses past messages re-embedded as baseline
            baseline_vecs = [embed_text(hit["message"]) for hit in similar if hit.get("message")]
        except Exception as e:
            print(f"⚠️ [Archivist.retrieve] Retrieval failed: {e}")
            logger.warning(f"Archivist retrieve failed (non-fatal): {e}")

        # ── 3. Store message in Archivist memory ───────────────────────────────
        try:
            stored = await self.archivist.store_message(
                user_id=user_id,
                session_id=session_id,
                message=message,
                embedding=current_vec,
                metadata={"source": "chat", "sentiment": sentiment},
            )
            print(f"💾 [Archivist.store] user_id='{user_id}' session_id='{session_id}' stored={stored}")
            logger.info(f"💾 [Archivist.store] user_id='{user_id}' session_id='{session_id}' stored={stored}")
        except Exception as e:
            print(f"⚠️ [Archivist.store] Storage failed: {e}")
            logger.warning(f"Archivist store failed (non-fatal): {e}")

        # ── 4. Compute drift ───────────────────────────────────────────────────
        try:
            drift_score, drift_state = self.auditor.compute_drift(current_vec, baseline_vecs)
        except Exception as e:
            logger.warning(f"Drift computation failed (non-fatal): {e}")
            drift_score, drift_state = 0.0, "no_history"

        print(f"🌊 [Auditor.drift] score={drift_score:.4f} state='{drift_state}' (baseline_count={len(baseline_vecs)})")
        logger.info(f"🌊 [Auditor.drift] score={drift_score:.4f} state='{drift_state}' (baseline_count={len(baseline_vecs)})")

        # ── 5. Generate dynamic strategy response ─────────────────────────────
        try:
            strategy = self.strategist.generate_response(
                drift_state=drift_state,
                drift_score=drift_score,
                user_message=message,
                sentiment=sentiment,
                memory_hits=similar,
            )
            # If strategist flagged clinical crisis, escalate drift state to high_risk
            if strategy.get("is_crisis"):
                drift_state = "high_risk"
        except Exception as e:
            logger.warning(f"Strategy generation failed: {e}")
            return self._fallback_response(str(e), user_message=message)

        return {
            "reply": strategy["message"],
            "drift_score": round(drift_score, 4),
            "drift_state": drift_state,
            "actions": strategy.get("actions", []),
            "is_crisis": strategy.get("is_crisis", False),
        }

    def _fallback_response(self, error: str, user_message: str = "") -> Dict[str, Any]:
        """Return a safe response when the pipeline fails, checking for crisis language first."""
        text = (user_message or "").lower()
        crisis_keywords = [
            "suicide", "kill myself", "killing myself", "end my life", "ending my life", "end it all", "ending it all",
            "harm myself", "harming myself", "hurt myself", "hurting myself", "want to die", "wanna die", "feel like dying",
            "cut myself", "cutting myself", "slit my wrists", "slit my wrist", "take my life", "taking my life", "take my own life",
            "better off dead", "don't want to live", "dont want to live", "no reason to live", "hang myself", "overdose",
            "suicidal", "self harm", "self-harm", "mar jaunga", "khatam karna", "jaan deni", "jaan lena",
            "jeena nahi", "mar jana", "khudkushi", "atmahatya", "zeher", "marna chahta",
            "आत्महत्या", "खुदकुशी", "जान देनी", "जान लेना", "जीना नहीं", "मर जाना", "मरना चाहता", "मरना चाहती", "मर जाऊंगा", "मर जाऊंगी", "ज़हर"
        ]
        if any(kw in text for kw in crisis_keywords):
            return {
                "reply": (
                    "I am deeply concerned about you and want to ensure you are safe. "
                    "You do not have to carry this alone. Please reach out right now to India's official 24/7 free national crisis helplines:\n\n"
                    "• Tele-MANAS: Call 14416 or 1800-891-4416 (24/7, Toll-Free, Multi-lingual)\n"
                    "• KIRAN Mental Health Helpline: Call 1800-599-0019 (24/7, Toll-Free)\n"
                    "• Emergency Services: Dial 112\n\n"
                    "Please contact a trusted loved one or your campus counselor immediately. Help is available right now."
                ),
                "drift_score": 0.0,
                "drift_state": "high_risk",
                "actions": ["tele_manas", "kiran_helpline", "urgent_counselor", "emergency_services"],
                "is_crisis": True,
                "error": error,
            }

        return {
            "reply": "I'm here for you. Could you tell me more about how you're feeling?",
            "drift_score": 0.0,
            "drift_state": "no_history",
            "actions": ["phq9_prompt"],
            "error": error,
        }
