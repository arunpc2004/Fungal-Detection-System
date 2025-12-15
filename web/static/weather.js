// Weather Integration with Disease Risk
class WeatherWidget {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        
        this.diseaseRisk = {
            rain: ['Late Blight', 'Downy Mildew', 'Anthracnose'],
            humid: ['Powdery Mildew', 'Gray Mold', 'Leaf Spot'],
            hot: ['Bacterial Spot', 'Wilt', 'Sunscald'],
            cold: ['Frost Damage', 'Root Rot']
        };
        
        this.init();
    }
    
    init() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => this.fetchWeather(pos.coords.latitude, pos.coords.longitude),
                () => this.showDefault()
            );
        } else {
            this.showDefault();
        }
    }
    
    async fetchWeather(lat, lon) {
        try {
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code&timezone=auto`);
            const data = await response.json();
            this.displayWeather(data.current);
        } catch (error) {
            this.showDefault();
        }
    }
    
    displayWeather(weather) {
        const temp = Math.round(weather.temperature_2m);
        const humidity = weather.relative_humidity_2m;
        const rain = weather.precipitation > 0;
        const weatherIcon = this.getWeatherIcon(weather.weather_code);
        
        const risks = this.calculateRisk(temp, humidity, rain);
        const riskLevel = risks.level;
        const riskColor = riskLevel === 'High' ? '#F44336' : riskLevel === 'Medium' ? '#FF9800' : '#4CAF50';
        
        this.container.innerHTML = `
            <div class="status-item">
                <div style="font-size: 32px;">${weatherIcon}</div>
                <span><strong>${temp}°C</strong> | Humidity: ${humidity}%</span>
            </div>
            <div class="status-item">
                <div class="status-dot" style="background: ${riskColor};"></div>
                <span>Disease Risk: <strong style="color: ${riskColor};">${riskLevel}</strong></span>
            </div>
            ${risks.diseases.map(d => `
                <div class="status-item">
                    <div style="font-size: 16px;">⚠️</div>
                    <span style="font-size: 13px;">${d}</span>
                </div>
            `).join('')}
            <div class="alert-footer">
                <p>💡 <strong>Tip:</strong> ${risks.tip}</p>
            </div>
        `;
    }
    
    calculateRisk(temp, humidity, rain) {
        const diseases = [];
        let level = 'Low';
        let tip = 'Good conditions for crops';
        
        if (rain) {
            diseases.push(...this.diseaseRisk.rain.slice(0, 2));
            level = 'High';
            tip = 'High rain increases fungal disease risk. Ensure good drainage';
        } else if (humidity > 80) {
            diseases.push(...this.diseaseRisk.humid.slice(0, 2));
            level = 'High';
            tip = 'High humidity favors fungal growth. Improve air circulation';
        } else if (temp > 30) {
            diseases.push(...this.diseaseRisk.hot.slice(0, 2));
            level = 'Medium';
            tip = 'Hot weather can stress plants. Ensure adequate watering';
        } else if (temp < 10) {
            diseases.push(...this.diseaseRisk.cold.slice(0, 1));
            level = 'Medium';
            tip = 'Cold weather may damage crops. Protect sensitive plants';
        } else if (humidity > 60) {
            diseases.push(this.diseaseRisk.humid[0]);
            level = 'Medium';
            tip = 'Moderate humidity. Monitor for early disease signs';
        }
        
        return { level, diseases, tip };
    }
    
    getWeatherIcon(code) {
        if (code === 0) return '☀️';
        if (code <= 3) return '⛅';
        if (code <= 67) return '🌧️';
        if (code <= 77) return '🌨️';
        if (code <= 99) return '⛈️';
        return '🌤️';
    }
    
    showDefault() {
        this.container.innerHTML = `
            <div class="status-item">
                <div style="font-size: 32px;">🌤️</div>
                <span>Weather data unavailable</span>
            </div>
            <div class="status-item">
                <div class="status-dot" style="background: #4CAF50;"></div>
                <span>Enable location for weather-based disease risk</span>
            </div>
        `;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const widget = document.getElementById('weatherWidget');
    if (widget) new WeatherWidget('weatherWidget');
});
