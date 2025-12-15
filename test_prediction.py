"""Quick test script to verify prediction system"""
import numpy as np
from advanced_predictor import EnhancedFruitDiseaseDetector

# Create a test image (random data)
test_image = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)

# Initialize detector
detector = EnhancedFruitDiseaseDetector()

# Test prediction
result = detector.analyze_image(test_image)

print("=" * 50)
print("PREDICTION TEST RESULTS")
print("=" * 50)
print(f"Prediction: {result.get('prediction', 'N/A')}")
print(f"Confidence: {result.get('confidence', 'N/A')}")
print(f"Fruit: {result.get('fruit', 'N/A')}")
print(f"Disease: {result.get('disease', 'N/A')}")
print(f"Is Healthy: {result.get('is_healthy', 'N/A')}")
print("=" * 50)
print("\nSystem is working correctly!" if result.get('prediction') else "System needs attention!")
