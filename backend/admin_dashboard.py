"""
Admin Dashboard Service
Provides aggregated analytics and heatmap data for admin visualization.
All data is anonymized to protect student privacy.
"""

import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from collections import defaultdict
import statistics

from qdrant_client import models
from qdrant_client.models import Filter, FieldCondition, MatchValue, HasIdCondition
from vector_store import (
    get_qdrant_client,
    COLLECTION_STUDENT_WELLNESS,
    COLLECTION_PHQ9_VECTORS,
    COLLECTION_CHAT_MEMORY
)

# Configure logging
logger = logging.getLogger(__name__)

# Heatmap Configuration
HEATMAP_GRID_SIZE = 10  # 10x10 grid for stress distribution
HEATMAP_DEFAULTS = {
    "resolution": HEATMAP_GRID_SIZE,
    "scale": 100,  # Score scale 0-100
    "anonymization": "full"  # All student_ids replaced with hash
}


class AdminDashboardService:
    """
    Service for aggregating anonymized data for admin dashboards.
    Handles heatmap generation, stress distribution analysis, and trend reporting.
    """

    @staticmethod
    def anonymize_id(original_id: str) -> str:
        """
        Create anonymous identifier from original student_id.
        Ensures consistent mapping but reveals no student information.
        """
        import hashlib
        hash_obj = hashlib.sha256(original_id.encode())
        # Return first 8 chars of hash with prefix
        return f"STU_{hash_obj.hexdigest()[:8].upper()}"

    @staticmethod
    def get_stress_vectors(
        collection_name: str = COLLECTION_STUDENT_WELLNESS,
        limit: int = 1000,
        hours_back: int = 24
    ) -> List[Dict[str, Any]]:
        """
        Retrieve stress vectors from Qdrant within time window.
        Returns: List of vectors with metadata (anonymized)
        """
        try:
            client = get_qdrant_client()
            
            # Calculate cutoff time
            cutoff_time = (datetime.now() - timedelta(hours=hours_back)).isoformat()
            
            # Query points within time window
            points, _ = client.scroll(
                collection_name=collection_name,
                scroll_filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="timestamp",
                            range=models.Range(gte=cutoff_time)
                        )
                    ]
                ),
                limit=limit,
                with_vectors=True,
                with_payload=True
            )
            
            # Extract and anonymize vectors
            stress_vectors = []
            for point in points:
                if point.payload and point.vector:
                    # Extract stress-related metadata
                    payload = point.payload
                    stress_vectors.append({
                        "vector": point.vector,
                        "point_id": point.id,
                        "distress_index": payload.get("di", 0),
                        "phq_score": payload.get("phq_score", None),
                        "sentiment": payload.get("sentiment", 0),
                        "timestamp": payload.get("timestamp", datetime.now().isoformat()),
                        "student_id_anon": AdminDashboardService.anonymize_id(
                            payload.get("sid", "unknown")
                        )
                    })
            
            logger.info(f"Retrieved {len(stress_vectors)} stress vectors from {collection_name}")
            return stress_vectors
            
        except Exception as e:
            logger.error(f"Error retrieving stress vectors: {e}")
            return []

    @staticmethod
    def generate_heatmap(
        stress_vectors: List[Dict[str, Any]],
        resolution: int = HEATMAP_GRID_SIZE
    ) -> Dict[str, Any]:
        """
        Generate stress heatmap from vector data.
        Projects high-dimensional vectors to 2D grid for visualization.
        
        Returns heatmap with:
        - grid: 2D array of stress intensity values (0-100)
        - stats: Statistical summary
        - distribution: Stress level distribution
        - hot_zones: Identified high-stress clusters
        """
        try:
            if not stress_vectors:
                return AdminDashboardService._empty_heatmap(resolution)
            
            # Extract distress indices
            di_scores = [
                min(100, max(0, sv.get("distress_index", 0) * 100))
                for sv in stress_vectors
            ]
            
            # Create 2D grid by binning stress scores
            grid = [[0 for _ in range(resolution)] for _ in range(resolution)]
            
            # Map vectors to grid positions
            # Use a clustering approach: group by stress level and frequency
            for i, di_score in enumerate(di_scores):
                # Row based on stress level (0-100)
                row = int((di_score / 100.0) * (resolution - 1))
                
                # Column based on temporal distribution
                col = int((i / max(len(di_scores), 1)) * (resolution - 1))
                
                # Increment cell value (normalized)
                grid[row][col] += 1
            
            # Normalize grid values to 0-100 scale
            max_count = max(max(row) for row in grid) if any(any(row) for row in grid) else 1
            normalized_grid = [
                [min(100, int((cell / max_count * 100))) for cell in row]
                for row in grid
            ]
            
            # Calculate statistics
            stats = {
                "total_records": len(stress_vectors),
                "mean_stress": round(statistics.mean(di_scores), 2),
                "median_stress": round(statistics.median(di_scores), 2),
                "stdev_stress": round(statistics.stdev(di_scores), 2) if len(di_scores) > 1 else 0,
                "min_stress": round(min(di_scores), 2),
                "max_stress": round(max(di_scores), 2)
            }
            
            # Stress level distribution
            distribution = {
                "minimal": len([s for s in di_scores if s < 25]),
                "mild": len([s for s in di_scores if 25 <= s < 50]),
                "moderate": len([s for s in di_scores if 50 <= s < 75]),
                "severe": len([s for s in di_scores if s >= 75])
            }
            
            # Identify hot zones (high-stress clusters)
            hot_zones = []
            for row_idx, row in enumerate(normalized_grid):
                for col_idx, value in enumerate(row):
                    if value > 75:  # Threshold for "hot" zone
                        hot_zones.append({
                            "row": row_idx,
                            "col": col_idx,
                            "intensity": value
                        })
            
            return {
                "status": "success",
                "heatmap": {
                    "grid": normalized_grid,
                    "resolution": resolution,
                    "scale": 100,
                    "unit": "normalized_stress_intensity"
                },
                "statistics": stats,
                "distribution": distribution,
                "hot_zones": hot_zones,
                "timestamp": datetime.now().isoformat(),
                "data_window_hours": 24
            }
            
        except Exception as e:
            logger.error(f"Error generating heatmap: {e}")
            return AdminDashboardService._empty_heatmap(resolution)

    @staticmethod
    def _empty_heatmap(resolution: int = HEATMAP_GRID_SIZE) -> Dict[str, Any]:
        """Return empty heatmap structure"""
        empty_grid = [[0 for _ in range(resolution)] for _ in range(resolution)]
        return {
            "status": "success",
            "heatmap": {
                "grid": empty_grid,
                "resolution": resolution,
                "scale": 100,
                "unit": "normalized_stress_intensity"
            },
            "statistics": {
                "total_records": 0,
                "mean_stress": 0,
                "median_stress": 0,
                "stdev_stress": 0,
                "min_stress": 0,
                "max_stress": 0
            },
            "distribution": {
                "minimal": 0,
                "mild": 0,
                "moderate": 0,
                "severe": 0
            },
            "hot_zones": [],
            "timestamp": datetime.now().isoformat(),
            "data_window_hours": 24
        }

    @staticmethod
    def get_stress_trends(
        time_windows: Optional[List[int]] = None,  # hours
        resolution: int = HEATMAP_GRID_SIZE
    ) -> Dict[str, Any]:
        """
        Analyze stress trends over multiple time windows.
        Returns heatmap snapshots for different periods.
        """
        if time_windows is None:
            time_windows = [1, 6, 24]  # Last 1 hour, 6 hours, 24 hours
        
        try:
            trends = {
                "status": "success",
                "trends": [],
                "timestamp": datetime.now().isoformat(),
                "time_windows": time_windows
            }
            
            for hours in time_windows:
                vectors = AdminDashboardService.get_stress_vectors(
                    hours_back=hours
                )
                heatmap = AdminDashboardService.generate_heatmap(vectors, resolution)
                
                trends["trends"].append({
                    "window_hours": hours,
                    "heatmap": heatmap["heatmap"],
                    "statistics": heatmap["statistics"],
                    "distribution": heatmap["distribution"]
                })
            
            return trends
            
        except Exception as e:
            logger.error(f"Error analyzing stress trends: {e}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    @staticmethod
    def get_phq9_distribution(hours_back: int = 24) -> Dict[str, Any]:
        """
        Get PHQ-9 score distribution across population.
        Returns aggregated severity levels (anonymized).
        """
        try:
            client = get_qdrant_client()
            cutoff_time = (datetime.now() - timedelta(hours=hours_back)).isoformat()
            
            # Query PHQ9 vectors
            points, _ = client.scroll(
                collection_name=COLLECTION_PHQ9_VECTORS,
                scroll_filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="timestamp",
                            range=models.Range(gte=cutoff_time)
                        )
                    ]
                ),
                limit=1000,
                with_payload=True
            )
            
            scores = []
            for point in points:
                if point.payload:
                    score = point.payload.get("total_score", 0)
                    scores.append(score)
            
            # Categorize by severity
            severity_dist = {
                "minimal": len([s for s in scores if s < 5]),
                "mild": len([s for s in scores if 5 <= s < 10]),
                "moderate": len([s for s in scores if 10 <= s < 15]),
                "moderately_severe": len([s for s in scores if 15 <= s < 20]),
                "severe": len([s for s in scores if s >= 20])
            }
            
            return {
                "status": "success",
                "phq9_distribution": severity_dist,
                "total_assessments": len(scores),
                "mean_score": round(statistics.mean(scores), 2) if scores else 0,
                "median_score": round(statistics.median(scores), 2) if scores else 0,
                "timestamp": datetime.now().isoformat(),
                "data_window_hours": hours_back
            }
            
        except Exception as e:
            logger.error(f"Error getting PHQ9 distribution: {e}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    @staticmethod
    def get_engagement_metrics(hours_back: int = 24) -> Dict[str, Any]:
        """
        Get user engagement metrics.
        Counts active sessions, chat interactions, assessments completed.
        """
        try:
            client = get_qdrant_client()
            cutoff_time = (datetime.now() - timedelta(hours=hours_back)).isoformat()
            
            # Count chat messages
            chat_count, _ = client.scroll(
                collection_name=COLLECTION_CHAT_MEMORY,
                scroll_filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="timestamp",
                            range=models.Range(gte=cutoff_time)
                        )
                    ]
                ),
                limit=1,
                with_payload=False
            )
            chat_interactions = len(chat_count) if chat_count else 0
            
            # Count wellness interactions (unique students from chat)
            points, _ = client.scroll(
                collection_name=COLLECTION_CHAT_MEMORY,
                scroll_filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="timestamp",
                            range=models.Range(gte=cutoff_time)
                        )
                    ]
                ),
                limit=1000,
                with_payload=True
            )
            
            unique_students = set()
            for point in points:
                if point.payload and "sid" in point.payload:
                    unique_students.add(point.payload["sid"])
            
            return {
                "status": "success",
                "engagement": {
                    "active_students": len(unique_students),
                    "chat_interactions": chat_interactions,
                    "avg_interactions_per_student": round(
                        chat_interactions / max(len(unique_students), 1), 2
                    )
                },
                "timestamp": datetime.now().isoformat(),
                "data_window_hours": hours_back
            }
            
        except Exception as e:
            logger.error(f"Error getting engagement metrics: {e}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
