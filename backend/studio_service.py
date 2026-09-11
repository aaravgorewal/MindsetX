"""
Studio Service Module
Retrieves personalized wellness content from Qdrant using semantic search.
Powers the Wellness Studio Feed with context-aware recommendations.
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import numpy as np

from vector_store import get_qdrant_client, search_vectors, upsert_vector, COLLECTION_STUDENT_WELLNESS
from embedding_service import embed_text

# Configure logging
logger = logging.getLogger(__name__)

# Configuration
WELLNESS_COLLECTION = COLLECTION_STUDENT_WELLNESS
DEFAULT_LIMIT = 10
DEFAULT_WELLNESS_THRESHOLD = 0.4
WELLNESS_CATEGORIES = [
    "mindfulness",
    "stress_management",
    "sleep_hygiene",
    "exercise",
    "nutrition",
    "social_connection",
    "coping_strategies",
    "self_compassion",
    "gratitude",
    "motivation"
]

# Wellness content templates (seed data for demonstrations)
WELLNESS_CONTENT_LIBRARY = {
    "mindfulness": [
        {"title": "5-Minute Breathing Exercise", "description": "Calm your mind with guided deep breathing", "difficulty": "beginner"},
        {"title": "Body Scan Meditation", "description": "Progressive muscle relaxation technique", "difficulty": "beginner"},
        {"title": "Mindful Walking Practice", "description": "Bring awareness to everyday movement", "difficulty": "intermediate"},
        {"title": "Advanced Visualization", "description": "Create mental imagery for peace", "difficulty": "advanced"},
    ],
    "stress_management": [
        {"title": "Stress Relief Toolkit", "description": "Quick techniques for acute stress", "difficulty": "beginner"},
        {"title": "Time Management for Students", "description": "Organize tasks and reduce overwhelm", "difficulty": "intermediate"},
        {"title": "Progressive Muscle Relaxation", "description": "Systematic tension release method", "difficulty": "beginner"},
        {"title": "Cognitive Reframing Workshop", "description": "Challenge anxious thoughts effectively", "difficulty": "advanced"},
    ],
    "sleep_hygiene": [
        {"title": "Sleep Hygiene 101", "description": "Fundamentals for better sleep", "difficulty": "beginner"},
        {"title": "Bedtime Ritual Builder", "description": "Create a consistent sleep routine", "difficulty": "beginner"},
        {"title": "Dealing with Insomnia", "description": "Evidence-based techniques for sleep issues", "difficulty": "intermediate"},
        {"title": "Sleep Environment Optimization", "description": "Design your ideal sleep space", "difficulty": "intermediate"},
    ],
    "exercise": [
        {"title": "Beginner Yoga Flows", "description": "Gentle yoga for stress relief", "difficulty": "beginner"},
        {"title": "10-Minute Workouts", "description": "Quick energy-boosting exercises", "difficulty": "beginner"},
        {"title": "Walking for Wellness", "description": "Transform your daily walk into therapy", "difficulty": "beginner"},
        {"title": "Dance Therapy Sessions", "description": "Express emotions through movement", "difficulty": "intermediate"},
    ],
    "nutrition": [
        {"title": "Brain-Boosting Foods", "description": "Nutrition for mental health", "difficulty": "beginner"},
        {"title": "Mindful Eating Guide", "description": "Develop healthy eating habits", "difficulty": "beginner"},
        {"title": "Quick Healthy Recipes", "description": "Nutritious meals for busy students", "difficulty": "intermediate"},
        {"title": "Hydration and Mental Health", "description": "How water impacts mood and cognition", "difficulty": "beginner"},
    ],
    "social_connection": [
        {"title": "Building Meaningful Relationships", "description": "Strengthen your social bonds", "difficulty": "intermediate"},
        {"title": "Communication Skills Workshop", "description": "Express yourself more effectively", "difficulty": "intermediate"},
        {"title": "Loneliness to Connection", "description": "Practical steps to reduce isolation", "difficulty": "beginner"},
        {"title": "Group Activity Ideas", "description": "Fun ways to connect with others", "difficulty": "beginner"},
    ],
    "coping_strategies": [
        {"title": "Crisis Coping Toolkit", "description": "Immediate strategies for difficult moments", "difficulty": "beginner"},
        {"title": "Distress Tolerance Techniques", "description": "Skills to survive intense emotions", "difficulty": "intermediate"},
        {"title": "Emotion Regulation Workshop", "description": "Manage your emotional responses", "difficulty": "intermediate"},
        {"title": "Unhelpful Thoughts Challenge", "description": "Cognitive techniques for anxiety", "difficulty": "advanced"},
    ],
    "self_compassion": [
        {"title": "Self-Compassion Meditation", "description": "Be kind to yourself in difficult times", "difficulty": "beginner"},
        {"title": "Overcoming Self-Criticism", "description": "Transform your inner critic", "difficulty": "intermediate"},
        {"title": "Self-Care Routine Builder", "description": "Create sustainable self-care habits", "difficulty": "intermediate"},
        {"title": "Inner Strength Development", "description": "Build resilience and confidence", "difficulty": "advanced"},
    ],
    "gratitude": [
        {"title": "Gratitude Practice Guide", "description": "Shift perspective with gratitude", "difficulty": "beginner"},
        {"title": "Journaling for Appreciation", "description": "Write your way to positivity", "difficulty": "beginner"},
        {"title": "Gratitude Rituals", "description": "Daily practices for thankfulness", "difficulty": "intermediate"},
        {"title": "Appreciation in Hard Times", "description": "Find meaning when struggling", "difficulty": "advanced"},
    ],
    "motivation": [
        {"title": "Goal Setting Essentials", "description": "Create meaningful personal goals", "difficulty": "intermediate"},
        {"title": "Overcoming Procrastination", "description": "Action steps to get started", "difficulty": "beginner"},
        {"title": "Building Momentum", "description": "Sustain motivation over time", "difficulty": "intermediate"},
        {"title": "Finding Your Purpose", "description": "Discover what drives you", "difficulty": "advanced"},
    ]
}


class StudioService:
    """Service for retrieving personalized wellness content from Qdrant"""

    @staticmethod
    def _get_content_text(content: Dict[str, Any]) -> str:
        """Extract text from content for embedding"""
        title = content.get("title", "")
        description = content.get("description", "")
        category = content.get("category", "")
        return f"{title}. {description}. Category: {category}"

    @staticmethod
    def seed_wellness_content() -> int:
        """
        Seed the wellness collection with initial content library.
        Returns count of items added.
        """
        client = get_qdrant_client()
        count = 0
        
        try:
            # Get existing points
            collection_info = client.get_collection(WELLNESS_COLLECTION)
            existing_count = collection_info.points_count
            
            if existing_count > 0:
                logger.info(f"Wellness collection already has {existing_count} items, skipping seed")
                return existing_count
            
            # Add content from library
            for category, items in WELLNESS_CONTENT_LIBRARY.items():
                for idx, content in enumerate(items):
                    try:
                        # Create content record with category
                        content_with_category = {**content, "category": category}
                        content_text = StudioService._get_content_text(content_with_category)
                        
                        # Embed content
                        embedding = embed_text(content_text)
                        
                        # Create metadata payload
                        metadata = {
                            "title": content.get("title"),
                            "description": content.get("description"),
                            "category": category,
                            "difficulty": content.get("difficulty", "intermediate"),
                            "created_at": datetime.utcnow().isoformat(),
                        }
                        
                        # Upsert to Qdrant
                        upsert_vector(
                            collection_name=WELLNESS_COLLECTION,
                            vector=embedding,
                            payload=metadata
                        )
                        
                        count += 1
                        logger.debug(f"Added wellness content: {category} - {content.get('title')}")
                        
                    except Exception as e:
                        logger.error(f"Error seeding content {category}/{idx}: {e}")
                        continue
            
            logger.info(f"✓ Successfully seeded {count} wellness content items")
            return count
            
        except Exception as e:
            logger.error(f"Error seeding wellness content: {e}")
            raise

    @staticmethod
    def get_personalized_feed(
        student_id: Optional[str] = None,
        mood: Optional[str] = None,
        query: Optional[str] = None,
        limit: int = DEFAULT_LIMIT,
        score_threshold: float = DEFAULT_WELLNESS_THRESHOLD,
        categories: Optional[List[str]] = None,
        difficulty: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Get personalized wellness content feed.
        
        Args:
            student_id: Student identifier (for future personalization)
            mood: Current mood (happy, anxious, sad, overwhelmed, etc.)
            query: Custom search query (overrides mood-based search)
            limit: Maximum results (1-20)
            score_threshold: Minimum similarity threshold (0-1)
            categories: Filter by specific wellness categories
            difficulty: Filter by difficulty level (beginner|intermediate|advanced)
        
        Returns:
            Dict with personalized content recommendations
        """
        
        try:
            # Validate inputs
            limit = max(1, min(limit, 20))
            score_threshold = max(0.0, min(score_threshold, 1.0))
            
            # Determine search query
            if query:
                search_text = query
            elif mood:
                search_text = StudioService._get_mood_recommendation(mood)
            else:
                search_text = "wellness and mental health improvement"
            
            # Embed search query
            query_embedding = embed_text(search_text)
            
            # Search Qdrant
            results = search_vectors(
                collection_name=WELLNESS_COLLECTION,
                query_vector=query_embedding,
                limit=limit * 2,  # Get more to filter
                score_threshold=score_threshold
            )
            
            # Post-process results
            processed_results = []
            for result in results:
                payload = result.get("payload", {}) if isinstance(result, dict) else getattr(result, "payload", {})
                vec_id = result.get("id") if isinstance(result, dict) else getattr(result, "id", None)
                score = result.get("score", 0.0) if isinstance(result, dict) else getattr(result, "score", 0.0)
                
                # Apply category filter
                if categories and payload.get("category") not in categories:
                    continue
                
                # Apply difficulty filter
                if difficulty and payload.get("difficulty") != difficulty:
                    continue
                
                processed_results.append({
                    "vector_id": vec_id,
                    "title": payload.get("title"),
                    "description": payload.get("description"),
                    "category": payload.get("category"),
                    "difficulty": payload.get("difficulty"),
                    "relevance_score": score,
                    "created_at": payload.get("created_at"),
                })
                
                if len(processed_results) >= limit:
                    break
            
            return {
                "status": "success",
                "student_id": student_id,
                "mood": mood,
                "query_used": search_text,
                "total_found": len(processed_results),
                "filter_applied": {
                    "categories": categories,
                    "difficulty": difficulty,
                    "threshold": score_threshold
                },
                "content": processed_results,
                "timestamp": datetime.utcnow().isoformat(),
            }
            
        except Exception as e:
            logger.error(f"Error getting personalized feed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }

    @staticmethod
    def _get_mood_recommendation(mood: str) -> str:
        """
        Map mood to personalized recommendation query.
        """
        mood_map = {
            "anxious": "anxiety relief calm relaxation stress management",
            "depressed": "motivation self-compassion gratitude hope",
            "stressed": "stress management coping crisis toolkit",
            "overwhelmed": "time management organization prioritization",
            "lonely": "social connection building relationships",
            "tired": "sleep hygiene rest recovery energy",
            "angry": "emotion regulation coping breathing",
            "happy": "gratitude mindfulness appreciation",
            "unmotivated": "motivation goal setting accountability",
            "lost": "purpose meaning goal setting direction",
        }
        
        normalized_mood = mood.lower().strip()
        return mood_map.get(normalized_mood, "wellness mental health improvement")

    @staticmethod
    def get_trending_wellness_content(
        limit: int = DEFAULT_LIMIT,
        days: int = 7,
    ) -> Dict[str, Any]:
        """
        Get trending wellness content (most recently created/popular).
        
        Args:
            limit: Maximum results
            days: Look back N days
        
        Returns:
            Dict with trending content
        """
        
        try:
            client = get_qdrant_client()
            cutoff_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
            
            # Simple approach: get random recent samples
            # In production, would track view counts and ratings
            collection_info = client.get_collection(WELLNESS_COLLECTION)
            
            if collection_info.points_count == 0:
                return {
                    "status": "success",
                    "total_found": 0,
                    "content": [],
                    "timestamp": datetime.utcnow().isoformat(),
                }
            
            # Scroll through collection to find recent items
            results = client.scroll(
                collection_name=WELLNESS_COLLECTION,
                limit=min(limit, 100),
            )
            
            content = []
            for point in results[0]:  # results is tuple (points, next_page_offset)
                payload = point.payload
                created_at = payload.get("created_at", "")
                
                # Filter by date if needed
                if created_at >= cutoff_date:
                    content.append({
                        "vector_id": point.id,
                        "title": payload.get("title"),
                        "description": payload.get("description"),
                        "category": payload.get("category"),
                        "difficulty": payload.get("difficulty"),
                        "created_at": created_at,
                    })
            
            # Sort by creation date (newest first)
            content.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            content = content[:limit]
            
            return {
                "status": "success",
                "total_found": len(content),
                "content": content,
                "trend_window_days": days,
                "timestamp": datetime.utcnow().isoformat(),
            }
            
        except Exception as e:
            logger.error(f"Error getting trending content: {e}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }

    @staticmethod
    def get_category_content(
        category: str,
        limit: int = DEFAULT_LIMIT,
        difficulty: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Get all content for a specific wellness category.
        
        Args:
            category: Category name
            limit: Maximum results
            difficulty: Filter by difficulty
        
        Returns:
            Dict with category content
        """
        
        try:
            if category not in WELLNESS_CATEGORIES:
                return {
                    "status": "error",
                    "error": f"Invalid category: {category}",
                    "valid_categories": WELLNESS_CATEGORIES,
                    "timestamp": datetime.utcnow().isoformat(),
                }
            
            # Search for category
            query_text = f"category: {category}"
            query_embedding = embed_text(query_text)
            
            results = search_vectors(
                collection_name=WELLNESS_COLLECTION,
                query_vector=query_embedding,
                limit=limit * 2,
                score_threshold=0.0  # Get all matches
            )
            
            content = []
            for result in results:
                payload = result.get("payload", {}) if isinstance(result, dict) else getattr(result, "payload", {})
                vec_id = result.get("id") if isinstance(result, dict) else getattr(result, "id", None)
                score = result.get("score", 0.0) if isinstance(result, dict) else getattr(result, "score", 0.0)
                
                # Filter by category
                if payload.get("category") != category:
                    continue
                
                # Filter by difficulty if specified
                if difficulty and payload.get("difficulty") != difficulty:
                    continue
                
                content.append({
                    "vector_id": vec_id,
                    "title": payload.get("title"),
                    "description": payload.get("description"),
                    "category": category,
                    "difficulty": payload.get("difficulty"),
                    "relevance_score": score,
                })
                
                if len(content) >= limit:
                    break
            
            return {
                "status": "success",
                "category": category,
                "total_found": len(content),
                "content": content,
                "timestamp": datetime.utcnow().isoformat(),
            }
            
        except Exception as e:
            logger.error(f"Error getting category content: {e}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }
