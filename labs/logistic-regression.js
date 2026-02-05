/* ========================================
   Logistic Regression Lab - Interactive Logic
   ======================================== */

class LogisticRegressionLab {
    constructor() {
        this.canvas = document.getElementById('main-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // View mode: '1d' or '2d'
        this.viewMode = '1d';
        
        // 1D Sigmoid parameters
        this.weight = 1.0;
        this.bias = -5.0;
        
        // 2D Boundary parameters
        this.boundaryAngle = 45;
        this.boundaryPosition = 50;
        this.threshold = 0.5;
        
        // Data points
        this.points1D = [];
        this.points2D = [];
        
        // Interaction state
        this.mouseX = 0;
        this.mouseY = 0;
        this.isDragging = false;
        this.dragTarget = null; // 'curve' for 1D, 'boundary' for 2D
        
        // Canvas dimensions
        this.padding = 60;
        
        this.init();
    }
    
    init() {
        this.resize();
        this.generateData();
        this.setupEventListeners();
        this.render();
        this.updateUI();
        
        window.addEventListener('resize', () => {
            this.resize();
            this.render();
        });
    }
    
    resize() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        const headerHeight = container.querySelector('.canvas-header')?.offsetHeight || 0;
        
        this.canvas.width = rect.width;
        this.canvas.height = rect.height - headerHeight;
    }
    
