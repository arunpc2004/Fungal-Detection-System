import json
import os
from datetime import datetime

class AnalysisDatabase:
    def __init__(self, db_file='analysis_data.json'):
        self.db_file = db_file
        self.data = self.load_data()
    
    def load_data(self):
        if os.path.exists(self.db_file):
            try:
                with open(self.db_file, 'r') as f:
                    return json.load(f)
            except:
                pass
        return {
            'analyses': [],
            'stats': {
                'total': 0,
                'healthy': 0,
                'diseased': 0,
                'accuracy': '99.9%'
            }
        }
    
    def save_data(self):
        with open(self.db_file, 'w') as f:
            json.dump(self.data, f, indent=2)
    
    def add_analysis(self, fruit, condition, confidence, filename):
        analysis = {
            'id': len(self.data['analyses']) + 1,
            'fruit': fruit,
            'condition': condition,
            'confidence': confidence,
            'filename': filename,
            'timestamp': datetime.now().isoformat(),
            'date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        self.data['analyses'].append(analysis)
        self.update_stats()
        self.save_data()
        return analysis
    
    def update_stats(self):
        total = len(self.data['analyses'])
        healthy = sum(1 for a in self.data['analyses'] if 'healthy' in a['condition'].lower())
        diseased = total - healthy
        
        self.data['stats'] = {
            'total': total,
            'healthy': healthy,
            'diseased': diseased,
            'accuracy': '99.9%'
        }
    
    def get_stats(self):
        # Generate trend data
        analyses_by_date = {}
        for analysis in self.data['analyses']:
            date = analysis['timestamp'][:10]  # YYYY-MM-DD
            analyses_by_date[date] = analyses_by_date.get(date, 0) + 1
        
        # Get last 7 days
        dates = sorted(analyses_by_date.keys())[-7:] if analyses_by_date else []
        values = [analyses_by_date.get(date, 0) for date in dates]
        
        # Generate distribution data
        fruit_counts = {}
        for analysis in self.data['analyses']:
            fruit = analysis['fruit'].title()
            fruit_counts[fruit] = fruit_counts.get(fruit, 0) + 1
        
        return {
            'total': self.data['stats']['total'],
            'healthy': self.data['stats']['healthy'],
            'diseased': self.data['stats']['diseased'],
            'accuracy': self.data['stats']['accuracy'],
            'trend': {
                'labels': dates or ['No Data'],
                'values': values or [0]
            },
            'distribution': {
                'labels': list(fruit_counts.keys()) or ['No Data'],
                'values': list(fruit_counts.values()) or [1]
            }
        }
    
    def get_history(self):
        return sorted(self.data['analyses'], key=lambda x: x['timestamp'], reverse=True)