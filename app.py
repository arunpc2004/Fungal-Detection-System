from flask import Flask, render_template, request, jsonify, redirect, url_for
import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image
import os
from advanced_predictor import EnhancedFruitDiseaseDetector
from database import AnalysisDatabase
from feedback_system import FeedbackSystem
import uuid
from datetime import datetime
import json

app = Flask(__name__, template_folder='web/templates', static_folder='web/static')

# Create necessary directories
os.makedirs('web/static/uploads', exist_ok=True)
os.makedirs('models', exist_ok=True)

def generate_processed_images(img_array, original_filename):
    """Generate and save processed versions of the image"""
    processed = {}
    base_name = original_filename.split('.')[0]

    # Original
    processed['original'] = original_filename

    # Preprocessed - resize to 224x224
    preprocessed = cv2.resize(img_array, (224, 224))
    prep_filename = f"{base_name}_preprocessed.jpg"
    cv2.imwrite(os.path.join('web/static/uploads', prep_filename), cv2.cvtColor(preprocessed, cv2.COLOR_RGB2BGR))
    processed['preprocessed'] = prep_filename

    # Rotated - 90 degrees clockwise
    rotated = cv2.rotate(img_array, cv2.ROTATE_90_CLOCKWISE)
    rot_filename = f"{base_name}_rotated.jpg"
    cv2.imwrite(os.path.join('web/static/uploads', rot_filename), cv2.cvtColor(rotated, cv2.COLOR_RGB2BGR))
    processed['rotated'] = rot_filename

    # Blurred - Gaussian blur
    blurred = cv2.GaussianBlur(img_array, (5, 5), 0)
    blur_filename = f"{base_name}_blurred.jpg"
    cv2.imwrite(os.path.join('web/static/uploads', blur_filename), cv2.cvtColor(blurred, cv2.COLOR_RGB2BGR))
    processed['blurred'] = blur_filename

    # Cropped - center crop
    h, w = img_array.shape[:2]
    crop_size = min(h, w) // 2
    start_x = (w - crop_size) // 2
    start_y = (h - crop_size) // 2
    cropped = img_array[start_y:start_y+crop_size, start_x:start_x+crop_size]
    crop_filename = f"{base_name}_cropped.jpg"
    cv2.imwrite(os.path.join('web/static/uploads', crop_filename), cv2.cvtColor(cropped, cv2.COLOR_RGB2BGR))
    processed['cropped'] = crop_filename

    # Edges - Canny edge detection
    gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    edges = cv2.Canny(gray, 100, 200)
    edges_colored = cv2.cvtColor(edges, cv2.COLOR_GRAY2RGB)
    edges_filename = f"{base_name}_edges.jpg"
    cv2.imwrite(os.path.join('web/static/uploads', edges_filename), edges_colored)
    processed['edges'] = edges_filename

    return processed

@app.route('/static/uploads/<filename>')
def uploaded_file(filename):
    return app.send_static_file(f'uploads/{filename}')

@app.route('/correct_prediction', methods=['POST'])
def correct_prediction():
    try:
        filename = request.form.get('filename')
        correct_fruit = request.form.get('correct_fruit')
        correct_condition = request.form.get('correct_condition')
        
        # Save correction to database or file for retraining
        correction_data = {
            'filename': filename,
            'original_prediction': request.form.get('original_prediction', 'unknown'),
            'correct_fruit': correct_fruit,
            'correct_condition': correct_condition,
            'timestamp': str(datetime.now())
        }
        
        # Save to corrections file
        corrections_file = 'corrections.json'
        corrections = []
        
        if os.path.exists(corrections_file):
            with open(corrections_file, 'r') as f:
                corrections = json.load(f)
        
        corrections.append(correction_data)
        
        with open(corrections_file, 'w') as f:
            json.dump(corrections, f, indent=2)
        
        return render_template('correction_success.html', 
                             correct_fruit=correct_fruit,
                             correct_condition=correct_condition)
        
    except Exception as e:
        return render_template('correction_error.html', error=str(e))

# Initialize enhanced disease detector and database
detector = EnhancedFruitDiseaseDetector()
db = AnalysisDatabase()
feedback_system = FeedbackSystem()

@app.route('/')
def index():
    return redirect(url_for('dashboard'))

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')


@app.route('/analyze')
def analyze():
    return render_template('analyze_page.html')

@app.route('/live-detection')
def live_detection():
    return render_template('live_detection_page.html')

@app.route('/live')
def live():
    # Redirect to new live detection page
    return redirect(url_for('live_detection'))


