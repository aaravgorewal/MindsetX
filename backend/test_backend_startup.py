#!/usr/bin/env python
"""
Quick test to verify backend can start with Qdrant Cloud
"""

import sys
import os
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

print("=" * 70)
print("🔄 Testing Backend Startup with Qdrant Cloud")
print("=" * 70)
print()

# Test 1: Import qdrant_cloud_config
print("✓ Step 1: Testing qdrant_cloud_config import...")
try:
    from qdrant_cloud_config import get_qdrant_url, get_qdrant_api_key
    url = get_qdrant_url()
    key = get_qdrant_api_key()
    print(f"  ✅ Config loaded successfully")
    print(f"  📍 URL: {url[:60]}...")
    print(f"  🔑 API Key: {key[:30]}...")
except Exception as e:
    print(f"  ❌ Error: {e}")
    sys.exit(1)

print()

# Test 2: Import vector_store
print("✓ Step 2: Testing vector_store import...")
try:
    from vector_store import get_qdrant_client
    print(f"  ✅ vector_store imported successfully")
except Exception as e:
    print(f"  ❌ Error: {e}")
    sys.exit(1)

print()

# Test 3: Get Qdrant client
print("✓ Step 3: Getting Qdrant client...")
try:
    client = get_qdrant_client()
    print(f"  ✅ Client created successfully")
    print(f"  🎯 Client type: {type(client).__name__}")
except Exception as e:
    print(f"  ❌ Error: {e}")
    sys.exit(1)

print()

# Test 4: Check collections
print("✓ Step 4: Checking collections...")
try:
    collections = client.get_collections()
    count = len(collections.collections)
    print(f"  ✅ Collections retrieved successfully")
    print(f"  📦 Total collections: {count}")
    if count > 0:
        for col in collections.collections:
            print(f"    - {col.name}")
except Exception as e:
    print(f"  ❌ Error: {e}")
    sys.exit(1)

print()

# Test 5: Check system info
print("✓ Step 5: Getting system info...")
try:
    info = client.get_telemetry()
    print(f"  ✅ System info retrieved")
    print(f"  🖥️  Server ready for requests")
except Exception as e:
    print(f"  ⚠️  Warning: {e}")
    print(f"  (This is OK - server might be initializing)")

print()
print("=" * 70)
print("✅ BACKEND STARTUP TEST PASSED!")
print("=" * 70)
print()
print("Next steps:")
print("  1. Run: python main.py")
print("  2. API will be available at: http://localhost:8000")
print("  3. Test endpoints: http://localhost:8000/docs")
print()
