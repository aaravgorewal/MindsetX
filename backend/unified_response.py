"""
Unified API Response Schema
Standardized response format for all MindSet X backend endpoints
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


# ============================================================================
# ENUMS FOR STANDARDIZED VALUES
# ============================================================================

class ResponseStatus(str, Enum):
    """Unified response status"""
    SUCCESS = "success"
    PARTIAL = "partial"
    ERROR = "error"
    PENDING = "pending"


class DriftState(str, Enum):
    """Mental health drift state classification"""
    STABLE = "stable"
    DRIFTING = "drifting"
    CRITICAL = "critical"
    NO_DATA = "no_data"


class AlertLevel(str, Enum):
    """Alert severity level"""
    GREEN = "green"      # All good
    YELLOW = "yellow"    # Caution needed
    RED = "red"          # Critical


class ActionType(str, Enum):
    """Type of action to recommend"""
    NONE = "none"
    MONITOR = "monitor"
    INTERVENE = "intervene"
    REFER = "refer"
    EMERGENCY = "emergency"


# ============================================================================
# UNIFIED RESPONSE WRAPPER
# ============================================================================

class UnifiedResponse(BaseModel):
    """
    Unified response schema for all API endpoints.
    All endpoints should wrap their response in this format.
    """
    
    # Core response fields
    status: ResponseStatus = Field(
        ...,
        description="Response status (success, partial, error, pending)"
    )
    
    data: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Primary response data/payload"
    )
    
    drift_state: Optional[DriftState] = Field(
        default=DriftState.NO_DATA,
        description="Mental health drift state (stable, drifting, critical)"
    )
    
    actions: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="List of recommended actions"
    )
    
    # Supporting fields
    message: Optional[str] = Field(
        default=None,
        description="Human-readable status message"
    )
    
    error: Optional[str] = Field(
        default=None,
        description="Error message if status is error"
    )
    
    timestamp: str = Field(
        ...,
        description="ISO 8601 timestamp of response"
    )
    
    request_id: Optional[str] = Field(
        default=None,
        description="Unique request ID for tracking"
    )
    
    # Metadata
    version: str = Field(
        default="1.0.0",
        description="API version"
    )
    
    class Config:
        use_enum_values = True
        example = {
            "status": "success",
            "data": {
                "message": "User's message here",
                "sentiment": -0.2,
                "reply": "AI response here"
            },
            "drift_state": "stable",
            "actions": [
                {
                    "type": "monitor",
                    "description": "Continue monitoring sentiment trends"
                }
            ],
            "message": "Chat processed successfully",
            "timestamp": "2026-01-25T10:30:00Z",
            "request_id": "req_123456",
            "version": "1.0.0"
        }


# ============================================================================
# ACTION MODELS
# ============================================================================

class Action(BaseModel):
    """Action recommendation model"""
    
    type: ActionType = Field(
        ...,
        description="Type of action (none, monitor, intervene, refer, emergency)"
    )
    
    priority: int = Field(
        default=0,
        ge=0,
        le=10,
        description="Priority level (0-10, where 10 is most urgent)"
    )
    
    description: str = Field(
        ...,
        description="Human-readable description of the action"
    )
    
    target: Optional[str] = Field(
        default=None,
        description="Target entity (e.g., 'counselor', 'crisis_line', 'student')"
    )
    
    details: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Additional action details"
    )


# ============================================================================
# ENDPOINT-SPECIFIC DATA MODELS
# ============================================================================

class ChatData(BaseModel):
    """Chat endpoint response data"""
    message: str = Field(..., description="User message")
    reply: str = Field(..., description="AI response")
    sentiment: float = Field(..., description="Sentiment score (-1 to 1)")
    message_id: Optional[str] = Field(None, description="Vector ID in storage")
    session_id: Optional[str] = Field(None, description="Session identifier")


class PHQ9Data(BaseModel):
    """PHQ-9 endpoint response data"""
    total_score: int = Field(..., ge=0, le=27, description="Total PHQ-9 score")
    severity: str = Field(..., description="Severity level (minimal/mild/moderate/moderately_severe/severe)")
    individual_scores: List[int] = Field(..., description="Individual question scores")
    vector_id: Optional[str] = Field(None, description="Vector ID in storage")
    recommendations: List[str] = Field(..., description="Personalized recommendations")


class DriftData(BaseModel):
    """Drift analysis endpoint response data"""
    overall_drift_score: float = Field(..., ge=0.0, le=1.0, description="Overall drift score (0-1)")
    chat_drift_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="Chat drift score")
    phq9_drift_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="PHQ-9 drift score")
    analysis_timestamp: str = Field(..., description="When analysis was performed")
    records_analyzed: int = Field(..., description="Number of records analyzed")


class MemorySearchData(BaseModel):
    """Memory search endpoint response data"""
    query: str = Field(..., description="Search query used")
    total_results: int = Field(..., description="Total number of results found")
    results: List[Dict[str, Any]] = Field(..., description="Search results")
    search_time_ms: float = Field(..., description="Search execution time in milliseconds")


class WellnessData(BaseModel):
    """Wellness/Studio endpoint response data"""
    content_items: List[Dict[str, Any]] = Field(..., description="Wellness content items")
    total_items: int = Field(..., description="Total number of items")
    recommendations_count: int = Field(..., description="Number of recommendations")


class AdminData(BaseModel):
    """Admin analytics endpoint response data"""
    metric_type: str = Field(..., description="Type of metric (heatmap, trends, distribution, engagement)")
    total_students: int = Field(..., description="Total students in data")
    data_points: int = Field(..., description="Total data points analyzed")
    aggregated_data: Dict[str, Any] = Field(..., description="Aggregated analytics data")


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def create_success_response(
    data: Dict[str, Any],
    drift_state: DriftState = DriftState.STABLE,
    actions: Optional[List[Action]] = None,
    message: str = "Request processed successfully",
    request_id: Optional[str] = None,
    timestamp: Optional[str] = None
) -> UnifiedResponse:
    """
    Create a success response.
    
    Args:
        data: Primary response data
        drift_state: Mental health drift state
        actions: List of recommended actions
        message: Status message
        request_id: Unique request ID
        timestamp: Response timestamp (auto-generated if not provided)
    
    Returns:
        UnifiedResponse with success status
    """
    from datetime import datetime, timezone
    import uuid as uuid_module
    
    if timestamp is None:
        timestamp = datetime.now(timezone.utc).isoformat()
    
    if request_id is None:
        request_id = f"req_{uuid_module.uuid4().hex[:12]}"
    
    return UnifiedResponse(
        status=ResponseStatus.SUCCESS,
        data=data,
        drift_state=drift_state,
        actions=[action.dict() if isinstance(action, Action) else action for action in (actions or [])],
        message=message,
        timestamp=timestamp,
        request_id=request_id
    )


def create_error_response(
    error: str,
    message: str = "Request failed",
    request_id: Optional[str] = None,
    timestamp: Optional[str] = None
) -> UnifiedResponse:
    """
    Create an error response.
    
    Args:
        error: Error message/details
        message: Status message
        request_id: Unique request ID
        timestamp: Response timestamp (auto-generated if not provided)
    
    Returns:
        UnifiedResponse with error status
    """
    from datetime import datetime, timezone
    import uuid as uuid_module
    
    if timestamp is None:
        timestamp = datetime.now(timezone.utc).isoformat()
    
    if request_id is None:
        request_id = f"req_{uuid_module.uuid4().hex[:12]}"
    
    return UnifiedResponse(
        status=ResponseStatus.ERROR,
        error=error,
        message=message,
        timestamp=timestamp,
        request_id=request_id
    )


def create_partial_response(
    data: Dict[str, Any],
    error: str,
    drift_state: DriftState = DriftState.NO_DATA,
    actions: Optional[List[Action]] = None,
    message: str = "Request partially completed",
    request_id: Optional[str] = None,
    timestamp: Optional[str] = None
) -> UnifiedResponse:
    """
    Create a partial response (some data returned, some error occurred).
    
    Args:
        data: Partial response data
        error: Error message
        drift_state: Mental health drift state
        actions: List of recommended actions
        message: Status message
        request_id: Unique request ID
        timestamp: Response timestamp (auto-generated if not provided)
    
    Returns:
        UnifiedResponse with partial status
    """
    from datetime import datetime, timezone
    import uuid as uuid_module
    
    if timestamp is None:
        timestamp = datetime.now(timezone.utc).isoformat()
    
    if request_id is None:
        request_id = f"req_{uuid_module.uuid4().hex[:12]}"
    
    return UnifiedResponse(
        status=ResponseStatus.PARTIAL,
        data=data,
        error=error,
        drift_state=drift_state,
        actions=[action.dict() if isinstance(action, Action) else action for action in (actions or [])],
        message=message,
        timestamp=timestamp,
        request_id=request_id
    )


# ============================================================================
# CONVENIENCE FUNCTIONS FOR CREATING ACTIONS
# ============================================================================

def create_monitor_action(
    description: str,
    details: Optional[Dict[str, Any]] = None
) -> Action:
    """Create a MONITOR action"""
    return Action(
        type=ActionType.MONITOR,
        priority=2,
        description=description,
        details=details
    )


def create_intervene_action(
    description: str,
    target: str = "counselor",
    priority: int = 7,
    details: Optional[Dict[str, Any]] = None
) -> Action:
    """Create an INTERVENE action"""
    return Action(
        type=ActionType.INTERVENE,
        priority=priority,
        description=description,
        target=target,
        details=details
    )


def create_refer_action(
    description: str,
    target: str = "professional",
    priority: int = 8,
    details: Optional[Dict[str, Any]] = None
) -> Action:
    """Create a REFER action"""
    return Action(
        type=ActionType.REFER,
        priority=priority,
        description=description,
        target=target,
        details=details
    )


def create_emergency_action(
    description: str,
    target: str = "emergency_services",
    details: Optional[Dict[str, Any]] = None
) -> Action:
    """Create an EMERGENCY action"""
    return Action(
        type=ActionType.EMERGENCY,
        priority=10,
        description=description,
        target=target,
        details=details
    )
