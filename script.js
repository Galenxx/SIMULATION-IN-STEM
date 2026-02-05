/* ========================================
   ML Playground - Global Scripts
   ======================================== */

// ========================================
// Generative Background - Mesh Network
// ========================================
class MeshBackground {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null, radius: 150 };
        this.particleCount = 80;
        this.connectionDistance = 120;
        this.animationId = null;
        
        this.init();
        this.animate();
        this.setupEventListeners();
    }
    
    init() {
        this.resize();
        this.createParticles();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.resize();
            this.createParticles();
        });
        
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        
        window.addEventListener('mouseout', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw particles
        this.particles.forEach((particle, i) => {
            // Mouse interaction - particles flee from cursor
            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = particle.x - this.mouse.x;
                const dy = particle.y - this.mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.mouse.radius) {
                    const force = (this.mouse.radius - distance) / this.mouse.radius;
                    const angle = Math.atan2(dy, dx);
                    particle.vx += Math.cos(angle) * force * 0.5;
                    particle.vy += Math.sin(angle) * force * 0.5;
                }
            }
            
            // Apply friction
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            
            // Restore original velocity
            particle.vx += (Math.random() - 0.5) * 0.02;
            particle.vy += (Math.random() - 0.5) * 0.02;
            
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Boundary check
            if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;
            
            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(102, 126, 234, ${particle.opacity})`;
            this.ctx.fill();
            
            // Connect particles
            for (let j = i + 1; j < this.particles.length; j++) {
                const other = this.particles[j];
                const dx = particle.x - other.x;
                const dy = particle.y - other.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.connectionDistance) {
                    const opacity = (1 - distance / this.connectionDistance) * 0.3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(other.x, other.y);
                    this.ctx.strokeStyle = `rgba(102, 126, 234, ${opacity})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
        });
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    destroy() {
        cancelAnimationFrame(this.animationId);
    }
}

// ========================================
// Hero Canvas Animation
// ========================================
class HeroAnimation {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.points = [];
        this.line = { slope: 0.7, intercept: 100 };
        this.time = 0;
        