@app.route('/history')
def history():
    return render_template('history_page.html')

@app.route('/about')
def about():
    return render_template('about_page.html')

@app.route('/confidence-demo')
def confidence_demo():
    return render_template('confidence_demo.html')

@app.route('/batch')
def batch():
    return render_template('batch_upload.html')

@app.route('/batch_predict', methods=['POST'])
def batch_predict():
    try:
        files = request.files.getlist('files')
        if not files:
            return jsonify({'success': False, 'error': 'No files uploaded'})
        
        results = []
        for file in files:
            if file.filename == '':
                continue
            
            # Save file
            filename = str(uuid.uuid4()) + '.jpg'
            upload_path = os.path.join('web/static/uploads', filename)
            file.save(upload_path)
            
            # Analyze
            img = Image.open(upload_path)
            img_array = np.array(img)
            if len(img_array.shape) == 3 and img_array.shape[2] == 4:
                img_array = cv2.cvtColor(img_array, cv2.COLOR_RGBA2RGB)
            
            analysis = detector.analyze_image(img_array)
            prediction = analysis.get('prediction', 'unknown')
            
            if '_' in prediction:
                fruit, condition = prediction.split('_', 1)
            else:
                fruit, condition = prediction, 'unknown'
            
            results.append({
                'filename': file.filename,
                'saved_as': filename,
                'fruit': fruit.title(),
                'condition': condition.title(),
                'confidence': analysis.get('confidence', '0%'),
                'is_healthy': 'healthy' in condition.lower(),
                'image_url': f'/static/uploads/{filename}'
            })
            
            # Save to database
            db.add_analysis(fruit, condition, analysis.get('confidence', '0%'), filename)
        
        return jsonify({'success': True, 'results': results})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get image from form file upload
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file uploaded'})
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'})
        
        # Save uploaded file
        filename = str(uuid.uuid4()) + '.jpg'
        upload_path = os.path.join('web/static/uploads', filename)
        os.makedirs('web/static/uploads', exist_ok=True)
        file.save(upload_path)
        
        # Read image for analysis
        img = Image.open(upload_path)
        img_array = np.array(img)

        # Convert to RGB if needed
        if len(img_array.shape) == 3 and img_array.shape[2] == 4:
            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGBA2RGB)

        # Generate processed images
        processed_images = generate_processed_images(img_array, filename)

        # Analyze image for fruits and diseases
        try:
            results = detector.analyze_image(img_array)
        except Exception as analysis_error:
            print(f"Analysis error: {analysis_error}")
            # Fallback result
            results = {
                'prediction': 'unknown_healthy',
                'confidence': '50%',
                'error': str(analysis_error)
            }
        
        # Parse results for template
        prediction = results.get('prediction', 'Unknown')
        confidence = results.get('confidence', '0%')
        
        # Parse fruit and condition
        if '_' in prediction:
            parts = prediction.split('_')
            fruit = parts[0]
            condition = '_'.join(parts[1:])
        else:
            fruit = prediction
            condition = 'unknown'
        
        # Clean up formatting
        fruit = fruit.replace('_', ' ').title()
        condition = condition.replace('_', ' ').title()
        
        # Determine health status
        is_healthy = 'healthy' in condition.lower()
        is_other = condition.lower() in ['unknown', 'other']
        
        # Save to database
        db.add_analysis(fruit, condition, confidence, filename)
        
        # Render result page
        return render_template('result.html',
            image_url=f'/static/uploads/{processed_images["original"]}',
            prep_url=f'/static/uploads/{processed_images["preprocessed"]}',
            previews={
                'Rotated': processed_images['rotated'],
                'Blurred': processed_images['blurred'],
                'Cropped': processed_images['cropped'],
                'Edges': processed_images['edges']
            },
            label=prediction,
            fruit=fruit.title(),
            condition=condition.title(),
            confidence=confidence,
            is_healthy=is_healthy,
            is_other=is_other,
            infection_type=condition if not is_healthy else 'None',
            model_used='EfficientNet',
            is_ai_generated=False,
            ai_confidence='N/A',
            filename=filename,
            available_fruits=['apple', 'tomato', 'potato', 'grape', 'corn'],
            available_conditions=['healthy', 'diseased'],
            predicted_fruit=fruit
        )
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })


