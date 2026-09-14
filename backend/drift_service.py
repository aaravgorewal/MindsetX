"""
Drift Detection Service
Analyzes mental health trends by comparing current state with historical data
"""

import logging
from typing import List, Dict, Any, Optional
import numpy as np
from datetime import datetime, timedelta

from embedding_service import embed_text, similarity_score
from vector_store import search_vectors, get_qdrant_client, COLLECTION_CHAT_MEMORY, COLLECTION_PHQ9_VECTORS
from qdrant_client import models

logger = logging.getLogger(__name__)

# Drift thresholds
DRIFT_THRESHOLDS = {
    "stable": 0.85,      # Similarity > 85% = stable
    "drifting": 0.70,    # Similarity 70-85% = drifting
    "critical": 0.0      # Similarity < 70% = critical drift
}


def calculate_drift_score(current_vector: List[float], historical_vectors: List[List[float]]) -> Dict[str, Any]:
    """
    Calculate drift by comparing current vector with historical patterns.
    
    Args:
        current_vector: Latest embedding vector
        historical_vectors: List of past embedding vectors
    
    Returns:
        Drift analysis with scores and status
    """
    if not historical_vectors:
        return {
            "drift_score": 0.0,
            "drift_status": "insufficient_history",
            "description": "Not enough historical data for drift analysis"
        }
    
    try:
        # Calculate similarity to each historical vector
        similarities = []
        for hist_vec in historical_vectors:
            sim = similarity_score(current_vector, hist_vec)
            similarities.append(sim)
        
        # Calculate statistics
        avg_similarity = np.mean(similarities)
        min_similarity = np.min(similarities)
        max_similarity = np.max(similarities)
        std_deviation = np.std(similarities)
        
        # Determine drift status
        if avg_similarity > DRIFT_THRESHOLDS["stable"]:
            drift_status = "stable"
            interpretation = "Mental health pattern is consistent with history"
        elif avg_similarity > DRIFT_THRESHOLDS["drifting"]:
            drift_status = "drifting"
            interpretation = "Mental health pattern is shifting from historical baseline"
        else:
            drift_status = "critical_drift"
            interpretation = "Significant change detected in mental health pattern"
        
        return {
            "drift_score": float(avg_similarity),
            "drift_status": drift_status,
            "description": interpretation,
            "similarity_stats": {
                "average": float(avg_similarity),
                "minimum": float(min_similarity),
                "maximum": float(max_similarity),
                "std_deviation": float(std_deviation)
            },
            "samples_compared": len(similarities)
        }
    
    except Exception as e:
        logger.error(f"Drift calculation failed: {e}")
        return {
            "drift_score": 0.0,
            "drift_status": "error",
            "description": f"Drift calculation error: {str(e)}"
        }


def analyze_chat_drift(student_id: Optional[str] = None, limit_history: int = 10) -> Dict[str, Any]:
    """
    Analyze drift in chat messages by comparing recent chats with historical patterns.
    
    Args:
        student_id: Optional student identifier for personalized analysis
        limit_history: Number of past messages to compare against
    
    Returns:
        Chat drift analysis
    """
    try:
        client = get_qdrant_client()
        
        # Get recent chat messages
        if student_id:
            scroll_filter = models.Filter(
                must=[models.FieldCondition(key="session_id", match=models.MatchValue(value=student_id))]
            )
        else:
            scroll_filter = None
        
        recent_chats = client.scroll(
            collection_name=COLLECTION_CHAT_MEMORY,
            scroll_filter=scroll_filter,
            limit=limit_history + 1,
            with_vectors=True
        )
        
        if not recent_chats[0]:
            return {
                "chat_drift": {
                    "drift_score": 0.0,
                    "drift_status": "no_data",
                    "description": "No chat history found"
                }
            }
        
        points = recent_chats[0]
        
        # Latest chat is the first one
        if len(points) > 0:
            latest_point = points[0]
            current_vector = latest_point.vector
            
            # Historical vectors are the rest
            historical_vectors = [p.vector for p in points[1:]]
            
            drift_analysis = calculate_drift_score(current_vector, historical_vectors)
            
            return {
                "chat_drift": drift_analysis,
                "latest_message": latest_point.payload.get("content", ""),
                "message_count": len(points)
            }
        
        return {
            "chat_drift": {
                "drift_score": 0.0,
                "drift_status": "insufficient_data",
                "description": "Not enough chat data for analysis"
            }
        }
    
    except Exception as e:
        logger.error(f"Chat drift analysis failed: {e}")
        return {
            "chat_drift": {
                "drift_score": 0.0,
                "drift_status": "error",
                "description": f"Error analyzing chat drift: {str(e)}"
            }
        }


