"""
Embedding Service Module
Uses SentenceTransformers for generating semantic embeddings
"""

import logging
from typing import List, Optional
from sentence_transformers import SentenceTransformer
import numpy as np

logger = logging.getLogger(__name__)

# Model configuration
MODEL_NAME = "all-MiniLM-L6-v2"  # Lightweight, fast, and efficient (384-dim embeddings)
# Alternative options:
# - "all-mpnet-base-v2" (768-dim, slower but more accurate)
# - "sentence-transformers/paraphrase-MiniLM-L6-v2" (384-dim, good for paraphrasing)

# Global embedding model instance
_model: Optional[SentenceTransformer] = None


def get_embedding_model() -> SentenceTransformer:
    """
    Get or load the SentenceTransformer model.
    Uses lazy loading to avoid loading until first use.
    """
    global _model
    
    if _model is not None:
        return _model
    
    try:
        logger.info(f"Loading embedding model: {MODEL_NAME}")
        _model = SentenceTransformer(MODEL_NAME)
        logger.info(f"✓ Embedding model loaded successfully")
        return _model
    except Exception as e:
        logger.error(f"Failed to load embedding model: {e}")
        raise


def embed_text(text: str) -> List[float]:
    """
    Embed a single text string into a vector.
    
    Args:
        text: Text to embed
    
    Returns:
        Vector embedding as list of floats
    """
    if not text or not isinstance(text, str):
        raise ValueError("Input must be a non-empty string")
    
    try:
        model = get_embedding_model()
        embedding = model.encode(text, convert_to_tensor=False)
        return embedding.tolist()
    except Exception as e:
        logger.error(f"Embedding failed: {e}")
        raise


def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    Embed multiple texts efficiently in batch mode.
    More efficient than calling embed_text multiple times.
    
    Args:
        texts: List of texts to embed
    
    Returns:
        List of vector embeddings
    """
    if not texts or not isinstance(texts, list):
        raise ValueError("Input must be a non-empty list of strings")
    
    try:
        model = get_embedding_model()
        embeddings = model.encode(texts, convert_to_tensor=False)
        return embeddings.tolist()
    except Exception as e:
        logger.error(f"Batch embedding failed: {e}")
        raise


def embed_message(role: str, content: str, session_id: Optional[str] = None) -> dict:
    """
    Embed a chat message with metadata.
    
    Args:
        role: Message role ('user' or 'model')
        content: Message content
        session_id: Optional session/conversation ID
    
    Returns:
        Dictionary with embedding and metadata
    """
    try:
        embedding = embed_text(content)
        return {
            "embedding": embedding,
            "role": role,
            "content": content,
            "session_id": session_id,
            "content_length": len(content),
            "word_count": len(content.split())
        }
    except Exception as e:
        logger.error(f"Message embedding failed: {e}")
        raise


def similarity_score(vec1: List[float], vec2: List[float]) -> float:
    """
    Calculate cosine similarity between two vectors.
    
    Args:
        vec1: First vector
        vec2: Second vector
    
    Returns:
        Similarity score (0 to 1, higher is more similar)
    """
    try:
        vec1 = np.array(vec1)
        vec2 = np.array(vec2)
        
        dot_product = np.dot(vec1, vec2)
        norm_vec1 = np.linalg.norm(vec1)
        norm_vec2 = np.linalg.norm(vec2)
        
        if norm_vec1 == 0 or norm_vec2 == 0:
            return 0.0
        
        similarity = dot_product / (norm_vec1 * norm_vec2)
        return float(similarity)
    except Exception as e:
        logger.error(f"Similarity calculation failed: {e}")
        raise


def get_model_info() -> dict:
    """
    Get information about the loaded embedding model.
    
    Returns:
        Model metadata
    """
    try:
        model = get_embedding_model()
        return {
            "model_name": MODEL_NAME,
            "embedding_dimension": model.get_sentence_embedding_dimension(),
            "max_seq_length": model.get_max_seq_length(),
            "tokenizer": model.tokenizer.__class__.__name__
        }
    except Exception as e:
        logger.error(f"Failed to get model info: {e}")
        raise
