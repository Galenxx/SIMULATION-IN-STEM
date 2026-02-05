/* ========================================
   Support Vector Machines Lab
   ======================================== */

class SVMLab {
    constructor() {
        this.canvas = document.getElementById('main-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Data points
        this.points = [];
        
        // SVM parameters
        this.kernel = 'linear'; // 'linear' or 'rbf'
        this.C = 1.0; // Regularization parameter
        this.gamma = 0.5; // RBF kernel parameter
        
        // Decision boundary parameters (for linear)
        this.weights = { w1: 0, w2: 1, b: 0 };
        
        // Support vectors
        this.supportVectors = [];
        this.margin = 0;
        
        // Interaction state
        this.selectedClass = 'red';
        this.isDragging = false;
        this.draggedPoint = null;
        
        // Canvas coordinates
        this.padding = 60;
        this.dataMin = 0;
        this.dataMax = 10;
        
        // Animation
        this.animationTime = 0;
        
        this.init();
    }
    
    init() {
        this.resize();
        this.generateSeparableData();
        this.setupEventListeners();
        this.startAnimation();
        
        window.addEventListener('resize', () => {
            this.resize();
        });
    }
    
    resize() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        const headerHeight = container.querySelector('.canvas-header')?.offsetHeight || 0;
        
        this.canvas.width = rect.width;
        this.canvas.height = rect.height - headerHeight;
    }
    
    // Coordinate transformations
    toCanvasX(dataX) {
        return this.padding + ((dataX - this.dataMin) / (this.dataMax - this.dataMin)) * 
               (this.canvas.width - 2 * this.padding);
    }
    
    toCanvasY(dataY) {
        return this.canvas.height - this.padding - 
               ((dataY - this.dataMin) / (this.dataMax - this.dataMin)) * 
               (this.canvas.height - 2 * this.padding);
    }
    
    toDataX(canvasX) {
        return this.dataMin + ((canvasX - this.padding) / (this.canvas.width - 2 * this.padding)) * 
               (this.dataMax - this.dataMin);
    }
    
    toDataY(canvasY) {
        return this.dataMin + ((this.canvas.height - this.padding - canvasY) / 
               (this.canvas.height - 2 * this.padding)) * (this.dataMax - this.dataMin);
    }
    
    // Distance from point to hyperplane
    distanceToHyperplane(point) {
        const { w1, w2, b } = this.weights;
        const norm = Math.sqrt(w1 * w1 + w2 * w2);
        if (norm === 0) return 0;
        return (w1 * point.x + w2 * point.y + b) / norm;
    }
    
    // Predict class based on hyperplane
    predict(point) {
        if (this.kernel === 'linear') {
            const { w1, w2, b } = this.weights;
            return (w1 * point.x + w2 * point.y + b) >= 0 ? 'blue' : 'red';
        } else {
            // RBF kernel - use nearest support vectors
            return this.predictRBF(point);
        }
    }
    
    predictRBF(point) {
        if (this.supportVectors.length === 0) {
            // Fallback to simple distance-based classification
            let redDist = Infinity, blueDist = Infinity;
            this.points.forEach(p => {
                const d = Math.sqrt((p.x - point.x) ** 2 + (p.y - point.y) ** 2);
                if (p.class === 'red' && d < redDist) redDist = d;
                if (p.class === 'blue' && d < blueDist) blueDist = d;
            });
            return redDist < blueDist ? 'red' : 'blue';
        }
        
        // Weighted sum of kernel values
        let sum = 0;
        this.supportVectors.forEach(sv => {
            const p = this.points[sv.index];
            const k = this.rbfKernel(point, p);
            sum += sv.alpha * (p.class === 'blue' ? 1 : -1) * k;
        });
        
        return sum >= 0 ? 'blue' : 'red';
    }
    