def analyze_phq9_drift(student_id: Optional[str] = None, limit_history: int = 10) -> Dict[str, Any]:
    """
    Analyze drift in PHQ-9 assessments by comparing recent scores with historical patterns.
    
    Args:
        student_id: Optional student identifier for personalized analysis
        limit_history: Number of past assessments to compare against
    
    Returns:
        PHQ-9 drift analysis
    """
    try:
        client = get_qdrant_client()
        
        # Get recent PHQ-9 assessments
        if student_id:
            scroll_filter = models.Filter(
                must=[models.FieldCondition(key="student_id", match=models.MatchValue(value=student_id))]
            )
        else:
            scroll_filter = None
        
        recent_assessments = client.scroll(
            collection_name=COLLECTION_PHQ9_VECTORS,
            scroll_filter=scroll_filter,
            limit=limit_history + 1,
            with_vectors=True
        )
        
        if not recent_assessments[0]:
            return {
                "phq9_drift": {
                    "drift_score": 0.0,
                    "drift_status": "no_data",
                    "description": "No PHQ-9 assessment history found"
                }
            }
        
        points = recent_assessments[0]
        
        if len(points) > 0:
            latest_point = points[0]
            current_vector = latest_point.vector
            latest_score = latest_point.payload.get("total_score", 0)
            latest_severity = latest_point.payload.get("severity", "Unknown")
            
            # Historical vectors and scores
            historical_vectors = [p.vector for p in points[1:]]
            historical_scores = [p.payload.get("total_score", 0) for p in points[1:]]
            
            drift_analysis = calculate_drift_score(current_vector, historical_vectors)
            
            # Add score trend analysis
            if historical_scores:
                score_change = latest_score - historical_scores[0]
                score_trend = "worsening" if score_change > 0 else "improving" if score_change < 0 else "stable"
            else:
                score_change = 0
                score_trend = "unknown"
            
            return {
                "phq9_drift": drift_analysis,
                "latest_assessment": {
                    "score": latest_score,
                    "severity": latest_severity,
                    "score_change": score_change,
                    "score_trend": score_trend
                },
                "assessment_count": len(points)
            }
        
        return {
            "phq9_drift": {
                "drift_score": 0.0,
                "drift_status": "insufficient_data",
                "description": "Not enough PHQ-9 data for analysis"
            }
        }
    
    except Exception as e:
        logger.error(f"PHQ-9 drift analysis failed: {e}")
        return {
            "phq9_drift": {
                "drift_score": 0.0,
                "drift_status": "error",
                "description": f"Error analyzing PHQ-9 drift: {str(e)}"
            }
        }