    // Sigmoid function
    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }
    
    // 1D probability based on study hours
    getProbability1D(studyHours) {
        const z = this.weight * studyHours + this.bias;
        return this.sigmoid(z);
    }
    
    // 2D probability based on study hours and sleep hours
    getProbability2D(studyHours, sleepHours) {
        // Convert angle to radians and create decision boundary
        const angleRad = (this.boundaryAngle * Math.PI) / 180;
        const nx = Math.cos(angleRad);
        const ny = Math.sin(angleRad);
        
        // Boundary passes through position point
        const bx = this.boundaryPosition / 10;
        const by = this.boundaryPosition / 10;
        
        // Distance from point to boundary line
        const distance = nx * (studyHours - bx) + ny * (sleepHours - by);
        
        // Apply sigmoid to distance
        return this.sigmoid(distance * 2);
    }
    
    generateData() {
        // Generate 1D data (Study Hours vs Pass/Fail)
        this.points1D = [];
        
        // Fail students (low study hours)
        for (let i = 0; i < 10; i++) {
            this.points1D.push({
                x: Math.random() * 4 + 1, // 1-5 hours
                label: 0 // fail
            });
        }
        
        // Pass students (high study hours)
        for (let i = 0; i < 10; i++) {
            this.points1D.push({
                x: Math.random() * 4 + 6, // 6-10 hours
                label: 1 // pass
            });
        }
        
        // Some overlap cases
        for (let i = 0; i < 5; i++) {
            this.points1D.push({
                x: Math.random() * 3 + 4, // 4-7 hours
                label: Math.random() > 0.5 ? 1 : 0
            });
        }
        
        // Generate 2D data (Study Hours & Sleep Hours vs Pass/Fail)
        this.points2D = [];
        
        // Fail students (cluster in lower-left)
        for (let i = 0; i < 12; i++) {
            this.points2D.push({
                x: Math.random() * 3 + 1, // 1-4 study hours
                y: Math.random() * 3 + 1, // 1-4 sleep hours
                label: 0
            });
        }
        
        // Pass students (cluster in upper-right)
        for (let i = 0; i < 12; i++) {
            this.points2D.push({
                x: Math.random() * 3 + 6, // 6-9 study hours
                y: Math.random() * 3 + 6, // 6-9 sleep hours
                label: 1
            });
        }
        
        // Some mixed cases
        for (let i = 0; i < 6; i++) {
            const x = Math.random() * 4 + 3;
            const y = Math.random() * 4 + 3;
            this.points2D.push({
                x,
                y,
                label: (x + y) > 10 ? 1 : 0
            });
        }
        
        this.updateAccuracy();
    }
    
    setupEventListeners() {
        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setViewMode(btn.dataset.view);
            });
        });
        
        // Canvas interactions
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => {
            this.handleMouseUp();
            this.mouseX = -1;
            this.mouseY = -1;
            this.render();
        });
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        // Sliders - 1D
        document.getElementById('weight-slider')?.addEventListener('input', (e) => {
            this.weight = parseFloat(e.target.value);
            document.getElementById('weight-value').textContent = this.weight.toFixed(2);
            this.updateAccuracy();
            this.render();
        });
        
        document.getElementById('bias-slider')?.addEventListener('input', (e) => {
            this.bias = parseFloat(e.target.value);
            document.getElementById('bias-value').textContent = this.bias.toFixed(2);
            this.updateAccuracy();
            this.render();
        });
        
        // Sliders - 2D
        document.getElementById('angle-slider')?.addEventListener('input', (e) => {
            this.boundaryAngle = parseFloat(e.target.value);
            document.getElementById('angle-value').textContent = this.boundaryAngle + '°';
            this.updateAccuracy();
            this.render();
        });
        
        document.getElementById('position-slider')?.addEventListener('input', (e) => {
            this.boundaryPosition = parseFloat(e.target.value);
            document.getElementById('position-value').textContent = this.boundaryPosition + '%';
            this.updateAccuracy();
            this.render();
        });
        
        document.getElementById('threshold-slider')?.addEventListener('input', (e) => {
            this.threshold = parseFloat(e.target.value);
            document.getElementById('threshold-value').textContent = this.threshold.toFixed(2);
            this.updateAccuracy();
            this.render();
        });
        
        // Action buttons
        document.querySelector('[data-action="generate"]')?.addEventListener('click', () => {
            this.generateData();
            this.render();
        });
        
        document.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
            if (this.viewMode === '1d') {
                this.points1D = [];
            } else {
                this.points2D = [];
            }
            this.updateAccuracy();
            this.render();
        });
    }
    
    setViewMode(mode) {
        this.viewMode = mode;
        
        // Update UI
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === mode);
        });
        
        document.querySelectorAll('.narrative-step').forEach(step => {
            step.classList.toggle('active', step.dataset.view === mode);
        });
        
        document.getElementById('params-1d').style.display = mode === '1d' ? 'block' : 'none';
        document.getElementById('params-2d').style.display = mode === '2d' ? 'block' : 'none';
        document.getElementById('canvas-title').textContent = mode === '1d' ? '1D Sigmoid View' : '2D Decision Boundary';
        
        this.updateAccuracy();
        this.render();
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        
        if (this.isDragging) {
            if (this.viewMode === '1d') {
                // Drag to adjust sigmoid
                const dataX = this.toDataX(this.mouseX);
                const normalizedY = (this.canvas.height - this.padding - this.mouseY) / (this.canvas.height - 2 * this.padding);
                
                // Adjust bias based on horizontal position (where sigmoid crosses 0.5)
                this.bias = -this.weight * dataX;
                this.bias = Math.max(-10, Math.min(0, this.bias));
                
                // Update slider
                document.getElementById('bias-slider').value = this.bias;
                document.getElementById('bias-value').textContent = this.bias.toFixed(2);
            } else {
                // Drag boundary in 2D
                const dataX = this.toDataX(this.mouseX);
                const dataY = this.toDataY2D(this.mouseY);
                
                this.boundaryPosition = ((dataX + dataY) / 2) * 10;
                this.boundaryPosition = Math.max(10, Math.min(90, this.boundaryPosition));
                
                document.getElementById('position-slider').value = this.boundaryPosition;
                document.getElementById('position-value').textContent = Math.round(this.boundaryPosition) + '%';
            }
            
            this.updateAccuracy();
        }
        
        this.updateUI();
        this.render();
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if clicking near the sigmoid curve or boundary
        if (this.viewMode === '1d') {
            const dataX = this.toDataX(x);
            const prob = this.getProbability1D(dataX);
            const expectedY = this.canvas.height - this.padding - prob * (this.canvas.height - 2 * this.padding);
            
            if (Math.abs(y - expectedY) < 30) {
                this.isDragging = true;
                this.dragTarget = 'curve';
                this.canvas.style.cursor = 'grabbing';
            }
        } else {
            // Check if near boundary line
            this.isDragging = true;
            this.dragTarget = 'boundary';
            this.canvas.style.cursor = 'grabbing';
        }
    }
    
    handleMouseUp() {
        this.isDragging = false;
        this.dragTarget = null;
        this.canvas.style.cursor = 'crosshair';
    }
    
    handleClick(e) {
        if (this.isDragging) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.viewMode === '2d') {
            // Add point in 2D mode
            const dataX = this.toDataX(x);
            const dataY = this.toDataY2D(y);
            
            if (dataX >= 0 && dataX <= 10 && dataY >= 0 && dataY <= 10) {
                // Right click or shift+click for fail, otherwise pass
                const label = e.shiftKey ? 0 : 1;
                this.points2D.push({ x: dataX, y: dataY, label });
                this.updateAccuracy();
                this.render();
            }
        }
    }
    
    // Coordinate transformations
    toCanvasX(dataX) {
        return this.padding + (dataX / 10) * (this.canvas.width - 2 * this.padding);
    }
    
    toCanvasY1D(prob) {
        return this.canvas.height - this.padding - prob * (this.canvas.height - 2 * this.padding);
    }
    
    toCanvasY2D(dataY) {
        return this.canvas.height - this.padding - (dataY / 10) * (this.canvas.height - 2 * this.padding);
    }
    
    toDataX(canvasX) {
        return ((canvasX - this.padding) / (this.canvas.width - 2 * this.padding)) * 10;
    }
    
    toDataY2D(canvasY) {
        return ((this.canvas.height - this.padding - canvasY) / (this.canvas.height - 2 * this.padding)) * 10;
    }
    
    updateUI() {
        if (this.mouseX < this.padding || this.mouseX > this.canvas.width - this.padding) return;
        
        const studyHours = this.toDataX(this.mouseX);
        let prob;
        
        if (this.viewMode === '1d') {
            prob = this.getProbability1D(studyHours);
        } else {
            const sleepHours = this.toDataY2D(this.mouseY);
            prob = this.getProbability2D(studyHours, sleepHours);
        }
        
        // Update probability display
        const probPercent = (prob * 100).toFixed(0);
        document.getElementById('prob-fill').style.width = probPercent + '%';
        document.getElementById('prob-marker').style.left = probPercent + '%';
        document.getElementById('probability').textContent = probPercent + '%';
        document.getElementById('study-hours').textContent = studyHours.toFixed(1);
        
        // Update prediction
        const prediction = prob >= this.threshold ? 'PASS' : 'FAIL';
        const predictionEl = document.getElementById('prediction-text');
        predictionEl.textContent = prediction;
        predictionEl.className = 'prediction-value ' + (prediction === 'PASS' ? 'pass' : 'fail');
    }
    
    updateAccuracy() {
        let correct = 0;
        let total = 0;
        
        if (this.viewMode === '1d') {
            this.points1D.forEach(point => {
                const prob = this.getProbability1D(point.x);
                const predicted = prob >= 0.5 ? 1 : 0;
                if (predicted === point.label) correct++;
                total++;
            });
        } else {
            this.points2D.forEach(point => {
                const prob = this.getProbability2D(point.x, point.y);
                const predicted = prob >= this.threshold ? 1 : 0;
                if (predicted === point.label) correct++;
                total++;
            });
        }
        
        const accuracy = total > 0 ? (correct / total * 100) : 0;
        
        document.getElementById('accuracy-value').textContent = accuracy.toFixed(0) + '%';
        document.getElementById('accuracy-fill').style.width = accuracy + '%';
        document.getElementById('correct-count').textContent = correct;
        document.getElementById('total-count').textContent = total;
    }
    
    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.viewMode === '1d') {
            this.render1D();
        } else {
            this.render2D();
        }
    }
    
    render1D() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const p = this.padding;
        
        // Draw grid
        this.drawGrid();
        
        // Draw axes
        this.drawAxes1D();
        
        // Draw threshold line at 0.5
        const thresholdY = this.toCanvasY1D(0.5);
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(p, thresholdY);
        ctx.lineTo(w - p, thresholdY);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw sigmoid curve
        ctx.beginPath();
        for (let canvasX = p; canvasX <= w - p; canvasX += 2) {
            const dataX = this.toDataX(canvasX);
            const prob = this.getProbability1D(dataX);
            const canvasY = this.toCanvasY1D(prob);
            
            if (canvasX === p) {
                ctx.moveTo(canvasX, canvasY);
            } else {
                ctx.lineTo(canvasX, canvasY);
            }
        }
        
        // Glow effect
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
        ctx.lineWidth = 12;
        ctx.stroke();
        
        // Main curve
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Draw data points
        this.points1D.forEach(point => {
            const x = this.toCanvasX(point.x);
            const baseY = point.label === 1 ? 
                this.toCanvasY1D(0.95) : // Pass at top
                this.toCanvasY1D(0.05);  // Fail at bottom
            
            // Add some jitter
            const y = baseY + (Math.random() - 0.5) * 20;
            
            // Glow
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 20);
            const color = point.label === 1 ? '16, 185, 129' : '255, 71, 87';
            gradient.addColorStop(0, `rgba(${color}, 0.4)`);
            gradient.addColorStop(1, `rgba(${color}, 0)`);
            
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Point
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fillStyle = point.label === 1 ? '#10b981' : '#ff4757';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
        
        // Draw hover indicator
        if (this.mouseX >= p && this.mouseX <= w - p) {
            const dataX = this.toDataX(this.mouseX);
            const prob = this.getProbability1D(dataX);
            const curveY = this.toCanvasY1D(prob);
            
            // Vertical line
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(this.mouseX, h - p);
            ctx.lineTo(this.mouseX, curveY);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Point on curve
            ctx.beginPath();
            ctx.arc(this.mouseX, curveY, 8, 0, Math.PI * 2);
            ctx.fillStyle = prob >= 0.5 ? '#10b981' : '#ff4757';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Label
            ctx.fillStyle = 'white';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(`${(prob * 100).toFixed(0)}%`, this.mouseX, curveY - 15);
        }
    }
    
    render2D() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const p = this.padding;
        
        // Draw probability gradient background
        this.drawProbabilityGradient();
        
        // Draw grid
        this.drawGrid();
        
        // Draw axes
        this.drawAxes2D();
        
        // Draw decision boundary
        this.drawDecisionBoundary();
        
        // Draw data points
        this.points2D.forEach(point => {
            const x = this.toCanvasX(point.x);
            const y = this.toCanvasY2D(point.y);
            
            // Glow
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 20);
            const color = point.label === 1 ? '16, 185, 129' : '255, 71, 87';
            gradient.addColorStop(0, `rgba(${color}, 0.4)`);
            gradient.addColorStop(1, `rgba(${color}, 0)`);
            
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Point
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fillStyle = point.label === 1 ? '#10b981' : '#ff4757';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
        
        // Draw hover indicator
        if (this.mouseX >= p && this.mouseX <= w - p && this.mouseY >= p && this.mouseY <= h - p) {
            ctx.beginPath();
            ctx.arc(this.mouseX, this.mouseY, 6, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            
            const dataX = this.toDataX(this.mouseX);
            const dataY = this.toDataY2D(this.mouseY);
            const prob = this.getProbability2D(dataX, dataY);
            
            ctx.fillStyle = 'white';
            ctx.font = '12px Inter';
            ctx.textAlign = 'left';
            ctx.fillText(`P=${(prob * 100).toFixed(0)}%`, this.mouseX + 12, this.mouseY - 5);
        }
    }
    
    drawProbabilityGradient() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const p = this.padding;
        
        const imageData = ctx.createImageData(w - 2 * p, h - 2 * p);
        
        for (let y = 0; y < imageData.height; y++) {
            for (let x = 0; x < imageData.width; x++) {
                const dataX = (x / imageData.width) * 10;
                const dataY = ((imageData.height - y) / imageData.height) * 10;
                const prob = this.getProbability2D(dataX, dataY);
                
                const i = (y * imageData.width + x) * 4;
                
                // Interpolate between red and green
                if (prob >= this.threshold) {
                    // Green side
                    imageData.data[i] = 16;     // R
                    imageData.data[i + 1] = 185; // G
                    imageData.data[i + 2] = 129; // B
                    imageData.data[i + 3] = 40 + (prob - this.threshold) * 100; // A
                } else {
                    // Red side
                    imageData.data[i] = 255;    // R
                    imageData.data[i + 1] = 71;  // G
                    imageData.data[i + 2] = 87;  // B
                    imageData.data[i + 3] = 40 + (this.threshold - prob) * 100; // A
                }
            }
        }
        
        ctx.putImageData(imageData, p, p);
    }
    
    drawDecisionBoundary() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const p = this.padding;
        
        const angleRad = (this.boundaryAngle * Math.PI) / 180;
        const bx = this.toCanvasX(this.boundaryPosition / 10);
        const by = this.toCanvasY2D(this.boundaryPosition / 10);
        
        // Calculate line endpoints
        const length = Math.max(w, h) * 2;
        const dx = Math.sin(angleRad) * length;
        const dy = Math.cos(angleRad) * length;
        
        // Glow
        ctx.beginPath();
        ctx.moveTo(bx - dx, by - dy);
        ctx.lineTo(bx + dx, by + dy);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
        ctx.lineWidth = 10;
        ctx.stroke();
        
        // Main line
        ctx.beginPath();
        ctx.moveTo(bx - dx, by - dy);
        ctx.lineTo(bx + dx, by + dy);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Threshold indicator
        ctx.beginPath();
        ctx.arc(bx, by, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    drawGrid() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const p = this.padding;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 10; i++) {
            const x = p + (i / 10) * (w - 2 * p);
            const y = p + (i / 10) * (h - 2 * p);
            
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
    
    drawAxes1D() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
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
        ctx.fillText('0%', p - 10, h - p);
        ctx.fillText('50%', p - 10, this.toCanvasY1D(0.5) + 4);
        ctx.fillText('100%', p - 10, p + 4);
        
        // Axis titles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Study Hours', w / 2, h - 15);
        
        ctx.save();
        ctx.translate(20, h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('P(Pass)', 0, 0);
        ctx.restore();
    }
    
    drawAxes2D() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
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
            const y = this.toCanvasY2D(i);
            ctx.fillText(i.toString(), p - 10, y + 4);
        }
        
        // Axis titles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Study Hours', w / 2, h - 15);
        
        ctx.save();
        ctx.translate(20, h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Sleep Hours', 0, 0);
        ctx.restore();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const lab = new LogisticRegressionLab();
    window.logisticRegressionLab = lab;
});