    rbfKernel(p1, p2) {
        const dist2 = (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
        return Math.exp(-this.gamma * dist2);
    }
    
    // Fit SVM to data
    fitSVM() {
        if (this.points.length < 2) {
            this.supportVectors = [];
            this.margin = 0;
            this.updateUI();
            return;
        }
        
        const redPoints = this.points.filter(p => p.class === 'red');
        const bluePoints = this.points.filter(p => p.class === 'blue');
        
        if (redPoints.length === 0 || bluePoints.length === 0) {
            this.supportVectors = [];
            this.margin = 0;
            this.updateUI();
            return;
        }
        
        if (this.kernel === 'linear') {
            this.fitLinearSVM(redPoints, bluePoints);
        } else {
            this.fitRBFSVM();
        }
        
        this.updateUI();
    }
    
    fitLinearSVM(redPoints, bluePoints) {
        // Simplified SVM: Find optimal separating hyperplane
        // Using the geometric approach for visualization
        
        // Find centroids
        const redCentroid = {
            x: redPoints.reduce((s, p) => s + p.x, 0) / redPoints.length,
            y: redPoints.reduce((s, p) => s + p.y, 0) / redPoints.length
        };
        
        const blueCentroid = {
            x: bluePoints.reduce((s, p) => s + p.x, 0) / bluePoints.length,
            y: bluePoints.reduce((s, p) => s + p.y, 0) / bluePoints.length
        };
        
        // Direction from red to blue centroid
        let dx = blueCentroid.x - redCentroid.x;
        let dy = blueCentroid.y - redCentroid.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        
        if (len > 0) {
            dx /= len;
            dy /= len;
        } else {
            dx = 1;
            dy = 0;
        }
        
        // Weights are perpendicular to decision boundary
        this.weights.w1 = dx;
        this.weights.w2 = dy;
        
        // Find support vectors (points closest to the boundary on each side)
        const midpoint = {
            x: (redCentroid.x + blueCentroid.x) / 2,
            y: (redCentroid.y + blueCentroid.y) / 2
        };
        
        // Bias: hyperplane passes through midpoint
        this.weights.b = -(this.weights.w1 * midpoint.x + this.weights.w2 * midpoint.y);
        
        // Adjust based on C parameter (soft margin)
        // Higher C = less tolerance for misclassification
        const cScale = Math.pow(10, this.C);
        
        // Find support vectors
        this.supportVectors = [];
        
        // Find closest red point to boundary
        let minRedDist = Infinity;
        let closestRed = null;
        redPoints.forEach((p, i) => {
            const dist = Math.abs(this.distanceToHyperplane(p));
            if (dist < minRedDist) {
                minRedDist = dist;
                closestRed = this.points.indexOf(p);
            }
        });
        
        // Find closest blue point to boundary
        let minBlueDist = Infinity;
        let closestBlue = null;
        bluePoints.forEach((p, i) => {
            const dist = Math.abs(this.distanceToHyperplane(p));
            if (dist < minBlueDist) {
                minBlueDist = dist;
                closestBlue = this.points.indexOf(p);
            }
        });
        
        if (closestRed !== null) {
            this.supportVectors.push({ index: closestRed, alpha: 1 });
        }
        if (closestBlue !== null) {
            this.supportVectors.push({ index: closestBlue, alpha: 1 });
        }
        
        // Add more support vectors for points close to margin
        const marginThreshold = Math.max(minRedDist, minBlueDist) * (1.5 / cScale + 1);
        
        this.points.forEach((p, i) => {
            if (i === closestRed || i === closestBlue) return;
            const dist = Math.abs(this.distanceToHyperplane(p));
            if (dist < marginThreshold) {
                this.supportVectors.push({ index: i, alpha: 0.5 });
            }
        });
        
        // Calculate margin (distance between support vectors)
        this.margin = Math.min(minRedDist, minBlueDist) * 2;
        
        // Adjust margin based on C
        this.margin *= (1 + 1 / cScale);
    }
    
    fitRBFSVM() {
        // Simplified RBF: use all points near the "decision boundary" as support vectors
        this.supportVectors = [];
        
        const redPoints = this.points.filter(p => p.class === 'red');
        const bluePoints = this.points.filter(p => p.class === 'blue');
        
        // Find points that are close to the opposite class
        this.points.forEach((p, i) => {
            let minDistToOther = Infinity;
            const otherClass = p.class === 'red' ? bluePoints : redPoints;
            
            otherClass.forEach(other => {
                const dist = Math.sqrt((p.x - other.x) ** 2 + (p.y - other.y) ** 2);
                if (dist < minDistToOther) {
                    minDistToOther = dist;
                }
            });
            
            // Points close to opposite class are support vectors
            const threshold = 3 / Math.pow(10, this.C * 0.5);
            if (minDistToOther < threshold) {
                this.supportVectors.push({ index: i, alpha: 1 / (1 + minDistToOther) });
            }
        });
        
        // If no support vectors found, use closest pair
        if (this.supportVectors.length === 0) {
            let minDist = Infinity;
            let closest = { red: -1, blue: -1 };
            
            redPoints.forEach((rp, ri) => {
                bluePoints.forEach((bp, bi) => {
                    const dist = Math.sqrt((rp.x - bp.x) ** 2 + (rp.y - bp.y) ** 2);
                    if (dist < minDist) {
                        minDist = dist;
                        closest.red = this.points.indexOf(rp);
                        closest.blue = this.points.indexOf(bp);
                    }
                });
            });
            
            if (closest.red >= 0) this.supportVectors.push({ index: closest.red, alpha: 1 });
            if (closest.blue >= 0) this.supportVectors.push({ index: closest.blue, alpha: 1 });
            
            this.margin = minDist;
        } else {
            // Calculate approximate margin
            let totalDist = 0;
            this.supportVectors.forEach(sv => {
                const p = this.points[sv.index];
                const otherClass = p.class === 'red' ? bluePoints : redPoints;
                let minDist = Infinity;
                otherClass.forEach(other => {
                    const dist = Math.sqrt((p.x - other.x) ** 2 + (p.y - other.y) ** 2);
                    if (dist < minDist) minDist = dist;
                });
                totalDist += minDist;
            });
            this.margin = totalDist / this.supportVectors.length;
        }
    }
    
    generateSeparableData() {
        this.points = [];
        
        // Red class (lower-left)
        for (let i = 0; i < 8; i++) {
            this.points.push({
                x: Math.random() * 3 + 1,
                y: Math.random() * 3 + 1,
                class: 'red'
            });
        }
        
        // Blue class (upper-right)
        for (let i = 0; i < 8; i++) {
            this.points.push({
                x: Math.random() * 3 + 6,
                y: Math.random() * 3 + 6,
                class: 'blue'
            });
        }
        
        this.fitSVM();
    }
    
    generateOverlappingData() {
        this.points = [];
        
        // Red class
        for (let i = 0; i < 10; i++) {
            this.points.push({
                x: Math.random() * 5 + 1,
                y: Math.random() * 5 + 1,
                class: 'red'
            });
        }
        
        // Blue class (overlapping region)
        for (let i = 0; i < 10; i++) {
            this.points.push({
                x: Math.random() * 5 + 4,
                y: Math.random() * 5 + 4,
                class: 'blue'
            });
        }
        
        this.fitSVM();
    }
    
    generateCircularData() {
        this.points = [];
        
        // Inner circle (red)
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 1.5 + 0.5;
            this.points.push({
                x: 5 + Math.cos(angle) * r,
                y: 5 + Math.sin(angle) * r,
                class: 'red'
            });
        }
        
        // Outer ring (blue)
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 1.5 + 3;
            this.points.push({
                x: 5 + Math.cos(angle) * r,
                y: 5 + Math.sin(angle) * r,
                class: 'blue'
            });
        }
        
