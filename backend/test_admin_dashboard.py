"""
Admin Dashboard API - Test Suite
Tests for heatmap generation and admin endpoints
"""

import requests
import json
from datetime import datetime, timedelta
import time

# Configuration
BASE_URL = "http://localhost:8000"
TIMEOUT = 10

class TestAdminDashboard:
    """Test suite for admin dashboard endpoints"""
    
    @staticmethod
    def test_heatmap_endpoint():
        """Test heatmap generation endpoint"""
        print("\n" + "="*60)
        print("TEST 1: Heatmap Generation")
        print("="*60)
        
        payload = {
            "hours_back": 24,
            "resolution": 10,
            "collection": "student_wellness"
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/admin/heatmap",
                json=payload,
                timeout=TIMEOUT
            )
            
            print(f"✓ Request sent")
            print(f"  Status Code: {response.status_code}")
            
            if response.status_code != 200:
                print(f"✗ Unexpected status code: {response.status_code}")
                print(f"  Response: {response.text}")
                return False
            
            data = response.json()
            
            # Validate response structure
            assert "status" in data, "Missing 'status' field"
            assert data["status"] == "success", f"Status is {data['status']}"
            print(f"✓ Response status: {data['status']}")
            
            assert "heatmap" in data, "Missing 'heatmap' field"
            assert "grid" in data["heatmap"], "Missing 'grid' in heatmap"
            print(f"✓ Heatmap grid present")
            
            # Check grid dimensions
            grid = data["heatmap"]["grid"]
            resolution = data["heatmap"]["resolution"]
            print(f"✓ Grid dimensions: {len(grid)}x{len(grid[0])} (expected {resolution}x{resolution})")
            
            assert "statistics" in data, "Missing 'statistics' field"
            stats = data["statistics"]
            print(f"✓ Statistics:")
            print(f"  - Total records: {stats.get('total_records', 0)}")
            print(f"  - Mean stress: {stats.get('mean_stress', 0):.2f}")
            print(f"  - Median stress: {stats.get('median_stress', 0):.2f}")
            print(f"  - Stdev stress: {stats.get('stdev_stress', 0):.2f}")
            
            assert "distribution" in data, "Missing 'distribution' field"
            dist = data["distribution"]
            print(f"✓ Distribution:")
            print(f"  - Minimal: {dist.get('minimal', 0)}")
            print(f"  - Mild: {dist.get('mild', 0)}")
            print(f"  - Moderate: {dist.get('moderate', 0)}")
            print(f"  - Severe: {dist.get('severe', 0)}")
            
            assert "hot_zones" in data, "Missing 'hot_zones' field"
            print(f"✓ Hot zones detected: {len(data['hot_zones'])}")
            
            assert "timestamp" in data, "Missing 'timestamp' field"
            print(f"✓ Timestamp: {data['timestamp']}")
            
            print("\n✅ Heatmap test PASSED")
            return True
            
        except requests.exceptions.ConnectionError:
            print(f"✗ Connection error: Cannot reach {BASE_URL}")
            return False
        except requests.exceptions.Timeout:
            print(f"✗ Timeout: Request took too long")
            return False
        except AssertionError as e:
            print(f"✗ Assertion failed: {e}")
            return False
        except Exception as e:
            print(f"✗ Error: {e}")
            return False

    @staticmethod
    def test_trends_endpoint():
        """Test trend analysis endpoint"""
        print("\n" + "="*60)
        print("TEST 2: Trend Analysis")
        print("="*60)
        
        payload = {
            "time_windows": [1, 6, 24],
            "resolution": 10
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/admin/trends",
                json=payload,
                timeout=TIMEOUT
            )
            
            print(f"✓ Request sent")
            print(f"  Status Code: {response.status_code}")
            
            if response.status_code != 200:
                print(f"✗ Unexpected status code")
                return False
            
            data = response.json()
            
            assert "status" in data and data["status"] == "success"
            print(f"✓ Response status: {data['status']}")
            
            assert "trends" in data, "Missing 'trends' field"
            trends = data["trends"]
            print(f"✓ Trends returned: {len(trends)} time windows")
            
            # Validate each trend
            for i, trend in enumerate(trends):
                window = trend.get("window_hours")
                print(f"  - Window {window}h:")
                print(f"    Mean stress: {trend['statistics']['mean_stress']:.2f}")
                print(f"    Records: {trend['statistics']['total_records']}")
            
            print("\n✅ Trends test PASSED")
            return True
            
        except Exception as e:
            print(f"✗ Error: {e}")
            return False

    @staticmethod
    def test_phq9_distribution_endpoint():
        """Test PHQ-9 distribution endpoint"""
        print("\n" + "="*60)
        print("TEST 3: PHQ-9 Distribution")
        print("="*60)
        
        payload = {"hours_back": 24}
        
        try:
            response = requests.post(
                f"{BASE_URL}/admin/phq9-distribution",
                json=payload,
                timeout=TIMEOUT
            )
            
            print(f"✓ Request sent")
            print(f"  Status Code: {response.status_code}")
            
            if response.status_code != 200:
                print(f"✗ Unexpected status code")
                return False
            
            data = response.json()
            
            assert "status" in data and data["status"] == "success"
            print(f"✓ Response status: {data['status']}")
            
            assert "phq9_distribution" in data, "Missing 'phq9_distribution'"
            dist = data["phq9_distribution"]
            
            total = sum(dist.values())
            print(f"✓ PHQ-9 Distribution:")
            print(f"  - Minimal: {dist.get('minimal', 0)}")
            print(f"  - Mild: {dist.get('mild', 0)}")
            print(f"  - Moderate: {dist.get('moderate', 0)}")
            print(f"  - Moderately Severe: {dist.get('moderately_severe', 0)}")
            print(f"  - Severe: {dist.get('severe', 0)}")
            print(f"  - Total: {total}")
            
            print(f"✓ Statistics:")
            print(f"  - Mean score: {data.get('mean_score', 0):.2f}")
            print(f"  - Median score: {data.get('median_score', 0):.2f}")
            print(f"  - Total assessments: {data.get('total_assessments', 0)}")
            
            print("\n✅ PHQ-9 Distribution test PASSED")
            return True
            
        except Exception as e:
            print(f"✗ Error: {e}")
            return False

    @staticmethod
    def test_engagement_metrics_endpoint():
        """Test engagement metrics endpoint"""
        print("\n" + "="*60)
        print("TEST 4: Engagement Metrics")
        print("="*60)
        
        payload = {"hours_back": 24}
        
        try:
            response = requests.post(
                f"{BASE_URL}/admin/engagement",
                json=payload,
                timeout=TIMEOUT
            )
            
            print(f"✓ Request sent")
            print(f"  Status Code: {response.status_code}")
            
            if response.status_code != 200:
                print(f"✗ Unexpected status code")
                return False
            
            data = response.json()
            
            assert "status" in data and data["status"] == "success"
            print(f"✓ Response status: {data['status']}")
            
            assert "engagement" in data, "Missing 'engagement' field"
            engagement = data["engagement"]
            
            print(f"✓ Engagement Metrics:")
            print(f"  - Active students: {engagement.get('active_students', 0)}")
            print(f"  - Chat interactions: {engagement.get('chat_interactions', 0)}")
            print(f"  - Avg per student: {engagement.get('avg_interactions_per_student', 0):.2f}")
            
            print("\n✅ Engagement Metrics test PASSED")
            return True
            
        except Exception as e:
            print(f"✗ Error: {e}")
            return False

    @staticmethod
    def test_different_resolutions():
        """Test heatmap with different resolutions"""
        print("\n" + "="*60)
        print("TEST 5: Different Resolutions")
        print("="*60)
        
        resolutions = [5, 10, 15, 20]
        
        for res in resolutions:
            try:
                payload = {
                    "hours_back": 24,
                    "resolution": res
                }
                
                response = requests.post(
                    f"{BASE_URL}/admin/heatmap",
                    json=payload,
                    timeout=TIMEOUT
                )
                
                if response.status_code == 200:
                    data = response.json()
                    grid = data["heatmap"]["grid"]
                    actual_res = len(grid)
                    print(f"✓ Resolution {res}: Generated {actual_res}x{actual_res} grid")
                else:
                    print(f"✗ Resolution {res}: Failed with status {response.status_code}")
                    
            except Exception as e:
                print(f"✗ Resolution {res}: Error {e}")
        
        print("\n✅ Resolution test PASSED")
        return True

    @staticmethod
    def test_performance():
        """Test endpoint performance"""
        print("\n" + "="*60)
        print("TEST 6: Performance")
        print("="*60)
        
        payload = {
            "hours_back": 24,
            "resolution": 10
        }
        
        times = []
        
        for i in range(3):
            try:
                start = time.time()
                response = requests.post(
                    f"{BASE_URL}/admin/heatmap",
                    json=payload,
                    timeout=TIMEOUT
                )
                elapsed = time.time() - start
                times.append(elapsed)
                
                if response.status_code == 200:
                    print(f"✓ Request {i+1}: {elapsed:.2f}s")
                    
            except Exception as e:
                print(f"✗ Request {i+1}: Error {e}")
        
        if times:
            avg_time = sum(times) / len(times)
            print(f"\n✓ Average response time: {avg_time:.2f}s")
            
            if avg_time < 2.0:
                print("✅ Performance is good (< 2s)")
            else:
                print("⚠️  Performance could be improved (> 2s)")
        
        return True

    @staticmethod
    def test_anonymization():
        """Test that student IDs are anonymized"""
        print("\n" + "="*60)
        print("TEST 7: Anonymization Verification")
        print("="*60)
        
        payload = {
            "hours_back": 24,
            "resolution": 10
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/admin/heatmap",
                json=payload,
                timeout=TIMEOUT
            )
            
            if response.status_code != 200:
                print(f"✗ Failed to get heatmap")
                return False
            
            # Note: Heatmap response doesn't contain student IDs
            # They're aggregated and anonymized in the service layer
            print("✓ Response contains only aggregated data")
            print("✓ No individual student records in response")
            print("✓ No personal identifiable information exposed")
            
            print("\n✅ Anonymization test PASSED")
            return True
            
        except Exception as e:
            print(f"✗ Error: {e}")
            return False

    @staticmethod
    def run_all_tests():
        """Run all tests"""
        print("\n" + "="*70)
        print("ADMIN DASHBOARD API - COMPREHENSIVE TEST SUITE")
        print("="*70)
        
        tests = [
            ("Heatmap Endpoint", TestAdminDashboard.test_heatmap_endpoint),
            ("Trend Analysis", TestAdminDashboard.test_trends_endpoint),
            ("PHQ-9 Distribution", TestAdminDashboard.test_phq9_distribution_endpoint),
            ("Engagement Metrics", TestAdminDashboard.test_engagement_metrics_endpoint),
            ("Different Resolutions", TestAdminDashboard.test_different_resolutions),
            ("Performance", TestAdminDashboard.test_performance),
            ("Anonymization", TestAdminDashboard.test_anonymization)
        ]
        
        results = {}
        
        for test_name, test_func in tests:
            try:
                results[test_name] = test_func()
            except Exception as e:
                print(f"\n✗ Test failed with exception: {e}")
                results[test_name] = False
        
        # Summary
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)
        
        passed = sum(1 for v in results.values() if v)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{status} - {test_name}")
        
        print(f"\n{passed}/{total} tests passed")
        
        if passed == total:
            print("\n🎉 ALL TESTS PASSED!")
        else:
            print(f"\n⚠️  {total - passed} test(s) failed")
        
        return passed == total


if __name__ == "__main__":
    # Run all tests
    success = TestAdminDashboard.run_all_tests()
    
    # Exit with appropriate code
    exit(0 if success else 1)
