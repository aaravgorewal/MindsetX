"""
Auditor Agent
Validates data quality, compliance, and system integrity
"""

import logging
from typing import Dict, Any, List, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)


class Auditor:
    """
    Agent responsible for:
    - Validating response quality
    - Checking data compliance (FERPA, HIPAA)
    - Auditing system operations
    - Detecting anomalies and drift via cosine-similarity
    - Maintaining audit logs
    """
    
    def __init__(self, qdrant_client):
        """
        Initialize Auditor agent
        
        Args:
            qdrant_client: QdrantClient instance
        """
        self.client = qdrant_client
        self.audit_collection = "audit_logs"
        self.compliance_thresholds = {
            "response_quality": 0.7,
            "confidence_score": 0.6,
            "drift_threshold": 0.3
        }

    # ── Synchronous drift helpers (used by MASOrchestrator) ──────────────────

    def compute_drift(
        self,
        current_vec: List[float],
        baseline_vecs: List[List[float]],
    ) -> Tuple[float, str]:
        """
        Compute psychological drift using cosine similarity.

        Compares the embedding of the current message against a list of past
        message embeddings to detect how much the student's expressed state has
        shifted from their recent baseline.

        Args:
            current_vec:   Embedding of the current chat message.
            baseline_vecs: List of embeddings from recent past messages.

        Returns:
            (drift_score, drift_state) where drift_state is one of:
              - "no_history"   – no baseline to compare against
              - "stable"       – avg similarity > 0.8  (minimal drift)
              - "early_warning"– avg similarity 0.4–0.8
              - "high_risk"    – avg similarity < 0.4  (significant drift)
        """
        if not baseline_vecs:
            return 0.0, "no_history"

        try:
            from sklearn.metrics.pairwise import cosine_similarity
            import numpy as np

            sims = cosine_similarity([current_vec], baseline_vecs)[0]
            avg_sim = float(np.mean(sims))
        except Exception as e:
            logger.warning(f"sklearn unavailable, using fallback cosine: {e}")
            avg_sim = self._manual_cosine_similarity(current_vec, baseline_vecs)

        if avg_sim > 0.8:
            state = "stable"
        elif avg_sim > 0.4:
            state = "early_warning"
        else:
            state = "high_risk"

        logger.info(f"📊 Drift computed: score={avg_sim:.4f} → {state}")
        return avg_sim, state

    def _manual_cosine_similarity(
        self,
        vec1: List[float],
        vectors: List[List[float]],
    ) -> float:
        """Fallback cosine similarity without numpy/sklearn."""
        def _dot(v1, v2):
            return sum(a * b for a, b in zip(v1, v2))

        def _mag(v):
            return sum(x * x for x in v) ** 0.5

        sims = []
        for v2 in vectors:
            d = _dot(vec1, v2)
            m1, m2 = _mag(vec1), _mag(v2)
            if m1 > 0 and m2 > 0:
                sims.append(d / (m1 * m2))
        return sum(sims) / len(sims) if sims else 0.0

    # ── Async compliance / audit methods ─────────────────────────────────────

    async def validate_response(
        self,
        response: str,
        metadata: Dict[str, Any],
        agent_name: str
    ) -> Tuple[bool, float, List[str]]:
        """
        Validate response quality and compliance
        
        Args:
            response: Response content
            metadata: Response metadata
            agent_name: Name of agent generating response
            
        Returns:
            Tuple of (is_valid, confidence_score, issues)
        """
        try:
            issues = []
            confidence_score = 1.0
            
            # Check response length
            if len(response) < 10:
                issues.append("Response too short")
                confidence_score -= 0.2
            
            # Check for harmful content
            harmful_keywords = ["illegal", "dangerous", "harmful"]
            if any(keyword in response.lower() for keyword in harmful_keywords):
                issues.append("Potentially harmful content detected")
                confidence_score -= 0.3
            
            # Check confidence score if provided
            if "confidence" in metadata:
                if metadata["confidence"] < self.compliance_thresholds["confidence_score"]:
                    issues.append(f"Low confidence score: {metadata['confidence']}")
                    confidence_score *= metadata["confidence"]
            
            # Check for PII (basic check)
            pii_patterns = ["ssn", "phone", "credit card"]
            if any(pattern in response.lower() for pattern in pii_patterns):
                issues.append("Potential PII detected")
                confidence_score -= 0.4
            
            is_valid = confidence_score >= self.compliance_thresholds["response_quality"] and len(issues) == 0
            
            # Log audit
            await self.log_audit({
                "event": "response_validation",
                "agent": agent_name,
                "valid": is_valid,
                "confidence": confidence_score,
                "issues": issues,
                "timestamp": datetime.now().isoformat()
            })
            
            logger.info(f"✅ Response validated by {agent_name}: Valid={is_valid}, Confidence={confidence_score:.2f}")
            return is_valid, confidence_score, issues
            
        except Exception as e:
            logger.error(f"❌ Error validating response: {e}")
            return False, 0.0, [str(e)]
    
    async def check_data_compliance(
        self,
        data: Dict[str, Any],
        data_type: str
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Check if data complies with privacy regulations
        
        Args:
            data: Data to check
            data_type: Type of data (PHI, PII, educational)
            
        Returns:
            Tuple of (is_compliant, compliance_report)
        """
        try:
            report = {
                "data_type": data_type,
                "is_compliant": True,
                "findings": [],
                "timestamp": datetime.now().isoformat()
            }
            
            # FERPA check (Student Educational Records)
            if data_type == "educational":
                required_fields = ["student_id", "consent"]
                missing = [f for f in required_fields if f not in data]
                if missing:
                    report["findings"].append(f"Missing required fields: {missing}")
                    report["is_compliant"] = False
            
            # HIPAA check (Health Information)
            elif data_type == "health":
                if "phi_protected" not in data or not data["phi_protected"]:
                    report["findings"].append("PHI not marked as protected")
                    report["is_compliant"] = False
            
            # Log compliance check
            await self.log_audit({
                "event": "compliance_check",
                "data_type": data_type,
                "compliant": report["is_compliant"],
                "findings": report["findings"],
                "timestamp": datetime.now().isoformat()
            })
            
            logger.info(f"📋 Compliance check for {data_type}: {report['is_compliant']}")
            return report["is_compliant"], report
            
        except Exception as e:
            logger.error(f"❌ Error checking compliance: {e}")
            return False, {"error": str(e)}
    
    async def detect_drift(
        self,
        current_metrics: Dict[str, float],
        baseline_metrics: Dict[str, float]
    ) -> Tuple[bool, float, List[str]]:
        """
        Detect performance drift or anomalies
        
        Args:
            current_metrics: Current performance metrics
            baseline_metrics: Baseline metrics for comparison
            
        Returns:
            Tuple of (drift_detected, drift_score, affected_metrics)
        """
        try:
            affected_metrics = []
            total_drift = 0.0
            metric_count = 0
            
            for metric_name, current_value in current_metrics.items():
                if metric_name in baseline_metrics:
                    baseline_value = baseline_metrics[metric_name]
                    if baseline_value != 0:
                        drift = abs(current_value - baseline_value) / abs(baseline_value)
                        total_drift += drift
                        metric_count += 1
                        
                        if drift > self.compliance_thresholds["drift_threshold"]:
                            affected_metrics.append(f"{metric_name}: {drift:.2%}")
            
            avg_drift = total_drift / metric_count if metric_count > 0 else 0.0
            drift_detected = avg_drift > self.compliance_thresholds["drift_threshold"]
            
            if drift_detected:
                logger.warning(f"⚠️ Drift detected: {avg_drift:.2%}")
                await self.log_audit({
                    "event": "drift_detection",
                    "drift_score": avg_drift,
                    "affected_metrics": affected_metrics,
                    "timestamp": datetime.now().isoformat()
                })
            
            return drift_detected, avg_drift, affected_metrics
            
        except Exception as e:
            logger.error(f"❌ Error detecting drift: {e}")
            return False, 0.0, [str(e)]
    
    async def log_audit(self, event: Dict[str, Any]) -> bool:
        """
        Log audit event
        
        Args:
            event: Event to log
            
        Returns:
            bool: Success status
        """
        try:
            point_id = hash(str(event)) % (10**8)
            
            self.client.upsert(
                collection_name=self.audit_collection,
                points=[{
                    "id": point_id,
                    "vector": [0.0] * 384,  # Placeholder vector
                    "payload": event
                }]
            )
            
            logger.info(f"📝 Audit logged: {event.get('event', 'unknown')}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error logging audit: {e}")
            return False
    
    async def get_audit_trail(
        self,
        filter_criteria: Dict[str, Any],
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Retrieve audit trail
        
        Args:
            filter_criteria: Criteria for filtering
            limit: Number of results
            
        Returns:
            List of audit events
        """
        try:
            points, _ = self.client.scroll(
                collection_name=self.audit_collection,
                limit=limit
            )
            
            trail = [point.payload for point in points]
            logger.info(f"📋 Retrieved {len(trail)} audit events")
            return trail
            
        except Exception as e:
            logger.error(f"❌ Error retrieving audit trail: {e}")
            return []