        // Switch to RBF kernel for circular data
        this.kernel = 'rbf';
        document.querySelectorAll('.kernel-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.kernel === 'rbf');
        });
        this.updateKernelDescription();
        
        this.fitSVM();
    }
    
    setupEventListeners() {
        // Class selector
        document.querySelectorAll('.class-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.class-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedClass = btn.dataset.class;
            });
        });
        
        // Kernel toggle
        document.querySelectorAll('.kernel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.kernel-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.kernel = btn.dataset.kernel;
                this.updateKernelDescription();
                this.fitSVM();
            });
        });
        
        // C slider
        document.getElementById('c-slider')?.addEventListener('input', (e) => {
            this.C = parseFloat(e.target.value);
            document.getElementById('c-value').textContent = Math.pow(10, this.C).toFixed(2);
            this.fitSVM();
        });
        
        // Canvas interactions
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        // Preset buttons
        document.querySelector('[data-preset="separable"]')?.addEventListener('click', () => {
            this.kernel = 'linear';
            document.querySelectorAll('.kernel-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.kernel === 'linear');
            });
            this.updateKernelDescription();
            this.generateSeparableData();
        });
        
        document.querySelector('[data-preset="overlap"]')?.addEventListener('click', () => {
            this.kernel = 'linear';
            document.querySelectorAll('.kernel-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.kernel === 'linear');
            });
            this.updateKernelDescription();
            this.generateOverlappingData();
        });
        
        document.querySelector('[data-preset="circular"]')?.addEventListener('click', () => {
            this.generateCircularData();
        });
        
        document.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
            this.points = [];
            this.supportVectors = [];
            this.margin = 0;
            this.updateUI();
        });
    }
    
    updateKernelDescription() {
        const desc = document.getElementById('kernel-description');
        if (this.kernel === 'linear') {
            desc.innerHTML = '<strong>Linear:</strong> Creates a straight line boundary. Best for linearly separable data.';
        } else {
            desc.innerHTML = '<strong>RBF (Radial Basis Function):</strong> Creates curved boundaries. Good for complex, non-linear patterns.';
        }
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        
        // Check if clicking on a support vector
        for (const sv of this.supportVectors) {
            const point = this.points[sv.index];
            const px = this.toCanvasX(point.x);
            const py = this.toCanvasY(point.y);
            const dist = Math.sqrt((canvasX - px) ** 2 + (canvasY - py) ** 2);
            
            if (dist < 20) {
                this.isDragging = true;
                this.draggedPoint = sv.index;
                this.canvas.style.cursor = 'grabbing';
                return;
            }
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        
        if (this.isDragging && this.draggedPoint !== null) {
            const dataX = this.toDataX(canvasX);
            const dataY = this.toDataY(canvasY);
            
            // Clamp to bounds
            this.points[this.draggedPoint].x = Math.max(0.5, Math.min(9.5, dataX));
            this.points[this.draggedPoint].y = Math.max(0.5, Math.min(9.5, dataY));
            
            // Refit SVM
            this.fitSVM();
        } else {
            // Update cursor
            let isOverSV = false;
            for (const sv of this.supportVectors) {
                const point = this.points[sv.index];
                const px = this.toCanvasX(point.x);
                const py = this.toCanvasY(point.y);
                const dist = Math.sqrt((canvasX - px) ** 2 + (canvasY - py) ** 2);
                
                if (dist < 20) {
                    isOverSV = true;
                    break;
                }
            }
            this.canvas.style.cursor = isOverSV ? 'grab' : 'crosshair';
        }
    }
    
    handleMouseUp() {
        this.isDragging = false;
        this.draggedPoint = null;
        this.canvas.style.cursor = 'crosshair';
    }
    
    handleClick(e) {
        if (this.isDragging) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        
        // Check if clicking on existing point
        for (let i = 0; i < this.points.length; i++) {
            const point = this.points[i];
            const px = this.toCanvasX(point.x);
            const py = this.toCanvasY(point.y);
            const dist = Math.sqrt((canvasX - px) ** 2 + (canvasY - py) ** 2);
            
            if (dist < 15) {
                return; // Don't add point, just clicked on existing
            }
        }
        
        const dataX = this.toDataX(canvasX);
        const dataY = this.toDataY(canvasY);
        
        if (dataX >= 0 && dataX <= 10 && dataY >= 0 && dataY <= 10) {
            this.points.push({
                x: dataX,
                y: dataY,
                class: this.selectedClass
            });
            this.fitSVM();
        }
    }
    
    updateUI() {
        // Margin value
        document.getElementById('margin-value').textContent = this.margin.toFixed(2);
        
        // Support vector count
        document.getElementById('sv-count').textContent = this.supportVectors.length;
        
        // Total points
        document.getElementById('total-points').textContent = this.points.length;
        
        // Calculate accuracy
        let correct = 0;
        this.points.forEach(p => {
            const predicted = this.predict(p);
            if (predicted === p.class) correct++;
        });
        
        const accuracy = this.points.length > 0 ? (correct / this.points.length * 100) : 100;
        const misclassified = this.points.length - correct;
        
        document.getElementById('misclassified').textContent = misclassified;
        
        const accEl = document.getElementById('accuracy-value');
        accEl.textContent = accuracy.toFixed(0) + '%';
        accEl.className = 'accuracy-value';
        if (accuracy >= 90) accEl.classList.add('good');
        else if (accuracy >= 70) accEl.classList.add('ok');
        else accEl.classList.add('bad');
    }
    
    startAnimation() {
        const animate = () => {
            this.animationTime += 0.016;
            this.render();
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        ctx.clearRect(0, 0, w, h);
        
        // Draw decision regions
        if (this.points.length >= 2) {
            this.drawDecisionRegions();
        }
        
        // Draw grid
        this.drawGrid();
        
        // Draw axes
        this.drawAxes();
        
        // Draw margin (for linear kernel)
        if (this.kernel === 'linear' && this.supportVectors.length >= 2) {
            this.drawMargin();
        }
        
        // Draw decision boundary
        if (this.points.length >= 2) {
            this.drawDecisionBoundary();
        }
        
        // Draw points
        this.drawPoints();
    }
    
    drawDecisionRegions() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const p = this.padding;
        
        const resolution = 8; // Lower = faster but coarser
        
        for (let canvasX = p; canvasX < w - p; canvasX += resolution) {
            for (let canvasY = p; canvasY < h - p; canvasY += resolution) {
                const dataX = this.toDataX(canvasX);
                const dataY = this.toDataY(canvasY);
                
                const predicted = this.predict({ x: dataX, y: dataY });
                
                if (predicted === 'red') {
                    ctx.fillStyle = 'rgba(255, 71, 87, 0.08)';
                } else {
                    ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
                }
                
                ctx.fillRect(canvasX, canvasY, resolution, resolution);
            }
        }
    }
    
    drawMargin() {
        const ctx = this.ctx;
        const { w1, w2, b } = this.weights;
        
        if (w1 === 0 && w2 === 0) return;
        
        // Calculate margin lines (distance = 1/||w|| from hyperplane)
        const norm = Math.sqrt(w1 * w1 + w2 * w2);
        const marginOffset = this.margin / 2;
        
        // Draw margin area
        ctx.save();
        
        // Draw the "street" between margin lines
        ctx.fillStyle = 'rgba(102, 126, 234, 0.1)';
        
        // Get points on margin lines
        const getLinePoints = (offset) => {
            const points = [];
            for (let x = 0; x <= 10; x += 0.5) {
                // w1*x + w2*y + b + offset*norm = 0
                // y = -(w1*x + b + offset*norm) / w2
                if (Math.abs(w2) > 0.001) {
                    const y = -(w1 * x + b) / w2 + offset / w2 * norm;
                    if (y >= 0 && y <= 10) {
                        points.push({ x, y });
                    }
                }
            }
            return points;
        };
        
        // Draw margin lines
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(102, 126, 234, 0.5)';
        ctx.lineWidth = 2;
        
        [-marginOffset, marginOffset].forEach(offset => {
            ctx.beginPath();
            let started = false;
            
            for (let dataX = 0; dataX <= 10; dataX += 0.1) {
                if (Math.abs(w2) > 0.001) {
                    const dataY = -(w1 * dataX + b) / w2 + offset;
                    if (dataY >= 0 && dataY <= 10) {
                        const canvasX = this.toCanvasX(dataX);
                        const canvasY = this.toCanvasY(dataY);
                        
                        if (!started) {
                            ctx.moveTo(canvasX, canvasY);
                            started = true;
                        } else {
                            ctx.lineTo(canvasX, canvasY);
                        }
                    }
                }
            }
            
            ctx.stroke();
        });
        
        ctx.setLineDash([]);
        ctx.restore();
    }
    
    drawDecisionBoundary() {
        const ctx = this.ctx;
        
        if (this.kernel === 'linear') {
            const { w1, w2, b } = this.weights;
            
            if (w1 === 0 && w2 === 0) return;
            
            // Glow
            ctx.beginPath();
            let started = false;
            
            for (let dataX = -1; dataX <= 11; dataX += 0.1) {
                if (Math.abs(w2) > 0.001) {
                    const dataY = -(w1 * dataX + b) / w2;
                    const canvasX = this.toCanvasX(dataX);
                    const canvasY = this.toCanvasY(dataY);
                    
                    if (!started) {
                        ctx.moveTo(canvasX, canvasY);
                        started = true;
                    } else {
                        ctx.lineTo(canvasX, canvasY);
                    }
                } else if (Math.abs(w1) > 0.001) {
                    const dataX = -b / w1;
                    ctx.moveTo(this.toCanvasX(dataX), this.toCanvasY(0));
                    ctx.lineTo(this.toCanvasX(dataX), this.toCanvasY(10));
                }
            }
            
            ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
            ctx.lineWidth = 8;
            ctx.stroke();
            
            // Main line
            ctx.strokeStyle = '#667eea';
            ctx.lineWidth = 3;
            ctx.stroke();
        } else {
            // RBF: Draw contour where prediction changes
            this.drawRBFBoundary();
        }
    }
    
    drawRBFBoundary() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const p = this.padding;
        
        // Find boundary points using marching squares
        const resolution = 5;
        const boundaryPoints = [];
        
        for (let canvasX = p; canvasX < w - p - resolution; canvasX += resolution) {
            for (let canvasY = p; canvasY < h - p - resolution; canvasY += resolution) {
                const corners = [
                    this.predict({ x: this.toDataX(canvasX), y: this.toDataY(canvasY) }),
                    this.predict({ x: this.toDataX(canvasX + resolution), y: this.toDataY(canvasY) }),
                    this.predict({ x: this.toDataX(canvasX + resolution), y: this.toDataY(canvasY + resolution) }),
                    this.predict({ x: this.toDataX(canvasX), y: this.toDataY(canvasY + resolution) })
                ];
                
                // If not all corners are the same class, there's a boundary
                const hasRed = corners.includes('red');
                const hasBlue = corners.includes('blue');
                
                if (hasRed && hasBlue) {
                    boundaryPoints.push({
                        x: canvasX + resolution / 2,
                        y: canvasY + resolution / 2
                    });
                }
            }
        }
        
        // Draw boundary points
        ctx.fillStyle = 'rgba(102, 126, 234, 0.8)';
        boundaryPoints.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    drawGrid() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
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
        const w = this.canvas.width;
        const h = this.canvas.height;
        const p = this.padding;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(p, h - p);
        ctx.lineTo(w - p, h - p);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(p, p);
        ctx.lineTo(p, h - p);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        
        for (let i = 0; i <= 10; i += 2) {
            ctx.fillText(i.toString(), this.toCanvasX(i), h - p + 20);
        }
        
        ctx.textAlign = 'right';
        for (let i = 0; i <= 10; i += 2) {
            ctx.fillText(i.toString(), p - 10, this.toCanvasY(i) + 4);
        }
    }
    
    drawPoints() {
        const ctx = this.ctx;
        
        // Check which points are support vectors
        const svIndices = new Set(this.supportVectors.map(sv => sv.index));
        
        this.points.forEach((point, index) => {
            const x = this.toCanvasX(point.x);
            const y = this.toCanvasY(point.y);
            const isSV = svIndices.has(index);
            
            const radius = isSV ? 12 : 8;
            const color = point.class === 'red' ? '255, 71, 87' : '59, 130, 246';
            
            // Glow effect
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.5);
            gradient.addColorStop(0, `rgba(${color}, ${isSV ? 0.5 : 0.3})`);
            gradient.addColorStop(1, `rgba(${color}, 0)`);
            
            ctx.beginPath();
            ctx.arc(x, y, radius * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Point
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = point.class === 'red' ? '#ff4757' : '#3b82f6';
            ctx.fill();
            
            // Border
            ctx.strokeStyle = isSV ? '#f59e0b' : 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = isSV ? 3 : 2;
            ctx.stroke();
            
            // Support vector gold halo (animated)
            if (isSV) {
                const pulse = Math.sin(this.animationTime * 3) * 0.3 + 1;
                
                ctx.beginPath();
                ctx.arc(x, y, radius + 6 * pulse, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(245, 158, 11, ${0.5 / pulse})`;
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Second ring
                ctx.beginPath();
                ctx.arc(x, y, radius + 12 * pulse, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(245, 158, 11, ${0.25 / pulse})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const lab = new SVMLab();
    window.svmLab = lab;
});
