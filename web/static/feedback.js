// Feedback & Rating System
class FeedbackWidget {
    constructor(predictionId) {
        this.predictionId = predictionId;
        this.isOpen = false;
    }

    render() {
        const widget = document.createElement('div');
        widget.className = 'feedback-widget';
        widget.innerHTML = `
            <button class="feedback-toggle" onclick="feedbackWidget.toggle()">
                💬 Feedback
            </button>
            <div class="feedback-panel" id="feedbackPanel" style="display: none;">
                <div class="feedback-header">
                    <h4>📊 Rate This Prediction</h4>
                    <button onclick="feedbackWidget.toggle()">&times;</button>
                </div>
                
                <div class="rating-section">
                    <div class="stars" id="starRating">
                        ${[1,2,3,4,5].map(i => `<span class="star" data-rating="${i}">⭐</span>`).join('')}
                    </div>
                    <textarea id="ratingComment" placeholder="Optional comment..." rows="2"></textarea>
                    <button onclick="feedbackWidget.submitRating()">Submit Rating</button>
                </div>

                <div class="report-section">
                    <h4>⚠️ Report Issue</h4>
                    <select id="issueType">
                        <option value="">Select issue type...</option>
                        <option value="wrong_fruit">Wrong Fruit Type</option>
                        <option value="wrong_disease">Wrong Disease</option>
                        <option value="low_confidence">Low Confidence</option>
                        <option value="other">Other</option>
                    </select>
                    <textarea id="issueDetails" placeholder="Describe the issue..." rows="2"></textarea>
                    <button onclick="feedbackWidget.submitReport()">Report Issue</button>
                </div>

                <div class="suggest-section">
                    <h4>💡 Suggest Feature</h4>
                    <input type="text" id="featureName" placeholder="Feature name...">
                    <textarea id="featureDesc" placeholder="Describe your idea..." rows="2"></textarea>
                    <button onclick="feedbackWidget.submitSuggestion()">Submit Idea</button>
                </div>
            </div>
        `;
        return widget;
    }

    toggle() {
        this.isOpen = !this.isOpen;
        const panel = document.getElementById('feedbackPanel');
        panel.style.display = this.isOpen ? 'block' : 'none';
    }

    async submitRating() {
        const rating = document.querySelector('.star.selected')?.dataset.rating;
        if (!rating) {
            alert('Please select a rating');
            return;
        }
        
        const comment = document.getElementById('ratingComment').value;
        
        try {
            const response = await fetch('/api/feedback/rate', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    prediction_id: this.predictionId,
                    rating: parseInt(rating),
                    comment: comment
                })
            });
            
            if (response.ok) {
                this.showSuccess('Thank you for your rating! 🎉');
                document.getElementById('ratingComment').value = '';
                document.querySelectorAll('.star').forEach(s => s.classList.remove('selected'));
            }
        } catch (e) {
            alert('Error submitting rating');
        }
    }

    async submitReport() {
        const issue = document.getElementById('issueType').value;
        const details = document.getElementById('issueDetails').value;
        
        if (!issue) {
            alert('Please select an issue type');
            return;
        }
        
        try {
            const response = await fetch('/api/feedback/report', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    prediction_id: this.predictionId,
                    issue: issue,
                    details: details
                })
            });
            
            if (response.ok) {
                this.showSuccess('Issue reported. We\'ll review it! 🔍');
                document.getElementById('issueType').value = '';
                document.getElementById('issueDetails').value = '';
            }
        } catch (e) {
            alert('Error submitting report');
        }
    }

    async submitSuggestion() {
        const feature = document.getElementById('featureName').value;
        const description = document.getElementById('featureDesc').value;
        
        if (!feature) {
            alert('Please enter a feature name');
            return;
        }
        
        try {
            const response = await fetch('/api/feedback/suggest', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    feature: feature,
                    description: description
                })
            });
            
            if (response.ok) {
                this.showSuccess('Suggestion received! 💡');
                document.getElementById('featureName').value = '';
                document.getElementById('featureDesc').value = '';
            }
        } catch (e) {
            alert('Error submitting suggestion');
        }
    }

    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'feedback-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Initialize on page load
let feedbackWidget;
document.addEventListener('DOMContentLoaded', function() {
    const predictionId = window.predictionId || 'unknown';
    feedbackWidget = new FeedbackWidget(predictionId);
    
    const container = document.querySelector('.result-actions') || document.querySelector('.results-section');
    if (container) {
        container.appendChild(feedbackWidget.render());
        
        // Star rating interaction
        document.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', function() {
                const rating = this.dataset.rating;
                document.querySelectorAll('.star').forEach((s, i) => {
                    s.classList.toggle('selected', i < rating);
                });
            });
        });
    }
});