        this.init();
        this.animate();
    }
    
    init() {
        this.resize();
        this.generatePoints();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }
    
    generatePoints() {
        this.points = [];
        const count = 20;
        
        for (let i = 0; i < count; i++) {
            const x = Math.random() * 0.8 + 0.1;
            const y = x * 0.7 + (Math.random() - 0.5) * 0.3 + 0.15;
            this.points.push({
                x: x,
                y: y,
                targetY: y,
                phase: Math.random() * Math.PI * 2,
                class: Math.random() > 0.5 ? 'red' : 'blue'
            });
        }
    }
    
    animate() {
        this.time += 0.02;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const w = this.canvas.width;
        const h = this.canvas.height;
        const padding = 40;
        
        // Draw grid
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= 10; i++) {
            const x = padding + (w - padding * 2) * (i / 10);
            const y = padding + (h - padding * 2) * (i / 10);
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, padding);
            this.ctx.lineTo(x, h - padding);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(padding, y);
            this.ctx.lineTo(w - padding, y);
            this.ctx.stroke();
        }
        
        // Animate line
        const lineSlope = 0.7 + Math.sin(this.time * 0.5) * 0.1;
        const lineIntercept = 0.15 + Math.sin(this.time * 0.3) * 0.05;
        
        // Draw regression line
        this.ctx.beginPath();
        this.ctx.moveTo(padding, h - padding - (lineIntercept) * (h - padding * 2));
        this.ctx.lineTo(w - padding, h - padding - (lineSlope + lineIntercept) * (h - padding * 2));
        this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Draw points with floating animation
        this.points.forEach((point, i) => {
            const floatY = Math.sin(this.time * 2 + point.phase) * 0.01;
            const x = padding + point.x * (w - padding * 2);
            const y = h - padding - (point.y + floatY) * (h - padding * 2);
            
            // Glow
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 20);
            const color = point.class === 'red' ? '255, 71, 87' : '59, 130, 246';
            gradient.addColorStop(0, `rgba(${color}, 0.4)`);
            gradient.addColorStop(1, `rgba(${color}, 0)`);
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 20, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // Point
            this.ctx.beginPath();
            this.ctx.arc(x, y, 6, 0, Math.PI * 2);
            this.ctx.fillStyle = point.class === 'red' ? '#ff4757' : '#3b82f6';
            this.ctx.fill();
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

// ========================================
// Magnetic Button Effect - FIXED: Skip dropdown parents
// ========================================
class MagneticButton {
    constructor(element) {
        this.element = element;
        this.boundingRect = null;
        this.magnetStrength = 0.3;
        
        // CRITICAL FIX: Skip magnetic effect on dropdown parents
        // This prevents the button from "flying away" when hovering
        if (element.classList.contains('has-dropdown')) {
            return; // Don't apply magnetic effect to dropdown triggers
        }
        
        this.init();
    }
    
    init() {
        this.element.addEventListener('mouseenter', () => this.onEnter());
        this.element.addEventListener('mousemove', (e) => this.onMove(e));
        this.element.addEventListener('mouseleave', () => this.onLeave());
    }
    
    onEnter() {
        this.boundingRect = this.element.getBoundingClientRect();
    }
    
    onMove(e) {
        if (!this.boundingRect) return;
        
        const centerX = this.boundingRect.left + this.boundingRect.width / 2;
        const centerY = this.boundingRect.top + this.boundingRect.height / 2;
        
        const deltaX = (e.clientX - centerX) * this.magnetStrength;
        const deltaY = (e.clientY - centerY) * this.magnetStrength;
        
        gsap.to(this.element, {
            x: deltaX,
            y: deltaY,
            duration: 0.3,
            ease: 'power2.out'
        });
    }
    
    onLeave() {
        gsap.to(this.element, {
            x: 0,
            y: 0,
            duration: 0.5,
            ease: 'elastic.out(1, 0.5)'
        });
        this.boundingRect = null;
    }
}

// ========================================
// Responsive Canvas Base Class - GLOBAL FIX
// ========================================
class ResponsiveCanvas {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.options = {
            useDevicePixelRatio: true,
            maintainAspectRatio: false,
            ...options
        };
        
        // Store the logical (CSS) size
        this.logicalWidth = 0;
        this.logicalHeight = 0;
        
        // Device pixel ratio for sharp rendering
        this.dpr = this.options.useDevicePixelRatio ? (window.devicePixelRatio || 1) : 1;
        
        this.resizeObserver = null;
        this.setupResizeObserver();
    }
    
    setupResizeObserver() {
        // Use ResizeObserver for accurate container size tracking
        this.resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === this.canvas.parentElement || entry.target === this.canvas) {
                    this.handleResize();
                }
            }
        });
        
        // Observe the parent container
        const parent = this.canvas.parentElement;
        if (parent) {
            this.resizeObserver.observe(parent);
        }
        
        // Initial resize
        this.handleResize();
        
        // Also handle window resize as fallback
        window.addEventListener('resize', () => this.handleResize());
    }
    
    handleResize() {
        const container = this.canvas.parentElement;
        if (!container) return;
        
        // Get the container's content area size
        const rect = container.getBoundingClientRect();
        const style = getComputedStyle(container);
        const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
        const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
        
        // Check for header element inside container
        const header = container.querySelector('.canvas-header, .conveyor-header');
        const headerHeight = header ? header.offsetHeight : 0;
        
        // Calculate available space
        let width = rect.width - paddingX;
        let height = rect.height - paddingY - headerHeight;
        
        // Ensure minimum dimensions
        width = Math.max(width, 200);
        height = Math.max(height, 200);
        
        // Store logical dimensions
        this.logicalWidth = width;
        this.logicalHeight = height;
        
        // Set canvas size accounting for device pixel ratio
        // This prevents blurry/stretched canvas
        this.canvas.width = Math.floor(width * this.dpr);
        this.canvas.height = Math.floor(height * this.dpr);
        
        // Set CSS size to match logical size
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        
        // Scale context to account for DPR
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        
        // Trigger callback if provided
        if (this.onResize) {
            this.onResize(width, height);
        }
    }
    
    // CRITICAL FIX: Accurate mouse position calculation
    getMousePos(event) {
        const rect = this.canvas.getBoundingClientRect();
        
        // Calculate scale factors between CSS size and actual canvas content
        const scaleX = this.logicalWidth / rect.width;
        const scaleY = this.logicalHeight / rect.height;
        
        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    }
    
    // Alias for backwards compatibility
    get width() {
        return this.logicalWidth;
    }
    
    get height() {
        return this.logicalHeight;
    }
    
    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
}

// Export globally for lab pages
window.ResponsiveCanvas = ResponsiveCanvas;

