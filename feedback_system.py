import json
import os
from datetime import datetime

class FeedbackSystem:
    def __init__(self, feedback_file='feedback_data.json'):
        self.feedback_file = feedback_file
        self._init_file()
    
    def _init_file(self):
        if not os.path.exists(self.feedback_file):
            with open(self.feedback_file, 'w') as f:
                json.dump({'ratings': [], 'reports': [], 'suggestions': []}, f)
    
    def add_rating(self, prediction_id, rating, comment=''):
        data = self._load()
        data['ratings'].append({
            'id': prediction_id,
            'rating': rating,
            'comment': comment,
            'timestamp': str(datetime.now())
        })
        self._save(data)
    
    def add_report(self, prediction_id, issue, details=''):
        data = self._load()
        data['reports'].append({
            'id': prediction_id,
            'issue': issue,
            'details': details,
            'timestamp': str(datetime.now())
        })
        self._save(data)
    
    def add_suggestion(self, feature, description=''):
        data = self._load()
        data['suggestions'].append({
            'feature': feature,
            'description': description,
            'timestamp': str(datetime.now())
        })
        self._save(data)
    
    def get_stats(self):
        data = self._load()
        ratings = data.get('ratings', [])
        avg_rating = sum(r['rating'] for r in ratings) / len(ratings) if ratings else 0
        return {
            'total_ratings': len(ratings),
            'average_rating': round(avg_rating, 2),
            'total_reports': len(data.get('reports', [])),
            'total_suggestions': len(data.get('suggestions', []))
        }
    
    def _load(self):
        with open(self.feedback_file, 'r') as f:
            return json.load(f)
    
    def _save(self, data):
        with open(self.feedback_file, 'w') as f:
            json.dump(data, f, indent=2)
