// Seasonal Disease Alerts System
const seasonalData = {
    winter: { months: [11, 0, 1], diseases: [
        { name: 'Powdery Mildew', crops: ['Apple', 'Grape'], risk: 'high', icon: '❄️' },
        { name: 'Gray Mold', crops: ['Strawberry', 'Tomato'], risk: 'medium', icon: '🌫️' }
    ]},
    spring: { months: [2, 3, 4], diseases: [
        { name: 'Apple Scab', crops: ['Apple'], risk: 'high', icon: '🌸' },
        { name: 'Early Blight', crops: ['Tomato', 'Potato'], risk: 'medium', icon: '🌱' },
        { name: 'Fire Blight', crops: ['Apple', 'Pear'], risk: 'high', icon: '🔥' }
    ]},
    summer: { months: [5, 6, 7], diseases: [
        { name: 'Late Blight', crops: ['Tomato', 'Potato'], risk: 'high', icon: '☀️' },
        { name: 'Anthracnose', crops: ['Grape', 'Strawberry'], risk: 'medium', icon: '🌞' },
        { name: 'Bacterial Spot', crops: ['Tomato', 'Pepper'], risk: 'high', icon: '💧' }
    ]},
    fall: { months: [8, 9, 10], diseases: [
        { name: 'Black Rot', crops: ['Apple', 'Grape'], risk: 'medium', icon: '🍂' },
        { name: 'Downy Mildew', crops: ['Grape', 'Cucumber'], risk: 'high', icon: '🍁' },
        { name: 'Septoria Leaf Spot', crops: ['Tomato'], risk: 'medium', icon: '🌾' }
    ]}
};

class SeasonalAlerts {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.init();
    }
    
    init() {
        const season = this.getCurrentSeason();
        const alerts = seasonalData[season].diseases;
        
        this.container.innerHTML = `
            <h3>🗓️ ${season.charAt(0).toUpperCase() + season.slice(1)} Disease Alerts</h3>
            <div class="status-card">
                ${alerts.map(alert => this.createAlertCard(alert)).join('')}
                <div class="alert-footer">
                    <p>💡 <strong>Tip:</strong> Monitor your crops regularly during high-risk periods</p>
                </div>
            </div>
        `;
    }
    
    getCurrentSeason() {
        const month = new Date().getMonth();
        for (const [season, data] of Object.entries(seasonalData)) {
            if (data.months.includes(month)) return season;
        }
        return 'spring';
    }
    
    createAlertCard(alert) {
        const riskColor = alert.risk === 'high' ? '#F44336' : '#FF9800';
        
        return `
            <div class="alert-card">
                <div class="alert-icon">${alert.icon}</div>
                <div class="alert-content">
                    <h4>${alert.name}</h4>
                    <p class="alert-crops">${alert.crops.join(', ')}</p>
                </div>
                <span class="alert-badge" style="background: ${riskColor};">
                    ${alert.risk.toUpperCase()}
                </span>
            </div>
        `;
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('seasonalAlerts');
    if (container) new SeasonalAlerts('seasonalAlerts');
});