@app.route('/live_detect', methods=['POST'])
def live_detect():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file'})
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'})
        
        # Read and preprocess image same as upload section
        img = Image.open(file)
        img_array = np.array(img)
        
        # Convert to RGB if needed
        if len(img_array.shape) == 3 and img_array.shape[2] == 4:
            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGBA2RGB)
        elif len(img_array.shape) == 3 and img_array.shape[2] == 3:
            # Ensure RGB format
            img_array = cv2.cvtColor(img_array, cv2.COLOR_BGR2RGB)
        
        # Resize to standard size for better accuracy (same as upload preprocessing)
        img_array = cv2.resize(img_array, (512, 512))
        
        # Apply slight denoising for camera images
        img_array = cv2.bilateralFilter(img_array, 9, 75, 75)
        
        # Enhanced analysis for live detection
        try:
            results = detector.analyze_image(img_array)
            prediction = results.get('prediction', 'unknown')
            confidence = results.get('confidence', '0%')
            
            # Check confidence
            confidence_num = float(confidence.replace('%', '')) if '%' in confidence else 0
            if confidence_num < 30:
                return jsonify({
                    'success': True,
                    'description': '📷 Point camera at fruits or vegetables',
                    'has_fruit': False,
                    'objects': [],
                    'should_speak': False
                })
            
            has_fruit = True
            
            if '_' in prediction:
                fruit, condition = prediction.split('_', 1)
            else:
                fruit = prediction
                condition = 'detected'
            
            is_healthy = 'healthy' in condition.lower()
                
            # Dynamic bounding box based on image size
            img_height, img_width = img_array.shape[:2]
            box_width = min(img_width * 0.7, 350)
            box_height = min(img_height * 0.7, 350)
            box_x = (img_width - box_width) // 2
            box_y = (img_height - box_height) // 2
            
            description = f"🍎 {fruit.title()} - {condition.title()} ({confidence})"
            
            return jsonify({
                'success': True,
                'description': description,
                'has_fruit': True,
                'objects': [{
                    'object': f"{fruit.title()} ({condition.title()})",
                    'confidence': confidence_num / 100,
                    'bbox': [box_x, box_y, box_x + box_width, box_y + box_height]
                }],
                'should_speak': confidence_num > 60
            })
            
        except Exception as e:
            return jsonify({
                'success': True,
                'description': 'Analyzing...',
                'has_fruit': False,
                'objects': [],
                'should_speak': False
            })
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/stats')
def stats():
    return jsonify(db.get_stats())

@app.route('/api/history')
def api_history():
    return jsonify(db.get_history())

@app.route('/api/export/<format>')
def export_data(format):
    """Export analysis history data"""
    try:
        history_data = db.get_history()
        
        if format.lower() == 'csv':
            import csv
            from io import StringIO
            
            output = StringIO()
            writer = csv.writer(output)
            
            # Write headers
            writer.writerow(['Date', 'Fruit', 'Condition', 'Confidence', 'Health Status', 'Filename'])
            
            # Write data
            for item in history_data:
                is_healthy = 'healthy' in item['condition'].lower()
                writer.writerow([
                    item['date'],
                    item['fruit'],
                    item['condition'],
                    item['confidence'],
                    'Healthy' if is_healthy else 'Diseased',
                    item['filename']
                ])
            
            response = app.response_class(
                output.getvalue(),
                mimetype='text/csv',
                headers={'Content-Disposition': 'attachment; filename=fruit_analysis_history.csv'}
            )
            return response
            
        elif format.lower() == 'json':
            export_data = []
            for item in history_data:
                is_healthy = 'healthy' in item['condition'].lower()
                export_data.append({
                    'date': item['date'],
                    'fruit': item['fruit'],
                    'condition': item['condition'],
                    'confidence': item['confidence'],
                    'health_status': 'Healthy' if is_healthy else 'Diseased',
                    'filename': item['filename']
                })
            
            response = app.response_class(
                jsonify(export_data).data,
                mimetype='application/json',
                headers={'Content-Disposition': 'attachment; filename=fruit_analysis_history.json'}
            )
            return response
            
        else:
            return jsonify({'error': 'Unsupported format'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/feedback/rate', methods=['POST'])
def rate_prediction():
    try:
        data = request.json
        feedback_system.add_rating(
            data.get('prediction_id'),
            data.get('rating'),
            data.get('comment', '')
        )
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/feedback/report', methods=['POST'])
def report_issue():
    try:
        data = request.json
        feedback_system.add_report(
            data.get('prediction_id'),
            data.get('issue'),
            data.get('details', '')
        )
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/feedback/suggest', methods=['POST'])
def suggest_feature():
    try:
        data = request.json
        feedback_system.add_suggestion(
            data.get('feature'),
            data.get('description', '')
        )
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/feedback/stats')
def feedback_stats():
    return jsonify(feedback_system.get_stats())

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)