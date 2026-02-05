/* ========================================
   Linear Regression Lab - Interactive Logic
   ======================================== */

class LinearRegressionLab {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('main-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // State
        this.points = [];
        this.slope = 0.5;
        this.intercept = 0;
        this.currentPhase = 1;
        this.isAnimating = false;
        this.showSquares = false;
        this.showResiduals = false;
        
        // Canvas coordinate system
        this.padding = 60;
        this.xMin = 0;
        this.xMax = 10;
        this.yMin = 0;
        this.yMax = 10;
        
        // Dragging state
        this.isDragging = false;
        this.draggedPoint = null;
        
        // Device pixel ratio for sharp rendering
        this.dpr = window.devicePixelRatio || 1;
        
        // Logical canvas dimensions (CSS pixels)
        this.logicalWidth = 0;
        this.logicalHeight = 0;
        
        this.init();
    }
    
    init() {
        this.setupResizeObserver();
        this.setupEventListeners();
        this.render();
    }
    
    // FIXED: Robust resize handling with devicePixelRatio
    setupResizeObserver() {
        const resizeObserver = new ResizeObserver(() => {
            this.resize();
            this.render();
        });
        
        const container = this.canvas.parentElement;
        if (container) {
            resizeObserver.observe(container);
        }
        
        // Initial resize
        this.resize();
        
        // Fallback for older browsers
        window.addEventListener('resize', () => {
            this.resize();
            this.render();
        });
    }
    
    resize() {
        const container = this.canvas.parentElement;
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        const header = container.querySelector('.canvas-header');
        const headerHeight = header ? header.offsetHeight : 0;
        
        // Calculate available space
        const width = Math.max(rect.width, 300);
        const height = Math.max(rect.height - headerHeight, 300);
        
        // Store logical dimensions
        this.logicalWidth = width;
        this.logicalHeight = height;
        
        // Set actual canvas size (accounting for DPR)
        this.canvas.width = Math.floor(width * this.dpr);
        this.canvas.height = Math.floor(height * this.dpr);
        
        // Set CSS display size
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        
        // Scale context to handle DPR
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
    
    // CRITICAL FIX: Accurate mouse position calculation
    getMousePos(event) {
        const rect = this.canvas.getBoundingClientRect();
        
        // Calculate position relative to canvas, accounting for any CSS scaling
        const scaleX = this.logicalWidth / rect.width;
        const scaleY = this.logicalHeight / rect.height;
        
        return {
            canvasX: (event.clientX - rect.left) * scaleX,
            canvasY: (event.clientY - rect.top) * scaleY
        };
    }
    
    // Coordinate transformations - FIXED: Use logical dimensions
    toCanvasX(x) {
        const scale = (this.logicalWidth - this.padding * 2) / (this.xMax - this.xMin);
        return this.padding + (x - this.xMin) * scale;
    }
    
    toCanvasY(y) {
        const scale = (this.logicalHeight - this.padding * 2) / (this.yMax - this.yMin);
        return this.logicalHeight - this.padding - (y - this.yMin) * scale;
    }
    
    toDataX(canvasX) {
        const scale = (this.logicalWidth - this.padding * 2) / (this.xMax - this.xMin);
        return (canvasX - this.padding) / scale + this.xMin;
    }
    
    toDataY(canvasY) {
        const scale = (this.logicalHeight - this.padding * 2) / (this.yMax - this.yMin);
        return (this.logicalHeight - this.padding - canvasY) / scale + this.yMin;
    }
    
    // Event Listeners
    setupEventListeners() {
        // Canvas interactions
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
        
        // Preset buttons
        document.querySelectorAll('[data-preset]').forEach(btn => {
            btn.addEventListener('click', () => this.handlePreset(btn.dataset.preset));
        });
        
        // Clear button
        document.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
            this.points = [];
            this.updateStats();
            this.render();
        });
        
        // Sliders
        document.getElementById('slope-slider')?.addEventListener('input', (e) => {
            this.slope = parseFloat(e.target.value);
            this.updateFormulaDisplay();
            this.updateStats();
            this.render();
        });
        
