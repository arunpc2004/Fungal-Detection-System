// Real-time Confidence Meter Animation
class ConfidenceMeter {
    constructor(containerId, confidence, options = {}) {
        this.container = document.getElementById(containerId);
        this.confidence = parseFloat(confidence) || 0;
        this.options = {
            size: options.size || 180,
            strokeWidth: options.strokeWidth || 12,
            duration: options.duration || 2000,
            ...options
        };
        
        this.init();
    }
    
    init() {
        if (!this.container) return;
        
        const radius = (this.options.size - this.options.strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        
        this.container.innerHTML = `
            <div class="confidence-meter">
                <svg class="confidence-circle" width="${this.options.size}" height="${this.options.size}">
                    <circle class="confidence-bg" 
                        cx="${this.options.size/2}" 
                        cy="${this.options.size/2}" 
                        r="${radius}">
                    </circle>
                    <circle class="confidence-progress ${this.getConfidenceLevel()}" 
                        cx="${this.options.size/2}" 
                        cy="${this.options.size/2}" 
                        r="${radius}"
                        style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${circumference};">
                    </circle>
                </svg>
                <div class="confidence-text">
                    <div class="confidence-value">0%</div>
                    <div class="confidence-label">Confidence</div>
                </div>
            </div>
        `;
        
        this.animate();
    }
    
    animate() {
        const progressCircle = this.container.querySelector('.confidence-progress');
        const valueText = this.container.querySelector('.confidence-value');
        const meter = this.container.querySelector('.confidence-meter');
        
        if (!progressCircle || !valueText) return;
        
        const radius = (this.options.size - this.options.strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (this.confidence / 100) * circumference;
        
        // Animate circle
        setTimeout(() => {
            progressCircle.style.strokeDashoffset = offset;
            meter.classList.add('animating');
        }, 100);
        
        // Animate number
        this.animateValue(valueText, 0, this.confidence, this.options.duration);
    }
    
    animateValue(element, start, end, duration) {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = Math.round(current) + '%';
        }, 16);
    }
    
    getConfidenceLevel() {
        if (this.confidence >= 80) return 'high';
        if (this.confidence >= 50) return 'medium';
        return 'low';
    }
}

// Create confidence meter with details
function createConfidenceMeterWithDetails(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const confidence = parseFloat(data.confidence) || 0;
    const modelAccuracy = parseFloat(data.model_accuracy) || 99.5;
    const processingTime = data.processing_time || '0.2s';
    
    container.innerHTML = `
        <div class="confidence-meter-container">
            <div id="mainMeter"></div>
            <div class="confidence-details">
                <div class="confidence-stat">
                    <div class="confidence-stat-icon">🎯</div>
                    <div class="confidence-stat-content">
                        <div class="confidence-stat-label">Prediction Confidence</div>
                        <div class="confidence-stat-value">${confidence.toFixed(1)}%</div>
                        <div class="confidence-bar">
                            <div class="confidence-bar-fill" style="width: 0%;" data-width="${confidence}%"></div>
                        </div>
                    </div>
                </div>
                <div class="confidence-stat">
                    <div class="confidence-stat-icon">🧠</div>
                    <div class="confidence-stat-content">
                        <div class="confidence-stat-label">Model Accuracy</div>
                        <div class="confidence-stat-value">${modelAccuracy.toFixed(1)}%</div>
                        <div class="confidence-bar">
                            <div class="confidence-bar-fill" style="width: 0%; background: linear-gradient(90deg, #2196F3, #64B5F6);" data-width="${modelAccuracy}%"></div>
                        </div>
                    </div>
                </div>
                <div class="confidence-stat">
                    <div class="confidence-stat-icon">⚡</div>
                    <div class="confidence-stat-content">
                        <div class="confidence-stat-label">Processing Time</div>
                        <div class="confidence-stat-value">${processingTime}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Create main meter
    new ConfidenceMeter('mainMeter', confidence);
    
    // Animate bars
    setTimeout(() => {
        const bars = container.querySelectorAll('.confidence-bar-fill');
        bars.forEach(bar => {
            const width = bar.getAttribute('data-width');
            bar.style.width = width;
        });
    }, 500);
}

// Auto-initialize if data is available
document.addEventListener('DOMContentLoaded', function() {
    const meterContainer = document.getElementById('confidenceMeterContainer');
    if (meterContainer && window.predictionData) {
        createConfidenceMeterWithDetails('confidenceMeterContainer', window.predictionData);
    }
});
