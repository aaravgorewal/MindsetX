# Qdrant Cloud Configuration
# Store credentials safely and use environment variables in production

QDRANT_CLOUD_CONFIG = {
    "url": "https://eae25781-9692-48dd-a657-10bc8c0874db.us-east4-0.gcp.cloud.qdrant.io:6333",
    "api_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.YaMCJ4-ePHYX7jCmxuEFrRqP0jMGoBN5HY_gV9JmkY0",
    "region": "us-east4-0",
    "provider": "gcp",
    "prefer_grpc": False
}

def get_qdrant_cloud_credentials():
    """Get Qdrant Cloud credentials from config"""
    return QDRANT_CLOUD_CONFIG

def get_qdrant_url():
    """Get Qdrant Cloud URL"""
    return QDRANT_CLOUD_CONFIG["url"]

def get_qdrant_api_key():
    """Get Qdrant Cloud API Key"""
    return QDRANT_CLOUD_CONFIG["api_key"]