// ========================================
// Lab Preview Animations
// ========================================
class LabPreviewAnimations {
    constructor() {
        this.previews = document.querySelectorAll('.lab-preview-canvas');
        this.previews.forEach(canvas => this.initPreview(canvas));
    }
    
    initPreview(canvas) {
        const type = canvas.dataset.preview;
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width || 280;
        canvas.height = rect.height || 160;
        
        switch(type) {
            case 'linear':
                this.animateLinear(canvas, ctx);
                break;
            case 'logistic':
                this.animateLogistic(canvas, ctx);
                break;
            case 'tree':
                this.animateTree(canvas, ctx);
                break;
            case 'svm':
                this.animateSVM(canvas, ctx);
                break;
            case 'knn':
                this.animateKNN(canvas, ctx);
                break;
            case 'kmeans':
                this.animateKMeans(canvas, ctx);
                break;
            case 'association':
                this.animateAssociation(canvas, ctx);
                break;
        }
    }
    
    animateLinear(canvas, ctx) {
        let time = 0;
        const points = [];
        
        for (let i = 0; i < 12; i++) {
            const x = Math.random() * 0.7 + 0.15;
            points.push({
                x: x,
                y: x * 0.6 + (Math.random() - 0.5) * 0.2 + 0.2
            });
        }
        
        const animate = () => {
            time += 0.02;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const w = canvas.width;
            const h = canvas.height;
            const p = 20;
            
            // Line
            const slope = 0.6 + Math.sin(time) * 0.1;
            ctx.beginPath();
            ctx.moveTo(p, h - p - 0.2 * (h - p * 2));
            ctx.lineTo(w - p, h - p - (slope + 0.2) * (h - p * 2));
            ctx.strokeStyle = 'rgba(102, 126, 234, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Points
            points.forEach(pt => {
                const x = p + pt.x * (w - p * 2);
                const y = h - p - pt.y * (h - p * 2);
                
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#3b82f6';
                ctx.fill();
            });
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    animateLogistic(canvas, ctx) {
        let time = 0;
        
        const animate = () => {
            time += 0.02;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const w = canvas.width;
            const h = canvas.height;
            
            // Sigmoid curve
            ctx.beginPath();
            for (let x = 0; x < w; x++) {
                const normalX = (x - w / 2) / (w / 8);
                const shift = Math.sin(time) * 0.5;
                const y = 1 / (1 + Math.exp(-(normalX + shift)));
                const canvasY = h - 20 - y * (h - 40);
                
                if (x === 0) ctx.moveTo(x, canvasY);
                else ctx.lineTo(x, canvasY);
            }
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Points
            for (let i = 0; i < 8; i++) {
                const x = 30 + i * (w - 60) / 7;
                const isPass = i > 3;
                const y = isPass ? 30 : h - 30;
                
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fillStyle = isPass ? '#10b981' : '#ff4757';
                ctx.fill();
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    animateTree(canvas, ctx) {
        let time = 0;
        
        const animate = () => {
            time += 0.01;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const w = canvas.width;
            const h = canvas.height;
            
            // Tree structure
            const drawNode = (x, y, radius, color) => {
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
            };
            
            const drawLine = (x1, y1, x2, y2) => {
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 2;
                ctx.stroke();
            };
            
            // Root
            drawLine(w / 2, 30, w / 4, 70);
            drawLine(w / 2, 30, w * 3 / 4, 70);
            drawNode(w / 2, 30, 10, '#667eea');
            
            // Level 1
            drawLine(w / 4, 70, w / 6, 110);
            drawLine(w / 4, 70, w / 3, 110);
            drawLine(w * 3 / 4, 70, w * 2 / 3, 110);
            drawLine(w * 3 / 4, 70, w * 5 / 6, 110);
            
            const pulse = Math.sin(time * 3) * 0.3 + 0.7;
            drawNode(w / 4, 70, 8, `rgba(59, 130, 246, ${pulse})`);
            drawNode(w * 3 / 4, 70, 8, `rgba(59, 130, 246, ${pulse})`);
            
            // Leaves
            drawNode(w / 6, 110, 6, '#10b981');
            drawNode(w / 3, 110, 6, '#ff4757');
            drawNode(w * 2 / 3, 110, 6, '#10b981');
            drawNode(w * 5 / 6, 110, 6, '#10b981');
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    animateSVM(canvas, ctx) {
        let time = 0;
        
        const animate = () => {
            time += 0.02;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const w = canvas.width;
            const h = canvas.height;
            
            // Decision boundary
            const angle = Math.sin(time * 0.5) * 0.2;
            const midY = h / 2 + Math.cos(time) * 10;
            
            ctx.save();
            ctx.translate(w / 2, midY);
            ctx.rotate(angle);
            
            // Margin
            ctx.fillStyle = 'rgba(102, 126, 234, 0.1)';
            ctx.fillRect(-w, -25, w * 2, 50);
            
            // Line
            ctx.beginPath();
            ctx.moveTo(-w, 0);
            ctx.lineTo(w, 0);
            ctx.strokeStyle = '#667eea';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Margin lines
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(-w, -25);
            ctx.lineTo(w, -25);
            ctx.moveTo(-w, 25);
            ctx.lineTo(w, 25);
            ctx.strokeStyle = 'rgba(102, 126, 234, 0.5)';
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.restore();
            
            // Points
            const redPoints = [[40, 30], [60, 50], [50, 40], [70, 35]];
            const bluePoints = [[w - 40, h - 30], [w - 60, h - 50], [w - 50, h - 40], [w - 70, h - 35]];
            
            redPoints.forEach(([x, y]) => {
                ctx.beginPath();
                ctx.arc(x, y, 6, 0, Math.PI * 2);
                ctx.fillStyle = '#ff4757';
                ctx.fill();
            });
            
            bluePoints.forEach(([x, y]) => {
                ctx.beginPath();
                ctx.arc(x, y, 6, 0, Math.PI * 2);
                ctx.fillStyle = '#3b82f6';
                ctx.fill();
            });
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    animateKNN(canvas, ctx) {
        let time = 0;
        
        const animate = () => {
            time += 0.02;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const w = canvas.width;
            const h = canvas.height;
            
            // Query point
            const qx = w / 2 + Math.cos(time) * 30;
            const qy = h / 2 + Math.sin(time * 0.7) * 20;
            
            // Static points
            const points = [
                { x: 50, y: 40, c: 'red' },
                { x: 70, y: 80, c: 'red' },
                { x: 100, y: 50, c: 'red' },
                { x: w - 50, y: h - 40, c: 'blue' },
                { x: w - 70, y: h - 80, c: 'blue' },
                { x: w - 100, y: h - 50, c: 'blue' },
                { x: w / 2 - 30, y: h / 2 + 20, c: 'red' },
                { x: w / 2 + 40, y: h / 2 - 30, c: 'blue' }
            ];
            
            // Find 3 nearest
            const distances = points.map((p, i) => ({
                ...p,
                dist: Math.sqrt((p.x - qx) ** 2 + (p.y - qy) ** 2),
                index: i
            })).sort((a, b) => a.dist - b.dist).slice(0, 3);
            
            // Draw connections
            distances.forEach(p => {
                ctx.beginPath();
                ctx.moveTo(qx, qy);
                ctx.lineTo(p.x, p.y);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 2;
                ctx.stroke();
            });
            
            // Draw radius
            const radius = distances[2].dist;
            ctx.beginPath();
            ctx.arc(qx, qy, radius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(102, 126, 234, 0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Draw points
            points.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
                ctx.fillStyle = p.c === 'red' ? '#ff4757' : '#3b82f6';
                ctx.fill();
            });
            
            // Query point
            ctx.beginPath();
            ctx.arc(qx, qy, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#f59e0b';
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', qx, qy);
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    animateKMeans(canvas, ctx) {
        let time = 0;
        const points = [];
        const centroids = [
            { x: 0.25, y: 0.3, color: '#ff4757' },
            { x: 0.75, y: 0.7, color: '#3b82f6' },
            { x: 0.5, y: 0.5, color: '#10b981' }
        ];
        
        // Generate clustered points
        centroids.forEach((c, ci) => {
            for (let i = 0; i < 8; i++) {
                points.push({
                    x: c.x + (Math.random() - 0.5) * 0.3,
                    y: c.y + (Math.random() - 0.5) * 0.3,
                    cluster: ci
                });
            }
        });
        
        const animate = () => {
            time += 0.02;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const w = canvas.width;
            const h = canvas.height;
            const p = 20;
            
            // Animate centroids
            centroids.forEach((c, i) => {
                c.x += Math.sin(time + i) * 0.002;
                c.y += Math.cos(time + i) * 0.002;
            });
            
            // Draw points
            points.forEach(pt => {
                const x = p + pt.x * (w - p * 2);
                const y = p + pt.y * (h - p * 2);
                
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fillStyle = centroids[pt.cluster].color;
                ctx.fill();
            });
            
            // Draw centroids
            centroids.forEach(c => {
                const x = p + c.x * (w - p * 2);
                const y = p + c.y * (h - p * 2);
                
                ctx.beginPath();
                ctx.moveTo(x - 8, y - 8);
                ctx.lineTo(x + 8, y + 8);
                ctx.moveTo(x + 8, y - 8);
                ctx.lineTo(x - 8, y + 8);
                ctx.strokeStyle = c.color;
                ctx.lineWidth = 3;
                ctx.stroke();
            });
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    animateAssociation(canvas, ctx) {
        let time = 0;
        
        const nodes = [
            { x: 0.5, y: 0.3, label: '🍺' },
            { x: 0.25, y: 0.7, label: '🧷' },
            { x: 0.75, y: 0.7, label: '🥛' },
            { x: 0.5, y: 0.85, label: '🍞' }
        ];
        
        const connections = [
            { from: 0, to: 1, strength: 0.8 },
            { from: 1, to: 3, strength: 0.5 },
            { from: 2, to: 3, strength: 0.9 }
        ];
        
        const animate = () => {
            time += 0.02;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const w = canvas.width;
            const h = canvas.height;
            const p = 30;
            
            // Draw connections
            connections.forEach(conn => {
                const from = nodes[conn.from];
                const to = nodes[conn.to];
                const pulse = (Math.sin(time * 2) + 1) / 2;
                
                ctx.beginPath();
                ctx.moveTo(p + from.x * (w - p * 2), p + from.y * (h - p * 2));
                ctx.lineTo(p + to.x * (w - p * 2), p + to.y * (h - p * 2));
                ctx.strokeStyle = `rgba(102, 126, 234, ${conn.strength * 0.5 + pulse * 0.3})`;
                ctx.lineWidth = conn.strength * 4;
                ctx.stroke();
            });
            
            // Draw nodes
            nodes.forEach(node => {
                const x = p + node.x * (w - p * 2);
                const y = p + node.y * (h - p * 2);
                
                ctx.beginPath();
                ctx.arc(x, y, 18, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(26, 26, 36, 0.9)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(node.label, x, y);
            });
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
}

// ========================================
// Bottom Navigation Controller
// ========================================
class BottomNavigation {
    constructor() {
        this.nav = document.querySelector('.bottom-nav');
        if (!this.nav) return;
        
        this.init();
    }
    
    init() {
        // Set active state based on current page
        this.setActiveState();
        
        // Setup dropdown interactions
        this.setupDropdowns();
        
        // Hide nav on scroll down, show on scroll up
        this.setupScrollBehavior();
    }
    
    setActiveState() {
        const currentPath = window.location.pathname;
        const navItems = this.nav.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.classList.remove('active');
            
            const href = item.getAttribute('href');
            if (href) {
                // Check if current page matches this nav item
                if (currentPath.endsWith(href) || 
                    (currentPath.endsWith('/') && href === 'index.html') ||
                    (currentPath.includes('index.html') && href === 'index.html')) {
                    item.classList.add('active');
                }
            }
            
            // Check dropdown items
            const dropdown = item.querySelector('.nav-dropdown');
            if (dropdown) {
                dropdown.querySelectorAll('.dropdown-item').forEach(dropItem => {
                    const dropHref = dropItem.getAttribute('href');
                    if (dropHref && currentPath.includes(dropHref.replace('../', '').replace('./', ''))) {
                        dropItem.style.background = 'rgba(102, 126, 234, 0.2)';
                    }
                });
            }
        });
    }
    
    setupDropdowns() {
        const dropdownItems = this.nav.querySelectorAll('.has-dropdown');
        
        dropdownItems.forEach(item => {
            const dropdown = item.querySelector('.nav-dropdown');
            if (!dropdown) return;
            
            // CRITICAL FIX: Remove magnetic class from dropdown parents
            // This prevents the button from moving when hovering
            item.classList.remove('magnetic');
            
            // Track hover state
            let isHoveringItem = false;
            let isHoveringDropdown = false;
            let hideTimeout = null;
            
            const showDropdown = () => {
                clearTimeout(hideTimeout);
                dropdown.classList.add('visible');
                dropdown.style.opacity = '1';
                dropdown.style.visibility = 'visible';
                dropdown.style.transform = 'translateX(-50%) translateY(0)';
                dropdown.style.pointerEvents = 'auto';
            };
            
            const hideDropdown = () => {
                hideTimeout = setTimeout(() => {
                    if (!isHoveringItem && !isHoveringDropdown) {
                        dropdown.classList.remove('visible');
                        dropdown.style.opacity = '0';
                        dropdown.style.visibility = 'hidden';
                        dropdown.style.transform = 'translateX(-50%) translateY(10px)';
                        dropdown.style.pointerEvents = 'none';
                    }
                }, 100);
            };
            
            // Item hover
            item.addEventListener('mouseenter', () => {
                isHoveringItem = true;
                showDropdown();
            });
            
            item.addEventListener('mouseleave', () => {
                isHoveringItem = false;
                hideDropdown();
            });
            
            // Dropdown hover (keep open when moving to dropdown)
            dropdown.addEventListener('mouseenter', () => {
                isHoveringDropdown = true;
                showDropdown();
            });
            
            dropdown.addEventListener('mouseleave', () => {
                isHoveringDropdown = false;
                hideDropdown();
            });
            
            // Touch support for mobile
            item.addEventListener('touchstart', (e) => {
                const isOpen = dropdown.classList.contains('visible');
                
                // Close all other dropdowns first
                document.querySelectorAll('.nav-dropdown').forEach(d => {
                    if (d !== dropdown) {
                        d.classList.remove('visible');
                        d.style.opacity = '0';
                        d.style.visibility = 'hidden';
                    }
                });
                
                if (!isOpen) {
                    e.preventDefault();
                    showDropdown();
                }
            });
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.has-dropdown')) {
                document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
                    dropdown.classList.remove('visible');
                    dropdown.style.opacity = '0';
                    dropdown.style.visibility = 'hidden';
                    dropdown.style.pointerEvents = 'none';
                });
            }
        });
    }
    
    setupScrollBehavior() {
        let lastScroll = 0;
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const currentScroll = window.pageYOffset;
                    
                    if (currentScroll > lastScroll && currentScroll > 100) {
                        // Scrolling down
                        this.nav.style.transform = 'translateX(-50%) translateY(100%)';
                    } else {
                        // Scrolling up
                        this.nav.style.transform = 'translateX(-50%) translateY(0)';
                    }
                    
                    lastScroll = currentScroll;
                    ticking = false;
                });
                
                ticking = true;
            }
        });
    }
}

// ========================================
// Page Transition Effects
// ========================================
class PageTransitions {
    constructor() {
        this.init();
    }
    
    init() {
        // Fade in on page load
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.3s ease';
        
        window.addEventListener('load', () => {
            document.body.style.opacity = '1';
        });
        
        // Animate elements on scroll
        this.setupScrollAnimations();
    }
    
    setupScrollAnimations() {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        // Observe feature cards and lab cards
        document.querySelectorAll('.feature-card, .lab-card, .panel').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(el);
        });
    }
}

// Add CSS for animate-in class
const animateStyles = document.createElement('style');
animateStyles.textContent = `
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
    
    .bottom-nav {
        transition: transform 0.3s ease;
    }
`;
document.head.appendChild(animateStyles);

// ========================================
// Initialize on DOM Ready
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize background
    const bgCanvas = document.getElementById('bg-canvas');
    if (bgCanvas) {
        new MeshBackground(bgCanvas);
    }
    
    // Initialize hero animation
    const heroCanvas = document.getElementById('hero-canvas');
    if (heroCanvas) {
        new HeroAnimation(heroCanvas);
    }
    
    // Initialize magnetic buttons (only if GSAP is loaded)
    // CRITICAL FIX: Skip dropdown parents to prevent layout breaking
    if (typeof gsap !== 'undefined') {
        document.querySelectorAll('.magnetic').forEach(el => {
            // Skip elements with dropdowns - they shouldn't move
            if (!el.classList.contains('has-dropdown')) {
                new MagneticButton(el);
            }
        });
    }
    
    // Initialize lab preview animations (only on home page)
    const labPreviews = document.querySelectorAll('.lab-preview-canvas');
    if (labPreviews.length > 0) {
        setTimeout(() => {
            new LabPreviewAnimations();
        }, 100);
    }
    
    // Initialize bottom navigation
    new BottomNavigation();
    
    // Initialize page transitions
    new PageTransitions();
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add jelly hover effect to cards
    document.querySelectorAll('[data-tilt]').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    });
});

// Export for use in lab pages
if (typeof module !== 'undefined') {
    module.exports = { MeshBackground, MagneticButton };
}
