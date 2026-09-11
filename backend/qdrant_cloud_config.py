import os

# Qdrant Cloud Configuration
# Store credentials safely and use environment variables in production

QDRANT_CLOUD_CONFIG = {
    "url": os.getenv(
        "QDRANT_URL",
        "https://314a50f1-6411-4aab-9147-2953bffd4c9c.australia-southeast1-0.gcp.cloud.qdrant.io:6333",
    ),
    "api_key": os.getenv("QDRANT_API_KEY", ""),
    "region": "australia-southeast1-0",
    "provider": "gcp",
    "prefer_grpc": False,
}

def get_qdrant_cloud_credentials():
    """Get Qdrant Cloud credentials from config"""
    return QDRANT_CLOUD_CONFIG

def get_qdrant_url():
    """Get Qdrant Cloud URL"""
    return os.getenv("QDRANT_URL", QDRANT_CLOUD_CONFIG["url"])

def get_qdrant_api_key():
    """Get Qdrant Cloud API Key"""
    return os.getenv("QDRANT_API_KEY", QDRANT_CLOUD_CONFIG["api_key"])
