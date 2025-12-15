// AI Attention Heatmap Visualization
class Heatmap {
    constructor(containerId, imageUrl) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        
        this.imageUrl = imageUrl;
        this.intensity = 0.6;
        this.init();
    }
    
    init() {
        const canvas = document.createElement('canvas');
        const img = new Image();
        
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            ctx.drawImage(img, 0, 0);
            this.generateHeatmap(ctx, canvas.width, canvas.height);
            
            this.container.innerHTML = `
                <div style="position: relative; display: inline-block;">
                    <img src="${this.imageUrl}" style="width: 100%; display: block;">
                    <canvas id="heatmapCanvas" width="${canvas.width}" height="${canvas.height}" 
                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: ${this.intensity};"></canvas>
                </div>
                <div style="margin-top: 15px; text-align: center;">
                    <label style="color: var(--ink); font-size: 14px; margin-right: 10px;">Intensity:</label>
                    <input type="range" min="0" max="100" value="60" 
                        style="width: 200px; vertical-align: middle;"
                        oninput="document.getElementById('heatmapCanvas').style.opacity = this.value/100">
                    <div style="margin-top: 10px; display: flex; justify-content: center; align-items: center; gap: 5px;">
                        <span style="font-size: 12px; color: var(--muted);">Low</span>
                        <div style="width: 150px; height: 20px; background: linear-gradient(to right, blue, cyan, green, yellow, red); border-radius: 4px;"></div>
                        <span style="font-size: 12px; color: var(--muted);">High</span>
                    </div>
                </div>
            `;
            
            const heatCanvas = document.getElementById('heatmapCanvas');
            heatCanvas.getContext('2d').putImageData(ctx.getImageData(0, 0, canvas.width, canvas.height), 0, 0);
        };
        
        img.src = this.imageUrl;
    }
    
    generateHeatmap(ctx, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Center-focused attention (simulated AI attention)
        const centerX = width / 2;
        const centerY = height / 2;
        const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                
                // Calculate distance from center
                const dx = x - centerX;
                const dy = y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Add some randomness for realistic effect
                const noise = Math.random() * 0.3;
                const attention = Math.max(0, 1 - (dist / maxDist) + noise);
                
                // Apply heatmap colors
                const heatColor = this.getHeatColor(attention);
                data[idx] = heatColor.r;
                data[idx + 1] = heatColor.g;
                data[idx + 2] = heatColor.b;
                data[idx + 3] = 200; // Alpha
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    getHeatColor(value) {
        // Blue -> Cyan -> Green -> Yellow -> Red
        if (value < 0.25) {
            return { r: 0, g: 0, b: 255 * (1 - value * 4) + 255 * value * 4 };
        } else if (value < 0.5) {
            const t = (value - 0.25) * 4;
            return { r: 0, g: 255 * t, b: 255 };
        } else if (value < 0.75) {
            const t = (value - 0.5) * 4;
            return { r: 255 * t, g: 255, b: 255 * (1 - t) };
        } else {
            const t = (value - 0.75) * 4;
            return { r: 255, g: 255 * (1 - t), b: 0 };
        }
    }
}
