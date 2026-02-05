/* ========================================
   K-Nearest Neighbors Lab - Interactive Logic
   ======================================== */

class KNNLab {
    constructor() {
        this.canvas = document.getElementById('main-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Data points
        this.points = [];
        
        // Query point
        this.queryPoint = { x: 5, y: 5 };
        this.hasQuery = true;
        
        // K parameter
        this.k = 3;
        
        // Brush mode
        this.brushMode = 'red'; // 'red', 'blue'
        
        // Interaction state
        this.isDraggingQuery = false;
        this.isPainting = false;
        this.lastPaintTime = 0;
        
        // Canvas coordinates
        this.padding = 60;
        this.dataMin = 0;
        this.dataMax = 10;
        
        // Nearest neighbors cache
        this.nearestNeighbors = [];
        this.kRadius = 0;
        
        // Animation
        this.animationTime = 0;
        this.animationId = null;
        
        // FIXED: Device pixel ratio and logical dimensions
        this.dpr = window.devicePixelRatio || 1;
        this.logicalWidth = 0;
        this.logicalHeight = 0;
        
        this.init();
    }
    
    init() {
        this.setupResizeObserver();
        this.generateClusters();
        this.setupEventListeners();
        this.startAnimation();
    }
    
    // FIXED: Robust resize with ResizeObserver
    setupResizeObserver() {
        const resizeObserver = new ResizeObserver(() => {
            this.resize();
        });
        
        const container = this.canvas.parentElement;
        if (container) {
            resizeObserver.observe(container);
        }
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        const container = this.canvas.parentElement;
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        const header = container.querySelector('.canvas-header');
        const headerHeight = header ? header.offsetHeight : 0;
        
        const width = Math.max(rect.width, 300);
        const height = Math.max(rect.height - headerHeight, 300);
        
        // Store logical dimensions
        this.logicalWidth = width;
        this.logicalHeight = height;
        
        // Set canvas size with DPR
        this.canvas.width = Math.floor(width * this.dpr);
        this.canvas.height = Math.floor(height * this.dpr);
        
        // Set CSS size
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        
        // Scale context
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
    
    // CRITICAL FIX: Accurate mouse position
    getMousePos(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.logicalWidth / rect.width;
        const scaleY = this.logicalHeight / rect.height;
        
        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    }
    
    // Coordinate transformations - FIXED: Use logical dimensions
    toCanvasX(dataX) {
        return this.padding + ((dataX - this.dataMin) / (this.dataMax - this.dataMin)) * 
               (this.logicalWidth - 2 * this.padding);
    }
    
    toCanvasY(dataY) {
        return this.logicalHeight - this.padding - 
               ((dataY - this.dataMin) / (this.dataMax - this.dataMin)) * 
               (this.logicalHeight - 2 * this.padding);
    }
    
    toDataX(canvasX) {
        return this.dataMin + ((canvasX - this.padding) / (this.logicalWidth - 2 * this.padding)) * 
               (this.dataMax - this.dataMin);
    }
    
    toDataY(canvasY) {
        return this.dataMin + ((this.logicalHeight - this.padding - canvasY) / 
               (this.logicalHeight - 2 * this.padding)) * (this.dataMax - this.dataMin);
    }
    
    // Euclidean distance
    distance(p1, p2) {
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    }
    
    // Find K nearest neighbors
    findKNearest() {
        if (this.points.length === 0 || !this.hasQuery) {
            this.nearestNeighbors = [];
            this.kRadius = 0;
            return;
        }
        
        // Calculate distances
        const distances = this.points.map((point, index) => ({
            point,
            index,
            distance: this.distance(this.queryPoint, point)
        }));
        
        // Sort by distance
        distances.sort((a, b) => a.distance - b.distance);
        
        // Get K nearest
        this.nearestNeighbors = distances.slice(0, Math.min(this.k, distances.length));
        
        // K-radius is distance to K-th neighbor
        if (this.nearestNeighbors.length > 0) {
            this.kRadius = this.nearestNeighbors[this.nearestNeighbors.length - 1].distance;
        } else {
            this.kRadius = 0;
        }
    }
    
    // Get prediction based on voting
    getPrediction() {
        if (this.nearestNeighbors.length === 0) return null;
        
        let redCount = 0;
        let blueCount = 0;
        
        this.nearestNeighbors.forEach(neighbor => {
            if (neighbor.point.class === 'red') {
                redCount++;
            } else {
                blueCount++;
            }
        });
        
        return {
            redCount,
            blueCount,
            prediction: redCount > blueCount ? 'red' : (blueCount > redCount ? 'blue' : 'tie')
        };
    }
    
    generateClusters() {
        this.points = [];
        
        // Red cluster (lower-left area)
        for (let i = 0; i < 15; i++) {
            this.points.push({
                x: Math.random() * 3 + 1,
                y: Math.random() * 3 + 1,
                class: 'red'
            });
        }
        
        // Blue cluster (upper-right area)
        for (let i = 0; i < 15; i++) {
            this.points.push({
                x: Math.random() * 3 + 6,
                y: Math.random() * 3 + 6,
                class: 'blue'
            });
        }
        
        // Some scattered points
        for (let i = 0; i < 5; i++) {
            this.points.push({
                x: Math.random() * 4 + 3,
                y: Math.random() * 4 + 3,
                class: Math.random() > 0.5 ? 'red' : 'blue'
            });
        }
        
        this.updateStats();
        this.findKNearest();
        this.updateUI();
    }
    
    generateScattered() {
        this.points = [];
        
        for (let i = 0; i < 30; i++) {
            this.points.push({
                x: Math.random() * 8 + 1,
                y: Math.random() * 8 + 1,
                class: Math.random() > 0.5 ? 'red' : 'blue'
            });
        }
        
        this.updateStats();
        this.findKNearest();
        this.updateUI();
    }
    
    setupEventListeners() {
        // Brush selection
        document.querySelectorAll('.brush-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.brush-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.brushMode = btn.dataset.brush;
            });
        });
        
