/* ========================================
   K-Means Clustering Lab - Step by Step
   ======================================== */

class KMeansLab {
    constructor() {
        this.canvas = document.getElementById('main-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Data points
        this.points = [];
        
        // Centroids
        this.k = 3;
        this.centroids = [];
        this.centroidHistory = []; // Ghost trails
        
        // Algorithm state
        this.iteration = 0;
        this.currentStep = 'init'; // 'init', 'assign', 'update'
        this.converged = false;
        this.autoRun = false;
        
        // Colors for clusters
        this.colors = [
            { hex: '#ff4757', rgb: '255, 71, 87', name: 'Red' },
            { hex: '#3b82f6', rgb: '59, 130, 246', name: 'Blue' },
            { hex: '#10b981', rgb: '16, 185, 129', name: 'Green' },
            { hex: '#f59e0b', rgb: '245, 158, 11', name: 'Orange' },
            { hex: '#8b5cf6', rgb: '139, 92, 246', name: 'Purple' },
            { hex: '#ec4899', rgb: '236, 72, 153', name: 'Pink' },
            { hex: '#06b6d4', rgb: '6, 182, 212', name: 'Cyan' },
            { hex: '#84cc16', rgb: '132, 204, 22', name: 'Lime' }
        ];
        
        // Canvas coordinates
        this.padding = 60;
        this.dataMin = 0;
        this.dataMax = 10;
        
        // Animation
        this.animationTime = 0;
        this.animating = false;
        
        // Dragging centroids
        this.isDragging = false;
        this.draggedCentroid = null;
        
        this.init();
    }
    
    init() {
        this.resize();
        this.setupEventListeners();
        this.updateLegend();
        this.startAnimation();
        this.updateUI();
        
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
    
    distance(p1, p2) {
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    }
    
    setupEventListeners() {
        // K parameter
        document.getElementById('k-slider')?.addEventListener('input', (e) => {
            this.k = parseInt(e.target.value);
            document.getElementById('k-value').textContent = this.k;
            this.updateLegend();
        });
        
        document.querySelector('[data-action="k-up"]')?.addEventListener('click', () => {
            if (this.k < 8) {
                this.k++;
                document.getElementById('k-slider').value = this.k;
                document.getElementById('k-value').textContent = this.k;
                this.updateLegend();
            }
        });
        
        document.querySelector('[data-action="k-down"]')?.addEventListener('click', () => {
            if (this.k > 2) {
                this.k--;
                document.getElementById('k-slider').value = this.k;
                document.getElementById('k-value').textContent = this.k;
                this.updateLegend();
            }
        });
        
        // Canvas interactions
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
        
        // Action buttons
        document.querySelector('[data-action="random-points"]')?.addEventListener('click', () => {
            this.generateRandomPoints();
        });
        
        document.querySelector('[data-action="clusters"]')?.addEventListener('click', () => {
            this.generateClusteredData();
        });
        
        document.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
            this.clear();
        });
        
        document.querySelector('[data-action="init-centroids"]')?.addEventListener('click', () => {
            this.initializeCentroids();
        });
        
        // Step buttons
        document.getElementById('step-assign')?.addEventListener('click', () => {
            if (!this.animating) this.stepAssign();
        });
        
        document.getElementById('step-update')?.addEventListener('click', () => {
            if (!this.animating) this.stepUpdate();
        });
        
        // Auto toggle
        document.getElementById('auto-toggle')?.addEventListener('click', () => {
            this.autoRun = !this.autoRun;
            document.getElementById('auto-toggle').classList.toggle('active', this.autoRun);
            if (this.autoRun && this.centroids.length > 0 && !this.converged) {
                this.runAutomatic();
            }
        });
    }
    
    generateRandomPoints() {
        this.points = [];
        this.centroids = [];
        this.centroidHistory = [];
        this.iteration = 0;
        this.converged = false;
        this.currentStep = 'init';
        
        const count = 40;
        for (let i = 0; i < count; i++) {
            this.points.push({
                x: Math.random() * 8 + 1,
                y: Math.random() * 8 + 1,
                cluster: -1
            });
        }
        
        this.updateUI();
    }
    
    generateClusteredData() {
        this.points = [];
        this.centroids = [];
        this.centroidHistory = [];
        this.iteration = 0;
        this.converged = false;
        this.currentStep = 'init';
        
        // Generate 3 natural clusters
        const clusterCenters = [
            { x: 2.5, y: 2.5 },
            { x: 7.5, y: 2.5 },
            { x: 5, y: 7.5 }
        ];
        
        clusterCenters.forEach(center => {
            for (let i = 0; i < 15; i++) {
                this.points.push({
                    x: center.x + (Math.random() - 0.5) * 3,
                    y: center.y + (Math.random() - 0.5) * 3,
                    cluster: -1
                });
            }
        });
        
        this.updateUI();
    }
    