def analyze_overall_drift(student_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Comprehensive drift analysis combining chat and PHQ-9 data.
    
    Args:
        student_id: Optional student identifier for personalized analysis
    
    Returns:
        Combined drift analysis with overall score and recommendations
    """
    try:
        # Get individual drift analyses
        chat_analysis = analyze_chat_drift(student_id, limit_history=10)
        phq9_analysis = analyze_phq9_drift(student_id, limit_history=5)
        
        # Extract drift scores and statuses
        chat_drift_data = chat_analysis.get("chat_drift", {})
        phq9_drift_data = phq9_analysis.get("phq9_drift", {})
        
        chat_drift_score = chat_drift_data.get("drift_score", 0.0)
        phq9_drift_score = phq9_drift_data.get("drift_score", 0.0)
        chat_drift_status = chat_drift_data.get("drift_status", "no_data")
        phq9_drift_status = phq9_drift_data.get("drift_status", "no_data")
        
        # Statuses that indicate the sub-analysis has no meaningful data
        NO_DATA_STATUSES = {"no_data", "insufficient_history", "insufficient_data", "error"}
        
        chat_has_data = chat_drift_status not in NO_DATA_STATUSES
        phq9_has_data = phq9_drift_status not in NO_DATA_STATUSES
        
        # If neither source has real data, return no_data — NOT critical
        if not chat_has_data and not phq9_has_data:
            recommendations = ["Not enough historical data to assess drift. Continue logging sessions."]
            return {
                "timestamp": datetime.now().isoformat(),
                "overall_drift_score": 0.0,
                "overall_status": "no_data",
                "alert_level": "green",
                "chat_analysis": chat_analysis,
                "phq9_analysis": phq9_analysis,
                "recommendations": recommendations
            }
        
        # Calculate weighted overall score — only use sources that have real data
        if chat_has_data and phq9_has_data:
            # Both have data: PHQ-9 weighted 60%, Chat 40%
            overall_drift_score = (phq9_drift_score * 0.6) + (chat_drift_score * 0.4)
        elif phq9_has_data:
            overall_drift_score = phq9_drift_score
        else:
            overall_drift_score = chat_drift_score
        
        # Determine overall status from the computed score
        if overall_drift_score > DRIFT_THRESHOLDS["stable"]:
            overall_status = "stable"
            alert_level = "green"
        elif overall_drift_score > DRIFT_THRESHOLDS["drifting"]:
            overall_status = "drifting"
            alert_level = "yellow"
        else:
            overall_status = "critical_drift"
            alert_level = "red"
        
        # Generate recommendations
        recommendations = generate_recommendations(
            overall_status,
            chat_drift_data,
            phq9_drift_data,
            phq9_analysis.get("latest_assessment", {})
        )
        
        return {
            "timestamp": datetime.now().isoformat(),
            "overall_drift_score": float(overall_drift_score),
            "overall_status": overall_status,
            "alert_level": alert_level,
            "chat_analysis": chat_analysis,
            "phq9_analysis": phq9_analysis,
            "recommendations": recommendations
        }
    
    except Exception as e:
        logger.error(f"Overall drift analysis failed: {e}")
        return {
            "overall_drift_score": 0.0,
            "overall_status": "error",
            "alert_level": "unknown",
            "error": str(e)
        }


def generate_recommendations(
    overall_status: str,
    chat_drift: Dict[str, Any],
    phq9_drift: Dict[str, Any],
    latest_assessment: Dict[str, Any]
) -> List[str]:
    """
    Generate actionable recommendations based on drift analysis.
    
    Args:
        overall_status: Overall drift status
        chat_drift: Chat drift analysis
        phq9_drift: PHQ-9 drift analysis
        latest_assessment: Latest PHQ-9 assessment data
    
    Returns:
        List of recommendations
    """
    recommendations = []
    
    try:
        # Check severity from latest assessment
        severity = latest_assessment.get("severity", "Unknown")
        
        if overall_status == "stable":
            recommendations.append("✓ Your mental health pattern is stable. Continue with current wellness practices.")
        
        elif overall_status == "drifting":
            recommendations.append("⚠️ We notice some changes in your mental health pattern.")
            
            if severity == "Moderate":
                recommendations.append("Consider scheduling a check-in with a counselor.")
            
            if chat_drift.get("drift_status") == "drifting":
                recommendations.append("Your recent conversations show different emotional patterns - this is worth exploring.")
            
            recommendations.append("Try our wellness tools: meditation, journaling, or breathing exercises.")
        
        elif overall_status == "critical_drift":
            recommendations.append("🔴 URGENT: Significant changes detected in your mental health.")
            recommendations.append("Please reach out now — Tele-MANAS: 14416 or KIRAN: 1800-599-0019, both free and available 24/7.")
            
            trend = latest_assessment.get("score_trend", "unknown")
            if trend == "worsening":
                recommendations.append("Your recent PHQ-9 scores show worsening depression - immediate support is important.")
            
            recommendations.append("Consider visiting the Resource Hub for emergency contacts and support services.")
        
        return recommendations
    
    except Exception as e:
        logger.error(f"Recommendation generation failed: {e}")
        return [f"Error generating recommendations: {str(e)}"]


def compare_with_baseline(current_vector: List[float], collection_name: str, baseline_days: int = 30) -> Dict[str, Any]:
    """
    Compare current state with baseline from a specific time period.
    
    Args:
        current_vector: Latest embedding vector
        collection_name: Qdrant collection to analyze
        baseline_days: Number of days to look back for baseline
    
    Returns:
        Comparison with baseline
    """
    try:
        client = get_qdrant_client()
        
        # Get all points from the collection (with timestamp filtering ideally)
        # For simplicity, getting recent points
        points = client.scroll(
            collection_name=collection_name,
            limit=100,
            with_vectors=True
        )
        
        if not points[0]:
            return {
                "baseline_comparison": "insufficient_data",
                "similarity_to_baseline": 0.0
            }
        
        # Get vectors from the period
        vectors = [p.vector for p in points[0]]
        
        if vectors:
            # Calculate average of vectors as baseline
            baseline_vector = np.mean(vectors, axis=0).tolist()
            baseline_similarity = similarity_score(current_vector, baseline_vector)
            
            return {
                "baseline_comparison": "available",
                "similarity_to_baseline": float(baseline_similarity),
                "vectors_in_baseline": len(vectors)
            }
        
        return {
            "baseline_comparison": "no_data",
            "similarity_to_baseline": 0.0
        }
    
    except Exception as e:
        logger.error(f"Baseline comparison failed: {e}")
        return {
            "baseline_comparison": "error",
            "error": str(e)
        }
