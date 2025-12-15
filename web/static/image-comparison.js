// Before/After Image Comparison Slider
class ImageComparison {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        
        this.slider = this.container.querySelector('.comparison-slider');
        this.beforeImage = this.container.querySelector('.comparison-before');
        this.isDragging = false;
        
        this.init();
    }
    
    init() {
        if (!this.slider || !this.beforeImage) return;
        
        this.slider.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.stopDrag());
        
        this.slider.addEventListener('touchstart', (e) => this.startDrag(e));
        document.addEventListener('touchmove', (e) => this.drag(e));
        document.addEventListener('touchend', () => this.stopDrag());
        
        this.container.addEventListener('click', (e) => this.moveSlider(e));
    }
    
    startDrag(e) {
        this.isDragging = true;
        this.slider.style.cursor = 'grabbing';
        e.preventDefault();
    }
    
    stopDrag() {
        this.isDragging = false;
        this.slider.style.cursor = 'grab';
    }
    
    drag(e) {
        if (!this.isDragging) return;
        this.updatePosition(e);
    }
    
    moveSlider(e) {
        if (e.target === this.slider) return;
        this.updatePosition(e);
    }
    
    updatePosition(e) {
        const rect = this.container.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        
        this.slider.style.left = percentage + '%';
        this.beforeImage.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.image-comparison').forEach((el, i) => {
        if (!el.id) el.id = `comparison-${i}`;
        new ImageComparison(el.id);
    });
});
