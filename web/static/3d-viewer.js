// Simple 3D Image Viewer
class Viewer3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        
        this.model = this.container.querySelector('.model-3d');
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.rotateX = -20;
        this.rotateY = 30;
        
        this.init();
    }
    
    init() {
        this.container.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.stopDrag());
        
        this.container.addEventListener('touchstart', (e) => this.startDrag(e));
        document.addEventListener('touchmove', (e) => this.drag(e));
        document.addEventListener('touchend', () => this.stopDrag());
        
        this.container.addEventListener('wheel', (e) => this.zoom(e));
        
        this.updateTransform();
    }
    
    startDrag(e) {
        this.isDragging = true;
        const touch = e.touches ? e.touches[0] : e;
        this.startX = touch.clientX;
        this.startY = touch.clientY;
        this.container.style.cursor = 'grabbing';
        e.preventDefault();
    }
    
    drag(e) {
        if (!this.isDragging) return;
        
        const touch = e.touches ? e.touches[0] : e;
        const deltaX = touch.clientX - this.startX;
        const deltaY = touch.clientY - this.startY;
        
        this.rotateY += deltaX * 0.5;
        this.rotateX -= deltaY * 0.5;
        
        this.rotateX = Math.max(-90, Math.min(90, this.rotateX));
        
        this.startX = touch.clientX;
        this.startY = touch.clientY;
        
        this.updateTransform();
    }
    
    stopDrag() {
        this.isDragging = false;
        this.container.style.cursor = 'grab';
    }
    
    zoom(e) {
        e.preventDefault();
        const scale = parseFloat(this.model.style.transform.match(/scale\(([^)]+)\)/)?.[1] || 1);
        const newScale = scale + (e.deltaY > 0 ? -0.1 : 0.1);
        this.model.style.transform = `rotateX(${this.rotateX}deg) rotateY(${this.rotateY}deg) scale(${Math.max(0.5, Math.min(2, newScale))})`;
    }
    
    updateTransform() {
        this.model.style.transform = `rotateX(${this.rotateX}deg) rotateY(${this.rotateY}deg)`;
    }
    
    reset() {
        this.rotateX = -20;
        this.rotateY = 30;
        this.updateTransform();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.viewer-3d').forEach((el, i) => {
        if (!el.id) el.id = `viewer3d-${i}`;
        new Viewer3D(el.id);
    });
});
