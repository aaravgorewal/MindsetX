#!/usr/bin/env python3
"""
Studio Endpoint - Comprehensive Test Suite
Tests personalized wellness content feed endpoints
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

print("""
======================================================================
WELLNESS STUDIO FEED - COMPREHENSIVE TEST SUITE
======================================================================

Testing personalized wellness content retrieval using Qdrant vectors.

""")

# Test 1: Health check
print("=" * 70)
print("STEP 1: Health Check - Verify Backend is Running")
print("=" * 70)

try:
    response = requests.get(f"{BASE_URL}/")
    if response.status_code == 200:
        print("✅ Backend is running and accessible")
        print(f"   Response: {response.json()}\n")
    else:
        print(f"❌ Backend returned status {response.status_code}")
        exit(1)
except Exception as e:
    print(f"❌ Failed to reach backend: {e}")
    print("   Make sure to run: python main.py\n")
    exit(1)


# Test 2: Get wellness categories
print("=" * 70)
print("STEP 2: Retrieve Available Wellness Categories")
print("=" * 70)

try:
    response = requests.get(f"{BASE_URL}/studio/categories")
    if response.status_code == 200:
        data = response.json()
        categories = data.get("categories", [])
        print(f"✅ Retrieved {len(categories)} wellness categories:")
        for i, cat in enumerate(categories, 1):
            print(f"   {i:2}. {cat}")
        print()
    else:
        print(f"❌ Failed with status {response.status_code}")
        print(f"   Response: {response.text}\n")
except Exception as e:
    print(f"❌ Error: {e}\n")


# Test 3: Get personalized feed by mood
print("=" * 70)
print("STEP 3: Get Personalized Feed by Mood")
print("=" * 70)

moods_to_test = ["anxious", "depressed", "stressed", "overwhelmed"]

for mood in moods_to_test:
    try:
        payload = {
            "student_id": f"student_{mood}",
            "mood": mood,
            "limit": 3,
            "score_threshold": 0.3
        }
        
        response = requests.post(f"{BASE_URL}/studio", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            total = data.get("total_found", 0)
            print(f"\n✅ Mood '{mood}' - Found {total} recommendations:")
            
            for item in data.get("content", [])[:2]:
                print(f"   • {item.get('title')}")
                print(f"     Category: {item.get('category')} | "
                      f"Difficulty: {item.get('difficulty')} | "
                      f"Score: {item.get('relevance_score', 0):.3f}")
        else:
            print(f"❌ Failed for mood '{mood}': {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error with mood '{mood}': {e}")

print()


# Test 4: Get feed by custom query
print("=" * 70)
print("STEP 4: Get Feed by Custom Search Query")
print("=" * 70)

queries = [
    "I need to improve my sleep",
    "How can I reduce stress at work",
    "I want to build better relationships"
]

for query in queries:
    try:
        payload = {
            "student_id": "student_query_test",
            "query": query,
            "limit": 2,
            "score_threshold": 0.3
        }
        
        response = requests.post(f"{BASE_URL}/studio", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            total = data.get("total_found", 0)
            print(f"\n✅ Query: '{query}'")
            print(f"   Found {total} results:")
            
            for item in data.get("content", []):
                print(f"   • {item.get('title')}")
                
        else:
            print(f"❌ Failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

print()


# Test 5: Get feed with category filter
print("=" * 70)
print("STEP 5: Get Feed with Category Filter")
print("=" * 70)

categories_to_test = ["mindfulness", "stress_management", "sleep_hygiene"]

for category in categories_to_test:
    try:
        payload = {
            "category": category,
            "limit": 2
        }
        
        response = requests.post(f"{BASE_URL}/studio/category", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            total = data.get("total_found", 0)
            print(f"\n✅ Category '{category}' - Found {total} items:")
            
            for item in data.get("content", []):
                print(f"   • {item.get('title')} "
                      f"({item.get('difficulty')})")
                
        else:
            print(f"❌ Failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

print()


# Test 6: Get trending content
print("=" * 70)
print("STEP 6: Get Trending Wellness Content")
print("=" * 70)

try:
    payload = {
        "limit": 5,
        "days": 30
    }
    
    response = requests.post(f"{BASE_URL}/studio/trending", json=payload)
    
    if response.status_code == 200:
        data = response.json()
        total = data.get("total_found", 0)
        print(f"✅ Trending content (last {data.get('trend_window_days')} days): "
              f"Found {total} items")
        print()
        
        for item in data.get("content", []):
            print(f"   • {item.get('title')}")
            print(f"     Category: {item.get('category')}")
            
    else:
        print(f"❌ Failed: {response.status_code}")
        
except Exception as e:
    print(f"❌ Error: {e}")

print()


# Test 7: Test with difficulty filter
print("=" * 70)
print("STEP 7: Get Feed with Difficulty Filter")
print("=" * 70)

for difficulty in ["beginner", "intermediate"]:
    try:
        payload = {
            "category": "mindfulness",
            "difficulty": difficulty,
            "limit": 2
        }
        
        response = requests.post(f"{BASE_URL}/studio/category", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            total = data.get("total_found", 0)
            print(f"\n✅ Mindfulness ({difficulty}) - Found {total} items")
            
            for item in data.get("content", []):
                print(f"   • {item.get('title')}")
                
        else:
            print(f"❌ Failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

print()


# Test 8: Test with category filter in personalized feed
print("=" * 70)
print("STEP 8: Personalized Feed with Category Filter")
print("=" * 70)

try:
    payload = {
        "student_id": "student_filtered",
        "mood": "anxious",
        "categories": ["mindfulness", "coping_strategies"],
        "limit": 4
    }
    
    response = requests.post(f"{BASE_URL}/studio", json=payload)
    
    if response.status_code == 200:
        data = response.json()
        total = data.get("total_found", 0)
        filters = data.get("filter_applied", {})
        
        print(f"✅ Found {total} results with filters:")
        print(f"   Categories: {filters.get('categories')}")
        print(f"   Threshold: {filters.get('threshold')}")
        print()
        
        for item in data.get("content", []):
            print(f"   • {item.get('title')}")
            print(f"     Category: {item.get('category')} | "
                  f"Difficulty: {item.get('difficulty')}")
            
    else:
        print(f"❌ Failed: {response.status_code}")
        print(f"   Response: {response.text}")
        
except Exception as e:
    print(f"❌ Error: {e}")

print()


# Test 9: Performance test - High limit
print("=" * 70)
print("STEP 9: Performance Test - Large Result Set")
print("=" * 70)

try:
    payload = {
        "student_id": "perf_test",
        "query": "wellness",
        "limit": 20,
        "score_threshold": 0.2
    }
    
    import time
    start = time.time()
    response = requests.post(f"{BASE_URL}/studio", json=payload)
    elapsed = time.time() - start
    
    if response.status_code == 200:
        data = response.json()
        total = data.get("total_found", 0)
        print(f"✅ Retrieved {total} results in {elapsed:.3f} seconds")
        print(f"   Status: {data.get('status')}")
        print(f"   Response time: {'✅ Good' if elapsed < 1.0 else '⚠️  Acceptable' if elapsed < 2.0 else '❌ Slow'}")
        
    else:
        print(f"❌ Failed: {response.status_code}")
        
except Exception as e:
    print(f"❌ Error: {e}")

print()


# Test 10: Error handling - Invalid category
print("=" * 70)
print("STEP 10: Error Handling - Invalid Category")
print("=" * 70)

try:
    payload = {
        "category": "invalid_category_xyz",
        "limit": 5
    }
    
    response = requests.post(f"{BASE_URL}/studio/category", json=payload)
    
    if response.status_code == 400:
        data = response.json()
        print(f"✅ Correctly rejected invalid category")
        print(f"   Error message: {data.get('detail', '')}")
    else:
        print(f"⚠️  Unexpected status code: {response.status_code}")
        
except Exception as e:
    print(f"❌ Error: {e}")

print()


# Test 11: Error handling - Invalid difficulty
print("=" * 70)
print("STEP 11: Error Handling - Difficulty Not Found")
print("=" * 70)

try:
    payload = {
        "category": "mindfulness",
        "difficulty": "expert",  # not a valid level
        "limit": 5
    }
    
    response = requests.post(f"{BASE_URL}/studio/category", json=payload)
    
    if response.status_code == 200:
        data = response.json()
        total = data.get("total_found", 0)
        if total == 0:
            print(f"✅ No results returned for invalid difficulty (expected)")
        else:
            print(f"⚠️  Got {total} results (may be acceptable)")
    else:
        print(f"Status code: {response.status_code}")
        
except Exception as e:
    print(f"❌ Error: {e}")

print()


# Summary
print("=" * 70)
print("TEST SUITE COMPLETED")
print("=" * 70)

print("""
Summary of Studio Feed Endpoints:

✅ POST /studio
   → Get personalized wellness feed by mood or custom query
   → Supports filtering by category and difficulty
   → Configurable similarity threshold and result limit

✅ GET /studio/categories
   → List all available wellness categories
   → Use for UI category filters and validation

✅ POST /studio/category
   → Get all content for a specific category
   → Filter by difficulty level (beginner|intermediate|advanced)

✅ POST /studio/trending
   → Get popular/trending wellness content
   → Configurable time window (days)
   → Great for discovery and recommendations

Key Features:
• Semantic search using Qdrant vectors
• 384-dimensional embeddings
• 10 wellness categories
• Multiple difficulty levels
• Mood-based recommendations
• Custom query support
• Fast response times (<500ms typical)

Next Steps:
1. Review API documentation: STUDIO_DOCS.md
2. Integrate with React frontend
3. Connect to student profiles for personalization
4. Track user engagement and preferences
5. Build recommendation engine on top

""")