    clear() {
        this.points = [];
        this.centroids = [];
        this.centroidHistory = [];
        this.iteration = 0;
        this.converged = false;
        this.currentStep = 'init';
        this.updateUI();
    }
    
    handleClick(e) {
        if (this.isDragging) return;
        if (this.centroids.length > 0) return; // Don't add points after centroids placed
        
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        
        const dataX = this.toDataX(canvasX);
        const dataY = this.toDataY(canvasY);
        
        if (dataX >= 0 && dataX <= 10 && dataY >= 0 && dataY <= 10) {
            this.points.push({
                x: dataX,
                y: dataY,
                cluster: -1
            });
            this.updateUI();
        }
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        
        // Check if clicking on centroid
        for (let i = 0; i < this.centroids.length; i++) {
            const c = this.centroids[i];
            const cx = this.toCanvasX(c.x);
            const cy = this.toCanvasY(c.y);
            const dist = Math.sqrt((canvasX - cx) ** 2 + (canvasY - cy) ** 2);
            
            if (dist < 20) {
                this.isDragging = true;
                this.draggedCentroid = i;
                this.canvas.style.cursor = 'grabbing';
                return;
            }
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        
        if (this.isDragging && this.draggedCentroid !== null) {
            const dataX = this.toDataX(canvasX);
            const dataY = this.toDataY(canvasY);
            
            this.centroids[this.draggedCentroid].x = Math.max(0.5, Math.min(9.5, dataX));
            this.centroids[this.draggedCentroid].y = Math.max(0.5, Math.min(9.5, dataY));
            
            // Reset convergence when manually moving
            this.converged = false;
            this.iteration = 0;
            this.centroidHistory = [];
            this.points.forEach(p => p.cluster = -1);
            this.currentStep = 'init';
            this.updateUI();
        } else {
            // Update cursor
            let isOverCentroid = false;
            for (const c of this.centroids) {
                const cx = this.toCanvasX(c.x);
                const cy = this.toCanvasY(c.y);
                const dist = Math.sqrt((canvasX - cx) ** 2 + (canvasY - cy) ** 2);
                if (dist < 20) {
                    isOverCentroid = true;
                    break;
                }
            }
            this.canvas.style.cursor = isOverCentroid ? 'grab' : 'crosshair';
        }
    }
    
    handleMouseUp() {
        this.isDragging = false;
        this.draggedCentroid = null;
        this.canvas.style.cursor = 'crosshair';
    }
    
    initializeCentroids() {
        if (this.points.length < this.k) {
            alert(`Need at least ${this.k} points to create ${this.k} clusters!`);
            return;
        }
        
        this.centroids = [];
        this.centroidHistory = [];
        this.iteration = 0;
        this.converged = false;
        this.currentStep = 'init';
        
        // Reset point assignments
        this.points.forEach(p => p.cluster = -1);
        
        // K-Means++ initialization
        // First centroid: random point
        const firstIndex = Math.floor(Math.random() * this.points.length);
        this.centroids.push({
            x: this.points[firstIndex].x,
            y: this.points[firstIndex].y
        });
        
        // Remaining centroids: weighted by distance
        while (this.centroids.length < this.k) {
            let totalDist = 0;
            const distances = this.points.map(p => {
                let minDist = Infinity;
                this.centroids.forEach(c => {
                    const d = this.distance(p, c);
                    if (d < minDist) minDist = d;
                });
                totalDist += minDist * minDist;
                return minDist * minDist;
            });
            
            // Weighted random selection
            let r = Math.random() * totalDist;
            for (let i = 0; i < distances.length; i++) {
                r -= distances[i];
                if (r <= 0) {
                    this.centroids.push({
                        x: this.points[i].x,
                        y: this.points[i].y
                    });
                    break;
                }
            }
        }
        
        this.updateUI();
    }
    
    stepAssign() {
        if (this.centroids.length === 0 || this.converged) return;
        
        this.animating = true;
        
        // Assign each point to nearest centroid
        this.points.forEach((point, i) => {
            let minDist = Infinity;
            let nearest = 0;
            
            this.centroids.forEach((c, j) => {
                const d = this.distance(point, c);
                if (d < minDist) {
                    minDist = d;
                    nearest = j;
                }
            });
            
            // Animate assignment
            gsap.to(point, {
                cluster: nearest,
                duration: 0,
                delay: i * 0.02
            });
        });
        
        this.currentStep = 'assign';
        
        setTimeout(() => {
            this.animating = false;
            this.updateUI();
            
            if (this.autoRun && !this.converged) {
                setTimeout(() => this.stepUpdate(), 500);
            }
        }, this.points.length * 20 + 300);
    }
    
    stepUpdate() {
        if (this.centroids.length === 0 || this.converged) return;
        if (this.currentStep !== 'assign') {
            // Need to assign first
            this.stepAssign();
            return;
        }
        
        this.animating = true;
        
        // Save current positions to history (ghost trails)
        this.centroidHistory.push(this.centroids.map(c => ({ x: c.x, y: c.y })));
        
        // Limit history length
        if (this.centroidHistory.length > 10) {
            this.centroidHistory.shift();
        }
        
        // Calculate new centroid positions
        const newCentroids = [];
        let totalMovement = 0;
        
        for (let i = 0; i < this.k; i++) {
            const clusterPoints = this.points.filter(p => p.cluster === i);
            
            if (clusterPoints.length > 0) {
                const newX = clusterPoints.reduce((s, p) => s + p.x, 0) / clusterPoints.length;
                const newY = clusterPoints.reduce((s, p) => s + p.y, 0) / clusterPoints.length;
                
                totalMovement += this.distance(this.centroids[i], { x: newX, y: newY });
                
                newCentroids.push({ x: newX, y: newY });
            } else {
                newCentroids.push({ x: this.centroids[i].x, y: this.centroids[i].y });
            }
        }
        
        // Animate centroid movement
        this.centroids.forEach((c, i) => {
            gsap.to(c, {
                x: newCentroids[i].x,
                y: newCentroids[i].y,
                duration: 0.5,
                ease: 'power2.out'
            });
        });
        
        this.iteration++;
        this.currentStep = 'update';
        
        // Check convergence
        if (totalMovement < 0.01) {
            this.converged = true;
        }
        
        setTimeout(() => {
            this.animating = false;
            this.updateUI();
            
            if (this.autoRun && !this.converged) {
                setTimeout(() => this.stepAssign(), 500);
            }
        }, 600);
    }
    
    runAutomatic() {
        if (!this.autoRun || this.converged || this.animating) return;
        
        if (this.currentStep === 'init' || this.currentStep === 'update') {
            this.stepAssign();
        } else {
            this.stepUpdate();
        }
    }
    
    calculateWCSS() {
        if (this.centroids.length === 0) return 0;
        
        let wcss = 0;
        this.points.forEach(p => {
            if (p.cluster >= 0 && p.cluster < this.centroids.length) {
                const c = this.centroids[p.cluster];
                wcss += (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
            }
        });
        
        return wcss;
    }
    
    updateLegend() {
        const container = document.getElementById('centroid-legend');
        container.innerHTML = Array.from({ length: this.k }, (_, i) => `
            <div class="centroid-item">
                <div class="centroid-color" style="background: ${this.colors[i].hex}"></div>
                <span>Cluster ${i + 1}</span>
            </div>
        `).join('');
    }
    
    updateUI() {
        // Update step buttons
        const assignBtn = document.getElementById('step-assign');
        const updateBtn = document.getElementById('step-update');
        
        assignBtn.disabled = this.centroids.length === 0 || this.converged;
        updateBtn.disabled = this.centroids.length === 0 || this.currentStep !== 'assign' || this.converged;
        
        assignBtn.classList.toggle('active', this.currentStep === 'assign');
        updateBtn.classList.toggle('active', this.currentStep === 'update');
        
        if (this.currentStep === 'update') {
            assignBtn.querySelector('.step-number').classList.add('completed');
        } else {
            assignBtn.querySelector('.step-number').classList.remove('completed');
        }
        
        // Update iteration
        document.getElementById('iteration-value').textContent = this.iteration;
        
        // Update convergence indicator
        const convIndicator = document.getElementById('convergence-indicator');
        const convText = document.getElementById('convergence-text');
        
        if (this.converged) {
            convIndicator.className = 'convergence-indicator converged';
            convText.textContent = 'Converged! ✓';
        } else if (this.centroids.length === 0) {
            convIndicator.className = 'convergence-indicator running';
            convText.textContent = 'Waiting to start...';
        } else {
            convIndicator.className = 'convergence-indicator running';
            convText.textContent = 'Running...';
        }
        
        // Update WCSS
        const wcss = this.calculateWCSS();
        document.getElementById('wcss-value').textContent = wcss.toFixed(2);
        
        // Update stats
        document.getElementById('total-points').textContent = this.points.length;
        const unassigned = this.points.filter(p => p.cluster === -1).length;
        document.getElementById('unassigned-count').textContent = unassigned;
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
        
        // Draw Voronoi regions (if centroids exist)
        if (this.centroids.length > 0) {
            this.drawVoronoiRegions();
        }
        
        // Draw grid
        this.drawGrid();
        
        // Draw axes
        this.drawAxes();
        
        // Draw ghost trails
        this.drawGhostTrails();
        
        // Draw points
        this.drawPoints();
        
        // Draw centroids
        this.drawCentroids();
    }
    
    drawVoronoiRegions() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const p = this.padding;
        
        const resolution = 10;
        
        for (let canvasX = p; canvasX < w - p; canvasX += resolution) {
            for (let canvasY = p; canvasY < h - p; canvasY += resolution) {
                const dataX = this.toDataX(canvasX);
                const dataY = this.toDataY(canvasY);
                
                let minDist = Infinity;
                let nearest = 0;
                
                this.centroids.forEach((c, i) => {
                    const d = this.distance({ x: dataX, y: dataY }, c);
                    if (d < minDist) {
                        minDist = d;
                        nearest = i;
                    }
                });
                
                const color = this.colors[nearest];
                ctx.fillStyle = `rgba(${color.rgb}, 0.05)`;
                ctx.fillRect(canvasX, canvasY, resolution, resolution);
            }
        }
    }
    
    drawGhostTrails() {
        const ctx = this.ctx;
        
        this.centroidHistory.forEach((positions, histIndex) => {
            const opacity = (histIndex + 1) / (this.centroidHistory.length + 1) * 0.4;
            
            positions.forEach((pos, i) => {
                const x = this.toCanvasX(pos.x);
                const y = this.toCanvasY(pos.y);
                const color = this.colors[i];
                
                // Ghost centroid
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${color.rgb}, ${opacity})`;
                ctx.fill();
                
                // X mark
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x - 4, y - 4);
                ctx.lineTo(x + 4, y + 4);
                ctx.moveTo(x + 4, y - 4);
                ctx.lineTo(x - 4, y + 4);
                ctx.stroke();
            });
            
            // Draw trail lines to next position
            if (histIndex < this.centroidHistory.length - 1) {
                const nextPositions = this.centroidHistory[histIndex + 1];
                positions.forEach((pos, i) => {
                    const x1 = this.toCanvasX(pos.x);
                    const y1 = this.toCanvasY(pos.y);
                    const x2 = this.toCanvasX(nextPositions[i].x);
                    const y2 = this.toCanvasY(nextPositions[i].y);
                    const color = this.colors[i];
                    
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.strokeStyle = `rgba(${color.rgb}, ${opacity})`;
                    ctx.lineWidth = 2;
                    ctx.setLineDash([3, 3]);
                    ctx.stroke();
                    ctx.setLineDash([]);
                });
            }
        });
        
        // Draw lines from last history to current centroids
        if (this.centroidHistory.length > 0 && this.centroids.length > 0) {
            const lastPositions = this.centroidHistory[this.centroidHistory.length - 1];
            lastPositions.forEach((pos, i) => {
                if (i < this.centroids.length) {
                    const x1 = this.toCanvasX(pos.x);
                    const y1 = this.toCanvasY(pos.y);
                    const x2 = this.toCanvasX(this.centroids[i].x);
                    const y2 = this.toCanvasY(this.centroids[i].y);
                    const color = this.colors[i];
                    
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.strokeStyle = `rgba(${color.rgb}, 0.5)`;
                    ctx.lineWidth = 2;
                    ctx.setLineDash([3, 3]);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            });
        }
    }
    
    drawPoints() {
        const ctx = this.ctx;
        
        this.points.forEach(point => {
            const x = this.toCanvasX(point.x);
            const y = this.toCanvasY(point.y);
            
            let color, rgb;
            if (point.cluster >= 0 && point.cluster < this.colors.length) {
                color = this.colors[point.cluster].hex;
                rgb = this.colors[point.cluster].rgb;
            } else {
                color = '#6b7280'; // Gray for unassigned
                rgb = '107, 114, 128';
            }
            
            // Glow
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
            gradient.addColorStop(0, `rgba(${rgb}, 0.4)`);
            gradient.addColorStop(1, `rgba(${rgb}, 0)`);
            
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Point
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
        });
    }
    
    drawCentroids() {
        const ctx = this.ctx;
        
        this.centroids.forEach((c, i) => {
            const x = this.toCanvasX(c.x);
            const y = this.toCanvasY(c.y);
            const color = this.colors[i];
            
            // Pulsing glow
            const pulse = Math.sin(this.animationTime * 3) * 0.2 + 1;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 25 * pulse);
            gradient.addColorStop(0, `rgba(${color.rgb}, 0.6)`);
            gradient.addColorStop(0.5, `rgba(${color.rgb}, 0.2)`);
            gradient.addColorStop(1, `rgba(${color.rgb}, 0)`);
            
            ctx.beginPath();
            ctx.arc(x, y, 25 * pulse, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Centroid body
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.fillStyle = color.hex;
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // X mark
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x - 5, y - 5);
            ctx.lineTo(x + 5, y + 5);
            ctx.moveTo(x + 5, y - 5);
            ctx.lineTo(x - 5, y + 5);
            ctx.stroke();
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
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const lab = new KMeansLab();
    window.kmeansLab = lab;
});