        document.getElementById('intercept-slider')?.addEventListener('input', (e) => {
            this.intercept = parseFloat(e.target.value);
            this.updateFormulaDisplay();
            this.updateStats();
            this.render();
        });
        
        // Phase buttons
        document.querySelectorAll('.phase-btn').forEach(btn => {
            btn.addEventListener('click', () => this.setPhase(parseInt(btn.dataset.phase)));
        });
        
        // Gradient descent button
        document.getElementById('run-gradient-descent')?.addEventListener('click', () => {
            this.runGradientDescent();
        });
        
        // Add outlier button
        document.getElementById('add-outlier')?.addEventListener('click', () => {
            this.addOutlier();
        });
        
        // Initialize sliders
        this.updateFormulaDisplay();
    }
    
    // FIXED: Mouse handlers now use getMousePos for accurate positioning
    handleCanvasClick(e) {
        if (this.isDragging) return;
        
        const { canvasX, canvasY } = this.getMousePos(e);
        
        const x = this.toDataX(canvasX);
        const y = this.toDataY(canvasY);
        
        // Only add if within bounds
        if (x >= this.xMin && x <= this.xMax && y >= this.yMin && y <= this.yMax) {
            this.points.push({ x, y });
            this.animatePointAdd(this.points.length - 1);
            this.updateStats();
        }
    }
    
    handleMouseDown(e) {
        const { canvasX, canvasY } = this.getMousePos(e);
        
        // Check if clicking on a point
        for (let i = 0; i < this.points.length; i++) {
            const px = this.toCanvasX(this.points[i].x);
            const py = this.toCanvasY(this.points[i].y);
            const dist = Math.sqrt((canvasX - px) ** 2 + (canvasY - py) ** 2);
            
            if (dist < 15) {
                this.isDragging = true;
                this.draggedPoint = i;
                this.canvas.style.cursor = 'grabbing';
                return;
            }
        }
    }
    
    handleMouseMove(e) {
        const { canvasX, canvasY } = this.getMousePos(e);
        
        if (this.isDragging && this.draggedPoint !== null) {
            const x = Math.max(this.xMin, Math.min(this.xMax, this.toDataX(canvasX)));
            const y = Math.max(this.yMin, Math.min(this.yMax, this.toDataY(canvasY)));
            
            this.points[this.draggedPoint].x = x;
            this.points[this.draggedPoint].y = y;
            this.updateStats();
            this.render();
        } else {
            // Check hover state
            let isOverPoint = false;
            for (const point of this.points) {
                const px = this.toCanvasX(point.x);
                const py = this.toCanvasY(point.y);
                const dist = Math.sqrt((canvasX - px) ** 2 + (canvasY - py) ** 2);
                
                if (dist < 15) {
                    isOverPoint = true;
                    break;
                }
            }
            this.canvas.style.cursor = isOverPoint ? 'grab' : 'crosshair';
        }
    }
    
    handleMouseUp() {
        this.isDragging = false;
        this.draggedPoint = null;
        this.canvas.style.cursor = 'crosshair';
    }
    
    handlePreset(type) {
        // Update button states
        document.querySelectorAll('[data-preset]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.preset === type);
        });
        
        this.points = [];
        const count = 15;
        
        switch(type) {
            case 'positive':
                for (let i = 0; i < count; i++) {
                    const x = Math.random() * 8 + 1;
                    const y = x * 0.8 + (Math.random() - 0.5) * 1.5 + 1;
                    this.points.push({ x, y: Math.max(0.5, Math.min(9.5, y)) });
                }
                break;
            case 'negative':
                for (let i = 0; i < count; i++) {
                    const x = Math.random() * 8 + 1;
                    const y = -x * 0.3 + (Math.random() - 0.5) * 2 + 7;
                    this.points.push({ x, y: Math.max(0.5, Math.min(9.5, y)) });
                }
                break;
            case 'random':
                for (let i = 0; i < count; i++) {
                    const x = Math.random() * 8 + 1;
                    const y = Math.random() * 8 + 1;
                    this.points.push({ x, y });
                }
                break;
            default:
                break;
        }
        
        this.updateStats();
        this.render();
    }
    
    setPhase(phase) {
        this.currentPhase = phase;
        
        // Update UI
        document.querySelectorAll('.phase-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.phase) === phase);
        });
        
        document.querySelectorAll('.narrative-step').forEach(step => {
            step.classList.toggle('active', parseInt(step.dataset.step) === phase);
        });
        
        // Show/hide elements based on phase
        this.showResiduals = phase >= 3;
        this.showSquares = phase >= 3;
        
        const tankPanel = document.getElementById('tank-panel');
        if (tankPanel) {
            tankPanel.style.display = phase >= 3 ? 'block' : 'none';
        }
        
        this.render();
    }
    
    animatePointAdd(index) {
        const point = this.points[index];
        point.scale = 0;
        
        const animate = () => {
            point.scale = Math.min(1, (point.scale || 0) + 0.1);
            this.render();
            
            if (point.scale < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    // Statistics calculations
    calculateStats() {
        if (this.points.length < 2) {
            return { rSquared: null, mse: null, sse: null, fitScore: null };
        }
        
        // Mean values
        const meanX = this.points.reduce((s, p) => s + p.x, 0) / this.points.length;
        const meanY = this.points.reduce((s, p) => s + p.y, 0) / this.points.length;
        
        // Predictions and errors
        let ssRes = 0; // Sum of squared residuals
        let ssTot = 0; // Total sum of squares
        
        this.points.forEach(point => {
            const predicted = this.slope * point.x + this.intercept * 5 + 5; // Scale intercept
            const residual = point.y - predicted;
            ssRes += residual * residual;
            ssTot += (point.y - meanY) * (point.y - meanY);
        });
        
        const mse = ssRes / this.points.length;
        const rSquared = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;
        const fitScore = Math.max(0, Math.min(100, (1 - Math.sqrt(mse) / 5) * 100));
        
        return { rSquared, mse, sse: ssRes, fitScore };
    }
    
    calculateOptimalLine() {
        if (this.points.length < 2) return { slope: 0.5, intercept: 0 };
        
        const n = this.points.length;
        const meanX = this.points.reduce((s, p) => s + p.x, 0) / n;
        const meanY = this.points.reduce((s, p) => s + p.y, 0) / n;
        
        let numerator = 0;
        let denominator = 0;
        
        this.points.forEach(point => {
            numerator += (point.x - meanX) * (point.y - meanY);
            denominator += (point.x - meanX) * (point.x - meanX);
        });
        
        const slope = denominator !== 0 ? numerator / denominator : 0;
        const intercept = (meanY - slope * meanX - 5) / 5; // Normalize to slider range
        
        return { slope, intercept };
    }
    
    updateStats() {
        const stats = this.calculateStats();
        
        document.getElementById('points-count').textContent = this.points.length;
        document.getElementById('r-squared').textContent = stats.rSquared !== null ? 
            (stats.rSquared * 100).toFixed(1) + '%' : '--';
        document.getElementById('mse-value').textContent = stats.mse !== null ? 
            stats.mse.toFixed(3) : '--';
        document.getElementById('fit-score').textContent = stats.fitScore !== null ? 
            stats.fitScore.toFixed(0) + '%' : '--';
        
        // Update tank
        if (stats.sse !== null) {
            const maxSSE = this.points.length * 25; // Approximate max
            const percentage = Math.min(100, (stats.sse / maxSSE) * 100);
            document.getElementById('tank-liquid').style.height = percentage + '%';
            document.getElementById('sse-value').textContent = stats.sse.toFixed(2);
        }
    }
    
    updateFormulaDisplay() {
        const actualIntercept = this.intercept * 5 + 5;
        
        document.getElementById('slope-display').textContent = this.slope.toFixed(2);
        document.getElementById('intercept-display').textContent = actualIntercept.toFixed(2);
        document.getElementById('slope-value').textContent = this.slope.toFixed(2);
        document.getElementById('intercept-value').textContent = actualIntercept.toFixed(2);
    }
    
    // Gradient Descent Animation
    async runGradientDescent() {
        if (this.isAnimating || this.points.length < 2) return;
        
        this.isAnimating = true;
        const btn = document.getElementById('run-gradient-descent');
        btn.disabled = true;
        btn.innerHTML = '<span>Running...</span>';
        
        const optimal = this.calculateOptimalLine();
        const startSlope = this.slope;
        const startIntercept = this.intercept;
        const duration = 2000;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(1, elapsed / duration);
            const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            
            this.slope = startSlope + (optimal.slope - startSlope) * eased;
            this.intercept = startIntercept + (optimal.intercept - startIntercept) * eased;
            
            // Update sliders
            document.getElementById('slope-slider').value = this.slope;
            document.getElementById('intercept-slider').value = this.intercept;
            
            this.updateFormulaDisplay();
            this.updateStats();
            this.render();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
                btn.disabled = false;
                btn.innerHTML = '<span>▶ Run Gradient Descent</span>';
            }
        };
        
        animate();
    }
    
    addOutlier() {
        // FIXED: Generate TRUE random outliers (random X and random Y)
        // that are significantly distant from the current trend line
        
        const actualIntercept = this.intercept * 5 + 5;
        
        // Random X position
        const x = Math.random() * 8 + 1;
        
        // Calculate where the line would predict Y
        const predictedY = this.slope * x + actualIntercept;
        
        // Generate Y that's far from the predicted value
        // Either significantly above or below the line
        const direction = Math.random() > 0.5 ? 1 : -1;
        const offset = (Math.random() * 3 + 3) * direction; // 3-6 units away
        
        let y = predictedY + offset;
        
        // Clamp to valid range
        y = Math.max(0.5, Math.min(9.5, y));
        
        // If clamping puts it too close to the line, flip direction
        if (Math.abs(y - predictedY) < 2) {
            y = direction > 0 ? 9 : 1;
        }
        
        this.points.push({ x, y, isOutlier: true });
        this.animatePointAdd(this.points.length - 1);
        this.updateStats();
    }
    
    // Rendering - FIXED: Use logical dimensions
    render() {
        const ctx = this.ctx;
        const w = this.logicalWidth;
        const h = this.logicalHeight;
        
        // Clear canvas (use full scaled size)
        ctx.clearRect(0, 0, w, h);
        
        // Draw grid
        this.drawGrid();
        
        // Draw axes
        this.drawAxes();
        
        // Draw regression line
        this.drawLine();
        
        // Draw residuals and squares (Phase 3+)
        if (this.showResiduals || this.showSquares) {
            this.drawResidualsAndSquares();
        }
        
        // Draw points
        this.drawPoints();
    }
    
    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        
        // Vertical lines - FIXED: Use logicalHeight
        for (let x = this.xMin; x <= this.xMax; x++) {
            const canvasX = this.toCanvasX(x);
            ctx.beginPath();
            ctx.moveTo(canvasX, this.padding);
            ctx.lineTo(canvasX, this.logicalHeight - this.padding);
            ctx.stroke();
        }
        
        // Horizontal lines - FIXED: Use logicalWidth
        for (let y = this.yMin; y <= this.yMax; y++) {
            const canvasY = this.toCanvasY(y);
            ctx.beginPath();
            ctx.moveTo(this.padding, canvasY);
            ctx.lineTo(this.logicalWidth - this.padding, canvasY);
            ctx.stroke();
        }
    }
    
    drawAxes() {
        const ctx = this.ctx;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        
        // X axis - FIXED: Use logical dimensions
        ctx.beginPath();
        ctx.moveTo(this.padding, this.logicalHeight - this.padding);
        ctx.lineTo(this.logicalWidth - this.padding, this.logicalHeight - this.padding);
        ctx.stroke();
        
        // Y axis
        ctx.beginPath();
        ctx.moveTo(this.padding, this.padding);
        ctx.lineTo(this.padding, this.logicalHeight - this.padding);
        ctx.stroke();
        
        // Axis labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        
        // X axis labels
        for (let x = 0; x <= this.xMax; x += 2) {
            const canvasX = this.toCanvasX(x);
            ctx.fillText(x.toString(), canvasX, this.logicalHeight - this.padding + 20);
        }
        
        // Y axis labels
        ctx.textAlign = 'right';
        for (let y = 0; y <= this.yMax; y += 2) {
            const canvasY = this.toCanvasY(y);
            ctx.fillText(y.toString(), this.padding - 10, canvasY + 4);
        }
        
        // Axis titles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('x', this.logicalWidth / 2, this.logicalHeight - 15);
        
        ctx.save();
        ctx.translate(20, this.logicalHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('y', 0, 0);
        ctx.restore();
    }
    
    drawLine() {
        const ctx = this.ctx;
        const actualIntercept = this.intercept * 5 + 5;
        
        // Calculate line endpoints
        const x1 = this.xMin;
        const y1 = this.slope * x1 + actualIntercept;
        const x2 = this.xMax;
        const y2 = this.slope * x2 + actualIntercept;
        
        // Draw line glow
        ctx.beginPath();
        ctx.moveTo(this.toCanvasX(x1), this.toCanvasY(y1));
        ctx.lineTo(this.toCanvasX(x2), this.toCanvasY(y2));
        ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
        ctx.lineWidth = 8;
        ctx.stroke();
        
        // Draw line
        ctx.beginPath();
        ctx.moveTo(this.toCanvasX(x1), this.toCanvasY(y1));
        ctx.lineTo(this.toCanvasX(x2), this.toCanvasY(y2));
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    
    drawResidualsAndSquares() {
        const ctx = this.ctx;
        const actualIntercept = this.intercept * 5 + 5;
        
        this.points.forEach((point, index) => {
            const predicted = this.slope * point.x + actualIntercept;
            const residual = point.y - predicted;
            
            const px = this.toCanvasX(point.x);
            const py = this.toCanvasY(point.y);
            const predY = this.toCanvasY(predicted);
            
            // Draw residual line
            if (this.showResiduals) {
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(px, predY);
                ctx.strokeStyle = residual > 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(255, 71, 87, 0.8)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            
            // Draw square
            if (this.showSquares) {
                const squareSize = Math.abs(py - predY);
                const color = residual > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 71, 87, 0.2)';
                const borderColor = residual > 0 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(255, 71, 87, 0.6)';
                
                ctx.fillStyle = color;
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = 1;
                
                if (residual > 0) {
                    // Point above line - draw square to the right
                    ctx.fillRect(px, predY, squareSize, squareSize);
                    ctx.strokeRect(px, predY, squareSize, squareSize);
                } else {
                    // Point below line - draw square to the left
                    ctx.fillRect(px - squareSize, py, squareSize, squareSize);
                    ctx.strokeRect(px - squareSize, py, squareSize, squareSize);
                }
            }
        });
    }
    
    drawPoints() {
        const ctx = this.ctx;
        
        this.points.forEach((point, index) => {
            const x = this.toCanvasX(point.x);
            const y = this.toCanvasY(point.y);
            const scale = point.scale !== undefined ? point.scale : 1;
            const radius = 8 * scale;
            
            // Glow effect
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
            const color = point.isOutlier ? '245, 158, 11' : '59, 130, 246';
            gradient.addColorStop(0, `rgba(${color}, 0.4)`);
            gradient.addColorStop(1, `rgba(${color}, 0)`);
            
            ctx.beginPath();
            ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Point
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = point.isOutlier ? '#f59e0b' : '#3b82f6';
            ctx.fill();
            
            // Border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Hover effect
            if (this.draggedPoint === index) {
                ctx.beginPath();
                ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });
    }
}

// Initialize the lab when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const lab = new LinearRegressionLab();
    
    // Make lab accessible globally for debugging
    window.linearRegressionLab = lab;
});