        // K slider
        document.getElementById('k-slider')?.addEventListener('input', (e) => {
            this.k = parseInt(e.target.value);
            document.getElementById('k-value').textContent = this.k;
            document.getElementById('k-slider-value').textContent = this.k;
            this.findKNearest();
            this.updateUI();
        });
        
        // Canvas interactions
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        // Preset buttons
        document.querySelector('[data-preset="clusters"]')?.addEventListener('click', () => {
            this.generateClusters();
        });
        
        document.querySelector('[data-preset="scattered"]')?.addEventListener('click', () => {
            this.generateScattered();
        });
        
        document.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
            this.points = [];
            this.updateStats();
            this.findKNearest();
            this.updateUI();
        });
    }
    
    // FIXED: Use getMousePos for accurate coordinates
    handleMouseDown(e) {
        const { x: canvasX, y: canvasY } = this.getMousePos(e);
        
        // Check if clicking on query point
        if (this.hasQuery) {
            const qx = this.toCanvasX(this.queryPoint.x);
            const qy = this.toCanvasY(this.queryPoint.y);
            const dist = Math.sqrt((canvasX - qx) ** 2 + (canvasY - qy) ** 2);
            
            if (dist < 25) {
                this.isDraggingQuery = true;
                this.canvas.style.cursor = 'grabbing';
                return;
            }
        }
        
        // Otherwise, start painting
        this.isPainting = true;
        this.addPoint(canvasX, canvasY);
    }
    
    handleMouseMove(e) {
        const { x: canvasX, y: canvasY } = this.getMousePos(e);
        
        if (this.isDraggingQuery) {
            const dataX = this.toDataX(canvasX);
            const dataY = this.toDataY(canvasY);
            
            // Clamp to bounds
            this.queryPoint.x = Math.max(this.dataMin + 0.5, Math.min(this.dataMax - 0.5, dataX));
            this.queryPoint.y = Math.max(this.dataMin + 0.5, Math.min(this.dataMax - 0.5, dataY));
            
            this.findKNearest();
            this.updateUI();
        } else if (this.isPainting) {
            // Throttle painting
            const now = Date.now();
            if (now - this.lastPaintTime > 50) {
                this.addPoint(canvasX, canvasY);
                this.lastPaintTime = now;
            }
        } else {
            // Update cursor
            if (this.hasQuery) {
                const qx = this.toCanvasX(this.queryPoint.x);
                const qy = this.toCanvasY(this.queryPoint.y);
                const dist = Math.sqrt((canvasX - qx) ** 2 + (canvasY - qy) ** 2);
                
                this.canvas.style.cursor = dist < 25 ? 'grab' : 'crosshair';
            }
        }
    }
    
    handleMouseUp() {
        this.isDraggingQuery = false;
        this.isPainting = false;
        this.canvas.style.cursor = 'crosshair';
    }
    
    handleClick(e) {
        // Click handling is done in mousedown for painting
    }
    
    addPoint(canvasX, canvasY) {
        const dataX = this.toDataX(canvasX);
        const dataY = this.toDataY(canvasY);
        
        // Check bounds
        if (dataX < this.dataMin || dataX > this.dataMax || 
            dataY < this.dataMin || dataY > this.dataMax) {
            return;
        }
        
        // Check if too close to existing point
        const minDist = 0.3;
        for (const point of this.points) {
            if (this.distance({ x: dataX, y: dataY }, point) < minDist) {
                return;
            }
        }
        
        this.points.push({
            x: dataX,
            y: dataY,
            class: this.brushMode,
            scale: 0 // For animation
        });
        
        this.updateStats();
        this.findKNearest();
        this.updateUI();
    }
    
    updateStats() {
        document.getElementById('total-points').textContent = this.points.length;
    }
    
    updateUI() {
        const result = this.getPrediction();
        
        if (result) {
            // Update voting bars
            const maxVotes = Math.max(result.redCount, result.blueCount, 1);
            document.getElementById('red-count').textContent = result.redCount;
            document.getElementById('blue-count').textContent = result.blueCount;
            document.getElementById('red-bar').style.height = (result.redCount / this.k * 100) + '%';
            document.getElementById('blue-bar').style.height = (result.blueCount / this.k * 100) + '%';
            
            // Update prediction
            const predEl = document.getElementById('prediction-result');
            if (result.prediction === 'tie') {
                predEl.className = 'prediction-result none';
                predEl.innerHTML = '<span>Tie!</span>';
            } else {
                predEl.className = `prediction-result ${result.prediction}`;
                predEl.innerHTML = `
                    <span class="result-dot ${result.prediction}"></span>
                    <span>Class ${result.prediction === 'red' ? 'A' : 'B'}</span>
                `;
            }
            
            // Update radius display
            document.getElementById('radius-value').textContent = this.kRadius.toFixed(2);
            
            // Update neighbor list
            this.updateNeighborList();
        } else {
            document.getElementById('red-count').textContent = '0';
            document.getElementById('blue-count').textContent = '0';
            document.getElementById('red-bar').style.height = '0%';
            document.getElementById('blue-bar').style.height = '0%';
            document.getElementById('prediction-result').className = 'prediction-result none';
            document.getElementById('prediction-result').innerHTML = '<span>No Query</span>';
            document.getElementById('radius-value').textContent = '--';
            document.getElementById('neighbor-list').innerHTML = `
                <div style="text-align: center; color: var(--color-text-muted); padding: var(--space-lg); font-size: 0.875rem;">
                    Add points and drag the query point
                </div>
            `;
        }
    }
    
    updateNeighborList() {
        const listEl = document.getElementById('neighbor-list');
        
        if (this.nearestNeighbors.length === 0) {
            listEl.innerHTML = `
                <div style="text-align: center; color: var(--color-text-muted); padding: var(--space-lg); font-size: 0.875rem;">
                    No neighbors found
                </div>
            `;
            return;
        }
        
        listEl.innerHTML = this.nearestNeighbors.map((neighbor, i) => `
            <div class="neighbor-item">
                <span style="color: var(--color-text-muted); width: 20px;">#${i + 1}</span>
                <span class="neighbor-dot ${neighbor.point.class}"></span>
                <span style="flex: 1;">Class ${neighbor.point.class === 'red' ? 'A' : 'B'}</span>
                <span style="color: var(--color-text-muted);">d=${neighbor.distance.toFixed(2)}</span>
            </div>
        `).join('');
    }
    
    startAnimation() {
        const animate = () => {
            this.animationTime += 0.02;
            this.render();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }
    
    render() {
        const ctx = this.ctx;
        // FIXED: Use logical dimensions
        const w = this.logicalWidth;
        const h = this.logicalHeight;
        
        ctx.clearRect(0, 0, w, h);
        
        // Draw grid
        this.drawGrid();
        
        // Draw axes
        this.drawAxes();
        
        // Draw K-radius circle
        if (this.hasQuery && this.kRadius > 0) {
            this.drawKRadiusCircle();
        }
        
        // Draw spider web connections
        if (this.hasQuery && this.nearestNeighbors.length > 0) {
            this.drawSpiderWeb();
        }
        
        // Draw data points
        this.drawPoints();
        
        // Draw query point
        if (this.hasQuery) {
            this.drawQueryPoint();
        }
    }
    
    drawGrid() {
        const ctx = this.ctx;
        // FIXED: Use logical dimensions
        const w = this.logicalWidth;
        const h = this.logicalHeight;
        const p = this.padding;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 10; i++) {
            const x = this.toCanvasX(i);
            const y = this.toCanvasY(i);
            
            ctx.beginPath();
            ctx.moveTo(x, p);
            ctx.lineTo(x, h - p);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(p, y);
            ctx.lineTo(w - p, y);
            ctx.stroke();
        }
    }
    
    drawAxes() {
        const ctx = this.ctx;
        // FIXED: Use logical dimensions
        const w = this.logicalWidth;
        const h = this.logicalHeight;
        const p = this.padding;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        
        // X axis
        ctx.beginPath();
        ctx.moveTo(p, h - p);
        ctx.lineTo(w - p, h - p);
        ctx.stroke();
        
        // Y axis
        ctx.beginPath();
        ctx.moveTo(p, p);
        ctx.lineTo(p, h - p);
        ctx.stroke();
        
        // Labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        
        for (let i = 0; i <= 10; i += 2) {
            const x = this.toCanvasX(i);
            ctx.fillText(i.toString(), x, h - p + 20);
        }
        
        ctx.textAlign = 'right';
        for (let i = 0; i <= 10; i += 2) {
            const y = this.toCanvasY(i);
            ctx.fillText(i.toString(), p - 10, y + 4);
        }
        
        // Axis titles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Feature X', w / 2, h - 15);
        
        ctx.save();
        ctx.translate(20, h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Feature Y', 0, 0);
        ctx.restore();
    }
    
    drawKRadiusCircle() {
        const ctx = this.ctx;
        const qx = this.toCanvasX(this.queryPoint.x);
        const qy = this.toCanvasY(this.queryPoint.y);
        
        // FIXED: Convert data radius to canvas radius using logical dimensions
        const scaleX = (this.logicalWidth - 2 * this.padding) / (this.dataMax - this.dataMin);
        const scaleY = (this.logicalHeight - 2 * this.padding) / (this.dataMax - this.dataMin);
        const avgScale = (scaleX + scaleY) / 2;
        const canvasRadius = this.kRadius * avgScale;
        
        // Animated pulsing effect
        const pulse = 1 + Math.sin(this.animationTime * 2) * 0.03;
        const radius = canvasRadius * pulse;
        
        // Draw filled circle
        const gradient = ctx.createRadialGradient(qx, qy, 0, qx, qy, radius);
        gradient.addColorStop(0, 'rgba(245, 158, 11, 0.1)');
        gradient.addColorStop(0.7, 'rgba(245, 158, 11, 0.05)');
        gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
        
        ctx.beginPath();
        ctx.arc(qx, qy, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw circle border
        ctx.beginPath();
        ctx.arc(qx, qy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    drawSpiderWeb() {
        const ctx = this.ctx;
        const qx = this.toCanvasX(this.queryPoint.x);
        const qy = this.toCanvasY(this.queryPoint.y);
        
        this.nearestNeighbors.forEach((neighbor, i) => {
            const px = this.toCanvasX(neighbor.point.x);
            const py = this.toCanvasY(neighbor.point.y);
            
            // Animated line drawing
            const progress = Math.min(1, (this.animationTime * 2) % 3);
            
            // Line gradient based on class
            const color = neighbor.point.class === 'red' ? '255, 71, 87' : '59, 130, 246';
            
            // Glow effect
            ctx.beginPath();
            ctx.moveTo(qx, qy);
            ctx.lineTo(px, py);
            ctx.strokeStyle = `rgba(${color}, 0.2)`;
            ctx.lineWidth = 6;
            ctx.stroke();
            
            // Main line
            ctx.beginPath();
            ctx.moveTo(qx, qy);
            ctx.lineTo(px, py);
            ctx.strokeStyle = `rgba(${color}, 0.8)`;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Distance label at midpoint
            const midX = (qx + px) / 2;
            const midY = (qy + py) / 2;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.roundRect(midX - 20, midY - 10, 40, 20, 4);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = '10px JetBrains Mono';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(neighbor.distance.toFixed(1), midX, midY);
        });
    }
    
    drawPoints() {
        const ctx = this.ctx;
        
        this.points.forEach((point, index) => {
            const x = this.toCanvasX(point.x);
            const y = this.toCanvasY(point.y);
            
            // Animate new points
            if (point.scale !== undefined && point.scale < 1) {
                point.scale = Math.min(1, point.scale + 0.1);
            }
            const scale = point.scale !== undefined ? point.scale : 1;
            
            // Check if this point is a neighbor
            const isNeighbor = this.nearestNeighbors.some(n => n.index === index);
            const radius = isNeighbor ? 10 : 7;
            
            // Glow effect
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.5);
            const color = point.class === 'red' ? '255, 71, 87' : '59, 130, 246';
            gradient.addColorStop(0, `rgba(${color}, ${isNeighbor ? 0.5 : 0.3})`);
            gradient.addColorStop(1, `rgba(${color}, 0)`);
            
            ctx.beginPath();
            ctx.arc(x, y, radius * 2.5 * scale, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Point
            ctx.beginPath();
            ctx.arc(x, y, radius * scale, 0, Math.PI * 2);
            ctx.fillStyle = point.class === 'red' ? '#ff4757' : '#3b82f6';
            ctx.fill();
            
            // Border
            ctx.strokeStyle = isNeighbor ? 'white' : 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = isNeighbor ? 3 : 2;
            ctx.stroke();
            
            // Neighbor indicator ring
            if (isNeighbor) {
                const pulseRadius = radius + 5 + Math.sin(this.animationTime * 4) * 2;
                ctx.beginPath();
                ctx.arc(x, y, pulseRadius * scale, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(${color}, 0.5)`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });
    }
    
    drawQueryPoint() {
        const ctx = this.ctx;
        const x = this.toCanvasX(this.queryPoint.x);
        const y = this.toCanvasY(this.queryPoint.y);
        
        const pulse = 1 + Math.sin(this.animationTime * 3) * 0.1;
        const radius = 18 * pulse;
        
        // Outer glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
        gradient.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
        gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.2)');
        gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
        
        ctx.beginPath();
        ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Main circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        
        // Border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Question mark
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', x, y);
        
        // Drag hint (when idle)
        if (!this.isDraggingQuery) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = '10px Inter';
            ctx.fillText('drag me', x, y + radius + 15);
        }
    }
}

// Polyfill for roundRect if not available
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const lab = new KNNLab();
    window.knnLab = lab;
});
