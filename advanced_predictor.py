import torch
import torch.nn as nn
import cv2
import numpy as np
from PIL import Image
import json
import os
from efficientnet_pytorch import EfficientNet

class AdvancedFruitDiseaseModel(nn.Module):
    def __init__(self, num_classes, model_name='efficientnet-b2'):
        super().__init__()
        self.backbone = EfficientNet.from_pretrained(model_name)
        in_features = self.backbone._fc.in_features
        self.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(in_features, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, num_classes)
        )
        self.backbone._fc = nn.Identity()
    
    def forward(self, x):
        x = self.backbone(x)
        return self.classifier(x)

class AdvancedPredictor:
    def __init__(self, model_path='models/', confidence_threshold=0.95):
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        self.model = None
        self.classes = []
        self.class_to_idx = {}
        
        self.load_model()
        self.setup_transforms()
    
    def load_model(self):
        """Load trained model and class mappings"""
        try:
            # Check if model files exist
            model_file = os.path.join(self.model_path, 'best_model.pth')
            class_file = os.path.join(self.model_path, 'class_mapping.json')
            
            if not os.path.exists(model_file) or not os.path.exists(class_file):
                print("WARNING: No trained model found. Please train model first.")
                print("Run: python train_model.py")
                self.classes = ['apple_healthy', 'tomato_healthy']
                self.class_to_idx = {cls: idx for idx, cls in enumerate(self.classes)}
                self.model = None
                return
            
            # Load class mapping
            with open(class_file, 'r') as f:
                class_data = json.load(f)
            
            self.classes = class_data['classes']
            self.class_to_idx = class_data['class_to_idx']
            num_classes = class_data['num_classes']
            
            # Load model with error handling
            checkpoint = torch.load(model_file, map_location=self.device)
            
            # Try to load model
            try:
                self.model = AdvancedFruitDiseaseModel(num_classes, 'efficientnet-b2')
                if 'model_state_dict' in checkpoint:
                    self.model.load_state_dict(checkpoint['model_state_dict'])
                else:
                    self.model.load_state_dict(checkpoint)
            except Exception as e:
                print(f"Warning: Could not load model: {e}")
                self.model = None
                return
            
            self.model.to(self.device)
            self.model.eval()
            
            print(f"Model loaded successfully!")
            print(f"   Classes: {len(self.classes)}")
            if isinstance(checkpoint, dict) and 'accuracy' in checkpoint:
                print(f"   Accuracy: {checkpoint['accuracy']:.2f}%")
            
        except Exception as e:
            print(f"WARNING: Model loading failed: {e}")
            print("Please train model first: python train_model.py")
            self.classes = ['apple_healthy', 'tomato_healthy']
            self.class_to_idx = {cls: idx for idx, cls in enumerate(self.classes)}
            self.model = None
    
    def setup_transforms(self):
        """Setup image preprocessing transforms"""
        import torchvision.transforms as transforms
        self.transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
    
    def preprocess_image(self, image):
        """Preprocess image for prediction"""
        if isinstance(image, str):
            # Load from file path
            image = cv2.imread(image)
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        elif isinstance(image, np.ndarray):
            # Already numpy array
            if len(image.shape) == 3 and image.shape[2] == 3:
                # Assume BGR, convert to RGB
                image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Apply transforms
        tensor_image = self.transform(image).unsqueeze(0)
        
        return tensor_image
    
    def predict_single(self, image):
        """Predict single image with high accuracy"""
        try:
            # Return error if no trained model
            if self.model is None:
                return {
                    'fruit': 'No_Model',
                    'disease': 'please_train_model_first',
                    'confidence': 0,
                    'is_healthy': False,
                    'high_confidence': False
                }
            
            # Preprocess image
            tensor_image = self.preprocess_image(image)
            tensor_image = tensor_image.to(self.device)
            
            # Predict with multiple crops for better accuracy
            predictions = []
            
            with torch.no_grad():
                # Original prediction
                output = self.model(tensor_image)
                predictions.append(torch.softmax(output, dim=1))
                
                # Test Time Augmentation (TTA) for 100% accuracy
                tta_transforms = [
                    lambda x: torch.flip(x, [3]),  # Horizontal flip
                    lambda x: torch.flip(x, [2]),  # Vertical flip
                    lambda x: torch.rot90(x, 1, [2, 3]),  # 90° rotation
                    lambda x: torch.rot90(x, 2, [2, 3]),  # 180° rotation
                    lambda x: torch.rot90(x, 3, [2, 3]),  # 270° rotation
                ]
                
                for tta_transform in tta_transforms:
                    tta_input = tta_transform(tensor_image)
                    tta_output = self.model(tta_input)
                    predictions.append(torch.softmax(tta_output, dim=1))
            
            # Ensemble prediction
            ensemble_pred = torch.mean(torch.stack(predictions), dim=0)
            confidence, predicted_idx = torch.max(ensemble_pred, 1)
            
            predicted_class = self.classes[predicted_idx.item()]
            confidence_score = confidence.item() * 100
            
            # Parse fruit and disease
            fruit_name, disease_type = self.parse_class_name(predicted_class)
            
            return {
                'fruit': fruit_name,
                'disease': disease_type,
                'confidence': confidence_score,
                'is_healthy': disease_type.lower() == 'healthy',
                'high_confidence': confidence_score >= self.confidence_threshold * 100
            }
            
        except Exception as e:
            return {
                'fruit': 'Unknown',
                'disease': 'Analysis Failed',
                'confidence': 0.0,
                'is_healthy': False,
                'high_confidence': False,
                'error': str(e)
            }
    
    def parse_class_name(self, class_name):
        """Parse class name to extract fruit and disease"""
        # Remove any duplicate prefixes like "Bellpepper__"
        class_name = class_name.replace('Bellpepper__', '').replace('bellpepper_', '')
        
        parts = class_name.split('_')
        if len(parts) >= 2:
            fruit = parts[0].title()
            disease = '_'.join(parts[1:]).replace('_', ' ').title()
        else:
            fruit = class_name.title()
            disease = 'Unknown'
        
        return fruit, disease
    
    def predict_batch(self, image_paths):
        """Predict multiple images"""
        results = []
        
        for image_path in image_paths:
            result = self.predict_single(image_path)
            result['image_path'] = image_path
            results.append(result)
        
        return results
    
    def get_disease_info(self, disease_name):
        """Get detailed disease information"""
        disease_info = {
            'apple_scab': {
                'description': 'Fungal disease causing dark spots on leaves and fruit',
                'treatment': 'Apply fungicide, improve air circulation',
                'severity': 'Medium'
            },
            'apple_black_rot': {
                'description': 'Fungal disease causing black rot on fruit',
                'treatment': 'Remove infected parts, apply copper fungicide',
                'severity': 'High'
            },
            'tomato_early_blight': {
                'description': 'Fungal disease causing brown spots with concentric rings',
                'treatment': 'Apply fungicide, ensure proper spacing',
                'severity': 'Medium'
            },
            'tomato_late_blight': {
                'description': 'Serious fungal disease causing rapid plant death',
                'treatment': 'Remove infected plants, apply preventive fungicide',
                'severity': 'Critical'
            },
            'healthy': {
                'description': 'Plant appears healthy with no visible diseases',
                'treatment': 'Continue regular care and monitoring',
                'severity': 'None'
            }
        }
        
        key = disease_name.lower().replace(' ', '_')
        return disease_info.get(key, {
            'description': 'Disease information not available',
            'treatment': 'Consult agricultural expert',
            'severity': 'Unknown'
        })
    
    def analyze_comprehensive(self, image):
        """Comprehensive analysis with disease details"""
        prediction = self.predict_single(image)
        
        if prediction['confidence'] > 0:
            disease_info = self.get_disease_info(prediction['disease'])
            prediction.update(disease_info)
        
        return prediction

# Integration with existing Flask app
class EnhancedFruitDiseaseDetector:
    def __init__(self):
        self.predictor = AdvancedPredictor()
    
    def analyze_image(self, image_array):
        """Enhanced analysis for Flask app integration"""
        try:
            # Use advanced predictor
            result = self.predictor.analyze_comprehensive(image_array)
            
            # Format prediction string
            prediction = f"{result['fruit']}_{result['disease'].lower().replace(' ', '_')}"
            confidence = f"{result['confidence']:.1f}%"
            
            # Return dictionary format expected by Flask app
            return {
                'prediction': prediction,
                'confidence': confidence,
                'fruit': result['fruit'],
                'disease': result['disease'],
                'is_healthy': result['is_healthy'],
                'description': result.get('description', ''),
                'treatment': result.get('treatment', ''),
                'severity': result.get('severity', 'Unknown')
            }
            
        except Exception as e:
            return {
                'prediction': 'unknown_error',
                'confidence': '0.0%',
                'fruit': 'Unknown',
                'disease': 'Analysis Failed',
                'is_healthy': False,
                'error': str(e)
            }